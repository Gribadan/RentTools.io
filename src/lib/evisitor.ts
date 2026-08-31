import { createHash } from "node:crypto";
import type { PrecheckinPayload, PrecheckinTraveler } from "@/lib/precheckin";

export const EVISITOR_OWNER_APPROVAL = "OWNER_APPROVED_SUBMIT" as const;
export type EVisitorOwnerApproval = typeof EVISITOR_OWNER_APPROVAL;

const TEST_API_ROOT = "https://www.evisitor.hr/testApi";

export interface EVisitorResolvedTravelerCodes {
  guestId: string;
  citizenshipAlpha3: string;
  countryOfBirthAlpha3: string;
  countryOfResidenceAlpha3: string;
  documentTypeCode: string;
  genderValue: string;
  taxPaymentCategoryCode: string;
  /** Official eVisitor settlement label for Croatian places, or the verified
   * free-text foreign city accepted by eVisitor. */
  cityOfBirth: string;
  cityOfResidence: string;
  /** Official border-crossing code. Required for non-EU residents. */
  borderCrossingCode?: string;
}

export interface EVisitorCheckInContext {
  registrationId: string;
  facilityCode: string;
  accommodationUnitType?: string;
  arrivalOrganisationCode: string;
  touristAgencyVat?: string;
  offeredServiceType: string;
  expectedDepartureTime: string;
  codes: EVisitorResolvedTravelerCodes;
}

export interface EVisitorCheckInPayload {
  ID: string;
  Facility: string;
  AccommodationUnitType?: string;
  ArrivalOrganisation: string;
  TouristAgency?: string;
  Citizenship: string;
  CityOfBirth: string;
  CityOfResidence: string;
  CountryOfBirth: string;
  CountryOfResidence: string;
  DateOfBirth: string;
  DocumentNumber: string;
  DocumentType: string;
  ForeseenStayUntil: string;
  Gender: string;
  OfferedServiceType: string;
  ResidenceAddress?: string;
  StayFrom: string;
  TimeEstimatedStayUntil: string;
  TimeStayFrom: string;
  TouristName: string;
  TouristSurname: string;
  TTPaymentCategory: string;
  BorderCrossing?: string;
  PassageDate?: string;
}

export interface EVisitorCheckOutPayload {
  ID: string;
  CheckOutDate: string;
  CheckOutTime: string;
}

export interface EVisitorCancelPayload {
  ID: string;
  Reason: string;
}

export interface EVisitorTouristReadback {
  ID: string;
  FacilityID?: string;
  CheckedOutTourist?: boolean;
  StayFrom?: string;
  ForeseenStayUntil?: string;
  DateTimeOfArrival?: string;
  DateTimeOfDeparture?: string;
  [key: string]: unknown;
}

function required(value: string | undefined, label: string): string {
  const normalized = value?.trim();
  if (!normalized) throw new Error(`Missing verified eVisitor value: ${label}`);
  return normalized;
}

function compactDate(value: string, label: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`Invalid ${label}`);
  return value.replaceAll("-", "");
}

function assertTime(value: string, label: string): string {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) throw new Error(`Invalid ${label}`);
  return value;
}

function assertGuid(value: string, label: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

function isNonEuResident(country: string): boolean {
  const eu = new Set(
    "AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE".split(" "),
  );
  return !eu.has(country);
}

/**
 * Map one owner-reviewed traveler to the exact CheckInTourist action shape.
 * No lookup value is guessed: every official code/value comes from the
 * owner-reviewed context populated from eVisitor lookups.
 */
export function buildEVisitorCheckIn(
  precheckin: PrecheckinPayload,
  traveler: PrecheckinTraveler,
  context: EVisitorCheckInContext,
): EVisitorCheckInPayload {
  const guestId = required(traveler.guestId, "internal guest ID");
  if (guestId !== context.codes.guestId) throw new Error("Traveler/code mapping mismatch");
  if (precheckin.arrivalOrganization === "TRAVEL_AGENCY" && !context.touristAgencyVat?.trim()) {
    throw new Error("Missing verified eVisitor value: tourist agency VAT");
  }

  const result: EVisitorCheckInPayload = {
    ID: assertGuid(context.registrationId, "eVisitor registration GUID"),
    Facility: required(context.facilityCode, "facility code"),
    ArrivalOrganisation: required(context.arrivalOrganisationCode, "arrival organisation code"),
    Citizenship: required(context.codes.citizenshipAlpha3, "citizenship ISO alpha-3").toUpperCase(),
    CityOfBirth: required(context.codes.cityOfBirth, "city of birth"),
    CityOfResidence: required(context.codes.cityOfResidence, "city of residence"),
    CountryOfBirth: required(context.codes.countryOfBirthAlpha3, "birth country ISO alpha-3").toUpperCase(),
    CountryOfResidence: required(context.codes.countryOfResidenceAlpha3, "residence country ISO alpha-3").toUpperCase(),
    DateOfBirth: compactDate(traveler.dateOfBirth, "date of birth"),
    DocumentNumber: required(traveler.documentNumber, "document number"),
    DocumentType: required(context.codes.documentTypeCode, "document type code"),
    ForeseenStayUntil: compactDate(precheckin.expectedDepartureDate, "expected departure date"),
    Gender: required(context.codes.genderValue, "gender value"),
    OfferedServiceType: required(context.offeredServiceType, "offered service type"),
    ResidenceAddress: traveler.residenceAddress || undefined,
    StayFrom: compactDate(precheckin.expectedArrivalDate, "arrival date"),
    TimeEstimatedStayUntil: assertTime(context.expectedDepartureTime, "expected departure time"),
    TimeStayFrom: assertTime(precheckin.expectedArrivalTime, "arrival time"),
    TouristName: required(traveler.firstName, "first name"),
    TouristSurname: required(traveler.lastName, "last name"),
    TTPaymentCategory: required(context.codes.taxPaymentCategoryCode, "tax payment category code"),
  };

  if (context.accommodationUnitType?.trim()) result.AccommodationUnitType = context.accommodationUnitType.trim();
  if (context.touristAgencyVat?.trim()) result.TouristAgency = context.touristAgencyVat.trim();

  if (isNonEuResident(traveler.residenceCountry)) {
    result.BorderCrossing = required(context.codes.borderCrossingCode, "border crossing code");
    result.PassageDate = compactDate(required(traveler.borderEntryDate, "border entry date"), "border entry date");
  }
  return result;
}

export function buildEVisitorCheckOut(
  registrationId: string,
  checkOutDate: string,
  checkOutTime: string,
): EVisitorCheckOutPayload {
  return {
    ID: assertGuid(registrationId, "eVisitor registration GUID"),
    CheckOutDate: compactDate(checkOutDate, "checkout date"),
    CheckOutTime: assertTime(checkOutTime, "checkout time"),
  };
}

export function buildEVisitorCancel(registrationId: string, reason: string): EVisitorCancelPayload {
  return {
    ID: assertGuid(registrationId, "eVisitor registration GUID"),
    Reason: required(reason, "cancellation reason"),
  };
}

export function hashEVisitorRequest(payload: object): string {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

export interface EVisitorTestCredentials {
  username: string;
  password: string;
  apiKey: string;
}

type FetchLike = typeof fetch;

/**
 * Official eVisitor transport restricted to the isolated test environment.
 * Production is intentionally unsupported until the synthetic E2E and Owner
 * gates have passed. Credentials are injected by the caller from a secret
 * manager and are never logged or retained here.
 */
export class EVisitorTestClient {
  private cookieHeader = "";

  constructor(
    private readonly credentials: EVisitorTestCredentials,
    private readonly request: FetchLike = fetch,
  ) {}

  async login(): Promise<void> {
    const response = await this.request(
      `${TEST_API_ROOT}/Resources/AspNetFormsAuth/Authentication/Login`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          UserName: required(this.credentials.username, "test username"),
          Password: required(this.credentials.password, "test password"),
          apikey: required(this.credentials.apiKey, "test API key"),
          PersistCookie: false,
        }),
        cache: "no-store",
      },
    );
    const body = await response.text();
    if (!response.ok || body.trim() !== "true") throw new Error("eVisitor test login failed");
    const headers = response.headers as Headers & { getSetCookie?: () => string[] };
    const setCookies = headers.getSetCookie?.() ?? [];
    if (setCookies.length === 0) throw new Error("eVisitor test login returned no cookies");
    this.cookieHeader = setCookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
  }

  async logout(): Promise<void> {
    if (!this.cookieHeader) return;
    await this.request(`${TEST_API_ROOT}/Resources/AspNetFormsAuth/Authentication/Logout`, {
      method: "POST",
      headers: { cookie: this.cookieHeader },
      cache: "no-store",
    });
    this.cookieHeader = "";
  }

  async checkIn(
    payload: EVisitorCheckInPayload,
    approval: EVisitorOwnerApproval,
  ): Promise<EVisitorTouristReadback> {
    this.assertOwnerApproval(approval);
    await this.action("CheckInTourist", payload);
    return this.requireReadback(payload.ID);
  }

  async updateActiveCheckIn(
    payload: EVisitorCheckInPayload,
    approval: EVisitorOwnerApproval,
  ): Promise<EVisitorTouristReadback> {
    this.assertOwnerApproval(approval);
    await this.action("CheckInTourist", payload);
    return this.requireReadback(payload.ID);
  }

  async checkOut(
    payload: EVisitorCheckOutPayload,
    approval: EVisitorOwnerApproval,
  ): Promise<EVisitorTouristReadback> {
    this.assertOwnerApproval(approval);
    await this.action("CheckOutTourist", payload);
    const readback = await this.requireReadback(payload.ID);
    if (readback.CheckedOutTourist !== true) throw new Error("eVisitor checkout readback mismatch");
    return readback;
  }

  async cancelCheckIn(payload: EVisitorCancelPayload, approval: EVisitorOwnerApproval): Promise<void> {
    this.assertOwnerApproval(approval);
    await this.action("CancelTouristCheckIn", payload);
    const readback = await this.listTouristsExtended(payload.ID);
    if (readback.length !== 0) throw new Error("eVisitor cancellation readback mismatch");
  }

  async listTouristsExtended(id: string): Promise<EVisitorTouristReadback[]> {
    this.assertAuthenticated();
    const filters = encodeURIComponent(JSON.stringify([
      { Property: "ID", Operation: "equal", Value: assertGuid(id, "eVisitor registration GUID") },
    ]));
    const response = await this.request(
      `${TEST_API_ROOT}/Rest/Htz/ListOfTouristsExtended/?psize=5&page=1&filters=${filters}`,
      { method: "GET", headers: { cookie: this.cookieHeader }, cache: "no-store" },
    );
    if (!response.ok) throw new Error(`eVisitor test readback failed (${response.status})`);
    const parsed = await response.json() as { Records?: EVisitorTouristReadback[] };
    return Array.isArray(parsed.Records) ? parsed.Records : [];
  }

  private async requireReadback(id: string): Promise<EVisitorTouristReadback> {
    const records = await this.listTouristsExtended(id);
    const exact = records.filter((record) => record.ID.toLowerCase() === id.toLowerCase());
    if (exact.length !== 1) throw new Error("eVisitor readback did not confirm exactly one tourist");
    return exact[0];
  }

  private async action(name: string, payload: object): Promise<void> {
    this.assertAuthenticated();
    const response = await this.request(`${TEST_API_ROOT}/Rest/Htz/${name}/`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: this.cookieHeader },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`eVisitor test action failed (${response.status})`);
    const body = await response.text();
    if (body.trim()) throw new Error("eVisitor test action returned an unexpected response");
  }

  private assertAuthenticated(): void {
    if (!this.cookieHeader) throw new Error("eVisitor test client is not authenticated");
  }

  private assertOwnerApproval(approval: EVisitorOwnerApproval): void {
    if (approval !== EVISITOR_OWNER_APPROVAL) throw new Error("OWNER_APPROVED_SUBMIT required");
  }
}
