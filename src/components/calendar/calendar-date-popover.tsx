"use client";

import type { Property } from "@/lib/types";
import { DateActionsPopover, type DateBarInfo, type ExtendableBooking } from "@/components/date-actions-popover";
import { getExtendableBookings } from "./extendable-bookings";
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
  onExtendBooking: (dateStr: string, b: ExtendableBooking) => void;
  onCreateReservation: (data: { name: string; platform: string }) => void;
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
  const singleExtendable = singleDate ? getExtendableBookings(singleDate, syncedEvents, reservations) : [];

  // Aggregate flags across the selection.
  let countBooked = 0;
  let countOpenOverride = 0;
  let countClosedOverride = 0;
  let countCleaningOverride = 0;
  for (const d of sortedDates) {
    if (bars.some((b) => d >= b.startDate && d <= b.endDate)) countBooked++;
    if (openOverrides.has(d)) countOpenOverride++;
    if (closedOverrides.has(d)) countClosedOverride++;
    if (cleaningOverrides.has(d)) countCleaningOverride++;
  }

  return (
    <DateActionsPopover
      selectedDates={sortedDates}
      singleDate={singleDate}
      singleDateBars={singleDateBars}
      singleExtendable={singleExtendable}
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
      onExtendBooking={(b) => singleDate && onExtendBooking(singleDate, b)}
      onCreateReservation={onCreateReservation}
    />
  );
}
