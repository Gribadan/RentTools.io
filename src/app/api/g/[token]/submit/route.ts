import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { encryptGuestData, hashShareToken } from "@/lib/precheckin-crypto";
import { findSubmissionByPublicToken, publicSubmissionState, sameOriginRequest } from "@/lib/guest-form-security";
import { validatePrecheckinPayload } from "@/lib/precheckin";
import { randomUUID } from "node:crypto";

// RT-25.2 — public submit endpoint for the pre-arrival guest form.
// Anyone with the share token can POST once; subsequent POSTs to an
// already-submitted token are rejected so a stale link can't be reused
// by an unintended party. The request is gated by token possession
// only, no auth — that's the whole point of the share link.

interface AnswerOut {
  fieldId: string;
  type: string;
  label: string;
  value: unknown;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || token.length < 32 || token.length > 180) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }
    if (!sameOriginRequest(request)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > 256_000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const limit = checkRateLimit(`guest-submit:${hashShareToken(token)}:${clientIp(request)}`, 8, 15 * 60);
    if (!limit.ok) {
      return NextResponse.json(
        { error: "Too many attempts" },
        { status: 429, headers: { "Retry-After": String(limit.resetSeconds) } },
      );
    }

    const submission = await findSubmissionByPublicToken(token);
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
    // NOTE: property.feedToken is an opt-in token that gates the public iCal
    // feed (`null = public`). It is deliberately NOT required here: coupling
    // the guest form to it would dead-end every link already sent out by a
    // property that never opted in. Outgoing feeds are scrubbed of guest names
    // unconditionally in lib/feed.ts, so the privacy goal holds either way.
    const state = publicSubmissionState(submission);
    if (state === "revoked" || state === "expired") {
      return NextResponse.json({ error: "This link is no longer active." }, { status: 410 });
    }
    if (state === "submitted") {
      return NextResponse.json(
        { error: "This form has already been submitted." },
        { status: 409 }
      );
    }

    const body = await request.json().catch(() => null);
    const incoming = body?.answers;
    if (!incoming || typeof incoming !== "object") {
      return NextResponse.json({ error: "Missing answers" }, { status: 400 });
    }

    const fields: Array<{
      id: string;
      type: string;
      label: string;
      required: boolean;
    }> = JSON.parse(submission.template.fields);

    const answers: AnswerOut[] = [];
    for (const f of fields) {
      const raw = (incoming as Record<string, unknown>)[f.id];
      const isEmpty =
        raw === undefined ||
        raw === null ||
        raw === "" ||
        (Array.isArray(raw) && raw.length === 0);
      if (f.required && isEmpty) {
        return NextResponse.json(
          { error: `Required: ${f.label || f.id}` },
          { status: 400 }
        );
      }
      answers.push({
        fieldId: f.id,
        type: f.type,
        label: f.label,
        value: isEmpty ? null : raw,
      });
    }

    // The structured traveler block is opt-in per reservation. The host opts in
    // by setting the confirmed traveler count, which is also what the dashboard
    // requires before it will offer the new pre-check-in link. Without it this
    // stays the simple custom-question form it has always been, so a template
    // that only asks "what time do you arrive?" keeps working for guests
    // exactly as it did before this change.
    const precheckinRequired = submission.reservation.bookedGuestCount != null;

    if (!precheckinRequired) {
      await prisma.guestFormSubmission.update({
        where: { id: submission.id },
        data: {
          answers: JSON.stringify(answers),
          status: "COMPLETE",
          submittedAt: new Date(),
          lastChangedAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, status: "COMPLETE" });
    }

    const checkIn = submission.reservation.checkIn.toISOString().slice(0, 10);
    const checkOut = submission.reservation.checkOut.toISOString().slice(0, 10);
    const validation = validatePrecheckinPayload(
      { ...(body?.precheckin ?? {}), customAnswers: answers },
      {
        checkIn,
        checkOut,
        maxTravelers: submission.reservation.bookedGuestCount ?? undefined,
      },
    );
    if (!validation.ok || !validation.payload) {
      return NextResponse.json({ error: "Traveler data is incomplete", fields: validation.errors }, { status: 400 });
    }
    const securePayload = encryptGuestData({
      ...validation.payload,
      travelers: validation.payload.travelers.map((traveler) => ({
        ...traveler,
        // Do not trust the browser's clientId as the durable identity used by
        // eVisitor receipts and duplicate-send protection.
        guestId: randomUUID(),
      })),
    });

    await prisma.guestFormSubmission.update({
      where: { id: submission.id },
      data: {
        // New structured submissions are encrypted as one canonical payload.
        // `answers` remains only for reading legacy rows created before this
        // hardening change.
        answers: "[]",
        securePayload,
        status: "OWNER_REVIEW_REQUIRED",
        submittedAt: new Date(),
        lastChangedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, status: "OWNER_REVIEW_REQUIRED" });
  } catch (err) {
    console.error("Guest submit failed:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
