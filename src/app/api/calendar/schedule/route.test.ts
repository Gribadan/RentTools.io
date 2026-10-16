import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  session: vi.fn(), findMany: vi.fn(), upsert: vi.fn(), audit: vi.fn(), headers: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getSession: mocks.session }));
vi.mock("@/lib/prisma", () => ({ prisma: { appSettings: { findMany: mocks.findMany, upsert: mocks.upsert } } }));
vi.mock("@/lib/audit", () => ({ logAudit: mocks.audit }));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
import { GET, PUT } from "./route";
import { GET as cronUrl } from "../cron-url/route";

const update = (body: unknown) => PUT(new NextRequest("https://renttools.test/api/calendar/schedule", {
  method: "PUT", body: JSON.stringify(body), headers: { "Content-Type": "application/json" },
}));

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ userId: 1, role: "superadmin" });
  mocks.findMany.mockResolvedValue([]);
  mocks.upsert.mockResolvedValue({});
  mocks.headers.mockResolvedValue(new Headers({ host: "renttools.test" }));
  vi.stubEnv("CRON_SECRET", "synthetic-cron-secret");
  vi.stubEnv("JWT_SECRET", "synthetic-session-secret");
});
afterEach(() => vi.unstubAllEnvs());

describe("global calendar controls", () => {
  it.each([null, "user", "manager", "cleaner"])("rejects non-administrator %s before accessing settings or secrets", async (role) => {
    mocks.session.mockResolvedValue(role ? { userId: 2, role } : null);
    const expected = role ? 403 : 401;
    expect((await GET()).status).toBe(expected);
    expect((await update({ autoEnabled: false })).status).toBe(expected);
    const response = await cronUrl();
    expect(response.status).toBe(expected);
    expect(JSON.stringify(await response.json())).not.toContain("synthetic-");
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(mocks.headers).not.toHaveBeenCalled();
  });

  it("reports the same enabled five-minute defaults as cron", async () => {
    expect(await (await GET()).json()).toMatchObject({ autoEnabled: true, frequencyMinutes: 5, lastRun: null });
  });

  it.each([null, [], 5, { autoEnabled: "false" }, { frequencyMinutes: "5" }, { frequencyMinutes: 0 },
    { frequencyMinutes: -5 }, { frequencyMinutes: 2 }, { frequencyMinutes: 5.5 },
    { autoEnabled: false, frequencyMinutes: 7 }])("rejects invalid settings %j without partial writes", async (body) => {
    expect((await update(body)).status).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("saves and audits valid administrator changes", async () => {
    expect((await update({ autoEnabled: true, frequencyMinutes: 5 })).status).toBe(200);
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.audit).toHaveBeenCalledWith(1, "update", "calendarSchedule", 0, { autoEnabled: true, frequencyMinutes: 5 });
  });

  it("rejects malformed JSON without changing settings", async () => {
    const request = new NextRequest("https://renttools.test/api/calendar/schedule", { method: "PUT", body: "{" });
    expect((await PUT(request)).status).toBe(400);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("exposes only the dedicated cron secret to the administrator", async () => {
    const data = await (await cronUrl()).json();
    expect(data.url).toBe("https://renttools.test/api/calendar/cron?secret=synthetic-cron-secret");
    expect(JSON.stringify(data)).not.toContain("synthetic-session-secret");
  });

  it("never displays the session-signing secret as a fallback", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(await (await cronUrl()).json()).toMatchObject({ url: null, configured: false });
  });
});
