import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ property: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { property: { findUnique: mocks.property } } }));
import { notifyPropertyChange, subscribeUserChanges } from "./live-events";

const cleanups: Array<() => void> = [];
function listen(userId: number, listener = vi.fn()) {
  const cleanup = subscribeUserChanges(userId, listener);
  if (cleanup) cleanups.push(cleanup);
  return { listener, cleanup };
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.property.mockResolvedValue({
    userId: 1, managers: [{ managerId: 2 }, { managerId: 1 }],
    cleanerAssignments: [{ cleanerId: 3 }, { cleanerId: null }],
  });
});
afterEach(() => { cleanups.splice(0).forEach((cleanup) => cleanup()); vi.restoreAllMocks(); });

describe("scoped calendar notifications", () => {
  it("notifies the owner, manager and assigned cleaner, without notifying an unrelated user", async () => {
    const watchers = [1, 2, 3, 4].map((id) => listen(id));
    await notifyPropertyChange(17);
    for (const watcher of watchers.slice(0, 3)) expect(watcher.listener).toHaveBeenCalledExactlyOnceWith();
    expect(watchers[3].listener).not.toHaveBeenCalled();
    expect(mocks.property).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 17 } }));
  });

  it("uses current memberships after a manager loses access", async () => {
    const owner = listen(1), manager = listen(2);
    mocks.property.mockResolvedValue({ userId: 1, managers: [], cleanerAssignments: [] });
    await notifyPropertyChange(17);
    expect(owner.listener).toHaveBeenCalledOnce();
    expect(manager.listener).not.toHaveBeenCalled();
  });

  it("does not query the database when nobody is connected", async () => {
    await notifyPropertyChange(17);
    expect(mocks.property).not.toHaveBeenCalled();
  });

  it("does not fail a committed mutation when the notification lookup fails", async () => {
    listen(1);
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.property.mockRejectedValue(new Error("database unavailable"));
    await expect(notifyPropertyChange(17)).resolves.toBeUndefined();
  });

  it("releases subscriptions idempotently without removing a later connection", async () => {
    const first = listen(1);
    first.cleanup?.();
    const second = listen(1);
    first.cleanup?.();
    await notifyPropertyChange(17);
    expect(first.listener).not.toHaveBeenCalled();
    expect(second.listener).toHaveBeenCalledOnce();
  });

  it("caps connections per user and admits a replacement after disconnect", () => {
    const first = Array.from({ length: 8 }, () => listen(1));
    expect(listen(1).cleanup).toBeNull();
    first[0].cleanup?.();
    expect(listen(1).cleanup).toBeTypeOf("function");
  });

  it("bounds the total number of open subscriptions", () => {
    Array.from({ length: 256 }, (_, id) => listen(id + 10));
    expect(listen(999).cleanup).toBeNull();
  });
});
