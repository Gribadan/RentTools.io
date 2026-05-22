// Email verification / password-reset code lifecycle.
//
// A code is a random 6-digit string. We store only its bcrypt hash, so
// a leaked DB row can't be replayed. Each row is single-use, expires in
// 15 minutes, and is burned after a handful of wrong guesses — together
// with the API-layer rate limits that makes brute force impractical.

import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";

const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export type EmailCodePurpose = "signup" | "reset";

/** Uniform random 6-digit code, zero-padded ("000000"–"999999"). */
export function generateCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Trim + lowercase an email, or null if it isn't a plausible address. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  if (e.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return e;
}

/**
 * Issue a fresh code for an email+purpose, replacing any prior unused
 * one. Returns the plaintext code for the caller to email — it is never
 * persisted in the clear.
 */
export async function createEmailCode(params: {
  purpose: EmailCodePurpose;
  email: string;
  passwordHash?: string;
  userId?: number;
}): Promise<string> {
  const code = generateCode();
  const codeHash = await hashPassword(code);

  await prisma.emailCode.deleteMany({
    where: { email: params.email, purpose: params.purpose, consumedAt: null },
  });
  await prisma.emailCode.create({
    data: {
      purpose: params.purpose,
      email: params.email,
      codeHash,
      passwordHash: params.passwordHash ?? null,
      userId: params.userId ?? null,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
  });
  return code;
}

export type VerifyEmailCodeResult =
  | { ok: true; id: number; passwordHash: string | null; userId: number | null }
  | { ok: false; error: string };

/**
 * Check a submitted code against the latest active row. A wrong guess
 * increments the attempt counter; an expired / exhausted row is deleted.
 * On success the row is NOT consumed — the caller does that with
 * consumeEmailCode() once it has finished its own work (create the
 * user, reset the password) so a failure there doesn't burn the code.
 */
export async function verifyEmailCode(params: {
  purpose: EmailCodePurpose;
  email: string;
  code: string;
}): Promise<VerifyEmailCodeResult> {
  const record = await prisma.emailCode.findFirst({
    where: { email: params.email, purpose: params.purpose, consumedAt: null },
    orderBy: { id: "desc" },
  });
  if (!record) {
    return { ok: false, error: "No active code — request a new one." };
  }
  if (record.expiresAt.getTime() < Date.now()) {
    await prisma.emailCode.delete({ where: { id: record.id } });
    return { ok: false, error: "This code has expired — request a new one." };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.emailCode.delete({ where: { id: record.id } });
    return { ok: false, error: "Too many wrong attempts — request a new code." };
  }
  const match = await verifyPassword(params.code, record.codeHash);
  if (!match) {
    await prisma.emailCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "Incorrect code — please try again." };
  }
  return {
    ok: true,
    id: record.id,
    passwordHash: record.passwordHash,
    userId: record.userId,
  };
}

/** Mark a code row used so it can't be replayed. */
export async function consumeEmailCode(id: number): Promise<void> {
  await prisma.emailCode.update({
    where: { id },
    data: { consumedAt: new Date() },
  });
}
