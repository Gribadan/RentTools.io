import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperadmin } from "@/lib/auth";

// Full JSON dump of the calling superadmin's own data — properties,
// reservations, guests, sync logs, message templates, cleaning records,
// calendar links, manager grants. Used as a trust/backup feature in the
// admin panel; RT-15.8 will introduce a parallel per-user GDPR export.
export async function GET() {
  const auth = await requireSuperadmin();
  if (auth.response) return auth.response;

  try {
    const userId = auth.session.userId;
    const properties = await prisma.property.findMany({
      where: { userId },
      include: {
        reservations: { include: { guests: true } },
        calendarLinks: true,
        messageTemplates: true,
        cleaningRecords: true,
        cleanerAssignments: true,
        managers: true,
      },
    });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, createdAt: true },
    });

    const payload = {
      exportedAt: new Date().toISOString(),
      user,
      properties,
    };

    const filename = `rent-tool-export-${userId}-${new Date().toISOString().slice(0, 10)}.json`;
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
