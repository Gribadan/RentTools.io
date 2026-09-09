#!/usr/bin/env bash
# Installed, reviewed helper for the shared host's restricted deployment key.
set -euo pipefail
umask 077
ROOT=/home/ubuntu/renttools
SHA=${1:-}
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'A full lowercase commit SHA is required.' >&2; exit 1; }
log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }
fail() { log "ABORT: $*" >&2; exit 1; }
[ "$(id -u)" = 1000 ] || fail 'The build account must be UID 1000.'
for TOOL in docker git tar python3 flock timeout gzip sha256sum; do command -v "$TOOL" >/dev/null || fail "Missing tool: $TOOL"; done
cd "$ROOT"
mkdir -p "$ROOT/incoming"
exec 7> "$ROOT/server-build.lock"
flock -n 7 || fail 'Another resource-capped RentTools build is active.'
GIT_OPTIONAL_LOCKS=0 git -C "$ROOT/app" diff --quiet || fail 'Source snapshot has tracked changes.'
GIT_OPTIONAL_LOCKS=0 git -C "$ROOT/app" diff --cached --quiet || fail 'Source snapshot has staged changes.'
check_master() {
  [ "$(timeout 60 git ls-remote https://github.com/Gribadan/RentTools.io refs/heads/master | awk '{print $1}')" = "$SHA" ] || fail 'Only current public master can be built.'
}
check_master
python3 - "$ROOT" <<'PY'
import pathlib, shutil, sys
root = pathlib.Path(sys.argv[1])
assert (root/"secrets.env").is_file(), "Runtime settings are missing"
assert (root/"secrets.env").stat().st_mode & 0o077 == 0, "Runtime settings must be private"
assert shutil.disk_usage(root).free >= 8*1024**3, "At least 8 GiB free is required for an isolated build"
PY
WORK=$(mktemp -d "$ROOT/incoming/source-build-$SHA.XXXXXX")
CONTEXT="$WORK/context"
BUILD_CONTAINER="renttools-build-${SHA:0:12}-$$"
cleanup() {
  RESULT=$?
  trap - EXIT
  docker rm --force "$BUILD_CONTAINER" >/dev/null 2>&1 || true
  # Scrub the optional source-map token from private logs even on build failure.
  python3 - "$WORK" <<'PY' || true
import pathlib, sys
root = pathlib.Path(sys.argv[1])
env = root/"build.env"
if env.exists():
    token = next((line.partition("=")[2] for line in env.read_text().splitlines() if line.startswith("SENTRY_AUTH_TOKEN=")), "")
    if token:
        for path in root.glob("*.log"):
            path.write_bytes(path.read_bytes().replace(token.encode(), b"[redacted]"))
    env.unlink()
PY
  # These paths were freshly created by this helper, never the live app/data.
  if [[ "$WORK" = "$ROOT/incoming/source-build-$SHA."* ]]; then
    rm -rf -- "$CONTEXT" "$WORK/repository.git"
  fi
  exit "$RESULT"
}
trap cleanup EXIT
mkdir "$CONTEXT"
log 'Fetching an isolated archive of the exact public master commit.'
git init --bare --quiet "$WORK/repository.git"
timeout 180 git -C "$WORK/repository.git" fetch --quiet --depth=1 https://github.com/Gribadan/RentTools.io "$SHA" \
  > "$WORK/source-fetch.log" 2>&1 || fail 'Exact source fetch failed; service unchanged.'
[ "$(git -C "$WORK/repository.git" rev-parse FETCH_HEAD)" = "$SHA" ] || fail 'Fetched source SHA mismatch.'
git -C "$WORK/repository.git" archive "$SHA" | tar -x -C "$CONTEXT"
check_master
# Only selected build values enter this private file outside the source mount.
# No production database, JWT, encryption key, uploads or Docker socket is mounted.
python3 - "$ROOT/secrets.env" "$WORK/build.env" "$SHA" <<'PY'
import pathlib, re, sys
settings = {}
for line in pathlib.Path(sys.argv[1]).read_text().splitlines():
    match = re.fullmatch(r"\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*", line)
    if match:
        settings[match[1]] = match[2].strip().strip("\"'")
env = {"GIT_COMMIT_SHA":sys.argv[3], "NEXT_PUBLIC_GIT_COMMIT_SHA":sys.argv[3],
       "NEXT_TELEMETRY_DISABLED":"1", "NODE_OPTIONS":"--max-old-space-size=1536",
       "DATABASE_URL":"file:/tmp/build.db", "JWT_SECRET":"ci-only-build", "CRON_SECRET":"ci-only-build",
       "NEXT_PUBLIC_GOOGLE_CLIENT_ID":settings.get("NEXT_PUBLIC_GOOGLE_CLIENT_ID") or settings.get("GOOGLE_CLIENT_ID", ""),
       "NEXT_PUBLIC_SENTRY_DSN":settings.get("NEXT_PUBLIC_SENTRY_DSN", ""),
       "NEXT_PUBLIC_LEGACY_PASSPORT_OCR_ENABLED":settings.get("NEXT_PUBLIC_LEGACY_PASSPORT_OCR_ENABLED", "true")}
if settings.get("SENTRY_AUTH_TOKEN"):
    env["SENTRY_AUTH_TOKEN"] = settings["SENTRY_AUTH_TOKEN"]
assert not any("\n" in value or "\r" in value for value in env.values()), "Invalid build setting format"
pathlib.Path(sys.argv[2]).write_text("".join(key+"="+value+"\n" for key, value in env.items()))
PY
BASE_IMAGE="renttools-build-base:$SHA"
log 'Preparing the Node 22 runtime base; application compilation will be resource-capped.'
timeout 600 docker build --target base -f "$CONTEXT/deploy/docker/Dockerfile" \
  --tag "$BASE_IMAGE" "$CONTEXT" > "$WORK/base-image.log" 2>&1 || fail 'Runtime base preparation failed; service unchanged.'
log 'Building in an isolated container: 2 GiB RAM, 3 GiB RAM+swap, 2 CPU, 1536 MiB Node heap.'
timeout --signal=TERM --kill-after=30 1500 docker run --rm --name "$BUILD_CONTAINER" \
  --memory=2g --memory-swap=3g --cpus=2 --pids-limit=512 \
  --cap-drop ALL --security-opt no-new-privileges --user 1000:1000 \
  --env-file "$WORK/build.env" --mount "type=bind,src=$CONTEXT,dst=/app" \
  --workdir /app "$BASE_IMAGE" sh -eu -c \
  'npm ci --no-audit --no-fund && npm run build && rm -rf .next/cache' \
  > "$WORK/build.log" 2>&1 || fail 'Resource-capped build failed; service unchanged. Inspect the private build log.'
# Refuse packaging if a tool unexpectedly persisted the optional upload token.
python3 - "$WORK/build.env" "$CONTEXT" <<'PY'
import pathlib, sys
token = next((line.partition("=")[2] for line in pathlib.Path(sys.argv[1]).read_text().splitlines() if line.startswith("SENTRY_AUTH_TOKEN=")), "").encode()
if token:
    root = pathlib.Path(sys.argv[2])
    for path in root.rglob("*"):
        if not path.is_file() or path.is_symlink():
            continue
        with path.open("rb") as source:
            tail = b""
            while chunk := source.read(1024*1024):
                data = tail + chunk
                assert token not in data, "Build token was persisted in output; packaging refused"
                tail = data[-len(token):]
PY
check_master
IMAGE="renttools-site:$SHA"
log 'Packaging the prepared output into a fresh non-root runtime image.'
timeout 600 docker build -f "$CONTEXT/deploy/docker/Prepared.Dockerfile" \
  --build-arg "BASE_IMAGE=$BASE_IMAGE" --build-arg "GIT_COMMIT_SHA=$SHA" \
  --tag "$IMAGE" "$CONTEXT" > "$WORK/package-image.log" 2>&1 || fail 'Prepared image packaging failed; service unchanged.'
[ "$(docker image inspect "$IMAGE" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" = "$SHA" ] || fail 'Prepared image revision mismatch.'
exec 8> "$ROOT/incoming/$SHA.upload.lock"
flock -n 8 || fail 'An upload of this release is still active.'
ARCHIVE="$ROOT/incoming/$SHA.image.tar.gz"
docker image save "$IMAGE" | gzip -1 > "$WORK/image.tar.gz"
sha256sum "$WORK/image.tar.gz" | awk '{print $1}' > "$WORK/image.sha256"
mv "$WORK/image.tar.gz" "$ARCHIVE"
mv "$WORK/image.sha256" "$ARCHIVE.sha256"
# Installer owns its own deployment/upload locks; never inherit either held.
flock -u 8
exec 8>&-
log 'Handing the local image to the verified backup/migration/rollback installer.'
bash "$ROOT/install-docker-build.sh" "$SHA"
