import nodemailer from 'nodemailer';

/**
 * Outbound email.
 *
 * The site uses SMTPBox (https://smtpbox.dev) as the default SMTP service, so
 * credentials live in .env.local and never reach the browser:
 *
 *   SMTP_HOST=smtp.smtpbox.dev
 *   SMTP_PORT=587            (STARTTLS; 465 for implicit TLS)
 *   SMTP_USER=sb_xxxxxxxx    (per-inbox SMTP username from SMTPBox)
 *   SMTP_PASS=••••••••
 *   MAIL_FROM=website@your-domain.test
 *   MAIL_TO=studio@your-domain.test
 *   SMTPBOX_API_KEY=sbx_api_••••   (optional, used by the CMS "connection" check)
 *
 * Any SMTP provider works by changing these values — the code does not depend
 * on SMTPBox specifics.
 */

const env = process.env;
const API_BASE = 'https://api.smtpbox.dev/v1';

export function smtpConfig() {
  const port = Number(env.SMTP_PORT || 587);
  return {
    host: env.SMTP_HOST || 'smtp.smtpbox.dev',
    port,
    secure: env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465,
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || '',
    to: env.MAIL_TO || '',
  };
}

/** Safe to show in the CMS: no username, password or API key. */
export function mailStatus() {
  const config = smtpConfig();
  return {
    host: config.host,
    port: config.port,
    secure: config.secure,
    configured: Boolean(config.user && config.pass && config.from),
    from: config.from || null,
    to: config.to || null,
    apiKeyPresent: Boolean(env.SMTPBOX_API_KEY),
  };
}

function transportKey(config) {
  return `${config.host}:${config.port}:${config.secure}:${config.user}`;
}

function getTransport() {
  const config = smtpConfig();
  const cache = (globalThis.__stellarMailer ??= { key: null, transport: null });
  if (cache.transport && cache.key === transportKey(config)) return cache.transport;

  cache.key = transportKey(config);
  cache.transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    requireTLS: !config.secure,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  return cache.transport;
}

/**
 * Sends one message. Never throws: the caller decides what to do with a failure.
 * @returns {Promise<{ sent: boolean, error?: string }>}
 */
export async function sendMail({ to, subject, text, html, replyTo, from }) {
  const config = smtpConfig();
  if (!config.user || !config.pass || !config.from) {
    return { sent: false, error: 'Email is not configured (set SMTP_USER, SMTP_PASS and MAIL_FROM).' };
  }
  try {
    await getTransport().sendMail({
      from: from || config.from,
      to: to || config.to,
      subject,
      text,
      html,
      replyTo: replyTo || undefined,
    });
    return { sent: true };
  } catch (error) {
    console.error('[mailer] send failed:', error.message);
    return { sent: false, error: error.message };
  }
}

export async function verifySmtp() {
  const config = smtpConfig();
  if (!config.user || !config.pass) {
    return { ok: false, error: 'SMTP credentials are not configured.' };
  }
  try {
    await getTransport().verify();
    return { ok: true, host: config.host, port: config.port };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/** Uses the SMTPBox REST API (Bearer key) to prove the account is reachable. */
export async function listSmtpboxInboxes() {
  const key = env.SMTPBOX_API_KEY;
  if (!key) {
    return { ok: false, error: 'SMTPBOX_API_KEY is not set.' };
  }
  try {
    const response = await fetch(`${API_BASE}/inboxes`, {
      headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
      cache: 'no-store',
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false) {
      return {
        ok: false,
        error: payload?.error?.message || payload?.error || `SMTPBox responded ${response.status}.`,
      };
    }
    const inboxes = Array.isArray(payload?.data) ? payload.data : [];
    return {
      ok: true,
      inboxes: inboxes.map((inbox) => ({
        id: inbox.id || inbox.uid || '',
        name: inbox.name || inbox.label || inbox.address || 'Inbox',
        address: inbox.address || inbox.email || '',
      })),
    };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Branded notification for a new website enquiry. */
export function enquiryEmail({ enquiry, brand, accent = '#75fff9' }) {
  const name = escapeHtml(enquiry.name);
  const email = escapeHtml(enquiry.email);
  const company = enquiry.company ? escapeHtml(enquiry.company) : '—';
  const message = escapeHtml(enquiry.message).replace(/\n/g, '<br />');
  const subject = `New enquiry from ${enquiry.name}`;

  const text = [
    `New enquiry via the ${brand} website`,
    '',
    `Name:    ${enquiry.name}`,
    `Email:   ${enquiry.email}`,
    `Company: ${enquiry.company || '—'}`,
    '',
    enquiry.message,
    '',
    `Received: ${new Date(enquiry.createdAt).toUTCString()}`,
  ].join('\n');

  const html = `<!doctype html>
<html><body style="margin:0;background:#150f14;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#f3eef2">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#1e161c;border:1px solid #33282f;border-radius:16px;overflow:hidden">
    <tr><td style="padding:24px 28px;border-bottom:3px solid ${accent}">
      <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${accent}">${escapeHtml(brand)}</p>
      <h1 style="margin:8px 0 0;font-size:22px;line-height:1.25">New website enquiry</h1>
    </td></tr>
    <tr><td style="padding:24px 28px">
      <p style="margin:0 0 6px;color:#b9aeb6;font-size:13px">From</p>
      <p style="margin:0 0 18px;font-size:16px"><strong>${name}</strong> &lt;${email}&gt;</p>
      <p style="margin:0 0 6px;color:#b9aeb6;font-size:13px">Company</p>
      <p style="margin:0 0 18px;font-size:16px">${company}</p>
      <p style="margin:0 0 6px;color:#b9aeb6;font-size:13px">Project details</p>
      <p style="margin:0;font-size:15px;line-height:1.7">${message}</p>
    </td></tr>
    <tr><td style="padding:16px 28px;border-top:1px solid #33282f;color:#b9aeb6;font-size:12px">
      Reply directly to this email to answer ${name}. Sent from the CMS contact form.
    </td></tr>
  </table>
</body></html>`;

  return { subject, text, html };
}
