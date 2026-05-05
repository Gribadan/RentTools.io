"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { addDaysStr, toDateStr, formatDate, dayCount } from "./utils";
import type { CalendarBar } from "./types";

interface AgendaListProps {
  bars: CalendarBar[];
  today: Date;
  onSelectReservation: (id: number) => void;
}

export function AgendaList({ bars, today, onSelectReservation }: AgendaListProps) {
  const { t, locale } = useI18n();

  const { next7, later } = useMemo(() => {
    const todayStr = toDateStr(today);
    const boundaryStr = addDaysStr(todayStr, 7);
    const sorted = bars
      .filter(b => b.endDate >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    return {
      next7: sorted.filter(b => b.startDate < boundaryStr),
      later: sorted.filter(b => b.startDate >= boundaryStr),
    };
  }, [bars, today]);

  const total = next7.length + later.length;
  const showSections = next7.length > 0 && later.length > 0;

  const renderRow = (item: CalendarBar, key: string, isLast: boolean) => (
    <div
      key={key}
      onClick={() => item.reservationId && onSelectReservation(item.reservationId)}
      className={`flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-[var(--bg-3)] sm:flex-row sm:items-center sm:gap-3 sm:py-2.5 ${
        !isLast ? "border-b border-[var(--line)]/50" : ""
      } ${item.reservationId ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center gap-2 min-w-0 sm:flex-1 sm:gap-3">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
          item.platform === "booking" ? "bg-[#003580]" : "bg-[var(--m-accent)]"
        }`} />
        <span className="flex-1 min-w-0 text-sm font-medium text-[var(--ink)] truncate">{item.name}</span>
        {item.reservationId && (
          <svg className="h-4 w-4 shrink-0 text-[var(--ink-4)] sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        )}
      </div>
      <div className="flex items-center gap-2 pl-[18px] sm:pl-0 sm:gap-3">
        <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
          item.platform === "booking" ? "bg-[#003580]/20 text-sky-300" : "bg-[var(--m-accent)]/20 text-[var(--m-accent)]"
        }`}>
          {item.platform === "booking" ? "Booking" : "Airbnb"}
        </span>
        <span className="shrink-0 text-xs text-[var(--ink-3)] sm:text-sm">
          {formatDate(item.startDate, locale)} — {formatDate(item.endDate, locale)}
        </span>
        <span className="shrink-0 text-xs text-[var(--ink-4)]">{dayCount(item.startDate, item.endDate)}d</span>
      </div>
      {item.reservationId && (
        <svg className="hidden h-4 w-4 shrink-0 text-[var(--ink-4)] sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      )}
    </div>
  );

  const sectionHeader = (label: string) => (
    <div className="border-b border-[var(--line)]/50 bg-[var(--bg-3)]/40 px-4 py-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-[var(--ink-4)]">
        {label}
      </span>
    </div>
  );

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="border-b border-[var(--line)] px-4 py-3">
        <h2 className="text-xs font-medium text-[var(--ink-3)]">{t("calendar.upcoming")} ({total})</h2>
      </div>
      {total === 0 ? (
        <p className="px-4 py-6 text-sm text-[var(--ink-4)] text-center">{t("calendar.noUpcoming")}</p>
      ) : (
        <div>
          {showSections && sectionHeader(t("calendar.next7Days"))}
          {next7.map((item, i) =>
            renderRow(
              item,
              `n7-${item.startDate}-${i}`,
              i === next7.length - 1 && later.length === 0
            )
          )}
          {showSections && sectionHeader(t("calendar.later"))}
          {later.map((item, i) =>
            renderRow(item, `l-${item.startDate}-${i}`, i === later.length - 1)
          )}
        </div>
      )}
    </div>
  );
}
