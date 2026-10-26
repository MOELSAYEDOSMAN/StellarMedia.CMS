'use client';

import { useEffect, useState } from 'react';
import StarMark from './StarMark';

function LinkBody({ link, className, children, ...rest }) {
  const external = !link.target.startsWith('#') && !link.target.startsWith('/');
  return (
    <a
      href={link.target}
      className={className}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}

export default function SiteHeader({ brand, nav, links = [] }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    const ids = links
      .map((link) => (link.target.startsWith('#') ? link.target.slice(1) : null))
      .filter(Boolean);
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(`#${entry.target.id}`);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [links]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? 'border-b border-line bg-main/90 backdrop-blur' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <a
          href="#top"
          className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight"
          aria-label={`${brand.name}, home`}
        >
          {brand.logoImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logoImage} alt="" className="h-7 w-auto" loading="lazy" />
          ) : (
            <StarMark className="h-6 w-6 animate-float text-second" />
          )}
          <span>{brand.name}</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm md:flex" aria-label="Primary">
          {links.map((link) => (
            <LinkBody
              key={`${link.label}-${link.target}`}
              link={link}
              className={`relative py-1 transition-colors ${
                active === link.target ? 'text-second' : 'text-soft hover:text-ink'
              }`}
              aria-current={active === link.target ? 'true' : undefined}
            >
              {link.label}
              <span
                className={`absolute -bottom-0.5 left-0 h-px bg-second transition-all duration-300 ${
                  active === link.target ? 'w-full' : 'w-0'
                }`}
              />
            </LinkBody>
          ))}
          {nav.ctaLabel ? (
            <a
              href={nav.ctaTarget}
              className="rounded-full bg-second px-5 py-2 font-semibold text-main transition-colors hover:bg-ink"
            >
              {nav.ctaLabel}
            </a>
          ) : null}
        </nav>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg border border-line md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
        >
          <span className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 h-0.5 w-full bg-ink transition-all duration-300 ${
                open ? 'top-1.5 rotate-45' : 'top-0'
              }`}
            />
            <span
              className={`absolute left-0 top-1.5 h-0.5 w-full bg-ink transition-opacity duration-200 ${
                open ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute left-0 h-0.5 w-full bg-ink transition-all duration-300 ${
                open ? 'top-1.5 -rotate-45' : 'top-3'
              }`}
            />
          </span>
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="flex animate-fadeUp flex-col gap-1 bg-main px-5 pb-6 pt-2 md:hidden"
          aria-label="Mobile"
        >
          {links.map((link) => (
            <LinkBody
              key={`m-${link.label}-${link.target}`}
              link={link}
              className="border-b border-line py-3 font-display text-2xl font-bold"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </LinkBody>
          ))}
          {nav.ctaLabel ? (
            <a
              href={nav.ctaTarget}
              onClick={() => setOpen(false)}
              className="mt-4 rounded-full bg-second px-5 py-3 text-center font-semibold text-main"
            >
              {nav.ctaLabel}
            </a>
          ) : null}
        </nav>
      ) : null}
    </header>
  );
}
