"use client";

import type { Property } from "@/lib/types";
import { DateActionsPopover, type DateBarInfo, type ExtendableBooking } from "@/components/date-actions-popover";
import { getExtendableBookings } from "./extendable-bookings";
import type { CalendarBar, CalendarEvent } from "./types";

interface CalendarDatePopoverProps {
  date: string;
  anchorRect: DOMRect;
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
  onSetOverride: (type: "open" | "closed" | "cleaning") => void;
  onRemoveOverride: () => void;
  onExtendBooking: (b: ExtendableBooking) => void;
}

// Build the ordered bar list for a given date. A same-day turnover
// produces two bars on the same date — one whose endDate matches (the
// guest checking out) and one whose startDate matches (the guest
// checking in) — so we sort them as checkout → checkin and let the
// popover slot a "Cleaning required" hint between them. We also
// project linkedEventUid so the popover can suppress that hint when
// the two abutting bars are actually the same guest's stay.
function buildDateBars(date: string, bars: CalendarBar[]): DateBarInfo[] {
  const matching = bars.filter(b => date >= b.startDate && date <= b.endDate);
  return matching
    .map<DateBarInfo>(b => {
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
      // checkout (someone leaving) first, then any midstay/fullday,
      // then checkin (someone arriving) — chronological by hour.
      const order: Record<DateBarInfo["role"], number> = { checkout: 0, fullday: 1, midstay: 1, checkin: 2 };
      return order[a.role] - order[b.role];
    });
}

export function CalendarDatePopover({
  date,
  anchorRect,
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
  onSetOverride,
  onRemoveOverride,
  onExtendBooking,
}: CalendarDatePopoverProps) {
  const dateBars = buildDateBars(date, bars);
  return (
    <DateActionsPopover
      date={date}
      anchorRect={anchorRect}
      dateBars={dateBars}
      status={{
        hasBar: dateBars.length > 0,
        isBuffer: bufferDates.has(date),
        isPotential: potentialDates.has(date),
        isSameDayCleaning: sameDayCleaningDates.has(date),
        isUnbookable: unbookableDates.has(date),
        isOpenOverride: openOverrides.has(date),
        isClosedOverride: closedOverrides.has(date),
        isManualCleaning: cleaningOverrides.has(date),
      }}
      extendable={getExtendableBookings(date, syncedEvents, reservations)}
      onClose={onClose}
      onCloseDate={() => onSetOverride("closed")}
      onOpenDate={() => onSetOverride("open")}
      onScheduleCleaning={() => onSetOverride("cleaning")}
      onRemoveOverride={onRemoveOverride}
      onExtendBooking={onExtendBooking}
    />
  );
}
