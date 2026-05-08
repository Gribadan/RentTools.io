import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { canManageProperty } from "@/lib/ownership";
import { auditProperty } from "@/lib/property-audit";

/**
 * GET /api/properties/[id]/audit
 *
 * End-to-end correctness audit for a single property. Returns a
 * structured report listing settings, calendar-link health,
 * reservation/synced-event overlaps, override conflicts, and a
 * spot-check of the iCal feed output. The report's `findings` array
 * is the actionable surface — severity drives sort + filter on the
 * UI page.
 *
 * Auth: any user with manage permission on the property (owner /
 * manager / superadmin). Cleaners are not granted access — the
 * audit exposes data beyond what their schedule view shows.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const propertyId = Number(id);
  if (!Number.isFinite(propertyId) || propertyId <= 0) {
    return NextResponse.json({ error: "Invalid property id" }, { status: 400 });
  }

  if (!(await canManageProperty(propertyId, session.userId, session.role))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const report = await auditProperty(propertyId);
    return NextResponse.json(report);
  } catch (err) {
    console.error("Property audit failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
