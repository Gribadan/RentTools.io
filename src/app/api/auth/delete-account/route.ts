import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, verifyPassword, clearSession } from "@/lib/auth";

// Permanently delete the calling user's account and everything tied to
// them. Property cascades cover Reservation/Guest/CalendarLink/etc., but
// ExtractionLog and AuditLog have no FK by design (audit history
// generally outlives user deletion) — we wipe them here because the
// user is asking us to forget them. Sessions are cleared on the way out
// so the next request kicks them to /login.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      password?: unknown;
      confirmUsername?: unknown;
    };
    const password = typeof body.password === "string" ? body.password : "";
    const confirmUsername =
      typeof body.confirmUsername === "string" ? body.confirmUsername : "";

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }
    if (confirmUsername !== session.username) {
      return NextResponse.json(
        { error: "Username confirmation does not match" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, password: true, role: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
    }

    // Refuse to delete the last superadmin so the instance can't be
    // locked out by accident — the owner can always create another
    // superadmin and try again.
    if (user.role === "superadmin") {
      const otherAdmins = await prisma.user.count({
        where: { role: "superadmin", id: { not: user.id } },
      });
      if (otherAdmins === 0) {
        return NextResponse.json(
          {
            error:
              "Cannot delete the last superadmin. Promote another user to superadmin first.",
          },
          { status: 409 }
        );
      }
    }

    // Wipe non-cascading rows first, then the user. Cascades on
    // Property/CleanerAssignment/PropertyManager/PropertyManagerInvite
    // handle nested data automatically.
    await prisma.extractionLog.deleteMany({ where: { userId: user.id } });
    await prisma.auditLog.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    await clearSession();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
