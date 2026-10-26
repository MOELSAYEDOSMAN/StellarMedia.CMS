'use client';

import { useRef } from 'react';
import Magnetic from './Magnetic';

export default function Hero({ hero }) {
  const titleRef = useRef(null);
  const spotRef = useRef(null);

  const lines = Array.isArray(hero.headline) ? hero.headline.filter(Boolean) : [];
  const marquee = Array.isArray(hero.marquee) ? hero.marquee.filter(Boolean) : [];

  const onMove = (event) => {
    const title = titleRef.current;
    const spot = spotRef.current;
    if (!title || !spot) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const rect = title.getBoundingClientRect();
    spot.style.setProperty('--x', `${event.clientX - rect.left}px`);
    spot.style.setProperty('--y', `${event.clientY - rect.top}px`);
    const inside = event.clientY >= rect.top - 40 && event.clientY <= rect.bottom + 40;
    spot.style.setProperty('--r', inside ? '150px' : '0px');
  };

  const onLeave = () => {
    spotRef.current?.style.setProperty('--r', '0px');
  };

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-10 pt-24"
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <div
        className="absolute -right-24 -top-24 h-[28rem] w-[28rem] animate-float rounded-full bg-second/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute -left-20 bottom-10 h-72 w-72 rounded-full border border-second/20"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-6xl px-5">
        {hero.eyebrow ? (
          <p className="mb-6 flex max-w-md items-center gap-3 text-soft">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inset-0 animate-pulseRing rounded-full bg-second" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-second" />
            </span>
            {hero.eyebrow}
          </p>
        ) : null}

        <h1
          ref={titleRef}
          className="relative font-display text-[clamp(3rem,10.5vw,9rem)] font-extrabold leading-[.92] tracking-tighter"
        >
          {lines.map((line, index) => (
            <span key={`${line}-${index}`} className="block overflow-hidden">
              <span
                className="block animate-rise"
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                {line}
              </span>
            </span>
          ))}

          {lines.length ? (
            <span
              ref={spotRef}
              className="spot absolute inset-0 bg-second text-main"
              aria-hidden="true"
            >
              {lines.map((line, index) => (
                <span key={`spot-${line}-${index}`} className="block">
                  {line}
                </span>
              ))}
            </span>
          ) : null}
        </h1>

        <div className="mt-10 grid items-end gap-8 md:grid-cols-[1.2fr_1fr]">
          <p className="max-w-xl text-lg text-soft md:text-xl">{hero.sub}</p>
          <div className="flex flex-wrap gap-3 md:justify-end">
            {hero.primaryLabel ? (
              <Magnetic
                href={hero.primaryTarget || '#contact'}
                className="rounded-full bg-second px-7 py-3.5 font-semibold text-main hover:bg-ink"
              >
                {hero.primaryLabel}
              </Magnetic>
            ) : null}
            {hero.secondaryLabel ? (
              <Magnetic
                href={hero.secondaryTarget || '#work'}
                className="rounded-full border border-line px-7 py-3.5 font-semibold hover:border-second hover:text-second"
              >
                {hero.secondaryLabel}
              </Magnetic>
            ) : null}
          </div>
        </div>
      </div>

      {marquee.length ? (
        <div className="relative mt-14 overflow-hidden border-y border-line py-4" aria-hidden="true">
          <div className="flex w-max animate-marquee font-display text-2xl font-bold text-soft/60 md:text-3xl">
            {[0, 1].map((copy) => (
              <div className="flex" key={copy}>
                {marquee.map((item) => (
                  <span className="flex items-center" key={`${copy}-${item}`}>
                    <span className="whitespace-nowrap px-6">{item}</span>
                    <span className="text-second">&#10022;</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
