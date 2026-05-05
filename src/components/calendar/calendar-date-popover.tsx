"use client";

import type { Property } from "@/lib/types";
import { DateActionsPopover, type ExtendableBooking } from "@/components/date-actions-popover";
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
  const matchingBar = bars.find(b => date >= b.startDate && date <= b.endDate);
  return (
    <DateActionsPopover
      date={date}
      anchorRect={anchorRect}
      status={{
        hasBar: !!matchingBar,
        barName: matchingBar?.name,
        barPlatform: matchingBar?.platform,
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
