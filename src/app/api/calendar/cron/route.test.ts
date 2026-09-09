import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  syncAllCalendars: vi.fn(),
  syncLogCreate: vi.fn(),
  appSettingsFindUnique: vi.fn(),
  appSettingsUpsert: vi.fn(),
}));

vi.mock("@/lib/calendar-sync", () => ({ syncAllCalendars: mocks.syncAllCalendars }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    syncLog: { create: mocks.syncLogCreate },
    appSettings: { findUnique: mocks.appSettingsFindUnique, upsert: mocks.appSettingsUpsert },
  },
}));

import { GET } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("CRON_SECRET", undefined);
  vi.stubEnv("JWT_SECRET", undefined);
  mocks.syncLogCreate.mockResolvedValue({});
  mocks.appSettingsFindUnique.mockResolvedValue(null);
  mocks.appSettingsUpsert.mockResolvedValue({});
  mocks.syncAllCalendars.mockResolvedValue({ propertiesSynced: 1, newEvents: 0, updatedEvents: 0, removedEvents: 0, errors: 0 });
});

afterEach(() => vi.unstubAllEnvs());

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
