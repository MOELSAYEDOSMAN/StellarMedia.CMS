import { apiError, isEmail, json, readJson, requireAdmin, sameOrigin } from '@/lib/api';
import { mailStatus, sendMail, verifySmtp } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

/** Sends a test message through the configured SMTP provider. */
export async function POST(request) {
  const auth = requireAdmin(request);
  if (auth.response) return auth.response;
  if (!sameOrigin(request)) return apiError('Cross-site request blocked.', 403);

  const status = mailStatus();
  if (!status.configured) {
    return json(
      {
        ok: false,
        error: 'SMTP is not configured yet. Add SMTP_USER, SMTP_PASS and MAIL_FROM to .env.local, then restart the server.',
      },
      { status: 422 },
    );
  }

  const parsed = await readJson(request);
  const to = String(parsed.data?.to || status.to || '').trim();
  if (!isEmail(to)) {
    return json({ ok: false, error: 'Enter a valid destination email address.' }, { status: 422 });
  }

  const verified = await verifySmtp();
  if (!verified.ok) {
    return json({ ok: false, error: `SMTP connection failed: ${verified.error}` }, { status: 502 });
  }

  const result = await sendMail({
    to,
    subject: 'Stellar Media CMS — SMTP test',
    text: `This is a test message sent from the Stellar Media CMS at ${new Date().toISOString()}.\n\nIf you can read this, SMTP is configured correctly.`,
    html: `<p>This is a test message sent from the Stellar Media CMS.</p><p style="color:#666">${new Date().toISOString()}</p>`,
  });

  if (!result.sent) {
    return json({ ok: false, error: result.error || 'The message could not be sent.' }, { status: 502 });
  }

  return json({ ok: true, message: `Test message sent to ${to}.` });
}
