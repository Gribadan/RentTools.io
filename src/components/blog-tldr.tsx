import { renderInlineSafe } from "@/lib/markdown";

/**
 * Render the TL;DR callout that sits between the post hero and the body.
 *
 * Accepts the structured field stored on BlogPost.tldr — markdown bullets
 * (`- foo` per line) become a styled list, plain prose stays a single
 * paragraph. Inline markdown (**bold**, *italic*, `code`, [link](url))
 * is honoured via renderInlineSafe so the TLDR matches the body's
 * formatting capabilities. Escapes first so untrusted content (a future
 * authoring surface, malformed seed) can't smuggle script tags.
 *
 * This block is the single most-read element on the page after the
 * title, and it doubles as the "summary" Google may surface in AI
 * Overviews / featured snippets, so we render it semantically as <ul>
 * (or <p>) inside an <aside role="doc-tip"> with a clear heading.
 */
interface Props {
  tldr: string;
}

export function BlogTldr({ tldr }: Props) {
  const trimmed = tldr.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/\n+/);
  const looksLikeBullets = lines.every((l) => /^\s*[-*]\s+/.test(l));

  return (
    <aside
      role="doc-tip"
      aria-labelledby="tldr-heading"
      className="my-8 rounded-2xl border border-[var(--m-accent)]/30 bg-gradient-to-br from-[color-mix(in_oklab,var(--m-accent)_8%,var(--bg-2))] to-[var(--bg-2)] p-6 sm:p-7"
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex h-7 items-center justify-center rounded-full bg-[var(--m-accent)] px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white"
        >
          TL;DR
        </span>
        <h2 id="tldr-heading" className="sr-only">
          Summary
        </h2>
      </div>
      {looksLikeBullets ? (
        <ul className="space-y-2 text-[15px] leading-relaxed text-[var(--ink-2)]">
          {lines.map((l, i) => (
            <li key={i} className="flex gap-3">
              <span
                aria-hidden
                className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--m-accent)]"
              />
              <span
                dangerouslySetInnerHTML={{
                  __html: renderInlineSafe(l.replace(/^\s*[-*]\s+/, "")),
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p
          className="text-[15px] leading-relaxed text-[var(--ink-2)]"
          dangerouslySetInnerHTML={{ __html: renderInlineSafe(trimmed) }}
        />
      )}
    </aside>
  );
}
