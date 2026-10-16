import { afterEach, describe, expect, it, vi } from "vitest";
import type { CalendarLink, DateOverride, Property, Reservation } from "@/lib/types";
import { computeCleaningDays } from "./cleaning-schedule";

function reservation(overrides: Partial<Reservation> = {}): Reservation {
  return {
    id: 1,
    name: "Joanne",
    checkIn: "2026-08-23T00:00:00.000Z",
    checkOut: "2026-08-25T00:00:00.000Z",
    platform: "direct",
    propertyId: 68,
    createdAt: "2026-08-01T00:00:00.000Z",
    linkedEventUid: "source-uid",
    linkedEventPlatform: "airbnb",
    linkedEventRole: "extension",
    ...overrides,
  };
}

function property(reservations: Reservation[]): Property {
  return {
    id: 68,
    userId: 3,
    name: "Apt 68",
    minNights: 1,
    checkInTime: "14:00",
    checkOutTime: "12:00",
    bookingWindow: 365,
    cleaningEnabled: true,
    feedToken: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    reservations,
  };
}

function link(): CalendarLink {
  return {
    id: 1,
    propertyId: 68,
    platform: "airbnb",
    icalExportUrl: "https://example.com/calendar.ics",
    bufferBefore: 0,
    bufferAfter: 0,
    lastFetchedAt: null,
    lastError: null,
    failureCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function source(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    uid: "source-uid",
    platform: "airbnb",
    summary: "Joanne",
    startDate: "2026-08-19",
    endDate: "2026-08-23",
    ...overrides,
  };
}

afterEach(() => vi.unstubAllEnvs());

function override(type: DateOverride["type"], date = "2026-11-07"): DateOverride {
  return { id: 1, propertyId: 68, date, type, note: "Host instruction", createdAt: "2026-10-01T00:00:00Z" };
}

describe("availability blocks and explicit cleaning", () => {
  it("does not turn a plain closed date into a cleaning task", () => {
    expect(computeCleaningDays(property([]), [], [link()], [override("closed")])).toEqual([]);
  });

  it("lists an explicitly scheduled cleaning with its note", () => {
    const days = computeCleaningDays(property([]), [], [link()], [override("cleaning")]);
    expect(days).toMatchObject([{ date: "2026-11-07", kind: "manual", isManual: true, manualNote: "Host instruction" }]);
  });

  it("retains a real checkout cleaning when its night is also closed", () => {
    const days = computeCleaningDays(property([]), [source()], [link()], [override("closed", "2026-08-23")]);
    expect(days.filter(day => day.type === "cleaning")).toMatchObject([{ date: "2026-08-23", kind: "after" }]);
  });

  it("uses the manual cleaning instruction in place of an automatic suggestion", () => {
    const days = computeCleaningDays(property([]), [source()], [link()], [override("cleaning", "2026-08-23")]);
    expect(days.filter(day => day.date === "2026-08-23")).toMatchObject([{ kind: "manual", isManual: true, manualNote: "Host instruction" }]);
  });

  it("keeps manual checkout cleaning on the chosen day in a western timezone", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    const days = computeCleaningDays(property([reservation({ linkedEventUid: null })]), [], [link()]);
    expect(days.filter(day => day.type === "cleaning").map(day => day.date)).toEqual(["2026-08-25"]);
  });
});

describe("connected-stay cleaning boundaries", () => {
  it("removes the internal source-to-Direct cleaning and keeps final checkout", () => {
    const days = computeCleaningDays(
      property([reservation()]),
      [source()],
      [link()],
    );

    expect(days.filter((day) => day.type === "cleaning").map((day) => day.date)).toEqual([
      "2026-08-25",
    ]);
  });

  it("connects a Direct extension to the effective source-plus-claim union", () => {
    const claim = reservation({
      id: 2,
      checkIn: "2026-08-19T00:00:00.000Z",
      checkOut: "2026-08-25T00:00:00.000Z",
      platform: "airbnb",
      linkedEventRole: "claim",
    });
    const extension = reservation({
      id: 3,
      checkIn: "2026-08-25T00:00:00.000Z",
      checkOut: "2026-08-27T00:00:00.000Z",
    });

    const days = computeCleaningDays(
      property([claim, extension]),
      [source()],
      [link()],
    );

    expect(days.filter((day) => day.type === "cleaning").map((day) => day.date)).toEqual([
      "2026-08-27",
    ]);
  });

  it("uses platform plus UID and never links a same-UID event from another feed", () => {
    const bookingExtension = reservation({
      linkedEventPlatform: "booking",
    });
    const days = computeCleaningDays(
      property([bookingExtension]),
      [
        source(),
        source({
          id: 11,
          platform: "booking",
          startDate: "2026-08-28",
          endDate: "2026-08-30",
        }),
      ],
      [link()],
    );

    const cleaningDates = days
      .filter((day) => day.type === "cleaning")
      .map((day) => day.date);
    expect(cleaningDates).toContain("2026-08-23");
    expect(cleaningDates).toContain("2026-08-25");
  });

  it("keeps the narrow legacy null-role fallback for an exact adjacent source", () => {
    const legacyExtension = reservation({
      platform: "airbnb",
      linkedEventPlatform: null,
      linkedEventRole: null,
    });
    const days = computeCleaningDays(
      property([legacyExtension]),
      [source()],
      [link()],
    );

    expect(days.filter((day) => day.type === "cleaning").map((day) => day.date)).toEqual([
      "2026-08-25",
    ]);
  });
});
