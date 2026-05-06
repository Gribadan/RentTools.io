import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hashClientIp } from "@/lib/client-ip";
import { log } from "@/lib/logger";

// Hard limits — match what the Feedback Prisma model enforces and what
// the client-side counter shows so the user never gets a 400 for length
// they couldn't see coming.
const BODY_MIN = 5;
const BODY_MAX = 2000;
const EMAIL_MAX = 200;
const PAGE_PATH_MAX = 500;
const USER_AGENT_MAX = 250;
const RATE_LIMIT_SECONDS = 30;
// Loosely-matched email shape — strict RFC 5322 is overkill for an
// optional "send me a reply" field. We just want to reject obvious noise.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface FeedbackBody {
  body?: unknown;
  contactEmail?: unknown;
  pagePath?: unknown;
  // Honeypot: if a non-empty value is submitted here, the request is
  // almost certainly a bot — humans never see or fill the field.
  // Silent 200 so the bot thinks it succeeded and doesn't retry.
  website?: unknown;
}

/**
 * POST /api/feedback — accept a single feedback message from any visitor
 * (signed-in or anonymous), enforce a 30-second per-IP rate limit, and
 * persist for super-admin review at /dashboard/admin/content/feedback.
 *
 * Defences (in order):
 *   1. Honeypot field `website` — if filled, return ok without persisting
 *      so the bot's automated form-filler treats it as success and moves
 *      on. No measurable cost to legit traffic.
 *   2. Body length 5–2000 chars (matches Feedback model). Strict on the
 *      lower bound to keep the queue scannable.
 *   3. Optional contactEmail ≤200 chars + loose shape match.
 *   4. ipHash + 30s rate limit at the DB layer (single indexed query).
 *      Returns 429 with a Retry-After header so well-behaved clients
 *      back off.
 *   5. SHA-256 IP hash never persists the raw IP — survives a DB leak
 *      without exposing visitor IPs.
 */
export async function POST(request: NextRequest) {
  let body: FeedbackBody;
  try {
    body = (await request.json()) as FeedbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 1. Honeypot. Real users don't fill an aria-hidden field; bots do.
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    log({
      level: "info",
      msg: "feedback_honeypot_caught",
      ipHash: hashClientIp(request),
    });
    return NextResponse.json({ ok: true });
  }

  // 2. Body validation.
  if (typeof body.body !== "string") {
    return NextResponse.json({ error: "Body is required" }, { status: 400 });
  }
  const message = body.body.trim();
  if (message.length < BODY_MIN) {
    return NextResponse.json(
      { error: `Tell us a little more — at least ${BODY_MIN} characters.` },
      { status: 400 },
    );
  }
  if (message.length > BODY_MAX) {
    return NextResponse.json(
      { error: `Keep it under ${BODY_MAX} characters.` },
      { status: 400 },
    );
  }

  // 3. Optional email.
  let contactEmail: string | null = null;
  if (typeof body.contactEmail === "string") {
    const trimmed = body.contactEmail.trim();
    if (trimmed.length > 0) {
      if (trimmed.length > EMAIL_MAX || !EMAIL_RE.test(trimmed)) {
        return NextResponse.json({ error: "That doesn't look like an email." }, { status: 400 });
      }
      contactEmail = trimmed;
    }
  }

  // 4. Page path (optional client breadcrumb — useful when triaging).
  const pagePath =
    typeof body.pagePath === "string"
      ? body.pagePath.slice(0, PAGE_PATH_MAX)
      : "";

  const userAgent = (request.headers.get("user-agent") ?? "").slice(0, USER_AGENT_MAX);
  const ipHash = hashClientIp(request);

  // 5. Rate limit. Indexed on (ipHash, createdAt).
  const cutoff = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000);
  const recent = await prisma.feedback.findFirst({
    where: { ipHash, createdAt: { gte: cutoff } },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  if (recent) {
    const elapsedSec = Math.floor((Date.now() - recent.createdAt.getTime()) / 1000);
    const retryAfter = Math.max(1, RATE_LIMIT_SECONDS - elapsedSec);
    return NextResponse.json(
      { error: `Please wait ${retryAfter}s before sending another message.` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  // 6. Persist. Attach userId when the visitor is signed in so the admin
  //    queue can show who said what. Anonymous = userId null.
  const session = await getSession();
  await prisma.feedback.create({
    data: {
      body: message,
      contactEmail,
      pagePath,
      userAgent,
      ipHash,
      userId: session?.userId ?? null,
    },
  });

  return NextResponse.json({ ok: true });
}
