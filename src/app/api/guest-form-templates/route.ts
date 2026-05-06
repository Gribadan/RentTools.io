import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// RT-25.9 tick 26 — Aggregate read endpoint that powers
// /dashboard/admin/content/guest-forms. Returns every GuestFormTemplate
// the user can manage (own + managed properties), with property info +
// derived counts (fieldCount from the JSON fields blob, submissionCount
// from the related GuestFormSubmission table). Per-property edits keep
// going through /api/properties/[id]/guest-form (PUT) — that route
// stays the canonical write path.

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Cleaners do not see guest-form templates.
    if (session.role === "cleaner") {
      return NextResponse.json({ templates: [] });
    }

    const templates = await prisma.guestFormTemplate.findMany({
      where: {
        property: {
          OR: [
            { userId: session.userId },
            { managers: { some: { managerId: session.userId } } },
          ],
        },
      },
      include: {
        property: { select: { id: true, name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: [{ propertyId: "asc" }, { createdAt: "asc" }],
    });

    const rows = templates.map((t) => {
      let fieldCount = 0;
      try {
        const parsed = JSON.parse(t.fields);
        if (Array.isArray(parsed)) fieldCount = parsed.length;
      } catch {
        fieldCount = 0;
      }
      return {
        id: t.id,
        propertyId: t.propertyId,
        name: t.name,
        fieldCount,
        submissionCount: t._count.submissions,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt ? t.updatedAt.toISOString() : null,
        property: { id: t.property.id, name: t.property.name },
      };
    });

    return NextResponse.json({ templates: rows });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
