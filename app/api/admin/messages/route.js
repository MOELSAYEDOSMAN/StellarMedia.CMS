import { getDb } from '@/lib/store';
import { json, requireAdmin } from '@/lib/api';

export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'read', 'replied', 'archived'];

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  const query = (url.searchParams.get('q') || '').trim().toLowerCase();

  const db = getDb();
  const counts = { all: db.messages.length, new: 0, read: 0, replied: 0, archived: 0 };
  for (const message of db.messages) {
    if (counts[message.status] !== undefined) counts[message.status] += 1;
  }

  const messages = db.messages.filter((message) => {
    if (status !== 'all' && message.status !== status) return false;
    if (!query) return true;
    return [message.name, message.email, message.company, message.message]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return json({ ok: true, messages, counts, statuses: STATUSES });
}
