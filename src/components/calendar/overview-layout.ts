import { parseReservationDate } from "@/lib/reservation-dates";
import type { CalendarBar } from "./types";

export const OVERVIEW_DAY_WIDTH = 48;
export const OVERVIEW_PROPERTY_COLUMN_CLASS = "w-32 sm:w-52";
export const OVERVIEW_BAR_HEIGHT = 32;
export const OVERVIEW_LANE_HEIGHT = 40;
export const OVERVIEW_ROW_PADDING = 12;

const DAY_MS = 86_400_000;

export interface OverviewBarLayout {
  startColumn: number;
  span: number;
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
): OverviewBarLayout | null {
  const start = parseReservationDate(bar.startDate);
  const end = parseReservationDate(bar.endDate);
  const visibleStart = parseReservationDate(monthStart);
  const visibleEnd = parseReservationDate(monthEnd);
  if (!start || !end || !visibleStart || !visibleEnd || end <= start || visibleEnd <= visibleStart) return null;
  if (end <= visibleStart || start >= visibleEnd) return null;
  const clippedStart = Math.max(start.getTime(), visibleStart.getTime());
  const clippedEnd = Math.min(end.getTime(), visibleEnd.getTime());
  return {
    startColumn: Math.round((clippedStart - visibleStart.getTime()) / DAY_MS),
    span: Math.round((clippedEnd - clippedStart) / DAY_MS),
    continuesBefore: start < visibleStart,
    continuesAfter: end > visibleEnd,
    rowIdx: bar.rowIdx ?? 0,
  };
}
