"use client";

import { useState, useMemo, useEffect } from "react";
import type { Property, Reservation } from "@/lib/types";

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

interface Bar {
  id: number | string;
  name: string;
  startDate: string;
  endDate: string;
  platform: string;
  type: "reservation" | "synced";
  guestCount?: number;
  reservationId?: number;
}

export function PropertyCalendar({
  property,
  onSelectReservation,
  onAddReservation,
}: PropertyCalendarProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [syncedEvents, setSyncedEvents] = useState<CalendarEvent[]>([]);

  // Fetch synced calendar events
  useEffect(() => {
    fetch(`/api/calendar/sync?propertyId=${property.id}&limit=200`)
      .then((r) => r.json())
      .then((data) => setSyncedEvents(data.events || []))
      .catch(() => {});
  }, [property.id]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const currentMonth = useMemo(() => {
    const d = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    return d;
  }, [today, monthOffset]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = currentMonth.toLocaleDateString("en", { month: "long", year: "numeric" });

  // Monday = 0 offset
  let firstDayOffset = new Date(year, month, 1).getDay() - 1;
  if (firstDayOffset < 0) firstDayOffset = 6;

  // Build all bars for this month
  const bars: Bar[] = useMemo(() => {
    const result: Bar[] = [];
    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    // Reservations
    for (const res of property.reservations) {
      const start = toDateStr(new Date(res.checkIn));
      const end = toDateStr(new Date(res.checkOut));
      // Check if reservation overlaps this month
      if (start <= monthEnd && end >= monthStart) {
        result.push({
          id: res.id,
          name: res.name,
          startDate: start,
          endDate: end,
          platform: res.platform || "airbnb",
          type: "reservation",
          guestCount: res._count?.guests || 0,
          reservationId: res.id,
        });
      }
    }

    // Synced events (that aren't already covered by reservations)
    for (const ev of syncedEvents) {
      if (ev.startDate <= monthEnd && ev.endDate >= monthStart) {
        // Check if this overlaps an existing reservation (skip if so)
        const overlaps = result.some(
          (b) => b.type === "reservation" && b.startDate <= ev.endDate && b.endDate >= ev.startDate
        );
        if (!overlaps) {
          result.push({
            id: `ev-${ev.id}`,
            name: ev.summary || "Booked",
            startDate: ev.startDate,
            endDate: ev.endDate,
            platform: ev.platform,
            type: "synced",
          });
        }
      }
    }

    return result;
  }, [property.reservations, syncedEvents, year, month, daysInMonth]);

  // For each day, determine which bars pass through it
  const getDayBars = (dayNum: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return bars.filter((b) => ds >= b.startDate && ds <= b.endDate);
  };

  const isToday = (dayNum: number) => {
    return year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();
  };

  // Calculate bar positions for rendering
  const getBarStyle = (bar: Bar, dayNum: number) => {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const isStart = ds === bar.startDate || dayNum === 1 || new Date(year, month, dayNum).getDay() === 1;

    // Only render bar label at start position
    return { isStart, showLabel: ds === bar.startDate || (dayNum === 1 && ds > bar.startDate) };
  };

  // Calculate how many days a bar spans from a given day to the end of the row
  const getBarSpan = (bar: Bar, dayNum: number) => {
    let span = 0;
    for (let d = dayNum; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      if (ds > bar.endDate) break;
      // Stop at end of week (Sunday)
      const dow = new Date(year, month, d).getDay();
      span++;
      if (dow === 0) break; // Sunday = end of row
    }
    return span;
  };

  const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Build grid cells
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Group into weeks
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  // Pad last week
  while (weeks[weeks.length - 1].length < 7) weeks[weeks.length - 1].push(null);

  // Recent reservations for the list below calendar
  const recentReservations = [...property.reservations].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });

  const dayCount = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#f0f6fc]">{property.name}</h1>
          <p className="mt-0.5 text-sm text-[#9198a1]">
            {property.reservations.length} reservation{property.reservations.length !== 1 && "s"}
          </p>
        </div>
        <button
          onClick={() => {
            const name = prompt("Guest name:");
            if (name) {
              const checkIn = toDateStr(today);
              const d2 = new Date(today);
              d2.setDate(d2.getDate() + 4);
              onAddReservation({
                name,
                checkIn,
                checkOut: toDateStr(d2),
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
        {/* Month Navigation */}
        <div className="flex items-center justify-between border-b border-[#21262d] px-4 py-3">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="rounded-md p-1.5 text-[#9198a1] hover:bg-[#1c2128] hover:text-[#f0f6fc]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h2 className="text-sm font-semibold text-[#f0f6fc]">{monthLabel}</h2>
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            className="rounded-md p-1.5 text-[#9198a1] hover:bg-[#1c2128] hover:text-[#f0f6fc]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[#21262d]">
          {WEEKDAYS.map((wd) => (
            <div key={wd} className="py-2 text-center text-xs font-medium text-[#7d8590]">
              {wd}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-[#21262d] last:border-b-0">
            {week.map((dayNum, di) => {
              if (dayNum === null) {
                return <div key={`empty-${di}`} className="min-h-[80px] border-r border-[#21262d] last:border-r-0 bg-[#0d1117]/30" />;
              }

              const dayBars = getDayBars(dayNum);
              const todayClass = isToday(dayNum);

              return (
                <div
                  key={dayNum}
                  className={`relative min-h-[80px] border-r border-[#21262d] last:border-r-0 p-1 ${
                    todayClass ? "bg-[#58a6ff]/5" : ""
                  }`}
                >
                  {/* Day number */}
                  <span className={`text-xs ${
                    todayClass
                      ? "inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#58a6ff] text-white font-semibold"
                      : "text-[#9198a1]"
                  }`}>
                    {dayNum}
                  </span>

                  {/* Reservation bars */}
                  <div className="mt-1 space-y-0.5">
                    {dayBars.map((bar) => {
                      const style = getBarStyle(bar, dayNum);
                      if (!style.isStart) return null;

                      const span = getBarSpan(bar, dayNum);
                      const isRes = bar.type === "reservation";
                      const color = bar.platform === "booking"
                        ? "bg-[#003580] hover:bg-[#004494]"
                        : "bg-[#222] hover:bg-[#333]";

                      return (
                        <div
                          key={`${bar.id}-${dayNum}`}
                          onClick={() => isRes && bar.reservationId && onSelectReservation(bar.reservationId)}
                          className={`relative z-10 flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium text-white truncate ${color} ${
                            isRes ? "cursor-pointer" : "opacity-70"
                          }`}
                          style={{
                            width: `calc(${span * 100}% + ${(span - 1) * 1}px)`,
                          }}
                          title={`${bar.name} · ${bar.startDate} → ${bar.endDate}`}
                        >
                          {bar.name}
                          {isRes && bar.guestCount ? (
                            <span className="ml-1 opacity-60">+{bar.guestCount}</span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Recent Reservations List */}
      {recentReservations.length > 0 && (
        <div className="rounded-lg border border-[#21262d] bg-[#161b22]">
          <div className="border-b border-[#21262d] px-4 py-3">
            <h2 className="text-xs font-medium text-[#9198a1]">Reservations</h2>
          </div>
          <div>
            {recentReservations.map((res: Reservation, i: number) => (
              <div
                key={res.id}
                onClick={() => onSelectReservation(res.id)}
                className={`flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-[#1c2128] ${
                  i < recentReservations.length - 1 ? "border-b border-[#21262d]/50" : ""
                }`}
              >
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  res.platform === "booking" ? "bg-[#79c0ff]" : "bg-[#f78166]"
                }`} />
                <span className="flex-1 text-sm font-medium text-[#f0f6fc]">{res.name}</span>
                <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                  res.platform === "booking"
                    ? "bg-[#003580]/20 text-[#79c0ff]"
                    : "bg-[#FF5A5F]/10 text-[#f78166]"
                }`}>
                  {res.platform === "booking" ? "Booking" : "Airbnb"}
                </span>
                <span className="shrink-0 text-sm text-[#9198a1]">
                  {formatDate(res.checkIn)} — {formatDate(res.checkOut)}
                </span>
                <span className="shrink-0 w-10 text-right text-xs text-[#7d8590]">
                  {dayCount(res.checkIn, res.checkOut)}d
                </span>
                <span className="shrink-0 w-10 text-right text-xs text-[#7d8590]">
                  {res._count?.guests || 0}<span className="ml-0.5 text-[#30363d]">g</span>
                </span>
                <svg className="h-4 w-4 shrink-0 text-[#30363d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
