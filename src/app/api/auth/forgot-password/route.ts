import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { createEmailCode, normalizeEmail } from "@/lib/email-code";
import { sendPasswordResetEmail } from "@/lib/email";

// POST /api/auth/forgot-password — step 1 of password reset.
//
// Always responds 200 with the same body regardless of whether the
// email maps to an account: leaking "this address is / isn't
// registered" is an account-enumeration vector. The reset code is only
// actually sent when a matching account exists.
export async function POST(request: NextRequest) {
  try {
    const ip = clientIp(request);
    // Strict limit — this endpoint sends email, so it's a spam vector.
    const rl = checkRateLimit(`forgot-password:${ip}`, 3, 60);
    if (!rl.ok) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${rl.resetSeconds}s.` },
        { status: 429, headers: { "Retry-After": String(rl.resetSeconds) } }
      );
    }

    const body = await request.json();
    const email = normalizeEmail(body?.email);

    if (email) {
      // The email is the identity for new accounts (username == email);
      // older username accounts may also carry it in the email column.
      const user = await prisma.user.findFirst({
        where: { OR: [{ username: email }, { email }] },
        select: { id: true, suspendedAt: true },
      });
      if (user && !user.suspendedAt) {
        const code = await createEmailCode({ purpose: "reset", email, userId: user.id });
        // Fire the email but never surface a send failure to the
        // caller — that would itself leak whether the address exists.
        await sendPasswordResetEmail(email, code).catch(() => {});
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    // Even on error, don't reveal anything — return the generic ok.
    return NextResponse.json({ ok: true });
  }
}
