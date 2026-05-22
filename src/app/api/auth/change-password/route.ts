import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, verifyPassword, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { checkPasswordStrength } from "@/lib/security/password-strength";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await request.json();

    if (typeof newPassword !== "string") {
      return NextResponse.json({ error: "New password required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const strength = checkPasswordStrength(newPassword, user.username);
    if (!strength.ok) {
      return NextResponse.json({ error: strength.reason }, { status: 400 });
    }

    // An account that already has a real password must prove it — this
    // is what stops a hijacked session from silently changing it. A
    // Google-sign-in account (hasPassword:false) has only an unusable
    // random placeholder, so it sets the first password without one.
    if (user.hasPassword) {
      if (typeof currentPassword !== "string") {
        return NextResponse.json({ error: "Current password required" }, { status: 400 });
      }
      const ok = await verifyPassword(currentPassword, user.password);
      if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, hasPassword: true },
    });
    await logAudit(session.userId, "update", "user", user.id, { passwordChanged: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
