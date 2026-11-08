"use client";

import { useEffect, useState } from "react";
import type { Testimonial } from "@/lib/content";

export function Testimonials({ items }: { items: Testimonial[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const t = setInterval(() => setI((v) => (v + 1) % count), 7000);
    return () => clearInterval(t);
  }, [count, paused]);

  if (!count) return null;
  const q = items[i % count];
  const pos = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className="quote-block rv"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="quote-side">
        <span className="eyebrow" style={{ margin: 0 }}>
          In their words · {pos((i % count) + 1)} / {pos(count)}
        </span>
        {count > 1 && (
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="round" aria-label="Previous quote" onClick={() => setI((v) => (v - 1 + count) % count)}>←</button>
            <button type="button" className="round dark" aria-label="Next quote" onClick={() => setI((v) => (v + 1) % count)}>→</button>
          </div>
        )}
      </div>
      <figure className="quote-main" aria-live="polite">
        <div key={q.id} className="fade">
          <blockquote className="serif">“{q.quote}”</blockquote>
          <figcaption>
            {q.name} {q.role && <span>· {q.role}</span>}
          </figcaption>
        </div>
        {count > 1 && (
          <div className="dots" aria-hidden="true">
            {items.map((t, n) => (
              <span key={t.id} className={n === i % count ? "on" : ""} />
            ))}
          </div>
        )}
      </figure>
    </div>
  );
}
