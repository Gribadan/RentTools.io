import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface ActivityItem {
  id: string;
  kind: "audit" | "sync";
  level: "info" | "warn" | "error" | "success";
  timestamp: string;
  summary: string;
  resourceType?: string;
  resourceId?: number | null;
  propertyId?: number | null;
  propertyName?: string | null;
}

interface AuditPayload {
  name?: string;
  propertyId?: number;
}

function summariseAudit(entry: {
  action: string;
  resourceType: string;
  resourceId: number;
  payload: string | null;
}): string {
  let nameHint = "";
  if (entry.payload) {
    try {
      const parsed = JSON.parse(entry.payload) as AuditPayload;
      if (typeof parsed.name === "string" && parsed.name) nameHint = ` "${parsed.name}"`;
    } catch {
      // ignore parse errors
    }
  }
  const verb =
    entry.action === "create"
      ? "Created"
      : entry.action === "update"
      ? "Updated"
      : entry.action === "delete"
      ? "Deleted"
      : entry.action;
  return `${verb} ${entry.resourceType}${nameHint}`.trim();
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const ownedProperties = await prisma.property.findMany({
      where: { userId: session.userId },
      select: { id: true, name: true },
    });
    const propertyMap = new Map(ownedProperties.map((p) => [p.id, p.name]));
    const propertyIds = Array.from(propertyMap.keys());

    const [audits, syncs] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      propertyIds.length > 0
        ? prisma.syncLog.findMany({
            where: { propertyId: { in: propertyIds } },
            orderBy: { createdAt: "desc" },
            take: 20,
          })
        : Promise.resolve([]),
    ]);

    const items: ActivityItem[] = [];

    for (const a of audits) {
      let propertyId: number | null = null;
      if (a.payload) {
        try {
          const parsed = JSON.parse(a.payload) as AuditPayload;
          if (typeof parsed.propertyId === "number") propertyId = parsed.propertyId;
        } catch {
          // ignore
        }
      }
      if (propertyId === null && a.resourceType === "property") {
        propertyId = a.resourceId;
      }
      items.push({
        id: `audit:${a.id}`,
        kind: "audit",
        level:
          a.action === "delete"
            ? "warn"
            : a.action === "create"
            ? "success"
            : "info",
        timestamp: a.createdAt.toISOString(),
        summary: summariseAudit(a),
        resourceType: a.resourceType,
        resourceId: a.resourceId,
        propertyId,
        propertyName: propertyId ? propertyMap.get(propertyId) ?? null : null,
      });
    }

    for (const s of syncs) {
      const cleanedMessage = s.message.replace(/^\[ALERT\]\s*/, "");
      items.push({
        id: `sync:${s.id}`,
        kind: "sync",
        level:
          s.level === "error"
            ? "error"
            : s.level === "warn"
            ? "warn"
            : s.level === "success"
            ? "success"
            : "info",
        timestamp: s.createdAt.toISOString(),
        summary: cleanedMessage,
        propertyId: s.propertyId,
        propertyName: s.propertyId ? propertyMap.get(s.propertyId) ?? null : null,
      });
    }

    items.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

    return NextResponse.json({ items: items.slice(0, 10) });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
