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
  calendarName: string = "Rent Tool Sync"
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//RentTool//CalendarSync//EN",
    `X-WR-CALNAME:${calendarName}`,
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    const dtstart = event.startDate.replace(/-/g, "");
    const dtend = event.endDate.replace(/-/g, "");

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.uid}`);
    lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
    lines.push(`DTEND;VALUE=DATE:${dtend}`);
    lines.push(`SUMMARY:${event.summary}`);
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
  sourcePlatform: string
): ICalEvent[] {
  if (events.length === 0) return [];

  // Extend each event with buffer days
  const buffered = events.map((event) => ({
    start: addDays(event.startDate, -bufferBefore),
    end: addDays(event.endDate, bufferAfter),
    uid: event.uid,
  }));

  // Sort by start date
  buffered.sort((a, b) => a.start.localeCompare(b.start));

  // Merge overlapping/adjacent ranges so buffers between close bookings don't double up
  const merged: { start: string; end: string; uid: string }[] = [];
  for (const b of buffered) {
    const last = merged[merged.length - 1];
    if (last && b.start <= last.end) {
      // Overlapping or adjacent — extend the end if needed
      if (b.end > last.end) last.end = b.end;
      last.uid = `${last.uid}+${b.uid}`;
    } else {
      merged.push({ ...b });
    }
  }

  const label = `Blocked (${sourcePlatform}${bufferBefore || bufferAfter ? " +buffer" : ""})`;
  return merged.map((m) => ({
    uid: `renttool-${sourcePlatform}-${m.uid}`,
    summary: label,
    startDate: m.start,
    endDate: m.end,
  }));
}
