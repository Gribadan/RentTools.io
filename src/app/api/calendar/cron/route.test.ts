import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  syncAllCalendars: vi.fn(),
  syncLogCreate: vi.fn(),
  appSettingsFindUnique: vi.fn(),
  appSettingsUpsert: vi.fn(),
  getSession: vi.fn(),
  canReadProperty: vi.fn(),
  listAccessiblePropertyIds: vi.fn(),
}));

vi.mock("@/lib/calendar-sync", () => ({ syncAllCalendars: mocks.syncAllCalendars }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/ownership", () => ({ canReadProperty: mocks.canReadProperty, listAccessiblePropertyIds: mocks.listAccessiblePropertyIds }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    syncLog: { create: mocks.syncLogCreate },
    appSettings: { findUnique: mocks.appSettingsFindUnique, upsert: mocks.appSettingsUpsert },
  },
}));

import { GET } from "./route";
import { POST as manualSync } from "../sync/route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", undefined);
  vi.stubEnv("JWT_SECRET", undefined);
  mocks.syncLogCreate.mockResolvedValue({});
  mocks.appSettingsFindUnique.mockResolvedValue(null);
  mocks.appSettingsUpsert.mockResolvedValue({});
  mocks.syncAllCalendars.mockResolvedValue({ propertiesSynced: 1, newEvents: 0, updatedEvents: 0, removedEvents: 0, errors: 0 });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("calendar cron authentication", () => {
  it.each(["Bearer undefined", "Bearer ", "Bearer null"])("rejects %s when no server secret is configured", async (authorization) => {
    const response = await GET(new NextRequest("https://renttools.test/api/calendar/cron?secret=undefined", {
      headers: { authorization },
    }));
    expect(response.status).toBe(401);
    expect(mocks.syncAllCalendars).not.toHaveBeenCalled();
    expect(mocks.syncLogCreate).not.toHaveBeenCalled();
  });

  it("rejects a missing or incorrect credential when the secret is configured", async () => {
    vi.stubEnv("CRON_SECRET", "configured-secret");
    const response = await GET(new NextRequest("https://renttools.test/api/calendar/cron?secret=wrong"));
    expect(response.status).toBe(401);
    expect(mocks.syncAllCalendars).not.toHaveBeenCalled();
  });

  it.each(["bearer", "query"])("accepts the configured secret via %s", async (method) => {
    vi.stubEnv("CRON_SECRET", "configured-secret");
    const response = await GET(new NextRequest(
      `https://renttools.test/api/calendar/cron${method === "query" ? "?secret=configured-secret" : ""}`,
      method === "bearer" ? { headers: { authorization: "Bearer configured-secret" } } : {},
    ));
    expect(response.status).toBe(200);
    expect(mocks.syncAllCalendars).toHaveBeenCalledOnce();
  });

  it("preserves the configured legacy JWT-secret fallback", async () => {
    vi.stubEnv("JWT_SECRET", "legacy-secret");
    const response = await GET(new NextRequest("https://renttools.test/api/calendar/cron", {
      headers: { authorization: "Bearer legacy-secret" },
    }));
    expect(response.status).toBe(200);
    expect(mocks.syncAllCalendars).toHaveBeenCalledOnce();
  });
});

describe("manual sync cannot postpone other hosts' scheduled sync", () => {
  it.each([
    { label: "one property", body: { propertyId: 7 }, expectedIds: [7] },
    { label: "all accessible properties", body: {}, expectedIds: [7, 8] },
  ])("keeps a due global cron due after refreshing $label", async ({ body, expectedIds }) => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-09T18:15:00.000Z"));
    vi.stubEnv("CRON_SECRET", "configured-secret");
    mocks.getSession.mockResolvedValue({ userId: 42, role: "user" });
    mocks.canReadProperty.mockResolvedValue(true);
    mocks.listAccessiblePropertyIds.mockResolvedValue([7, 8]);
    const state = new Map([
      ["sync_auto_enabled", "true"],
      ["sync_frequency_minutes", "10"],
      ["sync_last_run", "2026-09-09T18:00:00.000Z"],
      ["sync_last_result", JSON.stringify({ propertiesSynced: 25, errors: 0 })],
    ]);
    mocks.appSettingsFindUnique.mockImplementation(async ({ where: { key } }) =>
      state.has(key) ? { key, value: state.get(key) } : null,
    );
    mocks.appSettingsUpsert.mockImplementation(async ({ where: { key }, update: { value } }) => {
      state.set(key, value);
      return { key, value };
    });

    const manualResponse = await manualSync(new NextRequest("https://renttools.test/api/calendar/sync", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }));
    expect(manualResponse.status).toBe(200);
    expect(mocks.syncAllCalendars).toHaveBeenNthCalledWith(1, { propertyIds: expectedIds });

    const scheduledResponse = await GET(new NextRequest("https://renttools.test/api/calendar/cron", {
      headers: { authorization: "Bearer configured-secret" },
    }));
    expect(scheduledResponse.status).toBe(200);
    expect(await scheduledResponse.json()).toMatchObject({ ok: true, propertiesSynced: 1 });
    expect(mocks.syncAllCalendars).toHaveBeenNthCalledWith(2);
    // Only the global cron should advance the shared scheduling state.
    expect(mocks.appSettingsUpsert).toHaveBeenCalledTimes(3);
    expect(state.get("sync_last_run")).toBe("2026-09-09T18:15:00.000Z");
  });
});

describe("scheduled cadence", () => {
  let state: Map<string, string>;
  const trigger = () => GET(new NextRequest("https://renttools.test/api/calendar/cron", {
    headers: { authorization: "Bearer configured-secret" },
  }));

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-16T03:00:17Z"));
    vi.stubEnv("CRON_SECRET", "configured-secret");
    state = new Map([["sync_frequency_minutes", "5"]]);
    mocks.appSettingsFindUnique.mockImplementation(async ({ where: { key } }) =>
      state.has(key) ? { key, value: state.get(key) } : null,
    );
    mocks.appSettingsUpsert.mockImplementation(async ({ where: { key }, update: { value } }) => {
      state.set(key, value);
      return { key, value };
    });
  });

  it("runs the next slot after a long batch, including an early scheduler tick", async () => {
    mocks.syncAllCalendars.mockImplementationOnce(async () => {
      vi.setSystemTime(new Date("2026-10-16T03:02:38Z"));
      return { propertiesSynced: 221, errors: 0 };
    });
    await trigger();
    expect(state.get("sync_last_started")).toBe("2026-10-16T03:00:17.000Z");
    expect(state.get("sync_last_run")).toBe("2026-10-16T03:02:38.000Z");
    vi.setSystemTime(new Date("2026-10-16T03:05:02Z"));
    expect(await (await trigger()).json()).not.toHaveProperty("skipped");
    expect(mocks.syncAllCalendars).toHaveBeenCalledTimes(2);
  });

  it("deduplicates a repeated call in the same slot", async () => {
    await trigger();
    vi.setSystemTime(new Date("2026-10-16T03:04:59Z"));
    expect(await (await trigger()).json()).toMatchObject({ skipped: true });
    expect(mocks.syncAllCalendars).toHaveBeenCalledOnce();
  });

  it("does not overlap even when the previous batch crosses the next slot", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    mocks.syncAllCalendars.mockReturnValueOnce(pending);
    const first = trigger();
    await vi.waitFor(() => expect(mocks.syncAllCalendars).toHaveBeenCalledOnce());
    vi.setSystemTime(new Date("2026-10-16T03:10:00Z"));
    expect(await (await trigger()).json()).toMatchObject({ skipped: true, reason: "Sync already running" });
    finish();
    await first;
    await trigger();
    expect(mocks.syncAllCalendars).toHaveBeenCalledTimes(2);
  });

  it.each([undefined, "broken", "0", "-5"])("uses a safe five-minute default for %s", async (frequency) => {
    if (frequency === undefined) state.delete("sync_frequency_minutes");
    else state.set("sync_frequency_minutes", frequency);
    await trigger();
    vi.setSystemTime(new Date("2026-10-16T03:05:00Z"));
    await trigger();
    expect(mocks.syncAllCalendars).toHaveBeenCalledTimes(2);
  });

  it("honors longer configured intervals and disabled auto-sync", async () => {
    state.set("sync_frequency_minutes", "15");
    await trigger();
    vi.setSystemTime(new Date("2026-10-16T03:10:00Z"));
    expect(await (await trigger()).json()).toMatchObject({ skipped: true });
    vi.setSystemTime(new Date("2026-10-16T03:15:00Z"));
    await trigger();
    state.set("sync_auto_enabled", "false");
    vi.setSystemTime(new Date("2026-10-16T03:30:00Z"));
    expect(await (await trigger()).json()).toMatchObject({ skipped: true, reason: "Auto-sync disabled" });
    expect(mocks.syncAllCalendars).toHaveBeenCalledTimes(2);
  });

  it("releases the guard after failure while keeping completion status separate", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.syncAllCalendars.mockRejectedValueOnce(new Error("Synthetic failure"));
    expect((await trigger()).status).toBe(500);
    expect(JSON.parse(state.get("sync_last_result")!)).toEqual({ error: "Synthetic failure" });
    vi.setSystemTime(new Date("2026-10-16T03:05:00Z"));
    expect((await trigger()).status).toBe(200);
    expect(mocks.syncAllCalendars).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });
});
