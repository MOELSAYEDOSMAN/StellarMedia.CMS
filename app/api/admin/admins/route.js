import { createAdmin, listAdmins } from '@/lib/admins';
import { apiError, json, readJson, requireAdmin, sameOrigin } from '@/lib/api';
import { ADMIN_ROLES } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = requireAdmin(request, { ownerOnly: true });
  if (auth.response) return auth.response;
  return json({ ok: true, admins: listAdmins(), roles: ADMIN_ROLES });
}

export async function POST(request) {
  const auth = requireAdmin(request, { ownerOnly: true });
  if (auth.response) return auth.response;
  if (!sameOrigin(request)) return apiError('Cross-site request blocked.', 403);

  const parsed = await readJson(request);
  if (!parsed.ok) return apiError('Invalid request body.');

  const result = await createAdmin({
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    password: parsed.data.password,
    actor: auth.admin.email,
  });

  if (!result.ok) {
    return json({ ok: false, errors: result.errors, error: result.error || 'Check the form.' }, { status: 422 });
  }
  return json({ ok: true, admin: result.admin });
}
