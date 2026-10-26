'use client';

import { useRef } from 'react';

function Art({ art, image }) {
  if (art === 'image' && image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    );
  }

  if (art === 'bars') {
    return (
      <div className="absolute inset-x-8 bottom-0 flex h-[70%] items-end gap-3">
        {[40, 75, 55, 95, 65].map((height) => (
          <div
            key={height}
            className="flex-1 origin-bottom rounded-t-xl bg-second transition-transform duration-700 group-hover:scale-y-[1.12]"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
    );
  }

  if (art === 'blob') {
    return (
      <>
        <div className="absolute -right-10 -top-10 h-64 w-64 rotate-12 rounded-[40%] bg-second transition-transform duration-[1200ms] group-hover:rotate-45" />
        <div className="absolute bottom-8 left-8 h-24 w-24 rounded-full border-2 border-ink/80 transition-transform duration-700 group-hover:translate-x-4" />
      </>
    );
  }

  return (
    <>
      <div className="absolute inset-8 rounded-full border border-second/40 transition-transform duration-[1200ms] group-hover:rotate-90" />
      <div className="absolute inset-20 rounded-full border border-second/70 transition-transform duration-[1200ms] group-hover:-rotate-90" />
      <div className="absolute left-1/2 top-1/2 -ml-8 -mt-8 h-16 w-16 rounded-full bg-second transition-transform duration-700 group-hover:scale-150" />
    </>
  );
}

function ProjectCard({ project, index }) {
  const cardRef = useRef(null);

  const onMove = (event) => {
    const card = cardRef.current;
    if (!card) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-4px)`;
  };

  const onLeave = () => {
    if (cardRef.current) cardRef.current.style.transform = '';
  };

  const Tag = project.link ? 'a' : 'article';
  const linkProps = project.link
    ? { href: project.link, target: '_blank', rel: 'noopener noreferrer' }
    : {};

  return (
    <Tag
      ref={cardRef}
      {...linkProps}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      data-reveal
      style={{ '--d': `${index * 110}ms` }}
      className="group block overflow-hidden rounded-3xl border border-line bg-panel transition-[border-color,transform] duration-300 hover:border-second"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Art art={project.art} image={project.image} />
        <span className="absolute left-4 top-4 rounded-full border border-line bg-main/80 px-3 py-1 text-xs backdrop-blur">
          Concept project
        </span>
      </div>
      <div className="p-6">
        <h3 className="mb-2 font-display text-2xl font-bold">{project.title}</h3>
        <p className="text-soft">{project.blurb}</p>
        {project.tags?.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <li key={tag} className="rounded-full border border-line px-3 py-1 text-xs text-soft">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Tag>
  );
}

export default function Work({ work }) {
  const projects = Array.isArray(work.items) ? work.items : [];

  return (
    <section id="work" className="mx-auto max-w-6xl px-5 py-24 md:py-32">
      <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-second">{work.eyebrow}</p>
          <h2 data-reveal className="max-w-2xl font-display text-4xl font-extrabold tracking-tight md:text-6xl">
            {work.heading}
          </h2>
        </div>
        {work.note ? (
          <p data-reveal className="max-w-sm text-soft">
            {work.note}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {projects.map((project, index) => (
          <ProjectCard key={project.id || project.title} project={project} index={index} />
        ))}
      </div>
    </section>
  );
}
