// Password strength validator (RT-21.3).
//
// Rules:
//   1. >= 12 characters
//   2. case-insensitive comparison: must NOT match (or contain as a sole
//      substring of length >= 8) any entry in top-passwords-1000.json
//   3. case-insensitive comparison: must NOT equal the username
//
// Pulled from SecLists Pwdb_top-1000.txt — the 1000 most common
// real-world breached passwords. Bundled at module load so the check
// is sync and avoids a hot-path file read.
//
// Used by the signup, change-password, and admin user-creation routes.

import bundled from "./top-passwords-1000.json";

const TOP: ReadonlySet<string> = new Set(
  (bundled as string[]).map((s) => s.toLowerCase())
);

export interface PasswordCheck {
  ok: boolean;
  /** Reason string for the API to surface to the client. Empty when ok. */
  reason: string;
}

const MIN_LENGTH = 12;

export function checkPasswordStrength(
  password: string,
  username?: string,
): PasswordCheck {
  if (typeof password !== "string") {
    return { ok: false, reason: "Password is required" };
  }
  if (password.length < MIN_LENGTH) {
    return {
      ok: false,
      reason: `Password must be at least ${MIN_LENGTH} characters`,
    };
  }
  const lower = password.toLowerCase();
  if (TOP.has(lower)) {
    return {
      ok: false,
      reason:
        "This password appears on common breach lists. Choose something less guessable.",
    };
  }
  if (username && lower === username.trim().toLowerCase()) {
    return {
      ok: false,
      reason: "Password cannot be the same as your username",
    };
  }
  return { ok: true, reason: "" };
}

export const PASSWORD_MIN_LENGTH = MIN_LENGTH;
