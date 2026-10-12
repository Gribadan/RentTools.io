import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  canManageProperty: vi.fn(),
  logAudit: vi.fn(),
  reservationFindUnique: vi.fn(),
  reservationFindFirst: vi.fn(),
  reservationFindMany: vi.fn(),
  reservationUpdate: vi.fn(),
  reservationDelete: vi.fn(),
  calendarEventFindFirst: vi.fn(),
  calendarEventDelete: vi.fn(),
  dateOverrideDeleteMany: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/ownership", () => ({
  canManageProperty: mocks.canManageProperty,
}));

vi.mock("@/lib/audit", () => ({
  logAudit: mocks.logAudit,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    reservation: {
      findUnique: mocks.reservationFindUnique,
      findFirst: mocks.reservationFindFirst,
      findMany: mocks.reservationFindMany,
      update: mocks.reservationUpdate,
      delete: mocks.reservationDelete,
    },
    calendarEvent: {
      findFirst: mocks.calendarEventFindFirst,
      delete: mocks.calendarEventDelete,
    },
    dateOverride: {
      deleteMany: mocks.dateOverrideDeleteMany,
    },
  },
}));

import { DELETE, PATCH } from "./route";

const reservationId = 7;
const propertyId = 12;
const sourceEventUid = "airbnb-source-uid";
const original = {
  id: reservationId,
  propertyId,
  platform: "airbnb",
  linkedEventUid: sourceEventUid,
  checkIn: new Date("2026-08-19T00:00:00.000Z"),
  checkOut: new Date("2026-08-23T00:00:00.000Z"),
};
const linkedSource = {
  startDate: "2026-08-19",
  endDate: "2026-08-23",
};

function patchRequest(body: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/reservations/${reservationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function patchParams(id = String(reservationId)) {
  return { params: Promise.resolve({ id }) };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSession.mockResolvedValue({ userId: 3, role: "user" });
  mocks.canManageProperty.mockResolvedValue(true);
  // PATCH loads the reservation once for authorization and once to
  // resolve an omitted date boundary. Both reads see the same row.
  mocks.reservationFindUnique.mockResolvedValue(original);
  mocks.reservationFindFirst.mockResolvedValue(null);
  mocks.reservationFindMany.mockResolvedValue([]);
  mocks.calendarEventFindFirst.mockResolvedValue(null);
  mocks.reservationUpdate.mockImplementation(async ({ data }) => ({
    ...original,
    ...data,
  }));
  mocks.reservationDelete.mockResolvedValue(original);
  mocks.calendarEventDelete.mockResolvedValue({ id: 41 });
  mocks.dateOverrideDeleteMany.mockResolvedValue({ count: 0 });
  mocks.logAudit.mockResolvedValue(undefined);
});

describe("PATCH /api/reservations/:id — date edits", () => {
  it("checks an unchanged legacy checkout by day and preserves its free-night override", async () => {
    const legacy = {
      ...original,
      linkedEventUid: null,
      checkIn: new Date("2026-08-19T14:00:00Z"),
      checkOut: new Date("2026-08-23T12:00:00Z"),
    };
    mocks.reservationFindUnique.mockResolvedValue(legacy);
    mocks.reservationUpdate.mockImplementation(async ({ data }) => ({ ...legacy, ...data }));

    const response = await PATCH(patchRequest({ checkIn: "2026-08-18" }), patchParams());

    expect(response.status).toBe(200);
    expect(mocks.reservationFindFirst).toHaveBeenCalledWith({
      where: {
        propertyId,
        id: { not: reservationId },
        checkIn: { lt: new Date("2026-08-23T00:00:00Z") },
        checkOut: { gte: new Date("2026-08-19T00:00:00Z") },
      },
      select: { name: true, checkIn: true, checkOut: true },
    });
    expect(mocks.dateOverrideDeleteMany).toHaveBeenCalledWith({
      where: {
        propertyId,
        date: { in: ["2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21", "2026-08-22"] },
        type: { in: ["open", "closed"] },
      },
    });
  });

  it("rejects a zero-night edit even if the unchanged legacy checkout is at noon", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      ...original,
      checkOut: new Date("2026-08-23T12:00:00Z"),
    });
    const response = await PATCH(patchRequest({ checkIn: "2026-08-23" }), patchParams());
    expect(response.status).toBe(400);
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
  });

  it.each([
    ["checkIn", "not-a-date", "Invalid checkIn date"],
    ["checkOut", "not-a-date", "Invalid checkOut date"],
  ])("rejects an invalid %s without writing", async (field, value, error) => {
    const response = await PATCH(patchRequest({ [field]: value }), patchParams());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ error });
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
    expect(mocks.calendarEventFindFirst).not.toHaveBeenCalled();
    expect(mocks.dateOverrideDeleteMany).not.toHaveBeenCalled();
    expect(mocks.logAudit).not.toHaveBeenCalled();
  });

  it.each([
    ["equal", "2026-08-21", "2026-08-21"],
    ["reversed", "2026-08-22", "2026-08-21"],
  ])("rejects an %s date range without writing", async (_label, checkIn, checkOut) => {
    const response = await PATCH(
      patchRequest({ checkIn, checkOut }),
      patchParams(),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "checkOut must be after checkIn",
    });
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
    expect(mocks.calendarEventFindFirst).not.toHaveBeenCalled();
    expect(mocks.dateOverrideDeleteMany).not.toHaveBeenCalled();
    expect(mocks.logAudit).not.toHaveBeenCalled();
  });

  it("excludes only the reservation's exact linked source from the synced-overlap query", async () => {
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce(linkedSource)
      .mockResolvedValueOnce(null);

    const response = await PATCH(
      patchRequest({ checkIn: "2026-08-18" }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.calendarEventFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        propertyId,
        platform: "airbnb",
        uid: sourceEventUid,
      },
      select: { startDate: true, endDate: true },
    });
    expect(mocks.calendarEventFindFirst).toHaveBeenNthCalledWith(2, {
      where: {
        propertyId,
        startDate: { lt: "2026-08-23" },
        endDate: { gt: "2026-08-18" },
        NOT: {
          platform: "airbnb",
          uid: sourceEventUid,
        },
      },
      select: {
        summary: true,
        platform: true,
        startDate: true,
        endDate: true,
      },
    });
  });

  it("still rejects a same-UID event from another platform", async () => {
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce(linkedSource)
      .mockResolvedValueOnce({
        summary: "Other guest",
        platform: "booking",
        uid: sourceEventUid,
        startDate: "2026-08-18",
        endDate: "2026-08-20",
      });

    const response = await PATCH(
      patchRequest({ checkIn: "2026-08-18" }),
      patchParams(),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Overlapping booking from another platform",
      existing: {
        name: "Other guest",
        checkIn: "2026-08-18",
        checkOut: "2026-08-20",
        platform: "booking",
      },
    });
    expect(mocks.calendarEventFindFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: { platform: "airbnb", uid: sourceEventUid },
        }),
      }),
    );
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
    expect(mocks.dateOverrideDeleteMany).not.toHaveBeenCalled();
    expect(mocks.logAudit).not.toHaveBeenCalled();
  });

  it("does not add a source exclusion for a purely manual reservation", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      ...original,
      linkedEventUid: null,
    });

    const response = await PATCH(
      patchRequest({ checkIn: "2026-08-18" }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.calendarEventFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        propertyId,
        platform: "airbnb",
        startDate: { lt: "2026-08-23" },
        endDate: { gt: "2026-08-19" },
      },
      select: { uid: true, startDate: true, endDate: true },
    });
    const syncedWhere = mocks.calendarEventFindFirst.mock.calls[1][0].where;
    expect(syncedWhere).not.toHaveProperty("NOT");
  });

  it("extends a legacy implicit claim from its unioned calendar edge", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      ...original,
      linkedEventUid: null,
      checkOut: new Date("2026-08-25T00:00:00.000Z"),
    });
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce({
        uid: sourceEventUid,
        startDate: "2026-08-19",
        endDate: "2026-08-23",
      })
      .mockResolvedValueOnce(null);

    const response = await PATCH(
      patchRequest({ checkOut: "2026-08-26" }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.calendarEventFindFirst).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          NOT: { platform: "airbnb", uid: sourceEventUid },
        }),
      }),
    );
    expect(mocks.reservationUpdate).toHaveBeenCalledWith({
      where: { id: reservationId },
      data: { checkOut: new Date("2026-08-26T00:00:00.000Z") },
    });
  });

  it("allows an unlinked legacy row to move away from its inferred source", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      ...original,
      linkedEventUid: null,
    });
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce({
        uid: sourceEventUid,
        startDate: "2026-08-19",
        endDate: "2026-08-23",
      })
      .mockResolvedValueOnce(null);

    const response = await PATCH(
      patchRequest({ checkIn: "2026-08-26", checkOut: "2026-08-28" }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    const syncedWhere = mocks.calendarEventFindFirst.mock.calls[1][0].where;
    expect(syncedWhere).not.toHaveProperty("NOT");
    expect(mocks.reservationUpdate).toHaveBeenCalledWith({
      where: { id: reservationId },
      data: {
        checkIn: new Date("2026-08-26T00:00:00.000Z"),
        checkOut: new Date("2026-08-28T00:00:00.000Z"),
      },
    });
  });

  it("does not let an adjacent manual extension become a claimed source booking", async () => {
    const extension = {
      ...original,
      checkIn: new Date("2026-08-17T00:00:00.000Z"),
      checkOut: new Date("2026-08-19T00:00:00.000Z"),
    };
    mocks.reservationFindUnique.mockResolvedValue(extension);
    mocks.calendarEventFindFirst.mockResolvedValueOnce(linkedSource);

    const response = await PATCH(
      patchRequest({ checkOut: "2026-08-20" }),
      patchParams(),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Linked booking relationship cannot be changed",
    });
    expect(mocks.calendarEventFindFirst).toHaveBeenCalledTimes(1);
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
    expect(mocks.dateOverrideDeleteMany).not.toHaveBeenCalled();
    expect(mocks.logAudit).not.toHaveBeenCalled();
  });

  it("keeps an edited manual extension adjacent to its linked source", async () => {
    const extension = {
      ...original,
      checkIn: new Date("2026-08-17T00:00:00.000Z"),
      checkOut: new Date("2026-08-19T00:00:00.000Z"),
    };
    mocks.reservationFindUnique.mockResolvedValue(extension);
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce(linkedSource)
      .mockResolvedValueOnce(null);

    const response = await PATCH(
      patchRequest({ checkIn: "2026-08-16" }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.reservationUpdate).toHaveBeenCalledWith({
      where: { id: reservationId },
      data: { checkIn: new Date("2026-08-16T00:00:00.000Z") },
    });
  });

  it("rejects detaching a manual extension from its linked source", async () => {
    const extension = {
      ...original,
      checkIn: new Date("2026-08-17T00:00:00.000Z"),
      checkOut: new Date("2026-08-19T00:00:00.000Z"),
    };
    mocks.reservationFindUnique.mockResolvedValue(extension);
    mocks.calendarEventFindFirst.mockResolvedValueOnce(linkedSource);

    const response = await PATCH(
      patchRequest({ checkIn: "2026-08-10", checkOut: "2026-08-12" }),
      patchParams(),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Linked booking relationship cannot be changed",
    });
    expect(mocks.calendarEventFindFirst).toHaveBeenCalledTimes(1);
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
  });

  it("edits an explicit Direct extension through its separate source platform", async () => {
    const extension = {
      ...original,
      platform: "direct",
      linkedEventPlatform: "airbnb",
      linkedEventRole: "extension",
      checkIn: new Date("2026-08-23T00:00:00.000Z"),
      checkOut: new Date("2026-08-24T00:00:00.000Z"),
    };
    mocks.reservationFindUnique.mockResolvedValue(extension);
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce(linkedSource)
      .mockResolvedValueOnce(null);

    const response = await PATCH(
      patchRequest({ checkOut: "2026-08-25" }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.calendarEventFindFirst).toHaveBeenNthCalledWith(1, {
      where: {
        propertyId,
        platform: "airbnb",
        uid: sourceEventUid,
      },
      select: { startDate: true, endDate: true },
    });
    expect(mocks.reservationUpdate).toHaveBeenCalledWith({
      where: { id: reservationId },
      data: { checkOut: new Date("2026-08-25T00:00:00.000Z") },
    });
  });

  it("keeps an after-extension editable at a claim/source union boundary", async () => {
    const extension = {
      ...original,
      platform: "direct",
      linkedEventPlatform: "airbnb",
      linkedEventRole: "extension",
      checkIn: new Date("2026-08-25T00:00:00.000Z"),
      checkOut: new Date("2026-08-26T00:00:00.000Z"),
    };
    mocks.reservationFindUnique.mockResolvedValue(extension);
    mocks.reservationFindMany.mockResolvedValue([
      {
        platform: "airbnb",
        linkedEventUid: sourceEventUid,
        linkedEventPlatform: "airbnb",
        linkedEventRole: "claim",
        checkIn: new Date("2026-08-19T00:00:00.000Z"),
        checkOut: new Date("2026-08-25T00:00:00.000Z"),
      },
      extension,
    ]);
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce(linkedSource)
      .mockResolvedValueOnce(null);

    const response = await PATCH(
      patchRequest({ checkOut: "2026-08-27" }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.reservationUpdate).toHaveBeenCalledWith({
      where: { id: reservationId },
      data: { checkOut: new Date("2026-08-27T00:00:00.000Z") },
    });
  });

  it("keeps a before-extension editable at a legacy implicit/source union boundary", async () => {
    const extension = {
      ...original,
      platform: "direct",
      linkedEventPlatform: "airbnb",
      linkedEventRole: "extension",
      checkIn: new Date("2026-08-16T00:00:00.000Z"),
      checkOut: new Date("2026-08-17T00:00:00.000Z"),
    };
    mocks.reservationFindUnique.mockResolvedValue(extension);
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
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce(linkedSource)
      .mockResolvedValueOnce(null);

    const response = await PATCH(
      patchRequest({ checkIn: "2026-08-15" }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.reservationUpdate).toHaveBeenCalledWith({
      where: { id: reservationId },
      data: { checkIn: new Date("2026-08-15T00:00:00.000Z") },
    });
  });

  it("rejects changing the platform of a linked reservation", async () => {
    const response = await PATCH(
      patchRequest({ platform: "booking" }),
      patchParams(),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Linked booking platform cannot be changed",
    });
    expect(mocks.reservationFindUnique).toHaveBeenCalledTimes(1);
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
  });

  it("rejects an overlap with another manual reservation before writing", async () => {
    mocks.reservationFindFirst.mockResolvedValue({
      name: "Existing stay",
      checkIn: new Date("2026-08-18T00:00:00.000Z"),
      checkOut: new Date("2026-08-20T00:00:00.000Z"),
    });

    const response = await PATCH(
      patchRequest({ checkIn: "2026-08-18" }),
      patchParams(),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "Overlapping reservation exists",
      existing: { name: "Existing stay" },
    });
    expect(mocks.calendarEventFindFirst).not.toHaveBeenCalled();
    expect(mocks.reservationUpdate).not.toHaveBeenCalled();
  });

  it("moves check-in earlier and clears only open/closed overrides on occupied nights", async () => {
    mocks.calendarEventFindFirst
      .mockResolvedValueOnce(linkedSource)
      .mockResolvedValueOnce(null);

    const response = await PATCH(
      patchRequest({ checkIn: "2026-08-18" }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.reservationUpdate).toHaveBeenCalledWith({
      where: { id: reservationId },
      data: { checkIn: new Date("2026-08-18T00:00:00.000Z") },
    });
    expect(mocks.dateOverrideDeleteMany).toHaveBeenCalledWith({
      where: {
        propertyId,
        date: {
          in: [
            "2026-08-18",
            "2026-08-19",
            "2026-08-20",
            "2026-08-21",
            "2026-08-22",
          ],
        },
        type: { in: ["open", "closed"] },
      },
    });
    expect(mocks.logAudit).toHaveBeenCalledWith(
      3,
      "update",
      "reservation",
      reservationId,
      { checkIn: new Date("2026-08-18T00:00:00.000Z") },
    );
  });
});

describe("DELETE /api/reservations/:id — linked calendar source", () => {
  it("looks up and deletes only the exact property/platform/UID source", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      ...original,
      linkedEventPlatform: "airbnb",
      linkedEventRole: "claim",
    });
    mocks.calendarEventFindFirst.mockResolvedValue({
      id: 41,
      startDate: "2026-08-19",
      endDate: "2026-08-23",
    });

    const response = await DELETE(
      new NextRequest(`http://localhost/api/reservations/${reservationId}`, {
        method: "DELETE",
      }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.calendarEventFindFirst).toHaveBeenCalledWith({
      where: {
        propertyId,
        platform: "airbnb",
        uid: sourceEventUid,
      },
      select: { id: true, startDate: true, endDate: true },
    });
    expect(mocks.calendarEventDelete).toHaveBeenCalledWith({
      where: { id: 41 },
    });
  });

  it("preserves the source event for an ambiguous legacy linked row", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      ...original,
      linkedEventPlatform: null,
      linkedEventRole: null,
    });

    const response = await DELETE(
      new NextRequest(`http://localhost/api/reservations/${reservationId}`, {
        method: "DELETE",
      }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.reservationDelete).toHaveBeenCalledWith({
      where: { id: reservationId },
    });
    expect(mocks.calendarEventFindFirst).not.toHaveBeenCalled();
    expect(mocks.calendarEventDelete).not.toHaveBeenCalled();
  });

  it("deletes only a Direct extension even if the source later expands over it", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      ...original,
      platform: "direct",
      linkedEventPlatform: "airbnb",
      linkedEventRole: "extension",
      checkIn: new Date("2026-08-23T00:00:00.000Z"),
      checkOut: new Date("2026-08-25T00:00:00.000Z"),
    });
    // The OTA changed checkout from Aug 23 to Aug 24 after the extension
    // was recorded, so geometry alone now looks like a claim.
    mocks.calendarEventFindFirst.mockResolvedValue({
      id: 41,
      startDate: "2026-08-19",
      endDate: "2026-08-24",
    });

    const response = await DELETE(
      new NextRequest(`http://localhost/api/reservations/${reservationId}`, {
        method: "DELETE",
      }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.reservationDelete).toHaveBeenCalledWith({
      where: { id: reservationId },
    });
    expect(mocks.calendarEventFindFirst).not.toHaveBeenCalled();
    expect(mocks.calendarEventDelete).not.toHaveBeenCalled();
  });

  it("deletes an explicit claim source even after a local date correction", async () => {
    mocks.reservationFindUnique.mockResolvedValue({
      ...original,
      linkedEventPlatform: "airbnb",
      linkedEventRole: "claim",
      checkIn: new Date("2026-08-10T00:00:00.000Z"),
      checkOut: new Date("2026-08-12T00:00:00.000Z"),
    });
    mocks.calendarEventFindFirst.mockResolvedValue({
      id: 41,
      startDate: "2026-08-19",
      endDate: "2026-08-23",
    });

    const response = await DELETE(
      new NextRequest(`http://localhost/api/reservations/${reservationId}`, {
        method: "DELETE",
      }),
      patchParams(),
    );

    expect(response.status).toBe(200);
    expect(mocks.calendarEventDelete).toHaveBeenCalledWith({ where: { id: 41 } });
  });
});
