import { describe, it, expect } from "vitest";
import { getClientIp, hashClientIp } from "./client-ip";

function req(headers: Record<string, string>): Request {
  return new Request("http://localhost/", { headers });
}

describe("getClientIp", () => {
  it("returns the first entry of x-forwarded-for", () => {
    expect(getClientIp(req({ "x-forwarded-for": "1.2.3.4, 10.0.0.1, 172.16.0.1" }))).toBe("1.2.3.4");
  });

  it("trims whitespace around the first XFF entry", () => {
    expect(getClientIp(req({ "x-forwarded-for": "   1.2.3.4 , 10.0.0.1" }))).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when XFF is absent", () => {
    expect(getClientIp(req({ "x-real-ip": "5.6.7.8" }))).toBe("5.6.7.8");
  });

  it("returns 'unknown' when no IP header is present", () => {
    expect(getClientIp(req({}))).toBe("unknown");
  });

  it("prefers XFF over x-real-ip when both present", () => {
    expect(
      getClientIp(req({ "x-forwarded-for": "1.2.3.4", "x-real-ip": "9.9.9.9" })),
    ).toBe("1.2.3.4");
  });
});

describe("hashClientIp", () => {
  it("returns a 64-hex-char SHA-256 digest", () => {
    const h = hashClientIp(req({ "x-forwarded-for": "1.2.3.4" }));
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });

  it("produces stable hashes for the same IP across calls", () => {
    const a = hashClientIp(req({ "x-forwarded-for": "1.2.3.4" }));
    const b = hashClientIp(req({ "x-forwarded-for": "1.2.3.4" }));
    expect(a).toBe(b);
  });

  it("produces different hashes for different IPs", () => {
    const a = hashClientIp(req({ "x-forwarded-for": "1.2.3.4" }));
    const b = hashClientIp(req({ "x-forwarded-for": "5.6.7.8" }));
    expect(a).not.toBe(b);
  });

  it("hashes 'unknown' when no IP header is present (so absent IPs share a bucket)", () => {
    // Fail-open is safer than rejecting the request: rate-limit still
    // applies to all bucketed-as-'unknown' clients, just less granular.
    const a = hashClientIp(req({}));
    const b = hashClientIp(req({}));
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});
