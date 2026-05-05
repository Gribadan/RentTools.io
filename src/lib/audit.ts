import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

export type AuditAction = "create" | "update" | "delete";
export type AuditResource =
  | "property"
  | "reservation"
  | "guest"
  | "override"
  | "calendarLink"
  | "manager"
  | "user" // RT-21.7: account creation, suspension, password change
  | "blogComment" // RT-20.4: super-admin moderation
  | "platform" // RT-17.1: super-admin edits to CalendarPlatform registry
  | "seoOverride"; // RT-18.3: super-admin per-page SEO overrides

// Self-delete (POST /api/auth/delete-account) is intentionally NOT audited
// — the same request wipes the user's AuditLog rows for GDPR right-to-be-
// forgotten compliance, so a logAudit() there would be a no-op. Schema
// pushes happen out-of-band on the droplet (scripts/install-build.sh)
// and are recorded in deploy logs, not the in-app audit trail.

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
