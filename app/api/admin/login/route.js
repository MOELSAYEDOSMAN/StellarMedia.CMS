import { login, cookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { clientIp, json, readJson, sameOrigin } from '@/lib/api';
import { rateLimit, resetRateLimit } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!sameOrigin(request)) {
    return json({ ok: false, error: 'Cross-site request blocked.' }, { status: 403 });
  }

  const ip = clientIp(request);
  const limit = rateLimit(`login:${ip}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return json(
      { ok: false, error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfter / 60)} minutes.` },
      { status: 429 },
    );
  }

  const parsed = await readJson(request);
  if (!parsed.ok) return json({ ok: false, error: 'Invalid request body.' }, { status: 400 });

  const identifier = String(parsed.data.identifier || parsed.data.email || '').slice(0, 160);
  const password = String(parsed.data.password || '').slice(0, 200);

  if (!identifier || !password) {
    return json({ ok: false, error: 'Enter your email or username and password.' }, { status: 422 });
  }

  const result = await login({
    identifier,
    password,
    userAgent: request.headers.get('user-agent') || '',
  });

  if (!result.ok) {
    return json({ ok: false, error: result.error }, { status: 401 });
  }

  resetRateLimit(`login:${ip}`);
  const response = json({ ok: true, admin: result.admin });
  response.cookies.set(SESSION_COOKIE, result.token, cookieOptions());
  return response;
}
