import { describe, expect, it } from "vitest";
import {
  ageOnDate,
  precheckinWarnings,
  requiresNonEuBorderFields,
  suggestTaxCategory,
  validatePrecheckinPayload,
} from "@/lib/precheckin";

const traveler = {
  clientId: "lead-1",
  isLead: true,
  firstName: "Ana",
  lastName: "Horvat",
  dateOfBirth: "1990-05-20",
  gender: "F",
  citizenshipCountry: "HR",
  birthCountry: "HR",
  birthPlace: "Zagreb",
  residenceCountry: "HR",
  residencePlace: "Zagreb",
  residenceAddress: "Example 1",
  documentType: "IDENTITY_CARD",
  documentNumber: "ABC123",
};

function payload(travelers = [traveler]) {
  return {
    expectedArrivalTime: "16:30",
    arrivalOrganization: "INDIVIDUAL",
    serviceType: "ACCOMMODATION",
    travelers,
    customAnswers: [],
  };
}

describe("precheckin validation", () => {
  it("accepts one complete traveler and derives the adult category", () => {
    const result = validatePrecheckinPayload(payload(), {
      checkIn: "2027-05-16",
      checkOut: "2027-05-28",
      maxTravelers: 6,
    });
    expect(result.ok).toBe(true);
    expect(result.payload?.travelers[0].taxCategorySuggestion).toBe("STANDARD_ADULT");
  });

  it("rejects duplicate travelers and more than one lead", () => {
    const result = validatePrecheckinPayload(payload([traveler, { ...traveler, clientId: "two" }]), {
      checkIn: "2027-05-16",
      checkOut: "2027-05-28",
      maxTravelers: 6,
    });
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toMatch(/Exactly one lead|duplicate traveler/);
  });

  it("enforces the configured traveler limit", () => {
    const travelers = Array.from({ length: 7 }, (_, index) => ({
      ...traveler,
      clientId: String(index),
      isLead: index === 0,
      firstName: `Guest${index}`,
      documentNumber: `DOC${index}`,
    }));
    const result = validatePrecheckinPayload(payload(travelers), {
      checkIn: "2027-05-16",
      checkOut: "2027-05-28",
      maxTravelers: 6,
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Traveler count exceeds reservation limit (6)");
  });

  it("flags missing non-EU border data without inventing it", () => {
    const result = validatePrecheckinPayload(payload([{
      ...traveler,
      citizenshipCountry: "HR",
      residenceCountry: "US",
    }]), {
      checkIn: "2027-05-16",
      checkOut: "2027-05-28",
    });
    expect(result.ok).toBe(true);
    expect(precheckinWarnings(result.payload!)).toHaveLength(1);
    expect(requiresNonEuBorderFields("US")).toBe(true);
    expect(requiresNonEuBorderFields("HR")).toBe(false);
  });
});

describe("age and tax-category suggestions", () => {
  it("handles birthdays at the reference date boundary", () => {
    expect(ageOnDate("2015-05-17", "2027-05-16")).toBe(11);
    expect(ageOnDate("2015-05-16", "2027-05-16")).toBe(12);
  });

  it("suggests under-12, reduced, and adult categories", () => {
    expect(suggestTaxCategory("2016-01-01", "2027-05-16")).toBe("EXEMPT_UNDER_12");
    expect(suggestTaxCategory("2011-01-01", "2027-05-16")).toBe("REDUCED_12_TO_17");
    expect(suggestTaxCategory("1990-01-01", "2027-05-16")).toBe("STANDARD_ADULT");
  });
});
