import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getSetting } from "@/lib/site-settings";
import { claimOnboardingDraft } from "@/lib/onboarding";

export async function POST(request: NextRequest) {
  try {
    const signupEnabled = await getSetting("signup_enabled", "true");
    if (signupEnabled !== "true") {
      return NextResponse.json(
        { error: "Signups are temporarily disabled" },
        { status: 403 }
      );
    }

    // Rate limit signup separately from login: 5 attempts per IP per minute
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

    const { username, password } = await request.json();

    if (typeof username !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const trimmed = username.trim();
    if (trimmed.length < 3) {
      return NextResponse.json(
        { error: "Username must be at least 3 characters" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username: trimmed } });
    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: { username: trimmed, password: hashedPassword, role: "user" },
      select: { id: true, username: true, role: true },
    });

    await createSession(user.id, user.username, user.role);
    await claimOnboardingDraft(user.id);

    return NextResponse.json({ user });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
