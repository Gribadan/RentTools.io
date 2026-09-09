import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  calendarLinkFindMany: vi.fn(),
  calendarLinkUpdate: vi.fn(),
  calendarEventFindMany: vi.fn(),
  calendarEventUpsert: vi.fn(),
  calendarEventDeleteMany: vi.fn(),
  reservationFindMany: vi.fn(),
  reservationUpdateMany: vi.fn(),
  syncLogCreate: vi.fn(),
  syncLogFindMany: vi.fn(),
  syncLogDeleteMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: mocks.transaction,
    calendarLink: {
      findMany: mocks.calendarLinkFindMany,
      update: mocks.calendarLinkUpdate,
    },
    calendarEvent: {
      findMany: mocks.calendarEventFindMany,
      upsert: mocks.calendarEventUpsert,
      deleteMany: mocks.calendarEventDeleteMany,
    },
    reservation: {
      findMany: mocks.reservationFindMany,
      updateMany: mocks.reservationUpdateMany,
    },
    syncLog: {
      create: mocks.syncLogCreate,
      findMany: mocks.syncLogFindMany,
      deleteMany: mocks.syncLogDeleteMany,
    },
  },
}));

import { syncAllCalendars } from "./calendar-sync";
import { prisma } from "@/lib/prisma";

const propertyId = 12;
const link = {
  id: 3,
  propertyId,
  platform: "airbnb",
  icalExportUrl: "https://example.test/calendar.ics",
  property: { name: "Apt 68" },
};
const oldEvent = {
  id: 41,
  propertyId,
  platform: "airbnb",
  uid: "old-uid",
  summary: "Reserved",
  startDate: "2099-08-19",
  endDate: "2099-08-23",
};

function ical(events: Array<{ uid: string; start: string; end: string }>): string {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    ...events.flatMap((event) => [
      "BEGIN:VEVENT",
      `UID:${event.uid}`,
      `DTSTART;VALUE=DATE:${event.start.replaceAll("-", "")}`,
      `DTEND;VALUE=DATE:${event.end.replaceAll("-", "")}`,
      "SUMMARY:Reserved",
      "END:VEVENT",
    ]),
    "END:VCALENDAR",
  ].join("\r\n");
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation(async (callback) => callback(prisma));
  mocks.calendarLinkFindMany.mockResolvedValue([link]);
  mocks.calendarLinkUpdate.mockResolvedValue({ ...link, failureCount: 0 });
  mocks.calendarEventDeleteMany.mockResolvedValue({ count: 1 });
  mocks.calendarEventUpsert.mockResolvedValue({});
  mocks.reservationUpdateMany.mockResolvedValue({ count: 2 });
  mocks.reservationFindMany.mockResolvedValue([]);
  mocks.syncLogCreate.mockResolvedValue({});
  mocks.syncLogFindMany.mockResolvedValue([]);
  mocks.syncLogDeleteMany.mockResolvedValue({ count: 0 });
});

describe("calendar sync — durable linked reservation metadata", () => {
  it("migrates claims and extensions by exact source platform on UID reissue", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          ical([{ uid: "new-uid", start: "2099-08-19", end: "2099-08-23" }]),
          { status: 200 },
        ),
      ),
    );
    mocks.calendarEventFindMany
      .mockResolvedValueOnce([oldEvent])
      .mockResolvedValueOnce([{ platform: "airbnb", uid: "new-uid" }]);
    mocks.reservationFindMany.mockResolvedValue([
      {
        id: 7,
        platform: "direct",
        linkedEventUid: "new-uid",
        linkedEventPlatform: "airbnb",
      },
    ]);

    const result = await syncAllCalendars({ propertyIds: [propertyId] });

    expect(result).toMatchObject({ propertiesSynced: 1, removedEvents: 1, errors: 0 });
    expect(mocks.reservationUpdateMany).toHaveBeenCalledWith({
      where: {
        propertyId,
        linkedEventUid: "old-uid",
        OR: [
          { linkedEventPlatform: "airbnb" },
          { linkedEventPlatform: null, platform: "airbnb" },
        ],
      },
      data: { linkedEventUid: "new-uid" },
    });
  });

  it("unlinks every segment and clears all link fields when the source is cancelled", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(ical([]), { status: 200 })),
    );
    mocks.calendarEventFindMany.mockResolvedValueOnce([oldEvent]);

    const result = await syncAllCalendars({ propertyIds: [propertyId] });

    expect(result).toMatchObject({ propertiesSynced: 1, removedEvents: 1, errors: 0 });
    expect(mocks.reservationUpdateMany).toHaveBeenCalledWith({
      where: {
        propertyId,
        linkedEventUid: "old-uid",
        OR: [
          { linkedEventPlatform: "airbnb" },
          { linkedEventPlatform: null, platform: "airbnb" },
        ],
      },
      data: {
        linkedEventUid: null,
        linkedEventPlatform: null,
        linkedEventRole: null,
      },
    });
  });
});

describe("calendar sync — authoritative snapshots", () => {
  it("adds a transport code without exposing the cause message or provider URL", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed", {
      cause: { code: "ECONNRESET", message: "https://private.example/ical?token=SECRET" },
    })));
    const result = await syncAllCalendars({ propertyIds: [propertyId] });
    expect(result.errors).toBe(1);
    expect(mocks.calendarLinkUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ lastError: "fetch failed (ECONNRESET)" }),
    }));
    expect(JSON.stringify(mocks.syncLogCreate.mock.calls)).not.toContain("SECRET");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("keeps bounded distinct aggregate codes and rejects unsafe or oversized codes", async () => {
    const cause = new AggregateError([
      { code: "ENETUNREACH", message: "private provider address" },
      { code: "ENETUNREACH" },
      { code: "https://private.example/?token=SECRET" },
      { code: "X".repeat(41) },
      { code: "ETIMEDOUT" },
      { code: "ECONNREFUSED" },
      { code: "EAI_AGAIN" },
      { code: "ECONNRESET" },
    ], "private aggregate details");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed", { cause })));
    await syncAllCalendars({ propertyIds: [propertyId] });
    expect(mocks.calendarLinkUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ lastError: "fetch failed (ENETUNREACH, ETIMEDOUT, ECONNREFUSED, EAI_AGAIN)" }),
    }));
    expect(JSON.stringify(mocks.syncLogCreate.mock.calls)).not.toContain("private");
  });

  it("preserves the original message when the cause has no safe transport code", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("fetch failed", {
      cause: { code: "secret-lowercase-token", message: "private cause" },
    })));
    await syncAllCalendars({ propertyIds: [propertyId] });
    expect(mocks.calendarLinkUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ lastError: "fetch failed" }),
    }));
  });

  it("reports a failed snapshot transaction as a failed link, without claiming success", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(ical([]))));
    mocks.transaction.mockRejectedValueOnce(new Error("database busy"));
    const result = await syncAllCalendars({ propertyIds: [propertyId] });
    expect(result).toMatchObject({ newEvents: 0, updatedEvents: 0, removedEvents: 0, errors: 1 });
    expect(mocks.calendarLinkUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ lastError: "Sync failed: database busy", failureCount: { increment: 1 } }),
    }));
  });

  it("updates a changed checkout under the same UID without unlinking guest details", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(ical([
      { uid: oldEvent.uid, start: oldEvent.startDate, end: "2099-08-24" },
    ]))));
    mocks.calendarEventFindMany.mockResolvedValueOnce([oldEvent]);
    const result = await syncAllCalendars({ propertyIds: [propertyId] });
    expect(result).toMatchObject({ newEvents: 0, updatedEvents: 1, removedEvents: 0, errors: 0 });
    expect(mocks.calendarEventUpsert).toHaveBeenCalledWith(expect.objectContaining({
      update: { summary: "Reserved", startDate: oldEvent.startDate, endDate: "2099-08-24" },
    }));
    expect(mocks.calendarEventDeleteMany).not.toHaveBeenCalled();
    expect(mocks.reservationUpdateMany).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(link.icalExportUrl, expect.objectContaining({ cache: "no-store" }));
  });

  it.each([
    ical([]).replace("END:VCALENDAR", ""),
    ical([{ uid: "unreadable", start: "2099-08-19", end: "2099-08-23" }]).replace("20990819", "invalid"),
    ical([{ uid: "incomplete", start: "2099-08-19", end: "2099-08-23" }]).replace("END:VEVENT", ""),
  ])("preserves all previous bookings when the provider returns a malformed snapshot (%#)", async (body) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body)));
    mocks.calendarEventFindMany.mockResolvedValue([oldEvent]);
    const result = await syncAllCalendars({ propertyIds: [propertyId] });
    expect(result).toMatchObject({ newEvents: 0, updatedEvents: 0, removedEvents: 0, errors: 1 });
    expect(mocks.calendarEventUpsert).not.toHaveBeenCalled();
    expect(mocks.calendarEventDeleteMany).not.toHaveBeenCalled();
    expect(mocks.calendarLinkUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ lastError: expect.any(String), failureCount: { increment: 1 } }),
    }));
  });

  it("retains a real one-night CLOSED block immediately before another stay", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(ical([
      { uid: "one-night", start: "2099-08-18", end: "2099-08-19" },
      { uid: oldEvent.uid, start: oldEvent.startDate, end: oldEvent.endDate },
    ]).replace("SUMMARY:Reserved", "SUMMARY:CLOSED - Not available"))));
    mocks.calendarEventFindMany.mockResolvedValueOnce([oldEvent]);
    const result = await syncAllCalendars({ propertyIds: [propertyId] });
    expect(result).toMatchObject({ newEvents: 1, removedEvents: 0, errors: 0 });
    expect(mocks.calendarEventUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ uid: "one-night", startDate: "2099-08-18", endDate: "2099-08-19" }),
    }));
  });

  it("still excludes explicit RentTools feedback events", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(ical([
      { uid: "renttool-feedback", start: "2099-08-18", end: "2099-08-19" },
    ]))));
    mocks.calendarEventFindMany.mockResolvedValueOnce([]);
    const result = await syncAllCalendars({ propertyIds: [propertyId] });
    expect(result).toMatchObject({ newEvents: 0, removedEvents: 0, errors: 0 });
    expect(mocks.calendarEventUpsert).not.toHaveBeenCalled();
  });
});
