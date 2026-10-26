import { getDb, mutate, pushActivity, id, ADMIN_ROLES } from './store.js';
import { hashPassword, passwordProblem } from './password.js';
import { sanitizeAdmin, findAdminByLogin, countOwners } from './auth.js';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME = /^[a-z0-9][a-z0-9._-]{2,39}$/;
const ROLE_VALUES = ADMIN_ROLES.map((role) => role.value);

export function listAdmins() {
  const db = getDb();
  return db.admins
    .map(sanitizeAdmin)
    .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === 'owner' ? -1 : 1));
}

export function validateIdentity({ name, email, role }, { requirePassword = false, password } = {}) {
  const errors = {};
  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '')
    .trim()
    .toLowerCase();

  if (cleanName.length < 2) errors.name = 'Enter a name of at least 2 characters.';
  if (cleanName.length > 60) errors.name = 'Keep the name under 60 characters.';

  if (!EMAIL.test(cleanEmail) && !USERNAME.test(cleanEmail)) {
    errors.email = 'Use an email address or a username (3–40 characters: a–z, 0–9, dot, dash, underscore).';
  }

  if (!ROLE_VALUES.includes(role)) errors.role = 'Choose a valid role.';

  if (requirePassword) {
    const problem = passwordProblem(password);
    if (problem) errors.password = problem;
  } else if (password) {
    const problem = passwordProblem(password);
    if (problem) errors.password = problem;
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { name: cleanName, email: cleanEmail, role },
  };
}

export async function createAdmin({ name, email, role, password, actor }) {
  const { ok, errors, value } = validateIdentity({ name, email, role }, { requirePassword: true, password });
  if (!ok) return { ok: false, errors };

  const db = getDb();
  if (findAdminByLogin(db, value.email)) {
    return { ok: false, errors: { email: 'That email or username is already in use.' } };
  }

  const timestamp = new Date().toISOString();
  const admin = {
    id: id(),
    name: value.name,
    email: value.email,
    role: value.role,
    active: true,
    passwordHash: hashPassword(password),
    passwordChangedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLoginAt: null,
  };

  await mutate((database) => {
    database.admins.push(admin);
    pushActivity(database, {
      actor,
      action: 'added administrator',
      target: value.email,
      meta: { role: value.role },
    });
  });

  return { ok: true, admin: sanitizeAdmin(admin) };
}

export async function updateAdmin(targetId, { name, email, role, active, password, actor }) {
  const db = getDb();
  const existing = db.admins.find((admin) => admin.id === targetId);
  if (!existing) return { ok: false, error: 'Administrator not found.' };

  const { ok, errors, value } = validateIdentity({ name, email, role }, { password });
  if (!ok) return { ok: false, errors };

  const duplicate = findAdminByLogin(db, value.email);
  if (duplicate && duplicate.id !== targetId) {
    return { ok: false, errors: { email: 'That email or username is already in use.' } };
  }

  const nextActive = active !== undefined ? Boolean(active) : existing.active;

  // Guard rails: never lock yourself (or the last owner) out.
  if (existing.role === 'owner' && (value.role !== 'owner' || !nextActive)) {
    if (countOwners(db, { activeOnly: true }) <= 1) {
      return { ok: false, error: 'Keep at least one active owner account.' };
    }
  }

  const passwordHash = password ? hashPassword(password) : null;

  await mutate((database) => {
    const admin = database.admins.find((entry) => entry.id === targetId);
    if (!admin) return;
    admin.name = value.name;
    admin.email = value.email;
    admin.role = value.role;
    admin.active = nextActive;
    admin.updatedAt = new Date().toISOString();
    if (passwordHash) {
      admin.passwordHash = passwordHash;
      admin.passwordChangedAt = admin.updatedAt;
      database.sessions = database.sessions.filter((session) => session.adminId !== targetId);
    }
    if (!nextActive) {
      database.sessions = database.sessions.filter((session) => session.adminId !== targetId);
    }
    pushActivity(database, {
      actor,
      action: passwordHash ? 'reset administrator password' : 'updated administrator',
      target: value.email,
      meta: { role: value.role, active: nextActive },
    });
  });

  return { ok: true, admin: sanitizeAdmin({ ...existing, ...value, active: nextActive }) };
}

export async function deleteAdmin(targetId, { actor, currentAdminId }) {
  const db = getDb();
  const existing = db.admins.find((admin) => admin.id === targetId);
  if (!existing) return { ok: false, error: 'Administrator not found.' };
  if (targetId === currentAdminId) {
    return { ok: false, error: 'You cannot delete the account you are signed in with.' };
  }
  if (existing.role === 'owner' && countOwners(db, { activeOnly: true }) <= 1) {
    return { ok: false, error: 'Keep at least one active owner account.' };
  }

  await mutate((database) => {
    database.admins = database.admins.filter((admin) => admin.id !== targetId);
    database.sessions = database.sessions.filter((session) => session.adminId !== targetId);
    pushActivity(database, {
      actor,
      action: 'removed administrator',
      target: existing.email,
    });
  });

  return { ok: true };
}
