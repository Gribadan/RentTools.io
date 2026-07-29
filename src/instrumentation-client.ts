import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Browser-extension noise filter. Crypto wallet extensions (MetaMask,
// Phantom, Coinbase, etc.) inject their own bundle (`inpage.js`) into
// every page on every site and frequently throw `addListener` /
// `emit is undefined` errors during their internal init race. Those
// errors fire whether or not the user has visited a crypto site —
// they pollute every Sentry stream that doesn't filter them. None
// originate from RentTools code, so dropping them at the SDK keeps
// the alert list focused on signals we can act on.
//
// Two filters layered for redundancy:
//   - denyUrls: any frame in an extension URL or a known injected
//     bundle path is dropped before transmission.
//   - ignoreErrors: textual fingerprints of the common extension
//     errors that leak through with empty/missing stack frames.
const EXTENSION_DENY_URLS: RegExp[] = [
  // Chromium extensions — script frames load from chrome-extension://<id>/
  /^chrome-extension:\/\//,
  // Firefox + Edge extensions
  /^moz-extension:\/\//,
  /^safari-extension:\/\//,
  /^safari-web-extension:\/\//,
  // Sentry surfaces compiled extension bundles as `app:///<filename>` —
  // `inpage.js` is the canonical name crypto wallets use.
  /\/inpage\.js/,
  // MetaMask + several others ship their content scripts under these
  // names; same SDK shape.
  /\/contentscript\.js/,
  /\/extension\.js/,
  // Google Identity Services (One Tap prompt). Throws minified errors
  // ("Error: oa" and similar) from its internal XHR machinery,
  // especially on iOS Safari where a signed-out user has no viable
  // account to hint. denyUrls checks the top frame of the exception,
  // so this catches events even when Sentry's XHR-integration wrapper
  // captured them from our onScriptReady callback.
  /^app:\/\/\/gsi\//,
  // Sentry sometimes labels frames from third-party scripts with the
  // origin URL directly — cover both shapes.
  /^https?:\/\/accounts\.google\.com\/gsi\//,
];

const EXTENSION_IGNORE_PATTERNS: Array<string | RegExp> = [
  // `Cannot read properties of undefined (reading 'addListener')` —
  // wallet extension init race, fires on first paint.
  /Cannot read propert(y|ies) of undefined \(reading ['"]addListener['"]\)/,
  // `Cannot read properties of undefined (reading 'emit')` —
  // same family of extension errors, different lifecycle hook.
  /Cannot read propert(y|ies) of undefined \(reading ['"]emit['"]\)/,
  // Generic ResizeObserver loop noise — Chrome surfaces this when a
  // ResizeObserver callback triggers a layout that re-fires it. Not
  // actionable; happens on most modern sites with responsive layouts.
  /ResizeObserver loop limit exceeded/,
  /ResizeObserver loop completed with undelivered notifications/,
];

// Well-known third-party script paths whose errors are never
// actionable from our side. Kept separate from denyUrls because we
// also want to drop events where the error was THROWN in one of these
// scripts even though the call chain traversed our bundle (typical
// for GIS: we call gsi.prompt() → gsi does its own XHR → the XHR
// callback throws inside gsi; Sentry's stack has both a gsi frame
// (the thrower) and a /_next/ frame (our onScriptReady callback), so
// the older hasAppFrame heuristic was too permissive).
const THIRD_PARTY_ORIGIN_PATTERNS: RegExp[] = [
  /^app:\/\/\/gsi\//,
  /^https?:\/\/accounts\.google\.com\/gsi\//,
  /^https?:\/\/apis\.google\.com\//,
  /^https?:\/\/[^/]*\.googletagmanager\.com\//,
];

// Drop events whose stack has zero frames in our own source, OR whose
// THROWING frame lives in a well-known third-party script (see above).
// The browser's global onerror handler captures any script's exception
// page-wide, so third-party bundles show up as our errors with either
// an empty / "undefined:31:70" stack (drops via zero-frames branch) or
// a stack rooted in the third-party origin (drops via top-frame
// branch). Real recursions from our own code have a top frame in
// /_next/static/ and still report normally.
function shouldDrop(event: Sentry.ErrorEvent): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
  if (frames.length === 0) return true;

  // Sentry orders frames oldest → newest; the LAST element is the
  // frame where the error was thrown. Drop if that origin is a known
  // third-party script.
  const topFrame = frames[frames.length - 1];
  const topFn = topFrame?.filename ?? "";
  if (THIRD_PARTY_ORIGIN_PATTERNS.some((p) => p.test(topFn))) return true;

  // Fallback: no frame at all in our bundle → drop as untraceable
  // third-party noise. This catches new scripts we haven't explicitly
  // listed above.
  const hasAppFrame = frames.some((f) => {
    const fn = f.filename ?? "";
    if (!fn || fn === "undefined" || fn === "<anonymous>") return false;
    return fn.includes("/_next/") || fn.endsWith("renttools.io");
  });
  return !hasAppFrame;
}

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA,
    denyUrls: EXTENSION_DENY_URLS,
    ignoreErrors: EXTENSION_IGNORE_PATTERNS,
    beforeSend(event) {
      // Third-party noise filter — see shouldDrop() for the two
      // conditions we drop under (no app frame at all, OR error was
      // thrown inside a known third-party script even if the call
      // chain went through our code).
      if (shouldDrop(event)) return null;
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
