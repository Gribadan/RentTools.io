import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { canManageProperty } from "@/lib/ownership";
import {
  decryptGuestData,
  encryptGuestData,
  guestDataEncryptionReady,
  hashShareToken,
  maskDocumentNumber,
} from "@/lib/precheckin-crypto";
import {
  decryptOwnerShareToken,
  guestFormExpiry,
  mintGuestFormToken,
} from "@/lib/guest-form-security";
import { precheckinWarnings, type PrecheckinPayload } from "@/lib/precheckin";

// RT-25.2 — find-or-create a GuestFormSubmission for this reservation
// against the property's first GuestFormTemplate. Returns the share
// token + relative public URL the host can copy and send to the guest.
// Idempotent: re-POSTing returns the same submission (and same token)
// rather than creating duplicates, so the UI can call this every time
// the host clicks "send pre-arrival form".

interface AnswerOut {
  fieldId: string;
  type: string;
  label: string;
  value: unknown;
}

// Read-only — return current submission state (or null) without
// creating one. Used by reservation-view to know whether to show
// "Not sent" / "Awaiting" / submitted-answers panel.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.impersonatorId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const reservation = await prisma.reservation.findUnique({
      where: { id: numId },
      select: { id: true, propertyId: true },
    });
    if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!(await canManageProperty(reservation.propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const submission = await prisma.guestFormSubmission.findFirst({
      where: { reservationId: numId },
      orderBy: { createdAt: "asc" },
    });
    if (!submission) return NextResponse.json({ submission: null });

    let answers: AnswerOut[] = [];
    try {
      const parsed = JSON.parse(submission.answers);
      if (Array.isArray(parsed)) answers = parsed as AnswerOut[];
    } catch {
      // malformed JSON — treat as empty
    }

    let securePayload: PrecheckinPayload | null = null;
    if (submission.securePayload) {
      try {
        securePayload = decryptGuestData<PrecheckinPayload>(submission.securePayload);
      } catch {
        // Fail closed: a missing/wrong key must never fall back to plaintext.
      }
    }
    const rawToken = decryptOwnerShareToken(submission.tokenCiphertext);

    return NextResponse.json({
      submission: {
        shareUrl: rawToken
          ? `/g/${rawToken}`
          : submission.tokenHash
            ? null
            : `/g/${submission.shareToken}`,
        sentAt: submission.createdAt,
        submittedAt: submission.submittedAt,
        status: submission.status,
        expiresAt: submission.expiresAt,
        revokedAt: submission.revokedAt,
        ownerApprovedAt: submission.ownerApprovedAt,
        lastChangedAt: submission.lastChangedAt,
        travelerCount: securePayload?.travelers.length ?? 0,
        warnings: securePayload ? precheckinWarnings(securePayload) : [],
        travelers: securePayload?.travelers.map((traveler) => ({
          clientId: traveler.clientId,
          isLead: traveler.isLead,
          firstName: traveler.firstName,
          lastName: traveler.lastName,
          dateOfBirth: traveler.dateOfBirth,
          gender: traveler.gender,
          citizenshipCountry: traveler.citizenshipCountry,
          birthCountry: traveler.birthCountry,
          birthPlace: traveler.birthPlace,
          residenceCountry: traveler.residenceCountry,
          residencePlace: traveler.residencePlace,
          residenceAddress: traveler.residenceAddress,
          documentType: traveler.documentType,
          documentNumberMasked: maskDocumentNumber(traveler.documentNumber),
          borderEntryDate: traveler.borderEntryDate,
          borderEntryPlace: traveler.borderEntryPlace,
          borderEntryPoint: traveler.borderEntryPoint,
          taxCategorySuggestion: traveler.taxCategorySuggestion,
        })) ?? [],
        answers: submission.submittedAt
          ? securePayload?.customAnswers ?? answers
          : [],
      },
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.impersonatorId) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const reservation = await prisma.reservation.findUnique({
      where: { id: numId },
      select: {
        id: true,
        propertyId: true,
        checkOut: true,
        bookedGuestCount: true,
        property: { select: { feedToken: true } },
      },
    });
    if (!reservation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!(await canManageProperty(reservation.propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const template = await prisma.guestFormTemplate.findFirst({
      where: { propertyId: reservation.propertyId },
      orderBy: { createdAt: "asc" },
    });
    if (!template) {
      return NextResponse.json(
        { error: "No guest-form template configured for this property" },
        { status: 400 }
      );
    }

    // property.feedToken (opt-in, `null = public`) gates the public iCal feed,
    // not this form. It used to be required here, which dead-ended the guest
    // form for every property that never opted in — including links already
    // sent. Outgoing feeds are scrubbed of guest names unconditionally in
    // lib/feed.ts, so the privacy goal is met without the coupling.
    //
    // bookedGuestCount is likewise optional: when it is unset the link is a
    // plain custom-question form (the behaviour every existing reservation has
    // today), and setting it is what opts the reservation into the structured
    // traveler block. See ../../../g/[token]/submit/route.ts.

    if (!guestDataEncryptionReady()) {
      return NextResponse.json(
        { error: "Secure guest-data storage is not configured" },
        { status: 503 },
      );
    }

    const existing = await prisma.guestFormSubmission.findFirst({
      where: { reservationId: numId, templateId: template.id },
      orderBy: { createdAt: "asc" },
    });

    if (existing && !existing.revokedAt && (!existing.expiresAt || existing.expiresAt > new Date())) {
      const existingToken = decryptOwnerShareToken(existing.tokenCiphertext);
      if (existingToken) {
        return NextResponse.json({
          shareUrl: `/g/${existingToken}`,
          submittedAt: existing.submittedAt,
          status: existing.status,
          expiresAt: existing.expiresAt,
        });
      }
    }

    const rawToken = mintGuestFormToken();
    const tokenHash = hashShareToken(rawToken);
    const tokenCiphertext = encryptGuestData({ token: rawToken });
    const expiresAt = guestFormExpiry(reservation.checkOut);
    // Re-issuing a link must never throw away what the guest already sent.
    // This branch is reached for legacy rows (no ciphertext to decrypt), for
    // expired links, and after a key rotation — in all of which the old code
    // blanked securePayload/answers/submittedAt, silently destroying a
    // completed submission. Only an explicit revoke clears the payload now.
    const wasRevoked = !!existing?.revokedAt || existing?.status === "REVOKED";
    const submission = existing
      ? await prisma.guestFormSubmission.update({
          where: { id: existing.id },
          data: {
            shareToken: `hashed:${tokenHash}`,
            tokenHash,
            tokenCiphertext,
            expiresAt,
            revokedAt: null,
            lastChangedAt: new Date(),
            updatedAt: new Date(),
            ...(wasRevoked
              ? {
                  status: "INVITED",
                  securePayload: "",
                  answers: "[]",
                  submittedAt: null,
                  ownerApprovedAt: null,
                }
              : { status: existing.submittedAt ? existing.status : "INVITED" }),
          },
        })
      : await prisma.guestFormSubmission.create({
        data: {
          reservationId: numId,
          templateId: template.id,
          shareToken: `hashed:${tokenHash}`,
          tokenHash,
          tokenCiphertext,
          status: "INVITED",
          expiresAt,
          lastChangedAt: new Date(),
        },
      });

    return NextResponse.json({
      shareUrl: `/g/${rawToken}`,
      submittedAt: submission.submittedAt,
      status: submission.status,
      expiresAt: submission.expiresAt,
    });
  } catch (err) {
    console.error("Route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (session.impersonatorId) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const { id } = await params;
    const reservationId = Number(id);
    if (!Number.isInteger(reservationId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      select: { propertyId: true },
    });
    if (!reservation || !(await canManageProperty(reservation.propertyId, session.userId, session.role))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const submission = await prisma.guestFormSubmission.findFirst({
      where: { reservationId },
      orderBy: { createdAt: "asc" },
    });
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await request.json().catch(() => null);
    const action = body?.action;
    if (action === "revoke") {
      await prisma.guestFormSubmission.update({
        where: { id: submission.id },
        data: { status: "REVOKED", revokedAt: new Date(), tokenCiphertext: null, lastChangedAt: new Date(), updatedAt: new Date() },
      });
      return NextResponse.json({ status: "REVOKED" });
    }
    if (action === "approve") {
      if (submission.status !== "OWNER_REVIEW_REQUIRED" || !submission.securePayload) {
        return NextResponse.json({ error: "Completed traveler data is required" }, { status: 409 });
      }
      await prisma.guestFormSubmission.update({
        where: { id: submission.id },
        data: { status: "OWNER_APPROVED", ownerApprovedAt: new Date(), lastChangedAt: new Date(), updatedAt: new Date() },
      });
      return NextResponse.json({ status: "OWNER_APPROVED" });
    }
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err) {
    console.error("Route error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
