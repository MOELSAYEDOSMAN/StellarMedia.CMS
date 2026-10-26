import { getDb, mutate, pushActivity, id } from '@/lib/store';
import { clientIp, json, readJson, sameOrigin } from '@/lib/api';
import { rateLimit } from '@/lib/rate-limit';
import { sha256 } from '@/lib/password';
import { mailStatus, sendMail, enquiryEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const cleanInline = (value, max) =>
  String(value ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, max);

export async function POST(request) {
  if (!sameOrigin(request)) {
    return json({ ok: false, error: 'Cross-site request blocked.' }, { status: 403 });
  }

  const ip = clientIp(request);
  const limit = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.ok) {
    return json(
      {
        ok: false,
        error: 'Too many messages from this connection.',
        retryAfter: Math.ceil(limit.retryAfter / 60),
      },
      { status: 429 },
    );
  }

  const parsed = await readJson(request);
  if (!parsed.ok) {
    return json({ ok: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { website } = parsed.data;
  // Honeypot: real visitors never fill this hidden field.
  if (website) return json({ ok: true, emailed: false });

  const name = cleanInline(parsed.data.name, 100);
  const email = cleanInline(parsed.data.email, 160).toLowerCase();
  const company = cleanInline(parsed.data.company, 120);
  const message = String(parsed.data.message ?? '')
    .replace(/\r\n?/g, '\n')
    .trim()
    .slice(0, 4000);

  const errors = {};
  if (name.length < 2) errors.name = 'Enter your name.';
  if (!EMAIL.test(email)) errors.email = 'Enter a valid email address.';
  if (message.length < 10) errors.message = 'Write at least 10 characters.';

  if (Object.keys(errors).length) {
    return json({ ok: false, errors, error: 'Please check the highlighted fields.' }, { status: 422 });
  }

  const db = getDb();
  const brand = db.content.brand?.name || 'Stellar Media';
  const accent = db.content.brand?.secondColor || '#75fff9';
  const notifyTo = db.content.contact?.notifyEmail || process.env.MAIL_TO || '';
  const configured = mailStatus().configured;

  const enquiry = {
    id: id(),
    name,
    email,
    company,
    message,
    status: 'new',
    source: 'Website contact form',
    createdAt: new Date().toISOString(),
    ipHash: sha256(ip).slice(0, 16),
    userAgent: String(request.headers.get('user-agent') || '').slice(0, 200),
    emailStatus: !configured || !notifyTo ? 'not-configured' : 'pending',
    emailError: null,
  };

  await mutate((database) => {
    database.messages.unshift(enquiry);
    pushActivity(database, { actor: 'visitor', action: 'sent an enquiry', target: email });
  });

  let emailed = false;
  if (configured && notifyTo) {
    const template = enquiryEmail({ enquiry, brand, accent });
    const result = await sendMail({
      to: notifyTo,
      replyTo: `${name} <${email}>`,
      subject: template.subject,
      text: template.text,
      html: template.html,
    });
    emailed = result.sent;
    await mutate((database) => {
      const stored = database.messages.find((entry) => entry.id === enquiry.id);
      if (!stored) return;
      stored.emailStatus = result.sent ? 'sent' : 'failed';
      // Keep the reason for the CMS, never surface it to the visitor.
      stored.emailError = result.sent ? null : String(result.error || '').slice(0, 200);
    });
  }

  return json({ ok: true, emailed });
}
