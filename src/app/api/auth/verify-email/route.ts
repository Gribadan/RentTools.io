import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { claimOnboardingDraft } from "@/lib/onboarding";
import { consumeEmailCode, normalizeEmail, verifyEmailCode } from "@/lib/email-code";

// POST /api/auth/verify-email — step 2 of email-verified registration.
//
// Confirms the 6-digit code emailed by /api/auth/signup, then creates
// the account using the password hash stashed on the code row and logs
// the new user straight in.
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rl = checkRateLimit(`verify-email:${ip}`, 10, 60);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rl.resetSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
      );
    }

    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const code = typeof body?.code === "string" ? body.code.trim() : "";

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }

    const result = await verifyEmailCode({ purpose: "signup", email, code });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!result.passwordHash) {
      // Defensive — a "signup" code always carries the pending hash.
      return NextResponse.json(
        { error: "This code can't be used to create an account. Start over." },
        { status: 400 }
      );
    }

    // Re-check uniqueness — the address could have been claimed between
    // signup and verification. If so, burn the code so it can't linger.
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: email }, { email }] },
      select: { id: true },
    });
    if (existing) {
      await consumeEmailCode(result.id);
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        username: email,
        email,
        password: result.passwordHash,
        role: "user",
      },
      select: { id: true, username: true, role: true },
    });
    await consumeEmailCode(result.id);

    await createSession(user.id, user.username, user.role);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    await claimOnboardingDraft(user.id);

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
