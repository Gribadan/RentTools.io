"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { Property } from "@/lib/types";

interface CopyShape {
  property: string;
  all: string;
}

const COPY: Record<Locale, CopyShape> = {
  en: { property: "Property", all: "All" },
  ru: { property: "Объект", all: "Все" },
  de: { property: "Unterkunft", all: "Alle" },
};

interface PropertySwitcherProps {
  properties: Property[];
  /** id of the currently-scoped property; null = portfolio-wide. */
  selectedPropertyId: number | null;
  /** view to navigate to when a property pill is clicked. Keeps the
   *  user on the same surface (cleaning / reports / calendar / sync)
   *  as they switch scope. */
  view: "calendar" | "cleaning" | "reports" | "sync";
  /** Pass false for views that don't support a portfolio aggregate
   *  (calendar, sync). The "All properties" pill is hidden in that
   *  case since it would deep-link to a non-existent state. */
  showAllOption?: boolean;
  /** Optional eyebrow above the pill row. Defaults to "Property" /
   *  "Объект". Pass null to hide. */
  label?: string | null;
}

/**
 * Compact pill-list scope switcher used in the sidebars of cleaning,
 * reports, sync settings and calendar. Mirrors the top-bar property
 * dropdown so users who can't see the dropdown (small viewport, focus
 * pulled into the page) still have a one-click way to switch between
 * properties or jump to the portfolio-wide aggregate.
 */
export function PropertySwitcher({
  properties,
  selectedPropertyId,
  view,
  showAllOption = true,
  label,
}: PropertySwitcherProps) {
  const { locale } = useI18n();
  const t = COPY[locale];
  const eyebrow = label === null ? null : (label ?? t.property);

  if (properties.length === 0) return null;

  const pillBase =
    "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium transition-colors";
  const pillActive =
    "bg-[var(--m-accent)] text-white";
  const pillIdle =
    "bg-[var(--bg-2)] text-[var(--ink-2)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]";

  return (
    <div className="space-y-1.5">
      {eyebrow && (
        <div className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
          {eyebrow}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {showAllOption && (
          <Link
            href={`/dashboard?view=${view}`}
            className={`${pillBase} ${selectedPropertyId === null ? pillActive : pillIdle}`}
          >
            {t.all}
          </Link>
        )}
        {properties.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard?property=${p.id}&view=${view}`}
            className={`${pillBase} max-w-[180px] truncate ${selectedPropertyId === p.id ? pillActive : pillIdle}`}
            title={p.name}
          >
            {p.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
