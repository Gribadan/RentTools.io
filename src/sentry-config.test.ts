import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as Sentry from "@sentry/nextjs";

const sdkMock = vi.hoisted(() => ({ init: vi.fn() }));

vi.mock("@sentry/nextjs", async (importOriginal) => ({
  ...await importOriginal<typeof import("@sentry/nextjs")>(),
  init: sdkMock.init,
  captureRouterTransitionStart: vi.fn(),
}));

const runtimes = [
  { name: "server", load: () => import("../sentry.server.config") },
  { name: "edge", load: () => import("../sentry.edge.config") },
  { name: "browser", load: () => import("./instrumentation-client") },
];

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "https://example@example.invalid/1");
  vi.stubEnv("SENTRY_DSN", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe.each(runtimes)("Sentry $name configuration", ({ load }) => {
  it("keeps monitoring enabled without adopting v11's broader data collection", async () => {
    await load();
    expect(sdkMock.init).toHaveBeenCalledOnce();
    const options = sdkMock.init.mock.calls[0][0] as Parameters<typeof Sentry.init>[0];
    expect(options.dsn).toBe("https://example@example.invalid/1");
    expect(options.tracesSampleRate).toBe(0.1);

    // Exercise the installed SDK's defaults and request-data filtering without a network transport.
    const client = new Sentry.NodeClient({
      dataCollection: options.dataCollection,
      integrations: [],
      stackParser: () => [],
      transport: () => ({
        send: async () => ({ statusCode: 200 }),
        flush: async () => true,
      }),
    });
    expect(client.getDataCollectionOptions()).toMatchObject({
      userInfo: false,
      cookies: false,
      httpBodies: [],
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      queues: false,
      graphQL: { document: false, variables: false },
    });
    const event: Sentry.ErrorEvent = {
      type: undefined,
      message: "Synthetic application failure",
      sdkProcessingMetadata: {
        normalizedRequest: {
          url: "https://example.invalid/dashboard",
          method: "GET",
          headers: {
            "x-forwarded-for": "192.0.2.1",
            cookie: "session=synthetic-session",
            "content-type": "application/json",
          },
          query_string: "page=2&visitor-ip=192.0.2.1",
        },
      },
    };
    const filtered = await Sentry.requestDataIntegration().processEvent?.(event, {}, client);
    expect(filtered?.message).toBe("Synthetic application failure");
    expect(filtered?.user?.ip_address).toBeUndefined();
    expect(filtered?.request?.cookies).toBeUndefined();
    expect(filtered?.request?.headers).toEqual({
      "content-type": "application/json",
    });
    expect(filtered?.request?.query_string).toContain("page=2");
    expect(filtered?.request?.query_string).not.toContain("192.0.2.1");
  });

  it("does not initialize without a DSN", async () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_DSN", "");
    await load();
    expect(sdkMock.init).not.toHaveBeenCalled();
  });
});

it("keeps browser application errors while filtering extension noise", async () => {
  await import("./instrumentation-client");
  const options = sdkMock.init.mock.calls[0][0] as Sentry.BrowserOptions;
  const appError: Sentry.ErrorEvent = {
    type: undefined,
    exception: { values: [{ stacktrace: { frames: [{ filename: "https://example.invalid/_next/app.js" }] } }] },
  };
  const thirdPartyError: Sentry.ErrorEvent = {
    type: undefined,
    exception: { values: [{ stacktrace: { frames: [
      { filename: "https://example.invalid/_next/app.js" },
      { filename: "https://accounts.google.com/gsi/client" },
    ] } }] },
  };
  expect(options.beforeSend?.(appError, {})).toBe(appError);
  expect(options.beforeSend?.(thirdPartyError, {})).toBeNull();
  expect(options.denyUrls).toEqual(expect.arrayContaining([
    expect.any(RegExp),
  ]));
});
