#!/bin/bash
# rent-tool — droplet-side deploy script.
#
# Runs on the droplet under the `app` user (or via `sudo -u app`).
# Triggered by .github/workflows/deploy.yml after a push to master.
#
# Aborts cleanly on any failed step BEFORE touching the running service,
# so a broken build never kills production. The systemctl restart is
# the very last step.
#
# Pre-reqs (set up once, see docs/DROPLET-SETUP.md):
#   - /home/app/rent-tool is the git checkout
#   - .env.production is in place with DATABASE_URL, JWT_SECRET, CRON_SECRET, GEMINI key
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
npm run build

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
