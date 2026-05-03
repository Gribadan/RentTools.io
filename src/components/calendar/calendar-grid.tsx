"use client";

import { useMemo } from "react";
import { useI18n } from "@/lib/i18n/context";
import { timeToPercent } from "./utils";
import type { BarSegment, CalendarBar } from "./types";

interface CalendarGridProps {
  year: number;
  month: number;
  today: Date;
  minNights: number;
  checkInTime: string;
  checkOutTime: string;
  bars: CalendarBar[];
  bufferDates: Set<string>;
  potentialDates: Set<string>;
  unbookableDates: Set<string>;
  sameDayCleaningDates: Set<string>;
  conflictDates: Set<string>;
  openOverrides: Set<string>;
  closedOverrides: Set<string>;
  overrideMode: boolean;
  onSelectReservation: (id: number) => void;
  onCellClick: (dateStr: string, rect: DOMRect) => void;
}

export function CalendarGrid({
  year,
  month,
  today,
  minNights,
  checkInTime,
  checkOutTime,
  bars,
  bufferDates,
  potentialDates,
  unbookableDates,
  sameDayCleaningDates,
  conflictDates,
  openOverrides,
  closedOverrides,
  overrideMode,
  onSelectReservation,
  onCellClick,
}: CalendarGridProps) {
  const { t, locale } = useI18n();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDayOffset = new Date(year, month, 1).getDay() - 1;
  if (firstDayOffset < 0) firstDayOffset = 6;
  const monthKey = `${year}-${month}`;

  const checkInPct = timeToPercent(checkInTime);
  const checkOutPct = timeToPercent(checkOutTime);

  const WEEKDAYS = locale === "ru"
    ? ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const weeks = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const result: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      result.push(cells.slice(i, i + 7));
    }
    if (result.length > 0) {
      while (result[result.length - 1].length < 7) result[result.length - 1].push(null);
    }
    return result;
  }, [firstDayOffset, daysInMonth]);

  const hasBarOnDay = (dayNum: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return bars.some(b => ds >= b.startDate && ds <= b.endDate);
  };

  const segmentsForDay = (dayNum: number): BarSegment[] => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const dow = new Date(year, month, dayNum).getDay();
    const isMonday = dow === 1;
    const segments: BarSegment[] = [];

    for (const bar of bars) {
      const isActualStart = ds === bar.startDate;
      const isMondayContinuation = isMonday && ds > bar.startDate && ds <= bar.endDate;
      const isMonthContinuation = dayNum === 1 && bar.startDate < ds && bar.endDate >= ds;
      if (!isActualStart && !isMondayContinuation && !isMonthContinuation) continue;

      let span = 0;
      let lastDay = dayNum;
      for (let d = dayNum; d <= daysInMonth; d++) {
        const dds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (dds > bar.endDate) break;
        span++;
        lastDay = d;
        if (new Date(year, month, d).getDay() === 0) break;
      }
      if (span === 0) continue;

      const lastDds = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      const reachesEnd = lastDds === bar.endDate;

      segments.push({
        ...bar,
        span,
        leftPct: isActualStart ? checkInPct : 0,
        rightMarginPct: reachesEnd ? 100 - checkOutPct : 0,
        showLabel: isActualStart || isMonthContinuation,
      });
    }

    return segments;
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
      <div className="grid grid-cols-7 border-b border-[#27272b]">
        {WEEKDAYS.map(wd => (
          <div key={wd} className="py-2 text-center text-xs font-medium text-[#71717a]">{wd}</div>
        ))}
      </div>

      <div key={monthKey}>
        {weeks.map((week, wi) => (
          <div key={`${monthKey}-w${wi}`} className="grid grid-cols-7 border-b border-[#27272b] last:border-b-0">
            {week.map((dayNum, di) => {
              if (dayNum === null) {
                return <div key={`c-${di}`} className="h-14" />;
              }
              const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();
              const isConflict = conflictDates.has(ds);
              const segments = segmentsForDay(dayNum);
              const hasBar = hasBarOnDay(dayNum);
              const isBuffer = bufferDates.has(ds) && !hasBar;
              const isPotential = potentialDates.has(ds) && !hasBar && !isBuffer;
              const isUnbookable = unbookableDates.has(ds) && !hasBar && !isBuffer && !isPotential;
              const isSameDayCleaning = sameDayCleaningDates.has(ds);
              const isOpen = openOverrides.has(ds);
              const isClosed = closedOverrides.has(ds);
              const bg = isOpen ? "bg-[#34d399]/8"
                : isClosed ? "bg-[#ef4444]/8"
                : isConflict ? "bg-[#ef4444]/8"
                : isToday ? "bg-[#e8e8ec]/5"
                : isBuffer ? "bg-[#fbbf24]/5"
                : isPotential ? "bg-[#e8e8ec]/3"
                : isUnbookable ? "bg-[#71717a]/5"
                : "";

              const showMiddleIndicator = !hasBar && (isBuffer || isPotential || isUnbookable || (isOpen && !hasBar) || (isClosed && !isBuffer) || (isConflict && !isOpen && !isClosed));
              return (
                <div
                  key={`c-${dayNum}`}
                  onClick={(e) => {
                    if (overrideMode) onCellClick(ds, (e.currentTarget as HTMLElement).getBoundingClientRect());
                  }}
                  className={`relative h-16 border-r border-[#27272b] last:border-r-0 ${bg} ${
                    overrideMode ? "cursor-pointer hover:bg-[#1e1e22]" : ""
                  } ${isOpen ? "ring-1 ring-inset ring-[#34d399]/40" : ""} ${isClosed ? "ring-1 ring-inset ring-[#ef4444]/40" : ""}`}
                >
                  <div className="absolute top-1 left-1.5 z-20 pointer-events-none">
                    <span className={`text-xs leading-none ${
                      isConflict ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444] text-white font-semibold"
                      : isToday ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8e8ec] text-white font-semibold"
                      : isOpen ? "text-[#34d399] font-semibold"
                      : isClosed ? "text-[#ef4444] font-semibold"
                      : "text-[#71717a]"
                    }`}>{dayNum}</span>
                  </div>

                  {showMiddleIndicator && (
                    <div className="absolute left-0 right-0 top-7 flex items-center justify-center px-0.5 pointer-events-none">
                      {isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 font-medium">{t("calendar.open")}</div>
                      )}
                      {isClosed && !isBuffer && !isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 font-medium">{t("calendar.closed")}</div>
                      )}
                      {isConflict && !isOpen && !isClosed && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 font-medium">{t("calendar.conflict")}</div>
                      )}
                      {isBuffer && !isOpen && !isClosed && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#fbbf24] bg-[#fbbf24]/8 border border-[#fbbf24]/15">{t("calendar.cleaning")}</div>
                      )}
                      {isBuffer && isClosed && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 font-medium">{t("calendar.closed")}</div>
                      )}
                      {isPotential && !isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#e8e8ec]/70 bg-[#e8e8ec]/5 border border-[#e8e8ec]/15 border-dashed">{t("calendar.cleaningQ")}</div>
                      )}
                      {isUnbookable && !isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#71717a] bg-[#71717a]/8 border border-[#71717a]/15 border-dashed">&lt;{minNights}n</div>
                      )}
                    </div>
                  )}

                  {segments.map((seg, si) => (
                    <div
                      key={`seg-${si}-${seg.startDate}`}
                      onClick={(e) => { e.stopPropagation(); seg.reservationId && onSelectReservation(seg.reservationId); }}
                      className={`absolute top-7 h-5 flex items-center rounded px-2 text-[11px] font-medium text-white/90 truncate ${
                        isConflict ? "bg-[#ef4444] ring-1 ring-[#ef4444]/40" :
                        seg.platform === "booking"
                          ? "bg-[#003580]"
                          : "bg-[#ff385c]"
                      } ${seg.reservationId ? "cursor-pointer hover:brightness-110" : ""} ${seg.isExtension ? "ring-1 ring-white/30 ring-dashed" : ""}`}
                      style={{
                        left: `${seg.leftPct}%`,
                        width: `calc(${seg.span * 100}% - ${seg.leftPct}% - ${seg.rightMarginPct}% - 2px)`,
                        zIndex: 10,
                        backgroundImage: seg.isExtension
                          ? "repeating-linear-gradient(-45deg, transparent 0 6px, rgba(255,255,255,0.22) 6px 8px)"
                          : undefined,
                      }}
                      title={`${seg.name} · ${seg.startDate} ${checkInTime} → ${seg.endDate} ${checkOutTime}${isConflict ? " ⚠ CONFLICT" : ""}`}
                    >
                      {seg.showLabel ? seg.name : ""}
                    </div>
                  ))}

                  {isSameDayCleaning && !isOpen && !isClosed && (
                    <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center px-0.5 pointer-events-none">
                      <div className="rounded px-1.5 h-4 flex items-center text-[9px] text-[#fbbf24] bg-[#fbbf24]/15 border border-[#fbbf24]/30 font-medium leading-none">
                        {t("calendar.cleaning")}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}
