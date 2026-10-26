import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb, mutate, pushActivity, id } from './store.js';
import { hashPassword, verifyPassword, randomToken, sha256 } from './password.js';

export const SESSION_COOKIE = 'sm_session';
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const MAX_SESSIONS_PER_ADMIN = 10;

export function sanitizeAdmin(admin) {
  if (!admin) return null;
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    active: Boolean(admin.active),
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
    lastLoginAt: admin.lastLoginAt || null,
    passwordChangedAt: admin.passwordChangedAt || null,
    usingSeedPassword: !admin.passwordChangedAt && admin.email === 'admin',
  };
}

export function findAdminByLogin(db, identifier) {
  const value = String(identifier || '')
    .trim()
    .toLowerCase();
  if (!value) return null;
  return (
    db.admins.find(
      (admin) =>
        String(admin.email || '').toLowerCase() === value ||
        String(admin.name || '').toLowerCase() === value,
    ) || null
  );
}

export function pruneExpiredSessions(db) {
  const now = Date.now();
  const before = db.sessions.length;
  db.sessions = db.sessions.filter((session) => session.expiresAt > now);
  return before - db.sessions.length;
}

/**
 * Verifies credentials and creates a session.
 * @returns {Promise<{ ok: true, token: string, admin: object } | { ok: false, error: string }>}
 */
export async function login({ identifier, password, userAgent }) {
  const db = getDb();
  const candidate = findAdminByLogin(db, identifier);
  // Always run a hash comparison so a missing account is not obviously faster.
  const storedHash = candidate?.passwordHash || hashPassword('incorrect-password-placeholder');
  const passwordOk = verifyPassword(password, storedHash);

  if (!candidate || !candidate.active || !passwordOk) {
    return { ok: false, error: 'Email or password is incorrect.' };
  }

  const token = randomToken();
  const now = Date.now();
  const session = {
    id: id(),
    adminId: candidate.id,
    tokenHash: sha256(token),
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    userAgent: String(userAgent || '').slice(0, 200),
  };

  await mutate((database) => {
    const admin = database.admins.find((entry) => entry.id === candidate.id);
    if (!admin) return;
    pruneExpiredSessions(database);
    database.sessions.push(session);
    const mine = database.sessions
      .filter((entry) => entry.adminId === admin.id)
      .sort((a, b) => b.createdAt - a.createdAt);
    for (const stale of mine.slice(MAX_SESSIONS_PER_ADMIN)) {
      database.sessions = database.sessions.filter((entry) => entry.id !== stale.id);
    }
    admin.lastLoginAt = new Date(now).toISOString();
    pushActivity(database, {
      actor: admin.email,
      action: 'signed in',
      target: 'CMS',
      meta: { role: admin.role },
    });
  });

  return { ok: true, token, admin: sanitizeAdmin(candidate) };
}

export async function destroySession(token) {
  if (!token) return;
  const tokenHash = sha256(token);
  await mutate((database) => {
    database.sessions = database.sessions.filter((session) => session.tokenHash !== tokenHash);
  });
}

/** Session for the current request (server components and route handlers). */
export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  return sessionFromToken(token);
}

export function sessionFromToken(token) {
  if (!token) return null;
  const tokenHash = sha256(token);
  const db = getDb();
  const session = db.sessions.find((entry) => entry.tokenHash === tokenHash);
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    // Expired sessions are cleaned up lazily; no need to block the response.
    mutate((database) => {
      database.sessions = database.sessions.filter((entry) => entry.id !== session.id);
    }).catch(() => {});
    return null;
  }

  const admin = db.admins.find((entry) => entry.id === session.adminId);
  if (!admin || !admin.active) return null;

  return {
    admin: sanitizeAdmin(admin),
    session: { id: session.id, expiresAt: session.expiresAt },
    token,
  };
}

export async function requirePageAdmin(nextPath = '/admin') {
  const session = await getSession();
  if (!session) {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session.admin;
}

export async function requirePageOwner(nextPath = '/admin') {
  const admin = await requirePageAdmin(nextPath);
  if (admin.role !== 'owner') redirect('/admin?denied=owners-only');
  return admin;
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  };
}

/** Changes the password of the signed-in administrator. */
export async function changePassword({ adminId, currentPassword, newPassword, keepSessionId }) {
  const db = getDb();
  const admin = db.admins.find((entry) => entry.id === adminId);
  if (!admin) return { ok: false, error: 'Account not found.' };
  if (!verifyPassword(currentPassword, admin.passwordHash)) {
    return { ok: false, error: 'Current password is incorrect.' };
  }
  const passwordHash = hashPassword(newPassword);
  await mutate((database) => {
    const target = database.admins.find((entry) => entry.id === adminId);
    if (!target) return;
    target.passwordHash = passwordHash;
    target.passwordChangedAt = new Date().toISOString();
    target.updatedAt = target.passwordChangedAt;
    // Sign out other devices after a password change.
    database.sessions = database.sessions.filter(
      (session) => session.adminId !== adminId || session.id === keepSessionId,
    );
    pushActivity(database, { actor: target.email, action: 'changed their password', target: 'Account' });
  });
  return { ok: true };
}

export function countOwners(db, { activeOnly = false } = {}) {
  return db.admins.filter(
    (admin) => admin.role === 'owner' && (!activeOnly || admin.active),
  ).length;
}
