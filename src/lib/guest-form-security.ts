import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { decryptGuestData, hashShareToken } from "@/lib/precheckin-crypto";

export function mintGuestFormToken(): string {
  return randomBytes(32).toString("base64url");
}

export function guestFormExpiry(checkOut: Date): Date {
  const expiry = new Date(checkOut);
  expiry.setUTCDate(expiry.getUTCDate() + 1);
  expiry.setUTCHours(23, 59, 59, 999);
  return expiry;
}

export async function findSubmissionByPublicToken(token: string) {
  if (!token || token.length < 32 || token.length > 180) return null;
  const tokenHash = hashShareToken(token);
  const hardened = await prisma.guestFormSubmission.findUnique({
    where: { tokenHash },
    include: {
      template: true,
      reservation: {
        include: { property: { select: { id: true, name: true, feedToken: true } } },
      },
    },
  });
  if (hardened) return hardened;

  // Hardened rows park the literal marker `hashed:<sha256>` in `shareToken`.
  // That string is derivable from the token, so without this guard anyone who
  // could read the column could replay it verbatim as the URL token and match
  // on the legacy branch below — handing them the decrypted identity payload
  // and the ability to overwrite the submission, which is precisely the
  // database-read threat the hashing exists to defeat.
  if (token.startsWith("hashed:")) return null;

  // Existing links issued before token hashing remain usable until their owner
  // rotates or revokes them. New links never enter this fallback path.
  return prisma.guestFormSubmission.findUnique({
    where: { shareToken: token },
    include: {
      template: true,
      reservation: {
        include: { property: { select: { id: true, name: true, feedToken: true } } },
      },
    },
  });
}

export function publicSubmissionState(submission: {
  revokedAt: Date | null;
  expiresAt: Date | null;
  submittedAt: Date | null;
  status: string;
}): "active" | "revoked" | "expired" | "submitted" {
  if (submission.revokedAt || submission.status === "REVOKED") return "revoked";
  if (submission.expiresAt && submission.expiresAt.getTime() < Date.now()) return "expired";
  if (submission.submittedAt || submission.status === "OWNER_REVIEW_REQUIRED" || submission.status === "OWNER_APPROVED") {
    return "submitted";
  }
  return "active";
}

export function decryptOwnerShareToken(tokenCiphertext: string | null): string | null {
  if (!tokenCiphertext) return null;
  try {
    const value = decryptGuestData<{ token: string }>(tokenCiphertext);
    return typeof value.token === "string" ? value.token : null;
  } catch {
    return null;
  }
}

/** Treat apex and www as the same site, so a link opened on either host works. */
function originKey(url: URL): string {
  return `${url.protocol}//${url.hostname.replace(/^www\./i, "")}${url.port ? `:${url.port}` : ""}`;
}

export function sameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  // Browser writes to a bearer-token URL must carry an Origin header. A
  // missing/opaque origin is not treated as same-origin: accepting it would
  // make the protection disappear for malformed proxy traffic and non-browser
  // replays.
  if (!origin || origin === "null") return false;
  try {
    const received = new URL(origin);

    // PUBLIC_APP_URL may list several canonical origins, comma-separated, for
    // deployments that legitimately answer on more than one hostname.
    const configured = (process.env.PUBLIC_APP_URL ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);

    // A stable canonical origin is what makes this check meaningful: deriving
    // trust from Host or X-Forwarded-Host lets a client-controlled header
    // redefine "same site". When PUBLIC_APP_URL is configured we require it.
    //
    // When it is NOT configured we fall back to the request's own origin
    // rather than rejecting outright. That fallback is weaker — a spoofed Host
    // header defeats it — but it still blocks an ordinary cross-site POST, and
    // it matches the protection level this endpoint had before the check
    // existed. Failing closed here instead would take the guest form offline
    // on every deployment that has not yet set the variable.
    if (configured.length === 0) {
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "PUBLIC_APP_URL is not set; falling back to per-request origin for guest-form same-origin checks. Set it to harden this.",
        );
      }
      return originKey(received) === originKey(new URL(request.url));
    }

    const allowed = configured.map((entry) => new URL(entry));
    if (process.env.NODE_ENV === "production" && received.protocol !== "https:") {
      return false;
    }
    return allowed.some(
      (entry) =>
        originKey(entry) === originKey(received) &&
        (process.env.NODE_ENV !== "production" || entry.protocol === "https:"),
    );
  } catch {
    return false;
  }
}
