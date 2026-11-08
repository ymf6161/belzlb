/** The diamond flourish from the top of the logo, with a rule either side. */
export function Ornament({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`ornament ${className}`} style={style} aria-hidden="true">
      <svg width="34" height="22" viewBox="0 0 34 22" fill="none">
        <path d="M17 1 L25 11 L17 21 L9 11 Z" stroke="currentColor" strokeWidth="1.6" />
        <path d="M17 6.5 L20.6 11 L17 15.5 L13.4 11 Z" fill="currentColor" />
        <circle cx="3" cy="11" r="1.8" fill="currentColor" />
        <circle cx="31" cy="11" r="1.8" fill="currentColor" />
      </svg>
    </div>
  );
}
