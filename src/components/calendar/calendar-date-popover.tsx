"use client";

import type { Property } from "@/lib/types";
import { DateActionsPopover, type DateBarInfo, type ExtendableBooking } from "@/components/date-actions-popover";
import { getExtendableBookings } from "./extendable-bookings";
import type { CalendarBar, CalendarEvent } from "./types";

interface CalendarDatePopoverProps {
  date: string;
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
  onCreateReservation: (data: { name: string; nights: number; platform: string }) => void;
}

// Build the ordered bar list for a given date.
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
      const order: Record<DateBarInfo["role"], number> = { checkout: 0, fullday: 1, midstay: 1, checkin: 2 };
      return order[a.role] - order[b.role];
    });
}

export function CalendarDatePopover({
  date,
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
  onCreateReservation,
}: CalendarDatePopoverProps) {
  const dateBars = buildDateBars(date, bars);
  return (
    <DateActionsPopover
      date={date}
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
      onCreateReservation={onCreateReservation}
    />
  );
}
