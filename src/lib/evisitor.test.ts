import { describe, expect, it, vi } from "vitest";
import type { PrecheckinPayload, PrecheckinTraveler } from "@/lib/precheckin";
import {
  buildEVisitorCancel,
  buildEVisitorCheckIn,
  buildEVisitorCheckOut,
  EVISITOR_OWNER_APPROVAL,
  EVisitorTestClient,
  hashEVisitorRequest,
} from "@/lib/evisitor";

const guestId = "6b73dcae-f752-4d8e-9088-acde87fbda58";
const registrationId = "93517b97-c033-4436-a126-b1bd0ecf9b7a";

const traveler: PrecheckinTraveler = {
  guestId,
  clientId: "browser-row-1",
  isLead: true,
  firstName: "Synthetic",
  lastName: "Traveler",
  dateOfBirth: "1990-04-20",
  gender: "M",
  citizenshipCountry: "US",
  birthCountry: "US",
  birthPlace: "Testville",
  residenceCountry: "US",
  residencePlace: "Example City",
  residenceAddress: "1 Test Street",
  documentType: "PASSPORT",
  documentNumber: "SYNTHETIC-001",
  borderEntryDate: "2027-05-15",
  borderEntryPlace: "Synthetic crossing",
  borderEntryPoint: "Synthetic crossing",
  taxCategorySuggestion: "STANDARD_ADULT",
};

const precheckin: PrecheckinPayload = {
  version: 1,
  expectedArrivalDate: "2027-05-16",
  expectedDepartureDate: "2027-05-28",
  expectedArrivalTime: "14:00",
  arrivalOrganization: "INDIVIDUAL",
  serviceType: "ACCOMMODATION",
  travelers: [traveler],
  customAnswers: [],
};

function context() {
  return {
    registrationId,
    facilityCode: "SYNTHETIC-FACILITY",
    arrivalOrganisationCode: "VERIFIED-ARRIVAL-CODE",
    offeredServiceType: "VERIFIED-SERVICE",
    expectedDepartureTime: "10:00",
    codes: {
      guestId,
      citizenshipAlpha3: "USA",
      countryOfBirthAlpha3: "USA",
      countryOfResidenceAlpha3: "USA",
      documentTypeCode: "VERIFIED-DOC-CODE",
      genderValue: "VERIFIED-GENDER",
      taxPaymentCategoryCode: "VERIFIED-TAX-CODE",
      cityOfBirth: "Testville",
      cityOfResidence: "Example City",
      borderCrossingCode: "VERIFIED-BORDER-CODE",
    },
  };
}

describe("eVisitor mapping", () => {
  it("maps every required pre-check-in field without inventing lookup values", () => {
    const result = buildEVisitorCheckIn(precheckin, traveler, context());

    expect(result).toEqual({
      ID: registrationId,
      Facility: "SYNTHETIC-FACILITY",
      ArrivalOrganisation: "VERIFIED-ARRIVAL-CODE",
      Citizenship: "USA",
      CityOfBirth: "Testville",
      CityOfResidence: "Example City",
      CountryOfBirth: "USA",
      CountryOfResidence: "USA",
      DateOfBirth: "19900420",
      DocumentNumber: "SYNTHETIC-001",
      DocumentType: "VERIFIED-DOC-CODE",
      ForeseenStayUntil: "20270528",
      Gender: "VERIFIED-GENDER",
      OfferedServiceType: "VERIFIED-SERVICE",
      ResidenceAddress: "1 Test Street",
      StayFrom: "20270516",
      TimeEstimatedStayUntil: "10:00",
      TimeStayFrom: "14:00",
      TouristName: "Synthetic",
      TouristSurname: "Traveler",
      TTPaymentCategory: "VERIFIED-TAX-CODE",
      BorderCrossing: "VERIFIED-BORDER-CODE",
      PassageDate: "20270515",
    });
  });

  it("fails closed when an official lookup value is missing", () => {
    const unsafe = context();
    unsafe.codes.taxPaymentCategoryCode = "";
    expect(() => buildEVisitorCheckIn(precheckin, traveler, unsafe))
      .toThrow("Missing verified eVisitor value: tax payment category code");
  });

  it("requires an official border-crossing code for non-EU residents", () => {
    const unsafe = context();
    unsafe.codes.borderCrossingCode = undefined as unknown as string;
    expect(() => buildEVisitorCheckIn(precheckin, traveler, unsafe))
      .toThrow("Missing verified eVisitor value: border crossing code");
  });

  it("requires a separate owner-verified agency value", () => {
    const agencyPayload = { ...precheckin, arrivalOrganization: "TRAVEL_AGENCY" as const };
    expect(() => buildEVisitorCheckIn(agencyPayload, traveler, context()))
      .toThrow("Missing verified eVisitor value: tourist agency VAT");
  });

  it("builds checkout/cancel payloads and hashes without retaining plaintext elsewhere", () => {
    const checkout = buildEVisitorCheckOut(registrationId, "2027-05-28", "10:00");
    const cancel = buildEVisitorCancel(registrationId, "Synthetic test cleanup");
    expect(checkout).toEqual({ ID: registrationId, CheckOutDate: "20270528", CheckOutTime: "10:00" });
    expect(cancel).toEqual({ ID: registrationId, Reason: "Synthetic test cleanup" });
    expect(hashEVisitorRequest(checkout)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashEVisitorRequest(checkout)).not.toContain(registrationId);
  });
});

describe("EVisitorTestClient", () => {
  it("uses only the official test host, enforces Owner approval, and verifies readback", async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    const request = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      calls.push({ url, init });
      if (url.endsWith("/Authentication/Login")) {
        const headers = new Headers();
        headers.append("set-cookie", "auth=test-only; Path=/; HttpOnly");
        return new Response("true", { status: 200, headers });
      }
      if (url.includes("/ListOfTouristsExtended/")) {
        return Response.json({ Records: [{ ID: registrationId, CheckedOutTourist: false }] });
      }
      if (url.endsWith("/CheckInTourist/")) return new Response("", { status: 200 });
      return new Response("", { status: 200 });
    }) as typeof fetch;
    const client = new EVisitorTestClient(
      { username: "test-user", password: "test-password", apiKey: "test-key" },
      request,
    );
    await client.login();
    const payload = buildEVisitorCheckIn(precheckin, traveler, context());

    await expect(client.checkIn(payload, "WRONG" as never)).rejects.toThrow("OWNER_APPROVED_SUBMIT required");
    const readback = await client.checkIn(payload, EVISITOR_OWNER_APPROVAL);

    expect(readback.ID).toBe(registrationId);
    expect(calls.every((call) => call.url.startsWith("https://www.evisitor.hr/testApi/"))).toBe(true);
    expect(calls.some((call) => call.url.includes("eVisitorRhetos_API"))).toBe(false);
  });

  it("does not report checkout success until readback says checked out", async () => {
    const request = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/Authentication/Login")) {
        const headers = new Headers();
        headers.append("set-cookie", "auth=test-only; Path=/; HttpOnly");
        return new Response("true", { status: 200, headers });
      }
      if (url.includes("/ListOfTouristsExtended/")) {
        return Response.json({ Records: [{ ID: registrationId, CheckedOutTourist: false }] });
      }
      return new Response("", { status: 200 });
    }) as typeof fetch;
    const client = new EVisitorTestClient(
      { username: "test-user", password: "test-password", apiKey: "test-key" },
      request,
    );
    await client.login();

    await expect(client.checkOut(
      buildEVisitorCheckOut(registrationId, "2027-05-28", "10:00"),
      EVISITOR_OWNER_APPROVAL,
    )).rejects.toThrow("eVisitor checkout readback mismatch");
  });
});
