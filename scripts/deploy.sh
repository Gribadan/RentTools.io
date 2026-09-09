#!/bin/bash
# rent-tool — full droplet-side build + deploy (FALLBACK).
#
# Builds AND deploys on the droplet. Slow (~18 min on the 458 MB box) and
# only kept around as a fallback when the CI build pipeline is unavailable
# (eg GH Actions outage, working from a branch that hasn't been pushed).
#
# Normal deploys are now handled by .github/workflows/deploy.yml +
# scripts/install-build.sh: the runner does the heavy build and ships
# the artifact, the install script swaps it in (~30s on the droplet).
#
# To use this fallback manually:
#   ssh app@<droplet>
#   cd /home/app/rent-tool
#   bash scripts/deploy.sh
#
# Aborts cleanly on any failed step BEFORE touching the running service,
# so a broken build never kills production. The systemctl restart is
# the very last step.
#
# Pre-reqs (set up once, see docs/DROPLET-SETUP.md):
#   - /home/app/rent-tool is the git checkout
#   - .env.production is in place with DATABASE_URL, JWT_SECRET, CRON_SECRET,
#     GEMINI key, GUEST_DATA_ENCRYPTION_KEY and PUBLIC_APP_URL
#   - Node 22 LTS on PATH
#   - sudo NOPASSWD entry for `app` covering `systemctl restart rent-tool`

set -euo pipefail

REPO_DIR="/home/app/rent-tool"
SERVICE="rent-tool"
LOG_PREFIX="[$(date -Is)]"

cd "$REPO_DIR"

echo "$LOG_PREFIX deploy: starting in $REPO_DIR (current SHA: $(git rev-parse --short HEAD))"

# 1. Refuse to deploy if the working copy has uncommitted changes —
#    means someone edited files directly on the droplet, which would be
#    silently overwritten by the pull.
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "$LOG_PREFIX deploy: ABORT — working copy has uncommitted changes" >&2
  git status --short >&2
  exit 10
fi

# 1b. Required-secret preflight. Both are read at runtime, so a missing one
#     builds and starts fine but leaves guest pre-check-in broken: no
#     encryption key means owners cannot mint a link, and no canonical origin
#     means every guest submit is rejected as cross-origin. Catch it here.
MISSING=""
for VAR in GUEST_DATA_ENCRYPTION_KEY PUBLIC_APP_URL; do
  if ! grep -qE "^[[:space:]]*(export[[:space:]]+)?${VAR}=[^[:space:]]" .env.production 2>/dev/null; then
    MISSING="$MISSING $VAR"
  fi
done
if [ -n "$MISSING" ]; then
  echo "$LOG_PREFIX deploy: ABORT — .env.production missing required setting(s):$MISSING" >&2
  echo "  GUEST_DATA_ENCRYPTION_KEY: openssl rand -hex 32   (guest identity data at rest)" >&2
  echo "  PUBLIC_APP_URL:            https://renttools.io   (comma-separate extra origins)" >&2
  exit 11
fi

# 1c. Create a transactionally-consistent, integrity-checked restore point
# before the fallback path changes source, dependencies, or schema.
echo "$LOG_PREFIX deploy: creating verified pre-deploy database backup"
if ! BACKUP_OUTPUT=$(bash scripts/backup-db.sh 2>&1); then
  echo "$LOG_PREFIX deploy: ABORT — verified pre-deploy database backup failed" >&2
  printf '%s\n' "$BACKUP_OUTPUT" >&2
  exit 14
fi
echo "$LOG_PREFIX deploy: $BACKUP_OUTPUT"

# 2. Fetch + fast-forward to origin/master.
git fetch --prune origin master
git reset --hard origin/master
NEW_SHA="$(git rev-parse --short HEAD)"
echo "$LOG_PREFIX deploy: now at $NEW_SHA"

# 3. Install only production deps. --omit=dev keeps the install lean
#    on a 1 GB droplet, but devDependencies are needed for the build —
#    so we install fully here, build, then optionally prune.
npm ci

# 4. Generate Prisma client (idempotent — must run after every dep install).
npx prisma generate

# 5. Build. Failures here mean the new code is broken — bail BEFORE
#    restarting so the running service keeps serving the old build.
#
# NODE_OPTIONS bumps V8's max-old-space-size to 1400 MB. The droplet only has
# 458 MB physical RAM, but with 2 GB swap V8 can use it — the default cap is
# ~250 MB which OOMs during TypeScript checking + Sentry source-map upload.
# This is a stop-gap until builds move to GH Actions runners.
NODE_OPTIONS="--max-old-space-size=1400" npm run build

# 6. Apply any new schema migrations against the local SQLite file.
#    push-schema.ts is idempotent + additive-only. The script reads
#    DATABASE_URL from env, so source .env.production first — the systemd
#    service has its own EnvironmentFile, but `npx tsx` here doesn't.
if [ -f prisma/push-schema.ts ]; then
  set -a
  . .env.production
  set +a
  npx tsx prisma/push-schema.ts
fi

# 7. Restart the service. Requires NOPASSWD sudo for this exact command.
sudo systemctl restart "$SERVICE"

# 8. Wait briefly + smoke-test the health endpoint before declaring success.
sleep 3
if ! curl -fsS --max-time 10 http://127.0.0.1:3000/api/health >/dev/null; then
  echo "$LOG_PREFIX deploy: WARN — service restarted but /api/health didn't respond cleanly" >&2
  echo "$LOG_PREFIX deploy: check journalctl -u $SERVICE -n 50" >&2
  exit 20
fi

echo "$LOG_PREFIX deploy: OK — $NEW_SHA live"
