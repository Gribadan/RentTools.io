import type { Locale } from "./translations";

export const LOCALE_COOKIE_NAME = "rt-locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ru";
}

export function parseLocaleFromCookieHeader(
  cookieHeader: string | null | undefined
): Locale | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    if (name !== LOCALE_COOKIE_NAME) continue;
    const raw = decodeURIComponent(part.slice(eq + 1).trim());
    if (isLocale(raw)) return raw;
    return null;
  }
  return null;
}

export function buildLocaleCookieString(
  locale: Locale,
  opts: { secure?: boolean } = {}
): string {
  const secure = opts.secure ?? true;
  const base = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(locale)}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
  return secure ? `${base}; Secure` : base;
}

export function readLocaleCookieFromDocument(
  doc: { cookie: string } | null | undefined
): Locale | null {
  if (!doc) return null;
  return parseLocaleFromCookieHeader(doc.cookie);
}

export function writeLocaleCookieToDocument(
  doc: { cookie: string } | null | undefined,
  locale: Locale,
  opts: { secure?: boolean } = {}
): void {
  if (!doc) return;
  doc.cookie = buildLocaleCookieString(locale, opts);
}
