import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const DEFAULT_VERSION = "v1";
const VERSION_PATTERN = /^v[1-9][0-9]*$/;

function decodeKey(raw: string, label: string): Buffer {
  const key = /^[0-9a-f]{64}$/i.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (key.length !== 32) throw new Error(`${label} must decode to 32 bytes`);
  return key;
}

function currentVersion(): string {
  const version = process.env.GUEST_DATA_ENCRYPTION_KEY_VERSION?.trim() || DEFAULT_VERSION;
  if (!VERSION_PATTERN.test(version)) {
    throw new Error("GUEST_DATA_ENCRYPTION_KEY_VERSION must be v1, v2, ...");
  }
  return version;
}

function currentKey(): Buffer {
  const raw = process.env.GUEST_DATA_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("GUEST_DATA_ENCRYPTION_KEY is not configured");
  return decodeKey(raw, "GUEST_DATA_ENCRYPTION_KEY");
}

function previousKeys(): Map<string, Buffer> {
  const raw = process.env.GUEST_DATA_ENCRYPTION_PREVIOUS_KEYS?.trim();
  if (!raw) return new Map();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("GUEST_DATA_ENCRYPTION_PREVIOUS_KEYS must be a JSON object");
  }
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("GUEST_DATA_ENCRYPTION_PREVIOUS_KEYS must be a JSON object");
  }

  const current = currentVersion();
  const result = new Map<string, Buffer>();
  for (const [version, value] of Object.entries(parsed)) {
    if (!VERSION_PATTERN.test(version) || typeof value !== "string" || !value.trim()) {
      throw new Error("GUEST_DATA_ENCRYPTION_PREVIOUS_KEYS contains an invalid entry");
    }
    if (version === current) {
      throw new Error("The current guest-data key version must not also be configured as a previous key");
    }
    result.set(version, decodeKey(value.trim(), `Guest-data key ${version}`));
  }
  return result;
}

function keyForVersion(version: string): Buffer {
  if (!VERSION_PATTERN.test(version)) {
    throw new Error("Unsupported encrypted guest-data payload");
  }
  if (version === currentVersion()) return currentKey();
  const key = previousKeys().get(version);
  if (!key) throw new Error(`Guest-data key ${version} is not configured`);
  return key;
}

export function guestDataEncryptionReady(): boolean {
  try {
    currentVersion();
    currentKey();
    previousKeys();
    return true;
  } catch {
    return false;
  }
}

export function hashShareToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function encryptGuestData(value: unknown): string {
  const version = currentVersion();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", currentKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(value), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [version, iv.toString("base64url"), tag.toString("base64url"), ciphertext.toString("base64url")].join(".");
}

export function decryptGuestData<T>(encrypted: string): T {
  const [version, ivPart, tagPart, ciphertextPart] = encrypted.split(".");
  if (!version || !ivPart || !tagPart || !ciphertextPart || encrypted.split(".").length !== 4) {
    throw new Error("Unsupported encrypted guest-data payload");
  }
  const decipher = createDecipheriv("aes-256-gcm", keyForVersion(version), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertextPart, "base64url")),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8")) as T;
}

export function maskDocumentNumber(value: string): string {
  if (value.length <= 4) return "••••";
  return `${"•".repeat(Math.min(8, value.length - 4))}${value.slice(-4)}`;
}
