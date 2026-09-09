import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Exercise the hook's async transitions without a browser. Effects are
// driven explicitly by calling refresh/sync, and state survives rerenders.
const state = vi.hoisted(() => ({ values: [] as unknown[], cursor: 0 }));
vi.mock("react", () => ({
  useCallback: (fn: unknown) => fn,
  useEffect: () => {},
  useState: (initial: unknown) => {
    const index = state.cursor++;
    if (!(index in state.values)) {
      state.values[index] = typeof initial === "function" ? initial() : initial;
    }
    return [state.values[index], (value: unknown) => {
      state.values[index] = typeof value === "function" ? value(state.values[index]) : value;
    }];
  },
}));
vi.mock("@/lib/use-live-refresh", () => ({ useLiveRefresh: () => {} }));

import { useCalendarFetch } from "./use-calendar-fetch";

let propertyId = 100;
const existingEvent = { id: 1, uid: "stay", platform: "booking", summary: "Guest", startDate: "2026-10-09", endDate: "2026-10-13" };
const existingOverride = { id: 1, date: "2026-10-20", type: "closed" };

function renderHook() {
  state.cursor = 0;
  // eslint-disable-next-line react-hooks/rules-of-hooks -- The state harness above intentionally replaces React's renderer.
  return useCalendarFetch(propertyId);
}

function respond(response: Response | Error, endpoint = "/api/calendar/sync?") {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.startsWith(endpoint)) {
      if (response instanceof Error) throw response;
      return response;
    }
    if (url.startsWith("/api/calendar/links")) return Response.json([]);
    if (url.startsWith("/api/date-overrides")) return Response.json([existingOverride]);
    return Response.json({ events: [existingEvent] });
  }));
}

beforeEach(() => {
  propertyId++;
  state.values = [];
  state.cursor = 0;
  vi.stubGlobal("window", { setTimeout: vi.fn() });
});

afterEach(() => vi.unstubAllGlobals());

describe("calendar fetch reliability", () => {
  it.each([
    ["HTTP failure", () => Response.json({ error: "Unavailable" }, { status: 503 })],
    ["malformed success", () => Response.json({ error: "Unavailable" })],
    ["network failure", () => new Error("Failed to fetch")],
  ])("keeps last loaded bookings after a %s", async (_name, failedResponse) => {
    respond(Response.json({ events: [existingEvent] }));
    await renderHook().refetchCalendarData();
    respond(failedResponse());
    expect(await renderHook().refetchCalendarData()).toBe(false);
    const result = renderHook();
    expect(result.syncedEvents).toEqual([existingEvent]);
    expect(result.overrides).toEqual([existingOverride]);
    expect(result.calendarError).toBe("refresh");
    expect(result.loadingEvents).toBe(false);
  });

  it("does not commit partial data when the links request fails", async () => {
    respond(Response.json({ events: [existingEvent] }));
    await renderHook().refetchCalendarData();
    respond(Response.json({ error: "Unavailable" }, { status: 503 }), "/api/calendar/links");
    expect(await renderHook().refetchCalendarData()).toBe(false);
    expect(renderHook().syncedEvents).toEqual([existingEvent]);
    expect(renderHook().links).toEqual([]);
  });

  it("preserves overrides and shows an error if an override refresh fails", async () => {
    respond(Response.json({ events: [existingEvent] }));
    await renderHook().refetchCalendarData();
    respond(Response.json({ error: "Unauthorized" }, { status: 401 }), "/api/date-overrides");
    await renderHook().refetchOverrides();
    expect(renderHook().overrides).toEqual([existingOverride]);
    expect(renderHook().calendarError).toBe("refresh");
  });

  it.each([
    ["HTTP error", () => Response.json({ error: "Failed" }, { status: 500 })],
    ["partial sync", () => Response.json({ propertiesSynced: 1, errors: 1 })],
    ["invalid response", () => Response.json({ error: "Failed" })],
    ["network failure", () => new Error("Failed to fetch")],
  ])("does not confirm success or start a cooldown after a %s", async (_name, failedResponse) => {
    // Match only POST: GET /sync?... continues returning valid cached data.
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "POST") {
        const response = failedResponse();
        if (response instanceof Error) throw response;
        return response;
      }
      return _url.startsWith("/api/calendar/sync?") ? Response.json({ events: [existingEvent] }) : Response.json([]);
    }));
    await renderHook().handleSyncNow();
    const result = renderHook();
    expect(result.syncJustDone).toBe(false);
    expect(result.lastSyncAt).toBeNull();
    expect(result.syncing).toBe(false);
    expect(result.calendarError).toBe("sync");
  });

  it("does not confirm a successful POST if refreshing the calendar fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init?: RequestInit) => init?.method === "POST"
      ? Response.json({ errors: 0 })
      : Response.json({ error: "Unavailable" }, { status: 503 })));
    await renderHook().handleSyncNow();
    expect(renderHook().syncJustDone).toBe(false);
    expect(renderHook().lastSyncAt).toBeNull();
    expect(renderHook().calendarError).toBe("refresh");
  });

  it("confirms a complete sync and successful refresh", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => init?.method === "POST"
      ? Response.json({ propertiesSynced: 1, errors: 0 })
      : url.startsWith("/api/calendar/sync?") ? Response.json({ events: [existingEvent] }) : Response.json([])));
    await renderHook().handleSyncNow();
    expect(renderHook().syncJustDone).toBe(true);
    expect(renderHook().lastSyncAt).not.toBeNull();
    expect(renderHook().calendarError).toBeNull();
  });

  it("shows existing feed errors even without a manual sync", async () => {
    respond(Response.json([{ id: 1, platform: "booking", lastError: "HTTP 503" }]), "/api/calendar/links");
    await renderHook().refetchCalendarData();
    expect(renderHook().calendarError).toBe("sync");
  });

  it("clears a refresh error after a successful retry, including a truly empty calendar", async () => {
    respond(Response.json({ error: "Unavailable" }, { status: 503 }));
    await renderHook().refetchCalendarData();
    respond(Response.json({ events: [] }));
    expect(await renderHook().refetchCalendarData()).toBe(true);
    expect(renderHook().syncedEvents).toEqual([]);
    expect(renderHook().calendarError).toBeNull();
  });
});
