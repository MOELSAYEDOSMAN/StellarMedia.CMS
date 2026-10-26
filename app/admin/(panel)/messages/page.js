import Link from 'next/link';
import { requirePageAdmin } from '@/lib/auth';
import { getDb } from '@/lib/store';
import { mailStatus } from '@/lib/mailer';
import MessagesManager from '@/components/admin/MessagesManager';

export const dynamic = 'force-dynamic';

export default async function MessagesPage() {
  await requirePageAdmin('/admin/messages');
  const db = getDb();
  const mail = mailStatus();

  const counts = { all: db.messages.length, new: 0, read: 0, replied: 0, archived: 0 };
  for (const message of db.messages) {
    if (counts[message.status] !== undefined) counts[message.status] += 1;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-second">Enquiries</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Contact form inbox
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-soft">
            Every enquiry is stored here the moment it is submitted, whether or not email delivery succeeds.
          </p>
        </div>
        <Link href="/admin/settings" className="btn btn-ghost">
          Email settings
        </Link>
      </header>

      {!mail.configured ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          Email notifications are not configured yet, so enquiries are only stored here.{' '}
          <Link href="/admin/settings" className="underline underline-offset-2">
            Set up SMTP
          </Link>{' '}
          to also receive them in your inbox.
        </p>
      ) : null}

      <MessagesManager initialMessages={db.messages} initialCounts={counts} />
    </div>
  );
}
