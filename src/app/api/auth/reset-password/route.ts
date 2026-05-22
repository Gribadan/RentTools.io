import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { checkPasswordStrength } from "@/lib/security/password-strength";
import { consumeEmailCode, normalizeEmail, verifyEmailCode } from "@/lib/email-code";

// POST /api/auth/reset-password — step 2 of password reset.
//
// Confirms the 6-digit code from /api/auth/forgot-password and sets the
// new password. No session is created — the user signs in afterwards
// with the new password, which also confirms they remember it.
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const rl = checkRateLimit(`reset-password:${ip}`, 10, 60);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rl.resetSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
      );
    }

    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const code = typeof body?.code === "string" ? body.code.trim() : "";
    const newPassword = body?.newPassword;

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code required" }, { status: 400 });
    }
    if (typeof newPassword !== "string") {
      return NextResponse.json({ error: "New password required" }, { status: 400 });
    }
    const strength = checkPasswordStrength(newPassword, email);
    if (!strength.ok) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }

    const result = await verifyEmailCode({ purpose: "reset", email, code });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    if (!result.userId) {
      return NextResponse.json(
        { error: "This code can't be used to reset a password. Start over." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: result.userId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Account no longer exists" }, { status: 404 });
    }

    const hashed = await hashPassword(newPassword);
    // hasPassword:true — a reset gives even a Google-only account a
    // real password it can sign in with.
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, hasPassword: true },
    });
    await consumeEmailCode(result.id);
    await logAudit(user.id, "update", "user", user.id, { passwordReset: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
