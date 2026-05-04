import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel, PASSPORT_PROMPT } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getSetting } from "@/lib/site-settings";
import {
  sanitizeText,
  sanitizeAlphanumeric,
  stripSpaces,
} from "@/lib/sanitize";

interface ExtractedItem {
  type: "passport" | "visa";
  // passport fields
  fullName?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  citizenshipCode?: string;
  dateOfBirth?: string;
  yearsOld?: number;
  gender?: string;
  dateOfIssue?: string;
  expiryDate?: string;
  passportNumber?: string;
  issuedBy?: string;
  // visa fields
  visaNumber?: string;
  visaFrom?: string;
  visaTo?: string;
}

export async function POST(request: NextRequest) {
  // Pulled out so the catch block can still write a failure log row.
  let userId: number | null = null;
  let fileCount = 0;
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = session.userId;

    // Daily per-user quota — count successful + failed attempts in the last 24h
    // and reject before doing any Gemini work if the user is at or above the
    // configured limit. "0" or non-numeric disables the gate.
    const limitRaw = await getSetting("extraction_per_user_daily_limit", "20");
    const limit = Number(limitRaw);
    if (Number.isFinite(limit) && limit > 0) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentCount = await prisma.extractionLog.count({
        where: { userId, createdAt: { gte: since } },
      });
      if (recentCount >= limit) {
        return NextResponse.json(
          {
            error: "Daily limit reached, try again tomorrow",
            limit,
            usedInLast24h: recentCount,
          },
          { status: 429 }
        );
      }
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const reservationId = formData.get("reservationId") as string | null;

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (!reservationId) {
      return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
    }

    fileCount = files.length;
    const model = await getGeminiModel();
    const resId = parseInt(reservationId);
    const savedItems: unknown[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString("base64");

      let mimeType = file.type;
      if (!mimeType || mimeType === "application/octet-stream") {
        if (file.name.endsWith(".pdf")) mimeType = "application/pdf";
        else if (file.name.endsWith(".png")) mimeType = "image/png";
        else mimeType = "image/jpeg";
      }

      const result = await model.generateContent([
        PASSPORT_PROMPT,
        { inlineData: { data: base64, mimeType } },
      ]);

      const responseText = result.response.text().trim();

      let parsed: ExtractedItem[];
      try {
        const cleaned = responseText
          .replace(/^```json?\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) parsed = [parsed];
      } catch {
        console.error("Failed to parse Gemini response:", responseText);
        continue;
      }

      for (const item of parsed) {
        if (item.type === "visa") {
          const ppNum = stripSpaces(item.passportNumber || "");
          if (ppNum) {
            const guest = await prisma.guest.findFirst({
              where: { reservationId: resId, passportNumber: ppNum },
            });
            if (guest) {
              const updated = await prisma.guest.update({
                where: { id: guest.id },
                data: {
                  hasVisa: true,
                  visaNumber: stripSpaces(item.visaNumber || ""),
                  visaFrom: (item.visaFrom || "").trim(),
                  visaTo: (item.visaTo || "").trim(),
                },
              });
              savedItems.push({ ...updated, _action: "visa_updated" });
            } else {
              savedItems.push({ _action: "visa_no_match", passportNumber: ppNum });
            }
          }
        } else {
          const guest = await prisma.guest.create({
            data: {
              fullName: sanitizeText(item.fullName || ""),
              firstName: sanitizeText(item.firstName || ""),
              lastName: sanitizeText(item.lastName || ""),
              country: sanitizeText(item.country || ""),
              citizenshipCode: stripSpaces(item.citizenshipCode || "").toUpperCase(),
              dateOfBirth: (item.dateOfBirth || "").trim(),
              yearsOld: item.yearsOld || 0,
              gender: (item.gender || "").trim().toUpperCase(),
              dateOfIssue: (item.dateOfIssue || "").trim(),
              expiryDate: (item.expiryDate || "").trim(),
              passportNumber: stripSpaces(item.passportNumber || ""),
              issuedBy: sanitizeAlphanumeric(item.issuedBy || ""),
              reservationId: resId,
            },
          });
          savedItems.push(guest);
        }
      }
    }

    // Successful run — log it so the next request counts it against the quota.
    await prisma.extractionLog.create({
      data: { userId, fileCount, success: true },
    });

    return NextResponse.json({ data: savedItems });
  } catch (error) {
    console.error("Extraction error:", error);
    if (userId !== null) {
      await prisma.extractionLog
        .create({ data: { userId, fileCount, success: false } })
        .catch(() => {});
    }
    return NextResponse.json(
      { error: "Failed to extract passport data" },
      { status: 500 }
    );
  }
}
