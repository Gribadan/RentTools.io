# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS base
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl sqlite3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund
COPY src ./src
COPY public ./public
COPY content ./content
COPY next.config.ts postcss.config.mjs tsconfig.json sentry.edge.config.ts sentry.server.config.ts ./
ARG GIT_COMMIT_SHA
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ARG NEXT_PUBLIC_LEGACY_PASSPORT_OCR_ENABLED=true
ENV NEXT_TELEMETRY_DISABLED=1 \
    GIT_COMMIT_SHA=${GIT_COMMIT_SHA} \
    NEXT_PUBLIC_GIT_COMMIT_SHA=${GIT_COMMIT_SHA} \
    NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN} \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID} \
    NEXT_PUBLIC_LEGACY_PASSPORT_OCR_ENABLED=${NEXT_PUBLIC_LEGACY_PASSPORT_OCR_ENABLED}
# The upload token is a BuildKit secret, never a build argument or image ENV.
RUN --mount=type=secret,id=sentry_auth_token \
    SENTRY_AUTH_TOKEN="$(cat /run/secrets/sentry_auth_token 2>/dev/null || true)" \
    DATABASE_URL=file:/tmp/build.db JWT_SECRET=ci-only-build CRON_SECRET=ci-only-build \
    npm run build \
    && rm -rf .next/cache

FROM base AS runtime
ARG GIT_COMMIT_SHA
LABEL org.opencontainers.image.source="https://github.com/Gribadan/RentTools.io" \
      org.opencontainers.image.revision="${GIT_COMMIT_SHA}"
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 \
    GIT_COMMIT_SHA=${GIT_COMMIT_SHA}
# Keep tsx and the Prisma DDL runner for the separately executed migration step.
COPY --from=build --chown=node:node /app /app
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]
