'use client';

import { useState } from 'react';

export default function Services({ services }) {
  const items = Array.isArray(services.items) ? services.items : [];
  const [open, setOpen] = useState(0);

  return (
    <section id="services" className="border-y border-line bg-panel">
      <div className="mx-auto max-w-6xl px-5 py-24 md:py-32">
        <p className="mb-4 text-xs uppercase tracking-[0.2em] text-second">{services.eyebrow}</p>
        <h2
          data-reveal
          className="mb-12 max-w-3xl font-display text-4xl font-extrabold tracking-tight md:text-6xl"
        >
          {services.heading}
        </h2>

        <div className="border-t border-line">
          {items.map((service, index) => {
            const isOpen = open === index;
            return (
              <div
                key={service.id || service.name}
                data-reveal
                style={{ '--d': `${index * 70}ms` }}
                className="border-b border-line"
              >
                <h3>
                  <button
                    type="button"
                    className="group flex w-full items-center justify-between gap-4 py-6 text-left md:py-8"
                    aria-expanded={isOpen}
                    aria-controls={`service-panel-${index}`}
                    onClick={() => setOpen(isOpen ? -1 : index)}
                  >
                    <span
                      className={`font-display text-2xl font-bold tracking-tight transition-all duration-300 group-hover:translate-x-2 group-hover:text-second md:text-4xl ${
                        isOpen ? 'text-second' : ''
                      }`}
                    >
                      {service.name}
                    </span>
                    <span
                      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line transition-all duration-300 group-hover:border-second ${
                        isOpen ? 'rotate-45 border-second bg-second text-main' : ''
                      }`}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                </h3>

                <div
                  id={`service-panel-${index}`}
                  className={`grid transition-all duration-500 ease-out ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="grid gap-6 pb-8 md:grid-cols-2">
                      <p className="text-lg text-soft">{service.summary}</p>
                      {service.points?.length ? (
                        <ul className="flex flex-wrap content-start gap-2">
                          {service.points.map((point) => (
                            <li
                              key={point}
                              className="rounded-full border border-line px-4 py-1.5 text-sm text-soft"
                            >
                              {point}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
