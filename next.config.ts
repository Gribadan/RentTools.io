import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Security headers (RT-21.6). We set X-Frame-Options here rather than at
  // the nginx layer so the protection holds even when the app is run
  // directly (self-hosters who skip the nginx reverse proxy, the dev
  // server, preview builds, etc). When CSP lands in RT-21.2, the
  // `frame-ancestors 'none'` directive will subsume X-Frame-Options for
  // CSP-aware browsers but we keep this header for older clients.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "wowcarry-ltd",
  project: "rent-tool",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  disableLogger: true,
});
