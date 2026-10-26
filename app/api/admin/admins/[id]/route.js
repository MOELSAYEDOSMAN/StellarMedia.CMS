import { updateAdmin, deleteAdmin } from '@/lib/admins';
import { apiError, json, readJson, requireAdmin, sameOrigin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const auth = requireAdmin(request, { ownerOnly: true });
  if (auth.response) return auth.response;
  if (!sameOrigin(request)) return apiError('Cross-site request blocked.', 403);

  const { id } = await params;
  const parsed = await readJson(request);
  if (!parsed.ok) return apiError('Invalid request body.');

  const result = await updateAdmin(id, {
    name: parsed.data.name,
    email: parsed.data.email,
    role: parsed.data.role,
    active: parsed.data.active,
    password: parsed.data.password || undefined,
    actor: auth.admin.email,
  });

  if (!result.ok) {
    return json({ ok: false, errors: result.errors, error: result.error || 'Check the form.' }, { status: 422 });
  }
  return json({ ok: true, admin: result.admin });
}

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request, { ownerOnly: true });
  if (auth.response) return auth.response;
  if (!sameOrigin(request)) return apiError('Cross-site request blocked.', 403);

  const { id } = await params;
  const result = await deleteAdmin(id, { actor: auth.admin.email, currentAdminId: auth.admin.id });
  if (!result.ok) return apiError(result.error, 422);
  return json({ ok: true });
}
