import { afterEach, describe, expect, it } from "vitest";
import {
  decryptGuestData,
  encryptGuestData,
  guestDataEncryptionReady,
  hashShareToken,
  maskDocumentNumber,
} from "@/lib/precheckin-crypto";

const previousEnvironment = {
  key: process.env.GUEST_DATA_ENCRYPTION_KEY,
  version: process.env.GUEST_DATA_ENCRYPTION_KEY_VERSION,
  previousKeys: process.env.GUEST_DATA_ENCRYPTION_PREVIOUS_KEYS,
};

afterEach(() => {
  for (const [name, value] of [
    ["GUEST_DATA_ENCRYPTION_KEY", previousEnvironment.key],
    ["GUEST_DATA_ENCRYPTION_KEY_VERSION", previousEnvironment.version],
    ["GUEST_DATA_ENCRYPTION_PREVIOUS_KEYS", previousEnvironment.previousKeys],
  ] as const) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

describe("precheckin encryption", () => {
  it("fails closed without a key", () => {
    delete process.env.GUEST_DATA_ENCRYPTION_KEY;
    expect(guestDataEncryptionReady()).toBe(false);
    expect(() => encryptGuestData({ passport: "ABC123" })).toThrow(/not configured/);
  });

  it("round-trips authenticated encrypted JSON", () => {
    process.env.GUEST_DATA_ENCRYPTION_KEY = "11".repeat(32);
    const encrypted = encryptGuestData({ passport: "ABC123" });
    expect(encrypted).not.toContain("ABC123");
    expect(decryptGuestData(encrypted)).toEqual({ passport: "ABC123" });
  });

  it("reads v1 after rotating writes to v2", () => {
    const v1Key = "11".repeat(32);
    const v2Key = "22".repeat(32);
    process.env.GUEST_DATA_ENCRYPTION_KEY = v1Key;
    const legacy = encryptGuestData({ passport: "LEGACY" });
    expect(legacy.startsWith("v1.")).toBe(true);

    process.env.GUEST_DATA_ENCRYPTION_KEY_VERSION = "v2";
    process.env.GUEST_DATA_ENCRYPTION_KEY = v2Key;
    process.env.GUEST_DATA_ENCRYPTION_PREVIOUS_KEYS = JSON.stringify({ v1: v1Key });

    const current = encryptGuestData({ passport: "CURRENT" });
    expect(current.startsWith("v2.")).toBe(true);
    expect(decryptGuestData(legacy)).toEqual({ passport: "LEGACY" });
    expect(decryptGuestData(current)).toEqual({ passport: "CURRENT" });
  });

  it("fails closed for an unknown payload version", () => {
    process.env.GUEST_DATA_ENCRYPTION_KEY_VERSION = "v2";
    process.env.GUEST_DATA_ENCRYPTION_KEY = "22".repeat(32);
    expect(() => decryptGuestData("v9.AAAAAAAAAAAAAAAA.AAAAAAAAAAAAAAAAAAAAAA.AA"))
      .toThrow(/not configured/);
  });

  it("hashes share tokens and masks documents", () => {
    expect(hashShareToken("secret")).toHaveLength(64);
    expect(maskDocumentNumber("ABCD123456")).toBe("••••••3456");
    expect(maskDocumentNumber("1234")).toBe("••••");
  });
});
