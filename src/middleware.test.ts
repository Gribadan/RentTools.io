import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@/lib/logger", () => ({ log: vi.fn() }));
import { middleware } from "./middleware";

describe("public social image", () => {
  it("allows anonymous image fetches including Next cache query strings", async () => {
    const response = await middleware(new NextRequest("https://renttools.io/opengraph-image?version=preview"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps private routes protected", async () => {
    const response = await middleware(new NextRequest("https://renttools.io/dashboard"));
    expect(response.headers.get("location")).toContain("/login");
  });
});
