"""Inspect the documented deployment with no server or database mutations.

Sent over SSH stdin by the manually approved preflight workflow. Output is
limited to booleans, release identifiers, health fields and backup metadata.
Never emit environment values, guest data, application logs or remote URLs.
"""

import datetime
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import urllib.error
import urllib.request


APP = Path("/home/app/rent-tool")
BACKUPS = Path("/home/app/backups")
SETTINGS = (
    "DATABASE_URL", "TURSO_DATABASE_URL", "JWT_SECRET", "CRON_SECRET",
    "GUEST_DATA_ENCRYPTION_KEY", "PUBLIC_APP_URL",
)


def command(args):
    try:
        result = subprocess.run(
            args, capture_output=True, text=True, timeout=10,
            env={**os.environ, "GIT_OPTIONAL_LOCKS": "0"},
        )
        return result.returncode, result.stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        return None, ""


def metadata(path):
    try:
        info = path.stat()
        return {
            "present": True,
            "bytes": info.st_size,
            "modifiedUtc": datetime.datetime.fromtimestamp(
                info.st_mtime, datetime.timezone.utc,
            ).isoformat(),
        }
    except OSError:
        return {"present": False}


report = {"appDirectoryPresent": APP.is_dir()}
code, sha = command(["git", "-C", str(APP), "rev-parse", "HEAD"])
report["releaseSha"] = sha if code == 0 and re.fullmatch(r"[0-9a-f]{40}", sha) else None
code, changes = command(["git", "-C", str(APP), "status", "--porcelain", "--untracked-files=no"])
report["trackedWorkingTreeClean"] = not changes if code == 0 else None
code, state = command(["systemctl", "is-active", "rent-tool"])
report["serviceState"] = state if state in ("active", "inactive", "failed", "activating", "deactivating") else "unknown"
report["requiredSettingsPresent"] = {name: False for name in SETTINGS}
try:
    for line in (APP / ".env.production").read_text().splitlines():
        match = re.fullmatch(r"\s*(?:export\s+)?([A-Z_]+)\s*=\s*(.*?)\s*", line)
        if match and match[1] in report["requiredSettingsPresent"]:
            value = match[2].strip().strip("\"'")
            report["requiredSettingsPresent"][match[1]] = bool(value) and not value.startswith("#")
    report["environmentFileReadable"] = True
except OSError:
    report["environmentFileReadable"] = False

report["databaseFile"] = metadata(APP / "data/prod.db")
report["backupScriptPresent"] = (APP / "scripts/backup-db.sh").is_file()
report["backups"] = {"directoryPresent": BACKUPS.is_dir(), "latest": metadata(BACKUPS / "latest")}
try:
    snapshots = [path.stat() for path in (BACKUPS / "daily").glob("prod-*.db") if path.is_file()]
    report["backups"]["dailySnapshotCount"] = len(snapshots)
except OSError:
    report["backups"]["dailySnapshotCount"] = None
try:
    report["freeDiskBytes"] = shutil.disk_usage(APP).free
except OSError:
    report["freeDiskBytes"] = None

try:
    try:
        response = urllib.request.urlopen("http://127.0.0.1:3000/api/health", timeout=10)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        body = json.loads(response.read(65536))
        health = {"httpStatus": response.status}
        for key in ("status", "db"):
            if body.get(key) in ("ok", "error"):
                health[key] = body[key]
        for key in ("hasCalendarLinks", "syncStale"):
            if isinstance(body.get(key), bool):
                health[key] = body[key]
        if body.get("lastSyncMin") is None or isinstance(body.get("lastSyncMin"), (int, float)):
            health["lastSyncMin"] = body.get("lastSyncMin")
        version = body.get("version", "")
        if isinstance(version, str) and (version == "dev" or re.fullmatch(r"[0-9a-f]{7,40}", version)):
            health["version"] = version
        report["health"] = health
except (OSError, ValueError, urllib.error.URLError):
    report["health"] = {"reachable": False}

print(json.dumps(report, indent=2))
