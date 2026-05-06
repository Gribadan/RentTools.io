import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripSpaces, sanitizeAlphanumeric, normalizePhone } from "@/lib/sanitize";
import { getSession } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { canManageProperty } from "@/lib/ownership";

const ALLOWED_STRING_FIELDS = [
  "fullName",
  "firstName",
  "lastName",
  "country",
  "citizenshipCode",
  "dateOfBirth",
  "gender",
  "dateOfIssue",
  "expiryDate",
  "passportNumber",
  "issuedBy",
  "visaNumber",
  "visaFrom",
  "visaTo",
  // RT-25.12 — per-guest free-text notes; preserves whitespace and
  // newlines so a paragraph from the host's clipboard round-trips.
  "notes",
] as const;

async function loadManageableGuest(guestId: number, userId: number, role: string) {
  const guest = await prisma.guest.findUnique({
    where: { id: guestId },
    select: {
      id: true,
      reservation: { select: { propertyId: true } },
    },
  });
  if (!guest) return null;
  if (!(await canManageProperty(guest.reservation.propertyId, userId, role))) return null;
  return guest;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const owned = await loadManageableGuest(numId, session.userId, session.role);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if ("parentId" in body) data.parentId = body.parentId;

    for (const key of ALLOWED_STRING_FIELDS) {
      if (key in body && typeof body[key] === "string") {
        let value = body[key] as string;
        if (key === "passportNumber") value = stripSpaces(value);
        else if (key === "issuedBy") value = sanitizeAlphanumeric(value);
        data[key] = value;
      }
    }

    // RT-25.13 — phone is sanitised separately so we can return a 400 on
    // malformed input rather than silently storing garbage.
    if ("phone" in body && typeof body.phone === "string") {
      try {
        data.phone = normalizePhone(body.phone);
      } catch {
        return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
      }
    }

    if ("yearsOld" in body && typeof body.yearsOld === "number") {
      data.yearsOld = body.yearsOld;
    }
    if ("hasVisa" in body && typeof body.hasVisa === "boolean") {
      data.hasVisa = body.hasVisa;
    }

    const guest = await prisma.guest.update({
      where: { id: numId },
      data,
    });
    await logAudit(session.userId, "update", "guest", numId, data);
    return NextResponse.json(guest);
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const owned = await loadManageableGuest(numId, session.userId, session.role);
    if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.guest.delete({ where: { id: numId } });
    await logAudit(session.userId, "delete", "guest", numId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
