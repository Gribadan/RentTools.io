import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// Content-Security-Policy (RT-21.2). Defence-in-depth: nginx sets the same
// header for renttools.io traffic (deploy/nginx/rent-tool.conf), this
// covers self-hosters who skip the reverse proxy and the dev server.
//
// 'unsafe-inline' on script-src is a pragmatic concession — Next.js 16
// emits inline hydration scripts and our JSON-LD blocks are inline by
// design. Tightening to nonce-based CSP requires App Router middleware
// nonce plumbing; not worth blocking RT-21.2 on it. The other directives
// (frame-ancestors 'none', form-action allowlist, restricted connect-src)
// still buy real protection against clickjacking and exfiltration.
//
// External hosts:
//   accounts.google.com — Google OAuth + One Tap script + iframe
//   *.gstatic.com       — Google fonts/assets used by the GIS script
//   *.sentry.io         — Sentry SDK fallback (we tunnel via /monitoring
//                         but the SDK occasionally bypasses for replay)
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://accounts.google.com https://*.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://accounts.google.com https://*.googleapis.com https://*.ingest.sentry.io https://*.sentry.io",
  "frame-src 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://accounts.google.com",
  "upgrade-insecure-requests",
];
const CSP_HEADER_VALUE = CSP_DIRECTIVES.join("; ");

const nextConfig: NextConfig = {
  // Security headers. X-Frame-Options dates to RT-21.6 — kept for legacy
  // browsers that don't understand `frame-ancestors`. CSP added in RT-21.2.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: CSP_HEADER_VALUE },
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
