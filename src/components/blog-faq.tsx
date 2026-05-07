"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import { renderInlineSafe } from "@/lib/markdown";

interface CopyShape {
  heading: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: { heading: "Frequently asked questions" },
  ru: { heading: "Частые вопросы" },
  de: { heading: "Häufige Fragen" },
};

/**
 * Render the FAQ section as a native <details>/<summary> accordion.
 *
 * Native accordion semantics matter: Google's FAQPage rich result requires
 * the answers to be present in the rendered HTML at request time (not
 * lazy-loaded behind JS), and `<details>` ships exactly that — content is
 * in the DOM, just collapsed. Pairs with the FAQPage JSON-LD emitted on
 * the post page so all three references (visible UI, accessibility tree,
 * structured data) stay aligned.
 *
 * Client-only because the open/closed state is interactive — server can't
 * know which item the reader has clicked.
 */
interface Props {
  items: { q: string; a: string }[];
}

const FAQ_HEADING_ID = "faq";

export function BlogFaq({ items }: Props) {
  const { locale } = useI18n();
  const t = COPY[locale];
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby={FAQ_HEADING_ID}
      className="mt-14 border-t border-[var(--line)] pt-10"
    >
      <h2
        id={FAQ_HEADING_ID}
        className="scroll-mt-24 text-2xl font-bold tracking-tight text-[var(--ink)] sm:text-[1.75rem]"
      >
        {t.heading}
      </h2>
      <ul className="mt-6 space-y-3">
        {items.map((item, idx) => (
          <li key={idx}>
            <details
              className="group rounded-xl border border-[var(--line)] bg-[var(--bg-2)]/40 transition-colors open:border-[var(--line-2)] open:bg-[var(--bg-2)]/70"
              {...(idx === 0 ? { open: true } : {})}
            >
              <summary className="flex cursor-pointer items-start justify-between gap-4 p-5 text-[15px] font-semibold leading-snug text-[var(--ink)] marker:hidden [&::-webkit-details-marker]:hidden">
                <span dangerouslySetInnerHTML={{ __html: renderInlineSafe(item.q) }} />
                <span
                  aria-hidden
                  className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--bg)] text-sm text-[var(--ink-3)] transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="border-t border-[var(--line)] px-5 pb-5 pt-4 text-[14.5px] leading-relaxed text-[var(--ink-2)]">
                {item.a.split(/\n{2,}/).map((para, i) => (
                  <p
                    key={i}
                    className={i > 0 ? "mt-3" : ""}
                    dangerouslySetInnerHTML={{ __html: renderInlineSafe(para) }}
                  />
                ))}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
