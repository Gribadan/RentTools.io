import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import "dotenv/config";

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const schema = `
CREATE TABLE IF NOT EXISTS "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");

CREATE TABLE IF NOT EXISTS "AppSettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "AppSettings_key_key" ON "AppSettings"("key");

CREATE TABLE IF NOT EXISTS "Property" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Reservation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "checkIn" DATETIME NOT NULL,
    "checkOut" DATETIME NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'airbnb',
    "propertyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Guest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "dateOfBirth" TEXT NOT NULL,
    "yearsOld" INTEGER NOT NULL,
    "dateOfIssue" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "visaNumber" TEXT NOT NULL DEFAULT '',
    "visaFrom" TEXT NOT NULL DEFAULT '',
    "visaTo" TEXT NOT NULL DEFAULT '',
    "hasVisa" INTEGER NOT NULL DEFAULT 0,
    "firstName" TEXT NOT NULL DEFAULT '',
    "lastName" TEXT NOT NULL DEFAULT '',
    "citizenshipCode" TEXT NOT NULL DEFAULT '',
    "gender" TEXT NOT NULL DEFAULT '',
    "parentId" INTEGER,
    "reservationId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Guest_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
`;

async function main() {
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
    console.log("OK:", stmt.substring(0, 60) + "...");
  }

  // Calendar sync tables
  const calendarSchema = `
CREATE TABLE IF NOT EXISTS "CalendarLink" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "icalExportUrl" TEXT NOT NULL,
    "bufferBefore" INTEGER NOT NULL DEFAULT 1,
    "bufferAfter" INTEGER NOT NULL DEFAULT 1,
    "lastFetchedAt" DATETIME,
    "lastError" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarLink_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "platform" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "summary" TEXT NOT NULL DEFAULT '',
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalendarEvent_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CalendarEvent_propertyId_platform_uid_key" ON "CalendarEvent"("propertyId", "platform", "uid");

CREATE TABLE IF NOT EXISTS "SyncLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER,
    "level" TEXT NOT NULL DEFAULT 'info',
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;

  const calendarStatements = calendarSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of calendarStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // Migrations: add new columns if missing
  const migrations = [
    `ALTER TABLE "Reservation" ADD COLUMN "platform" TEXT NOT NULL DEFAULT 'airbnb'`,
    `ALTER TABLE "Guest" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "Guest" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "Guest" ADD COLUMN "citizenshipCode" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "Guest" ADD COLUMN "gender" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "Guest" ADD COLUMN "visaNumber" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "Guest" ADD COLUMN "visaFrom" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "Guest" ADD COLUMN "visaTo" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "Guest" ADD COLUMN "hasVisa" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "Guest" ADD COLUMN "parentId" INTEGER`,
  ];
  for (const sql of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log("OK:", sql.substring(0, 70) + "...");
    } catch {
      // Column already exists
    }
  }

  console.log("\nSchema pushed to Turso successfully!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
