import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/prisma";

export async function getGeminiModel() {
  // Try DB setting first, fall back to env variable
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
  country: string;
  dateOfBirth: string;
  yearsOld: number;
  dateOfIssue: string;
  expiryDate: string;
  passportNumber: string;
  issuedBy: string;
}

export const PASSPORT_PROMPT = `Analyze this passport document image and extract the following information in JSON format.
Return ONLY valid JSON with no markdown formatting, no code blocks, no extra text.

Required fields:
- fullName: Full name as shown on passport
- country: Country that issued the passport
- dateOfBirth: Date of birth (DD/MM/YYYY format)
- yearsOld: Current age in years (calculate from DOB to today)
- dateOfIssue: Date of issue (DD/MM/YYYY format)
- expiryDate: Expiry date (DD/MM/YYYY format)
- passportNumber: Passport number
- issuedBy: Issuing authority

If multiple passports are in the image, return an array of objects.
If a single passport, return an array with one object.

Example response:
[{"fullName":"John Smith","country":"United Kingdom","dateOfBirth":"15/03/1990","yearsOld":36,"dateOfIssue":"01/06/2020","expiryDate":"01/06/2030","passportNumber":"AB1234567","issuedBy":"HMPO"}]`;
