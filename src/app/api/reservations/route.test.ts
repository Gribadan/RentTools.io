import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  canManageProperty: vi.fn(),
  listAccessiblePropertyIds: vi.fn(),
  logAudit: vi.fn(),
  reservationFindFirst: vi.fn(),
  reservationFindMany: vi.fn(),
  reservationCreate: vi.fn(),
  calendarEventFindFirst: vi.fn(),
  dateOverrideDeleteMany: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/ownership", () => ({
  canManageProperty: mocks.canManageProperty,
  listAccessiblePropertyIds: mocks.listAccessiblePropertyIds,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mocks.logAudit,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reservation: {
      findFirst: mocks.reservationFindFirst,
      findMany: mocks.reservationFindMany,
      create: mocks.reservationCreate,
    },
    calendarEvent: {
      findFirst: mocks.calendarEventFindFirst,
    },
    dateOverride: {
      deleteMany: mocks.dateOverrideDeleteMany,
    },
  },
}));

import { POST } from "./route";

const propertyId = 12;
const sourceUid = "shared-source-uid";

function postRequest(overrides: Record<string, unknown> = {}) {
  return new NextRequest("http://localhost/api/reservations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Joanne",
      checkIn: "2026-08-19",
      checkOut: "2026-08-23",
      platform: "airbnb",
      propertyId,
      ...overrides,
    }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ userId: 3, role: "user" });
  mocks.canManageProperty.mockResolvedValue(true);
  mocks.reservationFindFirst.mockResolvedValue(null);
  mocks.reservationFindMany.mockResolvedValue([]);
  mocks.calendarEventFindFirst.mockResolvedValue(null);
  mocks.reservationCreate.mockImplementation(async ({ data }) => ({
    id: 77,
    ...data,
  }));
  mocks.dateOverrideDeleteMany.mockResolvedValue({ count: 0 });
  mocks.logAudit.mockResolvedValue(undefined);
});

describe("POST /api/reservations — linked calendar source", () => {
  it("clears exactly the booked nights across a daylight-saving transition", async () => {
    const previousTimezone = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      const response = await POST(postRequest({ checkIn: "2026-03-07", checkOut: "2026-03-09" }));
      expect(response.status).toBe(200);
      expect(mocks.dateOverrideDeleteMany).toHaveBeenCalledWith({
        where: { propertyId, date: { in: ["2026-03-07", "2026-03-08"] }, type: { in: ["open", "closed"] } },
      });
    } finally {
      if (previousTimezone === undefined) delete process.env.TZ;
      else process.env.TZ = previousTimezone;
    }
  });

  it("normalizes and excludes only the exact property/platform/UID source", async () => {
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce({
        id: 41,
        startDate: "2026-08-19",
        endDate: "2026-08-23",
      })
      .mockResolvedValueOnce(null);

    const response = await POST(
      postRequest({
        platform: "  Airbnb  ",
        linkedEventUid: `  ${sourceUid}  `,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.calendarEventFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        propertyId,
        platform: "airbnb",
        uid: sourceUid,
      },
      select: { id: true, startDate: true, endDate: true },
    });
    expect(mocks.calendarEventFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        propertyId,
        startDate: { lt: "2026-08-23" },
        endDate: { gt: "2026-08-19" },
        NOT: {
          platform: "airbnb",
          uid: sourceUid,
        },
      },
      select: {
        summary: true,
        platform: true,
        startDate: true,
        endDate: true,
      },
    });
    expect(mocks.reservationCreate).toHaveBeenCalledWith({
      data: {
        name: "Joanne",
        checkIn: new Date("2026-08-19T00:00:00.000Z"),
        checkOut: new Date("2026-08-23T00:00:00.000Z"),
        platform: "airbnb",
        linkedEventUid: sourceUid,
        linkedEventPlatform: "airbnb",
        linkedEventRole: "claim",
        propertyId,
      },
    });
  });

  it("stores an adjacent manual extension as Direct with exact source identity", async () => {
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce({
        id: 41,
        startDate: "2026-08-19",
        endDate: "2026-08-23",
      })
      .mockResolvedValueOnce(null);

    const response = await POST(
      postRequest({
        checkIn: "2026-08-23",
        checkOut: "2026-08-25",
        platform: "direct",
        linkedEventPlatform: "  Airbnb  ",
        linkedEventUid: sourceUid,
        linkedEventRole: "extension",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.calendarEventFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        propertyId,
        platform: "airbnb",
        uid: sourceUid,
      },
      select: { id: true, startDate: true, endDate: true },
    });
    expect(mocks.reservationCreate).toHaveBeenCalledWith({
      data: {
        name: "Joanne",
        checkIn: new Date("2026-08-23T00:00:00.000Z"),
        checkOut: new Date("2026-08-25T00:00:00.000Z"),
        platform: "direct",
        linkedEventUid: sourceUid,
        linkedEventPlatform: "airbnb",
        linkedEventRole: "extension",
        propertyId,
      },
    });
  });

  it("safely infers Direct extension semantics for a legacy adjacent request", async () => {
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce({
        id: 41,
        startDate: "2026-08-19",
        endDate: "2026-08-23",
      })
      .mockResolvedValueOnce(null);

    const response = await POST(
      postRequest({
        checkIn: "2026-08-23",
        checkOut: "2026-08-24",
        platform: "airbnb",
        linkedEventUid: sourceUid,
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.reservationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        platform: "direct",
        linkedEventPlatform: "airbnb",
        linkedEventRole: "extension",
      }),
    });
  });

  it("accepts an after-extension adjacent to a claim/source union", async () => {
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce({
        id: 41,
        startDate: "2026-08-19",
        endDate: "2026-08-23",
      })
      .mockResolvedValueOnce(null);
    mocks.reservationFindMany.mockResolvedValue([
      {
        platform: "airbnb",
        linkedEventUid: sourceUid,
        linkedEventPlatform: "airbnb",
        linkedEventRole: "claim",
        checkIn: new Date("2026-08-19T00:00:00.000Z"),
        checkOut: new Date("2026-08-25T00:00:00.000Z"),
      },
    ]);

    const response = await POST(
      postRequest({
        checkIn: "2026-08-25",
        checkOut: "2026-08-26",
        platform: "direct",
        linkedEventPlatform: "airbnb",
        linkedEventUid: sourceUid,
        linkedEventRole: "extension",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.reservationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        checkIn: new Date("2026-08-25T00:00:00.000Z"),
        checkOut: new Date("2026-08-26T00:00:00.000Z"),
        platform: "direct",
        linkedEventRole: "extension",
      }),
    });
  });

  it("accepts a before-extension adjacent to a legacy implicit/source union", async () => {
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce({
        id: 41,
        startDate: "2026-08-19",
        endDate: "2026-08-23",
      })
      .mockResolvedValueOnce(null);
    mocks.reservationFindMany.mockResolvedValue([
      {
        platform: "airbnb",
        linkedEventUid: null,
        linkedEventPlatform: null,
        linkedEventRole: null,
        checkIn: new Date("2026-08-17T00:00:00.000Z"),
        checkOut: new Date("2026-08-23T00:00:00.000Z"),
      },
    ]);

    const response = await POST(
      postRequest({
        checkIn: "2026-08-16",
        checkOut: "2026-08-17",
        platform: "direct",
        linkedEventPlatform: "airbnb",
        linkedEventUid: sourceUid,
        linkedEventRole: "extension",
      }),
    );

    expect(response.status).toBe(200);
    expect(mocks.reservationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        checkIn: new Date("2026-08-16T00:00:00.000Z"),
        checkOut: new Date("2026-08-17T00:00:00.000Z"),
        platform: "direct",
        linkedEventRole: "extension",
      }),
    });
  });

  it("rejects a claimed role for dates that only abut the source", async () => {
    mocks.calendarEventFindFirst.mockResolvedValueOnce({
      id: 41,
      startDate: "2026-08-19",
      endDate: "2026-08-23",
    });

    const response = await POST(
      postRequest({
        checkIn: "2026-08-23",
        checkOut: "2026-08-24",
        linkedEventUid: sourceUid,
        linkedEventRole: "claim",
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Linked booking relationship cannot be changed",
    });
    expect(mocks.reservationCreate).not.toHaveBeenCalled();
  });

  it("still rejects an overlapping event with the same UID on another platform", async () => {
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce({
        id: 41,
        startDate: "2026-08-19",
        endDate: "2026-08-23",
      })
      .mockResolvedValueOnce({
        summary: "Other guest",
        platform: "booking",
        startDate: "2026-08-20",
        endDate: "2026-08-22",
      });

    const response = await POST(
      postRequest({ linkedEventUid: sourceUid }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Overlapping booking from another platform",
      existing: {
        name: "Other guest",
        checkIn: "2026-08-20",
        checkOut: "2026-08-22",
        platform: "booking",
      },
    });
    expect(mocks.calendarEventFindFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: { platform: "airbnb", uid: sourceUid },
        }),
      }),
    );
    expect(mocks.reservationCreate).not.toHaveBeenCalled();
  });

  it("rejects a stale link when the exact source event does not exist", async () => {
    const response = await POST(
      postRequest({ linkedEventUid: sourceUid }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Linked calendar event not found",
    });
    expect(mocks.calendarEventFindFirst).toHaveBeenCalledTimes(1);
    expect(mocks.reservationCreate).not.toHaveBeenCalled();
  });

  it("rejects a linked reservation detached from its source dates", async () => {
    mocks.calendarEventFindFirst.mockResolvedValueOnce({
      id: 41,
      startDate: "2026-08-19",
      endDate: "2026-08-23",
    });
    // Even an explicitly tagged but stale/corrupt claim cannot move the
    // effective boundary unless it remains connected to the raw source.
    mocks.reservationFindMany.mockResolvedValue([
      {
        platform: "airbnb",
        linkedEventUid: sourceUid,
        linkedEventPlatform: "airbnb",
        linkedEventRole: "claim",
        checkIn: new Date("2026-08-26T00:00:00.000Z"),
        checkOut: new Date("2026-08-30T00:00:00.000Z"),
      },
    ]);

    const response = await POST(
      postRequest({
        checkIn: "2026-08-26",
        checkOut: "2026-08-28",
        linkedEventUid: sourceUid,
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Linked booking relationship cannot be changed",
    });
    expect(mocks.calendarEventFindFirst).toHaveBeenCalledTimes(1);
    expect(mocks.reservationCreate).not.toHaveBeenCalled();
  });

  it("preserves the existing manual-create platform behavior when no source is linked", async () => {
    const response = await POST(
      postRequest({ platform: "Direct Sales" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.calendarEventFindFirst).toHaveBeenCalledTimes(1);
    const syncedWhere = mocks.calendarEventFindFirst.mock.calls[0][0].where;
    expect(syncedWhere).not.toHaveProperty("NOT");
    expect(mocks.reservationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        platform: "Direct Sales",
        linkedEventUid: null,
      }),
    });
  });

  it("rejects impossible calendar dates instead of normalizing them", async () => {
    const response = await POST(
      postRequest({ checkOut: "2026-02-30" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid checkOut date",
    });
    expect(mocks.reservationFindFirst).not.toHaveBeenCalled();
    expect(mocks.calendarEventFindFirst).not.toHaveBeenCalled();
    expect(mocks.reservationCreate).not.toHaveBeenCalled();
  });

  it("rejects malformed body fields before authorization or database calls", async () => {
    const response = await POST(
      postRequest({ name: 123, propertyId: "12", platform: 99 }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid reservation data",
    });
    expect(mocks.canManageProperty).not.toHaveBeenCalled();
    expect(mocks.reservationFindFirst).not.toHaveBeenCalled();
    expect(mocks.calendarEventFindFirst).not.toHaveBeenCalled();
    expect(mocks.reservationCreate).not.toHaveBeenCalled();
  });
});
