import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function userCanReadProperty(
  propertyId: number,
  userId: number,
  role: string
): Promise<boolean> {
  if (role === "cleaner") {
    const a = await prisma.cleanerAssignment.findUnique({
      where: { cleanerId_propertyId: { cleanerId: userId, propertyId } },
      select: { id: true },
    });
    return !!a;
  }
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: { userId: true },
  });
  return !!p && p.userId === userId;
}

// GET /api/cleaning-records?propertyId=X[&propertyIds=1,2,3] — list records for accessible properties
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const propertyId = request.nextUrl.searchParams.get("propertyId");
    const propertyIdsRaw = request.nextUrl.searchParams.get("propertyIds");

    let scopedIds: number[] = [];
    if (propertyId) {
      const numId = parseInt(propertyId);
      if (isNaN(numId)) {
        return NextResponse.json({ error: "Invalid propertyId" }, { status: 400 });
      }
      if (!(await userCanReadProperty(numId, session.userId, session.role))) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      scopedIds = [numId];
    } else if (propertyIdsRaw) {
      const ids = propertyIdsRaw
        .split(",")
        .map((s) => parseInt(s.trim()))
        .filter((n) => !isNaN(n));
      const allowed = await Promise.all(
        ids.map((id) => userCanReadProperty(id, session.userId, session.role))
      );
      scopedIds = ids.filter((_, i) => allowed[i]);
    } else {
      // No filter: return everything the user can access
      if (session.role === "cleaner") {
        scopedIds = (
          await prisma.cleanerAssignment.findMany({
            where: { cleanerId: session.userId },
            select: { propertyId: true },
          })
        ).map((a) => a.propertyId);
      } else {
        scopedIds = (
          await prisma.property.findMany({
            where: { userId: session.userId },
            select: { id: true },
          })
        ).map((p) => p.id);
      }
    }

    if (scopedIds.length === 0) {
      return NextResponse.json({ records: [] });
    }

    const records = await prisma.cleaningRecord.findMany({
      where: { propertyId: { in: scopedIds } },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ records });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/cleaning-records — body { propertyId, date, status, notes? }
// Upserts the (propertyId, date) pair.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { propertyId, date, status, notes } = await request.json();
    if (!propertyId || !date || !status) {
      return NextResponse.json(
        { error: "propertyId, date, and status are required" },
        { status: 400 }
      );
    }
    if (!["pending", "done", "skipped"].includes(status)) {
      return NextResponse.json(
        { error: "status must be pending, done, or skipped" },
        { status: 400 }
      );
    }
    const numId = Number(propertyId);
    if (!(await userCanReadProperty(numId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date();
    const record = await prisma.cleaningRecord.upsert({
      where: { propertyId_date: { propertyId: numId, date } },
      update: {
        status,
        notes: typeof notes === "string" ? notes : undefined,
        doneAt: status === "done" ? now : null,
        doneByUserId: status === "done" ? session.userId : null,
        updatedAt: now,
      },
      create: {
        propertyId: numId,
        date,
        status,
        notes: typeof notes === "string" ? notes : "",
        doneAt: status === "done" ? now : null,
        doneByUserId: status === "done" ? session.userId : null,
      },
    });

    return NextResponse.json({ record });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
