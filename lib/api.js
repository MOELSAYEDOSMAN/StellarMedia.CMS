import { NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionFromToken } from './auth.js';

export function json(data, init = {}) {
  const response = NextResponse.json(data, init);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function apiError(message, status = 400, extra = {}) {
  return json({ ok: false, error: message, ...extra }, { status });
}

/** Resolves the signed-in administrator from the session cookie. */
export function requireAdmin(request, { ownerOnly = false } = {}) {
  const token = request.cookies.get(SESSION_COOKIE)?.value || null;
  const session = sessionFromToken(token);
  if (!session) {
    return { response: apiError('Your session has expired. Sign in again.', 401) };
  }
  if (ownerOnly && session.admin.role !== 'owner') {
    return { response: apiError('Only owners can manage administrators.', 403) };
  }
  return { admin: session.admin, token, session: session.session };
}

/**
 * CSRF defence in depth: browsers always send Origin on cross-site POSTs, so a
 * mismatched host is rejected. Requests without Origin (curl, tests) still need
 * a valid session cookie, which is HttpOnly + SameSite=Lax.
 */
export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get('host');
  } catch {
    return false;
  }
}

export async function readJson(request) {
  try {
    const data = await request.json();
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false };
    return { ok: true, data };
  } catch {
    return { ok: false };
  }
}

export function clientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'local';
}

export function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}
