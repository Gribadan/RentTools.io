/**
 * URL-safe slug from a free-form name. Used for:
 *   - Property.feedSlug — durable URL identifier for the public iCal feed
 *   - OnboardingDraft.feedSlug — same, generated before signup
 *   - Custom CalendarLink platform identifiers (when the user adds an
 *     "Other" platform with a name like "My Direct Booking Site")
 *
 * Steps:
 *   1. Transliterate Cyrillic + Latin-with-diacritics → ASCII
 *   2. Lowercase, replace runs of non-[a-z0-9] with a single hyphen
 *   3. Trim leading / trailing hyphens, collapse repeats
 *   4. Truncate to 32 chars (URLs stay short, slugs stay readable)
 *   5. Empty result → fall back to "custom-calendar"
 */

// Cyrillic transliteration map (Russian + common Belarusian / Ukrainian
// letters). Covers the maintainer's own properties (`Дом 7`, `Квартира 68`)
// and the typical RU-host audience we expect to onboard.
const CYRILLIC: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo",
  ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
  ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  // Ukrainian additions
  є: "ye", і: "i", ї: "yi", ґ: "g",
  // Belarusian additions
  ў: "u",
};

function transliterate(input: string): string {
  let out = "";
  for (const ch of input) {
    const lower = ch.toLowerCase();
    if (CYRILLIC[lower] !== undefined) {
      out += CYRILLIC[lower];
    } else {
      // NFD-normalise → strip combining diacritics → ASCII fallback
      out += lower.normalize("NFD").replace(/[̀-ͯ]/g, "");
    }
  }
  return out;
}

const FALLBACK = "custom-calendar";
const MAX_LENGTH = 32;

export function slugify(raw: string): string {
  if (!raw) return FALLBACK;
  const ascii = transliterate(raw);
  const cleaned = ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, MAX_LENGTH)
    // After truncation we may have ended on a hyphen — strip it again.
    .replace(/-+$/g, "");
  return cleaned || FALLBACK;
}

/**
 * Slug + 6-char random suffix, base64url-style. Used when we need
 * uniqueness across the table (Property.feedSlug, OnboardingDraft.feedSlug)
 * because two users will pick the same name eventually.
 *
 * The suffix length is small enough to keep URLs tidy (`tashkent-studio-A3xK9p`)
 * but big enough that collisions are vanishingly unlikely (~62^6 = 56B).
 */
export function slugWithSuffix(name: string): string {
  const base = slugify(name);
  const suffix = randomSuffix(6);
  // Cap the base so the final string stays comfortably under URL limits.
  const baseCap = MAX_LENGTH - suffix.length - 1;
  const trimmed = base.length > baseCap ? base.slice(0, baseCap).replace(/-+$/g, "") : base;
  return `${trimmed || FALLBACK}-${suffix}`;
}

function randomSuffix(length: number): string {
  const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  // Browser + Node both have crypto.getRandomValues. Node is exposed via the
  // global webcrypto in Node 22+, so we don't need a Node-specific import here.
  const buf = new Uint8Array(length);
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    globalThis.crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < length; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  for (let i = 0; i < length; i++) {
    out += ALPHABET[buf[i] % ALPHABET.length];
  }
  return out;
}
