import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel, PASSPORT_PROMPT } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

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
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const reservationId = formData.get("reservationId") as string | null;

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (!reservationId) {
      return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
    }

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
          // Find existing guest by passport number and update visa info
          if (item.passportNumber) {
            const guest = await prisma.guest.findFirst({
              where: {
                reservationId: resId,
                passportNumber: item.passportNumber,
              },
            });
            if (guest) {
              const updated = await prisma.guest.update({
                where: { id: guest.id },
                data: {
                  hasVisa: true,
                  visaNumber: item.visaNumber || "",
                  visaFrom: item.visaFrom || "",
                  visaTo: item.visaTo || "",
                },
              });
              savedItems.push({ ...updated, _action: "visa_updated" });
            } else {
              savedItems.push({
                _action: "visa_no_match",
                passportNumber: item.passportNumber,
              });
            }
          }
        } else {
          // Passport - create guest
          const guest = await prisma.guest.create({
            data: {
              fullName: item.fullName || "",
              firstName: item.firstName || "",
              lastName: item.lastName || "",
              country: item.country || "",
              citizenshipCode: item.citizenshipCode || "",
              dateOfBirth: item.dateOfBirth || "",
              yearsOld: item.yearsOld || 0,
              gender: item.gender || "",
              dateOfIssue: item.dateOfIssue || "",
              expiryDate: item.expiryDate || "",
              passportNumber: item.passportNumber || "",
              issuedBy: item.issuedBy || "",
              reservationId: resId,
            },
          });
          savedItems.push(guest);
        }
      }
    }

    return NextResponse.json({ data: savedItems });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract passport data" },
      { status: 500 }
    );
  }
}
