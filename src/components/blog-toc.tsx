"use client";

import { useEffect, useState } from "react";
import type { TocEntry } from "@/lib/markdown";
import { useI18n } from "@/lib/i18n/context";

interface Props {
  entries: TocEntry[];
}

/**
 * Sticky table-of-contents sidebar for the blog post page.
 *
 * Tracks the heading currently in the upper portion of the viewport with an
 * IntersectionObserver, then highlights the matching list item. The observer
 * fires the moment a heading crosses the top 30% line, which matches what
 * Stripe / Linear / docs.github.com use — the active item updates a beat
 * before the user reaches it, so the eye doesn't have to chase the marker.
 *
 * Hidden entirely on small screens (rendered behind a `hidden lg:block`
 * wrapper from the parent) — there's no scroll real-estate for it on mobile,
 * and the markdown body still includes natural `## H2` waypoints.
 */
export function BlogToc({ entries }: Props) {
  const { locale } = useI18n();
  const [activeId, setActiveId] = useState<string>(entries[0]?.id ?? "");

  useEffect(() => {
    if (entries.length === 0) return;
    const ids = entries.map((e) => e.id);
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    // Track each heading's vertical position relative to the viewport. We pick
    // the topmost heading whose top edge is above the 30% mark — that's the
    // section the reader is currently in. Pure rootMargin gates miss the
    // common case where two short sections fit in the same screen.
    const positions = new Map<HTMLElement, number>();

    const recompute = () => {
      let candidate: HTMLElement | null = null;
      const cutoff = window.innerHeight * 0.3;
      for (const el of elements) {
        const top = el.getBoundingClientRect().top;
        if (top <= cutoff) candidate = el;
        else break;
      }
      const next = candidate ?? elements[0];
      if (next && next.id !== activeId) setActiveId(next.id);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          positions.set(entry.target as HTMLElement, entry.intersectionRatio);
        }
        recompute();
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 0.5, 1] }
    );

    for (const el of elements) observer.observe(el);
    window.addEventListener("scroll", recompute, { passive: true });
    recompute();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", recompute);
    };
  }, [entries, activeId]);

  if (entries.length < 2) return null;

  const handleClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
    history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <nav
      aria-label={locale === "ru" ? "Содержание" : "Table of contents"}
      className="text-sm"
    >
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-4)]">
        {locale === "ru" ? "На этой странице" : "On this page"}
      </p>
      <ul className="space-y-1.5 border-l border-[var(--line)]">
        {entries.map((entry) => {
          const isActive = entry.id === activeId;
          const indent = entry.level === 3 ? "pl-6" : "pl-3";
          return (
            <li key={entry.id}>
              <a
                href={`#${entry.id}`}
                onClick={handleClick(entry.id)}
                className={`relative -ml-px block ${indent} py-1 text-[13px] leading-snug transition-colors ${
                  isActive
                    ? "border-l-2 border-[var(--m-accent)] font-medium text-[var(--ink)]"
                    : "border-l-2 border-transparent text-[var(--ink-3)] hover:text-[var(--ink)]"
                }`}
              >
                {entry.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
