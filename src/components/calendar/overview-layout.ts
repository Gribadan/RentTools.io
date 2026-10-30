import { parseReservationDate } from "@/lib/reservation-dates";
import type { CalendarBar } from "./types";
import { timeToPercent } from "./utils";

export const OVERVIEW_DAY_WIDTH = 48;
export const OVERVIEW_PROPERTY_COLUMN_CLASS = "w-32 sm:w-52";
export const OVERVIEW_BAR_HEIGHT = 32;
export const OVERVIEW_LANE_HEIGHT = 40;
export const OVERVIEW_ROW_PADDING = 12;

const DAY_MS = 86_400_000;

export interface OverviewBarLayout {
  /** Occupied nights stay date-only and exclude the checkout night. */
  startColumn: number;
  span: number;
  /** Visual edges include arrival/departure times inside their day cells. */
  left: number;
  width: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  rowIdx: number;
}

export function overviewDayCount(startDate: string, endDate: string): number {
  const start = parseReservationDate(startDate);
  const end = parseReservationDate(endDate);
  if (!start || !end || end <= start) return 0;
  return Math.round((end.getTime() - start.getTime()) / DAY_MS);
}

export function layoutOverviewBar(
  bar: CalendarBar,
  monthStart: string,
  monthEnd: string,
  times: { checkInTime?: string; checkOutTime?: string } = {},
): OverviewBarLayout | null {
  const start = parseReservationDate(bar.startDate);
  const end = parseReservationDate(bar.endDate);
  const visibleStart = parseReservationDate(monthStart);
  const visibleEnd = parseReservationDate(monthEnd);
  if (!start || !end || !visibleStart || !visibleEnd || end <= start || visibleEnd <= visibleStart) return null;
  const checkInFraction = timeToPercent(times.checkInTime || "14:00") / 100;
  const checkOutFraction = timeToPercent(times.checkOutTime || "12:00") / 100;
  const arrival = start.getTime() + checkInFraction * DAY_MS;
  // Linked extensions meet at the next segment's check-in mark, just as
  // they do in the individual property calendar.
  const departure = end.getTime() + (bar.linkedAfter ? checkInFraction : checkOutFraction) * DAY_MS;
  if (departure <= visibleStart.getTime() || arrival >= visibleEnd.getTime()) return null;
  const left = (Math.max(arrival, visibleStart.getTime()) - visibleStart.getTime()) / DAY_MS * OVERVIEW_DAY_WIDTH;
  const right = (Math.min(departure, visibleEnd.getTime()) - visibleStart.getTime()) / DAY_MS * OVERVIEW_DAY_WIDTH;
  const continuesAfter = departure > visibleEnd.getTime();
  // Keep a small separation between distinct stays, but no gap at a linked
  // join or a clipped month boundary. Very short checkout tails stay visible.
  const endGap = continuesAfter || bar.linkedAfter ? 0 : Math.min(2, (right - left) / 2);
  const clippedStart = Math.max(start.getTime(), visibleStart.getTime());
  const clippedEnd = Math.min(end.getTime(), visibleEnd.getTime());
  return {
    startColumn: Math.round((clippedStart - visibleStart.getTime()) / DAY_MS),
    span: Math.round((clippedEnd - clippedStart) / DAY_MS),
    left,
    width: right - left - endGap,
    continuesBefore: arrival < visibleStart.getTime(),
    continuesAfter,
    rowIdx: bar.rowIdx ?? 0,
  };
}
