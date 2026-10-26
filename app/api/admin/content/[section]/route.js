import { mutate, pushActivity, getDb } from '@/lib/store';
import { apiError, json, readJson, requireAdmin, sameOrigin } from '@/lib/api';
import { getSection, validateSection, firstError } from '@/lib/sections';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const { section: sectionId } = await params;
  if (!getSection(sectionId)) return apiError('Unknown section.', 404);

  const content = getDb().content;
  return json({ ok: true, section: sectionId, value: content[sectionId] ?? null });
}

export async function PUT(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;
  if (!sameOrigin(request)) return apiError('Cross-site request blocked.', 403);

  const { section: sectionId } = await params;
  if (!getSection(sectionId)) return apiError('Unknown section.', 404);

  const parsed = await readJson(request);
  if (!parsed.ok) return apiError('Invalid request body.');

  const result = validateSection(sectionId, parsed.data);
  if (!result.ok) {
    return json({ ok: false, errors: result.errors, error: firstError(result.errors) }, { status: 422 });
  }

  await mutate((database) => {
    database.content[sectionId] = result.value;
    pushActivity(database, {
      actor: auth.admin.email,
      action: 'updated section',
      target: getSection(sectionId).label,
    });
  });

  return json({ ok: true, section: sectionId, value: result.value });
}
