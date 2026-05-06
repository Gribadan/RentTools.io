import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/cleaners — list the calling user's account-level Cleaner profiles
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cleaners = await prisma.cleaner.findMany({
      where: { ownerUserId: session.userId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json(cleaners);
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
