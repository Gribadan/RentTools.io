import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// POST /api/properties/sample — bootstrap a populated demo property for the current user.
export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const property = await prisma.property.create({
      data: {
        userId: session.userId,
        name: "Sample Apartment",
        minNights: 2,
        checkInTime: "15:00",
        checkOutTime: "11:00",
        bookingWindow: 365,
      },
    });

    // Spread three non-overlapping reservations across the next 30 days.
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 24 * 60 * 60 * 1000;

    const samples = [
      { name: "Sample Guest 1", startOffset: 3, nights: 4, platform: "airbnb" },
      { name: "Sample Guest 2", startOffset: 10, nights: 3, platform: "booking" },
      { name: "Sample Guest 3", startOffset: 20, nights: 5, platform: "airbnb" },
    ] as const;

    for (const s of samples) {
      const checkIn = new Date(startOfToday.getTime() + s.startOffset * dayMs);
      const checkOut = new Date(checkIn.getTime() + s.nights * dayMs);
      await prisma.reservation.create({
        data: {
          name: s.name,
          checkIn,
          checkOut,
          platform: s.platform,
          propertyId: property.id,
        },
      });
    }

    return NextResponse.json({ property, reservationsCreated: samples.length });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
