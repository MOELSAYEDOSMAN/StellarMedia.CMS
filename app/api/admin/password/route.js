import { changePassword } from '@/lib/auth';
import { passwordProblem } from '@/lib/password';
import { apiError, json, readJson, requireAdmin, sameOrigin } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;
  if (!sameOrigin(request)) return apiError('Cross-site request blocked.', 403);

  const parsed = await readJson(request);
  if (!parsed.ok) return apiError('Invalid request body.');

  const currentPassword = String(parsed.data.currentPassword || '');
  const newPassword = String(parsed.data.newPassword || '');
  const confirmPassword = String(parsed.data.confirmPassword || newPassword);

  if (newPassword !== confirmPassword) {
    return json({ ok: false, errors: { confirmPassword: 'The passwords do not match.' } }, { status: 422 });
  }
  const problem = passwordProblem(newPassword);
  if (problem) {
    return json({ ok: false, errors: { newPassword: problem } }, { status: 422 });
  }

  const result = await changePassword({
    adminId: auth.admin.id,
    currentPassword,
    newPassword,
    keepSessionId: auth.session?.id,
  });

  if (!result.ok) return json({ ok: false, errors: { currentPassword: result.error } }, { status: 422 });
  return json({ ok: true, message: 'Password updated. Other devices were signed out.' });
}
