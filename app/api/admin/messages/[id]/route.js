import { getDb, mutate, pushActivity } from '@/lib/store';
import { apiError, json, readJson, requireAdmin, sameOrigin } from '@/lib/api';
import { escapeHtml, mailStatus, sendMail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

const STATUSES = ['new', 'read', 'replied', 'archived'];

export async function PATCH(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;
  if (!sameOrigin(request)) return apiError('Cross-site request blocked.', 403);

  const { id } = await params;
  const parsed = await readJson(request);
  if (!parsed.ok) return apiError('Invalid request body.');

  const status = String(parsed.data.status || '');
  if (!STATUSES.includes(status)) return apiError('Unknown message status.', 422);

  let found = false;
  await mutate((database) => {
    const message = database.messages.find((entry) => entry.id === id);
    if (!message) return;
    message.status = status;
    message.updatedAt = new Date().toISOString();
    if (status !== 'new' && !message.readAt) message.readAt = message.updatedAt;
    found = true;
    pushActivity(database, {
      actor: auth.admin.email,
      action: `marked enquiry ${status}`,
      target: message.email,
    });
  });

  if (!found) return apiError('Message not found.', 404);
  return json({ ok: true, status });
}

export async function DELETE(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;
  if (!sameOrigin(request)) return apiError('Cross-site request blocked.', 403);

  const { id } = await params;

  let removed = null;
  await mutate((database) => {
    const message = database.messages.find((entry) => entry.id === id);
    if (!message) return;
    removed = { email: message.email };
    database.messages = database.messages.filter((entry) => entry.id !== id);
    pushActivity(database, {
      actor: auth.admin.email,
      action: 'deleted enquiry',
      target: message.email,
    });
  });

  if (!removed) return apiError('Message not found.', 404);
  return json({ ok: true });
}

/** Send an email reply to the person who submitted an enquiry. */
export async function POST(request, { params }) {
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;
  if (!sameOrigin(request)) return apiError('Cross-site request blocked.', 403);

  const parsed = await readJson(request);
  if (!parsed.ok) return apiError('Invalid request body.');

  const body = String(parsed.data.body || '').replace(/\r\n?/g, '\n').trim().slice(0, 5000);
  if (body.length < 2) return apiError('Write a reply before sending.', 422);

  const { id } = await params;
  const message = getDb().messages.find((entry) => entry.id === id);
  if (!message) return apiError('Message not found.', 404);

  const mail = mailStatus();
  if (!mail.configured) {
    return apiError('SMTP is not configured. Add the SMTP values in .env.local, then restart the server.', 422);
  }

  const subject = `Re: your enquiry to ${message.name || 'Stellar Media'}`;
  const htmlBody = escapeHtml(body).replace(/\n/g, '<br />');
  const result = await sendMail({
    to: message.email,
    subject,
    text: body,
    html: `<p>${htmlBody}</p>`,
    replyTo: mail.to || undefined,
  });

  if (!result.sent) return apiError(result.error || 'The reply could not be sent.', 502);

  const repliedAt = new Date().toISOString();
  let updated = null;
  await mutate((database) => {
    const target = database.messages.find((entry) => entry.id === id);
    if (!target) return;
    target.status = 'replied';
    target.updatedAt = repliedAt;
    target.readAt ||= repliedAt;
    target.replies ||= [];
    target.replies.unshift({ body, sentAt: repliedAt, sentBy: auth.admin.email });
    updated = target;
    pushActivity(database, {
      actor: auth.admin.email,
      action: 'replied to enquiry',
      target: target.email,
    });
  });

  return json({ ok: true, message: updated });
}
