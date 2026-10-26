import { json, requireAdmin } from '@/lib/api';
import { listSmtpboxInboxes, mailStatus } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;

  const status = mailStatus();
  const url = new URL(request.url);

  if (url.searchParams.get('smtpbox') === '1') {
    const result = await listSmtpboxInboxes();
    return json({ ok: true, mail: status, smtpbox: result });
  }

  return json({ ok: true, mail: status });
}
