import { getDb } from '@/lib/store';
import { apiError, requireAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** Download the whole content document as JSON (a simple, portable backup). */
export async function GET(request) {
  const auth = requireAdmin(request, { ownerOnly: true });
  if (auth.response) return auth.response;

  const db = getDb();
  const payload = {
    exportedAt: new Date().toISOString(),
    exportedBy: auth.admin.email,
    schemaVersion: db.schemaVersion,
    revision: db.revision,
    content: db.content,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="stellar-media-content-${stamp}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}
