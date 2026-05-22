import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import "dotenv/config";
import path from "node:path";
import fs from "node:fs";

function resolveDbConfig(): { url: string; authToken?: string; label: string } {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl?.startsWith("file:")) {
    const rel = dbUrl.slice("file:".length);
    const abs = path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    return { url: `file:${abs}`, label: `local SQLite at ${abs}` };
  }
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
      label: `Turso (${process.env.TURSO_DATABASE_URL})`,
    };
  }
  throw new Error("No database configured. Set DATABASE_URL=file:... or TURSO_DATABASE_URL.");
}

const config = resolveDbConfig();
console.log(`Pushing schema to: ${config.label}`);
const adapter = new PrismaLibSql({ url: config.url, authToken: config.authToken });
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
    "userId" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    `ALTER TABLE "Property" ADD COLUMN "minNights" INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE "Property" ADD COLUMN "checkInTime" TEXT NOT NULL DEFAULT '14:00'`,
    `ALTER TABLE "Property" ADD COLUMN "checkOutTime" TEXT NOT NULL DEFAULT '12:00'`,
    `ALTER TABLE "Property" ADD COLUMN "bookingWindow" INTEGER NOT NULL DEFAULT 365`,
    `ALTER TABLE "Reservation" ADD COLUMN "linkedEventUid" TEXT`,
    `ALTER TABLE "Property" ADD COLUMN "updatedAt" DATETIME`,
    `ALTER TABLE "Reservation" ADD COLUMN "updatedAt" DATETIME`,
    `ALTER TABLE "Guest" ADD COLUMN "updatedAt" DATETIME`,
    `ALTER TABLE "Property" ADD COLUMN "userId" INTEGER NOT NULL DEFAULT 1`,
    `CREATE INDEX IF NOT EXISTS "Property_userId_idx" ON "Property"("userId")`,
    `ALTER TABLE "CalendarLink" ADD COLUMN "failureCount" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "User" ADD COLUMN "alertsDismissedAt" DATETIME`,
    `ALTER TABLE "User" ADD COLUMN "lastLoginAt" DATETIME`,
    `ALTER TABLE "User" ADD COLUMN "suspendedAt" DATETIME`,
    `ALTER TABLE "Property" ADD COLUMN "feedToken" TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Property_feedToken_key" ON "Property"("feedToken")`,
    `ALTER TABLE "User" ADD COLUMN "email" TEXT`,
    `ALTER TABLE "User" ADD COLUMN "googleId" TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_googleId_key" ON "User"("googleId")`,
    // Durable URL slug for the public iCal feed. Minted at property
    // creation (or onboarding-draft creation) and never changes — Airbnb /
    // Booking import URLs the user pasted somewhere stay valid even
    // after rename or signup transition. See src/lib/slugify.ts.
    `ALTER TABLE "Property" ADD COLUMN "feedSlug" TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Property_feedSlug_key" ON "Property"("feedSlug")`,
    `ALTER TABLE "OnboardingDraft" ADD COLUMN "feedSlug" TEXT`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingDraft_feedSlug_key" ON "OnboardingDraft"("feedSlug")`,
    // RT-20.3 tick 2 — cross-locale link for the blog. Posts that
    // translate the same article share a translationGroupId; null when
    // the post has no sibling.
    `ALTER TABLE "BlogPost" ADD COLUMN "translationGroupId" INTEGER`,
    `CREATE INDEX IF NOT EXISTS "BlogPost_translationGroupId_idx" ON "BlogPost"("translationGroupId")`,
    // RT-25.3 — per-property master toggle for cleaning logic. When 0,
    // useCalendarData skips buffer/sameDayCleaning/potentialCleaning/
    // unbookable computation and the cleaning schedule hides the
    // property; conflict detection still runs.
    `ALTER TABLE "Property" ADD COLUMN "cleaningEnabled" INTEGER NOT NULL DEFAULT 1`,
    // RT-25.12 — per-guest free-text notes. Empty default so existing
    // rows surface as no-note rather than NULL in the UI.
    `ALTER TABLE "Guest" ADD COLUMN "notes" TEXT NOT NULL DEFAULT ''`,
    // RT-25.13 — per-guest phone for WhatsApp / Telegram deeplinks.
    // Stored as E.164 (`+CCNNNNNN…`) but we accept any leading `+` followed
    // by 7-15 digits, or empty.
    `ALTER TABLE "Guest" ADD COLUMN "phone" TEXT NOT NULL DEFAULT ''`,
    // Blog structured fields — RT-blog SEO pass. tldr renders as a
    // callout above the article body; faqJson drives both the on-page
    // Q/A section and the FAQPage JSON-LD that makes posts eligible for
    // Google's FAQ rich result. ogImageWidth/Height feed the cover <img>
    // and the BlogPosting ImageObject so we can both kill CLS and ship
    // the dimensions Google expects.
    `ALTER TABLE "BlogPost" ADD COLUMN "tldr" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "BlogPost" ADD COLUMN "faqJson" TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE "BlogPost" ADD COLUMN "ogImageWidth" INTEGER`,
    `ALTER TABLE "BlogPost" ADD COLUMN "ogImageHeight" INTEGER`,
    // Per-reservation messenger group URLs — the host saves the URL of
    // the one-off group they created for this specific booking, so they
    // can re-open the right group in one click later.
    `ALTER TABLE "Reservation" ADD COLUMN "tgGroupUrl" TEXT`,
    `ALTER TABLE "Reservation" ADD COLUMN "waGroupUrl" TEXT`,
    // Host-editable override for the messenger group-chat name. NULL =
    // fall back to the auto-generated "[Platform] [dates] | [guest] |
    // [property]" string.
    `ALTER TABLE "Reservation" ADD COLUMN "groupName" TEXT`,
  ];

  // Feedback table — site-wide visitor feedback queue. New table, so we
  // run a CREATE TABLE here (idempotent on IF NOT EXISTS) rather than
  // ALTER. Indexes are inline so the rate-limit lookup
  // (`ipHash + createdAt > now() - 30s`) hits an index from day one.
  const feedbackSchema = `
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "body" TEXT NOT NULL,
    "contactEmail" TEXT,
    "pagePath" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "ipHash" TEXT NOT NULL,
    "userId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Feedback_status_createdAt_idx" ON "Feedback"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Feedback_ipHash_createdAt_idx" ON "Feedback"("ipHash", "createdAt");
CREATE INDEX IF NOT EXISTS "Feedback_userId_idx" ON "Feedback"("userId");
`;
  const feedbackStatements = feedbackSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of feedbackStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }
  for (const sql of migrations) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log("OK:", sql.substring(0, 70) + "...");
    } catch {
      // Column already exists
    }
  }

  // AuditLog table for mutation tracking
  const auditSchema = `
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" INTEGER NOT NULL,
    "payload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
`;

  const auditStatements = auditSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of auditStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // CleanerAssignment table — owner ↔ cleaner ↔ property
  const cleanerSchema = `
CREATE TABLE IF NOT EXISTS "CleanerAssignment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cleanerId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CleanerAssignment_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CleanerAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CleanerAssignment_cleanerId_propertyId_key" ON "CleanerAssignment"("cleanerId", "propertyId");
CREATE INDEX IF NOT EXISTS "CleanerAssignment_cleanerId_idx" ON "CleanerAssignment"("cleanerId");
CREATE INDEX IF NOT EXISTS "CleanerAssignment_propertyId_idx" ON "CleanerAssignment"("propertyId");
`;

  const cleanerStatements = cleanerSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of cleanerStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // RT-25.10 tick 1 — Cleaner profile table (account-level metadata,
  // no login). Idempotent: created once, ignored on rerun.
  const cleanerProfileSchema = `
CREATE TABLE IF NOT EXISTS "Cleaner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ownerUserId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cleaner_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "Cleaner_ownerUserId_idx" ON "Cleaner"("ownerUserId");
`;

  const cleanerProfileStatements = cleanerProfileSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of cleanerProfileStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // RT-25.10 tick 1 — extend CleanerAssignment with cleanerProfileId
  // + priority. Rebuilds the table once to make cleanerId nullable
  // (SQLite has no ALTER COLUMN; we detect the existing NOT NULL via
  // PRAGMA table_info and only rebuild on first run). Backfill below
  // copies existing rows verbatim, so already-assigned cleaners keep
  // their cleanerId; cleanerProfileId is filled in by the per-row
  // backfill step further down.
  try {
    const tableInfo = await prisma.$queryRawUnsafe<
      Array<{ name: string; notnull: number }>
    >(`PRAGMA table_info("CleanerAssignment")`);
    const cleanerIdCol = tableInfo.find((c) => c.name === "cleanerId");
    const hasProfileIdCol = tableInfo.some((c) => c.name === "cleanerProfileId");
    const hasPriorityCol = tableInfo.some((c) => c.name === "priority");
    const cleanerIdIsNotNull = cleanerIdCol?.notnull === 1;

    if (cleanerIdIsNotNull) {
      console.log("Rebuilding CleanerAssignment to make cleanerId nullable…");
      await prisma.$executeRawUnsafe(`PRAGMA foreign_keys=OFF`);
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "CleanerAssignment" RENAME TO "CleanerAssignment_old"`,
      );
      await prisma.$executeRawUnsafe(`
        CREATE TABLE "CleanerAssignment" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "cleanerId" INTEGER,
          "cleanerProfileId" INTEGER,
          "propertyId" INTEGER NOT NULL,
          "priority" INTEGER NOT NULL DEFAULT 0,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "CleanerAssignment_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "CleanerAssignment_cleanerProfileId_fkey" FOREIGN KEY ("cleanerProfileId") REFERENCES "Cleaner" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "CleanerAssignment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
        )
      `);
      await prisma.$executeRawUnsafe(`
        INSERT INTO "CleanerAssignment" ("id", "cleanerId", "cleanerProfileId", "propertyId", "priority", "createdAt")
        SELECT "id", "cleanerId", NULL, "propertyId", 0, "createdAt" FROM "CleanerAssignment_old"
      `);
      await prisma.$executeRawUnsafe(`DROP TABLE "CleanerAssignment_old"`);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "CleanerAssignment_cleanerId_propertyId_key" ON "CleanerAssignment"("cleanerId", "propertyId")`,
      );
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "CleanerAssignment_cleanerProfileId_propertyId_key" ON "CleanerAssignment"("cleanerProfileId", "propertyId")`,
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "CleanerAssignment_cleanerId_idx" ON "CleanerAssignment"("cleanerId")`,
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "CleanerAssignment_cleanerProfileId_idx" ON "CleanerAssignment"("cleanerProfileId")`,
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "CleanerAssignment_propertyId_idx" ON "CleanerAssignment"("propertyId")`,
      );
      await prisma.$executeRawUnsafe(`PRAGMA foreign_keys=ON`);
      console.log("OK: CleanerAssignment rebuilt with nullable cleanerId");
    } else {
      // Table already nullable — just make sure the new columns + index exist.
      if (!hasProfileIdCol) {
        try {
          await prisma.$executeRawUnsafe(
            `ALTER TABLE "CleanerAssignment" ADD COLUMN "cleanerProfileId" INTEGER`,
          );
          console.log("OK: added cleanerProfileId column");
        } catch {
          /* already added */
        }
      }
      if (!hasPriorityCol) {
        try {
          await prisma.$executeRawUnsafe(
            `ALTER TABLE "CleanerAssignment" ADD COLUMN "priority" INTEGER NOT NULL DEFAULT 0`,
          );
          console.log("OK: added priority column");
        } catch {
          /* already added */
        }
      }
      try {
        await prisma.$executeRawUnsafe(
          `CREATE UNIQUE INDEX IF NOT EXISTS "CleanerAssignment_cleanerProfileId_propertyId_key" ON "CleanerAssignment"("cleanerProfileId", "propertyId")`,
        );
        await prisma.$executeRawUnsafe(
          `CREATE INDEX IF NOT EXISTS "CleanerAssignment_cleanerProfileId_idx" ON "CleanerAssignment"("cleanerProfileId")`,
        );
      } catch {
        /* already exists */
      }
    }
  } catch (err) {
    console.error("CleanerAssignment migration failed:", err);
  }

  // RT-25.10 tick 1 — backfill Cleaner profiles for existing User
  // cleaners. For each User with role='cleaner', create one Cleaner
  // profile (name = username, phone = null, ownerUserId = the FIRST
  // property's owner). Then update each CleanerAssignment.cleanerProfileId.
  // Idempotent: skips users who already have a profile (matched by
  // ownerUserId + name + a corresponding cleaner-User username).
  try {
    const cleanerUsers = await prisma.$queryRawUnsafe<
      Array<{ id: number; username: string }>
    >(`SELECT id, username FROM "User" WHERE role = 'cleaner'`);

    for (const u of cleanerUsers) {
      // Find first property they're assigned to (by createdAt) so we
      // know which owner to attach the new profile to.
      const firstAssignment = await prisma.$queryRawUnsafe<
        Array<{ id: number; propertyId: number; cleanerProfileId: number | null }>
      >(
        `SELECT id, propertyId, cleanerProfileId FROM "CleanerAssignment"
         WHERE cleanerId = ? ORDER BY createdAt ASC LIMIT 1`,
        u.id,
      );
      if (firstAssignment.length === 0) continue;

      const property = await prisma.$queryRawUnsafe<
        Array<{ userId: number }>
      >(`SELECT userId FROM "Property" WHERE id = ?`, firstAssignment[0].propertyId);
      if (property.length === 0) continue;
      const ownerUserId = property[0].userId;

      // Look for an existing profile for this owner with this name.
      const existingProfile = await prisma.$queryRawUnsafe<
        Array<{ id: number }>
      >(
        `SELECT id FROM "Cleaner" WHERE ownerUserId = ? AND name = ? LIMIT 1`,
        ownerUserId,
        u.username,
      );

      let profileId: number;
      if (existingProfile.length > 0) {
        profileId = existingProfile[0].id;
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "Cleaner" ("ownerUserId", "name", "phone") VALUES (?, ?, NULL)`,
          ownerUserId,
          u.username,
        );
        const inserted = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
          `SELECT id FROM "Cleaner" WHERE ownerUserId = ? AND name = ? ORDER BY id DESC LIMIT 1`,
          ownerUserId,
          u.username,
        );
        profileId = inserted[0].id;
        console.log(
          `OK: backfilled Cleaner profile for user ${u.username} (id=${u.id}) → profile ${profileId}`,
        );
      }

      // Update every CleanerAssignment for this user that doesn't
      // already point at a profile.
      await prisma.$executeRawUnsafe(
        `UPDATE "CleanerAssignment" SET cleanerProfileId = ?
         WHERE cleanerId = ? AND cleanerProfileId IS NULL`,
        profileId,
        u.id,
      );
    }
  } catch (err) {
    console.error("Cleaner profile backfill failed:", err);
  }

  // PropertyManager table — owner grants management rights to other users
  const managerSchema = `
CREATE TABLE IF NOT EXISTS "PropertyManager" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "managerId" INTEGER NOT NULL,
    "grantedById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropertyManager_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyManager_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyManager_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyManager_managerId_propertyId_key" ON "PropertyManager"("managerId", "propertyId");
CREATE INDEX IF NOT EXISTS "PropertyManager_propertyId_idx" ON "PropertyManager"("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyManager_managerId_idx" ON "PropertyManager"("managerId");
`;

  const managerStatements = managerSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of managerStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // PropertyManagerInvite — invite tokens for granting manager access via link
  const inviteSchema = `
CREATE TABLE IF NOT EXISTS "PropertyManagerInvite" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdById" INTEGER NOT NULL,
    "acceptedById" INTEGER,
    "acceptedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "revokedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PropertyManagerInvite_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyManagerInvite_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PropertyManagerInvite_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PropertyManagerInvite_token_key" ON "PropertyManagerInvite"("token");
CREATE INDEX IF NOT EXISTS "PropertyManagerInvite_propertyId_idx" ON "PropertyManagerInvite"("propertyId");
CREATE INDEX IF NOT EXISTS "PropertyManagerInvite_token_idx" ON "PropertyManagerInvite"("token");
`;

  const inviteStatements = inviteSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of inviteStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // MessageTemplate table — guest pre/post-arrival templates per property
  const messageTemplateSchema = `
CREATE TABLE IF NOT EXISTS "MessageTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "subject" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL,
    "sendOffsetDays" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "MessageTemplate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "MessageTemplate_propertyId_idx" ON "MessageTemplate"("propertyId");
`;

  const messageTemplateStatements = messageTemplateSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of messageTemplateStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // CleaningRecord table — track cleaning status per property × date
  const cleaningRecordSchema = `
CREATE TABLE IF NOT EXISTS "CleaningRecord" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "doneAt" DATETIME,
    "doneByUserId" INTEGER,
    "notes" TEXT NOT NULL DEFAULT '',
    "photos" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "CleaningRecord_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "CleaningRecord_propertyId_date_key" ON "CleaningRecord"("propertyId", "date");
CREATE INDEX IF NOT EXISTS "CleaningRecord_propertyId_date_idx" ON "CleaningRecord"("propertyId", "date");
`;

  const cleaningRecordStatements = cleaningRecordSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of cleaningRecordStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // DateOverride table for manual open/close of calendar dates
  const dateOverrideSchema = `
CREATE TABLE IF NOT EXISTS "DateOverride" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DateOverride_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "DateOverride_propertyId_date_key" ON "DateOverride"("propertyId", "date");
`;

  const dateOverrideStatements = dateOverrideSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of dateOverrideStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // SiteSetting — global key/value config for admin panel
  const siteSettingSchema = `
CREATE TABLE IF NOT EXISTS "SiteSetting" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME
);

CREATE UNIQUE INDEX IF NOT EXISTS "SiteSetting_key_key" ON "SiteSetting"("key");
`;

  const siteSettingStatements = siteSettingSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of siteSettingStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // OnboardingDraft — anonymous /onboard wizard state, claimed at signup
  const onboardingDraftSchema = `
CREATE TABLE IF NOT EXISTS "OnboardingDraft" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionToken" TEXT NOT NULL,
    "propertyName" TEXT NOT NULL DEFAULT '',
    "links" TEXT NOT NULL DEFAULT '[]',
    "claimedByUserId" INTEGER,
    "claimedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

CREATE UNIQUE INDEX IF NOT EXISTS "OnboardingDraft_sessionToken_key" ON "OnboardingDraft"("sessionToken");
`;

  const onboardingDraftStatements = onboardingDraftSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of onboardingDraftStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // ExtractionLog — one row per /api/extract POST for daily quota counting
  const extractionLogSchema = `
CREATE TABLE IF NOT EXISTS "ExtractionLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "fileCount" INTEGER NOT NULL DEFAULT 0,
    "success" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "ExtractionLog_userId_createdAt_idx" ON "ExtractionLog"("userId", "createdAt");
`;

  const extractionLogStatements = extractionLogSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of extractionLogStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // BlogPost / BlogTag / BlogComment — RT-20.1 blog data model
  const blogSchema = `
CREATE TABLE IF NOT EXISTS "BlogPost" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "body" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "authorId" INTEGER NOT NULL,
    "tagsJson" TEXT NOT NULL DEFAULT '[]',
    "ogImageUrl" TEXT,
    "translationGroupId" INTEGER,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "BlogPost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_locale_key" ON "BlogPost"("slug", "locale");
CREATE INDEX IF NOT EXISTS "BlogPost_locale_status_publishedAt_idx" ON "BlogPost"("locale", "status", "publishedAt");
CREATE INDEX IF NOT EXISTS "BlogPost_authorId_idx" ON "BlogPost"("authorId");
CREATE INDEX IF NOT EXISTS "BlogPost_translationGroupId_idx" ON "BlogPost"("translationGroupId");

CREATE TABLE IF NOT EXISTS "BlogTag" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "BlogTag_slug_locale_key" ON "BlogTag"("slug", "locale");

CREATE TABLE IF NOT EXISTS "BlogComment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "postId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'visible',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "BlogComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "BlogPost" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlogComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BlogComment_postId_createdAt_idx" ON "BlogComment"("postId", "createdAt");
CREATE INDEX IF NOT EXISTS "BlogComment_userId_idx" ON "BlogComment"("userId");
CREATE INDEX IF NOT EXISTS "BlogComment_status_createdAt_idx" ON "BlogComment"("status", "createdAt");
`;

  const blogStatements = blogSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of blogStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // SeoOverride — RT-18.3 per-page SEO overrides
  const seoOverrideSchema = `
CREATE TABLE IF NOT EXISTS "SeoOverride" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "title" TEXT,
    "description" TEXT,
    "ogImage" TEXT,
    "canonical" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

CREATE UNIQUE INDEX IF NOT EXISTS "SeoOverride_path_locale_key" ON "SeoOverride"("path", "locale");
CREATE INDEX IF NOT EXISTS "SeoOverride_path_idx" ON "SeoOverride"("path");
`;

  const seoOverrideStatements = seoOverrideSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of seoOverrideStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // Seed default SiteSetting keys (idempotent — only inserts if missing)
  const siteSettingDefaults: Array<{ key: string; value: string }> = [
    { key: "signup_enabled", value: "true" },
    { key: "extraction_per_user_daily_limit", value: "20" },
    { key: "landing_announcement", value: "" },
    { key: "support_email", value: "" },
    // Site-wide SEO defaults — RT-18.3. Empty string = fall back to the
    // hard-coded copy in src/app/layout.tsx so a fresh install still
    // ships sensible metadata before an admin sets these.
    { key: "seo_default_title", value: "" },
    { key: "seo_default_description", value: "" },
    { key: "seo_default_og_image", value: "" },
  ];
  for (const { key, value } of siteSettingDefaults) {
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "SiteSetting" ("key", "value") VALUES (?, ?) ON CONFLICT("key") DO NOTHING`,
        key,
        value,
      );
      console.log("OK: seed SiteSetting", key);
    } catch (err) {
      console.error("Seed failed for", key, err);
    }
  }

  // CalendarPlatform — RT-17.1 platform preset registry
  const platformSchema = `
CREATE TABLE IF NOT EXISTS "CalendarPlatform" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',
    "iconUrl" TEXT,
    "defaultBufferBefore" INTEGER NOT NULL DEFAULT 1,
    "defaultBufferAfter" INTEGER NOT NULL DEFAULT 1,
    "importInstructionsKey" TEXT,
    "exportInstructionsKey" TEXT,
    "isCustom" INTEGER NOT NULL DEFAULT 0,
    "enabled" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 100,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

CREATE UNIQUE INDEX IF NOT EXISTS "CalendarPlatform_slug_key" ON "CalendarPlatform"("slug");
`;

  const platformStatements = platformSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of platformStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // Seed the 12 baseline platform presets. Direct gets zero buffer
  // because manually-entered reservations carry their exact dates.
  // Insert is idempotent on slug so reruns don't clobber admin edits
  // — the first push wins, subsequent pushes only fill gaps.
  const platformPresets: Array<{
    slug: string;
    displayName: string;
    color: string;
    sortOrder: number;
    defaultBufferBefore?: number;
    defaultBufferAfter?: number;
  }> = [
    { slug: "airbnb",     displayName: "Airbnb",      color: "#FF385C", sortOrder: 10 },
    { slug: "booking",    displayName: "Booking.com", color: "#003580", sortOrder: 20 },
    { slug: "vrbo",       displayName: "Vrbo",        color: "#245ABC", sortOrder: 30 },
    { slug: "expedia",    displayName: "Expedia",     color: "#FFC72C", sortOrder: 40 },
    { slug: "hostaway",   displayName: "Hostaway",    color: "#2E5BFF", sortOrder: 50 },
    { slug: "lodgify",    displayName: "Lodgify",     color: "#00B5AD", sortOrder: 60 },
    { slug: "hospitable", displayName: "Hospitable",  color: "#1B5E20", sortOrder: 70 },
    { slug: "smoobu",     displayName: "Smoobu",      color: "#4A148C", sortOrder: 80 },
    { slug: "houfy",      displayName: "Houfy",       color: "#D84315", sortOrder: 90 },
    { slug: "plumguide",  displayName: "Plum Guide",  color: "#2E1065", sortOrder: 100 },
    { slug: "whimstay",   displayName: "Whimstay",    color: "#FF7043", sortOrder: 110 },
    { slug: "direct",     displayName: "Direct",      color: "#6B7280", sortOrder: 200, defaultBufferBefore: 0, defaultBufferAfter: 0 },
  ];

  for (const p of platformPresets) {
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "CalendarPlatform"
          ("slug", "displayName", "color", "defaultBufferBefore", "defaultBufferAfter",
           "importInstructionsKey", "exportInstructionsKey", "isCustom", "enabled", "sortOrder")
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?)
         ON CONFLICT("slug") DO NOTHING`,
        p.slug,
        p.displayName,
        p.color,
        p.defaultBufferBefore ?? 1,
        p.defaultBufferAfter ?? 1,
        `platform.${p.slug}.import`,
        `platform.${p.slug}.export`,
        p.sortOrder,
      );
      console.log("OK: seed CalendarPlatform", p.slug);
    } catch (err) {
      console.error("Seed failed for CalendarPlatform", p.slug, err);
    }
  }

  // GuestFormTemplate / GuestFormSubmission — RT-25.2 pre-arrival guest forms
  const guestFormSchema = `
CREATE TABLE IF NOT EXISTS "GuestFormTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "propertyId" INTEGER NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "fields" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "GuestFormTemplate_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "GuestFormTemplate_propertyId_idx" ON "GuestFormTemplate"("propertyId");

CREATE TABLE IF NOT EXISTS "GuestFormSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservationId" INTEGER NOT NULL,
    "templateId" INTEGER NOT NULL,
    "shareToken" TEXT NOT NULL,
    "answers" TEXT NOT NULL DEFAULT '[]',
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    CONSTRAINT "GuestFormSubmission_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GuestFormSubmission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "GuestFormTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "GuestFormSubmission_shareToken_key" ON "GuestFormSubmission"("shareToken");
CREATE INDEX IF NOT EXISTS "GuestFormSubmission_reservationId_idx" ON "GuestFormSubmission"("reservationId");
CREATE INDEX IF NOT EXISTS "GuestFormSubmission_templateId_idx" ON "GuestFormSubmission"("templateId");
`;

  const guestFormStatements = guestFormSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of guestFormStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  // EmailCode — short-lived 6-digit codes for email-verified signup and
  // password reset. For signup the row also carries the pending
  // account's hashed password so no half-built User exists before the
  // address is confirmed; for reset it carries the target userId.
  const emailCodeSchema = `
CREATE TABLE IF NOT EXISTS "EmailCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purpose" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "passwordHash" TEXT,
    "userId" INTEGER,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "consumedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "EmailCode_email_purpose_idx" ON "EmailCode"("email", "purpose");
`;

  const emailCodeStatements = emailCodeSchema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of emailCodeStatements) {
    try {
      await prisma.$executeRawUnsafe(stmt);
      console.log("OK:", stmt.substring(0, 60) + "...");
    } catch {
      // Table/index already exists
    }
  }

  console.log(`\nSchema pushed to ${config.label} successfully!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
