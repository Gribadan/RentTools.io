#!/bin/bash
# rent-tool — daily SQLite backup with tiered retention.
#
# Uses sqlite3's online ".backup" command (not cp) to take a
# transactionally-consistent snapshot even while the app is writing.
#
# Layout:
#   /home/app/backups/
#     daily/   — last 14 nightly snapshots
#     weekly/  — last 8 Sunday snapshots (hardlinked into daily/)
#     monthly/ — last 6 first-of-month snapshots (hardlinked into daily/)
#     latest -> daily/prod-YYYYMMDD-HHMM.db   (symlink for easy access)
#
# Hardlinks across tiers mean rotation in `daily/` doesn't actually free
# disk space if the same backup is also referenced from weekly/monthly —
# the inode stays alive until ALL references are removed. So you keep
# at most ~14 + 8 + 6 = 28 distinct on-disk snapshots.
#
# Wired up by deploy/cron/rent-tool.cron at 03:15 every day.
#
# Restore procedure: see docs/DROPLET-SETUP.md §7.

set -euo pipefail

DB="/home/app/rent-tool/data/prod.db"
DEST="/home/app/backups"
STAMP="$(date +%Y%m%d-%H%M)"
DOW="$(date +%u)"   # 1=Mon … 7=Sun
DOM="$(date +%d)"   # 01..31

mkdir -p "$DEST/daily" "$DEST/weekly" "$DEST/monthly"

if [ ! -f "$DB" ]; then
  echo "[$(date -Is)] FATAL database file not found: $DB" >&2
  exit 1
fi

DAILY="$DEST/daily/prod-$STAMP.db"

# Online backup — safe even while the app writes.
sqlite3 "$DB" ".backup '$DAILY'"

# Verify the backup is a valid SQLite file (catches partial-write errors).
if ! sqlite3 "$DAILY" "PRAGMA integrity_check;" | grep -q '^ok$'; then
  echo "[$(date -Is)] FATAL integrity check failed on $DAILY" >&2
  rm -f "$DAILY"
  exit 2
fi

# Symlink "latest" for quick access in restore scripts.
ln -sfn "daily/prod-$STAMP.db" "$DEST/latest"

# Promote into weekly tier on Sunday.
if [ "$DOW" -eq 7 ]; then
  ln -f "$DAILY" "$DEST/weekly/prod-$STAMP.db"
fi

# Promote into monthly tier on the 1st.
if [ "$DOM" = "01" ]; then
  ln -f "$DAILY" "$DEST/monthly/prod-$STAMP.db"
fi

# Rotation — keep newest N in each tier, delete the rest.
# `ls -1t prod-*.db` exits non-zero on an empty dir (no match), which kills
# the pipeline under pipefail; use a glob + nullglob fallback so empty dirs
# are a no-op.
prune_tier() {
  local dir="$1"
  local keep="$2"
  (
    shopt -s nullglob
    cd "$dir" || return 0
    local files=( prod-*.db )
    [ ${#files[@]} -le "$keep" ] && return 0
    ls -1t prod-*.db | tail -n +"$((keep + 1))" | xargs -r rm -f
  )
}

prune_tier "$DEST/daily" 14
prune_tier "$DEST/weekly" 8
prune_tier "$DEST/monthly" 6

echo "[$(date -Is)] OK $DAILY ($(stat -c %s "$DAILY") bytes)"
