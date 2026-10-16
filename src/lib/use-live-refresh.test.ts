import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  effects: [] as Array<() => void | (() => void)>,
  subscribe: vi.fn(), unsubscribe: vi.fn(),
}));
vi.mock("react", () => ({
  useRef: (value: unknown) => ({ current: value }),
  useEffect: (effect: () => void | (() => void)) => { harness.effects.push(effect); },
}));
vi.mock("@/lib/live-refresh-connection", () => ({ subscribeLiveRefresh: harness.subscribe }));
import { useLiveRefresh } from "./use-live-refresh";

let documentEvents: EventTarget & { visibilityState: string };
let windowEvents: EventTarget;
let notify: () => void;
const cleanups: Array<() => void> = [];
function mountHook(refetch: () => void | Promise<void>) {
  // eslint-disable-next-line react-hooks/rules-of-hooks -- Effects are driven by this isolated lifecycle harness.
  useLiveRefresh(refetch);
  for (const effect of harness.effects.splice(0)) {
    const cleanup = effect();
    if (cleanup) cleanups.push(cleanup);
  }
}
beforeEach(() => {
  vi.useFakeTimers(); vi.resetAllMocks(); harness.effects = [];
  documentEvents = Object.assign(new EventTarget(), { visibilityState: "visible" });
  windowEvents = new EventTarget();
  vi.stubGlobal("document", documentEvents); vi.stubGlobal("window", windowEvents);
  harness.subscribe.mockImplementation((listener: () => void) => {
    notify = listener;
    return harness.unsubscribe;
  });
});
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.unstubAllGlobals(); vi.useRealTimers();
});

describe("live refresh recovery", () => {
  it("keeps the minute refresh available when no push event arrives", async () => {
    const refetch = vi.fn(); mountHook(refetch);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("refreshes after mobile page restoration and network recovery", async () => {
    const refetch = vi.fn(); mountHook(refetch);
    windowEvents.dispatchEvent(new Event("pageshow"));
    await vi.advanceTimersByTimeAsync(0);
    expect(refetch).toHaveBeenCalledOnce();
    windowEvents.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);
    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it("pauses hidden tabs and refreshes immediately when they become visible", async () => {
    const refetch = vi.fn(); mountHook(refetch);
    documentEvents.visibilityState = "hidden";
    documentEvents.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(120_000);
    expect(refetch).not.toHaveBeenCalled();
    documentEvents.visibilityState = "visible";
    documentEvents.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(0);
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("can recover on network restoration even if an earlier read is still pending", async () => {
    let finish: () => void = () => {};
    const refetch = vi.fn().mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    mountHook(refetch); notify();
    await vi.advanceTimersByTimeAsync(0);
    windowEvents.dispatchEvent(new Event("online"));
    await vi.advanceTimersByTimeAsync(0);
    expect(refetch).toHaveBeenCalledTimes(2);
    finish();
  });

  it("continues refreshing after a failed request", async () => {
    const refetch = vi.fn().mockRejectedValueOnce(new Error("offline"));
    mountHook(refetch); notify();
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(60_000);
    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it("removes timers and subscriptions on unmount", async () => {
    const refetch = vi.fn(); mountHook(refetch);
    cleanups.splice(0).forEach((cleanup) => cleanup());
    notify(); windowEvents.dispatchEvent(new Event("pageshow"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(refetch).not.toHaveBeenCalled();
    expect(harness.unsubscribe).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});
