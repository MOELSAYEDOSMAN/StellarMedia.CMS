export default function StarMark({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16 2l3.4 10.6L30 16l-10.6 3.4L16 30l-3.4-10.6L2 16l10.6-3.4z" />
    </svg>
  );
}
