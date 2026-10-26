'use client';

import { useCallback, useRef } from 'react';

/**
 * Buttons and links drift slightly toward the pointer.
 * Disabled for touch devices and for people who ask for reduced motion.
 */
export default function Magnetic({ as: Tag = 'a', className = '', children, ...rest }) {
  const ref = useRef(null);

  const onMove = useCallback((event) => {
    const element = ref.current;
    if (!element) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left - rect.width / 2) * 0.22;
    const y = (event.clientY - rect.top - rect.height / 2) * 0.3;
    element.style.transform = `translate(${x}px, ${y}px)`;
  }, []);

  const onLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = '';
  }, []);

  return (
    <Tag
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`will-change-transform transition-[transform,background-color,color,border-color] duration-200 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}
