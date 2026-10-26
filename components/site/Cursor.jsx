'use client';

import { useEffect, useRef, useState } from 'react';

/** Two-part cursor used on pointer-fine devices. */
export default function Cursor() {
  const dot = useRef(null);
  const ring = useRef(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!fine.matches || reduce.matches) return undefined;

    setEnabled(true);
    document.documentElement.classList.add('has-cursor');

    const mouse = { x: -100, y: -100, rx: -100, ry: -100 };
    let frame = 0;

    const onMove = (event) => {
      mouse.x = event.clientX;
      mouse.y = event.clientY;
      if (ring.current) {
        const interactive = event.target.closest?.('a, button, input, textarea, select, [data-hover]');
        ring.current.classList.toggle('is-hover', Boolean(interactive));
      }
    };

    const tick = () => {
      mouse.rx += (mouse.x - mouse.rx) * 0.18;
      mouse.ry += (mouse.y - mouse.ry) * 0.18;
      if (dot.current) dot.current.style.transform = `translate(${mouse.x}px, ${mouse.y}px)`;
      if (ring.current) ring.current.style.transform = `translate(${mouse.rx}px, ${mouse.ry}px)`;
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('mousemove', onMove);
      document.documentElement.classList.remove('has-cursor');
      setEnabled(false);
    };
  }, []);

  if (!enabled) return null;

  return (
    <>
      <div ref={ring} className="cursor-ring" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}
