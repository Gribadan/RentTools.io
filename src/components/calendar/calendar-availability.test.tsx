import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Property, Reservation } from "@/lib/types";
import { useCalendarData, type CalendarData } from "./use-calendar-data";
import { CalendarGrid } from "./calendar-grid";
import { CalendarOverviewRow } from "./overview-row";
import { ConflictBanner } from "./conflict-banner";
import { buildCalendarExportText } from "./calendar-export";
import type { CalendarEvent } from "./types";

const reservation = (id: number, platform = "direct", start = "2027-03-01", end = "2027-03-25"): Reservation => ({
  id, platform, name: `Guest ${id}`, propertyId: 1, checkIn: start, checkOut: end, createdAt: "2027-01-01T00:00:00Z",
});
const property = (reservations: Reservation[] = []): Property => ({
  id: 1, userId: 1, name: "Sample property", minNights: 1, bookingWindow: 365,
  checkInTime: "14:00", checkOutTime: "12:00", cleaningEnabled: false,
  feedToken: null, createdAt: "2027-01-01T00:00:00Z", reservations,
});
const event = (platform = "airbnb", summary = "Airbnb (Not available)", startDate = "2027-03-08", endDate = "2027-03-14"): CalendarEvent => ({
  id: 1, platform, summary, startDate, endDate, uid: `${platform}-${summary}`,
});
function data(p: Property, events: CalendarEvent[]): CalendarData {
  let result: CalendarData | undefined;
  function Probe() { result = useCalendarData(p, events, [], []); return null; }
  renderToStaticMarkup(createElement(Probe));
  return result!;
}
function grid(calendar: CalendarData): string {
  const empty = new Set<string>();
  const props: ComponentProps<typeof CalendarGrid> = {
    year: 2027, month: 2, today: new Date(), minNights: 1, checkInTime: "14:00", checkOutTime: "12:00",
    ...calendar, selectedDates: empty, onSelectReservation: () => {}, onCellClick: () => {},
  };
  return renderToStaticMarkup(createElement(CalendarGrid, props));
}
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2027-03-01T12:00:00Z")); });
afterEach(() => vi.useRealTimers());

describe("platform availability and confirmed stays", () => {
  it("keeps an Airbnb availability block without inventing a conflict with a Direct stay", () => {
    const result = data(property([reservation(1)]), [event()]);
    expect(result.conflicts).toEqual([]);
    expect(result.conflictDates.size).toBe(0);
    expect(result.airbnbDates.has("2027-03-10")).toBe(true);
    expect(result.bars).toEqual(expect.arrayContaining([
      expect.objectContaining({ platform: "airbnb", isAvailabilityBlock: true }),
      expect.objectContaining({ platform: "direct", reservationId: 1, isAvailabilityBlock: false }),
    ]));
    const markup = grid(result);
    expect(markup).toContain("Platform availability block");
    expect(markup).not.toContain("CONFLICT");
    expect(markup).not.toContain("bg-rose-500 ring-1");
  });

  it.each(["Airbnb (Not available)", "not available", "BLOCKED"])("does not merge %s into an overlapping Airbnb reservation", summary => {
    const result = data(property(), [event("airbnb", summary), event("airbnb", "Reserved")]);
    expect(result.bars).toHaveLength(2);
    expect(result.bars.filter(bar => bar.isAvailabilityBlock)).toHaveLength(1);
    expect(result.conflicts).toEqual([]);
  });

  it("still detects Booking and Direct overlaps and identifies their actual channels", () => {
    const p = property([reservation(1)]);
    const events = [event("booking", "Reserved")];
    const result = data(p, events);
    expect([...result.conflictDates]).toEqual(["2027-03-08", "2027-03-09", "2027-03-10", "2027-03-11", "2027-03-12", "2027-03-13"]);
    expect(result.conflicts[0]).toMatchObject({ bookings: expect.arrayContaining([
      { platform: "booking", name: "Reserved" }, { platform: "direct", name: "Guest 1" },
    ]) });
    const banner = renderToStaticMarkup(createElement(ConflictBanner, { conflicts: result.conflicts }));
    expect(banner).toContain("Direct");
    expect(banner).toContain("Booking");
    expect(banner).not.toContain("Airbnb");
    const exported = buildCalendarExportText({ property: p, monthLabel: "March 2027", today: new Date(), syncedEvents: events, links: [], ...result });
    expect(exported).toContain("direct: Guest 1");
  });

  it("detects two overlapping Direct reservations", () => {
    const result = data(property([reservation(1), reservation(2, "direct", "2027-03-08", "2027-03-14")]), []);
    expect(result.conflictDates.has("2027-03-10")).toBe(true);
    expect(result.bars).toHaveLength(2);
  });

  it("does not mistake Booking's CLOSED reservation for an Airbnb availability block", () => {
    const result = data(property([reservation(1)]), [event("booking", "CLOSED - Not available")]);
    expect(result.conflictDates.has("2027-03-10")).toBe(true);
    expect(result.bars.find(bar => bar.platform === "booking")).toMatchObject({ isAvailabilityBlock: false });
  });

  it("treats same-day checkout and arrival as a turnover", () => {
    const result = data(property([reservation(1, "direct", "2027-03-01", "2027-03-08")]), [event("booking", "Reserved")]);
    expect(result.conflicts).toEqual([]);
  });

  it("lets a named claim turn a platform block into a real stay without duplicating its source", () => {
    const source = event();
    const claim = { ...reservation(1, "airbnb", source.startDate, source.endDate), linkedEventUid: source.uid, linkedEventPlatform: "airbnb", linkedEventRole: "claim" as const };
    const result = data(property([claim]), [source]);
    expect(result.bars).toHaveLength(1);
    expect(result.bars[0]).toMatchObject({ reservationId: 1, isAvailabilityBlock: false });
    expect(result.conflicts).toEqual([]);
    expect(data(property([claim, reservation(2)]), [source]).conflictDates.has("2027-03-10")).toBe(true);
  });

  it("does not highlight an availability bar because two other reservations conflict", () => {
    const result = data(property([reservation(1)]), [event(), event("booking", "Reserved")]);
    expect(result.bars.find(bar => bar.isAvailabilityBlock)).toMatchObject({ conflictDates: [] });
    expect(result.bars.find(bar => bar.reservationId === 1)).toMatchObject({ conflictDates: expect.arrayContaining(["2027-03-10"]) });
  });

  it("uses the same block and conflict semantics in the shared overview", () => {
    const p = property([reservation(1)]);
    const markup = renderToStaticMarkup(createElement(CalendarOverviewRow, {
      property: { ...p, canManage: true, syncFailed: false, overrides: [], links: [], events: [event()],
        reservations: p.reservations.map(r => ({ ...r, linkedEventUid: null, linkedEventPlatform: null, linkedEventRole: null })) },
      monthStart: "2027-03-01", monthEnd: "2027-04-01", onOpenProperty: () => {}, onOpenReservation: () => {},
    }));
    expect(markup).toContain("Platform availability block");
    expect(markup).not.toContain("Overlapping stays");
  });
});
