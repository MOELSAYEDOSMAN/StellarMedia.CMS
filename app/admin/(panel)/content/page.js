import Link from 'next/link';
import { requirePageAdmin } from '@/lib/auth';
import { getContent } from '@/lib/content';
import { SECTIONS } from '@/lib/sections';

export const dynamic = 'force-dynamic';

const GROUPS = ['Content', 'Site'];

function previewValue(section, content) {
  const value = content[section.id] || {};
  if (section.id === 'hero') return Array.isArray(value.headline) ? value.headline.join(' ') : '';
  if (section.id === 'brand') return value.tagline || value.name || '';
  if (section.id === 'nav') return `${value.links?.length || 0} links · ${value.ctaLabel || 'no button'}`;
  if (section.id === 'about') return value.heading || '';
  if (section.id === 'services') return `${value.items?.length || 0} services`;
  if (section.id === 'work') return `${value.items?.length || 0} projects`;
  if (section.id === 'contact') return value.email || value.studio || '';
  if (section.id === 'footer') return value.blurb || '';
  return '';
}

export default async function ContentIndexPage() {
  await requirePageAdmin('/admin/content');
  const content = getContent();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-[0.2em] text-second">Content</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          Every section of the site
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-soft">
          Pick a section to edit it. Saving publishes immediately; the public page is rendered from this
          content.
        </p>
      </header>

      {GROUPS.map((group) => {
        const sections = SECTIONS.filter((section) => section.group === group);
        if (!sections.length) return null;

        return (
          <section key={group} aria-labelledby={`group-${group}`}>
            <h2 id={`group-${group}`} className="mb-3 text-sm font-semibold uppercase tracking-wider text-soft">
              {group}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {sections.map((section) => {
                const value = content[section.id] || {};
                const hidden = value.visible === false;
                return (
                  <Link
                    key={section.id}
                    href={`/admin/content/${section.id}`}
                    className="card group flex flex-col p-5 transition-colors hover:border-second"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-bold group-hover:text-second">
                        {section.label}
                      </h3>
                      {['about', 'services', 'work', 'contact'].includes(section.id) && hidden ? (
                        <span className="badge">Hidden</span>
                      ) : (
                        <span className="text-soft transition-transform group-hover:translate-x-1" aria-hidden="true">
                          →
                        </span>
                      )}
                    </div>
                    <p className="mt-2 flex-1 text-sm text-soft">{section.summary}</p>
                    <p className="mt-3 line-clamp-1 border-t border-line pt-3 text-xs text-soft/80">
                      {previewValue(section, content) || 'Empty'}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
