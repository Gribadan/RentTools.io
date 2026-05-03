import { describe, it, expect } from "vitest";
import {
  parseICal,
  generateICal,
  addDays,
  generateBufferedEvents,
} from "./ical";

describe("addDays", () => {
  it("adds positive days across month boundary", () => {
    expect(addDays("2026-01-30", 5)).toBe("2026-02-04");
  });

  it("subtracts days across year boundary", () => {
    expect(addDays("2026-01-02", -5)).toBe("2025-12-28");
  });

  it("handles zero days", () => {
    expect(addDays("2026-05-04", 0)).toBe("2026-05-04");
  });
});

describe("parseICal", () => {
  it("parses a single event with VALUE=DATE", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:abc-123",
      "SUMMARY:Booked",
      "DTSTART;VALUE=DATE:20260115",
      "DTEND;VALUE=DATE:20260120",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const events = parseICal(ics);
    expect(events).toHaveLength(1);
    expect(events[0]).toEqual({
      uid: "abc-123",
      summary: "Booked",
      startDate: "2026-01-15",
      endDate: "2026-01-20",
    });
  });

  it("parses DTSTART with time component", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:t-1",
      "SUMMARY:Stay",
      "DTSTART:20260301T140000Z",
      "DTEND:20260305T120000Z",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const events = parseICal(ics);
    expect(events[0].startDate).toBe("2026-03-01");
    expect(events[0].endDate).toBe("2026-03-05");
  });

  it("returns empty array when no VEVENTs", () => {
    expect(parseICal("BEGIN:VCALENDAR\r\nEND:VCALENDAR")).toEqual([]);
  });

  it("uses startDate as endDate when DTEND is missing", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:single-day",
      "SUMMARY:Day",
      "DTSTART;VALUE=DATE:20260601",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const events = parseICal(ics);
    expect(events[0].startDate).toBe("2026-06-01");
    expect(events[0].endDate).toBe("2026-06-01");
  });
});

describe("generateICal", () => {
  it("emits a VCALENDAR with one VEVENT per input event", () => {
    const out = generateICal([
      { uid: "u1", summary: "Block", startDate: "2026-04-10", endDate: "2026-04-12" },
    ]);
    expect(out).toContain("BEGIN:VCALENDAR");
    expect(out).toContain("END:VCALENDAR");
    expect(out).toContain("UID:u1");
    expect(out).toContain("DTSTART;VALUE=DATE:20260410");
    expect(out).toContain("DTEND;VALUE=DATE:20260412");
    expect(out).toContain("SUMMARY:Block");
  });

  it("strips non-ASCII characters from summary", () => {
    const out = generateICal([
      { uid: "u2", summary: "Привет world", startDate: "2026-04-10", endDate: "2026-04-11" },
    ]);
    expect(out).toContain("SUMMARY: world");
    expect(out).not.toContain("Привет");
  });

  it("round-trips through parseICal", () => {
    const original = [
      { uid: "rt-1", summary: "Stay", startDate: "2026-07-01", endDate: "2026-07-05" },
    ];
    const generated = generateICal(original);
    const parsed = parseICal(generated);
    expect(parsed[0].uid).toBe("rt-1");
    expect(parsed[0].startDate).toBe("2026-07-01");
    expect(parsed[0].endDate).toBe("2026-07-05");
  });
});

describe("generateBufferedEvents", () => {
  it("returns empty when no events", () => {
    expect(generateBufferedEvents([], 1, 1, "airbnb")).toEqual([]);
  });

  it("expands a single event by buffer days on each side and +1 for checkout", () => {
    const buffered = generateBufferedEvents(
      [{ uid: "x", summary: "S", startDate: "2026-05-10", endDate: "2026-05-15" }],
      2,
      1,
      "airbnb"
    );
    expect(buffered).toHaveLength(1);
    expect(buffered[0].startDate).toBe("2026-05-08"); // -2 buffer before
    expect(buffered[0].endDate).toBe("2026-05-17");   // +1 checkout +1 buffer after
  });

  it("merges adjacent events into a single block", () => {
    const buffered = generateBufferedEvents(
      [
        { uid: "a", summary: "S", startDate: "2026-06-01", endDate: "2026-06-05" },
        { uid: "b", summary: "S", startDate: "2026-06-06", endDate: "2026-06-10" },
      ],
      0,
      0,
      "booking"
    );
    expect(buffered).toHaveLength(1);
    expect(buffered[0].startDate).toBe("2026-06-01");
    expect(buffered[0].endDate).toBe("2026-06-11"); // merged through both checkouts
  });

  it("does not merge non-overlapping events with no buffer", () => {
    const buffered = generateBufferedEvents(
      [
        { uid: "a", summary: "S", startDate: "2026-06-01", endDate: "2026-06-05" },
        { uid: "b", summary: "S", startDate: "2026-06-15", endDate: "2026-06-20" },
      ],
      0,
      0,
      "airbnb"
    );
    expect(buffered).toHaveLength(2);
  });
});
