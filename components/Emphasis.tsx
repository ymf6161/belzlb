import { Fragment } from "react";

/** Splits "plain *emphasised* plain" into segments. */
export function parseEmphasis(text: string) {
  return text.split(/(\*[^*]+\*)/g).filter(Boolean).map((part) =>
    part.startsWith("*") && part.endsWith("*")
      ? { text: part.slice(1, -1), em: true }
      : { text: part, em: false },
  );
}

/** Renders *asterisked* words in the italic serif. */
export function Emphasis({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((s, i) =>
        s.em ? (
          <span key={i} className="serif">{s.text}</span>
        ) : (
          <Fragment key={i}>{s.text}</Fragment>
        ),
      )}
    </>
  );
}

/** Same, but each word rises in one after another. */
export function AnimatedWords({ text }: { text: string }) {
  let n = 0;
  return (
    <>
      {parseEmphasis(text).map((seg, si) =>
        seg.text.split(/(\s+)/).map((word, wi) => {
          if (!word) return null;
          if (/^\s+$/.test(word)) return <Fragment key={`${si}-${wi}`}> </Fragment>;
          const delay = 0.05 + n++ * 0.1;
          return (
            <span
              key={`${si}-${wi}`}
              className={seg.em ? "w serif" : "w"}
              style={{ animationDelay: `${delay}s` }}
            >
              {word}
            </span>
          );
        }),
      )}
    </>
  );
}
