import { describe, it, expect } from "vitest";
import {
  normalizePlatformSlug,
  isValidPlatformSlug,
  resolvePlatformColor,
  PLATFORM_PRESETS,
  FALLBACK_PLATFORM_COLOR,
} from "./platforms";

describe("normalizePlatformSlug", () => {
  it("lowercases ASCII", () => {
    expect(normalizePlatformSlug("Airbnb")).toBe("airbnb");
  });

  it("collapses non-alphanumeric runs to a single dash", () => {
    expect(normalizePlatformSlug("Booking.com")).toBe("booking-com");
    expect(normalizePlatformSlug("Plum  Guide")).toBe("plum-guide");
    expect(normalizePlatformSlug("a/b/c")).toBe("a-b-c");
  });

  it("strips diacritics", () => {
    expect(normalizePlatformSlug("Édgar")).toBe("edgar");
    expect(normalizePlatformSlug("naïve")).toBe("naive");
  });

  it("trims leading and trailing dashes", () => {
    expect(normalizePlatformSlug("--hello--")).toBe("hello");
    expect(normalizePlatformSlug("   spaced   ")).toBe("spaced");
  });

  it("caps length at 32 characters", () => {
    const long = "a".repeat(40);
    expect(normalizePlatformSlug(long).length).toBe(32);
  });

  it("returns empty string when nothing alphanumeric survives", () => {
    expect(normalizePlatformSlug("///")).toBe("");
    expect(normalizePlatformSlug("")).toBe("");
    expect(normalizePlatformSlug("---")).toBe("");
  });

  it("preserves digits", () => {
    expect(normalizePlatformSlug("Zone99")).toBe("zone99");
  });
});

describe("isValidPlatformSlug", () => {
  it("accepts canonical slugs", () => {
    expect(isValidPlatformSlug("airbnb")).toBe(true);
    expect(isValidPlatformSlug("booking-com")).toBe(true);
    expect(isValidPlatformSlug("plum-guide")).toBe(true);
    expect(isValidPlatformSlug("a")).toBe(true);
    expect(isValidPlatformSlug("a1")).toBe(true);
    expect(isValidPlatformSlug("a".repeat(32))).toBe(true);
  });

  it("rejects empty / uppercase / spaces / leading-trailing dashes", () => {
    expect(isValidPlatformSlug("")).toBe(false);
    expect(isValidPlatformSlug("Airbnb")).toBe(false);
    expect(isValidPlatformSlug("plum guide")).toBe(false);
    expect(isValidPlatformSlug("-airbnb")).toBe(false);
    expect(isValidPlatformSlug("airbnb-")).toBe(false);
    expect(isValidPlatformSlug("airbnb_com")).toBe(false);
    expect(isValidPlatformSlug("a".repeat(33))).toBe(false);
  });
});

describe("resolvePlatformColor", () => {
  it("returns valid 6-digit hex unchanged", () => {
    expect(resolvePlatformColor("#FF385C")).toBe("#FF385C");
    expect(resolvePlatformColor("#003580")).toBe("#003580");
    expect(resolvePlatformColor("#abcdef")).toBe("#abcdef");
  });

  it("falls back to neutral gray on empty / null / undefined", () => {
    expect(resolvePlatformColor("")).toBe(FALLBACK_PLATFORM_COLOR);
    expect(resolvePlatformColor(null)).toBe(FALLBACK_PLATFORM_COLOR);
    expect(resolvePlatformColor(undefined)).toBe(FALLBACK_PLATFORM_COLOR);
  });

  it("rejects non-hex / wrong-length / non-string-color formats", () => {
    expect(resolvePlatformColor("red")).toBe(FALLBACK_PLATFORM_COLOR);
    expect(resolvePlatformColor("#FFF")).toBe(FALLBACK_PLATFORM_COLOR); // 3-digit not allowed
    expect(resolvePlatformColor("#GGGGGG")).toBe(FALLBACK_PLATFORM_COLOR);
    expect(resolvePlatformColor("rgb(0,0,0)")).toBe(FALLBACK_PLATFORM_COLOR);
    expect(resolvePlatformColor("FF385C")).toBe(FALLBACK_PLATFORM_COLOR); // missing #
  });
});

describe("PLATFORM_PRESETS", () => {
  // Locked-in seed list per RT-17.1 spec — guards against accidental drops.
  const expectedSlugs = [
    "airbnb",
    "booking",
    "vrbo",
    "expedia",
    "hostaway",
    "lodgify",
    "hospitable",
    "smoobu",
    "houfy",
    "plumguide",
    "whimstay",
    "direct",
  ];

  it("contains every expected baseline slug", () => {
    const slugs = PLATFORM_PRESETS.map((p) => p.slug);
    for (const expected of expectedSlugs) {
      expect(slugs, `missing seed: ${expected}`).toContain(expected);
    }
  });

  it("has unique slugs", () => {
    const slugs = PLATFORM_PRESETS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every preset has a valid 6-digit hex color", () => {
    for (const p of PLATFORM_PRESETS) {
      expect(p.color, `${p.slug}: ${p.color}`).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it("every preset slug passes isValidPlatformSlug", () => {
    for (const p of PLATFORM_PRESETS) {
      expect(isValidPlatformSlug(p.slug), p.slug).toBe(true);
    }
  });

  it("direct has zero buffer days (manually-entered reservations carry exact dates)", () => {
    const direct = PLATFORM_PRESETS.find((p) => p.slug === "direct");
    expect(direct?.defaultBufferBefore).toBe(0);
    expect(direct?.defaultBufferAfter).toBe(0);
  });

  it("non-direct presets default to 1-day buffers on each side", () => {
    for (const p of PLATFORM_PRESETS) {
      if (p.slug === "direct") continue;
      expect(p.defaultBufferBefore, p.slug).toBe(1);
      expect(p.defaultBufferAfter, p.slug).toBe(1);
    }
  });

  it("seeded presets are not marked custom", () => {
    for (const p of PLATFORM_PRESETS) {
      expect(p.isCustom, p.slug).toBe(false);
    }
  });

  it("preserves the spec'd preset count (12)", () => {
    expect(PLATFORM_PRESETS.length).toBe(12);
  });
});
