#!/bin/bash
# rent-tool — monthly backup-restore drill (RT-21.8).
#
# A backup you've never restored is a guess, not a backup. This script
# proves the latest snapshot at $DEST/latest is actually restorable: copy
# it to a throwaway file, run PRAGMA integrity_check, count rows in the
# core tables, compare against the live DB, alert on any mismatch.
#
# Wired up by deploy/cron/rent-tool.cron on the 1st of every month.
# Alerts via the same Telegram / webhook channel as check-resources.sh
# so the maintainer hears about a failure within a day.
#
# Exit codes: 0 = drill passed (or no backup yet — informational).
#             Non-zero is reserved; we always exit 0 so cron doesn't
#             treat a backup problem as "command failed" and email-spam.
#             The log line + alert side-channel is the report.

set -uo pipefail

DB="/home/app/rent-tool/data/prod.db"
DEST="/home/app/backups"
TEST_DB="/home/app/rent-tool/data/test-restore.db"
ENV_FILE="/home/app/rent-tool/.env.production"
HOST="$(hostname -s)"

# Tables we expect on a healthy DB. Order matters for tidy log output.
# Don't depend on schema — if a table doesn't exist (e.g. brand-new
# install hasn't pushed all migrations yet), `count_rows` returns "?"
# and the comparison treats it as a soft mismatch (logged, not alerted).
TABLES=(User Property Reservation Guest CalendarLink CalendarEvent BlogPost)

if [ -f "$ENV_FILE" ]; then
  for key in TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID ALERT_WEBHOOK_URL; do
    val="$(grep -E "^${key}=" "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"'"'")"
    [ -n "$val" ] && eval "${key}='${val//\'/}'"
  done
fi

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

count_rows() {
  local file="$1"
  local table="$2"
  sqlite3 "$file" "SELECT count(*) FROM \"$table\";" 2>/dev/null || echo "?"
}

send_alert() {
  local msg="$1"
  echo "[$(ts)] ${HOST} ALERT ${msg}" >&2

  if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
    curl -fsS --max-time 10 \
        -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
        --data-urlencode "text=⚠️ ${HOST} backup-restore drill: ${msg}" \
        >/dev/null 2>&1 \
      && echo "[$(ts)] alert sent: telegram"
  fi

  if [ -n "${ALERT_WEBHOOK_URL:-}" ]; then
    curl -fsS --max-time 10 \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"⚠️ ${HOST} backup-restore drill: ${msg//\"/\\\"}\"}" \
        "${ALERT_WEBHOOK_URL}" >/dev/null 2>&1 \
      && echo "[$(ts)] alert sent: webhook"
  fi
}

# ---- Locate the latest snapshot ----
LATEST="$DEST/latest"
if [ ! -e "$LATEST" ]; then
  echo "[$(ts)] ${HOST} drill skipped — no $LATEST symlink yet (backup-db.sh not run?)"
  exit 0
fi

# resolve the symlink so we know what file we're actually restoring
RESOLVED="$(readlink -f "$LATEST" 2>/dev/null || echo "$LATEST")"
if [ ! -f "$RESOLVED" ]; then
  send_alert "latest snapshot ${RESOLVED} missing — restore would fail"
  exit 0
fi

# ---- Restore to a throwaway file ----
rm -f "$TEST_DB"
if ! cp "$RESOLVED" "$TEST_DB"; then
  send_alert "cp $RESOLVED -> $TEST_DB failed"
  exit 0
fi

# ---- PRAGMA integrity_check ----
INTEGRITY="$(sqlite3 "$TEST_DB" "PRAGMA integrity_check;" 2>/dev/null || echo "ERROR")"
if [ "$INTEGRITY" != "ok" ]; then
  send_alert "integrity_check failed on ${RESOLVED}: ${INTEGRITY}"
  rm -f "$TEST_DB"
  exit 0
fi

# ---- Row-count comparison: backup vs live ----
SOFT_MISMATCH=0
HARD_MISMATCH=0
SUMMARY=""
for t in "${TABLES[@]}"; do
  live="$(count_rows "$DB" "$t")"
  back="$(count_rows "$TEST_DB" "$t")"
  SUMMARY="${SUMMARY}${t}=${back}/${live} "

  # If a table doesn't exist on either side ("?"), don't alert — it's a
  # legitimate state during a fresh install or a rolled-back migration.
  if [ "$live" = "?" ] || [ "$back" = "?" ]; then
    SOFT_MISMATCH=$((SOFT_MISMATCH + 1))
    continue
  fi

  # Backup taken at 03:15 UTC — by the time the drill runs (typically
  # shortly after), live has had ~hours of writes. Allow live to be
  # AHEAD of the backup; alert only if backup is empty when live isn't,
  # or if backup is ahead of live (impossible without time-travel).
  if [ "$back" -eq 0 ] && [ "$live" -gt 0 ]; then
    HARD_MISMATCH=$((HARD_MISMATCH + 1))
  elif [ "$back" -gt "$live" ]; then
    HARD_MISMATCH=$((HARD_MISMATCH + 1))
  fi
done

if [ "$HARD_MISMATCH" -gt 0 ]; then
  send_alert "row-count mismatch in ${HARD_MISMATCH} table(s) — ${SUMMARY}(format backup/live)"
  rm -f "$TEST_DB"
  exit 0
fi

echo "[$(ts)] ${HOST} drill OK from ${RESOLVED} integrity=ok ${SUMMARY}(format backup/live; soft=${SOFT_MISMATCH})"
rm -f "$TEST_DB"
exit 0
