import { describe, expect, it } from "vitest";
import { slugify, slugWithSuffix } from "./slugify";

describe("slugify", () => {
  it("lowercases and hyphenates plain ASCII", () => {
    expect(slugify("Tashkent Studio")).toBe("tashkent-studio");
    expect(slugify("My First Property")).toBe("my-first-property");
  });

  it("transliterates Russian Cyrillic", () => {
    expect(slugify("Дом 7")).toBe("dom-7");
    expect(slugify("Квартира 68")).toBe("kvartira-68");
    expect(slugify("Москва центр")).toBe("moskva-tsentr");
  });

  it("transliterates Ukrainian / Belarusian-extended Cyrillic", () => {
    // Same Cyrillic letter has different Latin spellings in different
    // scripts (UA "и"→"y", RU "и"→"i"). We don't try to detect language —
    // use the Russian-leaning ISO map. Output is just URL-safe ASCII; the
    // exact spelling doesn't matter.
    expect(slugify("Київ")).toMatch(/^k[yi]+v$/);
    expect(slugify("Львів")).toMatch(/^l[yiv]+$/);
  });

  it("strips diacritics from Latin scripts", () => {
    expect(slugify("Café São Paulo")).toBe("cafe-sao-paulo");
    expect(slugify("Crème brûlée")).toBe("creme-brulee");
  });

  it("collapses runs of non-alphanumerics into a single hyphen", () => {
    expect(slugify("Hello!!!  World???")).toBe("hello-world");
    expect(slugify("a___b---c")).toBe("a-b-c");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello");
    expect(slugify("...test...")).toBe("test");
  });

  it("falls back to 'custom-calendar' for empty / unparseable input", () => {
    expect(slugify("")).toBe("custom-calendar");
    expect(slugify("???")).toBe("custom-calendar");
    expect(slugify("   ")).toBe("custom-calendar");
  });

  it("truncates to 32 chars without trailing hyphen", () => {
    const long = "this is a very long property name that exceeds the slug limit by a wide margin";
    const s = slugify(long);
    expect(s.length).toBeLessThanOrEqual(32);
    expect(s.endsWith("-")).toBe(false);
  });

  it("preserves digits", () => {
    expect(slugify("Apartment 12B")).toBe("apartment-12b");
    expect(slugify("Property #5")).toBe("property-5");
  });
});

describe("slugWithSuffix", () => {
  it("appends a 6-char random suffix", () => {
    const a = slugWithSuffix("Tashkent Studio");
    const b = slugWithSuffix("Tashkent Studio");
    expect(a).not.toBe(b); // suffix is random
    expect(a).toMatch(/^tashkent-studio-[a-z0-9]{6}$/);
  });

  it("falls back when name is empty", () => {
    expect(slugWithSuffix("")).toMatch(/^custom-calendar-[a-z0-9]{6}$/);
  });

  it("trims base so total stays under 32", () => {
    const long = "this is a very long property name that exceeds the slug limit";
    const s = slugWithSuffix(long);
    expect(s.length).toBeLessThanOrEqual(32);
    // Suffix is intact at the tail
    expect(s).toMatch(/-[a-z0-9]{6}$/);
  });
});
