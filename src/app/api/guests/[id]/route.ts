import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripSpaces, sanitizeAlphanumeric } from "@/lib/sanitize";

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
] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
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
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    await prisma.guest.delete({ where: { id: numId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
