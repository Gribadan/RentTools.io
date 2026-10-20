import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { generateICal } from "./ical";

const mocks = vi.hoisted(() => ({
  calendarLinkFindMany: vi.fn(), calendarLinkUpdate: vi.fn(),
  calendarEventFindMany: vi.fn(), calendarEventUpsert: vi.fn(), calendarEventDeleteMany: vi.fn(),
  reservationUpdateMany: vi.fn(), transaction: vi.fn(), syncLogCreate: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  $transaction: mocks.transaction,
  calendarLink: { findMany: mocks.calendarLinkFindMany, update: mocks.calendarLinkUpdate },
  calendarEvent: { findMany: mocks.calendarEventFindMany, upsert: mocks.calendarEventUpsert, deleteMany: mocks.calendarEventDeleteMany },
  reservation: { findMany: async () => [], updateMany: mocks.reservationUpdateMany },
  syncLog: { create: mocks.syncLogCreate, findMany: async () => [], deleteMany: async () => ({ count: 0 }) },
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
  await database.$executeRawUnsafe(`CREATE TABLE "CalendarEvent" (
    "id" INTEGER PRIMARY KEY, "propertyId" INTEGER, "platform" TEXT, "uid" TEXT,
    "summary" TEXT, "startDate" TEXT, "endDate" TEXT, "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("propertyId", "platform", "uid")
  )`);
  await database.$executeRawUnsafe(`CREATE TABLE "CalendarLink" (
    "id" INTEGER PRIMARY KEY, "propertyId" INTEGER, "platform" TEXT, "icalExportUrl" TEXT,
    "bufferBefore" INTEGER DEFAULT 0, "bufferAfter" INTEGER DEFAULT 0,
    "lastFetchedAt" DATETIME, "lastError" TEXT, "failureCount" INTEGER DEFAULT 0,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

beforeEach(async () => {
  vi.resetAllMocks();
  await database.$executeRawUnsafe('DELETE FROM "Reservation"');
  await database.$executeRawUnsafe('DELETE FROM "CalendarEvent"');
  await database.$executeRawUnsafe('DELETE FROM "CalendarLink"');
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

  it("shortens an unchanged claim when a cancelled first night disappears under the same UID", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(generateICal([
      { ...source, startDate: "2099-08-20" },
    ]))));
    expect(await syncAllCalendars({ propertyIds: [12] })).toMatchObject({ updatedEvents: 1, removedEvents: 0, errors: 0 });
    const rows = await database.reservation.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, checkIn: true, checkOut: true, linkedEventUid: true },
    });
    for (const id of [1, 4]) {
      expect(rows.find(row => row.id === id)).toMatchObject({
        name: "Saved guest name", checkIn: new Date("2099-08-20"),
        checkOut: new Date("2099-08-23"), linkedEventUid: source.uid,
      });
    }
    expect(rows.find(row => row.id === 2)).toMatchObject({
      checkIn: new Date("2099-08-19"), checkOut: new Date("2099-08-25"), linkedEventUid: source.uid,
    });
    expect(rows.find(row => row.id === 3)).toMatchObject({
      checkIn: new Date("2099-08-23"), checkOut: new Date("2099-08-25"), linkedEventUid: source.uid,
    });
  });

  it("keeps separate adjacent source stays and follows the stable UID when a merged source splits", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(generateICal([
      { ...source, endDate: "2099-08-22" },
      { uid: "adjacent-stay", summary: "Reserved", startDate: "2099-08-22", endDate: "2099-08-23" },
    ]))));
    expect(await syncAllCalendars({ propertyIds: [12] })).toMatchObject({ newEvents: 1, updatedEvents: 1, errors: 0 });
    expect(mocks.calendarEventUpsert).toHaveBeenCalledTimes(2);
    expect(mocks.calendarEventUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ uid: source.uid, startDate: "2099-08-19", endDate: "2099-08-22" }),
    }));
    expect(mocks.calendarEventUpsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ uid: "adjacent-stay", startDate: "2099-08-22", endDate: "2099-08-23" }),
    }));
    expect(await database.reservation.findUnique({ where: { id: 1 }, select: { checkOut: true, linkedEventUid: true } }))
      .toEqual({ checkOut: new Date("2099-08-22"), linkedEventUid: source.uid });
  });
});

describe("ambiguous source UID changes", () => {
  it("does not assign all saved guests to the largest child when a source is reissued as two stays", async () => {
    const before = await savedRows();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(generateICal([
      { uid: "first-child", summary: "Reserved", startDate: "2099-08-19", endDate: "2099-08-22" },
      { uid: "second-child", summary: "Reserved", startDate: "2099-08-22", endDate: "2099-08-23" },
    ]))));
    expect(await syncAllCalendars({ propertyIds: [12] })).toMatchObject({ newEvents: 2, removedEvents: 1, errors: 0 });
    expect(await savedRows()).toEqual(before.map(row => row.id === 5 ? row : {
      ...row, linkedEventUid: null, linkedEventPlatform: null, linkedEventRole: null,
    }));
    expect(mocks.syncLogCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ level: "warn", message: expect.stringContaining("need review: source events split or merged") }),
    }));
  });

  it("does not combine saved guest identities when two old stays are reissued as one source block", async () => {
    const other = { ...source, id: 2, uid: "other-old-stay", startDate: "2099-08-23", endDate: "2099-08-25" };
    mocks.calendarEventFindMany.mockResolvedValue([source, other]);
    await database.$executeRaw`INSERT INTO "Reservation"
      ("id", "propertyId", "name", "platform", "linkedEventUid", "linkedEventPlatform", "linkedEventRole", "checkIn", "checkOut")
      VALUES (${7}, ${12}, ${"Other saved guest"}, ${"airbnb"}, ${other.uid}, ${"airbnb"}, ${"claim"}, ${new Date(other.startDate)}, ${new Date(other.endDate)})`;
    const before = await savedRows();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(generateICal([
      { uid: "merged-source", summary: "Reserved", startDate: source.startDate, endDate: other.endDate },
    ]))));
    expect(await syncAllCalendars({ propertyIds: [12] })).toMatchObject({ newEvents: 1, removedEvents: 2, errors: 0 });
    expect(await savedRows()).toEqual(before.map(row => row.id === 5 ? row : {
      ...row, linkedEventUid: null, linkedEventPlatform: null, linkedEventRole: null,
    }));
  });

  it("keeps a cancellation as a manual reservation without changing saved dates or guest data", async () => {
    const before = await savedRows();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response([
      "BEGIN:VCALENDAR", "VERSION:2.0", "BEGIN:VEVENT", `UID:${source.uid}`,
      "STATUS:CANCELLED", "END:VEVENT", "END:VCALENDAR",
    ].join("\r\n"))));
    expect(await syncAllCalendars({ propertyIds: [12] })).toMatchObject({ newEvents: 0, removedEvents: 1, errors: 0 });
    expect(await savedRows()).toEqual(before.map(row => row.id === 5 ? row : {
      ...row, linkedEventUid: null, linkedEventPlatform: null, linkedEventRole: null,
    }));
    expect(JSON.stringify(mocks.syncLogCreate.mock.calls)).not.toContain("need review: source events split or merged");
  });

  it("does not treat an adjacent replacement as an overlapping reissue", async () => {
    const before = await savedRows();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(generateICal([
      { uid: "following-stay", summary: "Reserved", startDate: source.endDate, endDate: "2099-08-25" },
    ]))));
    expect(await syncAllCalendars({ propertyIds: [12] })).toMatchObject({ newEvents: 1, removedEvents: 1, errors: 0 });
    expect(await savedRows()).toEqual(before.map(row => row.id === 5 ? row : {
      ...row, linkedEventUid: null, linkedEventPlatform: null, linkedEventRole: null,
    }));
  });

  it("rolls back source and claim changes together when a snapshot transaction fails", async () => {
    await database.calendarEvent.create({ data: source });
    await database.calendarLink.create({ data: { id: 1, propertyId: 12, platform: "airbnb", icalExportUrl: "https://example.invalid/feed.ics" } });
    const before = await savedRows();
    // LibSQL opens a separate connection for $transaction, which cannot
    // share this in-memory database. Keep the SQL rollback on one connection.
    mocks.transaction.mockImplementation(async callback => {
      await database.$executeRawUnsafe("BEGIN");
      try {
        await callback(database);
        throw new Error("simulated failure before snapshot commit");
      } catch (error) {
        await database.$executeRawUnsafe("ROLLBACK");
        throw error;
      }
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(generateICal([
      { uid: "replacement-uid", summary: "Reserved", startDate: "2099-08-20", endDate: source.endDate },
    ]))));
    expect(await syncAllCalendars({ propertyIds: [12] })).toMatchObject({ newEvents: 0, updatedEvents: 0, removedEvents: 0, errors: 1 });
    expect(await savedRows()).toEqual(before);
    expect(await database.calendarEvent.findMany({ select: { uid: true, startDate: true, endDate: true } }))
      .toEqual([{ uid: source.uid, startDate: source.startDate, endDate: source.endDate }]);
    expect(await database.calendarLink.findUnique({ where: { id: 1 }, select: { lastFetchedAt: true } }))
      .toEqual({ lastFetchedAt: null });
  });
});

function savedRows() {
  return database.reservation.findMany({
    orderBy: { id: "asc" },
    select: { id: true, name: true, checkIn: true, checkOut: true, linkedEventUid: true, linkedEventPlatform: true, linkedEventRole: true },
  });
}
