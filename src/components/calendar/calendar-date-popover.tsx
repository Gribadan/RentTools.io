"use client";

import type { Property } from "@/lib/types";
import { DateActionsPopover, type DateBarInfo, type ExtendableBooking } from "@/components/date-actions-popover";
import { getExtendableBookings } from "./extendable-bookings";
import { addDaysStr } from "./utils";
import type { CalendarBar, CalendarEvent } from "./types";

interface CalendarDatePopoverProps {
  selectedDates: Set<string>;
  bars: CalendarBar[];
  bufferDates: Set<string>;
  potentialDates: Set<string>;
  sameDayCleaningDates: Set<string>;
  unbookableDates: Set<string>;
  openOverrides: Set<string>;
  closedOverrides: Set<string>;
  cleaningOverrides: Set<string>;
  syncedEvents: CalendarEvent[];
  reservations: Property["reservations"];
  onClose: () => void;
  onToggleDate: (dateStr: string) => void;
  onSetSingleOverride: (dateStr: string, type: "open" | "closed" | "cleaning") => void;
  onRemoveSingleOverride: (dateStr: string) => void;
  onSetBulkOverride: (type: "open" | "closed" | "cleaning") => void;
  onRemoveBulkOverride: () => void;
  onExtendBooking: (rangeStart: string, rangeEnd: string, b: ExtendableBooking) => void;
  onCreateReservation: (data: { name: string; platform: string }) => void;
  /** Trim a manual reservation's checkOut. Wired to PATCH
   *  /api/reservations/:id by the parent. */
  onTrimReservation?: (reservationId: number, newCheckOut: string) => void;
}

// Build the ordered bar list for a given date.
function buildDateBars(date: string, bars: CalendarBar[]): DateBarInfo[] {
  const matching = bars.filter((b) => date >= b.startDate && date <= b.endDate);
  return matching
    .map<DateBarInfo>((b) => {
      const isStart = date === b.startDate;
      const isEnd = date === b.endDate;
      const role: DateBarInfo["role"] =
        isStart && isEnd ? "fullday"
          : isEnd ? "checkout"
            : isStart ? "checkin"
              : "midstay";
      return {
        name: b.name,
        platform: b.platform,
        role,
        startDate: b.startDate,
        endDate: b.endDate,
        reservationId: b.reservationId,
        eventUid: b.eventUid,
        linkedEventUid: b.linkedEventUid,
      };
    })
    .sort((a, b) => {
      const order: Record<DateBarInfo["role"], number> = { checkout: 0, fullday: 1, midstay: 1, checkin: 2 };
      return order[a.role] - order[b.role];
    });
}

export function CalendarDatePopover({
  selectedDates,
  bars,
  bufferDates,
  potentialDates,
  sameDayCleaningDates,
  unbookableDates,
  openOverrides,
  closedOverrides,
  cleaningOverrides,
  syncedEvents,
  reservations,
  onClose,
  onToggleDate,
  onSetSingleOverride,
  onRemoveSingleOverride,
  onSetBulkOverride,
  onRemoveBulkOverride,
  onExtendBooking,
  onCreateReservation,
  onTrimReservation,
}: CalendarDatePopoverProps) {
  // Snapshot of every selected date's status — feeds the side panel
  // header and lets the panel decide whether each bulk action makes
  // sense (e.g. "Make available" only relevant when at least one
  // selected date has a closed/cleaning override).
  const sortedDates = Array.from(selectedDates).sort();

  // For single-date mode, derive the per-date detail (timeline,
  // contextual actions). For multi-date mode, the panel uses the
  // aggregated counts to surface bulk actions.
  const singleDate = sortedDates.length === 1 ? sortedDates[0] : null;
  const singleDateBars = singleDate ? buildDateBars(singleDate, bars) : [];

  // Detect whether the selection is a contiguous date range — only
  // contiguous selections can be appended to a booking as a single
  // multi-night extension. Non-contiguous selections suppress the
  // extend-booking section entirely.
  let isContiguousRange = true;
  for (let i = 1; i < sortedDates.length; i++) {
    if (addDaysStr(sortedDates[i - 1], 1) !== sortedDates[i]) {
      isContiguousRange = false;
      break;
    }
  }
  // For contiguous selections (including single dates) we ask the
  // helper for events / reservations that abut the WHOLE range,
  // not just a single click target. With a 2-day selection the
  // helper finds the booking whose startDate equals last+1 (extend
  // before) or whose endDate equals first (extend after).
  const extendable =
    sortedDates.length > 0 && isContiguousRange
      ? getExtendableBookings(sortedDates[0], sortedDates[sortedDates.length - 1], syncedEvents, reservations)
      : [];

  // Aggregate flags across the selection.
  let countBooked = 0;
  let countOpenOverride = 0;
  let countClosedOverride = 0;
  let countCleaningOverride = 0;
  let countAutoBlocked = 0;
  for (const d of sortedDates) {
    // Half-open: a bar's endDate is the reservation's check-OUT day,
    // which is a same-day-turnover slot, not an occupied night. The
    // API at /api/reservations (POST L58/L97 and PATCH L114/L143) uses
    // the standard half-open overlap `checkIn:{lt:newCheckOut},
    // checkOut:{gt:newCheckIn}` and explicitly permits a new check-in
    // on a prior reservation's check-out date. Counting that slot as
    // "booked" here disabled Create / Block / Make-available / extend-
    // after on a perfectly legal back-to-back turnover and surfaced a
    // misleading "1 booked — bulk actions disabled" message. We leave
    // buildDateBars (L36) and singleStatus.hasBar (L156) inclusive so
    // the single-date checkout-cell popover still surfaces the leaving
    // reservation (for trim / cancel-cleaning-on-booked / manual chip
    // controls), and we leave calendar-grid.tsx's hasBarOnDay inclusive
    // so the bar still paints across the checkout cell.
    if (bars.some((b) => d >= b.startDate && d < b.endDate)) countBooked++;
    if (openOverrides.has(d)) countOpenOverride++;
    if (closedOverrides.has(d)) countClosedOverride++;
    if (cleaningOverrides.has(d)) countCleaningOverride++;
    // Auto-blocked = the system would flag the date as
    // unbookable / cleaning even without an explicit override
    // (buffer days, same-day cleaning, min-nights gap, potential
    // cleaning). "Make available" only makes sense if at least
    // one selected date falls into one of these — without the
    // count we'd surface the action on dates that are already
    // available.
    if (
      bufferDates.has(d) ||
      sameDayCleaningDates.has(d) ||
      unbookableDates.has(d) ||
      potentialDates.has(d)
    ) {
      countAutoBlocked++;
    }
  }

  return (
    <DateActionsPopover
      selectedDates={sortedDates}
      singleDate={singleDate}
      singleDateBars={singleDateBars}
      extendable={extendable}
      isContiguousRange={isContiguousRange}
      singleStatus={
        singleDate
          ? {
            hasBar: singleDateBars.length > 0,
            isBuffer: bufferDates.has(singleDate),
            isPotential: potentialDates.has(singleDate),
            isSameDayCleaning: sameDayCleaningDates.has(singleDate),
            isUnbookable: unbookableDates.has(singleDate),
            isOpenOverride: openOverrides.has(singleDate),
            isClosedOverride: closedOverrides.has(singleDate),
            isManualCleaning: cleaningOverrides.has(singleDate),
          }
          : null
      }
      bulkCounts={{
        booked: countBooked,
        openOverride: countOpenOverride,
        closedOverride: countClosedOverride,
        cleaningOverride: countCleaningOverride,
        autoBlocked: countAutoBlocked,
      }}
      onClose={onClose}
      onToggleDate={onToggleDate}
      onCloseDate={() =>
        singleDate ? onSetSingleOverride(singleDate, "closed") : onSetBulkOverride("closed")
      }
      onOpenDate={() =>
        singleDate ? onSetSingleOverride(singleDate, "open") : onSetBulkOverride("open")
      }
      onScheduleCleaning={() =>
        singleDate ? onSetSingleOverride(singleDate, "cleaning") : onSetBulkOverride("cleaning")
      }
      onRemoveOverride={() =>
        singleDate ? onRemoveSingleOverride(singleDate) : onRemoveBulkOverride()
      }
      onExtendBooking={(b) =>
        // For multi-day, use the full selected range. For single
        // date, this collapses to (date, date+1) — same 1-night
        // extension as before.
        onExtendBooking(sortedDates[0], sortedDates[sortedDates.length - 1], b)
      }
      onCreateReservation={onCreateReservation}
      onTrimReservation={onTrimReservation}
    />
  );
}
