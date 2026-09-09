import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    eVisitorReceipt: {
      findUnique: mocks.findUnique,
      create: mocks.create,
      update: mocks.update,
    },
  },
}));

import {
  claimEVisitorReceipt,
  confirmEVisitorReceipt,
  failEVisitorReceipt,
} from "@/lib/evisitor-receipt";

const identity = {
  reservationId: 77,
  guestId: "guest-internal-id",
  eVisitorGuid: "93517b97-c033-4436-a126-b1bd0ecf9b7a",
  action: "CHECK_IN" as const,
  requestHash: "a".repeat(64),
  environment: "test" as const,
};

beforeEach(() => vi.resetAllMocks());

describe("eVisitor receipts", () => {
  it("creates a PENDING idempotency receipt without PII", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: 1 });
    await claimEVisitorReceipt(identity);

    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        reservationId: 77,
        guestId: "guest-internal-id",
        action: "CHECK_IN",
        requestHash: "a".repeat(64),
        status: "PENDING",
      }),
    });
    expect(JSON.stringify(mocks.create.mock.calls)).not.toContain("DocumentNumber");
  });

  it("blocks a second send after readback confirmation", async () => {
    mocks.findUnique.mockResolvedValue({ id: 1, status: "READBACK_CONFIRMED" });
    await expect(claimEVisitorReceipt(identity)).rejects.toThrow("already confirmed");
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("allows a technical retry only after a failed attempt", async () => {
    mocks.findUnique.mockResolvedValue({ id: 1, status: "FAILED" });
    mocks.update.mockResolvedValue({ id: 1, status: "PENDING" });
    await claimEVisitorReceipt(identity);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: expect.objectContaining({ status: "PENDING", attemptCount: { increment: 1 } }),
    });
  });

  it("marks success only as readback-confirmed and bounds failure codes", async () => {
    mocks.update.mockResolvedValue({ id: 1 });
    await confirmEVisitorReceipt(1);
    await failEVisitorReceipt(1, "ACTION_HTTP_FAILED");

    expect(mocks.update).toHaveBeenNthCalledWith(1, {
      where: { id: 1 },
      data: expect.objectContaining({ status: "READBACK_CONFIRMED" }),
    });
    expect(mocks.update).toHaveBeenNthCalledWith(2, {
      where: { id: 1 },
      data: { status: "FAILED", failureCode: "ACTION_HTTP_FAILED" },
    });
  });
});
