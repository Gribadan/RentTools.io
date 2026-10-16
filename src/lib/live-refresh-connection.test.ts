import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { subscribeLiveRefresh } from "./live-refresh-connection";

class FakeSource extends EventTarget {
  static CLOSED = 2;
  static instances: FakeSource[] = [];
  readyState = 0;
  constructor(public url: string) { super(); FakeSource.instances.push(this); }
  close = vi.fn(() => { this.readyState = FakeSource.CLOSED; });
}
let documentEvents: EventTarget & { visibilityState: string };
let windowEvents: EventTarget;
const cleanups: Array<() => void> = [];
function listen() {
  const listener = vi.fn();
  const cleanup = subscribeLiveRefresh(listener);
  cleanups.push(cleanup);
  return { listener, cleanup };
}
beforeEach(() => {
  FakeSource.instances = [];
  documentEvents = Object.assign(new EventTarget(), { visibilityState: "visible" });
  windowEvents = new EventTarget();
  vi.stubGlobal("document", documentEvents);
  vi.stubGlobal("window", windowEvents);
  vi.stubGlobal("EventSource", FakeSource);
});
afterEach(() => { cleanups.splice(0).forEach((cleanup) => cleanup()); vi.unstubAllGlobals(); });

describe("shared browser live connection", () => {
  it("shares a single connection between dashboard and calendar subscribers", () => {
    const first = listen(), second = listen();
    expect(FakeSource.instances).toHaveLength(1);
    const source = FakeSource.instances[0];
    expect(source.url).toBe("/api/live");
    source.dispatchEvent(new Event("open"));
    source.dispatchEvent(new Event("refresh"));
    expect(first.listener).toHaveBeenCalledTimes(2);
    expect(second.listener).toHaveBeenCalledTimes(2);
    first.cleanup();
    expect(source.close).not.toHaveBeenCalled();
    second.cleanup();
    expect(source.close).toHaveBeenCalledOnce();
  });

  it("releases the stream when hidden and reloads missed changes on reopening", () => {
    const watcher = listen();
    documentEvents.visibilityState = "hidden";
    documentEvents.dispatchEvent(new Event("visibilitychange"));
    expect(FakeSource.instances[0].close).toHaveBeenCalledOnce();
    documentEvents.visibilityState = "visible";
    documentEvents.dispatchEvent(new Event("visibilitychange"));
    expect(FakeSource.instances).toHaveLength(2);
    FakeSource.instances[1].dispatchEvent(new Event("open"));
    expect(watcher.listener).toHaveBeenCalledOnce();
  });

  it("reconnects immediately when the browser returns online", () => {
    listen();
    windowEvents.dispatchEvent(new Event("online"));
    expect(FakeSource.instances[0].close).toHaveBeenCalledOnce();
    expect(FakeSource.instances).toHaveLength(2);
  });

  it("restores a closed stream after a page is restored from mobile browser history", () => {
    listen();
    FakeSource.instances[0].close();
    windowEvents.dispatchEvent(new Event("pageshow"));
    expect(FakeSource.instances).toHaveLength(2);
  });

  it("does not open a connection in a hidden tab", () => {
    documentEvents.visibilityState = "hidden";
    listen();
    expect(FakeSource.instances).toHaveLength(0);
  });

  it("leaves ordinary refresh available when EventSource is unsupported or blocked", () => {
    vi.stubGlobal("EventSource", undefined);
    expect(() => listen()).not.toThrow();
    expect(FakeSource.instances).toHaveLength(0);
  });
});
