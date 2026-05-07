import type { Locale } from "@/lib/i18n/translations";

/**
 * Mapping from our internal locale code (`Locale` union, e.g. "en", "ru")
 * to the format third-party APIs expect. These are exhaustive lookup
 * tables typed as `Record<Locale, string>`, so adding a new value to the
 * Locale union forces a compile error here until the new mapping is
 * filled in. No more `locale === "ru" ? "ru_RU" : "en_US"` ternaries
 * scattered across the codebase silently falling back to English.
 */

/**
 * Open Graph locale tag (`og:locale` meta property). Format is
 * `<language>_<COUNTRY>` per the OG spec. Picking a country code is
 * unavoidable — `en_US` / `en_GB` / `en_AU` are all valid; we pick the
 * dominant variant for each language.
 */
export const OG_LOCALE: Record<Locale, string> = {
  en: "en_US",
  ru: "ru_RU",
  de: "de_DE",
};

export function toOgLocale(locale: Locale): string {
  return OG_LOCALE[locale];
}

/**
 * BCP-47 language tag for `Intl` APIs (toLocaleDateString, Intl.DateTimeFormat,
 * Intl.NumberFormat, etc.). Format is `<language>-<REGION>`. EN uses
 * `en-GB` because we're EU-targeting day-month order; RU uses `ru-RU`.
 */
export const BCP47_TAG: Record<Locale, string> = {
  en: "en-GB",
  ru: "ru-RU",
  de: "de-DE",
};

export function toBcp47(locale: Locale): string {
  return BCP47_TAG[locale];
}
