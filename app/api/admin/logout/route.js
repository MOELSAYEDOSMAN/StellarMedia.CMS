import { destroySession, cookieOptions, SESSION_COOKIE } from '@/lib/auth';
import { json, sameOrigin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  if (!sameOrigin(request)) {
    return json({ ok: false, error: 'Cross-site request blocked.' }, { status: 403 });
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value || null;
  await destroySession(token);

  const response = json({ ok: true });
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions(), maxAge: 0 });
  return response;
}
