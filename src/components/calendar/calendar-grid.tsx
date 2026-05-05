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
  /** Dates where the host has explicitly scheduled a cleaning (override
   *  type=cleaning). Render with the cleaning chip + "Manual cleaning"
   *  label so they are visually distinct from auto buffer days. */
  cleaningOverrides: Set<string>;
  loading?: boolean;
  onSelectReservation: (id: number) => void;
  onClaimBar?: (bar: BarSegment, rect: DOMRect) => void;
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
  cleaningOverrides,
  loading,
  onSelectReservation,
  onClaimBar,
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

      // When the bar abuts a linked partner on its right, end the bar
      // at the partner's check-in mark instead of the normal check-out
      // mark — so the two bars touch at exactly one X position. The
      // 2 px gap and the right rounding are dropped in the renderer
      // (see `endGap` and `radiusClass`).
      const abutsRightPartner = !!bar.linkedAfter && reachesEnd;
      segments.push({
        ...bar,
        span,
        leftPct: isActualStart ? checkInPct : 0,
        rightMarginPct: reachesEnd
          ? (abutsRightPartner ? 100 - checkInPct : 100 - checkOutPct)
          : 0,
        showLabel: isActualStart || isMonthContinuation,
        // continuesLeft: this segment is NOT the bar's real start day
        // (so it's a Monday or month-1 continuation); continuesRight:
        // this segment ends mid-bar (Sunday or last-of-month).
        continuesLeft: ds > bar.startDate,
        continuesRight: !reachesEnd,
      });
    }

    return segments;
  };

  return (
    /* overflow-visible so wrap-around bars can bleed ~8px past their
       last cell into the parent wrapper's overflow-clip-margin (Airbnb
       continues-to-next-row pattern). The calendar is `hidden sm:block`
       so we never need horizontal scroll on small screens. */
    <div className="overflow-visible">
      <div className="min-w-[640px]">
      <div className="grid grid-cols-7 border-b border-[var(--line)]">
        {WEEKDAYS.map(wd => (
          <div key={wd} className="py-3 text-center text-xs font-semibold uppercase tracking-wider text-[var(--ink-3)]">{wd}</div>
        ))}
      </div>

      <div key={monthKey} className="relative">
        {/* Skeleton bars while events are still being fetched. We park them
            at deterministic row offsets (top = row * 72 + 36 px so they sit
            inside the booking-bar band of each row) so the calendar already
            has visual structure on first paint instead of the bars popping
            in diagonally as the fetch resolves. Hidden once any real bar
            exists, even from cache. */}
        {loading && bars.length === 0 && (
          <div className="absolute inset-0 z-0 pointer-events-none animate-pulse" aria-hidden="true">
            <div className="absolute h-6 rounded-md bg-[var(--ink-4)]/12" style={{ top: "36px", left: "30%", width: "32%" }} />
            <div className="absolute h-6 rounded-md bg-[var(--ink-4)]/10" style={{ top: "108px", left: "62%", width: "22%" }} />
            <div className="absolute h-6 rounded-md bg-[var(--ink-4)]/12" style={{ top: "180px", left: "8%", width: "38%" }} />
            <div className="absolute h-6 rounded-md bg-[var(--ink-4)]/10" style={{ top: "252px", left: "48%", width: "28%" }} />
          </div>
        )}
        {weeks.map((week, wi) => (
          <div key={`${monthKey}-w${wi}`} className="grid grid-cols-7 border-b border-[var(--line)] last:border-b-0">
            {week.map((dayNum, di) => {
              if (dayNum === null) {
                return <div key={`c-${di}`} className="h-[72px] border-r border-[var(--line)] last:border-r-0" />;
              }
              const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();
              const isConflict = conflictDates.has(ds);
              const segments = segmentsForDay(dayNum);
              const hasBar = hasBarOnDay(dayNum);
              const isManualCleaning = cleaningOverrides.has(ds) && !hasBar;
              const isBuffer = bufferDates.has(ds) && !hasBar && !isManualCleaning;
              const isPotential = potentialDates.has(ds) && !hasBar && !isBuffer && !isManualCleaning;
              const isUnbookable = unbookableDates.has(ds) && !hasBar && !isBuffer && !isPotential && !isManualCleaning;
              const isSameDayCleaning = sameDayCleaningDates.has(ds);
              const isOpen = openOverrides.has(ds);
              const isClosed = closedOverrides.has(ds);
              const bg = isOpen ? "bg-emerald-500/8"
                : isClosed ? "bg-rose-500/8"
                : isConflict ? "bg-rose-500/8"
                : isManualCleaning ? "bg-[var(--cleaning-cell-bg)]"
                : isToday ? "bg-[var(--ink)]/5"
                : isBuffer ? "bg-[var(--cleaning-cell-bg)]"
                : isPotential ? "bg-[var(--ink)]/3"
                : isUnbookable ? "bg-[var(--ink-4)]/5"
                : "";

              const showMiddleIndicator = !hasBar && (isManualCleaning || isBuffer || isPotential || isUnbookable || (isOpen && !hasBar) || (isClosed && !isBuffer) || (isConflict && !isOpen && !isClosed));
              return (
                <div
                  key={`c-${dayNum}`}
                  onClick={(e) => {
                    onCellClick(ds, (e.currentTarget as HTMLElement).getBoundingClientRect());
                  }}
                  className={`relative h-[72px] border-r border-[var(--line)] last:border-r-0 cursor-pointer transition-colors ${bg} hover:bg-[var(--bg-3)]/60 ${isOpen ? "ring-1 ring-inset ring-emerald-500/40" : ""} ${isClosed ? "ring-1 ring-inset ring-rose-500/40" : ""}`}
                >
                  <div className="absolute top-1.5 left-2 z-20 pointer-events-none">
                    <span className={`text-sm font-medium leading-none ${
                      isConflict ? "inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white font-semibold"
                      : isToday ? "inline-flex h-6 w-6 items-center justify-center rounded-full ring-[1.5px] ring-[var(--m-accent)] text-[var(--m-accent)] font-bold"
                      : isOpen ? "text-emerald-500 font-semibold"
                      : isClosed ? "text-rose-500 font-semibold"
                      : "text-[var(--ink-2)]"
                    }`}>{dayNum}</span>
                  </div>

                  {showMiddleIndicator && (
                    <div className="absolute left-0 right-0 top-9 flex items-center justify-center px-0.5 pointer-events-none">
                      {isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 font-medium">{t("calendar.open")}</div>
                      )}
                      {isClosed && !isBuffer && !isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/20 font-medium">{t("calendar.closed")}</div>
                      )}
                      {isConflict && !isOpen && !isClosed && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/20 font-medium">{t("calendar.conflict")}</div>
                      )}
                      {isManualCleaning && !isOpen && !isClosed && (
                        <div className="rounded px-1.5 h-5 flex items-center text-[10px] font-semibold text-[var(--cleaning-fg)] bg-[var(--cleaning-bg)] border border-[var(--cleaning-border)] shadow-sm">{t("calendar.manualCleaning")}</div>
                      )}
                      {isBuffer && !isOpen && !isClosed && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] font-medium text-[var(--cleaning-fg)] bg-[var(--cleaning-bg)] border border-[var(--cleaning-border)]">{t("calendar.cleaning")}</div>
                      )}
                      {isBuffer && isClosed && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-rose-500 bg-rose-500/10 border border-rose-500/20 font-medium">{t("calendar.closed")}</div>
                      )}
                      {isPotential && !isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[var(--ink)]/70 bg-[var(--ink)]/5 border border-[var(--ink)]/15 border-dashed">{t("calendar.cleaningQ")}</div>
                      )}
                      {isUnbookable && !isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[var(--ink-4)] bg-[var(--ink-4)]/8 border border-[var(--ink-4)]/15 border-dashed">&lt;{minNights}n</div>
                      )}
                    </div>
                  )}

                  {segments.map((seg, si) => {
                    // A segment's edge is treated as "shared" when the
                    // bar either continues into another week (wrap) OR
                    // abuts a linked partner bar (manual extension of
                    // an iCal stay) — in both cases we want the bar to
                    // read as one continuous stay across that edge.
                    const abutsLeftPartner = !!seg.linkedBefore && !seg.continuesLeft;
                    const abutsRightPartner = !!seg.linkedAfter && !seg.continuesRight;
                    const sharedLeft = seg.continuesLeft || abutsLeftPartner;
                    const sharedRight = seg.continuesRight || abutsRightPartner;
                    const radiusClass =
                      sharedLeft && sharedRight
                        ? "rounded-none"
                        : sharedLeft
                          ? "rounded-r-md rounded-l-none"
                          : sharedRight
                            ? "rounded-l-md rounded-r-none"
                            : "rounded-md";
                    // Wrap-around bleed: when this segment continues
                    // into the next/previous week, push it ~8 px past
                    // the cell wall so the bar visibly bleeds out of
                    // the row, the way Airbnb's host calendar shows a
                    // multi-week stay. The parent calendar wrapper has
                    // overflow-clip-margin: 12px so the bleed stays
                    // contained inside the rounded card. Linked-partner
                    // edges don't bleed — they meet a sibling bar
                    // exactly, so they only need the rounding/gap drop.
                    const BLEED = 8;
                    const leftBleed = seg.continuesLeft ? BLEED : 0;
                    const rightBleed = seg.continuesRight ? BLEED : 0;
                    // 2 px gap between distinct stays is suppressed
                    // when the right edge is shared with a wrap or a
                    // linked partner.
                    const endGap = sharedRight ? 0 : 2;
                    const widthAdjust = leftBleed + rightBleed - endGap;
                    const widthStyle = widthAdjust >= 0
                      ? `calc(${seg.span * 100}% - ${seg.leftPct}% - ${seg.rightMarginPct}% + ${widthAdjust}px)`
                      : `calc(${seg.span * 100}% - ${seg.leftPct}% - ${seg.rightMarginPct}% - ${Math.abs(widthAdjust)}px)`;
                    const leftStyle = leftBleed > 0
                      ? `calc(${seg.leftPct}% - ${leftBleed}px)`
                      : `${seg.leftPct}%`;
                    return (
                      <div
                        key={`seg-${si}-${seg.startDate}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          if (seg.reservationId) {
                            onSelectReservation(seg.reservationId);
                          } else if (seg.eventUid && onClaimBar) {
                            onClaimBar(seg, rect);
                          }
                        }}
                        className={`absolute top-9 h-6 flex items-center px-2.5 text-[12.5px] font-semibold text-white/95 truncate shadow-[0_1px_2px_rgba(0,0,0,0.06)] cursor-pointer ${radiusClass} ${
                          isConflict ? "bg-rose-500 ring-1 ring-rose-500/40" :
                          seg.platform === "booking"
                            ? "bg-[#003580]"
                            : "bg-[var(--m-accent)]"
                        } ${(seg.reservationId || seg.eventUid) ? "hover:brightness-110" : ""} ${seg.isExtension ? "ring-1 ring-white/30 ring-dashed" : ""}`}
                        style={{
                          left: leftStyle,
                          width: widthStyle,
                          zIndex: 10,
                          backgroundImage: seg.isExtension
                            ? "repeating-linear-gradient(-45deg, transparent 0 6px, rgba(255,255,255,0.22) 6px 8px)"
                            : undefined,
                        }}
                        title={`${seg.name} · ${seg.startDate} ${checkInTime} → ${seg.endDate} ${checkOutTime}${isConflict ? " ⚠ CONFLICT" : ""}`}
                      >
                        {seg.showLabel ? seg.name : ""}
                      </div>
                    );
                  })}

                  {isSameDayCleaning && !isOpen && !isClosed && (
                    /* Same-day cleaning chip. Anchored top-center so it
                       sits between the two abutting bars (or above the
                       single bar on a checkin day with a wide gap behind
                       it). When the date is ALSO marked as potential —
                       a 0-buffer property's checkin day with a long
                       empty gap behind it — the chip switches to the
                       dashed "Cleaning?" style to communicate that the
                       cleaning could just as well have happened earlier
                       in the gap. */
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                      {potentialDates.has(ds) ? (
                        <div className="rounded px-1.5 h-[18px] flex items-center text-[10px] text-[var(--ink)]/70 bg-[var(--ink)]/5 border border-[var(--ink)]/20 border-dashed font-semibold leading-none shadow-sm whitespace-nowrap">
                          {t("calendar.cleaningQ")}
                        </div>
                      ) : (
                        <div className="rounded px-1.5 h-[18px] flex items-center text-[10px] text-[var(--cleaning-fg)] bg-[var(--cleaning-bg)] border border-[var(--cleaning-border)] font-semibold leading-none shadow-sm whitespace-nowrap">
                          {t("calendar.cleaning")}
                        </div>
                      )}
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
