import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { generateICal } from "./ical";

const mocks = vi.hoisted(() => ({
  calendarLinkFindMany: vi.fn(), calendarLinkUpdate: vi.fn(),
  calendarEventFindMany: vi.fn(), calendarEventUpsert: vi.fn(), calendarEventDeleteMany: vi.fn(),
  reservationUpdateMany: vi.fn(), transaction: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  $transaction: mocks.transaction,
  calendarLink: { findMany: mocks.calendarLinkFindMany, update: mocks.calendarLinkUpdate },
  calendarEvent: { findMany: mocks.calendarEventFindMany, upsert: mocks.calendarEventUpsert, deleteMany: mocks.calendarEventDeleteMany },
  reservation: { findMany: async () => [], updateMany: mocks.reservationUpdateMany },
  syncLog: { create: async () => ({}), findMany: async () => [], deleteMany: async () => ({ count: 0 }) },
} }));

import { syncAllCalendars } from "./calendar-sync";
import { prisma } from "@/lib/prisma";

const database = new PrismaClient({ adapter: new PrismaLibSql({ url: "file::memory:" }) });
const source = { id: 1, propertyId: 12, platform: "airbnb", uid: "source-uid", summary: "Reserved", startDate: "2099-08-19", endDate: "2099-08-23" };

beforeAll(async () => {
  await database.$executeRawUnsafe(`CREATE TABLE "Reservation" (
    "id" INTEGER PRIMARY KEY, "propertyId" INTEGER, "name" TEXT, "platform" TEXT,
    "linkedEventUid" TEXT, "linkedEventPlatform" TEXT, "linkedEventRole" TEXT,
    "checkIn" DATETIME, "checkOut" DATETIME, "updatedAt" DATETIME
  )`);
});

beforeEach(async () => {
  vi.resetAllMocks();
  await database.$executeRawUnsafe('DELETE FROM "Reservation"');
  for (const [id, platform, sourcePlatform, role, checkIn, checkOut] of [
    [1, "airbnb", "airbnb", "claim", "2099-08-19T14:00:00Z", "2099-08-23T12:00:00Z"],
    [2, "airbnb", "airbnb", "claim", "2099-08-19T00:00:00Z", "2099-08-25T00:00:00Z"],
    [3, "direct", "airbnb", "extension", "2099-08-23T00:00:00Z", "2099-08-25T00:00:00Z"],
    [4, "airbnb", null, null, "2099-08-19T00:00:00Z", "2099-08-23T00:00:00Z"],
    [5, "booking", "booking", "claim", "2099-08-19T00:00:00Z", "2099-08-23T00:00:00Z"],
    [6, "direct", "airbnb", "extension", "2099-08-19T00:00:00Z", "2099-08-23T00:00:00Z"],
  ] as const) {
    await database.$executeRaw`INSERT INTO "Reservation"
      ("id", "propertyId", "name", "platform", "linkedEventUid", "linkedEventPlatform", "linkedEventRole", "checkIn", "checkOut")
      VALUES (${id}, ${12}, ${"Saved guest name"}, ${platform}, ${source.uid}, ${sourcePlatform}, ${role}, ${new Date(checkIn)}, ${new Date(checkOut)})`;
  }
  mocks.transaction.mockImplementation(async callback => callback(prisma));
  mocks.calendarLinkFindMany.mockResolvedValue([{ id: 1, propertyId: 12, platform: "airbnb", icalExportUrl: "https://example.invalid/feed.ics", property: { name: "Test apartment" } }]);
  mocks.calendarEventFindMany.mockResolvedValue([source]);
  mocks.calendarEventDeleteMany.mockResolvedValue({ count: 1 });
  mocks.reservationUpdateMany.mockImplementation(args => database.reservation.updateMany(args));
});

afterEach(() => vi.unstubAllGlobals());
afterAll(() => database.$disconnect());

describe("source date changes with saved guest details", () => {
  it.each(["source-uid", "replacement-uid"])("follows changed dates for %s while preserving corrections, other channels and extensions", async uid => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(generateICal([
      { uid, summary: "Reserved", startDate: "2099-08-18", endDate: "2099-08-22" },
    ]))));
    expect(await syncAllCalendars({ propertyIds: [12] })).toMatchObject({ errors: 0 });
    const rows = await database.reservation.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, checkIn: true, checkOut: true, linkedEventUid: true },
    });
    for (const id of [1, 4]) {
      expect(rows.find(row => row.id === id)).toMatchObject({
        name: "Saved guest name", checkIn: new Date("2099-08-18"), checkOut: new Date("2099-08-22"), linkedEventUid: uid,
      });
    }
    expect(rows.find(row => row.id === 2)).toMatchObject({ checkIn: new Date("2099-08-19"), checkOut: new Date("2099-08-25") });
    expect(rows.find(row => row.id === 3)).toMatchObject({ checkIn: new Date("2099-08-23"), checkOut: new Date("2099-08-25") });
    expect(rows.find(row => row.id === 5)).toMatchObject({ checkIn: new Date("2099-08-19"), checkOut: new Date("2099-08-23"), linkedEventUid: "source-uid" });
    expect(rows.find(row => row.id === 6)).toMatchObject({ checkIn: new Date("2099-08-19"), checkOut: new Date("2099-08-23") });
  });

  it("leaves dates alone when only a source summary changes", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(generateICal([{ ...source, summary: "Changed summary" }]))));
    expect(await syncAllCalendars({ propertyIds: [12] })).toMatchObject({ errors: 0 });
    expect(mocks.reservationUpdateMany).not.toHaveBeenCalled();
  });
});
