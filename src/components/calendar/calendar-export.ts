import type { Property, CalendarLink } from "@/lib/types";
import { toDateStr } from "./utils";
import type { CalendarEvent, CalendarBar, ConflictInfo } from "./types";

export interface ExportInput {
  property: Property;
  monthLabel: string;
  today: Date;
  syncedEvents: CalendarEvent[];
  links: CalendarLink[];
  bars: CalendarBar[];
  bufferDates: Set<string>;
  potentialDates: Set<string>;
  unbookableDates: Set<string>;
  conflicts: ConflictInfo[];
}

export function buildCalendarExportText(input: ExportInput): string {
  const { property, monthLabel, today, syncedEvents, links, bars, bufferDates, potentialDates, unbookableDates, conflicts } = input;
  const lines: string[] = [];
  lines.push(`=== CALENDAR EXPORT: ${property.name} ===`);
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push(`Month: ${monthLabel}`);
  lines.push("");

  lines.push(`--- INTERNAL RESERVATIONS (${property.reservations.length}) ---`);
  for (const res of [...property.reservations].sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())) {
    const s = toDateStr(new Date(res.checkIn));
    const e = toDateStr(new Date(res.checkOut));
    lines.push(`[${res.platform?.toUpperCase()}] ${s} → ${e} | ${res.name} | ${res._count?.guests || 0} guests`);
  }
  lines.push("");

  const futureEvents = syncedEvents.filter(e => e.endDate >= toDateStr(today)).sort((a, b) => a.startDate.localeCompare(b.startDate));
  lines.push(`--- SYNCED CALENDAR EVENTS (${futureEvents.length} future) ---`);
  for (const ev of futureEvents) {
    lines.push(`[${ev.platform.toUpperCase()}] ${ev.startDate} → ${ev.endDate} | ${ev.summary} | UID: ${ev.uid}`);
  }
  lines.push("");

  lines.push(`--- CALENDAR LINKS (${links.length}) ---`);
  for (const link of links) {
    lines.push(`[${link.platform.toUpperCase()}] URL: ${link.icalExportUrl}`);
    lines.push(`  Buffer: ${link.bufferBefore}d before, ${link.bufferAfter}d after | Last sync: ${link.lastFetchedAt || "never"} | Error: ${link.lastError || "none"}`);
  }
  lines.push("");

  lines.push(`--- CALENDAR BARS (visible) ---`);
  for (const bar of [...bars].sort((a, b) => a.startDate.localeCompare(b.startDate))) {
    lines.push(`[${bar.platform.toUpperCase()}] ${bar.startDate} → ${bar.endDate} | "${bar.name}" | resId: ${bar.reservationId || "none"}`);
  }
  lines.push("");

  const sortedBuffers = Array.from(bufferDates).sort();
  lines.push(`--- CLEANING DAYS (${sortedBuffers.length}) — exported to platforms ---`);
  lines.push(sortedBuffers.join(", ") || "none");
  lines.push("");

  const sortedPotential = Array.from(potentialDates).sort();
  lines.push(`--- POTENTIAL CLEANING DAYS (${sortedPotential.length}) — if gap gets booked ---`);
  lines.push(sortedPotential.join(", ") || "none");
  lines.push("");

  const sortedUnbookable = Array.from(unbookableDates).sort();
  lines.push(`--- UNBOOKABLE GAP DAYS (${sortedUnbookable.length}) — visual only, <${property.minNights || 3} nights ---`);
  lines.push(sortedUnbookable.join(", ") || "none");
  lines.push("");

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

  return lines.join("\n");
}
