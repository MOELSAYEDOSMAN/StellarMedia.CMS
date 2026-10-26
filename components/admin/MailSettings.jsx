'use client';

import { useState } from 'react';

export default function MailSettings({ mail, notifyEmail }) {
  const [destination, setDestination] = useState(notifyEmail || mail.to || '');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function testConnection(event) {
    event.preventDefault();
    setSending(true); setStatus('');
    try {
      const response = await fetch('/api/admin/mail-test', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: destination }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not send the test email.');
      setStatus(data.message);
    } catch (error) { setStatus(error.message); } finally { setSending(false); }
  }

  return <div className="space-y-6">
    <header>
      <p className="text-xs uppercase tracking-[0.2em] text-second">Settings</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Email delivery</h1>
      <p className="mt-2 max-w-2xl text-sm text-soft">Contact enquiries and replies are delivered through the SMTP account configured on the server.</p>
    </header>

    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl font-bold">SMTP status</h2><p className="mt-1 text-sm text-soft">{mail.host}:{mail.port} · {mail.secure ? 'SSL/TLS' : 'STARTTLS'}</p></div><span className={`badge ${mail.configured ? 'badge-accent' : 'border-amber-400/40 text-amber-100'}`}>{mail.configured ? 'Configured' : 'Not configured'}</span></div>
      <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-soft">From address</dt><dd className="mt-1 break-all">{mail.from || 'Not set'}</dd></div><div><dt className="text-soft">Default notification address</dt><dd className="mt-1 break-all">{notifyEmail || mail.to || 'Not set'}</dd></div></dl>
    </section>

    <section className="card p-5 sm:p-6"><h2 className="font-display text-xl font-bold">Configure SMTP</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-soft">Keep credentials out of the CMS and add them to <code>.env.local</code> on the server. Restart the app after changing them.</p><pre className="mt-4 overflow-x-auto rounded-xl border border-line bg-main/60 p-4 text-xs leading-6 text-soft">{`SMTP_HOST=smtp.your-provider.com\nSMTP_PORT=587\nSMTP_SECURE=false\nSMTP_USER=your-username\nSMTP_PASS=your-password\nMAIL_FROM=website@your-domain.com\nMAIL_TO=studio@your-domain.com`}</pre><p className="mt-3 text-xs text-soft">To override the notification address for this site, edit <strong>Content → Contact → Notification email (private)</strong>.</p></section>

    <form className="card p-5 sm:p-6" onSubmit={testConnection}><h2 className="font-display text-xl font-bold">Send a test email</h2><p className="mt-2 text-sm text-soft">This checks the SMTP connection and sends a real test message.</p><div className="mt-4 flex flex-wrap gap-3"><input className="field min-w-[250px] flex-1" type="email" required value={destination} onChange={(event) => setDestination(event.target.value)} placeholder="destination@example.com" /><button className="btn btn-primary" disabled={sending || !mail.configured}>{sending ? 'Sending…' : 'Send test'}</button></div>{status ? <p role="status" className={`mt-4 rounded-xl border px-4 py-3 text-sm ${status.startsWith('Test message sent') ? 'border-second/40 bg-second/10 text-second' : 'border-red-400/50 bg-red-400/10 text-red-200'}`}>{status}</p> : null}</form>
  </div>;
}
