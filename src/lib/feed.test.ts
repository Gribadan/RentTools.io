import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseICal } from "@/lib/ical";

const mocks = vi.hoisted(() => ({
  propertyFindUnique: vi.fn(),
  calendarLinkFindMany: vi.fn(),
  dateOverrideFindMany: vi.fn(),
  calendarEventFindMany: vi.fn(),
  reservationFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    property: { findUnique: mocks.propertyFindUnique },
    calendarLink: { findMany: mocks.calendarLinkFindMany },
    dateOverride: { findMany: mocks.dateOverrideFindMany },
    calendarEvent: { findMany: mocks.calendarEventFindMany },
    reservation: { findMany: mocks.reservationFindMany },
  },
}));

import { generateFeed } from "./feed";

const source = {
  id: 1,
  propertyId: 12,
  platform: "airbnb",
  uid: "source-booking",
  summary: "Airbnb stay",
  startDate: "2099-08-19",
  endDate: "2099-08-23",
};

const extension = {
  id: 2,
  propertyId: 12,
  name: "Direct extension",
  checkIn: new Date("2099-08-23T00:00:00.000Z"),
  checkOut: new Date("2099-08-25T00:00:00.000Z"),
  platform: "direct",
  linkedEventUid: source.uid,
  linkedEventPlatform: "airbnb",
  linkedEventRole: "extension",
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.propertyFindUnique.mockResolvedValue({
    name: "Apt 68",
    minNights: 1,
    bookingWindow: 36500,
  });
  mocks.calendarLinkFindMany.mockResolvedValue([
    { platform: "airbnb", bufferBefore: 0, bufferAfter: 0 },
    { platform: "booking", bufferBefore: 0, bufferAfter: 0 },
  ]);
  mocks.dateOverrideFindMany.mockResolvedValue([]);
  mocks.calendarEventFindMany.mockResolvedValue([source]);
  mocks.reservationFindMany.mockResolvedValue([extension]);
});

describe("generateFeed — Direct linked extensions", () => {
  it("blocks the Direct nights back to the source platform", async () => {
    const result = await generateFeed(12, "airbnb");
    expect(result).not.toHaveProperty("error");
    if ("error" in result) throw new Error(result.error);

    const events = parseICal(result.ical).filter(
      (event) => event.uid !== "renttools-placeholder",
    );
    expect(events).toEqual([
      expect.objectContaining({
        startDate: "2099-08-23",
        endDate: "2099-08-25",
      }),
    ]);
  });

  it("merges the source stay and Direct segment for another platform", async () => {
    const result = await generateFeed(12, "booking");
    expect(result).not.toHaveProperty("error");
    if ("error" in result) throw new Error(result.error);

    const events = parseICal(result.ical).filter(
      (event) => event.uid !== "renttools-placeholder",
    );
    expect(events).toEqual([
      expect.objectContaining({
        startDate: "2099-08-19",
        endDate: "2099-08-25",
      }),
    ]);
  });

  it("never exposes imported or manual guest names in outgoing iCal", async () => {
    mocks.calendarEventFindMany.mockResolvedValue([
      { ...source, summary: "PRIVATE GUEST NAME" },
    ]);
    mocks.reservationFindMany.mockResolvedValue([
      { ...extension, name: "ANOTHER PRIVATE NAME" },
    ]);
    const result = await generateFeed(12, "booking");
    if ("error" in result) throw new Error(result.error);
    expect(result.ical).not.toContain("PRIVATE GUEST NAME");
    expect(result.ical).not.toContain("ANOTHER PRIVATE NAME");
    expect(result.ical).toContain("Blocked");
  });

  it("never exposes source UIDs, internal reservation IDs, or source names", async () => {
    mocks.calendarEventFindMany.mockResolvedValue([
      {
        ...source,
        uid: "airbnb-secret-source-uid",
        summary: "PRIVATE NAME",
        email: "private@example.test",
        phone: "+385000000000",
        notes: "PRIVATE INTERNAL NOTE",
      },
    ]);
    mocks.reservationFindMany.mockResolvedValue([
      {
        ...extension,
        id: 987654321,
        linkedEventUid: null,
        email: "reservation@example.test",
        phone: "+4310000000",
        notes: "PRIVATE RESERVATION NOTE",
      },
    ]);

    const result = await generateFeed(12, "booking");
    if ("error" in result) throw new Error(result.error);

    expect(result.ical).not.toContain("airbnb-secret-source-uid");
    expect(result.ical).not.toContain("987654321");
    expect(result.ical).not.toContain("airbnb");
    expect(result.ical).not.toContain("direct");
    expect(result.ical).not.toContain("PRIVATE NAME");
    expect(result.ical).not.toContain("private@example.test");
    expect(result.ical).not.toContain("reservation@example.test");
    expect(result.ical).not.toContain("+385000000000");
    expect(result.ical).not.toContain("+4310000000");
    expect(result.ical).not.toContain("PRIVATE INTERNAL NOTE");
    expect(result.ical).not.toContain("PRIVATE RESERVATION NOTE");
    // The digest hides the source, but the `renttool-` prefix must survive:
    // calendar-sync.ts keys its feedback-loop guard off it.
    expect(result.ical).toMatch(/UID:renttool-[0-9a-f]{32}/);

    const repeated = await generateFeed(12, "booking");
    if ("error" in repeated) throw new Error(repeated.error);
    expect(parseICal(repeated.ical).map((event) => event.uid))
      .toEqual(parseICal(result.ical).map((event) => event.uid));
  });

  it("routes an explicitly marked extension as Direct during migration", async () => {
    mocks.reservationFindMany.mockResolvedValue([
      { ...extension, platform: "airbnb" },
    ]);

    const result = await generateFeed(12, "airbnb");
    if ("error" in result) throw new Error(result.error);
    const events = parseICal(result.ical).filter(
      (event) => event.uid !== "renttools-placeholder",
    );
    expect(events).toEqual([
      expect.objectContaining({
        startDate: "2099-08-23",
        endDate: "2099-08-25",
      }),
    ]);
  });

  it("exports confirmed stays from mixed sources to a hyphenated destination", async () => {
    mocks.calendarLinkFindMany.mockResolvedValue([
      { platform: "ubytovani-v-chorvatsku", bufferBefore: 0, bufferAfter: 0 },
    ]);
    mocks.calendarEventFindMany.mockResolvedValue([
      {
        ...source,
        uid: "airbnb-2026-regression",
        summary: "PRIVATE IMPORTED NAME",
        startDate: "2026-08-23",
        endDate: "2026-09-11",
        platform: "airbnb",
      },
      {
        ...source,
        uid: "booking-2027-regression",
        summary: "ANOTHER PRIVATE NAME",
        startDate: "2027-06-30",
        endDate: "2027-07-04",
        platform: "booking",
      },
    ]);
    mocks.reservationFindMany.mockResolvedValue([
      {
        ...extension,
        id: 301,
        name: "PRIVATE DIRECT NAME 1",
        checkIn: new Date("2027-05-16T00:00:00.000Z"),
        checkOut: new Date("2027-05-28T00:00:00.000Z"),
        platform: "direct",
        linkedEventUid: null,
        linkedEventPlatform: null,
        linkedEventRole: null,
      },
      {
        ...extension,
        id: 302,
        name: "PRIVATE DIRECT NAME 2",
        checkIn: new Date("2027-08-07T00:00:00.000Z"),
        checkOut: new Date("2027-08-17T00:00:00.000Z"),
        platform: "direct",
        linkedEventUid: null,
        linkedEventPlatform: null,
        linkedEventRole: null,
      },
    ]);

    const result = await generateFeed(12, "ubytovani-v-chorvatsku");
    if ("error" in result) throw new Error(result.error);
    const events = parseICal(result.ical).filter(
      (event) => event.uid !== "renttools-placeholder",
    );

    expect(events.map(({ startDate, endDate }) => ({ startDate, endDate })))
      .toEqual([
        { startDate: "2026-08-23", endDate: "2026-09-11" },
        { startDate: "2027-05-16", endDate: "2027-05-28" },
        { startDate: "2027-06-30", endDate: "2027-07-04" },
        { startDate: "2027-08-07", endDate: "2027-08-17" },
      ]);
    expect(result.ical).not.toContain("PRIVATE IMPORTED NAME");
    expect(result.ical).not.toContain("ANOTHER PRIVATE NAME");
    expect(result.ical).not.toContain("PRIVATE DIRECT NAME 1");
    expect(result.ical).not.toContain("PRIVATE DIRECT NAME 2");
  });

  it("deduplicates identical occupancy ranges from multiple sources", async () => {
    mocks.calendarLinkFindMany.mockResolvedValue([
      { platform: "ubytovani-v-chorvatsku", bufferBefore: 0, bufferAfter: 0 },
    ]);
    mocks.calendarEventFindMany.mockResolvedValue([
      { ...source, uid: "airbnb-copy", startDate: "2027-08-07", endDate: "2027-08-17", platform: "airbnb" },
      { ...source, uid: "booking-copy", startDate: "2027-08-07", endDate: "2027-08-17", platform: "booking" },
    ]);
    mocks.reservationFindMany.mockResolvedValue([]);

    const result = await generateFeed(12, "ubytovani-v-chorvatsku");
    if ("error" in result) throw new Error(result.error);
    const events = parseICal(result.ical).filter((event) => event.uid !== "renttools-placeholder");

    expect(events).toHaveLength(1);
    expect(events[0]).toEqual(expect.objectContaining({
      startDate: "2027-08-07",
      endDate: "2027-08-17",
    }));
  });

  it("drops a cancelled imported stay once sync removes it from the active event set", async () => {
    mocks.calendarEventFindMany.mockResolvedValue([]);
    mocks.reservationFindMany.mockResolvedValue([]);

    const result = await generateFeed(12, "booking");
    if ("error" in result) throw new Error(result.error);
    const events = parseICal(result.ical).filter((event) => event.uid !== "renttools-placeholder");

    expect(events).toEqual([]);
  });

  it("exports a Booking stay with checkout kept exclusive", async () => {
    mocks.calendarEventFindMany.mockResolvedValue([
      { ...source, uid: "booking-only", startDate: "2027-06-30", endDate: "2027-07-04", platform: "booking" },
    ]);
    mocks.reservationFindMany.mockResolvedValue([]);

    const result = await generateFeed(12, "airbnb");
    if ("error" in result) throw new Error(result.error);
    const events = parseICal(result.ical).filter((event) => event.uid !== "renttools-placeholder");

    expect(events).toEqual([
      expect.objectContaining({ startDate: "2027-06-30", endDate: "2027-07-04" }),
    ]);
  });
});

describe("generateFeed — self-origin loop guard", () => {
  // calendar-sync.ts drops inbound events whose UID starts with "renttool-".
  // That filter is the only thing stopping our own buffer blocks from being
  // re-imported and re-exported in an ever-widening loop when a feed
  // round-trips back to us. Opaque UIDs must keep the prefix.
  it("prefixes every published VEVENT UID so calendar-sync can drop its own feed", async () => {
    mocks.calendarEventFindMany.mockResolvedValue([
      { ...source, uid: "airbnb-secret", summary: "PRIVATE NAME" },
    ]);
    mocks.reservationFindMany.mockResolvedValue([extension]);
    mocks.dateOverrideFindMany.mockResolvedValue([
      { date: "2099-09-09", type: "closed" },
    ]);

    for (const platform of ["airbnb", "booking"]) {
      const result = await generateFeed(12, platform);
      if ("error" in result) throw new Error(result.error);

      const uids = parseICal(result.ical)
        .map((event) => event.uid)
        // The empty-feed placeholder is dated 1970 and dropped by the
        // future-events filter instead, so it is not part of this contract.
        .filter((uid) => uid !== "renttools-placeholder");
      expect(uids.length).toBeGreaterThan(0);
      for (const uid of uids) {
        expect(uid.startsWith("renttool-")).toBe(true);
      }
      // ...and the digest still hides the source.
      expect(result.ical).not.toContain("airbnb-secret");
      expect(result.ical).not.toContain("PRIVATE NAME");
    }
  });
});

describe("generateFeed — local occupancy remains authoritative", () => {
  it.each(["airbnb", "booking"])("exports an unlinked Airbnb-labelled reservation to %s", async (platform) => {
    mocks.calendarEventFindMany.mockResolvedValue([]);
    mocks.reservationFindMany.mockResolvedValue([{
      ...extension,
      platform: "airbnb",
      linkedEventUid: null,
      linkedEventPlatform: null,
      linkedEventRole: null,
      checkIn: new Date("2099-09-15T00:00:00.000Z"),
      checkOut: new Date("2099-09-25T00:00:00.000Z"),
    }]);
    // An old force-open must not defeat the later local reservation.
    mocks.dateOverrideFindMany.mockResolvedValue([{ date: "2099-09-18", type: "open" }]);
    const result = await generateFeed(12, platform);
    if ("error" in result) throw new Error(result.error);
    expect(parseICal(result.ical)).toEqual([expect.objectContaining({
      startDate: "2099-09-15", endDate: "2099-09-25",
    })]);
  });

  it("does not reflect a claimed source stay back into its own platform", async () => {
    mocks.reservationFindMany.mockResolvedValue([{
      ...extension,
      platform: "airbnb",
      linkedEventRole: "claim",
      checkIn: new Date(`${source.startDate}T00:00:00.000Z`),
      checkOut: new Date(`${source.endDate}T00:00:00.000Z`),
    }]);
    const result = await generateFeed(12, "airbnb");
    if ("error" in result) throw new Error(result.error);
    expect(parseICal(result.ical).filter(e => e.uid !== "renttools-placeholder")).toEqual([]);
  });

  it("exports local nights on both sides of a shorter source stay", async () => {
    mocks.reservationFindMany.mockResolvedValue([{
      ...extension,
      platform: "airbnb",
      linkedEventRole: "claim",
      checkIn: new Date("2099-08-17T00:00:00.000Z"),
      checkOut: new Date("2099-08-25T00:00:00.000Z"),
    }]);
    const result = await generateFeed(12, "airbnb");
    if ("error" in result) throw new Error(result.error);
    expect(parseICal(result.ical)).toEqual([
      expect.objectContaining({ startDate: "2099-08-17", endDate: "2099-08-19" }),
      expect.objectContaining({ startDate: "2099-08-23", endDate: "2099-08-25" }),
    ]);
  });

  it("keeps a preserved local reservation blocked after its imported UID disappears", async () => {
    mocks.calendarEventFindMany.mockResolvedValue([]);
    mocks.reservationFindMany.mockResolvedValue([{
      ...extension,
      platform: "airbnb",
      linkedEventRole: "claim",
      checkIn: new Date(`${source.startDate}T00:00:00.000Z`),
      checkOut: new Date(`${source.endDate}T00:00:00.000Z`),
    }]);
    const result = await generateFeed(12, "airbnb");
    if ("error" in result) throw new Error(result.error);
    expect(parseICal(result.ical)).toEqual([expect.objectContaining({
      startDate: source.startDate, endDate: source.endDate,
    })]);
  });
});
