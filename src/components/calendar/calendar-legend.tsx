"use client";

import { useI18n } from "@/lib/i18n/context";

interface CalendarLegendProps {
  minNights: number;
  hasOverrides: boolean;
}

export function CalendarLegend({ minNights, hasOverrides }: CalendarLegendProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-4 border-b border-[#27272b] px-4 py-2">
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm bg-[#ff385c]" />
        <span className="text-xs text-[#a0a0a8]">{t("calendar.airbnb")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm bg-[#003580]" />
        <span className="text-xs text-[#a0a0a8]">{t("calendar.booking")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm bg-[#fbbf24]/30 border border-[#fbbf24]/40" />
        <span className="text-xs text-[#a0a0a8]">{t("calendar.cleaning")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm bg-[#e8e8ec]/15 border border-[#e8e8ec]/25 border-dashed" />
        <span className="text-xs text-[#a0a0a8]">{t("calendar.potentialCleaning")}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="h-2.5 w-6 rounded-sm bg-[#71717a]/15 border border-[#71717a]/20 border-dashed" />
        <span className="text-xs text-[#a0a0a8]">&lt;{minNights}n</span>
      </div>
      {hasOverrides && (
        <>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-sm bg-[#34d399]/15 border-2 border-[#34d399]/50" />
            <span className="text-xs text-[#a0a0a8]">{t("calendar.forcedOpen")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-6 rounded-sm bg-[#ef4444]/15 border-2 border-[#ef4444]/50" />
            <span className="text-xs text-[#a0a0a8]">{t("calendar.forcedClosed")}</span>
          </div>
        </>
      )}
    </div>
  );
}
