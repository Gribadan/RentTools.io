import { describe, expect, it } from "vitest";
import { normalizeIcalUrl, normalizePlatformSlug } from "./calendar-link-input";

const ok = (r: ReturnType<typeof normalizeIcalUrl>) => {
  if (!r.ok) throw new Error(`expected ok, got error: ${r.error}`);
  return r.url;
};

describe("normalizeIcalUrl", () => {
  it("keeps a well-formed https URL", () => {
    expect(ok(normalizeIcalUrl("https://ical.booking.com/v1/export?t=abc"))).toBe(
      "https://ical.booking.com/v1/export?t=abc"
    );
  });

  it("allows plain http", () => {
    expect(ok(normalizeIcalUrl("http://example.com/cal.ics"))).toBe("http://example.com/cal.ics");
  });

  it("trims surrounding whitespace from a paste", () => {
    expect(ok(normalizeIcalUrl("  https://example.com/cal.ics \n"))).toBe(
      "https://example.com/cal.ics"
    );
  });

  // The production failure: one row stored without a scheme failed every
  // sync with "Failed to parse URL from billex.cloud".
  it("adds https:// to a scheme-less host so it can actually be fetched", () => {
    expect(ok(normalizeIcalUrl("billex.cloud/ical/123.ics"))).toBe(
      "https://billex.cloud/ical/123.ics"
    );
  });

  it("rewrites webcal:// to https://", () => {
    expect(ok(normalizeIcalUrl("webcal://example.com/cal.ics"))).toBe(
      "https://example.com/cal.ics"
    );
  });

  it("rewrites WEBCAL:// case-insensitively", () => {
    expect(ok(normalizeIcalUrl("WEBCAL://example.com/cal.ics"))).toBe(
      "https://example.com/cal.ics"
    );
  });

  it("rejects an empty or blank value", () => {
    expect(normalizeIcalUrl("")).toMatchObject({ ok: false });
    expect(normalizeIcalUrl("   ")).toMatchObject({ ok: false });
  });

  it("rejects a non-string", () => {
    expect(normalizeIcalUrl(undefined)).toMatchObject({ ok: false });
    expect(normalizeIcalUrl(42)).toMatchObject({ ok: false });
  });

  it("rejects a non-http scheme", () => {
    expect(normalizeIcalUrl("ftp://example.com/cal.ics")).toMatchObject({ ok: false });
    expect(normalizeIcalUrl("javascript:alert(1)")).toMatchObject({ ok: false });
  });

  it("rejects a hostname with no dot", () => {
    expect(normalizeIcalUrl("https://localhost/cal.ics")).toMatchObject({ ok: false });
  });

  it("rejects an over-long URL", () => {
    expect(normalizeIcalUrl("https://example.com/" + "a".repeat(2100))).toMatchObject({ ok: false });
  });
});

describe("normalizePlatformSlug", () => {
  it("accepts the built-in platforms", () => {
    for (const p of ["airbnb", "booking", "vrbo", "agoda", "houfy"]) {
      expect(normalizePlatformSlug(p)).toEqual({ ok: true, platform: p });
    }
  });

  it("accepts hyphenated and generated custom slugs already in production", () => {
    expect(normalizePlatformSlug("trip-com")).toEqual({ ok: true, platform: "trip-com" });
    expect(normalizePlatformSlug("custom-qkeg4h01")).toEqual({
      ok: true,
      platform: "custom-qkeg4h01",
    });
  });

  it("lowercases and trims", () => {
    expect(normalizePlatformSlug("  Vrbo  ")).toEqual({ ok: true, platform: "vrbo" });
  });

  it("rejects blank and non-string input", () => {
    expect(normalizePlatformSlug("")).toMatchObject({ ok: false });
    expect(normalizePlatformSlug(null)).toMatchObject({ ok: false });
  });

  it("rejects slugs with spaces or punctuation", () => {
    expect(normalizePlatformSlug("my platform")).toMatchObject({ ok: false });
    expect(normalizePlatformSlug("../etc")).toMatchObject({ ok: false });
  });

  it("caps length at 32 characters", () => {
    const r = normalizePlatformSlug("a".repeat(50));
    expect(r).toMatchObject({ ok: true });
    if (r.ok) expect(r.platform).toHaveLength(32);
  });
});
