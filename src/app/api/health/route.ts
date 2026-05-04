import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STALE_SYNC_MIN = 120;

interface HealthResponse {
  status: "ok" | "error";
  db: "ok" | "error";
  dbError?: string;
  lastSyncMin: number | null;
  hasCalendarLinks: boolean;
  syncStale?: boolean;
  version: string;
}

function shortSha(): string {
  const sha = process.env.GIT_COMMIT_SHA || "";
  if (!sha) return "dev";
  return sha.slice(0, 7);
}

export async function GET() {
  const version = shortSha();

  let dbOk = false;
  let dbError: string | undefined;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }

  if (!dbOk) {
    const body: HealthResponse = {
      status: "error",
      db: "error",
      dbError,
      lastSyncMin: null,
      hasCalendarLinks: false,
      version,
    };
    return NextResponse.json(body, { status: 503 });
  }

  let lastSyncMin: number | null = null;
  let hasCalendarLinks = false;
  try {
    const totalLinks = await prisma.calendarLink.count();
    hasCalendarLinks = totalLinks > 0;
    if (hasCalendarLinks) {
      const link = await prisma.calendarLink.findFirst({
        where: { lastFetchedAt: { not: null } },
        orderBy: { lastFetchedAt: "desc" },
        select: { lastFetchedAt: true },
      });
      if (link?.lastFetchedAt) {
        lastSyncMin = Math.max(0, Math.floor((Date.now() - link.lastFetchedAt.getTime()) / 60000));
      }
    }
  } catch (err) {
    const body: HealthResponse = {
      status: "error",
      db: "error",
      dbError: err instanceof Error ? err.message : String(err),
      lastSyncMin: null,
      hasCalendarLinks: false,
      version,
    };
    return NextResponse.json(body, { status: 503 });
  }

  const syncStale = hasCalendarLinks && (lastSyncMin === null || lastSyncMin > STALE_SYNC_MIN);

  if (syncStale) {
    const body: HealthResponse = {
      status: "error",
      db: "ok",
      lastSyncMin,
      hasCalendarLinks,
      syncStale: true,
      version,
    };
    return NextResponse.json(body, { status: 503 });
  }

  const body: HealthResponse = {
    status: "ok",
    db: "ok",
    lastSyncMin,
    hasCalendarLinks,
    version,
  };
  return NextResponse.json(body);
}
