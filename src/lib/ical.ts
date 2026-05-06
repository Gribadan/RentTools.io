/**
 * iCal (.ics) parser and generator.
 * No external dependencies — iCal for blocked dates is a simple text format.
 */

export interface ICalEvent {
  uid: string;
  summary: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

/**
 * Parse an iCal (.ics) string into a list of events.
 * Handles both DATE and DATE-TIME formats.
 */
export function parseICal(icalText: string): ICalEvent[] {
  const events: ICalEvent[] = [];
  const blocks = icalText.split("BEGIN:VEVENT");

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split("END:VEVENT")[0];
    if (!block) continue;

    // Unfold lines (iCal spec: lines starting with space/tab are continuations)
    const unfolded = block.replace(/\r?\n[ \t]/g, "");
    const lines = unfolded.split(/\r?\n/);

    let uid = "";
    let summary = "";
    let startDate = "";
    let endDate = "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("UID:")) {
        uid = trimmed.substring(4).trim();
      } else if (trimmed.startsWith("SUMMARY:")) {
        summary = trimmed.substring(8).trim();
      } else if (trimmed.startsWith("DTSTART")) {
        startDate = extractDate(trimmed);
      } else if (trimmed.startsWith("DTEND")) {
        endDate = extractDate(trimmed);
      }
    }

    if (startDate) {
      // If no end date, assume 1-day event
      if (!endDate) endDate = startDate;
      if (!uid) uid = `parsed-${startDate}-${i}`;

      events.push({ uid, summary, startDate, endDate });
    }
  }

  return events;
}

/**
 * Extract a YYYY-MM-DD date from an iCal date line.
 * Handles: DTSTART;VALUE=DATE:20240115
 *          DTSTART:20240115T140000Z
 *          DTSTART;TZID=Europe/Berlin:20240115T140000
 */
function extractDate(line: string): string {
  const colonIdx = line.indexOf(":");
  if (colonIdx === -1) return "";

  const value = line.substring(colonIdx + 1).trim();
  // Take first 8 chars (YYYYMMDD) and format
  const raw = value.replace(/[^0-9]/g, "").substring(0, 8);
  if (raw.length < 8) return "";

  return `${raw.substring(0, 4)}-${raw.substring(4, 6)}-${raw.substring(6, 8)}`;
}

/**
 * Add days to a YYYY-MM-DD date string.
 */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00Z"); // noon UTC to avoid DST issues
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().substring(0, 10);
}

/**
 * Generate an iCal (.ics) string from a list of events.
 * Used to create enhanced feeds with buffer days.
 */
export function generateICal(
  events: ICalEvent[],
  calendarName: string = "RentTools Sync"
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RentTool//CalendarSync//EN",
    `X-WR-CALNAME:${calendarName}`,
    "METHOD:PUBLISH",
  ];

  // Some platforms (older Booking.com importers in particular) reject a
  // VCALENDAR with zero VEVENTs. Emit a single far-past placeholder so the
  // feed always validates while the property has no real bookings to share.
  const eventsToEmit: ICalEvent[] = events.length > 0 ? events : [{
    uid: "renttools-placeholder",
    summary: "RentTools placeholder",
    startDate: "1970-01-01",
    endDate: "1970-01-02",
  }];

  for (const event of eventsToEmit) {
    const dtstart = event.startDate.replace(/-/g, "");
    const dtend = event.endDate.replace(/-/g, "");
    // Sanitize UID and summary for iCal compatibility (ASCII only, no special chars)
    const uid = event.uid.replace(/[^a-zA-Z0-9@._-]/g, "_");
    const summary = event.summary.replace(/[^\x20-\x7E]/g, "");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
    lines.push(`DTEND;VALUE=DATE:${dtend}`);
    lines.push(`SUMMARY:${summary}`);
    lines.push(`DTSTAMP:${formatNowUTC()}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function formatNowUTC(): string {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
}

/**
 * Given events from one platform, generate blocked events with buffer days
 * for import into the other platform.
 */
export function generateBufferedEvents(
  events: ICalEvent[],
  bufferBefore: number,
  bufferAfter: number,
  sourcePlatform: string,
  _minNights: number = 3 // kept for API compat, not used in feed (platforms handle their own min-nights)
): ICalEvent[] {
  if (events.length === 0) return [];

  // Only export cleaning buffer days to platforms, NOT unbookable gap days.
  // Platforms handle their own min-night rules.
  // endDate is iCal exclusive (checkout day). Two cases:
  //   bufferAfter > 0 — the cleaner needs the checkout day plus N days
  //     of cleaning, so the block extends through (checkout + 1 + N).
  //     A new check-in is only possible after the cleaning window.
  //   bufferAfter === 0 — same-day turnover is the entire point of
  //     0-buffer mode: the previous guest leaves by checkOutTime and
  //     the new guest arrives at checkInTime on the SAME calendar
  //     day. Leave the checkout day OPEN in the outgoing iCal so the
  //     other platform can accept a check-in on that date.
  const buffered = events.map((event) => ({
    start: addDays(event.startDate, -bufferBefore),
    end: bufferAfter > 0
      ? addDays(event.endDate, 1 + bufferAfter)
      : event.endDate,
    count: 1,
  }));

  // Sort by start date
  buffered.sort((a, b) => a.start.localeCompare(b.start));

  // Merge overlapping/adjacent ranges so buffers between close bookings don't double up
  const merged: { start: string; end: string; count: number }[] = [];
  for (const b of buffered) {
    const last = merged[merged.length - 1];
    if (last && b.start <= last.end) {
      if (b.end > last.end) last.end = b.end;
      last.count++;
    } else {
      merged.push({ ...b, count: 1 });
    }
  }

  const label = `Blocked (${sourcePlatform}${bufferBefore || bufferAfter ? " +buffer" : ""})`;
  return merged.map((m, i) => ({
    uid: `renttool-${sourcePlatform}-${m.start}-${m.end}-${i}`,
    summary: label,
    startDate: m.start,
    endDate: m.end,
  }));
}

/**
 * Generate buffer-only events (cleaning days) around same-platform bookings.
 * Does NOT include the booking dates themselves — only the cleaning buffer days.
 */
export function generateBufferOnlyEvents(
  events: ICalEvent[],
  bufferBefore: number,
  bufferAfter: number,
  label: string = "Blocked (cleaning)"
): ICalEvent[] {
  if (events.length === 0) return [];

  const result: ICalEvent[] = [];

  for (const event of events) {
    // Buffer before: days before the booking starts
    if (bufferBefore > 0) {
      const start = addDays(event.startDate, -bufferBefore);
      result.push({
        uid: `renttool-buffer-before-${event.startDate}-${event.uid}`,
        summary: label,
        startDate: start,
        endDate: event.startDate, // exclusive end = up to (not including) booking start
      });
    }

    // Buffer after: day after checkout (endDate is checkout day)
    // Checkout day is guest's day, buffer starts next day
    if (bufferAfter > 0) {
      const start = addDays(event.endDate, 1); // day after checkout
      const end = addDays(event.endDate, 1 + bufferAfter);
      result.push({
        uid: `renttool-buffer-after-${event.endDate}-${event.uid}`,
        summary: label,
        startDate: start,
        endDate: end,
      });
    }
  }

  return result;
}
