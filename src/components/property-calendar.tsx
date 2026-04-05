"use client";

import { useState, useMemo, useEffect } from "react";
import type { Property, Reservation, CalendarLink } from "@/lib/types";

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
  const [monthOffset, setMonthOffset] = useState(0);
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>([]);
  const [links, setLinks] = useState<CalendarLink[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/calendar/sync?propertyId=${property.id}&limit=200`).then(r => r.json()),
      fetch(`/api/calendar/links?propertyId=${property.id}`).then(r => r.json()),
    ]).then(([syncData, linksData]) => {
      setSyncedEvents(syncData.events || []);
      setLinks(linksData || []);
    }).catch(() => {});
  }, [property.id]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentMonth = useMemo(() => {
    return new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  }, [today, monthOffset]);

  const { year, month, daysInMonth, monthLabel, firstDayOffset } = useMemo(() => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    const dim = new Date(y, m + 1, 0).getDate();
    const label = currentMonth.toLocaleDateString("en", { month: "long", year: "numeric" });
    let fdo = new Date(y, m, 1).getDay() - 1;
    if (fdo < 0) fdo = 6;
    return { year: y, month: m, daysInMonth: dim, monthLabel: label, firstDayOffset: fdo };
  }, [currentMonth]);

  // Build date sets for each platform + conflict detection + smart buffers
  const { airbnbDates, bookingDates, bufferDates, unbookableDates, conflictDates, dateToEvent, dateToReservation, conflicts } = useMemo(() => {
    const airbnb = new Set<string>();
    const booking = new Set<string>();
    const buffer = new Set<string>();     // cleaning days
    const unbookable = new Set<string>(); // gap days too short for min nights
    const conflictSet = new Set<string>();
    const evMap = new Map<string, { name: string; platform: string; startDate: string; endDate: string; reservationId?: number }>();
    const resMap = new Map<string, Reservation>();
    const allBooked = new Set<string>(); // all booked dates regardless of platform

    // Collect all bookings as ranges
    const allBookings: { start: string; end: string; platform: string; name: string }[] = [];

    // Synced calendar events
    for (const ev of syncedEvents) {
      const platform = ev.platform;
      const dates = platform === "airbnb" ? airbnb : booking;
      // Include checkout day as booked (guest's day until noon)
      let d = ev.startDate;
      while (d <= ev.endDate) {
        dates.add(d);
        allBooked.add(d);
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
    for (const res of property.reservations) {
      const start = toDateStr(new Date(res.checkIn));
      const end = toDateStr(new Date(res.checkOut));
      const platform = res.platform || "airbnb";
      const dates = platform === "airbnb" ? airbnb : platform === "booking" ? booking : airbnb;
      // Include checkout day as booked (guest's day until noon)
      let d = start;
      while (d <= end) {
        dates.add(d);
        allBooked.add(d);
        resMap.set(d, res);
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

    // Detect conflicts: dates booked on BOTH platforms simultaneously
    const conflictList: { date: string; airbnbName: string; bookingName: string }[] = [];
    for (const d of airbnb) {
      if (booking.has(d)) {
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
    allBookings.sort((a, b) => a.start.localeCompare(b.start));
    const minStay = property.minNights || 3;

    for (let bi = 0; bi < allBookings.length; bi++) {
      const b = allBookings[bi];
      const link = links.find(l => l.platform === b.platform);
      const bBefore = link?.bufferBefore ?? 0;
      const bAfter = link?.bufferAfter ?? 0;

      // Cleaning buffer before this booking
      for (let i = 1; i <= bBefore; i++) {
        const d = addDaysStr(b.start, -i);
        if (!allBooked.has(d)) buffer.add(d);
      }

      // Cleaning buffer after this booking (day after checkout)
      for (let i = 1; i <= bAfter; i++) {
        const d = addDaysStr(b.end, i);
        if (!allBooked.has(d)) buffer.add(d);
      }

      // Check gap to next booking for unbookable days
      const nextBooking = allBookings[bi + 1];
      if (nextBooking) {
        const nextLink = links.find(l => l.platform === nextBooking.platform);
        const nextBefore = nextLink?.bufferBefore ?? 0;

        // Free gap = days between end of cleaning-after and start of cleaning-before-next
        const afterCleanEnd = addDaysStr(b.end, bAfter + 1);
        const beforeCleanStart = addDaysStr(nextBooking.start, -nextBefore);
        const freeGap = Math.max(0, Math.ceil(
          (new Date(beforeCleanStart + "T12:00:00Z").getTime() - new Date(afterCleanEnd + "T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24)
        ));

        if (freeGap > 0 && freeGap < minStay) {
          // These days can't be booked — mark as unbookable (visual only, not exported)
          let d = afterCleanEnd;
          while (d < beforeCleanStart) {
            if (!allBooked.has(d) && !buffer.has(d)) unbookable.add(d);
            d = addDaysStr(d, 1);
          }
        }
      }
    }

    return {
      airbnbDates: airbnb,
      bookingDates: booking,
      bufferDates: buffer,
      unbookableDates: unbookable,
      conflictDates: conflictSet,
      dateToEvent: evMap,
      dateToReservation: resMap,
      conflicts: conflictList,
    };
  }, [syncedEvents, property.reservations, links, property.minNights]);

  // Build bars (continuous booking spans) for rendering
  const bars = useMemo(() => {
    const result: { startDate: string; endDate: string; name: string; platform: string; reservationId?: number }[] = [];
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

      // Clean up "Reserved" / "CLOSED - Not available" etc
      if (label.includes("Reserved") || label.includes("CLOSED") || label.includes("Not available")) {
        // Try to find a matching reservation
        const matchingRes = property.reservations.find(r => {
          const rStart = toDateStr(new Date(r.checkIn));
          const rEnd = toDateStr(new Date(r.checkOut));
          return rStart <= ev.endDate && rEnd >= ev.startDate;
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
      });
    }

    // Deduplicate: merge overlapping bars on same platform
    const deduped: typeof result = [];
    for (const bar of result) {
      const existing = deduped.find(
        b => b.platform === bar.platform && b.startDate <= bar.endDate && b.endDate >= bar.startDate
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

  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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

  // Get bar for a specific day
  // Bar visual rendering uses INCLUSIVE end date (checkout day shows as part of bar)
  // This matches Airbnb's visual style where the bar covers check-in through checkout
  const getBarForDay = (dayNum: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return bars.find(b => ds >= b.startDate && ds <= b.endDate);
  };

  const isBarStart = (dayNum: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const bar = getBarForDay(dayNum);
    if (!bar) return null;
    const dow = new Date(year, month, dayNum).getDay();
    const isMonday = dow === 1;
    if (ds === bar.startDate || (isMonday && ds > bar.startDate)) {
      let span = 0;
      for (let d = dayNum; d <= daysInMonth; d++) {
        const dds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (dds > bar.endDate) break; // inclusive: stop AFTER endDate
        span++;
        if (new Date(year, month, d).getDay() === 0) break;
      }
      return { ...bar, span, showLabel: ds === bar.startDate };
    }
    return null;
  };

  // Agenda — all upcoming events
  const agenda = useMemo(() => {
    const todayStr = toDateStr(today);
    return bars
      .filter(b => b.endDate >= todayStr)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [bars, today]);

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  const dayCount = (start: string, end: string) => {
    const d1 = new Date(start);
    const d2 = new Date(end);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
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
          <h1 className="text-xl font-semibold text-[#f0f6fc]">{property.name}</h1>
          <p className="mt-0.5 text-sm text-[#9198a1]">
            {property.reservations.length} reservation{property.reservations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-md border border-[#30363d] bg-[#21262d] px-3 py-2 text-sm text-[#c9d1d9] transition-colors hover:bg-[#30363d]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            {exportCopied ? "Copied!" : "Export"}
          </button>
          <button
            onClick={() => {
              const name = prompt("Guest name:");
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
            className="flex items-center gap-1.5 rounded-md bg-[#238636] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2ea043]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Reservation
          </button>
        </div>
      </div>

      {/* Conflict warnings */}
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-[#f85149]/30 bg-[#f85149]/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#f85149]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm font-semibold text-[#f85149]">
              Double booking detected! ({new Set(conflicts.map(c => c.date)).size} day{new Set(conflicts.map(c => c.date)).size !== 1 ? "s" : ""})
            </span>
          </div>
          <p className="text-xs text-[#f85149]/80">
            The same dates are booked on both Airbnb and Booking.com. This needs immediate attention.
          </p>
          <div className="space-y-1">
            {Array.from(new Set(conflicts.map(c => c.date))).slice(0, 5).map(d => (
              <p key={d} className="text-xs text-[#c9d1d9]">
                <span className="text-[#f85149] font-medium">{d}</span>
                {" — "}Airbnb + Booking overlap
              </p>
            ))}
            {new Set(conflicts.map(c => c.date)).size > 5 && (
              <p className="text-xs text-[#7d8590]">...and {new Set(conflicts.map(c => c.date)).size - 5} more</p>
            )}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-lg border border-[#21262d] bg-[#161b22] overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between border-b border-[#21262d] px-4 py-3">
          <button onClick={() => setMonthOffset(o => o - 1)} className="rounded-md p-1.5 text-[#9198a1] hover:bg-[#1c2128] hover:text-[#f0f6fc]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[#f0f6fc]">{monthLabel}</h2>
            {monthOffset !== 0 && (
              <button onClick={() => setMonthOffset(0)} className="rounded px-2 py-0.5 text-xs text-[#58a6ff] hover:bg-[#58a6ff]/10">Today</button>
            )}
          </div>
          <button onClick={() => setMonthOffset(o => o + 1)} className="rounded-md p-1.5 text-[#9198a1] hover:bg-[#1c2128] hover:text-[#f0f6fc]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 border-b border-[#21262d] px-4 py-2">
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#b5462a]" /><span className="text-xs text-[#9198a1]">Airbnb</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#003580]" /><span className="text-xs text-[#9198a1]">Booking</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#d29922]/30 border border-[#d29922]/40" /><span className="text-xs text-[#9198a1]">Cleaning</span></div>
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#8b949e]/15 border border-[#8b949e]/20 border-dashed" /><span className="text-xs text-[#9198a1]">&lt;{property.minNights || 3} nights</span></div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[#21262d]">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="py-2 text-center text-xs font-medium text-[#7d8590]">{wd}</div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="border-b border-[#21262d] last:border-b-0">
            {/* Row 1: Day numbers */}
            <div className="grid grid-cols-7">
            {week.map((dayNum, di) => {
              if (dayNum === null) {
                return <div key={`n-${di}`} className="h-7 border-r border-[#21262d] last:border-r-0 bg-[#0d1117]/40" />;
              }
              const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();
              const isConflict = conflictDates.has(ds);
              const isBuffer = bufferDates.has(ds) && !getBarForDay(dayNum);
              const isUnbookable = unbookableDates.has(ds);

              return (
                <div
                  key={`n-${dayNum}`}
                  className={`h-7 flex items-center px-1.5 border-r border-[#21262d] last:border-r-0 ${
                    isConflict ? "bg-[#f85149]/8"
                    : isToday ? "bg-[#58a6ff]/5"
                    : isBuffer ? "bg-[#d29922]/5"
                    : isUnbookable ? "bg-[#8b949e]/5"
                    : ""
                  }`}
                >
                  <span className={`text-xs leading-none ${
                    isConflict
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#f85149] text-white font-semibold"
                      : isToday
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#58a6ff] text-white font-semibold"
                      : "text-[#7d8590]"
                  }`}>
                    {dayNum}
                  </span>
                </div>
              );
            })}
            </div>

            {/* Row 2: Bars, buffers, and indicators — fixed height */}
            <div className="grid grid-cols-7">
            {week.map((dayNum, di) => {
              if (dayNum === null) {
                return <div key={`b-${di}`} className="h-8 border-r border-[#21262d] last:border-r-0 bg-[#0d1117]/40" />;
              }
              const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isConflict = conflictDates.has(ds);
              const isBuffer = bufferDates.has(ds);
              const isUnbookable = unbookableDates.has(ds);
              const barStart = isBarStart(dayNum);
              const hasBar = !!getBarForDay(dayNum);
              const isToday = year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();

              return (
                <div
                  key={`b-${dayNum}`}
                  className={`relative h-8 flex items-center border-r border-[#21262d] last:border-r-0 px-0.5 overflow-visible ${
                    isConflict ? "bg-[#f85149]/8"
                    : isToday ? "bg-[#58a6ff]/5"
                    : isBuffer && !hasBar ? "bg-[#d29922]/5"
                    : isUnbookable && !hasBar ? "bg-[#8b949e]/5"
                    : ""
                  }`}
                >
                  {/* Conflict indicator */}
                  {isConflict && !hasBar && (
                    <div className="rounded px-1.5 h-6 flex items-center text-[10px] text-[#f85149] bg-[#f85149]/10 border border-[#f85149]/20 font-medium">
                      Conflict
                    </div>
                  )}

                  {/* Buffer/cleaning indicator */}
                  {isBuffer && !hasBar && !isConflict && (
                    <div className="rounded px-1.5 h-6 flex items-center text-[10px] text-[#d29922] bg-[#d29922]/8 border border-[#d29922]/15">
                      Cleaning
                    </div>
                  )}

                  {/* Unbookable gap indicator */}
                  {isUnbookable && !hasBar && !isConflict && !isBuffer && (
                    <div className="rounded px-1.5 h-6 flex items-center text-[10px] text-[#8b949e] bg-[#8b949e]/8 border border-[#8b949e]/15 border-dashed">
                      &lt;{property.minNights || 3}n
                    </div>
                  )}

                  {/* Booking bar — consistent h-6 */}
                  {barStart && (
                    <div
                      onClick={() => barStart.reservationId && onSelectReservation(barStart.reservationId)}
                      className={`absolute left-0 top-1 h-6 flex items-center rounded px-2 text-[11px] font-medium text-white/90 truncate ${
                        isConflict ? "bg-[#f85149] ring-1 ring-[#f85149]/40" :
                        barStart.platform === "booking"
                          ? "bg-[#003580]"
                          : "bg-[#b5462a]"
                      } ${barStart.reservationId ? "cursor-pointer hover:brightness-110" : "opacity-80"}`}
                      style={{
                        width: `calc(${barStart.span * 100}% - 2px)`,
                        zIndex: 10,
                      }}
                      title={`${barStart.name} · ${barStart.startDate} → ${barStart.endDate}${isConflict ? " ⚠ CONFLICT" : ""}`}
                    >
                      {barStart.showLabel ? barStart.name : ""}
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        ))}
      </div>

      {/* Agenda */}
      <div className="rounded-lg border border-[#21262d] bg-[#161b22]">
        <div className="border-b border-[#21262d] px-4 py-3">
          <h2 className="text-xs font-medium text-[#9198a1]">Upcoming ({agenda.length})</h2>
        </div>
        {agenda.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[#7d8590] text-center">No upcoming bookings</p>
        ) : (
          <div>
            {agenda.map((item, i) => (
              <div
                key={`${item.startDate}-${i}`}
                onClick={() => item.reservationId && onSelectReservation(item.reservationId)}
                className={`flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#1c2128] ${
                  i < agenda.length - 1 ? "border-b border-[#21262d]/50" : ""
                } ${item.reservationId ? "cursor-pointer" : ""}`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  item.platform === "booking" ? "bg-[#003580]" : "bg-[#b5462a]"
                }`} />
                <span className="flex-1 text-sm font-medium text-[#f0f6fc] truncate">{item.name}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                  item.platform === "booking" ? "bg-[#003580]/20 text-[#79c0ff]" : "bg-[#b5462a]/20 text-[#f78166]"
                }`}>
                  {item.platform === "booking" ? "Booking" : "Airbnb"}
                </span>
                <span className="shrink-0 text-sm text-[#9198a1]">
                  {formatDate(item.startDate)} — {formatDate(item.endDate)}
                </span>
                <span className="shrink-0 text-xs text-[#7d8590]">{dayCount(item.startDate, item.endDate)}d</span>
                {item.reservationId && (
                  <svg className="h-4 w-4 shrink-0 text-[#30363d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
