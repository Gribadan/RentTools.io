import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";
import fs from "node:fs";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Resolve the database connection.
 *
 * Order of precedence:
 *   1. DATABASE_URL=file:./data/prod.db  → local SQLite file (self-hosted)
 *   2. TURSO_DATABASE_URL + TURSO_AUTH_TOKEN  → Turso cloud
 *
 * The same `@prisma/adapter-libsql` works for both — Turso speaks libSQL over
 * HTTPS, and local SQLite is libSQL's native format. This lets us migrate
 * between the two with no code changes, just env vars.
 */
function resolveDbConfig(): { url: string; authToken?: string } {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl?.startsWith("file:")) {
    // file:./data/prod.db → resolve to absolute path; ensure parent dir exists
    const rel = dbUrl.slice("file:".length);
    const abs = path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    return { url: `file:${abs}` };
  }

  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  }

  throw new Error(
    "No database configured. Set DATABASE_URL=file:./data/prod.db (self-hosted) " +
    "or TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (cloud)."
  );
}

function createPrismaClient() {
  const config = resolveDbConfig();
  const adapter = new PrismaLibSql(config);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
