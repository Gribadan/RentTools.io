"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import type { Property, Reservation, CalendarLink, DateOverride } from "@/lib/types";
import { bookingWindowCutoff } from "@/lib/types";
import { useI18n } from "@/lib/i18n/context";
import { DateActionsPopover, type DateStatus, type ExtendableBooking } from "@/components/date-actions-popover";

interface CalendarEvent {
  id: number;
  platform: string;
  uid: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface PropertyCalendarProps {
  property: Property;
  onSelectReservation: (id: number) => void;
  onAddReservation: (data: {
    name: string;
    checkIn: string;
    checkOut: string;
    platform: string;
    propertyId: number;
  }) => void;
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

interface DayInfo {
  date: string;
  airbnb: boolean;
  booking: boolean;
  buffer: boolean;
  reservation: Reservation | null;
  barLabel: string | null;
  barPlatform: string | null;
  barIsStart: boolean;
  barSpan: number;
  reservationId: number | null;
}

export function PropertyCalendar({
  property,
  onSelectReservation,
  onAddReservation,
}: PropertyCalendarProps) {
  const { t, locale } = useI18n();
  const [monthOffset, setMonthOffset] = useState(0);
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>([]);
  const [links, setLinks] = useState<CalendarLink[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [overrideMode, setOverrideMode] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchOverrides = async () => {
    const res = await fetch(`/api/date-overrides?propertyId=${property.id}`);
    const data = await res.json();
    setOverrides(data || []);
  };

  const refetchCalendarData = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const [syncData, linksData, overridesData] = await Promise.all([
        fetch(`/api/calendar/sync?propertyId=${property.id}&limit=200`).then(r => r.json()),
        fetch(`/api/calendar/links?propertyId=${property.id}`).then(r => r.json()),
        fetch(`/api/date-overrides?propertyId=${property.id}`).then(r => r.json()),
      ]);
      setSyncedEvents(syncData.events || []);
      setLinks(linksData || []);
      setOverrides(overridesData || []);
    } catch {
      // ignore
    } finally {
      setLoadingEvents(false);
    }
  }, [property.id]);

  useEffect(() => {
    refetchCalendarData();
  }, [refetchCalendarData]);

  const handleSyncNow = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await fetch("/api/calendar/sync", { method: "POST" });
      await refetchCalendarData();
    } catch {
      // ignore
    } finally {
      setSyncing(false);
    }
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentMonth = useMemo(() => {
    return new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  }, [today, monthOffset]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = currentMonth.toLocaleDateString(locale === "ru" ? "ru-RU" : "en", { month: "long", year: "numeric" });

  const syncHealth = useMemo(() => {
    if (!links || links.length === 0) return null;
    const errored = links.find(l => l.lastError);
    const lastFetchedTimes = links
      .map(l => l.lastFetchedAt ? new Date(l.lastFetchedAt).getTime() : 0)
      .filter(t => t > 0);
    const lastFetched = lastFetchedTimes.length > 0 ? Math.max(...lastFetchedTimes) : 0;
    if (errored) {
      return { ok: false, message: errored.lastError || "Sync error" };
    }
    if (!lastFetched) {
      return { ok: false, message: locale === "ru" ? "Не синхронизировано" : "Never synced" };
    }
    const diffMs = Date.now() - lastFetched;
    const m = Math.round(diffMs / 60000);
    let label: string;
    if (m < 1) label = locale === "ru" ? "только что" : "just now";
    else if (m < 60) label = locale === "ru" ? `${m} мин. назад` : `${m}m ago`;
    else {
      const h = Math.round(m / 60);
      if (h < 24) label = locale === "ru" ? `${h} ч. назад` : `${h}h ago`;
      else label = locale === "ru" ? `${Math.round(h / 24)} дн. назад` : `${Math.round(h / 24)}d ago`;
    }
    return { ok: true, message: locale === "ru" ? `Синхр. ${label}` : `Synced ${label}` };
  }, [links, locale]);
  let firstDayOffset = new Date(year, month, 1).getDay() - 1;
  if (firstDayOffset < 0) firstDayOffset = 6;
  // Stable key for forcing React to remount the grid on month change
  const monthKey = `${year}-${month}`;

  // Build override lookup maps
  const { openOverrides, closedOverrides } = useMemo(() => {
    const open = new Set<string>();
    const closed = new Set<string>();
    for (const o of overrides) {
      if (o.type === "open") open.add(o.date);
      else if (o.type === "closed") closed.add(o.date);
    }
    return { openOverrides: open, closedOverrides: closed };
  }, [overrides]);

  // Build date sets for each platform + conflict detection + smart buffers
  const { airbnbDates, bookingDates, bufferDates, potentialDates, unbookableDates, sameDayCleaningDates, conflictDates, dateToEvent, dateToReservation, conflicts } = useMemo(() => {
    const airbnb = new Set<string>();
    const booking = new Set<string>();
    const buffer = new Set<string>();      // definite cleaning days
    const sameDayCleaning = new Set<string>(); // buffer=0 checkout-day cleanings (shown on booked cells)
    const potential = new Set<string>();   // potential cleaning (if gap gets booked)
    const unbookable = new Set<string>(); // gap too short for min nights
    const conflictSet = new Set<string>();
    const evMap = new Map<string, { name: string; platform: string; startDate: string; endDate: string; reservationId?: number }>();
    const resMap = new Map<string, Reservation>();
    const allBooked = new Set<string>(); // all booked dates regardless of platform
    // Separate sets for conflict detection — exclusive end (no checkout day)
    const airbnbStay = new Set<string>();
    const bookingStay = new Set<string>();

    // Collect all bookings as ranges
    const allBookings: { start: string; end: string; platform: string; name: string }[] = [];

    // Booking window cutoff — ignore events starting beyond this date
    const cutoff = bookingWindowCutoff(property.bookingWindow || 365);

    // Synced calendar events
    for (const ev of syncedEvents) {
      if (ev.startDate >= cutoff) continue; // beyond booking window
      const platform = ev.platform;
      const dates = platform === "airbnb" ? airbnb : booking;
      const stayDates = platform === "airbnb" ? airbnbStay : bookingStay;
      // Visual: include checkout day (guest's day until noon)
      let d = ev.startDate;
      while (d <= ev.endDate) {
        dates.add(d);
        allBooked.add(d);
        d = addDaysStr(d, 1);
      }
      // Conflict detection: exclusive end (checkout day is NOT a stay conflict)
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
        });
      }
      // For buffer calculation:
      // - Booking.com labels ALL events "CLOSED - Not available" (even real guest bookings)
      //   so we treat ALL Booking events as real
      // - Airbnb distinguishes: "Reserved" = real booking, "Not available" = host block
      //   so we only skip Airbnb "Not available" / "Blocked" events
      const isAirbnbBlock = platform === "airbnb" && (
        ev.summary.includes("Not available") || ev.summary.includes("Blocked")
      );
      if (!isAirbnbBlock) {
        allBookings.push({ start: ev.startDate, end: ev.endDate, platform, name: ev.summary });
      }
    }

    // Internal reservations
    // The platform (synced iCal) is the source of truth for DATES.
    // Internal reservations only contribute name + reservationId for guest data linking.
    // If the internal reservation overlaps any synced event, we attach its name/id to that event.
    // If no synced event overlaps, the internal reservation is shown as its own bar.
    for (const res of property.reservations) {
      const start = toDateStr(new Date(res.checkIn));
      const end = toDateStr(new Date(res.checkOut));
      const platform = res.platform || "airbnb";

      // Try to find a synced event on the same platform that overlaps this reservation.
      // Strict overlap: shared stay dates (exclusive checkout on both sides).
      let matchingEventStart: string | null = null;
      for (const [evStart, ev] of evMap) {
        if (ev.platform !== platform) continue;
        // Strict overlap: ev.startDate < end AND ev.endDate > start
        if (ev.startDate < end && ev.endDate > start) {
          matchingEventStart = evStart;
          break;
        }
      }

      if (matchingEventStart) {
        // Attach reservation name + id to the existing synced event — don't change dates.
        const ev = evMap.get(matchingEventStart)!;
        evMap.set(matchingEventStart, {
          ...ev,
          name: res.name,
          reservationId: res.id,
        });
        // Map all the event's dates to this reservation for click handling
        let d = ev.startDate;
        while (d <= ev.endDate) {
          resMap.set(d, res);
          d = addDaysStr(d, 1);
        }
      } else {
        // No matching synced event — show the reservation as its own bar.
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
        });
        allBookings.push({ start, end, platform, name: res.name });
      }
    }

    // Detect conflicts: dates where BOTH platforms have a guest staying overnight.
    // Uses strict stay sets (exclusive of checkout day) — checkout day of one platform
    // matching checkin day of another is a valid back-to-back turnover, NOT a conflict.
    const conflictList: { date: string; airbnbName: string; bookingName: string }[] = [];
    for (const d of airbnbStay) {
      if (bookingStay.has(d)) {
        conflictSet.add(d);
      }
    }

    // Build conflict descriptions
    if (conflictSet.size > 0) {
      // Find the booking names for each conflicting date
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

    // Buffer and unbookable gap calculation
    // Rule: if someone CAN book between two reservations → 2 cleanings (after + before)
    //        if nobody can book (gap too small) → 1 cleaning only, rest unbookable

    // Deduplicate allBookings by date range (synced events + internal reservations can overlap)
    // Strict overlap: back-to-back bookings (checkout day = next checkin day) are NOT merged.
    allBookings.sort((a, b) => a.start.localeCompare(b.start));
    const dedupedBookings: typeof allBookings = [];
    for (const b of allBookings) {
      const last = dedupedBookings[dedupedBookings.length - 1];
      if (last && b.start < last.end) {
        // Strict overlap — merge by extending end date
        if (b.end > last.end) last.end = b.end;
      } else {
        dedupedBookings.push({ ...b });
      }
    }

    const minStay = property.minNights || 3;
    const skipBeforeFor = new Set<number>();
    // Use max buffer across all links for gap calculation
    const maxBefore = Math.max(0, ...links.map(l => l.bufferBefore));
    const maxAfter = Math.max(0, ...links.map(l => l.bufferAfter));

    // First pass: determine which gaps are bookable
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

    // Second pass: add buffers, potential cleaning, and unbookable markers
    for (let bi = 0; bi < dedupedBookings.length; bi++) {
      const b = dedupedBookings[bi];
      const prev = bi > 0 ? dedupedBookings[bi - 1] : null;
      const next = dedupedBookings[bi + 1];

      // Buffer before
      if (skipBeforeFor.has(bi)) {
        // Gap too small → no cleaning before (handled as unbookable)
      } else if (bi === 0 || !prev) {
        // First booking → definite cleaning before
        for (let i = 1; i <= maxBefore; i++) {
          const d = addDaysStr(b.start, -i);
          if (!allBooked.has(d)) buffer.add(d);
        }
      } else {
        // Gap is bookable — check if anyone actually booked in the gap
        const gapStart = addDaysStr(prev.end, 1);
        let gapHasBooking = false;
        let d = addDaysStr(gapStart, maxAfter); // skip cleaning after prev
        while (d < addDaysStr(b.start, -maxBefore)) { // before cleaning before current
          if (allBooked.has(d)) { gapHasBooking = true; break; }
          d = addDaysStr(d, 1);
        }

        if (gapHasBooking) {
          // Someone booked the gap → definite cleaning before
          for (let i = 1; i <= maxBefore; i++) {
            const dd = addDaysStr(b.start, -i);
            if (!allBooked.has(dd)) buffer.add(dd);
          }
        } else {
          // Gap is empty → potential cleaning (might be needed if booked)
          for (let i = 1; i <= maxBefore; i++) {
            const dd = addDaysStr(b.start, -i);
            if (!allBooked.has(dd)) potential.add(dd);
          }
        }
      }

      // Buffer after (always definite — guest just left, must clean)
      for (let i = 1; i <= maxAfter; i++) {
        const d = addDaysStr(b.end, i);
        if (!allBooked.has(d)) buffer.add(d);
      }

      // Mark unbookable gap days
      if (next && skipBeforeFor.has(bi + 1)) {
        const cleanEnd = addDaysStr(b.end, maxAfter + 1);
        let d = cleanEnd;
        while (d < next.start) {
          if (!allBooked.has(d) && !buffer.has(d)) unbookable.add(d);
          d = addDaysStr(d, 1);
        }
      }
    }

    // Buffer=0 case: put cleaning on the checkout day itself (same-day cleaning)
    // and potential cleaning on any bookable gaps.
    if (maxBefore === 0 && maxAfter === 0) {
      for (let bi = 0; bi < dedupedBookings.length; bi++) {
        const b = dedupedBookings[bi];
        const next = dedupedBookings[bi + 1];
        // Always mark checkout day as a cleaning day
        sameDayCleaning.add(b.end);

        // Potential cleaning for bookable gaps
        if (next) {
          const gapStart = addDaysStr(b.end, 1);
          const gapDays = Math.max(0, Math.ceil(
            (new Date(next.start + "T12:00:00Z").getTime() - new Date(gapStart + "T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24)
          ));
          if (gapDays >= minStay) {
            // Hypothetical gap guest would check out on next.start (same-day turnover)
            sameDayCleaning.add(next.start);
          }
        }
      }
    }

    // Apply manual overrides
    // "open" overrides: remove date from buffer/potential/unbookable (force available)
    for (const d of openOverrides) {
      buffer.delete(d);
      potential.delete(d);
      unbookable.delete(d);
      sameDayCleaning.delete(d);
    }
    // "closed" overrides: add to buffer set if not already booked (force blocked)
    for (const d of closedOverrides) {
      if (!allBooked.has(d)) {
        buffer.add(d);
      }
    }

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
  }, [syncedEvents, property.reservations, links, property.minNights, openOverrides, closedOverrides]);

  // Build bars (continuous booking spans) for rendering
  const bars = useMemo(() => {
    const result: { startDate: string; endDate: string; name: string; platform: string; reservationId?: number; isExtension?: boolean }[] = [];
    const processed = new Set<string>();

    // Collect all event start dates, sorted
    const allStarts = Array.from(dateToEvent.keys()).sort();

    for (const start of allStarts) {
      if (processed.has(start)) continue;
      const ev = dateToEvent.get(start)!;
      processed.add(start);

      // Check if a reservation matches this date range — use its name
      let label = ev.name;
      let resId = ev.reservationId;
      // Mark as extension if the reservation at this start is linked to a synced event
      const matchingRes = resId ? property.reservations.find(r => r.id === resId) : undefined;
      const isExtension = !!matchingRes?.linkedEventUid;

      // Clean up "Reserved" / "CLOSED - Not available" etc
      if (label.includes("Reserved") || label.includes("CLOSED") || label.includes("Not available")) {
        // Try to find a matching reservation — STRICT overlap (shared stay dates)
        const matchingRes = property.reservations.find(r => {
          const rStart = toDateStr(new Date(r.checkIn));
          const rEnd = toDateStr(new Date(r.checkOut));
          return rStart < ev.endDate && rEnd > ev.startDate;
        });
        if (matchingRes) {
          label = matchingRes.name;
          resId = matchingRes.id;
        } else {
          // Show platform name instead of generic "Reserved"
          label = ev.platform === "airbnb" ? "Airbnb" : "Booking";
        }
      }

      result.push({
        startDate: ev.startDate,
        endDate: ev.endDate,
        name: label,
        platform: ev.platform,
        reservationId: resId,
        isExtension,
      });
    }

    // Deduplicate: merge STRICTLY overlapping bars on same platform.
    // Back-to-back bookings (checkout day = next checkin day) are NOT merged —
    // they are different guests. Strict overlap: shared stay dates.
    const deduped: typeof result = [];
    for (const bar of result) {
      const existing = deduped.find(
        b => b.platform === bar.platform && b.startDate < bar.endDate && b.endDate > bar.startDate
      );
      if (existing) {
        // Merge — extend existing bar
        if (bar.startDate < existing.startDate) existing.startDate = bar.startDate;
        if (bar.endDate > existing.endDate) existing.endDate = bar.endDate;
        // Prefer named reservation over generic
        if (bar.reservationId && !existing.reservationId) {
          existing.name = bar.name;
          existing.reservationId = bar.reservationId;
        }
      } else {
        deduped.push({ ...bar });
      }
    }

    return deduped;
  }, [dateToEvent, property.reservations]);

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
    // Pad last week to 7 days
    if (result.length > 0) {
      while (result[result.length - 1].length < 7) result[result.length - 1].push(null);
    }
    return result;
  }, [firstDayOffset, daysInMonth]);

  // Parse "HH:MM" to a percentage of the day (0-100)
  const timeToPercent = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return ((h * 60 + (m || 0)) / 1440) * 100;
  };

  const checkInPct = timeToPercent(property.checkInTime || "14:00");
  const checkOutPct = timeToPercent(property.checkOutTime || "12:00");

  // Returns true if any bar covers this day (any segment, any time)
  const hasBarOnDay = (dayNum: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return bars.some(b => ds >= b.startDate && ds <= b.endDate);
  };

  // Returns ALL bar segments that should be rendered starting on this cell.
  // A "segment" is the portion of a bar visible in a single week row.
  // Same-day turnover (checkout day = next checkin day) returns 2 segments.
  interface BarSegment {
    startDate: string;
    endDate: string;
    name: string;
    platform: string;
    reservationId?: number;
    isExtension?: boolean; // direct-pay extension linked to a synced event
    span: number;          // cells covered in this week row (1..7)
    leftPct: number;       // % from left of first cell (0 for continuation, checkInPct for actual start)
    rightMarginPct: number; // % from right of last cell (0 if continues, 100-checkOutPct for actual end)
    showLabel: boolean;
  }

  const segmentsForDay = (dayNum: number): BarSegment[] => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const dow = new Date(year, month, dayNum).getDay();
    const isMonday = dow === 1;
    const segments: BarSegment[] = [];

    for (const bar of bars) {
      const isActualStart = ds === bar.startDate;
      const isMondayContinuation = isMonday && ds > bar.startDate && ds <= bar.endDate;
      // Month-boundary continuation: day 1 of the month, bar started in a previous month
      const isMonthContinuation = dayNum === 1 && bar.startDate < ds && bar.endDate >= ds;
      if (!isActualStart && !isMondayContinuation && !isMonthContinuation) continue;

      // Compute span: from this cell to min(endDate, Sunday of this week)
      let span = 0;
      let lastDay = dayNum;
      for (let d = dayNum; d <= daysInMonth; d++) {
        const dds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (dds > bar.endDate) break;
        span++;
        lastDay = d;
        if (new Date(year, month, d).getDay() === 0) break; // stop at Sunday
      }
      if (span === 0) continue;

      const lastDds = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      const reachesEnd = lastDds === bar.endDate;

      segments.push({
        ...bar,
        span,
        leftPct: isActualStart ? checkInPct : 0,
        rightMarginPct: reachesEnd ? 100 - checkOutPct : 0,
        showLabel: isActualStart,
      });
    }

    return segments;
  };

  // Agenda — all upcoming events
  const agenda = useMemo(() => {
    const todayStr = toDateStr(today);
    return bars
      .filter(b => b.endDate >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [bars, today]);

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString(locale === "ru" ? "ru-RU" : "en-GB", { day: "2-digit", month: "short" });

  const dayCount = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Popover state: when user clicks a date in edit mode, show actions
  const [popoverDate, setPopoverDate] = useState<string | null>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<DOMRect | null>(null);

  const openDateActions = (dateStr: string, rect: DOMRect) => {
    if (!overrideMode) return;
    setPopoverDate(dateStr);
    setPopoverAnchor(rect);
  };

  const closePopover = () => {
    setPopoverDate(null);
    setPopoverAnchor(null);
  };

  // Compute extendable bookings for a given date: any booking whose start is date+1 (extending before)
  // or whose end is date-1 (extending after).
  const getExtendableBookings = (dateStr: string): ExtendableBooking[] => {
    const result: ExtendableBooking[] = [];
    const dayBefore = addDaysStr(dateStr, -1);
    const dayAfter = addDaysStr(dateStr, 1);

    // Check synced events
    for (const ev of syncedEvents) {
      // Skip "Not available" / "Blocked" — those are host blocks, not guest bookings
      const isBlock = ev.platform === "airbnb" && (ev.summary.includes("Not available") || ev.summary.includes("Blocked"));
      if (isBlock) continue;
      // Use endDate exclusive (iCal semantic): event covers [startDate, endDate) as stay; endDate is checkout day
      if (ev.startDate === dayAfter) {
        // User's date is the day before the event starts — extending before
        result.push({
          name: ev.summary || (ev.platform === "airbnb" ? "Airbnb" : "Booking"),
          platform: ev.platform,
          eventUid: ev.uid,
          side: "before",
        });
      }
      // End date is exclusive (checkout day) — so event "ends" at endDate. Extending after means our date >= endDate
      if (ev.endDate === dateStr) {
        result.push({
          name: ev.summary || (ev.platform === "airbnb" ? "Airbnb" : "Booking"),
          platform: ev.platform,
          eventUid: ev.uid,
          side: "after",
        });
      }
    }

    // Also check internal reservations (people may want to extend them too)
    for (const res of property.reservations) {
      const rStart = toDateStr(new Date(res.checkIn));
      const rEnd = toDateStr(new Date(res.checkOut));
      if (rStart === dayAfter) {
        result.push({ name: res.name, platform: res.platform, side: "before" });
      }
      if (rEnd === dateStr) {
        result.push({ name: res.name, platform: res.platform, side: "after" });
      }
    }

    return result;
  };

  const setOverride = async (dateStr: string, type: "open" | "closed") => {
    await fetch(`/api/date-overrides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, date: dateStr, type }),
    });
    await fetchOverrides();
    closePopover();
  };

  const deleteOverride = async (dateStr: string) => {
    await fetch(`/api/date-overrides?propertyId=${property.id}&date=${dateStr}`, {
      method: "DELETE",
    });
    await fetchOverrides();
    closePopover();
  };

  const extendBooking = async (dateStr: string, booking: ExtendableBooking) => {
    // Create an internal reservation for this single day, linked to the event if provided.
    const checkIn = dateStr;
    const checkOut = booking.side === "before" ? addDaysStr(dateStr, 1) : addDaysStr(dateStr, 1);
    await fetch(`/api/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: booking.name,
        checkIn,
        checkOut,
        platform: booking.platform,
        propertyId: property.id,
        linkedEventUid: booking.eventUid,
      }),
    });
    closePopover();
    // Note: property data will be refreshed by parent on reservation change
    window.location.reload(); // simplest refresh; proper solution would use a callback prop
  };

  const [exportCopied, setExportCopied] = useState(false);

  const handleExport = () => {
    const lines: string[] = [];
    lines.push(`=== CALENDAR EXPORT: ${property.name} ===`);
    lines.push(`Date: ${new Date().toISOString()}`);
    lines.push(`Month: ${monthLabel}`);
    lines.push("");

    // Internal reservations
    lines.push(`--- INTERNAL RESERVATIONS (${property.reservations.length}) ---`);
    for (const res of [...property.reservations].sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())) {
      const s = toDateStr(new Date(res.checkIn));
      const e = toDateStr(new Date(res.checkOut));
      lines.push(`[${res.platform?.toUpperCase()}] ${s} → ${e} | ${res.name} | ${res._count?.guests || 0} guests`);
    }
    lines.push("");

    // Synced events
    const futureEvents = syncedEvents.filter(e => e.endDate >= toDateStr(today)).sort((a, b) => a.startDate.localeCompare(b.startDate));
    lines.push(`--- SYNCED CALENDAR EVENTS (${futureEvents.length} future) ---`);
    for (const ev of futureEvents) {
      lines.push(`[${ev.platform.toUpperCase()}] ${ev.startDate} → ${ev.endDate} | ${ev.summary} | UID: ${ev.uid}`);
    }
    lines.push("");

    // Calendar links
    lines.push(`--- CALENDAR LINKS (${links.length}) ---`);
    for (const link of links) {
      lines.push(`[${link.platform.toUpperCase()}] URL: ${link.icalExportUrl}`);
      lines.push(`  Buffer: ${link.bufferBefore}d before, ${link.bufferAfter}d after | Last sync: ${link.lastFetchedAt || "never"} | Error: ${link.lastError || "none"}`);
    }
    lines.push("");

    // Bars (what the calendar shows)
    lines.push(`--- CALENDAR BARS (visible) ---`);
    for (const bar of [...bars].sort((a, b) => a.startDate.localeCompare(b.startDate))) {
      lines.push(`[${bar.platform.toUpperCase()}] ${bar.startDate} → ${bar.endDate} | "${bar.name}" | resId: ${bar.reservationId || "none"}`);
    }
    lines.push("");

    // Cleaning days (exported to platforms)
    const sortedBuffers = Array.from(bufferDates).sort();
    lines.push(`--- CLEANING DAYS (${sortedBuffers.length}) — exported to platforms ---`);
    lines.push(sortedBuffers.join(", ") || "none");
    lines.push("");

    // Potential cleaning days
    const sortedPotential = Array.from(potentialDates).sort();
    lines.push(`--- POTENTIAL CLEANING DAYS (${sortedPotential.length}) — if gap gets booked ---`);
    lines.push(sortedPotential.join(", ") || "none");
    lines.push("");

    // Unbookable gap days (visual only, NOT exported)
    const sortedUnbookable = Array.from(unbookableDates).sort();
    lines.push(`--- UNBOOKABLE GAP DAYS (${sortedUnbookable.length}) — visual only, <${property.minNights || 3} nights ---`);
    lines.push(sortedUnbookable.join(", ") || "none");
    lines.push("");

    // Conflicts
    lines.push(`--- CONFLICTS (${conflicts.length} days) ---`);
    if (conflicts.length > 0) {
      for (const c of conflicts) {
        lines.push(`⚠ ${c.date} | Airbnb: ${c.airbnbName} | Booking: ${c.bookingName}`);
      }
    } else {
      lines.push("No conflicts detected");
    }
    lines.push("");
    lines.push(`=== END EXPORT ===`);

    navigator.clipboard.writeText(lines.join("\n"));
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-[#e8e8ec]">{property.name}</h1>
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              title={locale === "ru" ? "Синхронизировать сейчас" : "Sync now"}
              className="rounded-md p-1.5 text-[#a0a0a8] transition-colors hover:bg-[#1e1e22] hover:text-[#e8e8ec] disabled:opacity-50"
            >
              <svg className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
          <p className="mt-0.5 text-sm text-[#a0a0a8]">
            {property.reservations.length} {locale === "ru" ? "бронирований" : (property.reservations.length !== 1 ? "reservations" : "reservation")}
          </p>
          {syncHealth && (
            <div
              className="mt-1 flex items-center gap-1.5 text-xs"
              title={syncHealth.ok ? syncHealth.message : `${locale === "ru" ? "Ошибка синхронизации:" : "Sync error:"} ${syncHealth.message}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${syncHealth.ok ? "bg-[#34d399]" : "bg-[#f87171]"}`} />
              <span className={syncHealth.ok ? "text-[#71717a]" : "text-[#f87171]"}>
                {syncHealth.ok ? syncHealth.message : `${locale === "ru" ? "Ошибка синхр.:" : "Sync error:"} ${syncHealth.message.slice(0, 60)}`}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setOverrideMode(!overrideMode)}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
              overrideMode
                ? "border-[#da3633] bg-[#da3633]/10 text-[#ef4444] hover:bg-[#da3633]/20"
                : "border-[#333338] bg-[#27272b] text-[#d4d4d8] hover:bg-[#333338]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            {overrideMode ? t("calendar.doneEditing") : t("calendar.editDates")}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-md border border-[#333338] bg-[#27272b] px-3 py-2 text-sm text-[#d4d4d8] transition-colors hover:bg-[#333338]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            {exportCopied ? t("common.copied") : t("calendar.export")}
          </button>
          <button
            onClick={() => {
              const name = prompt(t("calendar.guestNamePrompt"));
              if (name) {
                onAddReservation({
                  name,
                  checkIn: toDateStr(today),
                  checkOut: toDateStr(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4)),
                  platform: "airbnb",
                  propertyId: property.id,
                });
              }
            }}
            className="flex items-center gap-1.5 rounded-md bg-[#ff385c] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#e0294d]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("calendar.newReservation")}
          </button>
        </div>
      </div>

      {/* Conflict warnings */}
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#ef4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm font-semibold text-[#ef4444]">
              {t("calendar.doubleBooking")} ({new Set(conflicts.map(c => c.date)).size} {locale === "ru" ? "дн." : (new Set(conflicts.map(c => c.date)).size !== 1 ? "days" : "day")})
            </span>
          </div>
          <p className="text-xs text-[#ef4444]/80">
            {t("calendar.overlapWarning")}
          </p>
          <div className="space-y-1">
            {Array.from(new Set(conflicts.map(c => c.date))).slice(0, 5).map(d => (
              <p key={d} className="text-xs text-[#d4d4d8]">
                <span className="text-[#ef4444] font-medium">{d}</span>
                {" — "}{t("calendar.airbnbBookingOverlap")}
              </p>
            ))}
            {new Set(conflicts.map(c => c.date)).size > 5 && (
              <p className="text-xs text-[#71717a]">...{t("calendar.andMore", { n: new Set(conflicts.map(c => c.date)).size - 5 })}</p>
            )}
          </div>
        </div>
      )}

      {/* Override mode banner */}
      {overrideMode && (
        <div className="rounded-lg border border-[#da3633]/30 bg-[#da3633]/5 p-3 flex items-center gap-3">
          <svg className="h-5 w-5 text-[#ef4444] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-[#e8e8ec]">{t("calendar.overrideMode")}</p>
            <p className="text-xs text-[#a0a0a8]">
              {t("calendar.overrideDesc")}
            </p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className={`rounded-lg border bg-[#18181b] overflow-hidden ${overrideMode ? "border-[#da3633]/30" : "border-[#27272b]"}`}>
        {/* Month nav */}
        <div className="flex items-center justify-between border-b border-[#27272b] px-4 py-3">
          <button onClick={() => setMonthOffset(o => o - 1)} className="rounded-md p-1.5 text-[#a0a0a8] hover:bg-[#1e1e22] hover:text-[#e8e8ec]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[#e8e8ec]">{monthLabel}</h2>
            {loadingEvents && (
              <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-[#30363d] border-t-[#58a6ff]" />
            )}
            {monthOffset !== 0 && (
              <button onClick={() => setMonthOffset(0)} className="rounded px-2 py-0.5 text-xs text-[#e8e8ec] hover:bg-[#e8e8ec]/10">{t("calendar.today")}</button>
            )}
          </div>
          <button onClick={() => setMonthOffset(o => o + 1)} className="rounded-md p-1.5 text-[#a0a0a8] hover:bg-[#1e1e22] hover:text-[#e8e8ec]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 border-b border-[#27272b] px-4 py-2">
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#ff385c]" /><span className="text-xs text-[#a0a0a8]">{t("calendar.airbnb")}</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#003580]" /><span className="text-xs text-[#a0a0a8]">{t("calendar.booking")}</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#fbbf24]/30 border border-[#fbbf24]/40" /><span className="text-xs text-[#a0a0a8]">{t("calendar.cleaning")}</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#e8e8ec]/15 border border-[#e8e8ec]/25 border-dashed" /><span className="text-xs text-[#a0a0a8]">{t("calendar.potentialCleaning")}</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#71717a]/15 border border-[#71717a]/20 border-dashed" /><span className="text-xs text-[#a0a0a8]">&lt;{property.minNights || 3}n</span></div>
          {(openOverrides.size > 0 || closedOverrides.size > 0) && (
            <>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#34d399]/15 border-2 border-[#34d399]/50" /><span className="text-xs text-[#a0a0a8]">{t("calendar.forcedOpen")}</span></div>
              <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#ef4444]/15 border-2 border-[#ef4444]/50" /><span className="text-xs text-[#a0a0a8]">{t("calendar.forcedClosed")}</span></div>
            </>
          )}
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[#27272b]">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="py-2 text-center text-xs font-medium text-[#71717a]">{wd}</div>
          ))}
        </div>

        {/* Grid */}
        <div key={monthKey}>
        {weeks.map((week, wi) => (
          <div key={`${monthKey}-w${wi}`} className="grid grid-cols-7 border-b border-[#27272b] last:border-b-0">
            {week.map((dayNum, di) => {
              if (dayNum === null) {
                return <div key={`c-${di}`} className="h-14" />;
              }
              const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();
              const isConflict = conflictDates.has(ds);
              const segments = segmentsForDay(dayNum);
              const hasBar = hasBarOnDay(dayNum);
              const isBuffer = bufferDates.has(ds) && !hasBar;
              const isPotential = potentialDates.has(ds) && !hasBar && !isBuffer;
              const isUnbookable = unbookableDates.has(ds) && !hasBar && !isBuffer && !isPotential;
              const isSameDayCleaning = sameDayCleaningDates.has(ds);
              const isOpen = openOverrides.has(ds);
              const isClosed = closedOverrides.has(ds);
              const bg = isOpen ? "bg-[#34d399]/8"
                : isClosed ? "bg-[#ef4444]/8"
                : isConflict ? "bg-[#ef4444]/8"
                : isToday ? "bg-[#e8e8ec]/5"
                : isBuffer ? "bg-[#fbbf24]/5"
                : isPotential ? "bg-[#e8e8ec]/3"
                : isUnbookable ? "bg-[#71717a]/5"
                : "";

              const showMiddleIndicator = !hasBar && (isBuffer || isPotential || isUnbookable || (isOpen && !hasBar) || (isClosed && !isBuffer) || (isConflict && !isOpen && !isClosed));
              return (
                <div
                  key={`c-${dayNum}`}
                  onClick={(e) => {
                    if (overrideMode) openDateActions(ds, (e.currentTarget as HTMLElement).getBoundingClientRect());
                  }}
                  className={`relative h-16 border-r border-[#27272b] last:border-r-0 ${bg} ${
                    overrideMode ? "cursor-pointer hover:bg-[#1e1e22]" : ""
                  } ${isOpen ? "ring-1 ring-inset ring-[#34d399]/40" : ""} ${isClosed ? "ring-1 ring-inset ring-[#ef4444]/40" : ""}`}
                >
                  {/* Day number — top-left */}
                  <div className="absolute top-1 left-1.5 z-20 pointer-events-none">
                    <span className={`text-xs leading-none ${
                      isConflict ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ef4444] text-white font-semibold"
                      : isToday ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#e8e8ec] text-white font-semibold"
                      : isOpen ? "text-[#34d399] font-semibold"
                      : isClosed ? "text-[#ef4444] font-semibold"
                      : "text-[#71717a]"
                    }`}>{dayNum}</span>
                  </div>

                  {/* Middle indicator (days without bar) */}
                  {showMiddleIndicator && (
                    <div className="absolute left-0 right-0 top-7 flex items-center justify-center px-0.5 pointer-events-none">
                      {isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#34d399] bg-[#34d399]/10 border border-[#34d399]/20 font-medium">{t("calendar.open")}</div>
                      )}
                      {isClosed && !isBuffer && !isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 font-medium">{t("calendar.closed")}</div>
                      )}
                      {isConflict && !isOpen && !isClosed && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 font-medium">{t("calendar.conflict")}</div>
                      )}
                      {isBuffer && !isOpen && !isClosed && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#fbbf24] bg-[#fbbf24]/8 border border-[#fbbf24]/15">{t("calendar.cleaning")}</div>
                      )}
                      {isBuffer && isClosed && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 font-medium">{t("calendar.closed")}</div>
                      )}
                      {isPotential && !isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#e8e8ec]/70 bg-[#e8e8ec]/5 border border-[#e8e8ec]/15 border-dashed">{t("calendar.cleaningQ")}</div>
                      )}
                      {isUnbookable && !isOpen && (
                        <div className="rounded px-1 h-5 flex items-center text-[10px] text-[#71717a] bg-[#71717a]/8 border border-[#71717a]/15 border-dashed">&lt;{property.minNights || 3}n</div>
                      )}
                    </div>
                  )}

                  {/* Booking bars — fixed position below day number */}
                  {segments.map((seg, si) => (
                    <div
                      key={`seg-${si}-${seg.startDate}`}
                      onClick={(e) => { e.stopPropagation(); seg.reservationId && onSelectReservation(seg.reservationId); }}
                      className={`absolute top-7 h-5 flex items-center rounded px-2 text-[11px] font-medium text-white/90 truncate ${
                        isConflict ? "bg-[#ef4444] ring-1 ring-[#ef4444]/40" :
                        seg.platform === "booking"
                          ? "bg-[#003580]"
                          : "bg-[#ff385c]"
                      } ${seg.reservationId ? "cursor-pointer hover:brightness-110" : ""} ${seg.isExtension ? "ring-1 ring-white/30 ring-dashed" : ""}`}
                      style={{
                        left: `${seg.leftPct}%`,
                        width: `calc(${seg.span * 100}% - ${seg.leftPct}% - ${seg.rightMarginPct}% - 2px)`,
                        zIndex: 10,
                        backgroundImage: seg.isExtension
                          ? "repeating-linear-gradient(-45deg, transparent 0 6px, rgba(255,255,255,0.22) 6px 8px)"
                          : undefined,
                      }}
                      title={`${seg.name} · ${seg.startDate} ${property.checkInTime || "14:00"} → ${seg.endDate} ${property.checkOutTime || "12:00"}${isConflict ? " ⚠ CONFLICT" : ""}`}
                    >
                      {seg.showLabel ? seg.name : ""}
                    </div>
                  ))}

                  {/* Same-day cleaning indicator — dedicated bottom slot */}
                  {isSameDayCleaning && !isOpen && !isClosed && (
                    <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center px-0.5 pointer-events-none">
                      <div className="rounded px-1.5 h-4 flex items-center text-[9px] text-[#fbbf24] bg-[#fbbf24]/15 border border-[#fbbf24]/30 font-medium leading-none">
                        {t("calendar.cleaning")}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        </div>
      </div>

      {/* Agenda */}
      <div className="rounded-lg border border-[#27272b] bg-[#18181b]">
        <div className="border-b border-[#27272b] px-4 py-3">
          <h2 className="text-xs font-medium text-[#a0a0a8]">{t("calendar.upcoming")} ({agenda.length})</h2>
        </div>
        {agenda.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[#71717a] text-center">{t("calendar.noUpcoming")}</p>
        ) : (
          <div>
            {agenda.map((item, i) => (
              <div
                key={`${item.startDate}-${i}`}
                onClick={() => item.reservationId && onSelectReservation(item.reservationId)}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#1e1e22] ${
                  i < agenda.length - 1 ? "border-b border-[#27272b]/50" : ""
                } ${item.reservationId ? "cursor-pointer" : ""}`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  item.platform === "booking" ? "bg-[#003580]" : "bg-[#ff385c]"
                }`} />
                <span className="flex-1 text-sm font-medium text-[#e8e8ec] truncate">{item.name}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                  item.platform === "booking" ? "bg-[#003580]/20 text-[#93c5fd]" : "bg-[#ff385c]/20 text-[#ff385c]"
                }`}>
                  {item.platform === "booking" ? "Booking" : "Airbnb"}
                </span>
                <span className="shrink-0 text-sm text-[#a0a0a8]">
                  {formatDate(item.startDate)} — {formatDate(item.endDate)}
                </span>
                <span className="shrink-0 text-xs text-[#71717a]">{dayCount(item.startDate, item.endDate)}d</span>
                {item.reservationId && (
                  <svg className="h-4 w-4 shrink-0 text-[#333338]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date actions popover */}
      {popoverDate && popoverAnchor && (
        <DateActionsPopover
          date={popoverDate}
          anchorRect={popoverAnchor}
          status={{
            hasBar: bars.some(b => popoverDate >= b.startDate && popoverDate <= b.endDate),
            barName: bars.find(b => popoverDate >= b.startDate && popoverDate <= b.endDate)?.name,
            barPlatform: bars.find(b => popoverDate >= b.startDate && popoverDate <= b.endDate)?.platform,
            isBuffer: bufferDates.has(popoverDate),
            isPotential: potentialDates.has(popoverDate),
            isSameDayCleaning: sameDayCleaningDates.has(popoverDate),
            isUnbookable: unbookableDates.has(popoverDate),
            isOpenOverride: openOverrides.has(popoverDate),
            isClosedOverride: closedOverrides.has(popoverDate),
          }}
          extendable={getExtendableBookings(popoverDate)}
          onClose={closePopover}
          onCloseDate={() => setOverride(popoverDate, "closed")}
          onOpenDate={() => setOverride(popoverDate, "open")}
          onAddCleaning={() => setOverride(popoverDate, "closed")}
          onRemoveCleaning={() => setOverride(popoverDate, "open")}
          onRemoveOverride={() => deleteOverride(popoverDate)}
          onExtendBooking={(b) => extendBooking(popoverDate, b)}
        />
      )}
    </div>
  );
}
