#!/bin/bash
# Install a CI-built artifact on the droplet.
#
# Triggered by .github/workflows/deploy.yml after the runner finishes
# `npm ci + next build` and ships the tarball here. This is the fast-path
# replacement for the old scripts/deploy.sh on-droplet build.
#
# Total runtime target: ~30s if package-lock.json unchanged, ~4 min if a
# fresh `npm ci` is needed (dependencies actually changed).
#
# Arg: $1 = path to build.tar.gz (default /tmp/build.tar.gz)
# Env: GIT_COMMIT_SHA = the SHA the artifact was built from (CI passes this)
#
# Steps:
#  1. git fetch + reset --hard to GIT_COMMIT_SHA so source files (prisma/,
#     scripts/, sentry configs, env-template) match the artifact
#  2. compare package-lock.json hashes; only npm ci if changed
#  3. atomically replace .next/ and src/generated/prisma/ with extracted artifact
#  4. apply schema if prisma/schema.prisma changed
#  5. install systemd unit if it changed (then daemon-reload)
#  5b. sync nginx maintenance.html if it changed (then reload nginx)
#  6. systemctl restart rent-tool
#  7. smoke-test /api/health

set -euo pipefail

ARTIFACT="${1:-/tmp/build.tar.gz}"
REPO="/home/app/rent-tool"
SERVICE="rent-tool"
HEALTH_URL="http://127.0.0.1:3000/api/health"
TARGET_SHA="${GIT_COMMIT_SHA:-origin/master}"

ts() { date -Is; }
log() { echo "[$(ts)] install-build: $*"; }

cd "$REPO"

if [ ! -f "$ARTIFACT" ]; then
  log "ABORT — artifact not found: $ARTIFACT" >&2
  exit 1
fi

# 1. Sync source code so prisma/, scripts/, sentry configs match the SHA we built.
LOCK_BEFORE=$(sha256sum package-lock.json 2>/dev/null | awk '{print $1}' || echo "")
SCHEMA_BEFORE=$(sha256sum prisma/schema.prisma 2>/dev/null | awk '{print $1}' || echo "")
# push-schema.ts holds the hand-rolled DDL that actually gets executed
# against the runtime DB (the .prisma model is for the client only). A
# new ALTER TABLE there must trigger a push on the next deploy or the
# seed below 500s on a missing column.
PUSH_SCRIPT_BEFORE=$(sha256sum prisma/push-schema.ts 2>/dev/null | awk '{print $1}' || echo "")
SYSTEMD_BEFORE=$(sha256sum deploy/systemd/rent-tool.service 2>/dev/null | awk '{print $1}' || echo "")
# nginx serves the maintenance page from /etc/nginx/html/ — outside the
# repo, so `git reset` never touches it. Track the repo copy's hash so a
# change to it gets pushed to nginx below instead of silently drifting.
MAINT_BEFORE=$(sha256sum deploy/nginx/maintenance.html 2>/dev/null | awk '{print $1}' || echo "")

# Refuse to proceed if someone edited files directly on the droplet — prevents
# silent overwrite of unsaved local changes by `git reset --hard`.
if ! git diff --quiet || ! git diff --cached --quiet; then
  log "ABORT — droplet working copy has uncommitted changes" >&2
  git status --short >&2
  exit 10
fi

git fetch --quiet origin master
git reset --hard --quiet "$TARGET_SHA"
log "now at $(git rev-parse --short HEAD)"

LOCK_AFTER=$(sha256sum package-lock.json | awk '{print $1}')
SCHEMA_AFTER=$(sha256sum prisma/schema.prisma | awk '{print $1}')
PUSH_SCRIPT_AFTER=$(sha256sum prisma/push-schema.ts | awk '{print $1}')
SYSTEMD_AFTER=$(sha256sum deploy/systemd/rent-tool.service | awk '{print $1}')
MAINT_AFTER=$(sha256sum deploy/nginx/maintenance.html | awk '{print $1}')

# 2. Conditional npm ci. Only when dependencies actually changed.
if [ "$LOCK_BEFORE" != "$LOCK_AFTER" ]; then
  log "package-lock.json changed — running npm ci"
  npm ci --no-audit --no-fund
else
  log "package-lock.json unchanged — skipping npm ci"
fi

# 3. Atomic swap of .next/ and src/generated/prisma/.
TMPDIR=$(mktemp -d -t rt-build-XXXXXX)
tar -xzf "$ARTIFACT" -C "$TMPDIR"

if [ ! -d "$TMPDIR/.next" ] || [ ! -d "$TMPDIR/src/generated/prisma" ]; then
  log "ABORT — artifact missing .next/ or src/generated/prisma/" >&2
  rm -rf "$TMPDIR"
  exit 11
fi

PID="$$"
[ -d .next ] && mv .next ".next.old.$PID"
[ -d src/generated/prisma ] && mv src/generated/prisma "src/generated/prisma.old.$PID"

mkdir -p src/generated
mv "$TMPDIR/.next" .next
mv "$TMPDIR/src/generated/prisma" src/generated/prisma

# Background cleanup — `rm -rf .next.old` is ~5s on this disk, no need to block.
rm -rf ".next.old.$PID" "src/generated/prisma.old.$PID" "$TMPDIR" "$ARTIFACT" &

# 4. Apply schema if it OR push-schema.ts changed.
if [ "$SCHEMA_BEFORE" != "$SCHEMA_AFTER" ] || [ "$PUSH_SCRIPT_BEFORE" != "$PUSH_SCRIPT_AFTER" ]; then
  log "schema or push-schema.ts changed — pushing"
  set -a
  . .env.production
  set +a
  npx tsx prisma/push-schema.ts
fi

# 4b. Seed BlogPost rows from content/blog/*.md (RT-25.14). The seed
#     is idempotent — upserts on (slug, locale) — so it's safe to run
#     on every deploy. Without this step the public /blog and the
#     admin "Blog posts" sub-route both render empty even though the
#     7 source articles ship in the repo. Source-of-truth for the
#     post body is the markdown file, so this also picks up edits.
log "seeding blog posts from content/blog/"
set -a
. .env.production
set +a
npx tsx prisma/seed-blog-posts.ts || log "blog seed failed (non-fatal — deploy continues)"

# 5. If the systemd unit changed, reload its definition before restart.
if [ "$SYSTEMD_BEFORE" != "$SYSTEMD_AFTER" ]; then
  log "systemd unit changed — installing + reloading daemon"
  sudo install -m 644 deploy/systemd/rent-tool.service /etc/systemd/system/rent-tool.service
  sudo systemctl daemon-reload
fi

# 5b. If the maintenance page changed, push it to where nginx serves it
#     from and reload. Kept here (not the artifact swap) because the
#     target lives under /etc/nginx/, outside the repo tree.
if [ "$MAINT_BEFORE" != "$MAINT_AFTER" ]; then
  log "maintenance.html changed — installing + reloading nginx"
  sudo install -m 644 deploy/nginx/maintenance.html /etc/nginx/html/maintenance.html
  sudo nginx -t && sudo systemctl reload nginx
fi

# 6. Restart.
log "restarting $SERVICE"
sudo systemctl restart "$SERVICE"

# 7. Smoke test.
sleep 3
for attempt in 1 2 3 4 5; do
  if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null; then
    log "OK — $(git rev-parse --short HEAD) live"
    exit 0
  fi
  sleep 2
done

log "WARN — service restarted but $HEALTH_URL didn't respond cleanly. Check journalctl -u $SERVICE -n 50" >&2
exit 20
