import { afterEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());

vi.mock("@/lib/prisma", () => ({
  prisma: { guestFormSubmission: { findUnique } },
}));

import {
  findSubmissionByPublicToken,
  guestFormExpiry,
  mintGuestFormToken,
  publicSubmissionState,
  sameOriginRequest,
} from "@/lib/guest-form-security";
import { hashShareToken } from "@/lib/precheckin-crypto";

const previousPublicAppUrl = process.env.PUBLIC_APP_URL;

afterEach(() => {
  if (previousPublicAppUrl === undefined) delete process.env.PUBLIC_APP_URL;
  else process.env.PUBLIC_APP_URL = previousPublicAppUrl;
});

describe("guest-form public-link security", () => {
  it("mints an opaque token and expires it after checkout", () => {
    const token = mintGuestFormToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(token).not.toMatch(/^\d+$/);
    expect(guestFormExpiry(new Date("2027-05-28T00:00:00.000Z")).toISOString())
      .toBe("2027-05-29T23:59:59.999Z");
  });

  it("fails closed for revoked, expired and submitted links", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2027-05-20T12:00:00.000Z"));
    const base = { revokedAt: null, expiresAt: null, submittedAt: null, status: "INVITED" };
    expect(publicSubmissionState(base)).toBe("active");
    expect(publicSubmissionState({ ...base, revokedAt: new Date() })).toBe("revoked");
    expect(publicSubmissionState({ ...base, expiresAt: new Date("2027-05-19") })).toBe("expired");
    expect(publicSubmissionState({ ...base, submittedAt: new Date() })).toBe("submitted");
    vi.useRealTimers();
  });

  it("rejects cross-origin writes", () => {
    expect(sameOriginRequest(new Request("https://renttools.test/api/g/token/draft", {
      headers: { origin: "https://renttools.test" },
    }))).toBe(true);
    expect(sameOriginRequest(new Request("https://renttools.test/api/g/token/draft", {
      headers: { origin: "https://attacker.test" },
    }))).toBe(false);
    expect(sameOriginRequest(new Request("https://renttools.test/api/g/token/draft")))
      .toBe(false);
    expect(sameOriginRequest(new Request("https://renttools.test/api/g/token/draft", {
      headers: { origin: "null" },
    }))).toBe(false);
  });

  it("uses the configured public origin behind a reverse proxy", () => {
    process.env.PUBLIC_APP_URL = "https://renttools.io";
    const proxyUrl = "http://renttools-app:3000/api/g/token/draft";
    expect(sameOriginRequest(new Request(proxyUrl, {
      headers: {
        origin: "https://renttools.io",
        forwarded: "for=192.0.2.1;proto=https;host=renttools.io",
        "x-forwarded-proto": "https",
        "x-forwarded-host": "renttools.io",
      },
    }))).toBe(true);
  });

  it("does not let forwarded host headers redefine the trusted origin", () => {
    process.env.PUBLIC_APP_URL = "https://renttools.io";
    expect(sameOriginRequest(new Request("http://renttools-app:3000/api/g/token/draft", {
      headers: {
        origin: "https://attacker.test",
        forwarded: "for=192.0.2.1;proto=https;host=attacker.test",
        "x-forwarded-proto": "https",
        "x-forwarded-host": "attacker.test",
      },
    }))).toBe(false);
  });

  it("treats apex and www as the same site, and honours a comma-separated list", () => {
    // nginx answers on both hostnames with no canonical redirect, and the
    // dashboard mints share links from window.location.origin — so a link
    // copied on www must not 403 forever.
    process.env.PUBLIC_APP_URL = "https://renttools.io";
    for (const origin of ["https://renttools.io", "https://www.renttools.io"]) {
      expect(sameOriginRequest(new Request("http://renttools-app:3000/api/g/t/draft", {
        headers: { origin },
      }))).toBe(true);
    }

    process.env.PUBLIC_APP_URL = "https://renttools.io, https://renttools.example";
    expect(sameOriginRequest(new Request("http://renttools-app:3000/api/g/t/draft", {
      headers: { origin: "https://renttools.example" },
    }))).toBe(true);
    expect(sameOriginRequest(new Request("http://renttools-app:3000/api/g/t/draft", {
      headers: { origin: "https://attacker.test" },
    }))).toBe(false);
  });

  it("stays usable when PUBLIC_APP_URL is unset instead of rejecting every write", () => {
    // Failing closed here would take the guest form offline on any deployment
    // that has not set the variable yet, which is a regression against the
    // behaviour before the check existed.
    delete process.env.PUBLIC_APP_URL;
    expect(sameOriginRequest(new Request("https://renttools.io/api/g/t/submit", {
      headers: { origin: "https://renttools.io" },
    }))).toBe(true);
    expect(sameOriginRequest(new Request("https://renttools.io/api/g/t/submit", {
      headers: { origin: "https://attacker.test" },
    }))).toBe(false);
  });
});

describe("public token lookup", () => {
  afterEach(() => findUnique.mockReset());

  it("never accepts the stored `hashed:` marker as a usable public token", async () => {
    // Hardened rows park `hashed:<sha256>` in shareToken. That value is
    // derivable from the token, so accepting it on the legacy branch would let
    // anyone who could read the column replay it as the URL token — exactly
    // the database-read threat the hashing is meant to defeat.
    const realToken = mintGuestFormToken();
    const marker = `hashed:${hashShareToken(realToken)}`;
    findUnique.mockResolvedValue(null);

    expect(await findSubmissionByPublicToken(marker)).toBeNull();
    // Only the tokenHash lookup may run; the shareToken fallback must not.
    expect(findUnique).toHaveBeenCalledTimes(1);
    expect(findUnique.mock.calls[0][0].where).toHaveProperty("tokenHash");
  });

  it("still resolves genuine legacy plaintext tokens", async () => {
    const legacyToken = "a".repeat(32);
    findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 1 });

    expect(await findSubmissionByPublicToken(legacyToken)).toEqual({ id: 1 });
    expect(findUnique).toHaveBeenCalledTimes(2);
    expect(findUnique.mock.calls[1][0].where).toEqual({ shareToken: legacyToken });
  });
});
