"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { toDateStr, formatDate, dayCount } from "./utils";
import type { CalendarBar } from "./types";

interface AgendaListProps {
  bars: CalendarBar[];
  today: Date;
  onSelectReservation: (id: number) => void;
}

export function AgendaList({ bars, today, onSelectReservation }: AgendaListProps) {
  const { t, locale } = useI18n();

  const agenda = useMemo(() => {
    const todayStr = toDateStr(today);
    return bars
      .filter(b => b.endDate >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [bars, today]);

  return (
    <div className="rounded-lg border border-[var(--line)] bg-[var(--bg-2)]">
      <div className="border-b border-[var(--line)] px-4 py-3">
        <h2 className="text-xs font-medium text-[var(--ink-3)]">{t("calendar.upcoming")} ({agenda.length})</h2>
      </div>
      {agenda.length === 0 ? (
        <p className="px-4 py-6 text-sm text-[var(--ink-4)] text-center">{t("calendar.noUpcoming")}</p>
      ) : (
        <div>
          {agenda.map((item, i) => (
            <div
              key={`${item.startDate}-${i}`}
              onClick={() => item.reservationId && onSelectReservation(item.reservationId)}
              className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--bg-3)] ${
                i < agenda.length - 1 ? "border-b border-[var(--line)]/50" : ""
              } ${item.reservationId ? "cursor-pointer" : ""}`}
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                item.platform === "booking" ? "bg-[#003580]" : "bg-[var(--m-accent)]"
              }`} />
              <span className="flex-1 min-w-0 text-sm font-medium text-[var(--ink)] truncate">{item.name}</span>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                item.platform === "booking" ? "bg-[#003580]/20 text-sky-300" : "bg-[var(--m-accent)]/20 text-[var(--m-accent)]"
              }`}>
                {item.platform === "booking" ? "Booking" : "Airbnb"}
              </span>
              <span className="shrink-0 text-sm text-[var(--ink-3)]">
                {formatDate(item.startDate, locale)} — {formatDate(item.endDate, locale)}
              </span>
              <span className="shrink-0 text-xs text-[var(--ink-4)]">{dayCount(item.startDate, item.endDate)}d</span>
              {item.reservationId && (
                <svg className="h-4 w-4 shrink-0 text-[var(--ink-4)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
