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

// Drop events whose stack has zero frames in our own source. The
// browser's global onerror handler captures any script's exception
// page-wide, so things like Google Identity Services (gsi/client) or a
// browser extension that slipped past denyUrls show up as our errors
// with an empty / "undefined:31:70" stack. They're not actionable from
// our code — when a real recursion comes from us, the stack will
// include at least one frame pointing at /_next/static/.
function hasAppFrame(event: Sentry.ErrorEvent): boolean {
  const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
  if (frames.length === 0) return false;
  return frames.some((f) => {
    const fn = f.filename ?? "";
    if (!fn || fn === "undefined" || fn === "<anonymous>") return false;
    // Our build assets live under /_next/. Anything else (cdn-hosted
    // third-party scripts, browser-internal frames) is not ours.
    return fn.includes("/_next/") || fn.endsWith("renttools.io");
  });
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
      // Stack overflows on iOS Safari + Google Identity Services arrive
      // with empty/undefined stack frames — there's nothing actionable
      // because the recursion isn't in our code. Drop them only when no
      // frame points at our bundle. A real RangeError thrown from our
      // own code would have at least one /_next/static/ frame and would
      // still report normally.
      if (!hasAppFrame(event)) return null;
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
