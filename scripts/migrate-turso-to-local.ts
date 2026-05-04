/**
 * Copy ALL data from a Turso database to a local SQLite file, preserving IDs.
 *
 * Usage:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... \
 *     LOCAL_DB_PATH=./data/prod.db \
 *     npx tsx scripts/migrate-turso-to-local.ts            # dry run (counts only)
 *
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... \
 *     LOCAL_DB_PATH=./data/prod.db \
 *     npx tsx scripts/migrate-turso-to-local.ts --write    # actually copies
 *
 * Both DBs must already have the schema applied (run prisma/push-schema.ts on
 * the local DB first). The script walks tables in dependency order, dumps
 * everything from Turso, and inserts into local with original IDs.
 *
 * Safe to re-run: each table is wiped before copying. The local DB is treated
 * as a destination — never the other way around.
 */

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import "dotenv/config";
import path from "node:path";
import fs from "node:fs";

const WRITE = process.argv.includes("--write");

if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN");
  process.exit(1);
}
const localPathRaw = process.env.LOCAL_DB_PATH || "./data/prod.db";
const localPath = path.isAbsolute(localPathRaw) ? localPathRaw : path.resolve(process.cwd(), localPathRaw);
fs.mkdirSync(path.dirname(localPath), { recursive: true });

const tursoAdapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const turso = new PrismaClient({ adapter: tursoAdapter });

const localAdapter = new PrismaLibSql({ url: `file:${localPath}` });
const local = new PrismaClient({ adapter: localAdapter });

// Tables in topological order (parents before children).
// Dump direction matters: we copy parents first so FKs resolve.
const TABLES = [
  "User",
  "AppSettings",
  "SiteSetting",
  "Property",
  "PropertyManager",
  "PropertyManagerInvite",
  "MessageTemplate",
  "CalendarLink",
  "CalendarEvent",
  "Reservation",
  "Guest",
  "DateOverride",
  "CleanerAssignment",
  "CleaningRecord",
  "AuditLog",
  "ExtractionLog",
  "SyncLog",
] as const;

async function tableExists(prisma: PrismaClient, name: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name = ?`,
    name
  );
  return Number(rows?.[0]?.count ?? 0) > 0;
}

async function dumpTable(prisma: PrismaClient, name: string): Promise<Record<string, unknown>[]> {
  return await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT * FROM "${name}"`
  );
}

async function countRows(prisma: PrismaClient, name: string): Promise<number> {
  const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM "${name}"`
  );
  return Number(rows?.[0]?.count ?? 0);
}

async function wipeTable(prisma: PrismaClient, name: string): Promise<void> {
  await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
}

async function insertRow(prisma: PrismaClient, name: string, row: Record<string, unknown>): Promise<void> {
  const cols = Object.keys(row);
  const placeholders = cols.map(() => "?").join(", ");
  const colList = cols.map((c) => `"${c}"`).join(", ");
  const values = cols.map((c) => {
    const v = row[c];
    if (v instanceof Date) return v.toISOString();
    if (typeof v === "boolean") return v ? 1 : 0;
    return v;
  });
  await prisma.$executeRawUnsafe(
    `INSERT INTO "${name}" (${colList}) VALUES (${placeholders})`,
    ...values
  );
}

async function main() {
  console.log(`Migration: Turso → ${localPath}`);
  console.log(`Mode:      ${WRITE ? "WRITE (will modify local DB)" : "DRY RUN (counts only)"}`);
  console.log();

  const summary: { table: string; turso: number; local: number; status: string }[] = [];

  for (const table of TABLES) {
    const onTurso = await tableExists(turso, table);
    const onLocal = await tableExists(local, table);

    if (!onTurso) {
      summary.push({ table, turso: -1, local: -1, status: "missing on Turso (skip)" });
      continue;
    }
    if (!onLocal) {
      summary.push({ table, turso: -1, local: -1, status: "missing on local — run push-schema first" });
      continue;
    }

    const tursoCount = await countRows(turso, table);
    const localCountBefore = await countRows(local, table);

    if (!WRITE) {
      summary.push({
        table,
        turso: tursoCount,
        local: localCountBefore,
        status: "would copy",
      });
      continue;
    }

    // Wipe local table, insert from Turso preserving IDs
    await wipeTable(local, table);
    const rows = await dumpTable(turso, table);
    let inserted = 0;
    for (const row of rows) {
      try {
        await insertRow(local, table, row);
        inserted++;
      } catch (err) {
        console.error(`  ERROR inserting row in ${table}:`, err);
        console.error(`  row:`, JSON.stringify(row));
        throw err;
      }
    }
    const localCountAfter = await countRows(local, table);
    summary.push({
      table,
      turso: tursoCount,
      local: localCountAfter,
      status: inserted === tursoCount && localCountAfter === tursoCount ? "OK" : `MISMATCH (inserted=${inserted})`,
    });
  }

  console.log();
  console.log("Summary:");
  console.log("Table".padEnd(28), "Turso".padStart(8), "Local".padStart(8), "Status");
  for (const s of summary) {
    console.log(
      s.table.padEnd(28),
      String(s.turso).padStart(8),
      String(s.local).padStart(8),
      s.status
    );
  }

  if (WRITE) {
    const allOk = summary.every((s) => s.status === "OK" || s.status.startsWith("missing on Turso"));
    if (!allOk) {
      console.error("\nMigration completed with mismatches — investigate above.");
      process.exit(2);
    }
    console.log("\nMigration succeeded ✓");
  } else {
    console.log("\nDry run complete. Re-run with --write to actually copy.");
  }
}

main()
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await turso.$disconnect();
    await local.$disconnect();
  });
