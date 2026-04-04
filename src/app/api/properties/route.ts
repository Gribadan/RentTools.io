import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
}

export async function POST(request: NextRequest) {
  const { name } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const property = await prisma.property.create({ data: { name: name.trim() } });
  return NextResponse.json(property);
}
