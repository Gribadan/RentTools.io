"""Read-only inspection through the fixed, reviewed SSH deployment gateway.

Print only selected booleans, release identifiers and backup/resource metadata.
Never emit environment values, guest data, application logs or remote URLs.
"""
import datetime
import json
import os
from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path("/home/ubuntu/renttools")
CONTAINER = "renttools-site"


def command(args, timeout=15):
    try:
        result = subprocess.run(args, capture_output=True, text=True,
                                timeout=timeout, env={**os.environ, "GIT_OPTIONAL_LOCKS": "0"})
        return result.stdout.strip() if result.returncode == 0 else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def main():
    report = {"deploymentDirectoryExists": ROOT.is_dir()}
    for label, name in (("composePresent", "docker-compose.yml"),
                        ("gatewayPresent", "github-deploy-gateway.sh"),
                        ("installerPresent", "install-docker-build.sh"),
                        ("databasePresent", "data/prod.db")):
        report[label] = (ROOT/name).is_file()
    source_sha = command(["git", "-C", str(ROOT/"app"), "rev-parse", "HEAD"])
    if source_sha and re.fullmatch(r"[0-9a-f]{40}", source_sha):
        report["sourceSnapshotSha"] = source_sha
        report["sourceSnapshotTrackedClean"] = (
            command(["git", "-C", str(ROOT/"app"), "status", "--porcelain", "--untracked-files=no"]) == "")
    settings = {}
    secret_file = ROOT/"secrets.env"
    if secret_file.is_file():
        report["secretsFilePrivate"] = secret_file.stat().st_mode & 0o077 == 0
        for line in secret_file.read_text().splitlines():
            match = re.fullmatch(r"\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*", line)
            if match:
                settings[match[1]] = match[2].strip().strip("\"'")
    report["requiredSettingsPresent"] = {
        key: bool(settings.get(key)) for key in
        ("JWT_SECRET", "CRON_SECRET", "GUEST_DATA_ENCRYPTION_KEY", "PUBLIC_APP_URL")}
    backups = [p.stat().st_mtime for p in (ROOT/"backups").rglob("*.db") if p.is_file()]
    report["databaseBackupCount"] = len(backups)
    if backups:
        report["latestDatabaseBackupAt"] = datetime.datetime.fromtimestamp(
            max(backups), datetime.timezone.utc).isoformat()
    if ROOT.is_dir():
        report["freeDiskBytes"] = shutil.disk_usage(ROOT).free
    memory = Path("/proc/meminfo")
    if memory.is_file():
        match = re.search(r"^MemAvailable:\s+(\d+) kB$", memory.read_text(), re.M)
        if match:
            report["availableMemoryBytes"] = int(match[1])*1024
    inspected = command(["docker", "inspect", CONTAINER])
    if inspected:
        container = json.loads(inspected)[0]
        config = container.get("Config", {})
        effective = dict(entry.split("=", 1) for entry in config.get("Env", []) if "=" in entry)
        mounts = {m["Destination"]: m for m in container.get("Mounts", [])}
        expected = {"/data": "data", "/app/public/uploads": "uploads", "/backups": "backups"}
        report["container"] = {
            "running": container.get("State", {}).get("Running") is True,
            "nonRootUser": config.get("User") in ("node", "1000", "1000:1000"),
            "effectiveDatabasePathCorrect": effective.get("DATABASE_URL") == "file:/data/prod.db",
            "sharedEdgeNetworkPresent": "edge_net" in container.get("NetworkSettings", {}).get("Networks", {}),
            "expectedBindMounts": set(mounts) == set(expected) and all(
                mounts[target].get("Type") == "bind" and mounts[target].get("Source") == str(ROOT/source)
                for target, source in expected.items()),
        }
        image_id = container.get("Image", "")
        if re.fullmatch(r"sha256:[0-9a-f]{64}", image_id):
            report["container"]["imageId"] = image_id
        runtime_sha = effective.get("GIT_COMMIT_SHA", "")
        if re.fullmatch(r"[0-9a-f]{40}", runtime_sha):
            report["container"]["runtimeSha"] = runtime_sha
        raw_health = command(["docker", "exec", CONTAINER, "node", "-e", """
          fetch("http://127.0.0.1:3000/api/health", {redirect:"error", signal:AbortSignal.timeout(5000)})
            .then(async response => console.log(JSON.stringify({httpStatus:response.status, body:await response.json()})))
            .catch(() => process.exit(1));
        """])
        if raw_health:
            result = json.loads(raw_health)
            body = result.get("body", {})
            health = {}
            if isinstance(result.get("httpStatus"), int):
                health["httpStatus"] = result["httpStatus"]
            for key in ("status", "db"):
                if body.get(key) in ("ok", "error", "degraded"):
                    health[key] = body[key]
            version = body.get("version")
            if isinstance(version, str) and re.fullmatch(r"(?:[0-9a-f]{7,40}|dev)", version):
                health["version"] = version
            for key in ("hasCalendarLinks", "syncStale"):
                if isinstance(body.get(key), bool):
                    health[key] = body[key]
            if isinstance(body.get("lastSyncMin"), (int, float)) and not isinstance(body.get("lastSyncMin"), bool):
                health["lastSyncMin"] = body["lastSyncMin"]
            report["health"] = health
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Never let a subprocess/config exception reveal private values.
        print('{"inspectionFailed": true}')
        raise SystemExit(1)
