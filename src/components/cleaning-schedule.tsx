"use client";

import { useMemo } from "react";
import type { Property, CalendarLink, DateOverride } from "@/lib/types";

interface CalendarEvent {
  id: number;
  platform: string;
  summary: string;
  startDate: string;
  endDate: string;
}

interface CleaningDay {
  date: string;
  type: "cleaning" | "potential";
  property: string;
  propertyId: number;
  reason: string; // e.g. "After Igor Kim checkout" or "Before Airbnb booking"
  movableTo?: string; // if overlap, can move to this date
}

interface CleaningScheduleProps {
  properties: Property[];
  syncedEvents: Record<number, CalendarEvent[]>; // propertyId -> events
  links: Record<number, CalendarLink[]>; // propertyId -> links
  overrides?: Record<number, DateOverride[]>; // propertyId -> overrides
  mode: "property" | "dashboard";
  selectedPropertyId?: number;
}

function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function computeCleaningDays(
  property: Property,
  events: CalendarEvent[],
  links: CalendarLink[],
  dateOverrides: DateOverride[] = []
): CleaningDay[] {
  const result: CleaningDay[] = [];
  const allBooked = new Set<string>();
  const maxBefore = Math.max(0, ...links.map(l => l.bufferBefore), 0);
  const maxAfter = Math.max(0, ...links.map(l => l.bufferAfter), 0);
  const minStay = property.minNights || 3;

  // Collect all bookings
  interface Booking { start: string; end: string; name: string; platform: string }
  const allBookings: Booking[] = [];

  for (const ev of events) {
    const isAirbnbBlock = ev.platform === "airbnb" && (
      ev.summary.includes("Not available") || ev.summary.includes("Blocked")
    );
    let d = ev.startDate;
    while (d <= ev.endDate) { allBooked.add(d); d = addDaysStr(d, 1); }
    if (!isAirbnbBlock) {
      allBookings.push({ start: ev.startDate, end: ev.endDate, name: ev.summary, platform: ev.platform });
    }
  }

  for (const res of property.reservations) {
    const start = toDateStr(new Date(res.checkIn));
    const end = toDateStr(new Date(res.checkOut));
    let d = start;
    while (d <= end) { allBooked.add(d); d = addDaysStr(d, 1); }
    allBookings.push({ start, end, name: res.name, platform: res.platform || "airbnb" });
  }

  // Deduplicate and sort
  allBookings.sort((a, b) => a.start.localeCompare(b.start));
  const deduped: Booking[] = [];
  for (const b of allBookings) {
    const last = deduped[deduped.length - 1];
    if (last && b.start <= last.end) {
      if (b.end > last.end) last.end = b.end;
      if (b.name !== "Reserved" && b.name !== "CLOSED - Not available") last.name = b.name;
    } else {
      deduped.push({ ...b });
    }
  }

  // Determine gaps
  const skipBeforeFor = new Set<number>();
  for (let i = 0; i < deduped.length - 1; i++) {
    const gapStart = addDaysStr(deduped[i].end, 1);
    const gapDays = Math.max(0, Math.ceil(
      (new Date(deduped[i + 1].start + "T12:00:00Z").getTime() - new Date(gapStart + "T12:00:00Z").getTime()) / (1000 * 60 * 60 * 24)
    ));
    if (gapDays < maxAfter + minStay + maxBefore) {
      skipBeforeFor.add(i + 1);
    }
  }

  // Generate cleaning days
  for (let bi = 0; bi < deduped.length; bi++) {
    const b = deduped[bi];
    const prev = bi > 0 ? deduped[bi - 1] : null;
    const displayName = b.name.includes("CLOSED") || b.name.includes("Reserved")
      ? (b.platform === "airbnb" ? "Airbnb" : "Booking") + " guest"
      : b.name;

    // Buffer before
    if (!skipBeforeFor.has(bi)) {
      if (bi === 0 || !prev) {
        for (let i = 1; i <= maxBefore; i++) {
          const d = addDaysStr(b.start, -i);
          if (!allBooked.has(d)) {
            result.push({ date: d, type: "cleaning", property: property.name, propertyId: property.id, reason: `Before ${displayName} check-in` });
          }
        }
      } else {
        // Check if gap has a booking
        const gapStart = addDaysStr(prev.end, 1);
        let gapHasBooking = false;
        let d = addDaysStr(gapStart, maxAfter);
        while (d < addDaysStr(b.start, -maxBefore)) {
          if (allBooked.has(d)) { gapHasBooking = true; break; }
          d = addDaysStr(d, 1);
        }
        for (let i = 1; i <= maxBefore; i++) {
          const dd = addDaysStr(b.start, -i);
          if (!allBooked.has(dd)) {
            result.push({
              date: dd,
              type: gapHasBooking ? "cleaning" : "potential",
              property: property.name,
              propertyId: property.id,
              reason: gapHasBooking ? `Before ${displayName} check-in` : `Before ${displayName} (if gap booked)`,
            });
          }
        }
      }
    }

    // Buffer after (always)
    for (let i = 1; i <= maxAfter; i++) {
      const d = addDaysStr(b.end, i);
      if (!allBooked.has(d)) {
        result.push({ date: d, type: "cleaning", property: property.name, propertyId: property.id, reason: `After ${displayName} checkout` });
      }
    }
  }

  // Apply date overrides
  const openDates = new Set(dateOverrides.filter(o => o.type === "open").map(o => o.date));
  const closedDates = dateOverrides.filter(o => o.type === "closed");

  // Remove cleaning days that are force-opened
  const filtered = result.filter(d => !openDates.has(d.date));

  // Add force-closed dates as cleaning days
  for (const o of closedDates) {
    if (!filtered.some(d => d.date === o.date)) {
      filtered.push({
        date: o.date,
        type: "cleaning",
        property: property.name,
        propertyId: property.id,
        reason: o.note || "Manual override (closed)",
      });
    }
  }

  return filtered;
}

export function CleaningSchedule({
  properties,
  syncedEvents,
  links,
  overrides,
  mode,
  selectedPropertyId,
}: CleaningScheduleProps) {
  const cleaningDays = useMemo(() => {
    const targetProperties = mode === "property" && selectedPropertyId
      ? properties.filter(p => p.id === selectedPropertyId)
      : properties;

    const allDays: CleaningDay[] = [];
    for (const prop of targetProperties) {
      const propEvents = syncedEvents[prop.id] || [];
      const propLinks = links[prop.id] || [];
      const propOverrides = overrides?.[prop.id] || [];
      allDays.push(...computeCleaningDays(prop, propEvents, propLinks, propOverrides));
    }

    // Sort by date
    allDays.sort((a, b) => a.date.localeCompare(b.date));
    return allDays;
  }, [properties, syncedEvents, links, overrides, mode, selectedPropertyId]);

  // Detect overlaps (same date, different properties)
  const overlaps = useMemo(() => {
    const dateMap = new Map<string, CleaningDay[]>();
    for (const day of cleaningDays) {
      if (day.type !== "cleaning") continue;
      const existing = dateMap.get(day.date) || [];
      existing.push(day);
      dateMap.set(day.date, existing);
    }

    const result: { date: string; properties: string[]; canMove: boolean; moveSuggestion: string }[] = [];
    for (const [date, days] of dateMap) {
      if (days.length <= 1) continue;
      const propNames = [...new Set(days.map(d => d.property))];
      if (propNames.length <= 1) continue; // same property, not an overlap for the cleaner

      // Check if next day is free for any of the properties
      const nextDay = addDaysStr(date, 1);
      const allBooked = new Set<string>();
      for (const prop of properties) {
        const propEvents = syncedEvents[prop.id] || [];
        for (const ev of propEvents) {
          if (nextDay >= ev.startDate && nextDay < ev.endDate) allBooked.add(prop.name);
        }
      }
      const canMove = propNames.some(p => !allBooked.has(p));
      result.push({
        date,
        properties: propNames,
        canMove,
        moveSuggestion: canMove ? `Move one cleaning to ${nextDay}` : "No adjacent free day available",
      });
    }
    return result;
  }, [cleaningDays, properties, syncedEvents]);

  const todayStr = toDateStr(new Date());
  const futureDays = cleaningDays.filter(d => d.date >= todayStr);
  const futureOverlaps = overlaps.filter(o => o.date >= todayStr);

  const formatDate = (d: string) => {
    const date = new Date(d + "T12:00:00");
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
  };

  return (
    <div className="space-y-4">
      {/* Overlap warnings */}
      {futureOverlaps.length > 0 && (
        <div className="rounded-lg border border-[#d29922]/30 bg-[#d29922]/5 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#d29922]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <span className="text-sm font-semibold text-[#d29922]">
              Cleaning overlap! ({futureOverlaps.length} day{futureOverlaps.length !== 1 ? "s" : ""})
            </span>
          </div>
          <p className="text-xs text-[#d29922]/80">
            Multiple properties need cleaning on the same day. With one cleaner, consider rescheduling.
          </p>
          {futureOverlaps.map(o => (
            <div key={o.date} className="flex items-center gap-3 text-xs">
              <span className="font-medium text-[#f0f6fc]">{formatDate(o.date)}</span>
              <span className="text-[#9198a1]">{o.properties.join(" + ")}</span>
              <span className={o.canMove ? "text-[#3fb950]" : "text-[#f85149]"}>
                {o.moveSuggestion}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Schedule table */}
      <div className="rounded-lg border border-[#21262d] bg-[#161b22]">
        <div className="border-b border-[#21262d] px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-[#9198a1]">
            Cleaning Schedule ({futureDays.length} upcoming)
          </h2>
        </div>
        {futureDays.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#7d8590]">No upcoming cleaning days</p>
        ) : (
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#21262d] text-left">
                  <th className="px-4 py-2 text-xs font-medium text-[#7d8590] w-[140px]">Date</th>
                  <th className="px-4 py-2 text-xs font-medium text-[#7d8590]">Type</th>
                  {mode === "dashboard" && (
                    <th className="px-4 py-2 text-xs font-medium text-[#7d8590]">Property</th>
                  )}
                  <th className="px-4 py-2 text-xs font-medium text-[#7d8590]">Reason</th>
                </tr>
              </thead>
              <tbody>
                {futureDays.map((day, i) => {
                  const isOverlap = futureOverlaps.some(o => o.date === day.date);
                  return (
                    <tr key={`${day.date}-${day.propertyId}-${i}`} className={`border-b border-[#21262d]/50 ${isOverlap ? "bg-[#d29922]/5" : "hover:bg-[#1c2128]"}`}>
                      <td className="px-4 py-2 text-sm text-[#f0f6fc] whitespace-nowrap">
                        {formatDate(day.date)}
                        {isOverlap && <span className="ml-1.5 text-[10px] text-[#d29922] font-medium">overlap</span>}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${
                          day.type === "cleaning"
                            ? "bg-[#d29922]/10 text-[#d29922]"
                            : "bg-[#58a6ff]/10 text-[#58a6ff]"
                        }`}>
                          {day.type === "cleaning" ? "Cleaning" : "Potential"}
                        </span>
                      </td>
                      {mode === "dashboard" && (
                        <td className="px-4 py-2 text-sm text-[#9198a1]">{day.property}</td>
                      )}
                      <td className="px-4 py-2 text-sm text-[#9198a1]">{day.reason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
