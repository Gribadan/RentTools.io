import { describe, it, expect } from "vitest";
import { checkPasswordStrength, PASSWORD_MIN_LENGTH } from "./password-strength";

describe("checkPasswordStrength", () => {
  it("rejects passwords below minimum length", () => {
    const r = checkPasswordStrength("short");
    expect(r.ok).toBe(false);
    expect(r.reason).toContain(String(PASSWORD_MIN_LENGTH));
  });

  it("rejects an exact match against the breach list (12+ chars to bypass length gate)", () => {
    // "1qaz2wsx3edc" is in the bundled top-1k list and is 12 chars
    const r = checkPasswordStrength("1qaz2wsx3edc");
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/breach/i);
  });

  it("rejects when the password equals the username (case-insensitive)", () => {
    const r = checkPasswordStrength("MyUsernameXYZ", "myusernamexyz");
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/username/i);
  });

  it("accepts a long unique passphrase", () => {
    const r = checkPasswordStrength("correct horse battery staple", "alice");
    expect(r.ok).toBe(true);
    expect(r.reason).toBe("");
  });

  it("rejects non-string input", () => {
    // @ts-expect-error testing runtime guard
    const r = checkPasswordStrength(undefined);
    expect(r.ok).toBe(false);
  });
});
