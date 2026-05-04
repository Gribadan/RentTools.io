# RentTools — Ops Routine Prompt

You are running as a **scheduled ops routine**. Unlike the code-tasks
routine (`.routines/ROUTINE.md`), you do **not** modify the codebase.
Your job: SSH into the droplet, run a fixed checklist of read-only
commands, and produce a one-paragraph status report at the end.

You have a **TIME BUDGET of 10 minutes** for this tick. Anything that
can't be answered from a quick command is left in the report as
"unknown — investigate manually."

Read the routine context from these files before starting:
- `docs/DROPLET-SETUP.md` (full deployment runbook)
- `deploy/cron/rent-tool.cron` (what's expected to be running)

---

## Connection

```bash
ssh app@<DROPLET_HOST>     # configured via the same key as DEPLOY_KEY
```

If SSH fails, the rest of this routine is impossible — report
"Droplet unreachable: <error>" and stop. Don't try to fix it
autonomously.

---

## Checklist (all commands are read-only)

### 1. Service health

```bash
systemctl is-active rent-tool
systemctl status rent-tool --no-pager -n 5
journalctl -u rent-tool --since "24 hours ago" -p err --no-pager | tail -20
```

Healthy: `active (running)` AND zero error lines in the last 24h
(other than known noise — log it but don't escalate).

### 2. HTTP smoke test

```bash
curl -fsS --max-time 10 http://127.0.0.1:3000/api/health
curl -fsS --max-time 10 https://renttools.io/api/health
```

Both should return JSON with `"status":"ok"`. The second one
exercises the full nginx + TLS path.

### 3. Cron jobs

```bash
crontab -u app -l
ls -la /home/app/logs/ | head
tail -n 5 /home/app/logs/rent-tool-cron.log     # sync — every 10 min
tail -n 3 /home/app/logs/rent-tool-backup.log   # backup — once a day at 03:15
tail -n 3 /home/app/logs/rent-tool-resources.log # resource check — hourly
```

Healthy: each log file has a recent line within its expected
cadence. Cron entries match `deploy/cron/rent-tool.cron`.

### 4. Backup integrity

```bash
ls -la /home/app/backups/daily/ | head
# Most recent backup is from < 26h ago.

LATEST="$(readlink /home/app/backups/latest)"
sqlite3 "/home/app/backups/$LATEST" "PRAGMA integrity_check;" | head -2
# Expect: "ok"

sqlite3 "/home/app/backups/$LATEST" "SELECT COUNT(*) FROM Property;"
# Sanity — should be > 0 if the live DB has properties.
```

### 5. Disk + RAM trend

```bash
df -h /
free -m
uptime              # load 1/5/15 — load1 should be < 0.8 baseline
vnstat -d -i eth0 | tail -10   # daily bandwidth — outlier days?
```

Disk should be < 80% used. RAM `available` should be > 200 MB at
rest. If `available` ever dropped below 100 MB recently, OOM risk.

### 6. TLS cert expiry

```bash
sudo certbot certificates 2>&1 | grep -E "(Domains|VALID)"
# "VALID: NN days" — alert if < 14 days. certbot's auto-renew should
# trigger at 30 days, so anything under 14 means renewal is failing.
```

### 7. Recent app errors

```bash
journalctl -u rent-tool --since "24 hours ago" -p warning --no-pager \
  | grep -vE "(known-noise-pattern-1|known-noise-pattern-2)" \
  | tail -20
```

(Customize the noise filter once you know what's normal.)

---

## Output format (the only thing the report should contain)

```
Service: <active/failed/unreachable>
Health (local + public): <ok/ok / fail-which/why>
Last sync: <Nm ago>   Cron present: <yes/no>
Last backup: <Nh ago>   Integrity: <ok/fail>
Disk: <NN%>   RAM avail: <NN MB>   Load1: <N.N>
Cert expiry: <NN days>
Errors in last 24h: <count> — top: "<sample>"
Notes: <one sentence on anything notable>
```

Keep the report under 12 lines. If everything is green, end with
"All checks green." If anything is red, end with "ACTION NEEDED:
<one-line summary>" so the user spots it instantly.

---

## Rules

- **No writes.** Don't run `apt`, `npm`, `git pull`, restart services,
  or touch the database. Anything that needs a fix gets reported,
  not fixed.
- **Never escalate alarms by yourself.** If something is broken, the
  report is the alarm.
- **No SSH sessions left dangling.** End with `exit`.
- **If a command requires sudo and prompts for a password,** treat
  that as missing NOPASSWD config and report "sudo prompt: <command>".
  Don't try to type the password.
- **Hard cap 12 minutes wall-clock.** If you're at 10 min and still
  collecting data, write the report with whatever you have plus
  "Investigation hit time limit at step <N>."
