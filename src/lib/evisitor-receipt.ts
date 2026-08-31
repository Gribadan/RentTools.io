import { prisma } from "@/lib/prisma";

export type EVisitorReceiptAction = "CHECK_IN" | "UPDATE" | "CHECK_OUT" | "CANCEL_CHECK_IN";
export type EVisitorFailureCode =
  | "AUTH_FAILED"
  | "ACTION_HTTP_FAILED"
  | "READBACK_HTTP_FAILED"
  | "READBACK_MISMATCH"
  | "UNKNOWN";

export interface EVisitorReceiptIdentity {
  reservationId: number;
  guestId: string;
  eVisitorGuid: string;
  action: EVisitorReceiptAction;
  requestHash: string;
  environment?: "test" | "production";
}

/**
 * Claim one exact eVisitor action. A confirmed or currently pending identical
 * request is blocked; a failed request can be retried against the same receipt.
 * The unique DB key closes the concurrent double-click race.
 */
export async function claimEVisitorReceipt(identity: EVisitorReceiptIdentity) {
  const key = {
    reservationId: identity.reservationId,
    guestId: identity.guestId,
    action: identity.action,
    requestHash: identity.requestHash,
  };
  const existing = await prisma.eVisitorReceipt.findUnique({
    where: { reservationId_guestId_action_requestHash: key },
  });
  if (existing?.status === "READBACK_CONFIRMED") {
    throw new Error("Identical eVisitor action already confirmed");
  }
  if (existing?.status === "PENDING") {
    throw new Error("Identical eVisitor action already in progress");
  }
  if (existing) {
    return prisma.eVisitorReceipt.update({
      where: { id: existing.id },
      data: {
        status: "PENDING",
        attemptedAt: new Date(),
        attemptCount: { increment: 1 },
        failureCode: null,
      },
    });
  }
  return prisma.eVisitorReceipt.create({
    data: {
      ...key,
      eVisitorGuid: identity.eVisitorGuid,
      environment: identity.environment ?? "test",
      status: "PENDING",
    },
  });
}

export async function confirmEVisitorReceipt(id: number): Promise<void> {
  await prisma.eVisitorReceipt.update({
    where: { id },
    data: {
      status: "READBACK_CONFIRMED",
      readbackConfirmedAt: new Date(),
      failureCode: null,
    },
  });
}

export async function failEVisitorReceipt(id: number, failureCode: EVisitorFailureCode): Promise<void> {
  await prisma.eVisitorReceipt.update({
    where: { id },
    data: {
      status: "FAILED",
      // This union is deliberately closed: never persist an API body or PII.
      failureCode,
    },
  });
}
