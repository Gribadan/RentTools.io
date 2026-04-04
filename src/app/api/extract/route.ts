import { NextRequest, NextResponse } from "next/server";
import { getGeminiModel, PASSPORT_PROMPT } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

const CYRILLIC_MAP: Record<string, string> = {
  "А":"A","Б":"B","В":"V","Г":"G","Д":"D","Е":"E","Ё":"YO","Ж":"ZH",
  "З":"Z","И":"I","Й":"Y","К":"K","Л":"L","М":"M","Н":"N","О":"O",
  "П":"P","Р":"R","С":"S","Т":"T","У":"U","Ф":"F","Х":"KH","Ц":"TS",
  "Ч":"CH","Ш":"SH","Щ":"SHCH","Ъ":"","Ы":"Y","Ь":"","Э":"E","Ю":"YU","Я":"YA",
  "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh",
  "з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o",
  "п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts",
  "ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya",
};

function transliterate(text: string): string {
  return text.split("").map((ch) => CYRILLIC_MAP[ch] ?? ch).join("");
}

function sanitizeText(text: string): string {
  return transliterate(text).trim();
}

function stripSpaces(text: string): string {
  return transliterate(text).replace(/\s+/g, "").trim();
}

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
              issuedBy: sanitizeText(item.issuedBy || ""),
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
