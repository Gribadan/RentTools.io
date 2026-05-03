/**
 * Text sanitization helpers for passport-extracted fields.
 *
 * Used by /api/extract (Gemini OCR output) and /api/guests/[id] (manual edits)
 * to keep field values consistent: Latin-only, no diacritics, no leading/
 * trailing whitespace.
 */

const CYRILLIC_MAP: Record<string, string> = {
  "А":"A","Б":"B","В":"V","Г":"G","Д":"D","Е":"E","Ё":"YO","Ж":"ZH",
  "З":"Z","И":"I","Й":"Y","К":"K","Л":"L","М":"M","Н":"N","О":"O",
  "П":"P","Р":"R","С":"S","Т":"T","У":"U","Ф":"F","Х":"KH","Ц":"TS",
  "Ч":"CH","Ш":"SH","Щ":"SHCH","Ъ":"","Ы":"Y","Ь":"","Э":"E","Ю":"YU","Я":"YA",
  "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh",
  "з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o",
  "п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts",
  "ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"","э":"e","ю":"yu","я":"ya",
};

/** Map Cyrillic chars to ASCII per the GOST-style table above. */
export function transliterate(text: string): string {
  return text.split("").map((ch) => CYRILLIC_MAP[ch] ?? ch).join("");
}

/** Remove combining diacritics via NFD normalization. */
export function stripDiacritics(str: string): string {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Transliterate, strip diacritics, trim — for free-text fields like names. */
export function sanitizeText(text: string): string {
  return stripDiacritics(transliterate(text)).trim();
}

/**
 * Like sanitizeText but additionally drops any non-alphanumeric character
 * (replacing it with a single space). Use for fields like "issuedBy" that
 * must be Latin letters/digits only.
 */
export function sanitizeAlphanumeric(text: string): string {
  return stripDiacritics(transliterate(text))
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Transliterate + remove ALL whitespace — for passport numbers. */
export function stripSpaces(text: string): string {
  return stripDiacritics(transliterate(text)).replace(/\s+/g, "").trim();
}
