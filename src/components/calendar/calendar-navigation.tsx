"use client";

import { useI18n } from "@/lib/i18n/context";

interface CalendarNavigationProps {
  monthLabel: string;
  monthOffset: number;
  loading: boolean;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function CalendarNavigation({
  monthLabel,
  monthOffset,
  loading,
  onPrev,
  onNext,
  onToday,
}: CalendarNavigationProps) {
  const { t } = useI18n();
  return (
    <div className="flex items-center justify-between border-b border-[#27272b] px-4 py-3">
      <button onClick={onPrev} className="rounded-md p-1.5 text-[#a0a0a8] hover:bg-[#1e1e22] hover:text-[#e8e8ec]">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <div className="flex items-center gap-3">
        <h2 className="text-sm font-semibold text-[#e8e8ec]">{monthLabel}</h2>
        {loading && (
          <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[#30363d] border-t-[#58a6ff]" />
        )}
        {monthOffset !== 0 && (
          <button onClick={onToday} className="rounded px-2 py-0.5 text-xs text-[#e8e8ec] hover:bg-[#e8e8ec]/10">
            {t("calendar.today")}
          </button>
        )}
      </div>
      <button onClick={onNext} className="rounded-md p-1.5 text-[#a0a0a8] hover:bg-[#1e1e22] hover:text-[#e8e8ec]">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
