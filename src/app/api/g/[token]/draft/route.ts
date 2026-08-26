import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { findSubmissionByPublicToken, publicSubmissionState, sameOriginRequest } from "@/lib/guest-form-security";
import { encryptGuestData, hashShareToken } from "@/lib/precheckin-crypto";
import { sanitizePrecheckinDraft } from "@/lib/precheckin";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token || token.length < 32 || token.length > 180) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    if (!sameOriginRequest(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 256_000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const limit = checkRateLimit(`guest-draft:${hashShareToken(token)}:${clientIp(request)}`, 60, 15 * 60);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many attempts" },
        { status: 429, headers: { "Retry-After": String(limit.resetSeconds) } },
      );
    }
    const submission = await findSubmissionByPublicToken(token);
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // See the note in ../submit/route.ts: property.feedToken gates the public
    // iCal feed, not this form, and requiring it here would break links that
    // are already in guests' hands.
    const state = publicSubmissionState(submission);
    if (state !== "active") {
      return NextResponse.json({ error: "This link is no longer editable." }, { status: 409 });
    }
    const body = await request.json().catch(() => null);
    const draft = sanitizePrecheckinDraft(body?.precheckin);
    await prisma.guestFormSubmission.update({
      where: { id: submission.id },
      data: {
        securePayload: encryptGuestData(draft),
        status: "IN_PROGRESS",
        lastChangedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return NextResponse.json({ success: true, status: "IN_PROGRESS" });
  } catch (err) {
    console.error("Guest draft save failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
