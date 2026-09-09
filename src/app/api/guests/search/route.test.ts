import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), owned: vi.fn(), managed: vi.fn(), assigned: vi.fn(), guests: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  property: { findMany: mocks.owned },
  propertyManager: { findMany: mocks.managed },
  cleanerAssignment: { findMany: mocks.assigned },
  guest: { findMany: mocks.guests },
} }));
import { GET } from "./route";

const request = () => new NextRequest("http://localhost/api/guests/search?q=Test");
beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ userId: 5, role: "cleaner" });
  mocks.owned.mockResolvedValue([]);
  mocks.managed.mockResolvedValue([]);
  mocks.assigned.mockResolvedValue([{ propertyId: 99 }]);
  mocks.guests.mockResolvedValue([]);
});

describe("guest search management boundary", () => {
  it("never queries guest data for cleaner-only access", async () => {
    const res = await GET(request());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ results: [] });
    expect(mocks.guests).not.toHaveBeenCalled();
    expect(mocks.assigned).not.toHaveBeenCalled();
  });
  it("includes owned and managed properties while excluding cleaning assignments", async () => {
    mocks.owned.mockResolvedValue([{ id: 1 }]);
    mocks.managed.mockResolvedValue([{ propertyId: 2 }, { propertyId: 1 }]);
    await GET(request());
    expect(mocks.guests).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ reservation: { property: { id: { in: [1, 2] } } } }),
    }));
    expect(mocks.assigned).not.toHaveBeenCalled();
  });
  it("does not allow an impersonating session to probe document values", async () => {
    mocks.getSession.mockResolvedValue({ userId: 5, role: "user", impersonatorId: 10 });
    mocks.owned.mockResolvedValue([{ id: 1 }]);
    await GET(request());
    expect(mocks.guests).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ OR: [{ fullName: { contains: "Test" } }] }),
    }));
  });
  it("requires a session before querying properties or guests", async () => {
    mocks.getSession.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    expect(mocks.owned).not.toHaveBeenCalled();
    expect(mocks.guests).not.toHaveBeenCalled();
  });
});
