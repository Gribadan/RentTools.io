import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import "dotenv/config";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const propName = process.argv[2] || "Квартира 68";
  const property = await prisma.property.findFirst({
    where: { name: propName },
    include: {
      reservations: { orderBy: { checkIn: "asc" } },
      calendarLinks: true,
      calendarEvents: { orderBy: { startDate: "asc" } },
      dateOverrides: { orderBy: { date: "asc" } },
    },
  });

  if (!property) {
    console.log(`Property "${propName}" not found`);
    const all = await prisma.property.findMany({ select: { id: true, name: true } });
    console.log("Available:", all);
    return;
  }

  console.log("=".repeat(60));
  console.log(`PROPERTY: ${property.name} (id=${property.id})`);
  console.log(`minNights: ${property.minNights}`);
  console.log("=".repeat(60));

  console.log("\n--- INTERNAL RESERVATIONS ---");
  for (const r of property.reservations) {
    const ci = new Date(r.checkIn).toISOString().substring(0, 10);
    const co = new Date(r.checkOut).toISOString().substring(0, 10);
    console.log(`  [${r.platform}] ${ci} → ${co} | ${r.name} (id=${r.id})`);
  }

  console.log("\n--- CALENDAR LINKS ---");
  for (const l of property.calendarLinks) {
    console.log(`  [${l.platform}] buffer: ${l.bufferBefore}d/${l.bufferAfter}d | last: ${l.lastFetchedAt}`);
  }

  console.log("\n--- SYNCED CALENDAR EVENTS ---");
  for (const e of property.calendarEvents) {
    console.log(`  [${e.platform}] ${e.startDate} → ${e.endDate} | ${e.summary} | UID: ${e.uid}`);
  }

  console.log("\n--- DATE OVERRIDES ---");
  for (const o of property.dateOverrides) {
    console.log(`  ${o.date} → ${o.type}${o.note ? " (" + o.note + ")" : ""}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
