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
  const onCurrentMonth = monthOffset === 0;
  return (
    <div className="flex items-center gap-4 border-b border-[var(--line)] px-4 py-3">
      {/* Left cluster — outlined "Today" pill lives next to the prev/next
          arrows so the navigation feels like one group, the way Google /
          Outlook calendars do it. Always visible, dimmed when already on
          the current month so the user still sees the affordance but knows
          the action would be a no-op. */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToday}
          disabled={onCurrentMonth}
          className={`rounded-full border px-3.5 py-1 text-sm font-medium transition-colors ${
            onCurrentMonth
              ? "border-[var(--line)] text-[var(--ink-4)] cursor-default"
              : "border-[var(--line-2)] text-[var(--ink)] hover:bg-[var(--bg-3)]"
          }`}
        >
          {t("calendar.today")}
        </button>
        <button
          onClick={onPrev}
          aria-label="Previous month"
          className="rounded-full p-1.5 text-[var(--ink-3)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <button
          onClick={onNext}
          aria-label="Next month"
          className="rounded-full p-1.5 text-[var(--ink-3)] hover:bg-[var(--bg-3)] hover:text-[var(--ink)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>
      <h2 className="flex-1 min-w-0 truncate text-base font-semibold text-[var(--ink)]">{monthLabel}</h2>
      {loading && (
        <div className="h-3 w-3 shrink-0 animate-spin rounded-full border-[1.5px] border-[var(--line-2)] border-t-[var(--m-accent)]" />
      )}
    </div>
  );
}
