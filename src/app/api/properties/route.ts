import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        reservations: {
          orderBy: { checkIn: "asc" },
          include: { _count: { select: { guests: true } } },
        },
      },
    });
    return NextResponse.json(properties);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    const property = await prisma.property.create({ data: { name: name.trim() } });
    return NextResponse.json(property);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
