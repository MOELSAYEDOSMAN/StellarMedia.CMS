/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Brand colours are CSS variables so the CMS can change them live.
        main: 'rgb(var(--c-main) / <alpha-value>)',
        second: 'rgb(var(--c-second) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        soft: 'rgb(var(--c-soft) / <alpha-value>)',
        panel: 'rgb(var(--c-panel) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['"Instrument Sans"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      keyframes: {
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        float: {
          '0%,100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-14px) rotate(4deg)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(.8)', opacity: '.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        rise: { '0%': { transform: 'translateY(110%)' }, '100%': { transform: 'translateY(0)' } },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        float: 'float 7s ease-in-out infinite',
        pulseRing: 'pulseRing 2.6s ease-out infinite',
        rise: 'rise .9s cubic-bezier(.2,.8,.2,1) both',
        fadeUp: 'fadeUp .35s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
};
