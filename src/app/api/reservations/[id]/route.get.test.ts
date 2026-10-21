import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), reservation: vi.fn(), property: vi.fn(), manager: vi.fn(), assignment: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.session }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }));
vi.mock("@/lib/live-events", () => ({ notifyPropertyChange: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  reservation: { findUnique: mocks.reservation }, property: { findUnique: mocks.property },
  propertyManager: { findUnique: mocks.manager }, cleanerAssignment: { findUnique: mocks.assignment },
} }));
import { GET } from "./route";

const synthetic = (id: number, propertyId: number) => ({
  id, propertyId, name: `Synthetic reservation ${id}`, platform: "direct", checkIn: new Date("2026-10-18T00:00:00Z"),
  checkOut: new Date("2026-10-24T00:00:00Z"), linkedEventUid: null, linkedEventPlatform: null, linkedEventRole: null,
  phone: null, tgGroupUrl: null, waGroupUrl: null, groupName: null, bookedGuestCount: 2,
  createdAt: new Date("2026-10-01T00:00:00Z"), _count: { guests: 1 }, guests: [{ passportNumber: "private-document" }],
});
const fixtures = [synthetic(11, 1), synthetic(15, 2), synthetic(99, 4)];
const request = (id = "11") => GET(new NextRequest(`https://renttools.test/api/reservations/${id}`), { params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ userId: 7, role: "user" });
  mocks.reservation.mockImplementation(({ where, select }: { where: { id: number; propertyId?: number }; select: Record<string, unknown> }) => {
    const row = fixtures.find((fixture) => fixture.id === where.id && (where.propertyId === undefined || fixture.propertyId === where.propertyId));
    if (!row) return Promise.resolve(null);
    return Promise.resolve(Object.fromEntries(Object.keys(select).map((key) => [key, row[key as keyof typeof row]])));
  });
  mocks.property.mockImplementation(({ where }: { where: { id: number } }) => Promise.resolve({ userId: where.id === 1 ? 7 : 80 }));
  mocks.manager.mockImplementation(({ where }: { where: { managerId_propertyId: { managerId: number; propertyId: number } } }) => {
    const key = where.managerId_propertyId;
    return Promise.resolve(key.managerId === 8 && key.propertyId === 2 ? { id: 1 } : null);
  });
  mocks.assignment.mockImplementation(({ where }: { where: { cleanerId_propertyId: { cleanerId: number; propertyId: number } } }) => {
    const key = where.cleanerId_propertyId;
    return Promise.resolve(key.cleanerId === 9 && key.propertyId === 1 ? { id: 1 } : null);
  });
});

describe("single reservation read management boundary", () => {
  it("loads only the owner's requested card and never guest document records", async () => {
    const response = await request();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.id).toBe(11);
    expect(body._count).toEqual({ guests: 1 });
    expect(body.guests).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("private-document");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.reservation.mock.calls[1][0].where).toEqual({ id: 11, propertyId: 1 });
    expect(mocks.reservation.mock.calls[1][0].select.guests).toBeUndefined();
  });
  it("permits the existing manager grant", async () => {
    mocks.session.mockResolvedValue({ userId: 8, role: "user" });
    expect((await request("15")).status).toBe(200);
  });
  it.each([
    { userId: 9, role: "cleaner" }, { userId: 12, role: "user" }, { userId: 12, role: "superadmin" },
  ])("denies non-management access for $role/$userId", async (session) => {
    mocks.session.mockResolvedValue(session);
    expect((await request()).status).toBe(404);
    expect(mocks.reservation).toHaveBeenCalledOnce();
  });
  it("does not let an owner select a foreign account's reservation", async () => {
    expect((await request("99")).status).toBe(404);
    expect(mocks.reservation).toHaveBeenCalledOnce();
  });
  it("requires a session without touching reservation data", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await request()).status).toBe(401);
    expect(mocks.reservation).not.toHaveBeenCalled();
  });
  it.each(["-1", "0", "11x", "NaN", "9007199254740992"])("rejects malformed ID %s", async (id) => {
    expect((await request(id)).status).toBe(400);
    expect(mocks.reservation).not.toHaveBeenCalled();
  });
  it("returns 404 for an absent reservation", async () => {
    expect((await request("500")).status).toBe(404);
  });
  it("reports a database failure without a partial card", async () => {
    mocks.reservation.mockRejectedValue(new Error("Synthetic unavailable"));
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await request()).status).toBe(500);
    log.mockRestore();
  });
});
