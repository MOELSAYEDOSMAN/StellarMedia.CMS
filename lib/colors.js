/** Small colour helpers shared by the site and the CMS. */

const HEX = /^#[0-9a-f]{6}$/i;

export function isHex(value) {
  return typeof value === 'string' && HEX.test(value);
}

export function normalizeHex(value, fallback = '#150f14') {
  return isHex(value) ? value.toLowerCase() : fallback;
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }) {
  const part = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function mixHex(from, to, amount = 0.5) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

export function triplet(hex) {
  const { r, g, b } = hexToRgb(hex);
  return `${r} ${g} ${b}`;
}

/** CSS custom properties consumed by tailwind.config.js. */
export function themeVars(theme = {}) {
  const main = normalizeHex(theme.mainColor, '#150f14');
  const second = normalizeHex(theme.secondColor, '#75fff9');
  return {
    '--c-main': triplet(main),
    '--c-second': triplet(second),
    '--c-ink': triplet(mixHex(main, '#ffffff', 0.92)),
    '--c-soft': triplet(mixHex(main, '#ffffff', 0.7)),
    '--c-panel': triplet(mixHex(main, '#ffffff', 0.05)),
    '--c-line': triplet(mixHex(main, '#ffffff', 0.13)),
  };
}
