/* eslint-disable @next/next/no-img-element */

/** A rounded image frame that zooms gently on hover.
 *  Shows a shimmering placeholder until an image is uploaded in the admin panel. */
export function Media({
  src,
  alt,
  label,
  className = "",
  style,
  priority = false,
}: {
  src: string;
  alt: string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
}) {
  return (
    <div className={`media ${className}`} style={style}>
      {src ? (
        <div className="inner">
          <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" />
        </div>
      ) : (
        <div className="inner ph" aria-hidden="true">
          <span className="chip">{label}</span>
        </div>
      )}
    </div>
  );
}
