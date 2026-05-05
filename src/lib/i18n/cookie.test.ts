import { describe, it, expect } from "vitest";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  parseLocaleFromCookieHeader,
  buildLocaleCookieString,
  readLocaleCookieFromDocument,
  writeLocaleCookieToDocument,
} from "./cookie";

describe("isLocale", () => {
  it("accepts en and ru", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("ru")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isLocale("EN")).toBe(false);
    expect(isLocale("de")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe("parseLocaleFromCookieHeader", () => {
  it("returns null for empty / nullish input", () => {
    expect(parseLocaleFromCookieHeader(null)).toBeNull();
    expect(parseLocaleFromCookieHeader(undefined)).toBeNull();
    expect(parseLocaleFromCookieHeader("")).toBeNull();
  });

  it("extracts a single rt-locale cookie", () => {
    expect(parseLocaleFromCookieHeader(`${LOCALE_COOKIE_NAME}=ru`)).toBe("ru");
    expect(parseLocaleFromCookieHeader(`${LOCALE_COOKIE_NAME}=en`)).toBe("en");
  });

  it("finds the cookie among many", () => {
    const header = `session=abc; ${LOCALE_COOKIE_NAME}=ru; theme=dark`;
    expect(parseLocaleFromCookieHeader(header)).toBe("ru");
  });

  it("trims whitespace around values", () => {
    expect(parseLocaleFromCookieHeader(`${LOCALE_COOKIE_NAME}=  en  `)).toBe("en");
  });

  it("decodes URL-encoded values", () => {
    expect(parseLocaleFromCookieHeader(`${LOCALE_COOKIE_NAME}=${encodeURIComponent("ru")}`)).toBe("ru");
  });

  it("returns null when value is invalid", () => {
    expect(parseLocaleFromCookieHeader(`${LOCALE_COOKIE_NAME}=de`)).toBeNull();
    expect(parseLocaleFromCookieHeader(`${LOCALE_COOKIE_NAME}=`)).toBeNull();
  });

  it("returns null when cookie absent", () => {
    expect(parseLocaleFromCookieHeader("session=abc; theme=dark")).toBeNull();
  });
});

describe("buildLocaleCookieString", () => {
  it("includes name, value, path, max-age, samesite, secure by default", () => {
    const out = buildLocaleCookieString("ru");
    expect(out).toContain(`${LOCALE_COOKIE_NAME}=ru`);
    expect(out).toContain("Path=/");
    expect(out).toContain(`Max-Age=${LOCALE_COOKIE_MAX_AGE}`);
    expect(out).toContain("SameSite=Lax");
    expect(out).toContain("Secure");
    expect(out).not.toContain("HttpOnly");
  });

  it("omits Secure when explicitly disabled (for localhost)", () => {
    const out = buildLocaleCookieString("en", { secure: false });
    expect(out).not.toContain("Secure");
    expect(out).toContain(`${LOCALE_COOKIE_NAME}=en`);
  });

  it("uses one-year Max-Age", () => {
    expect(LOCALE_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 365);
  });
});

describe("readLocaleCookieFromDocument", () => {
  it("returns null for nullish doc", () => {
    expect(readLocaleCookieFromDocument(null)).toBeNull();
    expect(readLocaleCookieFromDocument(undefined)).toBeNull();
  });

  it("reads from document.cookie shape", () => {
    expect(readLocaleCookieFromDocument({ cookie: `${LOCALE_COOKIE_NAME}=ru` })).toBe("ru");
  });
});

describe("writeLocaleCookieToDocument", () => {
  it("assigns a serialized cookie to document.cookie", () => {
    const doc = { cookie: "" };
    writeLocaleCookieToDocument(doc, "ru", { secure: false });
    expect(doc.cookie).toContain(`${LOCALE_COOKIE_NAME}=ru`);
    expect(doc.cookie).toContain("Path=/");
  });

  it("is a no-op for nullish doc", () => {
    expect(() => writeLocaleCookieToDocument(null, "en")).not.toThrow();
    expect(() => writeLocaleCookieToDocument(undefined, "en")).not.toThrow();
  });
});
