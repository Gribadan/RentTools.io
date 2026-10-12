import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { generateICal, parseICal } from "@/lib/ical";

const mocks = vi.hoisted(() => ({ propertyFindFirst: vi.fn(), draftFindUnique: vi.fn(), generateFeed: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  property: { findFirst: mocks.propertyFindFirst },
  onboardingDraft: { findUnique: mocks.draftFindUnique },
} }));
vi.mock("@/lib/feed", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/feed")>(),
  generateFeed: mocks.generateFeed,
}));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: () => ({ ok: true }), clientIp: () => "127.0.0.1" }));

import { GET } from "./route";

const ical = generateICal([{ uid: "local-stay", summary: "Blocked", startDate: "2026-10-08", endDate: "2026-10-09" }], "Appartement été");

beforeEach(() => {
  vi.resetAllMocks();
  mocks.propertyFindFirst.mockResolvedValue({ id: 12, feedToken: "test-feed-token" });
  mocks.draftFindUnique.mockResolvedValue(null);
  mocks.generateFeed.mockResolvedValue({ ical });
});

describe("public calendar feed compatibility", () => {
  it("serves a complete UTF-8 iCal response with an accurate byte length", async () => {
    const response = await GET(new NextRequest("http://localhost/api/calendar/feed/12/for-booking.ics?token=test-feed-token"), {
      params: Promise.resolve({ propertyId: "12", filename: "for-booking.ics" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/calendar; charset=utf-8");
    expect(Number(response.headers.get("Content-Length"))).toBe(Buffer.byteLength(ical, "utf8"));
    const body = await response.text();
    expect(body.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(parseICal(body)[0]).toMatchObject({ startDate: "2026-10-08", endDate: "2026-10-09" });
  });

  it("keeps token protection on property feeds", async () => {
    const response = await GET(new NextRequest("http://localhost/api/calendar/feed/12/for-booking.ics?token=wrong"), {
      params: Promise.resolve({ propertyId: "12", filename: "for-booking.ics" }),
    });
    expect(response.status).toBe(401);
    expect(mocks.generateFeed).not.toHaveBeenCalled();
  });

  it("also returns a complete pre-signup placeholder feed", async () => {
    mocks.propertyFindFirst.mockResolvedValue(null);
    mocks.draftFindUnique.mockResolvedValue({ id: 1, claimedByUserId: null });
    const response = await GET(new NextRequest("http://localhost/api/calendar/feed/draft/for-airbnb.ics"), {
      params: Promise.resolve({ propertyId: "draft", filename: "for-airbnb.ics" }),
    });
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(Number(response.headers.get("Content-Length"))).toBe(Buffer.byteLength(body, "utf8"));
    expect(parseICal(body)[0].startDate).toBe("1970-01-01");
  });
});
