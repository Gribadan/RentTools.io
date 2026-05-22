import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { maskGuestDocs } from "@/lib/guest-privacy";

// GDPR data export. Returns every row tied to the calling user as a
// single JSON document so they can take their data with them. Mirrors
// the superadmin /api/admin/export-my-data endpoint but is available
// to any authenticated user.
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.userId;

    const [user, properties, auditLogs, extractionLogs, managerGrants, managedProperties, sentInvites] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, role: true, createdAt: true },
        }),
        prisma.property.findMany({
          where: { userId },
          include: {
            reservations: { include: { guests: true } },
            calendarLinks: true,
            calendarEvents: true,
            dateOverrides: true,
            messageTemplates: true,
            cleaningRecords: true,
            cleanerAssignments: true,
            managers: true,
          },
        }),
        prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.extractionLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.propertyManager.findMany({
          where: { grantedById: userId },
          include: { property: { select: { id: true, name: true } } },
        }),
        prisma.propertyManager.findMany({
          where: { managerId: userId },
          include: { property: { select: { id: true, name: true } } },
        }),
        prisma.propertyManagerInvite.findMany({
          where: { createdById: userId },
        }),
      ]);

    // Redact guest passport / ID fields if a superadmin is impersonating
    // — an impersonating session must not be able to export them either.
    const redact = !!session.impersonatorId;
    const exportProperties = redact
      ? properties.map((p) => ({
          ...p,
          reservations: p.reservations.map((r) => ({
            ...r,
            guests: r.guests.map((g) => maskGuestDocs(g, true)),
          })),
        }))
      : properties;

    const payload = {
      exportedAt: new Date().toISOString(),
      user,
      properties: exportProperties,
      auditLogs,
      extractionLogs,
      managerGrantsGiven: managerGrants,
      managedProperties,
      managerInvitesCreated: sentInvites,
    };

    const filename = `rent-tool-data-${userId}-${new Date().toISOString().slice(0, 10)}.json`;
    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
