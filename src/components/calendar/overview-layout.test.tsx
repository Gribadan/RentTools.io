import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CalendarOverviewProperty } from "@/lib/calendar-overview";
import type { Property, Reservation } from "@/lib/types";
import { reservationNights } from "@/lib/reservation-dates";
import { I18nProvider } from "@/lib/i18n/context";
import { translations, type Locale } from "@/lib/i18n/translations";
import { layoutOverviewBar, overviewDayCount, OVERVIEW_DAY_WIDTH } from "./overview-layout";
import { CalendarOverviewRow } from "./overview-row";
import type { CalendarBar, CalendarEvent } from "./types";
import { useCalendarData, type CalendarData } from "./use-calendar-data";

const bar: CalendarBar = { startDate: "2026-10-18", endDate: "2026-10-24", name: "First guest", platform: "direct" };

function reservation(id: number, start: string, end: string): Reservation {
  return { id, propertyId: 1, name: `Guest ${id}`, platform: "direct", checkIn: `${start}T00:00:00.000Z`, checkOut: `${end}T00:00:00.000Z`, createdAt: "2026-01-01T00:00:00.000Z" };
}

function property(reservations: Reservation[] = []): Property {
  return { id: 1, userId: 1, name: "Apartment", minNights: 1, checkInTime: "14:00", checkOutTime: "12:00", bookingWindow: 365, cleaningEnabled: false, feedToken: null, createdAt: "", reservations };
}

function canonicalBars(reservations: Reservation[], events: CalendarEvent[] = []): CalendarData {
  let result: CalendarData | undefined;
  function Probe() {
    result = useCalendarData(property(reservations), events, [], []);
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return result!;
}

function overviewProperty(): CalendarOverviewProperty {
  return {
    id: 1,
    name: "A very long apartment name with a separate entrance and a courtyard",
    minNights: 1,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    bookingWindow: 365,
    cleaningEnabled: false,
    canManage: true,
    reservations: [
      { id: 1, name: "First guest", checkIn: "2026-10-18", checkOut: "2026-10-24", platform: "direct", linkedEventUid: null, linkedEventPlatform: null, linkedEventRole: null },
      { id: 2, name: "Second guest", checkIn: "2026-10-24", checkOut: "2026-10-26", platform: "direct", linkedEventUid: null, linkedEventPlatform: null, linkedEventRole: null },
    ],
    events: [],
    links: [],
    overrides: [],
    syncFailed: false,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe("overview date-only geometry", () => {
  it("counts leap months and the year boundary without local-time arithmetic", () => {
    expect(overviewDayCount("2028-02-01", "2028-03-01")).toBe(29);
    expect(overviewDayCount("2026-12-01", "2027-01-01")).toBe(31);
    expect(overviewDayCount("bad", "2027-01-01")).toBe(0);
  });

  it.each(["America/Los_Angeles", "Pacific/Kiritimati", "Europe/Berlin"])("keeps the same occupied columns in %s", (timezone) => {
    vi.stubEnv("TZ", timezone);
    expect(layoutOverviewBar(bar, "2026-10-01", "2026-11-01")).toEqual({ startColumn: 17, span: 6, continuesBefore: false, continuesAfter: false, rowIdx: 0 });
    expect(layoutOverviewBar({ ...bar, startDate: "2026-12-30", endDate: "2027-01-03" }, "2027-01-01", "2027-02-01")).toMatchObject({ startColumn: 0, span: 2, continuesBefore: true, continuesAfter: false });
  });

  it("clips long stays at both month boundaries", () => {
    expect(layoutOverviewBar({ ...bar, startDate: "2026-08-10", endDate: "2027-01-14", rowIdx: 2 }, "2026-10-01", "2026-11-01")).toEqual({ startColumn: 0, span: 31, continuesBefore: true, continuesAfter: true, rowIdx: 2 });
  });

  it("does not paint a checkout night or an out-of-month stay", () => {
    expect(layoutOverviewBar({ ...bar, endDate: "2026-11-01" }, "2026-11-01", "2026-12-01")).toBeNull();
    expect(layoutOverviewBar({ ...bar, startDate: "2026-11-01", endDate: "2026-11-03" }, "2026-10-01", "2026-11-01")).toBeNull();
    expect(layoutOverviewBar({ ...bar, endDate: bar.startDate }, "2026-10-01", "2026-11-01")).toBeNull();
  });
});

describe("overview canonical booking boundaries", () => {
  it.each([
    ["2026-10-18", "2026-10-24", "2026-10-26", "2026-10-01", "2026-11-01", 8],
    ["2027-01-06", "2027-01-09", "2027-01-10", "2027-01-01", "2027-02-01", 4],
  ])("keeps %s–%s / %s separate without double-counting nights", (start, turnover, end, monthStart, monthEnd, nights) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T12:00:00Z"));
    const reservations = [reservation(1, start, turnover), reservation(2, turnover, end)];
    const data = canonicalBars(reservations);
    expect(data.bars).toHaveLength(2);
    expect(data.bars.map((item) => item.rowIdx)).toEqual([0, 0]);
    const layouts = data.bars.map((item) => layoutOverviewBar(item, monthStart, monthEnd)!);
    expect(layouts[0].startColumn + layouts[0].span).toBe(layouts[1].startColumn);
    expect(layouts.reduce((total, layout) => total + layout.span, 0)).toBe(nights);
    expect(reservations.reduce((total, item) => total + reservationNights(item.checkIn, item.checkOut), 0)).toBe(nights);
  });

  it("retains adjacent source events instead of merging the guest change", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T12:00:00Z"));
    const data = canonicalBars([], [
      { id: 1, uid: "source-first", summary: "Reserved", platform: "booking", startDate: "2026-10-18", endDate: "2026-10-24" },
      { id: 2, uid: "source-second", summary: "Reserved", platform: "booking", startDate: "2026-10-24", endDate: "2026-10-26" },
    ]);
    expect(data.bars).toHaveLength(2);
    expect(data.bars.map((item) => item.rowIdx)).toEqual([0, 0]);
  });

  it("keeps real intersections in separate visible lanes", () => {
    const data = canonicalBars([reservation(1, "2026-10-18", "2026-10-25"), reservation(2, "2026-10-24", "2026-10-26")]);
    expect(data.bars).toHaveLength(2);
    expect(new Set(data.bars.map((item) => item.rowIdx)).size).toBe(2);
    expect(data.bars.map((item) => layoutOverviewBar(item, "2026-10-01", "2026-11-01")?.rowIdx)).toEqual([0, 1]);
  });
});

describe("overview row markup", () => {
  it("keeps long property identity sticky and both reservation actions keyboard reachable", () => {
    const markup = renderToStaticMarkup(createElement(CalendarOverviewRow, {
      property: overviewProperty(), monthStart: "2026-10-01", monthEnd: "2026-11-01", onOpenProperty: () => {}, onOpenReservation: () => {},
    }));
    expect(markup).toContain("sticky left-0");
    expect(markup).toContain(overviewProperty().name);
    expect(markup).toContain("Calendar →");
    expect(markup).toContain('data-reservation-id="1"');
    expect(markup).toContain('data-reservation-id="2"');
    expect(markup.match(/data-lane="0"/g)).toHaveLength(2);
    expect(markup).toContain(`left:${23 * OVERVIEW_DAY_WIDTH + 2}px`);
    expect(markup).toContain('aria-label="First guest');
  });

  it("offers individual-calendar actions for redacted cleaner stays without reservation ids", () => {
    const projected = overviewProperty();
    projected.canManage = false;
    projected.reservations = projected.reservations.map((item) => ({ ...item, id: undefined, name: "Reserved" }));
    const markup = renderToStaticMarkup(createElement(CalendarOverviewRow, {
      property: projected, monthStart: "2026-10-01", monthEnd: "2026-11-01", onOpenProperty: () => {}, onOpenReservation: () => {},
    }));
    expect(markup).not.toContain("data-reservation-id");
    expect(markup).not.toContain("Open reservation");
    expect(markup).toContain("Open property calendar");
    expect(markup.match(/data-lane="0"/g)).toHaveLength(2);
  });

  it("marks failed synchronization as unverified even when no stays were returned", () => {
    const projected = { ...overviewProperty(), syncFailed: true, reservations: [] };
    const markup = renderToStaticMarkup(createElement(CalendarOverviewRow, {
      property: projected, monthStart: "2026-10-01", monthEnd: "2026-11-01", onOpenProperty: () => {}, onOpenReservation: () => {},
    }));
    expect(markup).toContain('data-calendar-status="unverified"');
    expect(markup).toContain("Sync failed. Availability unverified.");
    expect(markup).toContain("bg-amber-500/10");
  });

  it.each(["en", "ru", "de", "fr", "es"] as const)("shows existing manual cleaning blocks in an otherwise empty %s row", (locale: Locale) => {
    const projected: CalendarOverviewProperty = {
      ...overviewProperty(), cleaningEnabled: true, reservations: [], overrides: [{ date: "2026-10-16", type: "cleaning" }],
    };
    const row = createElement(CalendarOverviewRow, {
      property: projected, monthStart: "2026-10-01", monthEnd: "2026-11-01", onOpenProperty: () => {}, onOpenReservation: () => {},
    });
    const markup = renderToStaticMarkup(<I18nProvider initialLocale={locale}>{row}</I18nProvider>);
    expect(markup).toContain('data-visible-booking-count="0"');
    expect(markup).toContain('data-blocked-date-count="1"');
    expect(markup).toContain('data-date="2026-10-16" data-date-status="cleaning"');
    expect(markup).toContain("bg-[var(--cleaning-cell-bg)]");
    expect(markup).toContain(translations["calendar.manualCleaning"][locale]);
  });

  it("honors the existing cleaning-disabled setting without hiding closed overrides", () => {
    const projected: CalendarOverviewProperty = {
      ...overviewProperty(), cleaningEnabled: false, reservations: [], overrides: [{ date: "2026-10-16", type: "cleaning" }, { date: "2026-10-17", type: "closed" }],
    };
    const markup = renderToStaticMarkup(createElement(CalendarOverviewRow, {
      property: projected, monthStart: "2026-10-01", monthEnd: "2026-11-01", onOpenProperty: () => {}, onOpenReservation: () => {},
    }));
    expect(markup).not.toContain("Manual cleaning");
    expect(markup).not.toContain('data-date-status="cleaning"');
    expect(markup).toContain('data-date="2026-10-16" data-date-status="unmodified"');
    expect(markup).toContain('data-date="2026-10-17" data-date-status="closed"');
    expect(markup).toContain('data-visible-booking-count="0"');
    expect(markup).toContain('data-blocked-date-count="1"');
  });

  it("shows preparation buffers while preserving occupied nights and explicit open overrides", () => {
    const projected: CalendarOverviewProperty = {
      ...overviewProperty(), cleaningEnabled: true,
      reservations: [overviewProperty().reservations[0]],
      links: [{ platform: "airbnb", bufferBefore: 2, bufferAfter: 2 }],
      overrides: [{ date: "2026-10-16", type: "open" }],
    };
    const markup = renderToStaticMarkup(createElement(CalendarOverviewRow, {
      property: projected, monthStart: "2026-10-01", monthEnd: "2026-11-01", onOpenProperty: () => {}, onOpenReservation: () => {},
    }));
    for (const day of ["2026-10-17", "2026-10-25", "2026-10-26"]) {
      expect(markup).toContain(`data-date="${day}" data-date-status="buffer"`);
    }
    expect(markup).toContain('data-date="2026-10-16" data-date-status="open"');
    expect(markup).toContain('data-date="2026-10-18" data-date-status="unmodified"');
    expect(markup).toContain('data-blocked-date-count="3"');
    expect(markup).toContain("Cleaning buffer");
  });

  it("renders buffer-only occupancy from bookings in the neighboring month", () => {
    const projected: CalendarOverviewProperty = {
      ...overviewProperty(), cleaningEnabled: true,
      reservations: [{ ...overviewProperty().reservations[0], checkIn: "2026-09-26", checkOut: "2026-09-30" }],
      links: [{ platform: "airbnb", bufferBefore: 2, bufferAfter: 2 }],
    };
    const markup = renderToStaticMarkup(createElement(CalendarOverviewRow, {
      property: projected, monthStart: "2026-10-01", monthEnd: "2026-11-01", onOpenProperty: () => {}, onOpenReservation: () => {},
    }));
    expect(markup).toContain('data-visible-booking-count="0"');
    expect(markup).toContain('data-blocked-date-count="2"');
    expect(markup).toContain('data-date="2026-10-01" data-date-status="buffer"');
    expect(markup).toContain('data-date="2026-10-02" data-date-status="buffer"');
  });

  it("does not invent a definite buffer when an earlier stay leaves flexible cleaning time", () => {
    const projected: CalendarOverviewProperty = {
      ...overviewProperty(), cleaningEnabled: true,
      reservations: [
        { ...overviewProperty().reservations[0], checkIn: "2026-08-10", checkOut: "2026-08-12" },
        overviewProperty().reservations[0],
      ],
      links: [{ platform: "airbnb", bufferBefore: 2, bufferAfter: 2 }],
    };
    const markup = renderToStaticMarkup(createElement(CalendarOverviewRow, {
      property: projected, monthStart: "2026-10-01", monthEnd: "2026-11-01", onOpenProperty: () => {}, onOpenReservation: () => {},
    }));
    expect(markup).toContain('data-date="2026-10-16" data-date-status="potential"');
    expect(markup).toContain('data-date="2026-10-17" data-date-status="potential"');
  });
});
