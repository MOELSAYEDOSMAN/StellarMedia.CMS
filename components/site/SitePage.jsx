'use client';

import { Fragment, useEffect, useState } from 'react';
import Cursor from './Cursor';
import SiteHeader from './SiteHeader';
import Hero from './Hero';
import About from './About';
import Services from './Services';
import Work from './Work';
import ContactSection from './ContactSection';
import SiteFooter from './SiteFooter';

export default function SitePage({ content }) {
  const { brand, nav, hero, about, services, work, contact, footer } = content;
  const [progress, setProgress] = useState(0);

  // Scroll progress bar.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // One IntersectionObserver for every [data-reveal] element on the page.
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll('[data-reveal]'));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      elements.forEach((element) => element.classList.add('is-in'));
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const blocks = [
    {
      id: 'about',
      order: Number(about.order) || 1,
      visible: about.visible !== false,
      node: <About about={about} key="about" />,
    },
    {
      id: 'services',
      order: Number(services.order) || 2,
      visible: services.visible !== false && services.items?.length > 0,
      node: <Services services={services} key="services" />,
    },
    {
      id: 'work',
      order: Number(work.order) || 3,
      visible: work.visible !== false && work.items?.length > 0,
      node: <Work work={work} key="work" />,
    },
    {
      id: 'contact',
      order: Number(contact.order) || 4,
      visible: contact.visible !== false,
      node: <ContactSection contact={contact} brand={brand} key="contact" />,
    },
  ]
    .filter((block) => block.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <>
      <noscript>
        <style>{'[data-reveal]{opacity:1 !important;transform:none !important}'}</style>
      </noscript>

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[10000] focus:rounded-lg focus:bg-second focus:px-4 focus:py-2 focus:text-main"
      >
        Skip to content
      </a>

      <div className="fixed inset-x-0 top-0 z-[9998] h-[3px] bg-transparent" aria-hidden="true">
        <div
          className="h-full origin-left bg-second transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <Cursor />
      <SiteHeader brand={brand} nav={nav} links={nav.links} />

      <main id="main">
        <Hero hero={hero} />
        {blocks.map((block) => (
          <Fragment key={block.id}>{block.node}</Fragment>
        ))}
      </main>

      <SiteFooter brand={brand} footer={footer} nav={nav} services={services} />
    </>
  );
}
