import { describe, expect, it } from "vitest";
import { redactSensitiveRequestPath } from "@/lib/request-path";

describe("request-path logging", () => {
  it("redacts guest bearer tokens but preserves route shape", () => {
    expect(redactSensitiveRequestPath("/g/super-secret-token"))
      .toBe("/g/[redacted]");
    expect(redactSensitiveRequestPath("/api/g/super-secret-token/draft"))
      .toBe("/api/g/[redacted]/draft");
  });

  it("does not alter ordinary routes", () => {
    expect(redactSensitiveRequestPath("/dashboard")).toBe("/dashboard");
  });
});
