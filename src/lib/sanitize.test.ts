import { describe, it, expect } from "vitest";
import {
  transliterate,
  stripDiacritics,
  sanitizeText,
  sanitizeAlphanumeric,
  stripSpaces,
} from "./sanitize";

describe("transliterate", () => {
  it("maps Cyrillic uppercase to Latin", () => {
    expect(transliterate("ИВАНОВ")).toBe("IVANOV");
  });

  it("maps Cyrillic lowercase to Latin", () => {
    expect(transliterate("петр")).toBe("petr");
  });

  it("handles multi-char mappings (Щ → SHCH, Ю → YU)", () => {
    expect(transliterate("ЩУКА")).toBe("SHCHUKA");
    expect(transliterate("Юлия")).toBe("YUliya");
  });

  it("drops soft and hard signs", () => {
    expect(transliterate("Объект")).toBe("Obekt");
    expect(transliterate("Мать")).toBe("Mat");
  });

  it("leaves Latin and digits untouched", () => {
    expect(transliterate("ABC123")).toBe("ABC123");
  });

  it("handles empty string", () => {
    expect(transliterate("")).toBe("");
  });

  it("mixes Cyrillic and Latin in the same input", () => {
    expect(transliterate("Иван Smith")).toBe("Ivan Smith");
  });
});

describe("stripDiacritics", () => {
  it("removes accents from Latin chars", () => {
    expect(stripDiacritics("café")).toBe("cafe");
    expect(stripDiacritics("naïve")).toBe("naive");
  });

  it("preserves base letters", () => {
    expect(stripDiacritics("ÉLÉPHANT")).toBe("ELEPHANT");
  });

  it("leaves ASCII unchanged", () => {
    expect(stripDiacritics("hello")).toBe("hello");
  });
});

describe("sanitizeText", () => {
  it("transliterates and strips diacritics", () => {
    expect(sanitizeText("Иванов")).toBe("Ivanov");
    expect(sanitizeText("naïve café")).toBe("naive cafe");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeText("  hello  ")).toBe("hello");
  });

  it("preserves internal punctuation and spaces", () => {
    expect(sanitizeText("O'Brien-Smith")).toBe("O'Brien-Smith");
  });

  it("handles empty string", () => {
    expect(sanitizeText("")).toBe("");
  });
});

describe("sanitizeAlphanumeric", () => {
  it("replaces dots with spaces and collapses runs", () => {
    expect(sanitizeAlphanumeric("MID.ROSSII.49302")).toBe("MID ROSSII 49302");
  });

  it("replaces dashes with spaces", () => {
    expect(sanitizeAlphanumeric("MVD-RF-12345")).toBe("MVD RF 12345");
  });

  it("transliterates Cyrillic before stripping", () => {
    expect(sanitizeAlphanumeric("МВД РФ 12345")).toBe("MVD RF 12345");
  });

  it("collapses multiple spaces and trims", () => {
    expect(sanitizeAlphanumeric("  A   B  ")).toBe("A B");
  });

  it("strips all special characters", () => {
    expect(sanitizeAlphanumeric("№42 / Issued@HQ!")).toBe("42 Issued HQ");
  });

  it("handles empty string", () => {
    expect(sanitizeAlphanumeric("")).toBe("");
  });
});

describe("stripSpaces", () => {
  it("removes spaces from passport numbers", () => {
    expect(stripSpaces("AB 123 456")).toBe("AB123456");
  });

  it("removes tabs and newlines", () => {
    expect(stripSpaces("AB\t123\n456")).toBe("AB123456");
  });

  it("transliterates Cyrillic in passport-like strings", () => {
    expect(stripSpaces("РФ 12 345")).toBe("RF12345");
  });

  it("handles already-clean input", () => {
    expect(stripSpaces("ABC123")).toBe("ABC123");
  });

  it("handles empty string", () => {
    expect(stripSpaces("")).toBe("");
  });
});
