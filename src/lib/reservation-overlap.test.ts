import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";
import { parseReservationDate, reservationOverlapFilter } from "./reservation-dates";

const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: "file::memory:" }) });

beforeAll(async () => {
  await prisma.$executeRawUnsafe(`CREATE TABLE "Reservation" (
    "id" INTEGER PRIMARY KEY, "propertyId" INTEGER,
    "name" TEXT, "checkIn" DATETIME, "checkOut" DATETIME
  )`);
  for (const [id, checkIn, checkOut] of [
    [1, "2026-10-08T14:00:00Z", "2026-10-09T12:00:00Z"],
    [2, "2026-10-10T00:00:00Z", "2026-10-11T00:00:00Z"],
    [3, "2026-10-31T14:00:00Z", "2026-11-01T23:59:59Z"],
    [4, "2028-02-29T14:00:00Z", "2028-03-01T12:00:00Z"],
  ] as const) {
    await prisma.$executeRaw`INSERT INTO "Reservation" ("id", "propertyId", "name", "checkIn", "checkOut")
      VALUES (${id}, ${id}, ${"Existing stay"}, ${new Date(checkIn)}, ${new Date(checkOut)})`;
  }
});

afterAll(() => prisma.$disconnect());

describe("calendar-night overlaps against SQLite", () => {
  it.each([
    [1, "2026-10-09", "2026-10-10", false],
    [1, "2026-10-07", "2026-10-08", false],
    [1, "2026-10-08", "2026-10-09", true],
    [1, "2026-10-07", "2026-10-10", true],
    [2, "2026-10-11", "2026-10-12", false],
    [2, "2026-10-09", "2026-10-10", false],
    [2, "2026-10-10", "2026-10-11", true],
    [3, "2026-11-01", "2026-11-02", false],
    [3, "2026-10-31", "2026-11-01", true],
    [4, "2028-03-01", "2028-03-02", false],
    [4, "2028-02-28", "2028-02-29", false],
    [4, "2028-02-29", "2028-03-01", true],
    [99, "2026-10-08", "2026-10-09", false],
  ])("property %i: %s to %s has overlap = %s", async (propertyId, checkIn, checkOut, overlaps) => {
    const result = await prisma.reservation.findFirst({
      where: { propertyId, ...reservationOverlapFilter(parseReservationDate(checkIn)!, parseReservationDate(checkOut)!) },
      select: { id: true },
    });
    expect(result !== null).toBe(overlaps);
  });

  it("compares calendar dates even when its boundaries have legacy times", async () => {
    const result = await prisma.reservation.findFirst({
      where: {
        propertyId: 1,
        ...reservationOverlapFilter(new Date("2026-10-07T14:00:00Z"), new Date("2026-10-08T12:00:00Z")),
      },
      select: { id: true },
    });
    expect(result).toBeNull();
  });
});
