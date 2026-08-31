export const PRECHECKIN_STATUSES = [
  "NOT_INVITED",
  "INVITED",
  "IN_PROGRESS",
  "COMPLETE",
  "OWNER_REVIEW_REQUIRED",
  "OWNER_APPROVED",
  "REVOKED",
] as const;

export type PrecheckinStatus = (typeof PRECHECKIN_STATUSES)[number];

export const DOCUMENT_TYPES = ["PASSPORT", "IDENTITY_CARD", "OTHER"] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const GENDERS = ["M", "F", "X", "UNSPECIFIED"] as const;
export type TravelerGender = (typeof GENDERS)[number];

export const ARRIVAL_ORGANIZATIONS = [
  "INDIVIDUAL",
  "TRAVEL_AGENCY",
  "TOUR_OPERATOR",
  "OTHER",
] as const;

export const SERVICE_TYPES = ["ACCOMMODATION", "OTHER"] as const;

// ISO 3166-1 alpha-2. Keeping the accepted values in code makes the public
// endpoint fail closed instead of accepting arbitrary country text that later
// cannot be mapped to eVisitor.
const ISO_COUNTRY_CODES = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`;

export const COUNTRY_CODES = ISO_COUNTRY_CODES.split(" ");
const COUNTRY_CODE_SET = new Set(COUNTRY_CODES);

const EU_COUNTRY_CODES = new Set(
  "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" "),
);

export interface PrecheckinTraveler {
  /** Server-issued stable ID. It is added only at final submission and is
   * never accepted from the public draft as an authority value. */
  guestId?: string;
  clientId: string;
  isLead: boolean;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: TravelerGender;
  citizenshipCountry: string;
  birthCountry: string;
  birthPlace: string;
  residenceCountry: string;
  residencePlace: string;
  residenceAddress: string;
  documentType: DocumentType;
  documentNumber: string;
  borderEntryDate?: string;
  borderEntryPlace?: string;
  borderEntryPoint?: string;
  taxCategorySuggestion?: "EXEMPT_UNDER_12" | "REDUCED_12_TO_17" | "STANDARD_ADULT";
}

export interface PrecheckinPayload {
  version: 1;
  expectedArrivalDate: string;
  expectedDepartureDate: string;
  expectedArrivalTime: string;
  arrivalOrganization: (typeof ARRIVAL_ORGANIZATIONS)[number];
  serviceType: (typeof SERVICE_TYPES)[number];
  travelers: PrecheckinTraveler[];
  customAnswers: Array<{
    fieldId: string;
    type: string;
    label: string;
    value: unknown;
  }>;
}

export interface PrecheckinDraft {
  expectedArrivalTime: string;
  arrivalOrganization: string;
  serviceType: string;
  travelers: Array<Record<string, unknown>>;
  customAnswers: Array<{ fieldId: string; value: unknown }>;
}

export interface PrecheckinValidationOptions {
  checkIn: string;
  checkOut: string;
  maxTravelers?: number | null;
}

export interface PrecheckinValidationResult {
  ok: boolean;
  errors: string[];
  payload?: PrecheckinPayload;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function ageOnDate(dateOfBirth: string, referenceDate: string): number | null {
  if (!isIsoDate(dateOfBirth) || !isIsoDate(referenceDate)) return null;
  const birth = new Date(`${dateOfBirth}T00:00:00Z`);
  const reference = new Date(`${referenceDate}T00:00:00Z`);
  let age = reference.getUTCFullYear() - birth.getUTCFullYear();
  const monthDelta = reference.getUTCMonth() - birth.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && reference.getUTCDate() < birth.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export function suggestTaxCategory(
  dateOfBirth: string,
  referenceDate: string,
): PrecheckinTraveler["taxCategorySuggestion"] | null {
  const age = ageOnDate(dateOfBirth, referenceDate);
  if (age === null || age < 0) return null;
  if (age < 12) return "EXEMPT_UNDER_12";
  if (age < 18) return "REDUCED_12_TO_17";
  return "STANDARD_ADULT";
}

export function requiresNonEuBorderFields(residenceCountry: string): boolean {
  // eVisitor's CheckInTourist validation keys this requirement to the
  // tourist's country of residence, not citizenship.
  return COUNTRY_CODE_SET.has(residenceCountry) && !EU_COUNTRY_CODES.has(residenceCountry);
}

function normalizeTraveler(raw: unknown, checkIn: string): PrecheckinTraveler | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const string = (key: string) => (typeof input[key] === "string" ? input[key].trim() : "");
  const citizenshipCountry = string("citizenshipCountry").toUpperCase();
  const residenceCountry = string("residenceCountry").toUpperCase();
  const traveler: PrecheckinTraveler = {
    clientId: string("clientId").slice(0, 80),
    isLead: input.isLead === true,
    firstName: string("firstName").slice(0, 120),
    lastName: string("lastName").slice(0, 120),
    dateOfBirth: string("dateOfBirth"),
    gender: string("gender") as TravelerGender,
    citizenshipCountry,
    birthCountry: string("birthCountry").toUpperCase(),
    birthPlace: string("birthPlace").slice(0, 160),
    residenceCountry,
    residencePlace: string("residencePlace").slice(0, 160),
    residenceAddress: string("residenceAddress").slice(0, 240),
    documentType: string("documentType") as DocumentType,
    documentNumber: string("documentNumber").replace(/\s+/g, "").slice(0, 80),
    taxCategorySuggestion: suggestTaxCategory(string("dateOfBirth"), checkIn) ?? undefined,
  };
  if (requiresNonEuBorderFields(residenceCountry)) {
    traveler.borderEntryDate = string("borderEntryDate");
    traveler.borderEntryPlace = string("borderEntryPlace").slice(0, 160);
    traveler.borderEntryPoint = string("borderEntryPoint").slice(0, 160);
  }
  return traveler;
}

/**
 * Bound and normalise an unfinished browser draft before encrypting it. This is
 * deliberately less strict than final validation, but it never stores unknown
 * top-level objects or an unbounded request body.
 */
export function sanitizePrecheckinDraft(raw: unknown): PrecheckinDraft {
  if (!raw || typeof raw !== "object") {
    return { expectedArrivalTime: "", arrivalOrganization: "", serviceType: "", travelers: [], customAnswers: [] };
  }
  const input = raw as Record<string, unknown>;
  const travelers = Array.isArray(input.travelers)
    ? input.travelers.slice(0, 50).map((entry) => {
        const traveler = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
        const keep = [
          "clientId", "isLead", "firstName", "lastName", "dateOfBirth", "gender",
          "citizenshipCountry", "birthCountry", "birthPlace", "residenceCountry",
          "residencePlace", "residenceAddress", "documentType", "documentNumber",
          "borderEntryDate", "borderEntryPlace", "borderEntryPoint",
        ];
        return Object.fromEntries(keep.map((key) => {
          const value = traveler[key];
          return [key, typeof value === "string" ? value.slice(0, 240) : value === true];
        }));
      })
    : [];
  const customAnswers = Array.isArray(input.customAnswers)
    ? input.customAnswers.slice(0, 100).flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const answer = entry as Record<string, unknown>;
        if (typeof answer.fieldId !== "string") return [];
        let value = answer.value;
        if (typeof value === "string") value = value.slice(0, 4000);
        else if (Array.isArray(value)) value = value.slice(0, 50).map((item) => String(item).slice(0, 500));
        else if (typeof value !== "number" && typeof value !== "boolean" && value !== null) value = null;
        return [{ fieldId: answer.fieldId.slice(0, 100), value }];
      })
    : [];
  return {
    expectedArrivalTime: typeof input.expectedArrivalTime === "string" ? input.expectedArrivalTime.slice(0, 5) : "",
    arrivalOrganization: typeof input.arrivalOrganization === "string" ? input.arrivalOrganization.slice(0, 40) : "",
    serviceType: typeof input.serviceType === "string" ? input.serviceType.slice(0, 40) : "",
    travelers,
    customAnswers,
  };
}

export function validatePrecheckinPayload(
  raw: unknown,
  options: PrecheckinValidationOptions,
): PrecheckinValidationResult {
  const errors: string[] = [];
  if (!raw || typeof raw !== "object") return { ok: false, errors: ["Invalid payload"] };
  const input = raw as Record<string, unknown>;
  const rawTravelers = Array.isArray(input.travelers) ? input.travelers : [];
  if (rawTravelers.length === 0) errors.push("At least one traveler is required");
  if (options.maxTravelers && rawTravelers.length > options.maxTravelers) {
    errors.push(`Traveler count exceeds reservation limit (${options.maxTravelers})`);
  }
  if (rawTravelers.length > 50) errors.push("Traveler count exceeds safety limit");

  const travelers = rawTravelers
    .map((traveler) => normalizeTraveler(traveler, options.checkIn))
    .filter((traveler): traveler is PrecheckinTraveler => traveler !== null);
  if (travelers.length !== rawTravelers.length) errors.push("Invalid traveler entry");
  if (travelers.filter((traveler) => traveler.isLead).length !== 1) {
    errors.push("Exactly one lead traveler is required");
  }

  const duplicateKeys = new Set<string>();
  for (const [index, traveler] of travelers.entries()) {
    const prefix = `Traveler ${index + 1}`;
    if (!traveler.clientId) errors.push(`${prefix}: missing client id`);
    if (!traveler.firstName) errors.push(`${prefix}: first name is required`);
    if (!traveler.lastName) errors.push(`${prefix}: last name is required`);
    if (!isIsoDate(traveler.dateOfBirth) || traveler.dateOfBirth >= options.checkIn) {
      errors.push(`${prefix}: invalid date of birth`);
    }
    if (!GENDERS.includes(traveler.gender)) errors.push(`${prefix}: invalid gender`);
    for (const [label, code] of [
      ["citizenship", traveler.citizenshipCountry],
      ["birth country", traveler.birthCountry],
      ["residence country", traveler.residenceCountry],
    ] as const) {
      if (!COUNTRY_CODE_SET.has(code)) errors.push(`${prefix}: invalid ${label}`);
    }
    if (!traveler.birthPlace) errors.push(`${prefix}: birth place is required`);
    if (!traveler.residencePlace) errors.push(`${prefix}: residence place is required`);
    if (!traveler.residenceAddress) errors.push(`${prefix}: residence address is required`);
    if (!DOCUMENT_TYPES.includes(traveler.documentType)) errors.push(`${prefix}: invalid document type`);
    if (traveler.documentNumber.length < 2) errors.push(`${prefix}: document number is required`);

    if (requiresNonEuBorderFields(traveler.residenceCountry)) {
      if (traveler.borderEntryDate && !isIsoDate(traveler.borderEntryDate)) {
        errors.push(`${prefix}: invalid border entry date`);
      }
    }

    const duplicateKey = `${traveler.firstName.toLowerCase()}|${traveler.lastName.toLowerCase()}|${traveler.dateOfBirth}|${traveler.documentNumber.toLowerCase()}`;
    if (duplicateKeys.has(duplicateKey)) errors.push(`${prefix}: duplicate traveler`);
    duplicateKeys.add(duplicateKey);
  }

  const expectedArrivalTime = typeof input.expectedArrivalTime === "string"
    ? input.expectedArrivalTime.trim()
    : "";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(expectedArrivalTime)) {
    errors.push("Expected arrival time is required");
  }
  const arrivalOrganization = typeof input.arrivalOrganization === "string"
    ? input.arrivalOrganization
    : "";
  if (!ARRIVAL_ORGANIZATIONS.includes(arrivalOrganization as never)) {
    errors.push("Invalid arrival organization");
  }
  const serviceType = typeof input.serviceType === "string" ? input.serviceType : "";
  if (!SERVICE_TYPES.includes(serviceType as never)) errors.push("Invalid service type");

  const customAnswers = Array.isArray(input.customAnswers)
    ? input.customAnswers.filter((answer): answer is PrecheckinPayload["customAnswers"][number] =>
        !!answer && typeof answer === "object" && typeof (answer as { fieldId?: unknown }).fieldId === "string",
      )
    : [];

  if (errors.length > 0) return { ok: false, errors };
  return {
    ok: true,
    errors: [],
    payload: {
      version: 1,
      expectedArrivalDate: options.checkIn,
      expectedDepartureDate: options.checkOut,
      expectedArrivalTime,
      arrivalOrganization: arrivalOrganization as PrecheckinPayload["arrivalOrganization"],
      serviceType: serviceType as PrecheckinPayload["serviceType"],
      travelers,
      customAnswers,
    },
  };
}

export function precheckinWarnings(payload: PrecheckinPayload): string[] {
  const warnings: string[] = [];
  for (const traveler of payload.travelers) {
    if (requiresNonEuBorderFields(traveler.residenceCountry)) {
      if (!traveler.borderEntryDate || !traveler.borderEntryPlace || !traveler.borderEntryPoint) {
        warnings.push(`${traveler.firstName} ${traveler.lastName}: non-EU border data incomplete`);
      }
    }
  }
  return warnings;
}
