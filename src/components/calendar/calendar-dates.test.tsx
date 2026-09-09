import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Property, Reservation } from "@/lib/types";
import { CalendarGrid } from "./calendar-grid";
import { buildCalendarExportText } from "./calendar-export";
import { useCalendarData, type CalendarData } from "./use-calendar-data";
import type { CalendarEvent } from "./types";

const reservation: Reservation = {
  id: 1,
  propertyId: 1,
  name: "Guest",
  platform: "booking",
  checkIn: "2026-10-09T00:00:00.000Z",
  checkOut: "2026-10-13T00:00:00.000Z",
  createdAt: "2026-09-09T00:00:00.000Z",
};

function property(reservations: Reservation[] = []): Property {
  return {
    id: 1,
    userId: 1,
    name: "Apartment",
    minNights: 1,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    bookingWindow: 365,
    cleaningEnabled: false,
    feedToken: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    reservations,
  };
}

function calendarData(p: Property, events: CalendarEvent[] = []): CalendarData {
  let result: CalendarData | undefined;
  function Probe() {
    result = useCalendarData(p, events, [], []);
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return result!;
}

function event(endDate: string, uid = "booking"): CalendarEvent {
  return { id: 1, platform: "booking", uid, summary: "Booking", startDate: "2026-10-09", endDate };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("calendar checkout dates", () => {
  it("keeps reservation dates and exported dates stable in a western timezone", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    expect(new Date(reservation.checkIn).getDate()).toBe(8);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
    const p = property([reservation]);
    const data = calendarData(p);
    expect(data.bars).toMatchObject([{ startDate: "2026-10-09", endDate: "2026-10-13" }]);
    expect(data.dateToReservation.has("2026-10-13")).toBe(true);
    const exported = buildCalendarExportText({
      property: p,
      monthLabel: "October 2026",
      today: new Date(),
      syncedEvents: [],
      links: [],
      bars: data.bars,
      bufferDates: data.bufferDates,
      potentialDates: data.potentialDates,
      unbookableDates: data.unbookableDates,
      conflicts: data.conflicts,
    });
    expect(exported).toContain("2026-10-09 → 2026-10-13 | Guest");
  });

  it("does not let a shorter same-start platform block hide the real checkout", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
    const shorter = event("2026-10-12", "short-block");
    const actual = event("2026-10-13", "actual-stay");
    for (const events of [[shorter, actual], [actual, shorter]]) {
      const data = calendarData(property(), events);
      expect(data.bars).toHaveLength(1);
      expect(data.bars[0]).toMatchObject({ startDate: "2026-10-09", endDate: "2026-10-13" });
    }
  });

  it("keeps the claimed guest paired with its own UID when merging a shorter block", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
    const data = calendarData(property([{ ...reservation, linkedEventUid: "z-actual", linkedEventRole: "claim" }]), [
      event("2026-10-12", "a-short"),
      event("2026-10-13", "z-actual"),
    ]);
    expect(data.bars).toHaveLength(1);
    expect(data.bars[0]).toMatchObject({ reservationId: 1, name: "Guest", eventUid: "z-actual", endDate: "2026-10-13" });
  });

  it("retains the exact source partner of a direct extension", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
    const extension: Reservation = {
      ...reservation,
      checkIn: "2026-10-13T00:00:00.000Z",
      checkOut: "2026-10-15T00:00:00.000Z",
      platform: "direct",
      linkedEventUid: "z-actual",
      linkedEventPlatform: "booking",
      linkedEventRole: "extension",
    };
    const data = calendarData(property([extension]), [event("2026-10-12", "a-short"), event("2026-10-13", "z-actual")]);
    expect(data.bars.find((bar) => bar.platform === "booking")).toMatchObject({ eventUid: "z-actual", linkedAfter: true });
    expect(data.bars.find((bar) => bar.reservationId === 1)).toMatchObject({ linkedBefore: true, isExtension: true });
  });

  it("keeps distinct claimed reservations individually accessible", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-09T12:00:00Z"));
    const data = calendarData(property([
      { ...reservation, id: 1, checkOut: "2026-10-12T00:00:00.000Z", linkedEventUid: "a-short", linkedEventRole: "claim" },
      { ...reservation, id: 2, name: "Second guest", linkedEventUid: "z-actual", linkedEventRole: "claim" },
    ]), [event("2026-10-12", "a-short"), event("2026-10-13", "z-actual")]);
    expect(data.bars).toHaveLength(2);
    expect(data.bars).toEqual(expect.arrayContaining([
      expect.objectContaining({ reservationId: 1, eventUid: "a-short" }),
      expect.objectContaining({ reservationId: 2, eventUid: "z-actual" }),
    ]));
  });

  it("renders the Oct 9–13 stay into the checkout cell on Tuesday the 13th", () => {
    const empty = new Set<string>();
    const markup = renderToStaticMarkup(createElement(CalendarGrid, {
      year: 2026,
      month: 9,
      today: new Date("2026-09-09T12:00:00Z"),
      minNights: 1,
      checkInTime: "14:00",
      checkOutTime: "12:00",
      bars: [{ ...event("2026-10-13"), name: "Booking", eventUid: "booking" }],
      bufferDates: empty,
      potentialDates: empty,
      unbookableDates: empty,
      sameDayCleaningDates: empty,
      conflictDates: empty,
      openOverrides: empty,
      closedOverrides: empty,
      cleaningOverrides: empty,
      selectedDates: empty,
      onSelectReservation: () => {},
      onCellClick: () => {},
    }));
    expect(markup).toContain("2026-10-09 14:00 → 2026-10-13 12:00");
    // The second week spans Monday plus half of Tuesday (checkout at noon).
    expect(markup).toContain("width:calc(200% - 0% - 50%");
  });
});
