import Link from 'next/link';
import { requirePageAdmin } from '@/lib/auth';
import { getDb } from '@/lib/store';
import { SECTIONS } from '@/lib/sections';
import { formatDateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

const STATUS_STYLE = {
  new: 'badge-accent',
  read: '',
  replied: 'border-emerald-400/40 text-emerald-200',
  archived: 'opacity-60',
};

export default async function DashboardPage({ searchParams }) {
  const admin = await requirePageAdmin();
  const params = await searchParams;
  const db = getDb();

  const newCount = db.messages.filter((message) => message.status === 'new').length;
  const repliedCount = db.messages.filter((message) => message.status === 'replied').length;
  const recent = db.messages.slice(0, 4);
  const activity = db.activity.slice(0, 6);

  const stats = [
    { label: 'New enquiries', value: newCount, accent: true },
    { label: 'Total enquiries', value: db.messages.length },
    { label: 'Administrators', value: db.admins.length },
    { label: 'Content revision', value: db.revision },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-second">Dashboard</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Welcome back, {admin.name.split(' ')[0]}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-soft">
            Everything on the public site is edited here: sections, enquiries and administrators.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/content" className="btn btn-primary">
            Edit content
          </Link>
          <Link href="/" target="_blank" className="btn btn-ghost">
            View site ↗
          </Link>
        </div>
      </header>

      {params?.denied === 'owners-only' ? (
        <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          Only owner accounts can manage administrators.
        </p>
      ) : null}

      {admin.usingSeedPassword ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          <p className="flex-1">
            You are still signed in with the seeded <code>admin / admin</code> password. Change it before
            sharing this site.
          </p>
          <Link href="/admin/account" className="btn btn-ghost !border-amber-300/40 !py-1.5 !text-amber-100">
            Change password
          </Link>
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Overview">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`card p-5 ${stat.accent ? 'border-second/40 bg-second/5' : ''}`}
          >
            <p className="text-xs uppercase tracking-wider text-soft">{stat.label}</p>
            <p className={`mt-2 font-display text-4xl font-extrabold ${stat.accent ? 'text-second' : ''}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card p-5" aria-labelledby="recent-enquiries">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="recent-enquiries" className="font-display text-lg font-bold">
              Recent enquiries
            </h2>
            <Link href="/admin/messages" className="text-sm text-soft hover:text-second">
              All enquiries →
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-soft">
              No enquiries yet. Messages from the contact form appear here instantly.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((message) => (
                <li key={message.id} className="py-3 first:pt-0 last:pb-0">
                  <Link href="/admin/messages" className="group block">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold group-hover:text-second">{message.name}</p>
                      <span className={`badge ${STATUS_STYLE[message.status] || ''}`}>{message.status}</span>
                      <span className="ml-auto text-xs text-soft">{formatDateTime(message.createdAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-soft">{message.message}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-5" aria-labelledby="activity">
          <h2 id="activity" className="mb-4 font-display text-lg font-bold">
            Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-soft">Nothing logged yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((entry) => (
                <li key={entry.id} className="text-sm">
                  <p>
                    <span className="font-semibold">{entry.actor}</span> {entry.action}{' '}
                    <span className="text-second">{entry.target}</span>
                  </p>
                  <p className="text-xs text-soft">{formatDateTime(entry.at)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="sections">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="sections" className="font-display text-lg font-bold">
            All sections
          </h2>
          <p className="text-sm text-soft">
            {repliedCount} {repliedCount === 1 ? 'reply' : 'replies'} marked
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SECTIONS.map((section) => (
            <Link
              key={section.id}
              href={`/admin/content/${section.id}`}
              className="card group p-4 transition-colors hover:border-second"
            >
              <p className="text-xs uppercase tracking-wider text-soft">{section.group}</p>
              <p className="mt-1 font-display font-bold group-hover:text-second">{section.label}</p>
              <p className="mt-1 line-clamp-2 text-xs text-soft">{section.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
