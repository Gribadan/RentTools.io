import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), properties: vi.fn(), managed: vi.fn(), assigned: vi.fn(), reservations: vi.fn(), events: vi.fn(), previousReservation: vi.fn(), previousEvent: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  property: { findMany: mocks.properties }, propertyManager: { findMany: mocks.managed },
  cleanerAssignment: { findMany: mocks.assigned }, reservation: { findMany: mocks.reservations, findFirst: mocks.previousReservation },
  calendarEvent: { findMany: mocks.events, findFirst: mocks.previousEvent },
} }));
import { GET } from "./route";

type Row = Record<string, unknown>;
type Query = { where: Row; select: Row };
const date = (value: string) => new Date(`${value}T00:00:00.000Z`);
const reservation = (id: number, propertyId: number, checkIn: string, checkOut: string, linkedEventUid: string | null = null) => ({
  id, propertyId, name: `Synthetic guest ${id}`, checkIn: date(checkIn), checkOut: date(checkOut),
  platform: "airbnb", linkedEventUid, linkedEventPlatform: linkedEventUid ? "airbnb" : null, linkedEventRole: linkedEventUid ? "claim" : null,
  phone: "private-contact", tgGroupUrl: "private-group", guests: [{ passportNumber: "private-document" }],
});
const propertyRows = [1, 2, 3, 4].map((id) => ({
  id, userId: id === 1 ? 7 : 80, name: `Synthetic property ${id}`, minNights: 1,
  checkInTime: "14:00", checkOutTime: "12:00", bookingWindow: 365, cleaningEnabled: true,
  feedToken: "private-feed", calendarLinks: [{ platform: "airbnb", bufferBefore: 0, bufferAfter: 0, lastError: null, lastFetchedAt: date("2026-10-20"), icalExportUrl: "private-source" }],
  dateOverrides: [{ date: "2026-10-08", type: "closed", note: "private-note" }, { date: "2020-01-01", type: "closed" }],
}));
const reservationRows = [
  reservation(11, 1, "2026-10-18", "2026-10-24"), reservation(12, 1, "2026-10-24", "2026-10-26"),
  reservation(13, 1, "2020-01-06", "2020-01-09"), reservation(14, 1, "2026-09-29", "2026-10-06", "shared-uid"),
  reservation(15, 2, "2026-10-23", "2026-10-29"), reservation(16, 3, "2026-10-14", "2026-10-16", "cleaner-private-uid"),
  reservation(17, 4, "2026-10-18", "2026-10-24", "shared-uid"),
  reservation(18, 1, "2026-09-28", "2026-09-30", "shared-uid"),
];
const eventRows = [
  { propertyId: 1, platform: "airbnb", uid: "shared-uid", summary: "Synthetic earlier source", startDate: "2026-09-28", endDate: "2026-09-30" },
  { propertyId: 3, platform: "airbnb", uid: "cleaner-private-uid", summary: "Synthetic private guest", startDate: "2026-10-14", endDate: "2026-10-16" },
  { propertyId: 3, platform: "airbnb", uid: "cleaner-private-block", summary: "Synthetic private Blocked details", startDate: "2026-10-18", endDate: "2026-10-20" },
  { propertyId: 4, platform: "airbnb", uid: "shared-uid", summary: "Foreign account", startDate: "2026-09-28", endDate: "2026-09-30" },
  { propertyId: 1, platform: "booking", uid: "old-uid", summary: "Old source", startDate: "2020-01-01", endDate: "2020-01-10" },
];

function comparable(value: unknown): string | number | null | undefined {
  if (value instanceof Date) return value.getTime();
  return value as string | number | null | undefined;
}
function matches(row: Row, where: Row): boolean {
  return Object.entries(where).every(([key, filter]) => {
    if (key === "OR") return (filter as Row[]).some((part) => matches(row, part));
    if (filter && typeof filter === "object" && !(filter instanceof Date)) {
      return Object.entries(filter).every(([operator, expected]) => {
        const actual = comparable(row[key]);
        const target = comparable(expected);
        if (operator === "in") return (expected as unknown[]).includes(row[key]);
        if (operator === "lt") return actual != null && target != null && actual < target;
        if (operator === "gt") return actual != null && target != null && actual > target;
        if (operator === "gte") return actual != null && target != null && actual >= target;
        throw new Error(`Unsupported fixture operator ${operator}`);
      });
    }
    return row[key] === filter;
  });
}
function project(row: Row, select: Row): Row {
  return Object.fromEntries(Object.entries(select).map(([key, option]) => {
    if (option === true) return [key, row[key]];
    const nested = option as { select: Row; where?: Row };
    return [key, (row[key] as Row[]).filter((child) => !nested.where || matches(child, nested.where)).map((child) => project(child, nested.select))];
  }));
}
const runQuery = (rows: Row[], { where, select }: Query) => rows.filter((row) => matches(row, where)).map((row) => project(row, select));
const request = (month = "2026-10") => new NextRequest(`https://renttools.test/api/calendar/overview?month=${month}`);

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ userId: 7, role: "user" });
  mocks.properties.mockImplementation((query: Query) => Promise.resolve(runQuery(propertyRows, query)));
  mocks.managed.mockImplementation(({ where }: Query) => Promise.resolve(where.managerId === 7 || where.managerId === 8 ? [{ propertyId: 2 }] : []));
  mocks.assigned.mockImplementation(({ where }: Query) => Promise.resolve(where.cleanerId === 7 || where.cleanerId === 9 ? [{ propertyId: 3 }] : []));
  mocks.reservations.mockImplementation((query: Query) => Promise.resolve(runQuery(reservationRows, query)));
  mocks.events.mockImplementation((query: Query) => Promise.resolve(runQuery(eventRows, query)));
  mocks.previousReservation.mockResolvedValue(null);
  mocks.previousEvent.mockResolvedValue(null);
});

describe("monthly calendar overview access and source projection", () => {
  it("requires authentication before querying any data", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    expect(mocks.properties).not.toHaveBeenCalled();
    expect(mocks.reservations).not.toHaveBeenCalled();
  });
  it.each(["", "2026-13", "2026-1", "2026-10-01"])("rejects month %s before querying", async (month) => {
    expect((await GET(request(month))).status).toBe(400);
    expect(mocks.properties).not.toHaveBeenCalled();
  });
  it("returns only owned and managed properties with bounded history and exact source partners", async () => {
    const response = await GET(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(body.properties.map((row: Row) => row.id)).toEqual([1, 2]);
    expect(body.properties.every((row: Row) => row.canManage)).toBe(true);
    expect(body.properties.every((row: Row) => row.syncFailed === false)).toBe(true);
    expect(body.properties[0].reservations.map((row: Row) => row.id)).toEqual([18, 14, 11, 12]);
    expect(body.properties[0].events).toEqual([expect.objectContaining({ uid: "shared-uid", startDate: "2026-09-28" })]);
    expect(body.properties[0].overrides).toEqual([{ date: "2026-10-08", type: "closed" }]);
    expect(JSON.stringify(body)).not.toMatch(/private-|Foreign account|old-uid|2020-01/);
    expect(mocks.reservations.mock.calls[0][0].where).toEqual({ propertyId: { in: [1, 2] }, checkIn: { lt: date("2026-11-02") }, checkOut: { gte: date("2026-09-30") } });
    for (const [query] of [...mocks.reservations.mock.calls, ...mocks.events.mock.calls]) {
      expect(query.where.propertyId).toEqual({ in: [1, 2] });
      expect(query.where.checkIn || query.where.startDate || query.where.OR).toBeTruthy();
    }
    expect(mocks.assigned).not.toHaveBeenCalled();
  });
  it("redacts cleaner-only identities without breaking linked source equality or blocked semantics", async () => {
    mocks.session.mockResolvedValue({ userId: 9, role: "cleaner" });
    const body = await (await GET(request())).json();
    expect(body.properties.map((row: Row) => row.id)).toEqual([3]);
    const row = body.properties[0];
    expect(row.canManage).toBe(false);
    expect(row.reservations[0].id).toBeUndefined();
    expect(row.reservations[0].name).toBe("Reserved");
    expect(row.events[0].summary).toBe("Reserved");
    expect(row.events[1].summary).toBe("Blocked");
    expect(row.reservations[0].linkedEventUid).toBe(row.events[0].uid);
    expect(JSON.stringify(body)).not.toMatch(/private|Synthetic guest|Synthetic private|"id":16|shared-uid/);
  });
  it("limits a separately granted manager to their assigned property", async () => {
    mocks.session.mockResolvedValue({ userId: 8, role: "user" });
    const body = await (await GET(request())).json();
    expect(body.properties.map((row: Row) => row.id)).toEqual([2]);
    expect(body.properties[0].canManage).toBe(true);
    expect(body.properties[0].reservations.map((row: Row) => row.id)).toEqual([15]);
  });
  it("keeps legacy timed boundary rows date-stable and clips next-month context at rendering time", async () => {
    const rows = [
      { ...reservation(31, 1, "2026-09-30", "2026-10-01"), checkIn: new Date("2026-09-30T14:00:00Z"), checkOut: new Date("2026-10-01T12:00:00Z") },
      { ...reservation(32, 1, "2026-10-31", "2026-11-02"), checkIn: new Date("2026-10-31T23:00:00Z") },
      reservation(33, 1, "2026-11-01", "2026-11-02"),
    ];
    mocks.reservations.mockImplementation((query: Query) => Promise.resolve(runQuery(rows, query)));
    const body = await (await GET(request())).json();
    expect(body.properties[0].reservations.map((row: Row) => row.id)).toEqual([31, 32, 33]);
    expect(body.properties[0].reservations[0].checkOut).toBe("2026-10-01T12:00:00.000Z");
    expect(body.properties[0].reservations[1].checkIn).toBe("2026-10-31T23:00:00.000Z");
  });
  it("loads neighboring stays whose cleaning buffers fall inside the month, with scoped preceding context", async () => {
    const rows = [
      reservation(41, 1, "2026-09-26", "2026-09-30"),
      reservation(42, 1, "2026-11-02", "2026-11-05"),
      reservation(43, 1, "2020-01-01", "2020-01-03"),
      reservation(44, 4, "2026-09-26", "2026-09-30"),
    ];
    const properties = propertyRows.map(property => ({ ...property, calendarLinks: property.calendarLinks.map(link => ({ ...link, bufferBefore: 2, bufferAfter: 2 })) }));
    mocks.properties.mockImplementation((query: Query) => Promise.resolve(runQuery(properties, query)));
    mocks.reservations.mockImplementation((query: Query) => Promise.resolve(runQuery(rows, query)));
    mocks.previousReservation.mockImplementation(({ where }: Query) => Promise.resolve(where.propertyId === 1 ? project(rows[2], {
      id: true, propertyId: true, name: true, checkIn: true, checkOut: true, platform: true, linkedEventUid: true, linkedEventPlatform: true, linkedEventRole: true,
    }) : null));
    const body = await (await GET(request())).json();
    expect(body.properties[0].reservations.map((row: Row) => row.id)).toEqual([43, 41, 42]);
    expect(mocks.reservations.mock.calls[0][0].where).toEqual({ propertyId: { in: [1, 2] }, checkIn: { lt: date("2026-11-06") }, checkOut: { gte: date("2026-09-26") } });
    expect(mocks.previousReservation).toHaveBeenCalledTimes(1);
    expect(mocks.previousReservation.mock.calls[0][0].where).toEqual({ propertyId: 1, checkOut: { lt: date("2026-09-26") } });
    expect(mocks.previousEvent.mock.calls[0][0].where.propertyId).toBe(1);
    expect(JSON.stringify(body)).not.toMatch(/Synthetic guest 44|private-/);
  });
  it("keeps strict monthly queries when cleaning is disabled", async () => {
    mocks.properties.mockImplementation((query: Query) => Promise.resolve(runQuery(propertyRows.map(property => ({ ...property, cleaningEnabled: false })), query)));
    await GET(request());
    expect(mocks.reservations.mock.calls[0][0].where).toEqual({ propertyId: { in: [1, 2] }, checkIn: { lt: date("2026-11-01") }, checkOut: { gte: date("2026-10-01") } });
    expect(mocks.previousReservation).not.toHaveBeenCalled();
    expect(mocks.previousEvent).not.toHaveBeenCalled();
  });
  it("does not give a superadmin unrelated accounts through the overview", async () => {
    mocks.session.mockResolvedValue({ userId: 99, role: "superadmin" });
    const body = await (await GET(request())).json();
    expect(body.properties).toEqual([]);
    expect(mocks.events).not.toHaveBeenCalled();
  });
  it("preserves management rights for cleaner-role owners and managers alongside redacted assigned properties", async () => {
    mocks.session.mockResolvedValue({ userId: 7, role: "cleaner" });
    const body = await (await GET(request())).json();
    expect(body.properties.map((row: Row) => [row.id, row.canManage])).toEqual([[1, true], [2, true], [3, false]]);
    expect(body.properties[0].reservations.some((row: Row) => row.id === 11)).toBe(true);
    expect(body.properties[2].reservations[0].id).toBeUndefined();
  });
  it("returns an empty authorized account without touching occupancy tables", async () => {
    mocks.session.mockResolvedValue({ userId: 99, role: "user" });
    const body = await (await GET(request())).json();
    expect(body.properties).toEqual([]);
    expect(mocks.events).not.toHaveBeenCalled();
    expect(mocks.reservations).not.toHaveBeenCalled();
  });
  it("does not turn an occupancy failure into empty dates", async () => {
    mocks.events.mockRejectedValue(new Error("Synthetic database unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await GET(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
    log.mockRestore();
  });
  it.each([
    { lastFetchedAt: null, lastError: null },
    { lastFetchedAt: date("2026-10-20"), lastError: "Synthetic private upstream error" },
  ])("marks never-synced and failed feeds unknown without returning raw health fields", async (health) => {
    const rows = propertyRows.map((property) => ({
      ...property,
      calendarLinks: property.calendarLinks.map((link) => ({ ...link, ...health })),
    }));
    mocks.properties.mockImplementation((query: Query) => Promise.resolve(runQuery(rows, query)));
    const body = await (await GET(request())).json();
    expect(body.properties.every((row: Row) => row.syncFailed === true)).toBe(true);
    expect(JSON.stringify(body)).not.toMatch(/lastFetchedAt|lastError|upstream error/);
  });
});
