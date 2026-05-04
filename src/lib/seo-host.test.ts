import { describe, it, expect } from "vitest";
import { isStagingHost } from "./seo-host";

describe("isStagingHost", () => {
  it("treats apex and www as production", () => {
    expect(isStagingHost("renttools.io")).toBe(false);
    expect(isStagingHost("www.renttools.io")).toBe(false);
  });

  it("ignores port suffix on production hosts", () => {
    expect(isStagingHost("renttools.io:443")).toBe(false);
    expect(isStagingHost("www.renttools.io:80")).toBe(false);
  });

  it("blocks the staging subdomain", () => {
    expect(isStagingHost("staging.renttools.io")).toBe(true);
    expect(isStagingHost("staging.example.com")).toBe(true);
  });

  it("blocks dev / preview hosts", () => {
    expect(isStagingHost("dev.renttools.io")).toBe(true);
    expect(isStagingHost("rent-tool.vercel.app")).toBe(true);
    expect(isStagingHost("rent-tool.ondigitalocean.app")).toBe(true);
  });

  it("blocks local development", () => {
    expect(isStagingHost("localhost")).toBe(true);
    expect(isStagingHost("localhost:3000")).toBe(true);
    expect(isStagingHost("127.0.0.1")).toBe(true);
    expect(isStagingHost("127.0.0.1:3000")).toBe(true);
  });

  it("normalizes case", () => {
    expect(isStagingHost("STAGING.RENTTOOLS.IO")).toBe(true);
    expect(isStagingHost("RentTools.io")).toBe(false);
  });

  it("returns false for missing host (fail-safe — assume production)", () => {
    expect(isStagingHost(null)).toBe(false);
    expect(isStagingHost(undefined)).toBe(false);
    expect(isStagingHost("")).toBe(false);
  });
});
