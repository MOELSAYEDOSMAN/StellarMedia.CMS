'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import StarMark from '@/components/site/StarMark';

const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true, icon: 'grid' },
  { href: '/admin/content', label: 'Content', icon: 'file' },
  { href: '/admin/messages', label: 'Enquiries', icon: 'mail', badge: 'new' },
  { href: '/admin/admins', label: 'Administrators', icon: 'users', ownerOnly: true },
  { href: '/admin/settings', label: 'Settings', icon: 'settings' },
 
];

function Icon({ name, className = 'h-4 w-4' }) {
  const paths = {
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    file: 'M6 2h8l4 4v16H6zM14 2v5h5M9 12h6M9 16h6',
    mail: 'M3 5h18v14H3zM3 6l9 7 9-7',
    users: 'M16 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 9.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M21 20v-2a4 4 0 0 0-3-3.87',
    settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z',
    key: 'M15 7a4 4 0 1 0-3.6 5.75L4 20v1h4v-3h3v-3h2.4A4 4 0 0 0 15 7z',
  };
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.file} />
    </svg>
  );
}

export default function AdminShell({ admin, newMessages = 0, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
    } finally {
      router.replace('/admin/login');
      router.refresh();
    }
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="CMS sections">
      {NAV.filter((item) => !item.ownerOnly || admin.role === 'owner').map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item) ? 'page' : undefined}
          className="admin-link"
          onClick={() => setOpen(false)}
        >
          <Icon name={item.icon} />
          <span className="flex-1">{item.label}</span>
          {item.badge === 'new' && newMessages > 0 ? (
            <span className="rounded-full bg-second px-2 py-0.5 text-[11px] font-bold text-main">
              {newMessages}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-panel transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Sidebar"
      >
        <div className="flex h-16 items-center gap-2 border-b border-line px-5">
          <StarMark className="h-5 w-5 text-second" />
          <div className="leading-tight">
            <p className="font-display text-sm font-extrabold">Stellar Media</p>
            <p className="text-[11px] uppercase tracking-wider text-soft">Content studio</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
          {nav}
          <div className="mt-auto rounded-xl border border-line p-3">
            <p className="truncate text-sm font-semibold">{admin.name}</p>
            <p className="truncate text-xs text-soft">{admin.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`badge ${admin.role === 'owner' ? 'badge-accent' : ''}`}>{admin.role}</span>
              <button
                type="button"
                onClick={signOut}
                disabled={signingOut}
                className="ml-auto text-xs text-soft underline decoration-line underline-offset-4 hover:text-second disabled:opacity-60"
              >
                {signingOut ? 'Signing out…' : 'Sign out'}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-main/90 backdrop-blur">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-line lg:hidden"
              aria-label="Open menu"
            >
              <span className="relative block h-3 w-4">
                <span className="absolute left-0 top-0 h-0.5 w-full bg-ink" />
                <span className="absolute left-0 top-1.5 h-0.5 w-full bg-ink" />
                <span className="absolute left-0 top-3 h-0.5 w-full bg-ink" />
              </span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="text-sm text-soft transition-colors hover:text-second"
            >
              View site ↗
            </Link>

            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm text-soft sm:block">
                Signed in as <span className="text-ink">{admin.name}</span>
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-second font-display text-sm font-bold text-main">
                {admin.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
