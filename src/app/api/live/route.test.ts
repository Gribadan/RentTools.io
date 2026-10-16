import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ session: vi.fn(), subscribe: vi.fn(), unsubscribe: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.session }));
vi.mock("@/lib/live-events", () => ({ subscribeUserChanges: mocks.subscribe }));
import { GET } from "./route";

let notify: () => void;
beforeEach(() => {
  vi.useFakeTimers(); vi.resetAllMocks();
  mocks.session.mockResolvedValue({ userId: 7, username: "test-host", role: "user" });
  mocks.subscribe.mockImplementation((_id: number, listener: () => void) => {
    notify = listener;
    return mocks.unsubscribe;
  });
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
const request = () => new NextRequest("https://renttools.test/api/live");
const decode = (value: Uint8Array | undefined) => new TextDecoder().decode(value);

describe("live calendar stream", () => {
  it("requires a valid session before allocating a connection", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(401);
    expect(mocks.subscribe).not.toHaveBeenCalled();
  });

  it("subscribes only to the authenticated user and disables stream buffering/caching", async () => {
    const response = await GET(request());
    expect(mocks.subscribe).toHaveBeenCalledWith(7, expect.any(Function));
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("cache-control")).toContain("private, no-store");
    expect(response.headers.get("x-accel-buffering")).toBe("no");
    await response.body!.cancel();
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("coalesces notifications and sends no booking data, property IDs or feed tokens", async () => {
    const response = await GET(request());
    const reader = response.body!.getReader();
    expect(decode((await reader.read()).value)).toContain("retry: 5000");
    notify(); notify(); notify();
    await vi.advanceTimersByTimeAsync(250);
    expect(decode((await reader.read()).value)).toBe("event: refresh\ndata: {}\n\n");
    await reader.cancel();
  });

  it("cleans up immediately after a client abort", async () => {
    const abort = new AbortController();
    const response = await GET(new NextRequest("https://renttools.test/api/live", { signal: abort.signal }));
    const reader = response.body!.getReader();
    await reader.read(); notify(); abort.abort();
    expect((await reader.read()).done).toBe(true);
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("closes a slow client's full queue rather than accumulating notifications", async () => {
    const response = await GET(request());
    notify();
    await vi.advanceTimersByTimeAsync(250);
    const reader = response.body!.getReader();
    await reader.read();
    expect((await reader.read()).done).toBe(true);
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
  });

  it("periodically reconnects so authentication and missed changes are refreshed", async () => {
    const response = await GET(request());
    const reader = response.body!.getReader();
    await reader.read();
    for (let tick = 0; tick < 20; tick++) {
      await vi.advanceTimersByTimeAsync(15_000);
      expect(decode((await reader.read()).value)).toBe(": heartbeat\n\n");
    }
    expect((await reader.read()).done).toBe(true);
    expect(mocks.unsubscribe).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("refuses excess connections with a bounded retry hint", async () => {
    mocks.subscribe.mockReturnValue(null);
    const response = await GET(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("60");
    expect(vi.getTimerCount()).toBe(0);
  });
});
