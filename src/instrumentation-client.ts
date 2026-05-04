import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    sendDefaultPii: false,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_GIT_COMMIT_SHA,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
