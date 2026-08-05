import type { CalendarBar } from "./types";
import { addDaysStr } from "./utils";

/** Per-property inputs that decide whether a stay is legal. These are
 *  the host's own settings — the calendar must not hardcode a policy
 *  the property disagrees with. */
export interface PropertyStayRules {
  /** Property master toggle. When false all buffer / cleaning math is
   *  off, so a zero-gap turnover carries no cleaning obligation. */
  cleaningEnabled: boolean;
  /** Max `bufferBefore` across the property's calendar links. This is
   *  the same signal the cleaning schedule calls BufferMode: 0 =
   *  "quick" (the property runs same-day turnovers), >0 = "full" (the
   *  property reserves free days before every check-in). */
  bufferBefore: number;
}

/** Why a selection cannot become a reservation.
 *   * `occupied`       — a selected night is genuinely sold.
 *   * `buffer-required`— the shape is a same-day turnover, which this
 *                        property's buffer setting does not allow. */
export type StayBlockReason = "occupied" | "buffer-required";

export interface StayPlan {
  checkIn: string;
  checkOut: string;
  nights: number;
  /** The last selected day is the NEXT guest's check-in day and is
   *  being read as this stay's check-out rather than as a night. */
  isTurnover: boolean;
  /** null when the stay can be created. */
  blockedBy: StayBlockReason | null;
}

/** Resolve what reservation a contiguous date selection means.
 *
 *  Selection is night-based: each selected day is one occupied night,
 *  so check-out is normally the day AFTER the last selected day.
 *
 *  The exception is the same-day turnover. When the last selected day
 *  is the next guest's CHECK-IN day, the host means "mine leaves that
 *  morning, theirs arrives that afternoon" — the stay ends ON that day
 *  instead of occupying its night. Whether that is allowed is a
 *  property decision: a property that reserves buffer days before every
 *  check-in must not be handed a zero-gap turnover silently.
 */
export function planStay(
  selectedDates: string[],
  bars: CalendarBar[],
  rules: PropertyStayRules
): StayPlan | null {
  if (selectedDates.length === 0) return null;

  const checkIn = selectedDates[0];
  const last = selectedDates[selectedDates.length - 1];

  // Half-open, matching the server's overlap rule and countBooked: a
  // bar's endDate is its check-OUT day, whose night is free.
  const isOccupied = (d: string) => bars.some((b) => d >= b.startDate && d < b.endDate);
  const isCheckInDay = (d: string) => bars.some((b) => d === b.startDate);

  const occupiedDates = selectedDates.filter(isOccupied);

  if (occupiedDates.length === 0) {
    return {
      checkIn,
      checkOut: addDaysStr(last, 1),
      nights: selectedDates.length,
      isTurnover: false,
      blockedBy: null,
    };
  }

  // Turnover shape: the ONLY occupied day is the trailing one, and it
  // is somebody's check-in day. Anything else is a real clash.
  const isTurnoverShape =
    occupiedDates.length === 1 && occupiedDates[0] === last && isCheckInDay(last);

  if (!isTurnoverShape) {
    return {
      checkIn,
      checkOut: addDaysStr(last, 1),
      nights: selectedDates.length,
      isTurnover: false,
      blockedBy: "occupied",
    };
  }

  // Dropping the trailing day leaves the nights actually being sold.
  // A lone check-in day leaves zero — nothing to create.
  const nights = selectedDates.length - 1;
  if (nights < 1) {
    return { checkIn, checkOut: last, nights, isTurnover: true, blockedBy: "occupied" };
  }

  const propertyReservesBuffer = rules.cleaningEnabled && rules.bufferBefore > 0;
  return {
    checkIn,
    checkOut: last,
    nights,
    isTurnover: true,
    blockedBy: propertyReservesBuffer ? "buffer-required" : null,
  };
}
