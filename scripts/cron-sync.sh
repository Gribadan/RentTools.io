#!/bin/bash
# rent-tool — calendar sync cron wrapper.
#
# Sources CRON_SECRET from .env.production (so the secret never appears
# in the crontab itself), then calls the local sync endpoint.
#
# Wired up by deploy/cron/rent-tool.cron, which runs this every 10 min
# under the `app` user.
#
# Exit codes:
#   0  curl returned 2xx (sync triggered or skipped per app's frequency check)
#   1  missing env file or CRON_SECRET unset
#   2  curl failed (network, 4xx, 5xx) — see log line for details

set -uo pipefail

ENV_FILE="/home/app/rent-tool/.env.production"
ENDPOINT="http://127.0.0.1:3000/api/calendar/cron"

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

if [ ! -f "$ENV_FILE" ]; then
  echo "[$(ts)] FATAL missing env file: $ENV_FILE"
  exit 1
fi

# Source only the CRON_SECRET line — keeps unrelated env vars out of the
# wrapper's environment and avoids surprises from quoting issues elsewhere
# in the file.
CRON_SECRET="$(grep -E '^CRON_SECRET=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"'"'")"

if [ -z "${CRON_SECRET:-}" ]; then
  echo "[$(ts)] FATAL CRON_SECRET not set in $ENV_FILE"
  exit 1
fi

# -f  fail loudly on 4xx/5xx
# -s  silent (no progress)
# -S  show errors anyway
# -m  hard cap on total time
HTTP_OUT="$(curl -fsS -m 30 "${ENDPOINT}?secret=${CRON_SECRET}" 2>&1)"
RC=$?

if [ $RC -ne 0 ]; then
  # Strip the secret out of any curl-echoed URL before logging.
  SCRUBBED="${HTTP_OUT//${CRON_SECRET}/[REDACTED]}"
  echo "[$(ts)] FAIL rc=$RC ${SCRUBBED}"
  exit 2
fi

echo "[$(ts)] OK ${HTTP_OUT}"
