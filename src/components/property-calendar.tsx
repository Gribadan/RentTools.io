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
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return toDateStr(d);
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

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = currentMonth.toLocaleDateString("en", { month: "long", year: "numeric" });

  let firstDayOffset = new Date(year, month, 1).getDay() - 1;
  if (firstDayOffset < 0) firstDayOffset = 6;

  // Build date sets for each platform
  const { airbnbDates, bookingDates, bufferDates, dateToEvent, dateToReservation } = useMemo(() => {
    const airbnb = new Set<string>();
    const booking = new Set<string>();
    const buffer = new Set<string>();
    const evMap = new Map<string, { name: string; platform: string; startDate: string; endDate: string; reservationId?: number }>();
    const resMap = new Map<string, Reservation>();

    // Synced calendar events
    for (const ev of syncedEvents) {
      const platform = ev.platform;
      const dates = platform === "airbnb" ? airbnb : booking;
      let d = ev.startDate;
      while (d < ev.endDate) {
        dates.add(d);
        d = addDaysStr(d, 1);
      }
      // Store event info for the start date
      if (!evMap.has(ev.startDate) || evMap.get(ev.startDate)!.startDate > ev.startDate) {
        evMap.set(ev.startDate, {
          name: ev.summary || "Reserved",
          platform,
          startDate: ev.startDate,
          endDate: ev.endDate,
        });
      }
    }

    // Internal reservations
    for (const res of property.reservations) {
      const start = toDateStr(new Date(res.checkIn));
      const end = toDateStr(new Date(res.checkOut));
      const platform = res.platform || "airbnb";
      const dates = platform === "airbnb" ? airbnb : platform === "booking" ? booking : airbnb;
      let d = start;
      while (d <= end) {
        dates.add(d);
        resMap.set(d, res);
        d = addDaysStr(d, 1);
      }
      // Override event map with reservation name
      evMap.set(start, {
        name: res.name,
        platform,
        startDate: start,
        endDate: end,
        reservationId: res.id,
      });
    }

    // Buffer days
    const allBookings: { start: string; end: string; platform: string }[] = [];
    for (const ev of syncedEvents) {
      allBookings.push({ start: ev.startDate, end: ev.endDate, platform: ev.platform });
    }
    for (const res of property.reservations) {
      allBookings.push({
        start: toDateStr(new Date(res.checkIn)),
        end: toDateStr(new Date(res.checkOut)),
        platform: res.platform || "airbnb",
      });
    }

    for (const b of allBookings) {
      const link = links.find(l => l.platform === b.platform);
      const bBefore = link?.bufferBefore ?? 0;
      const bAfter = link?.bufferAfter ?? 0;
      for (let i = 1; i <= bBefore; i++) {
        const d = addDaysStr(b.start, -i);
        if (!airbnb.has(d) && !booking.has(d)) buffer.add(d);
      }
      for (let i = 1; i <= bAfter; i++) {
        const d = addDaysStr(b.end, i - 1);
        if (!airbnb.has(d) && !booking.has(d)) buffer.add(d);
      }
    }

    return { airbnbDates: airbnb, bookingDates: booking, bufferDates: buffer, dateToEvent: evMap, dateToReservation: resMap };
  }, [syncedEvents, property.reservations, links]);

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

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  while (weeks.length > 0 && weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

  // Get bar for a specific day
  const getBarForDay = (dayNum: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return bars.find(b => ds >= b.startDate && ds < b.endDate);
  };

  const isBarStart = (dayNum: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    // Start of bar, or start of a new week row for a continuing bar
    const bar = getBarForDay(dayNum);
    if (!bar) return null;
    const dow = new Date(year, month, dayNum).getDay();
    const isMonday = dow === 1;
    if (ds === bar.startDate || (isMonday && ds > bar.startDate)) {
      // Calculate span until end of bar or end of week
      let span = 0;
      for (let d = dayNum; d <= daysInMonth; d++) {
        const dds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        if (dds >= bar.endDate) break;
        span++;
        if (new Date(year, month, d).getDay() === 0) break; // Sunday
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
          <div className="flex items-center gap-1.5"><span className="h-2.5 w-6 rounded-sm bg-[#d29922]/30 border border-[#d29922]/40" /><span className="text-xs text-[#9198a1]">Buffer</span></div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[#21262d]">
          {WEEKDAYS.map(wd => (
            <div key={wd} className="py-2 text-center text-xs font-medium text-[#7d8590]">{wd}</div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-[#21262d] last:border-b-0">
            {week.map((dayNum, di) => {
              if (dayNum === null) {
                return <div key={`e-${di}`} className="min-h-[72px] border-r border-[#21262d] last:border-r-0 bg-[#0d1117]/40" />;
              }

              const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const isToday = year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();
              const isBuffer = bufferDates.has(ds);
              const barStart = isBarStart(dayNum);
              const hasBar = !!getBarForDay(dayNum);

              return (
                <div
                  key={dayNum}
                  className={`relative min-h-[72px] border-r border-[#21262d] last:border-r-0 p-1 ${
                    isToday ? "bg-[#58a6ff]/5" : isBuffer ? "bg-[#d29922]/5" : ""
                  }`}
                >
                  <span className={`text-xs ${
                    isToday
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#58a6ff] text-white font-semibold"
                      : "text-[#9198a1]"
                  }`}>
                    {dayNum}
                  </span>

                  {/* Buffer indicator */}
                  {isBuffer && !hasBar && (
                    <div className="mt-1 rounded px-1 py-0.5 text-[10px] text-[#d29922] bg-[#d29922]/10 border border-[#d29922]/20 truncate">
                      Buffer
                    </div>
                  )}

                  {/* Booking bar */}
                  {barStart && (
                    <div
                      onClick={() => barStart.reservationId && onSelectReservation(barStart.reservationId)}
                      className={`absolute left-0.5 right-0 mt-1 top-6 flex items-center rounded-md px-1.5 py-1 text-[11px] font-medium text-white truncate ${
                        barStart.platform === "booking"
                          ? "bg-[#003580] hover:bg-[#004494]"
                          : "bg-[#b5462a] hover:bg-[#c44e30]"
                      } ${barStart.reservationId ? "cursor-pointer" : "opacity-80"}`}
                      style={{ width: `calc(${barStart.span * 100}% + ${(barStart.span - 1) * 1}px - 4px)`, zIndex: 10 }}
                      title={`${barStart.name} · ${barStart.startDate} → ${barStart.endDate}`}
                    >
                      {barStart.showLabel ? barStart.name : ""}
                    </div>
                  )}
                </div>
              );
            })}
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
