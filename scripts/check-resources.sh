#!/bin/bash
# rent-tool — hourly droplet resource check.
#
# Reads thresholds from .env.production (RAM_WARN_PCT, DISK_WARN_PCT).
# When a threshold is exceeded, posts a warning via:
#   1. Telegram, if TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID are set
#   2. Generic webhook, if ALERT_WEBHOOK_URL is set
#   3. Falls back to logging only (still useful — appears in cron log)
#
# Wired up by deploy/cron/rent-tool.cron at the top of every hour.
#
# Designed to never error in the "no alerting configured" path so the
# cron doesn't fill the inbox with failure emails.

set -uo pipefail

ENV_FILE="/home/app/rent-tool/.env.production"
HOST="$(hostname -s)"

# Defaults — overridable from env file.
RAM_WARN_PCT=90
DISK_WARN_PCT=80

if [ -f "$ENV_FILE" ]; then
  # Pull only the keys we care about, ignore unrelated quoting issues.
  for key in TELEGRAM_BOT_TOKEN TELEGRAM_CHAT_ID ALERT_WEBHOOK_URL RAM_WARN_PCT DISK_WARN_PCT; do
    val="$(grep -E "^${key}=" "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d '"'"'")"
    [ -n "$val" ] && eval "${key}='${val//\'/}'"
  done
fi

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }

# ---- Sample current state ----
RAM_TOTAL_KB="$(grep -E '^MemTotal:' /proc/meminfo | awk '{print $2}')"
RAM_AVAIL_KB="$(grep -E '^MemAvailable:' /proc/meminfo | awk '{print $2}')"
RAM_USED_PCT=$(( ( (RAM_TOTAL_KB - RAM_AVAIL_KB) * 100 ) / RAM_TOTAL_KB ))

DISK_USED_PCT="$(df --output=pcent / | tail -1 | tr -dc '0-9')"

LOAD1="$(awk '{print $1}' /proc/loadavg)"

SUMMARY="ram=${RAM_USED_PCT}% disk=${DISK_USED_PCT}% load1=${LOAD1}"

# ---- Decide if we need to alert ----
ALERT_REASON=""
if [ "$RAM_USED_PCT" -ge "$RAM_WARN_PCT" ]; then
  ALERT_REASON="RAM ${RAM_USED_PCT}% >= ${RAM_WARN_PCT}%"
fi
if [ "$DISK_USED_PCT" -ge "$DISK_WARN_PCT" ]; then
  ALERT_REASON="${ALERT_REASON:+$ALERT_REASON; }DISK ${DISK_USED_PCT}% >= ${DISK_WARN_PCT}%"
fi

if [ -z "$ALERT_REASON" ]; then
  echo "[$(ts)] ${HOST} OK ${SUMMARY}"
  exit 0
fi

MSG="⚠️ ${HOST} ${ALERT_REASON} | ${SUMMARY}"
echo "[$(ts)] ${HOST} ALERT ${ALERT_REASON} ${SUMMARY}"

# ---- Try to send the alert ----
sent=0

if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
  if curl -fsS --max-time 10 \
      -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
      --data-urlencode "text=${MSG}" \
      >/dev/null 2>&1; then
    echo "[$(ts)] alert sent: telegram"
    sent=1
  else
    echo "[$(ts)] alert FAILED: telegram (rc=$?)" >&2
  fi
fi

if [ -n "${ALERT_WEBHOOK_URL:-}" ]; then
  if curl -fsS --max-time 10 \
      -H "Content-Type: application/json" \
      -d "{\"text\":\"${MSG//\"/\\\"}\"}" \
      "${ALERT_WEBHOOK_URL}" >/dev/null 2>&1; then
    echo "[$(ts)] alert sent: webhook"
    sent=1
  else
    echo "[$(ts)] alert FAILED: webhook (rc=$?)" >&2
  fi
fi

if [ "$sent" -eq 0 ]; then
  echo "[$(ts)] alert NOT sent (no TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID or ALERT_WEBHOOK_URL configured)" >&2
fi

# Always exit 0 — cron should not retry / treat threshold breaches as
# "command failed". The log + alert side-channel is the report.
exit 0
