import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const HEADERS = [
  "id",
  "propertyId",
  "propertyName",
  "name",
  "platform",
  "checkIn",
  "checkOut",
  "guests",
  "createdAt",
] as const;

type Header = (typeof HEADERS)[number];

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sp = request.nextUrl.searchParams;
    const fromParam = sp.get("from");
    const toParam = sp.get("to");
    const propertyIdParam = sp.get("propertyId");

    let from: Date | null = null;
    let to: Date | null = null;
    if (fromParam) {
      const d = new Date(fromParam);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid from date" }, { status: 400 });
      }
      from = d;
    }
    if (toParam) {
      const d = new Date(toParam);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid to date" }, { status: 400 });
      }
      // include the whole "to" day
      d.setHours(23, 59, 59, 999);
      to = d;
    }

    const where: {
      property: { userId: number };
      propertyId?: number;
      checkIn?: { lte?: Date };
      checkOut?: { gte?: Date };
    } = { property: { userId: session.userId } };

    if (propertyIdParam) {
      const pid = parseInt(propertyIdParam);
      if (isNaN(pid)) {
        return NextResponse.json({ error: "Invalid propertyId" }, { status: 400 });
      }
      where.propertyId = pid;
    }
    // Date overlap filter: a reservation falls in [from, to] if checkIn <= to AND checkOut >= from
    if (to) where.checkIn = { lte: to };
    if (from) where.checkOut = { gte: from };

    const reservations = await prisma.reservation.findMany({
      where,
      orderBy: { checkIn: "asc" },
      include: {
        property: { select: { name: true } },
        _count: { select: { guests: true } },
      },
    });

    const rows = reservations.map((r) => {
      const record: Record<Header, string | number> = {
        id: r.id,
        propertyId: r.propertyId,
        propertyName: r.property.name,
        name: r.name,
        platform: r.platform,
        checkIn: isoDate(r.checkIn),
        checkOut: isoDate(r.checkOut),
        guests: r._count.guests,
        createdAt: r.createdAt.toISOString(),
      };
      return HEADERS.map((h) => escapeCsv(record[h])).join(",");
    });

    const csv = "﻿" + [HEADERS.join(","), ...rows].join("\r\n");
    const filename = `reservations-${isoDate(new Date())}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
