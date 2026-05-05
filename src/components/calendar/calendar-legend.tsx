"use client";

import { useI18n } from "@/lib/i18n/context";

interface CalendarLegendProps {
  minNights: number;
  hasOverrides: boolean;
}

export function CalendarLegend({ minNights, hasOverrides }: CalendarLegendProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-4 border-b border-[var(--line)] px-4 py-2">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm bg-[var(--m-accent)]" />
        <span className="text-xs text-[var(--ink-3)]">{t("calendar.airbnb")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm bg-[#003580]" />
        <span className="text-xs text-[var(--ink-3)]">{t("calendar.booking")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm bg-[var(--cleaning-bg)] border border-[var(--cleaning-border)]" />
        <span className="text-xs text-[var(--ink-3)]">{t("calendar.cleaning")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm bg-[var(--ink)]/15 border border-[var(--ink)]/25 border-dashed" />
        <span className="text-xs text-[var(--ink-3)]">{t("calendar.potentialCleaning")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm bg-[var(--ink-4)]/15 border border-[var(--ink-4)]/20 border-dashed" />
        <span className="text-xs text-[var(--ink-3)]">&lt;{minNights}n</span>
      </div>
      {hasOverrides && (
        <>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-sm bg-emerald-500/15 border-2 border-emerald-500/50" />
            <span className="text-xs text-[var(--ink-3)]">{t("calendar.forcedOpen")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-sm bg-rose-500/15 border-2 border-rose-500/50" />
            <span className="text-xs text-[var(--ink-3)]">{t("calendar.forcedClosed")}</span>
          </div>
        </>
      )}
    </div>
  );
}
