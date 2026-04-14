import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

export async function getGeminiModel() {
  let apiKey = process.env.GOOGLE_GEMINI_API_KEY;

  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: "gemini_api_key" },
    });
    if (setting?.value) {
      apiKey = setting.value;
    }
  } catch {
    // DB not available, use env
  }

  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

/**
 * Strip diacritics/accents from a string, converting to basic ASCII Latin.
 * "Genève" → "Geneve", "München" → "Munchen", "café" → "cafe"
 */
export function stripDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Clean all string fields in extracted passport/visa data — strip diacritics.
 */
export function cleanExtractedData<T extends Record<string, unknown>>(data: T): T {
  const cleaned = { ...data };
  for (const key of Object.keys(cleaned)) {
    if (typeof cleaned[key] === "string") {
      (cleaned as Record<string, unknown>)[key] = stripDiacritics(cleaned[key] as string);
    }
  }
  return cleaned;
}

export interface PassportData {
  fullName: string;
  firstName: string;
  lastName: string;
  country: string;
  citizenshipCode: string;
  dateOfBirth: string;
  yearsOld: number;
  gender: string;
  dateOfIssue: string;
  expiryDate: string;
  passportNumber: string;
  issuedBy: string;
}

export interface VisaData {
  passportNumber: string;
  visaNumber: string;
  visaFrom: string;
  visaTo: string;
}

export const PASSPORT_PROMPT = `Analyze this document image. It may be a passport or a visa.

CRITICAL RULES:
1. ALL text output MUST be in basic ASCII Latin letters ONLY (A-Z, 0-9, spaces, slashes). No Cyrillic, no accented characters (è, ü, ñ, ç, etc.). Transliterate Cyrillic to English, strip diacritics from Latin characters. Examples: "МИД РОССИИ" → "MID ROSSII", "ИВАНОВ ПЕТР" → "IVANOV PETR", "Genève" → "Geneve", "München" → "Munchen".
2. Passport numbers MUST have NO spaces. Remove all spaces. Example: "55 1840745" becomes "551840745".
3. Use the English name from the passport (most passports have both native and English names). Always prefer the English/Latin version.
4. Visa numbers must also have no spaces.

If it is a PASSPORT, extract these fields in JSON format:
- type: "passport"
- fullName: Full name in English (Latin letters only, no Cyrillic)
- firstName: First/given name in English only
- lastName: Last/family/surname in English only
- country: Full country name in English
- citizenshipCode: 3-letter ISO country code (e.g. KAZ, RUS, USA, GBR, UZB, TUR, CHN, IND, DEU, FRA)
- dateOfBirth: Date of birth (DD/MM/YYYY)
- yearsOld: Current age in years (calculate from DOB to today April 2026)
- gender: "M" or "F"
- dateOfIssue: Date of issue (DD/MM/YYYY)
- expiryDate: Expiry date (DD/MM/YYYY)
- passportNumber: Full passport number with series, NO SPACES (e.g. "551840745" not "55 1840745")
- issuedBy: Issuing authority in basic ASCII Latin only — no accents, diacritics, or special characters. Replace è→e, ü→u, ñ→n, ç→c, etc. Example: "Genève GE" becomes "Geneve GE", "München" becomes "Munchen", "MID ROSSII 49302"

If it is a VISA, extract these fields in JSON format:
- type: "visa"
- passportNumber: The passport number this visa belongs to (NO SPACES)
- visaNumber: Visa number (NO SPACES)
- visaFrom: Visa valid from date (DD/MM/YYYY)
- visaTo: Visa valid to date (DD/MM/YYYY)

Return ONLY valid JSON with no markdown, no code blocks, no extra text.
If multiple documents in the image, return an array.
Always return an array.

Example passport: [{"type":"passport","fullName":"IVANOV PETR","firstName":"PETR","lastName":"IVANOV","country":"Russia","citizenshipCode":"RUS","dateOfBirth":"15/03/1990","yearsOld":36,"gender":"M","dateOfIssue":"01/06/2020","expiryDate":"01/06/2030","passportNumber":"551840745","issuedBy":"MID ROSSII 49302"}]

Example visa: [{"type":"visa","passportNumber":"551840745","visaNumber":"V12345","visaFrom":"01/01/2026","visaTo":"01/07/2026"}]`;
