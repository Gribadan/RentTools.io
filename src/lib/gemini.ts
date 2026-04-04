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

If it is a PASSPORT, extract these fields in JSON format:
- type: "passport"
- fullName: Full name as on passport
- firstName: First/given name only
- lastName: Last/family/surname only
- country: Full country name that issued passport
- citizenshipCode: 3-letter ISO country code (e.g. KAZ, RUS, USA, GBR, UZB, TUR, CHN, IND, DEU, FRA)
- dateOfBirth: Date of birth (DD/MM/YYYY)
- yearsOld: Current age in years (calculate from DOB to today April 2026)
- gender: "M" or "F"
- dateOfIssue: Date of issue (DD/MM/YYYY)
- expiryDate: Expiry date (DD/MM/YYYY)
- passportNumber: Full passport number including series
- issuedBy: Issuing authority

If it is a VISA, extract these fields in JSON format:
- type: "visa"
- passportNumber: The passport number this visa belongs to
- visaNumber: Visa number
- visaFrom: Visa valid from date (DD/MM/YYYY)
- visaTo: Visa valid to date (DD/MM/YYYY)

Return ONLY valid JSON with no markdown, no code blocks, no extra text.
If multiple documents in the image, return an array.
Always return an array.

Example passport: [{"type":"passport","fullName":"Smith John","firstName":"John","lastName":"Smith","country":"United Kingdom","citizenshipCode":"GBR","dateOfBirth":"15/03/1990","yearsOld":36,"gender":"M","dateOfIssue":"01/06/2020","expiryDate":"01/06/2030","passportNumber":"AB1234567","issuedBy":"HMPO"}]

Example visa: [{"type":"visa","passportNumber":"AB1234567","visaNumber":"V12345","visaFrom":"01/01/2026","visaTo":"01/07/2026"}]`;
