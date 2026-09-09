#!/usr/bin/env bash
# Reviewed server-side installer used only through github-deploy-gateway.sh.
# Never invoke the legacy systemd/nginx installer on this shared Docker host.
set -euo pipefail
umask 077
ROOT=/home/ubuntu/renttools
SOURCE="$ROOT/app"
COMPOSE="$ROOT/docker-compose.yml"
SECRETS="$ROOT/secrets.env"
OVERRIDE="$ROOT/deploy.override.yml"
CONTAINER=renttools-site
SHA=${1:-}
[[ "$SHA" =~ ^[0-9a-f]{40}$ ]] || { echo 'A full lowercase commit SHA is required.' >&2; exit 1; }
IMAGE="renttools-site:$SHA"
ARCHIVE="$ROOT/incoming/$SHA.image.tar.gz"
cd "$ROOT"
exec 9> "$ROOT/deployment.lock"
flock -n 9 || { echo 'Another RentTools deployment is active.' >&2; exit 1; }
exec 8> "$ROOT/incoming/$SHA.upload.lock"
flock -n 8 || { echo 'Image upload is still active.' >&2; exit 1; }

log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*"; }
fail() { log "ABORT: $*" >&2; exit 1; }
for FILE in "$COMPOSE" "$SECRETS" "$ARCHIVE" "$ARCHIVE.sha256" "$ROOT/data/prod.db"; do
  [ -f "$FILE" ] || fail 'Required deployment file is missing.'
done
for TOOL in docker python3 git flock gzip sha256sum; do command -v "$TOOL" >/dev/null || fail "Required tool is missing: $TOOL"; done
[ "$(id -u)" = 1000 ] || fail 'The deployment account must match the existing data owner (UID 1000).'
GIT_OPTIONAL_LOCKS=0 git -C "$SOURCE" diff --quiet || fail 'Source snapshot has uncommitted tracked changes.'
GIT_OPTIONAL_LOCKS=0 git -C "$SOURCE" diff --cached --quiet || fail 'Source snapshot has staged changes.'
SOURCE_SHA=$(git -C "$SOURCE" rev-parse HEAD)
MASTER_SHA=$(git ls-remote https://github.com/Gribadan/RentTools.io refs/heads/master | awk '{print $1}')
[ "$MASTER_SHA" = "$SHA" ] || fail 'Only the current public master commit can be installed.'
OLD_IMAGE=$(docker inspect "$CONTAINER" --format '{{.Image}}')
[ "$(docker inspect "$CONTAINER" --format '{{.State.Running}}')" = true ] || fail 'Existing RentTools container must be running before deployment.'
docker network inspect edge_net >/dev/null

# Read only selected metadata into memory; never print resolved Compose env or
# secret values. Refuse an unexpected container, bind mount or runtime setting.
python3 - "$ROOT" "$CONTAINER" <<'PY'
import json, os, pathlib, re, shutil, subprocess, sys
root = pathlib.Path(sys.argv[1])
container = json.loads(subprocess.check_output(["docker", "inspect", sys.argv[2]]))[0]
labels = container["Config"].get("Labels") or {}
assert labels.get("com.docker.compose.project") == "renttools", "Unexpected Compose project"
assert labels.get("com.docker.compose.service") == "site", "Unexpected Compose service"
assert container["Config"].get("User") in ("node", "1000", "1000:1000"), "Unexpected container user"
mounts = {m["Destination"]: m for m in container["Mounts"]}
expected = {"/data":"data", "/app/public/uploads":"uploads", "/backups":"backups"}
assert set(mounts) == set(expected), "Unexpected container mounts"
for target, source in expected.items():
    assert mounts[target]["Type"] == "bind" and mounts[target]["Source"] == str(root/source), "Unexpected bind path"
    assert (root/source).stat().st_uid == 1000, "Unexpected data ownership"
assert "edge_net" in container["NetworkSettings"]["Networks"], "Shared edge network missing"
settings = {}
for line in (root/"secrets.env").read_text().splitlines():
    match = re.fullmatch(r"\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*", line)
    if match:
        settings[match[1]] = match[2].strip().strip("\"'")
for name in ("JWT_SECRET", "CRON_SECRET", "GUEST_DATA_ENCRYPTION_KEY", "PUBLIC_APP_URL"):
    assert settings.get(name), "Required runtime setting is absent: " + name
assert re.fullmatch(r"[0-9a-fA-F]{64}", settings["GUEST_DATA_ENCRYPTION_KEY"]), "Invalid guest encryption key format"
assert "https://renttools.io" in [v.strip().rstrip("/") for v in settings["PUBLIC_APP_URL"].split(",")], "Canonical origin is missing"
effective = dict(entry.split("=", 1) for entry in container["Config"].get("Env", []) if "=" in entry)
assert effective.get("DATABASE_URL") == "file:/data/prod.db", "Unexpected effective database setting"
assert shutil.disk_usage(root).free >= 4*1024**3, "At least 4 GiB free is required"
PY

EXPECTED_DIGEST=$(cat "$ARCHIVE.sha256")
[[ "$EXPECTED_DIGEST" =~ ^[0-9a-f]{64}$ ]] || fail 'Invalid image checksum record.'
[ "$(sha256sum "$ARCHIVE" | awk '{print $1}')" = "$EXPECTED_DIGEST" ] || fail 'Image checksum mismatch.'
python3 - "$ARCHIVE" "$IMAGE" "$SHA" <<'PY'
import json, sys, tarfile
with tarfile.open(sys.argv[1], "r:gz") as archive:
    member = archive.getmember("manifest.json")
    assert member.size < 65536, "Invalid image manifest"
    manifest = json.load(archive.extractfile(member))
    assert len(manifest) == 1 and manifest[0].get("RepoTags") == [sys.argv[2]], "Unexpected image tag"
    member = archive.getmember(manifest[0]["Config"])
    assert member.size < 1024*1024, "Invalid image config"
    config = json.load(archive.extractfile(member))["config"]
    assert config.get("User") in ("node", "1000", "1000:1000"), "Image must run as the existing non-root user"
    assert config.get("Labels", {}).get("org.opencontainers.image.revision") == sys.argv[3], "Image revision mismatch"
    assert not config.get("Volumes"), "Unexpected image volumes"
PY

RUN_DIR=$(mktemp -d "$ROOT/backups/deploy-${SHA:0:12}-$(date -u +%Y%m%dT%H%M%S).XXXXXX")
backup_database() {
  python3 - "${2:-$ROOT/data/prod.db}" "$1" <<'PY'
import pathlib, sqlite3, sys
source = sqlite3.connect(pathlib.Path(sys.argv[1]).as_uri() + "?mode=ro", uri=True, timeout=30)
target = sqlite3.connect(sys.argv[2], timeout=30)
try:
    source.backup(target, pages=256, sleep=0.1)
    assert target.execute("PRAGMA integrity_check").fetchall() == [("ok",)], "Backup integrity check failed"
finally:
    target.close(); source.close()
PY
}
log 'Creating an online, integrity-checked database backup.'
backup_database "$RUN_DIR/before.db"
cp "$COMPOSE" "$RUN_DIR/docker-compose.yml"
HAD_OVERRIDE=false
if [ -f "$OVERRIDE" ]; then cp "$OVERRIDE" "$RUN_DIR/previous.override.yml"; HAD_OVERRIDE=true; fi
CONFIG_DIGEST=$(sha256sum "$COMPOSE" "$SECRETS" | sha256sum | awk '{print $1}')
ROLLBACK_TAG="renttools-site:rollback-$(date -u +%Y%m%dT%H%M%S)-${SHA:0:7}"
docker image tag "$OLD_IMAGE" "$ROLLBACK_TAG"
gzip -dc "$ARCHIVE" | docker image load > "$RUN_DIR/image-load.log" 2>&1
NEW_IMAGE=$(docker image inspect "$IMAGE" --format '{{.Id}}')
[ "$(docker image inspect "$IMAGE" --format '{{index .Config.Labels "org.opencontainers.image.revision"}}')" = "$SHA" ] || fail 'Loaded image revision mismatch.'

# The copy contains real data and stays in the private backup directory. It is
# never uploaded or logged. The candidate receives only this scratch mount.
mkdir "$RUN_DIR/scratch"
backup_database "$RUN_DIR/scratch/prod.db" "$RUN_DIR/before.db"
MIGRATE=(docker run --rm --network none --cap-drop ALL --security-opt no-new-privileges --user 1000:1000)
log 'Testing the candidate migration against a private database copy.'
"${MIGRATE[@]}" --mount "type=bind,src=$RUN_DIR/scratch,dst=/data" \
  --env DATABASE_URL=file:/data/prod.db "$IMAGE" ./node_modules/.bin/tsx prisma/push-schema.ts \
  > "$RUN_DIR/migration-dry-run.log" 2>&1 || fail 'Migration rehearsal failed; the running service was not changed.'
python3 - "$RUN_DIR/before.db" "$RUN_DIR/scratch/prod.db" <<'PY'
import pathlib, sqlite3, sys
before, after = [sqlite3.connect(pathlib.Path(p).as_uri()+"?mode=ro", uri=True) for p in sys.argv[1:]]
try:
    assert after.execute("PRAGMA integrity_check").fetchall() == [("ok",)], "Rehearsed database integrity failed"
    tables = [r[0] for r in before.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
    for table in tables:
        quoted = '"' + table.replace('"', '""') + '"'
        old = {r[1]: r for r in before.execute("PRAGMA table_info("+quoted+")")}
        new = {r[1]: r for r in after.execute("PRAGMA table_info("+quoted+")")}
        assert set(old) <= set(new), "Migration removed an existing column or table"
        for name, column in old.items():
            assert column[2] == new[name][2] and column[5] == new[name][5], "Migration changed an existing column type/key"
            assert not (not column[3] and new[name][3]), "Migration tightened nullability"
        assert after.execute("SELECT count(*) FROM "+quoted).fetchone()[0] >= before.execute("SELECT count(*) FROM "+quoted).fetchone()[0], "Migration removed stored rows"
    assert not after.execute("PRAGMA foreign_key_check").fetchone(), "Migration produced foreign-key violations"
finally:
    before.close(); after.close()
PY

# Existing env interpolation, networks, restart policy, mounts and resource
# limits come from the deployed Compose file. Override only this service.
cat > "$RUN_DIR/candidate.override.yml" <<EOF
services:
  site:
    image: $IMAGE
    user: "1000:1000"
    env_file:
      - $SECRETS
    environment:
      NODE_ENV: production
      PORT: "3000"
      DATABASE_URL: file:/data/prod.db
      GIT_COMMIT_SHA: "$SHA"
    cap_drop:
      - ALL
    security_opt:
      - no-new-privileges:true
EOF
BASE=(docker compose --project-name renttools --env-file "$SECRETS" -f "$COMPOSE")
"${BASE[@]}" -f "$RUN_DIR/candidate.override.yml" config --quiet
python3 - "$ROOT" "$RUN_DIR/candidate.override.yml" "$IMAGE" "$SHA" <<'PY'
import json, pathlib, subprocess, sys
root = pathlib.Path(sys.argv[1])
config = json.loads(subprocess.check_output([
    "docker", "compose", "--project-name", "renttools", "--env-file", str(root/"secrets.env"),
    "-f", str(root/"docker-compose.yml"), "-f", sys.argv[2], "config", "--format", "json"]))
assert set(config["services"]) == {"site"}, "Unexpected Compose services"
site = config["services"]["site"]
assert site.get("image") == sys.argv[3] and site.get("user") == "1000:1000", "Unexpected candidate image/user"
assert site.get("container_name") == "renttools-site", "Unexpected candidate container name"
assert not any(site.get(key) for key in ("privileged", "devices", "network_mode", "pid", "ipc", "ports", "cap_add")), "Unexpected candidate host access"
mounts = {mount["target"]: mount for mount in site.get("volumes", [])}
expected = {"/data":"data", "/app/public/uploads":"uploads", "/backups":"backups"}
assert set(mounts) == set(expected), "Unexpected candidate mounts"
for target, source in expected.items():
    assert mounts[target]["type"] == "bind" and mounts[target]["source"] == str(root/source), "Unexpected candidate bind path"
assert "edge_net" in site.get("networks", {}), "Candidate edge network missing"
environment = site.get("environment", {})
assert environment.get("DATABASE_URL") == "file:/data/prod.db", "Unexpected candidate database path"
assert environment.get("GIT_COMMIT_SHA") == sys.argv[4], "Candidate runtime SHA mismatch"
for name in ("JWT_SECRET", "CRON_SECRET", "GUEST_DATA_ENCRYPTION_KEY", "PUBLIC_APP_URL"):
    assert environment.get(name), "Required candidate setting is absent: " + name
PY
[ "$(sha256sum "$COMPOSE" "$SECRETS" | sha256sum | awk '{print $1}')" = "$CONFIG_DIGEST" ] || fail 'Runtime configuration changed during rehearsal.'
[ "$(docker inspect "$CONTAINER" --format '{{.Image}}')" = "$OLD_IMAGE" ] || fail 'Running image changed during rehearsal.'
[ "$(git ls-remote https://github.com/Gribadan/RentTools.io refs/heads/master | awk '{print $1}')" = "$SHA" ] || fail 'Master changed during rehearsal; deploy the current commit.'

check_health() {
  local EXPECTED_IMAGE=$1 EXPECTED_SHA=${2:-}
  [ "$(docker inspect "$CONTAINER" --format '{{.Image}}' 2>/dev/null || true)" = "$EXPECTED_IMAGE" ] &&
    docker exec "$CONTAINER" node -e '
      const expected = process.argv[1];
      fetch("http://127.0.0.1:3000/api/health", {redirect:"error", signal:AbortSignal.timeout(4000)})
        .then(async response => {
          const body = await response.json();
          const versionMatches = !expected ||
            (body.version === expected.slice(0, 7) && process.env.GIT_COMMIT_SHA === expected);
          process.exit(response.ok && body.status === "ok" && body.db === "ok" && versionMatches ? 0 : 1);
        }).catch(() => process.exit(1));
    ' "$EXPECTED_SHA" >/dev/null 2>&1
}

MUTATING=false
MIGRATION_ATTEMPTED=false
CANDIDATE_STARTED=false
SUCCESS=false
rollback() {
  RESULT=$?
  trap - EXIT
  if [ "$MUTATING" = true ] && [ "$SUCCESS" != true ]; then
    log 'Restoring the previous image; verified backups are preserved.'
    if [ "$MIGRATION_ATTEMPTED" = true ] && [ "$CANDIDATE_STARTED" = false ]; then
      # All app writers are still stopped. A failed DDL runner may have left
      # a partial schema, so restore the final snapshot before starting old code.
      # Once a candidate has been started, never overwrite its possible writes.
      if ! backup_database "$ROOT/data/prod.db" "$RUN_DIR/final-before-migration.db"; then
        log 'ROLLBACK FAILED: database restoration failed; the app remains stopped.'
        exit 1
      fi
    fi
    if [ "$HAD_OVERRIDE" = true ]; then
      cp "$RUN_DIR/previous.override.yml" "$OVERRIDE"
      PREVIOUS=("${BASE[@]}" -f "$OVERRIDE")
    else
      rm -f "$OVERRIDE"
      PREVIOUS=("${BASE[@]}")
    fi
    printf 'services:\n  site:\n    image: %s\n' "$OLD_IMAGE" > "$RUN_DIR/rollback.override.yml"
    if "${PREVIOUS[@]}" -f "$RUN_DIR/rollback.override.yml" up -d --no-deps --no-build --pull never site \
      >> "$RUN_DIR/rollback.log" 2>&1; then
      RESTORED=false
      for ATTEMPT in $(seq 1 30); do
        if check_health "$OLD_IMAGE"; then RESTORED=true; break; fi
        sleep 4
      done
      if [ "$RESTORED" = true ]; then
        log 'Previous image and application database health verified.'
      else
        log 'ROLLBACK FAILED: previous image did not become healthy; maintainer intervention is required.'
      fi
    else
      log 'ROLLBACK FAILED: previous container could not start; maintainer intervention is required.'
    fi
  fi
  exit "$RESULT"
}
trap rollback EXIT
log 'Pausing only the RentTools service for its final backup and migration.'
MUTATING=true
docker stop --time 30 "$CONTAINER" > /dev/null
backup_database "$RUN_DIR/final-before-migration.db"
MIGRATION_ATTEMPTED=true
"${MIGRATE[@]}" --mount "type=bind,src=$ROOT/data,dst=/data" \
  --env DATABASE_URL=file:/data/prod.db "$IMAGE" ./node_modules/.bin/tsx prisma/push-schema.ts \
  > "$RUN_DIR/migration.log" 2>&1 || fail 'Production migration failed.'
cp "$RUN_DIR/candidate.override.yml" "$ROOT/deploy.override.yml.next"
mv "$ROOT/deploy.override.yml.next" "$OVERRIDE"
CANDIDATE_STARTED=true
"${BASE[@]}" -f "$OVERRIDE" up -d --no-deps --no-build --pull never site \
  > "$RUN_DIR/compose.log" 2>&1 || fail 'Candidate container did not start.'

log 'Checking the running image, runtime release SHA and application database health.'
HEALTHY=false
for ATTEMPT in $(seq 1 45); do
  if check_health "$NEW_IMAGE" "$SHA"; then HEALTHY=true; break; fi
  sleep 4
done
[ "$HEALTHY" = true ] || fail 'Candidate health check failed.'
docker image tag "$NEW_IMAGE" renttools-site:latest
python3 - "$ROOT" "$SHA" "$NEW_IMAGE" "$OLD_IMAGE" "$SOURCE_SHA" "$RUN_DIR" <<'PY'
import datetime, json, os, pathlib, sys
root = pathlib.Path(sys.argv[1])
record = {"sha":sys.argv[2], "image":sys.argv[3], "previousImage":sys.argv[4],
          "sourceSnapshotSha":sys.argv[5], "backupDirectory":sys.argv[6],
          "deployedAt":datetime.datetime.now(datetime.timezone.utc).isoformat()}
temporary = root/"release.json.next"
temporary.write_text(json.dumps(record, indent=2)+"\n")
os.replace(temporary, root/"release.json")
PY
SUCCESS=true
# Only this completed upload and old RentTools image tags are eligible for
# cleanup. Keep the running and rollback images plus the three newest images.
# Never prune Docker globally or delete verified database backups.
rm -f "$ARCHIVE" "$ARCHIVE.sha256"
python3 - "$NEW_IMAGE" "$OLD_IMAGE" <<'PY' || log 'Image retention cleanup was incomplete; the healthy release is unchanged.'
import json, re, subprocess, sys
ids = set(subprocess.check_output(["docker", "image", "ls", "--no-trunc", "--quiet", "renttools-site"], text=True).split())
images = json.loads(subprocess.check_output(["docker", "image", "inspect", *sorted(ids)])) if ids else []
keep = set(sys.argv[1:]) | {image["Id"] for image in sorted(images, key=lambda item: item["Created"], reverse=True)[:3]}
for image in images:
    if image["Id"] in keep:
        continue
    for tag in image.get("RepoTags") or []:
        if re.fullmatch(r"renttools-site:(?:[0-9a-f]{40}|rollback-[0-9TZ]+-[0-9a-f]{7})", tag):
            # No --force: Docker retains anything still used by a container.
            subprocess.run(["docker", "image", "rm", tag], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
PY
log "Deployment healthy at $SHA. The source snapshot is retained unchanged; release.json and the image identify runtime code."
