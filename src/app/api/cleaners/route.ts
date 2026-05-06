import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/cleaners — list the calling user's account-level Cleaner profiles.
//   - default response shape (used by per-property pickers): { id, name, phone, createdAt }[]
//   - ?withAssignments=1 (used by the admin Cleaners pool page): adds an
//     `assignments: { propertyId, propertyName, priority }[]` array per row
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const withAssignments = request.nextUrl.searchParams.get("withAssignments") === "1";

    const cleaners = await prisma.cleaner.findMany({
      where: { ownerUserId: session.userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        ...(withAssignments
          ? {
              assignments: {
                select: {
                  propertyId: true,
                  priority: true,
                  property: { select: { id: true, name: true } },
                },
                orderBy: { priority: "asc" },
              },
            }
          : {}),
      },
    });

    if (!withAssignments) return NextResponse.json(cleaners);

    type Row = {
      id: number;
      name: string;
      phone: string | null;
      createdAt: Date;
      assignments?: {
        propertyId: number;
        priority: number;
        property: { id: number; name: string };
      }[];
    };
    const shaped = (cleaners as unknown as Row[]).map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      createdAt: c.createdAt,
      assignments: (c.assignments ?? []).map((row) => ({
        propertyId: row.propertyId,
        propertyName: row.property.name,
        priority: row.priority,
      })),
    }));
    return NextResponse.json(shaped);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/cleaners — body { name, phone? } — create a Cleaner profile
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const phoneRaw = typeof body?.phone === "string" ? body.phone.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name required" }, { status: 400 });
    }
    if (name.length > 120) {
      return NextResponse.json({ error: "name too long" }, { status: 400 });
    }
    const phone = phoneRaw.length > 0 ? phoneRaw.slice(0, 32) : null;

    const cleaner = await prisma.cleaner.create({
      data: {
        ownerUserId: session.userId,
        name,
        phone,
      },
      select: { id: true, name: true, phone: true, createdAt: true },
    });

    return NextResponse.json(cleaner, { status: 201 });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
