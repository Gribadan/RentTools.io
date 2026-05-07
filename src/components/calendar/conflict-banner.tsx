"use client";

import { useI18n } from "@/lib/i18n/context";
import type { Locale } from "@/lib/i18n/translations";
import type { ConflictInfo } from "./types";

interface ConflictBannerProps {
  conflicts: ConflictInfo[];
}

const DAYS_LABEL: Record<Locale, (n: number) => string> = {
  en: (n) => (n === 1 ? "day" : "days"),
  ru: () => "дн.",
  de: (n) => (n === 1 ? "Tag" : "Tage"),
  fr: (n) => (n === 1 ? "jour" : "jours"),
  es: (n) => (n === 1 ? "día" : "días"),
};

export function ConflictBanner({ conflicts }: ConflictBannerProps) {
  const { t, locale } = useI18n();
  if (conflicts.length === 0) return null;
  const conflictDateCount = new Set(conflicts.map(c => c.date)).size;
  const uniqueDates = Array.from(new Set(conflicts.map(c => c.date)));

  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <svg className="h-5 w-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <span className="text-sm font-semibold text-rose-500">
          {t("calendar.doubleBooking")} ({conflictDateCount} {DAYS_LABEL[locale](conflictDateCount)})
        </span>
      </div>
      <p className="text-xs text-rose-500/80">{t("calendar.overlapWarning")}</p>
      <div className="space-y-1">
        {uniqueDates.slice(0, 5).map(d => (
          <p key={d} className="text-xs text-[var(--ink-2)]">
            <span className="text-rose-500 font-medium">{d}</span>
            {" — "}{t("calendar.airbnbBookingOverlap")}
          </p>
        ))}
        {conflictDateCount > 5 && (
          <p className="text-xs text-[var(--ink-4)]">...{t("calendar.andMore", { n: conflictDateCount - 5 })}</p>
        )}
      </div>
    </div>
  );
}
