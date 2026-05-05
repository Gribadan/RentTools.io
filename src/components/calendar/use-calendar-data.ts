import { useMemo } from "react";
import type { Property, CalendarLink, DateOverride, Reservation } from "@/lib/types";
import { bookingWindowCutoff } from "@/lib/types";
import { toDateStr, addDaysStr } from "./utils";
import type { CalendarEvent, CalendarBar, ConflictInfo } from "./types";

export interface CalendarData {
  airbnbDates: Set<string>;
  bookingDates: Set<string>;
  bufferDates: Set<string>;
  potentialDates: Set<string>;
  unbookableDates: Set<string>;
  sameDayCleaningDates: Set<string>;
  conflictDates: Set<string>;
  conflicts: ConflictInfo[];
  bars: CalendarBar[];
  openOverrides: Set<string>;
  closedOverrides: Set<string>;
  /** Dates where the host has manually scheduled a cleaning. Behaves
   *  like a closed override (no bookings) but renders a distinct
   *  "Manual cleaning" chip so the host can tell their own scheduled
   *  cleanings apart from generic blocks or auto-detected buffers. */
  cleaningOverrides: Set<string>;
  dateToReservation: Map<string, Reservation>;
}

export function useCalendarData(
  property: Property,
  syncedEvents: CalendarEvent[],
  links: CalendarLink[],
  overrides: DateOverride[]
): CalendarData {
  const { openOverrides, closedOverrides, cleaningOverrides } = useMemo(() => {
    const open = new Set<string>();
    const closed = new Set<string>();
    const cleaning = new Set<string>();
    for (const o of overrides) {
      if (o.type === "open") open.add(o.date);
      else if (o.type === "closed") closed.add(o.date);
      else if (o.type === "cleaning") cleaning.add(o.date);
    }
    return { openOverrides: open, closedOverrides: closed, cleaningOverrides: cleaning };
  }, [overrides]);

  const computed = useMemo(() => {
    const airbnb = new Set<string>();
    const booking = new Set<string>();
    const buffer = new Set<string>();
    const sameDayCleaning = new Set<string>();
    const potential = new Set<string>();
    const unbookable = new Set<string>();
    const conflictSet = new Set<string>();
    const evMap = new Map<string, { name: string; platform: string; startDate: string; endDate: string; reservationId?: number; eventUid?: string; linkedEventUid?: string }>();
    const resMap = new Map<string, Reservation>();
    const allBooked = new Set<string>();
    const airbnbStay = new Set<string>();
    const bookingStay = new Set<string>();

    const allBookings: { start: string; end: string; platform: string; name: string }[] = [];
    const cutoff = bookingWindowCutoff(property.bookingWindow || 365);

    for (const ev of syncedEvents) {
      if (ev.startDate >= cutoff) continue;
      const platform = ev.platform;
      const dates = platform === "airbnb" ? airbnb : booking;
      const stayDates = platform === "airbnb" ? airbnbStay : bookingStay;
      let d = ev.startDate;
      while (d <= ev.endDate) {
        dates.add(d);
        allBooked.add(d);
        d = addDaysStr(d, 1);
      }
      d = ev.startDate;
      while (d < ev.endDate) {
        stayDates.add(d);
        d = addDaysStr(d, 1);
      }
      if (!evMap.has(ev.startDate) || evMap.get(ev.startDate)!.startDate > ev.startDate) {
        evMap.set(ev.startDate, {
          name: ev.summary || "Reserved",
          platform,
          startDate: ev.startDate,
          endDate: ev.endDate,
          eventUid: ev.uid,
        });
      }
      const isAirbnbBlock = platform === "airbnb" && (
        ev.summary.includes("Not available") || ev.summary.includes("Blocked")
      );
      if (!isAirbnbBlock) {
        allBookings.push({ start: ev.startDate, end: ev.endDate, platform, name: ev.summary });
      }
    }

    for (const res of property.reservations) {
      const start = toDateStr(new Date(res.checkIn));
      const end = toDateStr(new Date(res.checkOut));
      const platform = res.platform || "airbnb";

      let matchingEventStart: string | null = null;
      for (const [evStart, ev] of evMap) {
        if (ev.platform !== platform) continue;
        if (ev.startDate < end && ev.endDate > start) {
          matchingEventStart = evStart;
          break;
        }
      }

      if (matchingEventStart) {
        const ev = evMap.get(matchingEventStart)!;
        evMap.set(matchingEventStart, {
          ...ev,
          name: res.name,
          reservationId: res.id,
        });
        let d = ev.startDate;
        while (d <= ev.endDate) {
          resMap.set(d, res);
          d = addDaysStr(d, 1);
        }
      } else {
        const dates = platform === "airbnb" ? airbnb : platform === "booking" ? booking : airbnb;
        const stayDates = platform === "airbnb" ? airbnbStay : bookingStay;
        let d = start;
        while (d <= end) {
          dates.add(d);
          allBooked.add(d);
          resMap.set(d, res);
          d = addDaysStr(d, 1);
        }
        d = start;
        while (d < end) {
          stayDates.add(d);
          d = addDaysStr(d, 1);
        }
        evMap.set(start, {
          name: res.name,
          platform,
          startDate: start,
          endDate: end,
          reservationId: res.id,
          // Carry linkedEventUid through so the bars step can pair this
          // standalone reservation with the iCal event it extends. Set
          // when the user used "Extend booking" / "Add as extension"
          // in the popover.
          linkedEventUid: res.linkedEventUid ?? undefined,
        });
        allBookings.push({ start, end, platform, name: res.name });
      }
    }

    const conflictList: ConflictInfo[] = [];
    for (const d of airbnbStay) {
      if (bookingStay.has(d)) {
        conflictSet.add(d);
      }
    }

    if (conflictSet.size > 0) {
      for (const d of conflictSet) {
        const abEvent = syncedEvents.find(e => e.platform === "airbnb" && d >= e.startDate && d < e.endDate);
        const bkEvent = syncedEvents.find(e => e.platform === "booking" && d >= e.startDate && d < e.endDate);
        conflictList.push({
          date: d,
          airbnbName: abEvent?.summary || "Airbnb booking",
          bookingName: bkEvent?.summary || "Booking reservation",
        });
      }
    }

    allBookings.sort((a, b) => a.start.localeCompare(b.start));
    const dedupedBookings: typeof allBookings = [];
    for (const b of allBookings) {
      const last = dedupedBookings[dedupedBookings.length - 1];
      if (last && b.start < last.end) {
        if (b.end > last.end) last.end = b.end;
      } else {
        dedupedBookings.push({ ...b });
      }
    }

    const minStay = property.minNights || 3;
    const skipBeforeFor = new Set<number>();
    const maxBefore = Math.max(0, ...links.map(l => l.bufferBefore));
    const maxAfter = Math.max(0, ...links.map(l => l.bufferAfter));

    for (let bi = 0; bi < dedupedBookings.length - 1; bi++) {
      const b = dedupedBookings[bi];
      const next = dedupedBookings[bi + 1];

      const gapStart = addDaysStr(b.end, 1);
      const gapDays = Math.max(0, Math.ceil(
        (new Date(next.start + "T12:00:00Z").getTime() - new Date(gapStart + "T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24)
      ));
      const neededForBooking = maxAfter + minStay + maxBefore;

      if (gapDays < neededForBooking) {
        skipBeforeFor.add(bi + 1);
      }
    }

    for (let bi = 0; bi < dedupedBookings.length; bi++) {
      const b = dedupedBookings[bi];
      const prev = bi > 0 ? dedupedBookings[bi - 1] : null;
      const next = dedupedBookings[bi + 1];

      if (skipBeforeFor.has(bi)) {
        // gap too small
      } else if (bi === 0 || !prev) {
        for (let i = 1; i <= maxBefore; i++) {
          const d = addDaysStr(b.start, -i);
          if (!allBooked.has(d)) buffer.add(d);
        }
      } else {
        const gapStart = addDaysStr(prev.end, 1);
        let gapHasBooking = false;
        let d = addDaysStr(gapStart, maxAfter);
        while (d < addDaysStr(b.start, -maxBefore)) {
          if (allBooked.has(d)) { gapHasBooking = true; break; }
          d = addDaysStr(d, 1);
        }

        if (gapHasBooking) {
          for (let i = 1; i <= maxBefore; i++) {
            const dd = addDaysStr(b.start, -i);
            if (!allBooked.has(dd)) buffer.add(dd);
          }
        } else {
          for (let i = 1; i <= maxBefore; i++) {
            const dd = addDaysStr(b.start, -i);
            if (!allBooked.has(dd)) potential.add(dd);
          }
        }
      }

      for (let i = 1; i <= maxAfter; i++) {
        const d = addDaysStr(b.end, i);
        if (!allBooked.has(d)) buffer.add(d);
      }

      if (next && skipBeforeFor.has(bi + 1)) {
        const cleanEnd = addDaysStr(b.end, maxAfter + 1);
        let d = cleanEnd;
        while (d < next.start) {
          if (!allBooked.has(d) && !buffer.has(d)) unbookable.add(d);
          d = addDaysStr(d, 1);
        }
      }
    }

    // Linked-extension boundary dates: when a manual reservation has
    // linkedEventUid pointing to an adjacent iCal event, the boundary
    // day between them is for the SAME guest, so it must NOT show a
    // "needs cleaning" chip — the cleaning warning is only valid for
    // turnovers between different guests.
    const linkedBoundaryDates = new Set<string>();
    for (const res of property.reservations) {
      if (!res.linkedEventUid) continue;
      const ev = syncedEvents.find((e) => e.uid === res.linkedEventUid);
      if (!ev) continue;
      const resStart = toDateStr(new Date(res.checkIn));
      const resEnd = toDateStr(new Date(res.checkOut));
      // If the reservation's range overlaps the event's range it's a
      // "claim" of the event itself — the boundary is implicit and
      // there is no transition day to suppress.
      if (resStart < ev.endDate && resEnd > ev.startDate) continue;
      // Adjacent extensions abut at exactly one date.
      if (resEnd === ev.startDate) linkedBoundaryDates.add(resEnd);
      else if (resStart === ev.endDate) linkedBoundaryDates.add(resStart);
    }

    if (maxBefore === 0 && maxAfter === 0) {
      for (let bi = 0; bi < dedupedBookings.length; bi++) {
        const b = dedupedBookings[bi];
        const next = dedupedBookings[bi + 1];
        // After-checkout: cleaning is implied for the same day the
        // guest leaves, so b.end is a definite same-day cleaning slot.
        if (!linkedBoundaryDates.has(b.end)) {
          sameDayCleaning.add(b.end);
        }

        if (next) {
          const gapStart = addDaysStr(b.end, 1);
          const gapDays = Math.max(0, Math.ceil(
            (new Date(next.start + "T12:00:00Z").getTime() - new Date(gapStart + "T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24)
          ));
          // Pre-checkin slot. When the gap between bookings is big
          // enough that a real booking could otherwise fit there
          // (gapDays >= minStay), the cleaner has actual flexibility
          // on when to clean — could be b.end, could be any day in
          // the gap, could be next.start. We still surface a chip on
          // next.start (so the host sees "cleaning happens here") but
          // also flag it as potential so the chip picks up the dashed
          // "Cleaning?" style — symmetric to how a non-zero-buffer
          // property marks next.start - 1 as potential when the gap
          // is large. Previously the chip was a definite "Cleaning",
          // which read as "for sure" even though the host might
          // schedule the cleaning earlier in the gap.
          if (gapDays >= minStay && !linkedBoundaryDates.has(next.start)) {
            sameDayCleaning.add(next.start);
            potential.add(next.start);
          }
        }
      }
    }

    for (const d of openOverrides) {
      buffer.delete(d);
      potential.delete(d);
      unbookable.delete(d);
      sameDayCleaning.delete(d);
    }
    for (const d of closedOverrides) {
      if (!allBooked.has(d)) {
        buffer.add(d);
      }
    }
    // cleaningOverrides aren't pushed into `buffer` — they get their
    // own dedicated chip via the cleaningOverrides Set, so the host
    // can visually tell their own scheduled cleanings apart from auto
    // buffer days or generic blocks.

    return {
      airbnbDates: airbnb,
      bookingDates: booking,
      bufferDates: buffer,
      potentialDates: potential,
      unbookableDates: unbookable,
      sameDayCleaningDates: sameDayCleaning,
      conflictDates: conflictSet,
      dateToEvent: evMap,
      dateToReservation: resMap,
      conflicts: conflictList,
    };
  }, [syncedEvents, property.reservations, links, property.minNights, property.bookingWindow, openOverrides, closedOverrides]);

  const bars = useMemo(() => {
    const result: CalendarBar[] = [];
    const processed = new Set<string>();

    const allStarts = Array.from(computed.dateToEvent.keys()).sort();

    for (const start of allStarts) {
      if (processed.has(start)) continue;
      const ev = computed.dateToEvent.get(start)!;
      processed.add(start);

      let label = ev.name;
      let resId = ev.reservationId;
      const matchingResForExt = resId ? property.reservations.find(r => r.id === resId) : undefined;
      const isExtension = !!matchingResForExt?.linkedEventUid;

      if (label.includes("Reserved") || label.includes("CLOSED") || label.includes("Not available")) {
        const matchingRes = property.reservations.find(r => {
          const rStart = toDateStr(new Date(r.checkIn));
          const rEnd = toDateStr(new Date(r.checkOut));
          return rStart < ev.endDate && rEnd > ev.startDate;
        });
        if (matchingRes) {
          label = matchingRes.name;
          resId = matchingRes.id;
        } else {
          label = ev.platform === "airbnb" ? "Airbnb" : "Booking";
        }
      }

      result.push({
        startDate: ev.startDate,
        endDate: ev.endDate,
        name: label,
        platform: ev.platform,
        reservationId: resId,
        eventUid: ev.eventUid,
        linkedEventUid: ev.linkedEventUid,
        isExtension,
      });
    }

    const deduped: CalendarBar[] = [];
    for (const bar of result) {
      const existing = deduped.find(
        b => b.platform === bar.platform && b.startDate < bar.endDate && b.endDate > bar.startDate
      );
      if (existing) {
        if (bar.startDate < existing.startDate) existing.startDate = bar.startDate;
        if (bar.endDate > existing.endDate) existing.endDate = bar.endDate;
        if (bar.reservationId && !existing.reservationId) {
          existing.name = bar.name;
          existing.reservationId = bar.reservationId;
        }
        if (bar.eventUid && !existing.eventUid) {
          existing.eventUid = bar.eventUid;
        }
        if (bar.linkedEventUid && !existing.linkedEventUid) {
          existing.linkedEventUid = bar.linkedEventUid;
        }
      } else {
        deduped.push({ ...bar });
      }
    }

    // Pair linked bars: a manual reservation that has linkedEventUid
    // pointing to an iCal event becomes a separate bar (no overlap), so
    // here we cross-reference to mark which side of each abuts a
    // linked partner. The renderer uses these flags to drop the inner
    // rounding + 2 px gap between the pair so it reads as one stay.
    const eventUidToBar = new Map<string, CalendarBar>();
    for (const bar of deduped) {
      if (bar.eventUid) eventUidToBar.set(bar.eventUid, bar);
    }
    for (const bar of deduped) {
      if (!bar.linkedEventUid) continue;
      const partner = eventUidToBar.get(bar.linkedEventUid);
      if (!partner || partner === bar) continue;
      if (bar.endDate === partner.startDate) {
        // bar abuts before partner
        bar.linkedAfter = true;
        partner.linkedBefore = true;
      } else if (bar.startDate === partner.endDate) {
        // bar abuts after partner
        bar.linkedBefore = true;
        partner.linkedAfter = true;
      }
    }

    return deduped;
  }, [computed.dateToEvent, property.reservations]);

  return {
    airbnbDates: computed.airbnbDates,
    bookingDates: computed.bookingDates,
    bufferDates: computed.bufferDates,
    potentialDates: computed.potentialDates,
    unbookableDates: computed.unbookableDates,
    sameDayCleaningDates: computed.sameDayCleaningDates,
    cleaningOverrides,
    conflictDates: computed.conflictDates,
    conflicts: computed.conflicts,
    bars,
    openOverrides,
    closedOverrides,
    dateToReservation: computed.dateToReservation,
  };
}
