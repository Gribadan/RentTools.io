import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  // Superadmin impersonation start/exit — record both ends of the
  // session so a paper trail exists for which admin viewed which
  // user's data, and when.
  | "impersonate"
  | "exit-impersonate";
export type AuditResource =
  | "property"
  | "reservation"
  | "guest"
  | "override"
  | "calendarLink"
  | "manager"
  | "user" // RT-21.7: account creation, suspension, password change
  | "blogComment" // RT-20.4: super-admin moderation
  | "blogPost" // RT-20.3: super-admin blog CMS — create/update/delete/status
  | "blogTag" // RT-20.3 tick 3: super-admin tag CRUD + merge
  | "platform" // RT-17.1: super-admin edits to CalendarPlatform registry
  | "seoOverride" // RT-18.3: super-admin per-page SEO overrides
  | "guestFormTemplate"; // RT-25.2: pre-arrival guest form template CRUD

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
