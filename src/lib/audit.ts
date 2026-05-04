import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

export type AuditAction = "create" | "update" | "delete";
export type AuditResource =
  | "property"
  | "reservation"
  | "guest"
  | "override"
  | "calendarLink"
  | "manager";

export async function logAudit(
  userId: number,
  action: AuditAction,
  resourceType: AuditResource,
  resourceId: number,
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        payload: payload ? JSON.stringify(payload) : null,
      },
    });
  } catch (err) {
    log({
      level: "warn",
      msg: "audit_write_failed",
      err: err instanceof Error ? err.message : String(err),
      action,
      resourceType,
      resourceId,
      userId,
    });
  }
}
