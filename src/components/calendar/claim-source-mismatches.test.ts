import { describe, expect, it } from "vitest";
import type { Reservation } from "@/lib/types";
import { findClaimSourceMismatches } from "./claim-source-mismatches";
import type { CalendarEvent } from "./types";

const claim: Reservation = {
  id: 1,
  propertyId: 1,
  name: "Example stay",
  platform: "booking",
  checkIn: "2028-04-10T00:00:00.000Z",
  checkOut: "2028-04-14T00:00:00.000Z",
  linkedEventUid: "source-a",
  linkedEventPlatform: "booking",
  linkedEventRole: "claim",
  createdAt: "2028-01-01T00:00:00.000Z",
};

const source: CalendarEvent = {
  id: 1,
  platform: "booking",
  uid: "source-a",
  summary: "Reserved",
  startDate: "2028-04-10",
  endDate: "2028-04-16",
};

describe("explicit claim and source date mismatches", () => {
  it("compares local reservation dates with the original source range", () => {
    expect(findClaimSourceMismatches([claim], [source])).toEqual([{
      reservationId: 1,
      reservationName: "Example stay",
      platform: "booking",
      localCheckIn: "2028-04-10",
      localCheckOut: "2028-04-14",
      sourceCheckIn: "2028-04-10",
      sourceCheckOut: "2028-04-16",
      overlapsSource: true,
    }]);
  });

  it.each([
    { checkIn: "2028-04-09", checkOut: "2028-04-16" },
    { checkIn: "2028-04-10", checkOut: "2028-04-17" },
    { checkIn: "2028-04-09", checkOut: "2028-04-17" },
  ])("detects locally added nights in $checkIn → $checkOut", (dates) => {
    expect(findClaimSourceMismatches([{ ...claim, ...dates }], [source]))
      .toMatchObject([{ localCheckIn: dates.checkIn, localCheckOut: dates.checkOut }]);
  });

  it("compares exact platform and UID instead of a nearby or shared-UID event", () => {
    const otherPlatform = { ...source, platform: "airbnb" };
    const otherUid = { ...source, uid: "source-b" };
    expect(findClaimSourceMismatches([claim], [otherPlatform, otherUid])).toEqual([]);
    expect(findClaimSourceMismatches([claim], [otherPlatform, otherUid, source])).toHaveLength(1);
  });

  it("uses the source platform even when the reservation platform differs", () => {
    expect(findClaimSourceMismatches([{ ...claim, platform: "direct" }], [source]))
      .toMatchObject([{ platform: "booking" }]);
  });

  it("preserves the platform fallback for explicit claims without the newer namespace", () => {
    expect(findClaimSourceMismatches([{ ...claim, linkedEventPlatform: null }], [source]))
      .toHaveLength(1);
    expect(findClaimSourceMismatches([{ ...claim, platform: "direct", linkedEventPlatform: null }], [source]))
      .toEqual([]);
  });

  it.each([
    { checkIn: "2028-04-08", checkOut: "2028-04-10" },
    { checkIn: "2028-04-16", checkOut: "2028-04-18" },
    { checkIn: "2028-05-01", checkOut: "2028-05-05" },
  ])("flags an exact linked source which no longer overlaps $checkIn → $checkOut", (dates) => {
    expect(findClaimSourceMismatches([{ ...claim, ...dates }], [source]))
      .toMatchObject([{ overlapsSource: false }]);
  });

  it("excludes matching ranges, extensions, inferred legacy claims, and missing links or sources", () => {
    expect(findClaimSourceMismatches([
      { ...claim, checkOut: "2028-04-16T12:00:00.000Z" },
      { ...claim, linkedEventRole: "extension" },
      { ...claim, linkedEventRole: null },
      { ...claim, linkedEventUid: null },
      { ...claim, linkedEventUid: "missing-source" },
    ], [source])).toEqual([]);
    expect(findClaimSourceMismatches([claim], [])).toEqual([]);
  });

  it("excludes invalid dates and empty or reversed ranges", () => {
    expect(findClaimSourceMismatches([
      { ...claim, checkIn: "invalid" },
      { ...claim, checkOut: "2028-04-10" },
      { ...claim, checkOut: "2028-04-09" },
    ], [source])).toEqual([]);
    expect(findClaimSourceMismatches([claim], [{ ...source, endDate: "2028-04-31" }])).toEqual([]);
    expect(findClaimSourceMismatches([claim], [{ ...source, endDate: source.startDate }])).toEqual([]);
  });

  it("does not mutate either source or reservation dates", () => {
    const local = Object.freeze({ ...claim });
    const upstream = Object.freeze({ ...source });
    findClaimSourceMismatches(Object.freeze([local]), Object.freeze([upstream]));
    expect(local.checkOut).toBe("2028-04-14T00:00:00.000Z");
    expect(upstream.endDate).toBe("2028-04-16");
  });
});
