import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty, listAccessiblePropertyIds } from "@/lib/ownership";

export const dynamic = "force-dynamic";

interface ParsedRow {
  rowNumber: number;
  propertyId: number;
  name: string;
  platform: string;
  checkIn: Date;
  checkOut: Date;
}

interface ImportResult {
  rowNumber: number;
  status: "created" | "skipped" | "error";
  reason?: string;
  reservationId?: number;
}

const REQUIRED_FIELDS = ["propertyId", "name", "platform", "checkIn", "checkOut"] as const;

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

// Parses one CSV record's worth of cells, handling quoted fields with embedded commas/newlines/quotes.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        cur.push(field);
        field = "";
      } else if (c === "\r") {
        // peek for \n
        if (text[i + 1] === "\n") i++;
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else if (c === "\n") {
        cur.push(field);
        rows.push(cur);
        cur = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  // drop trailing empty row from a trailing newline
  if (rows.length > 0 && rows[rows.length - 1].length === 1 && rows[rows.length - 1][0] === "") {
    rows.pop();
  }
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dryRun = request.nextUrl.searchParams.get("dryRun") === "true";

    const csvText = stripBom(await request.text());
    if (!csvText.trim()) {
      return NextResponse.json({ error: "Empty body" }, { status: 400 });
    }

    const rows = parseCsv(csvText);
    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV needs a header and at least one row" }, { status: 400 });
    }

    const headers = rows[0].map((h) => h.trim());
    const headerIndex: Record<string, number> = {};
    headers.forEach((h, i) => (headerIndex[h] = i));

    for (const f of REQUIRED_FIELDS) {
      if (headerIndex[f] === undefined) {
        return NextResponse.json(
          { error: `Missing required column: ${f}` },
          { status: 400 }
        );
      }
    }

    const accessibleIds = new Set(
      await listAccessiblePropertyIds(session.userId, session.role)
    );

    const results: ImportResult[] = [];
    const validRows: ParsedRow[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const rowNumber = r + 1; // human 1-based, with header as row 1

      const get = (name: string) => (row[headerIndex[name]] ?? "").trim();
      const propertyIdRaw = get("propertyId");
      const name = get("name");
      const platform = get("platform") || "airbnb";
      const checkInRaw = get("checkIn");
      const checkOutRaw = get("checkOut");

      if (!propertyIdRaw || !name || !checkInRaw || !checkOutRaw) {
        results.push({ rowNumber, status: "error", reason: "Missing required field" });
        continue;
      }
      const propertyId = parseInt(propertyIdRaw);
      if (isNaN(propertyId) || !accessibleIds.has(propertyId)) {
        results.push({ rowNumber, status: "error", reason: "Property not accessible to user" });
        continue;
      }
      if (!(await canManageProperty(propertyId, session.userId, session.role))) {
        results.push({ rowNumber, status: "error", reason: "Cannot manage this property" });
        continue;
      }
      const checkIn = new Date(checkInRaw);
      const checkOut = new Date(checkOutRaw);
      if (isNaN(checkIn.getTime())) {
        results.push({ rowNumber, status: "error", reason: "Invalid checkIn date" });
        continue;
      }
      if (isNaN(checkOut.getTime())) {
        results.push({ rowNumber, status: "error", reason: "Invalid checkOut date" });
        continue;
      }
      if (checkOut <= checkIn) {
        results.push({ rowNumber, status: "error", reason: "checkOut must be after checkIn" });
        continue;
      }

      validRows.push({ rowNumber, propertyId, name, platform, checkIn, checkOut });
    }

    // Check overlaps and (if not dry-run) insert.
    for (const v of validRows) {
      const overlap = await prisma.reservation.findFirst({
        where: {
          propertyId: v.propertyId,
          checkIn: { lt: v.checkOut },
          checkOut: { gt: v.checkIn },
        },
        select: { id: true, name: true },
      });
      if (overlap) {
        results.push({
          rowNumber: v.rowNumber,
          status: "skipped",
          reason: `Overlaps existing reservation #${overlap.id} (${overlap.name})`,
        });
        continue;
      }

      if (dryRun) {
        results.push({ rowNumber: v.rowNumber, status: "created", reason: "(dry-run)" });
        continue;
      }

      const created = await prisma.reservation.create({
        data: {
          name: v.name,
          checkIn: v.checkIn,
          checkOut: v.checkOut,
          platform: v.platform,
          propertyId: v.propertyId,
        },
      });
      await logAudit(session.userId, "create", "reservation", created.id, {
        name: created.name,
        propertyId: v.propertyId,
        checkIn: created.checkIn,
        checkOut: created.checkOut,
        source: "csv-import",
      });
      results.push({ rowNumber: v.rowNumber, status: "created", reservationId: created.id });
    }

    results.sort((a, b) => a.rowNumber - b.rowNumber);

    const summary = {
      created: results.filter((r) => r.status === "created").length,
      skipped: results.filter((r) => r.status === "skipped").length,
      error: results.filter((r) => r.status === "error").length,
      dryRun,
    };

    return NextResponse.json({ summary, results });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
