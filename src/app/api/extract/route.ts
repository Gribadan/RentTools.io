import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel, PASSPORT_PROMPT, PassportData } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const reservationId = formData.get("reservationId") as string | null;

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (!reservationId) {
      return NextResponse.json(
        { error: "reservationId is required" },
        { status: 400 }
      );
    }

    const model = await getGeminiModel();
    const allResults: PassportData[] = [];

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
        {
          inlineData: {
            data: base64,
            mimeType,
          },
        },
      ]);

      const responseText = result.response.text().trim();

      let parsed: PassportData[];
      try {
        const cleaned = responseText
          .replace(/^```json?\s*/i, "")
          .replace(/```\s*$/, "")
          .trim();
        parsed = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) {
          parsed = [parsed];
        }
      } catch {
        console.error("Failed to parse Gemini response:", responseText);
        continue;
      }

      allResults.push(...parsed);
    }

    // Save all extracted guests to the database
    const savedGuests = await prisma.guest.createManyAndReturn({
      data: allResults.map((person) => ({
        fullName: person.fullName,
        country: person.country,
        dateOfBirth: person.dateOfBirth,
        yearsOld: person.yearsOld,
        dateOfIssue: person.dateOfIssue,
        expiryDate: person.expiryDate,
        passportNumber: person.passportNumber,
        issuedBy: person.issuedBy,
        reservationId: parseInt(reservationId),
      })),
    });

    return NextResponse.json({ data: savedGuests });
  } catch (error) {
    console.error("Extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract passport data" },
      { status: 500 }
    );
  }
}
