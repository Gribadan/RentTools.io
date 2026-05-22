import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getSetting } from "@/lib/site-settings";
import { checkPasswordStrength } from "@/lib/security/password-strength";
import { createEmailCode, normalizeEmail } from "@/lib/email-code";
import { sendVerificationCodeEmail } from "@/lib/email";

// POST /api/auth/signup — step 1 of email-verified registration.
//
// This no longer creates the account. It validates the email +
// password, stashes the hashed password in a short-lived EmailCode
// row, and emails a 6-digit code. The account is created only once
// the code is confirmed at /api/auth/verify-email — so an unverified
// (or typo'd) address never leaves a half-built User behind.
export async function POST(request: NextRequest) {
  try {
    const signupEnabled = await getSetting("signup_enabled", "true");
    if (signupEnabled !== "true") {
      return NextResponse.json(
        { error: "Signups are temporarily disabled" },
        { status: 403 }
      );
    }

    const ip = clientIp(request);
    const rl = checkRateLimit(`signup:${ip}`, 5, 60);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many signup attempts. Try again in ${rl.resetSeconds}s.` },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.resetSeconds),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const password = body?.password;

    if (!email) {
      return NextResponse.json(
        { error: "Enter a valid email address" },
        { status: 400 }
      );
    }
    if (typeof password !== "string") {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }
    const strength = checkPasswordStrength(password, email);
    if (!strength.ok) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }

    // The email is the account identity — it lands in both `username`
    // (the login lookup key) and `email`. Reject if either already
    // points at an account.
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username: email }, { email }] },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const code = await createEmailCode({ purpose: "signup", email, passwordHash });

    const sent = await sendVerificationCodeEmail(email, code);
    if (!sent.ok) {
      return NextResponse.json(
        { error: "We couldn't send the verification email. Please try again shortly." },
        { status: 502 }
      );
    }

    return NextResponse.json({ pending: true, email });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
