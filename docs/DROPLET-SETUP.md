# DigitalOcean droplet setup

This is the runbook for self-hosting `rent-tool` on a single DigitalOcean droplet
(or any Ubuntu 24.04 VPS — DO is just the cheapest convenient option).

## What you'll end up with

A single $4–6/month droplet running:
- Next.js app served on `localhost:3000`, supervised by **systemd** (auto-restart on crash, auto-start on reboot)
- **nginx** reverse proxy on 80/443 with **Let's Encrypt** TLS
- **SQLite** database file on the same droplet (no separate DB host)
- Native **cron** for calendar sync every 10 minutes
- **Daily SQLite backups** with rotation (14 daily / 8 weekly / 6 monthly)
- **ufw** firewall + **fail2ban** + automatic security updates

Whole setup is ~30 minutes once you have the droplet.

---

## 0. Provision the droplet

1. Create a DO droplet:
   - **Image**: Ubuntu 24.04 LTS x64
   - **Plan**: Basic — Regular CPU — $6/mo (1 GB RAM, 25 GB SSD) is recommended.
     The $4 plan (512 MB RAM) works but you NEED 2 GB swap (the bootstrap
     script handles that), and Next builds are slow.
   - **Region**: closest to your users
   - **Authentication**: SSH key (paste your local `.pub`) — recommended.
     If you go with password, keep it somewhere safe.
2. Once it boots, you have an IP and root credentials.

## 1. First-time SSH + lock things down

From your laptop:

```bash
ssh root@<DROPLET_IP>
```

Once you're in, copy the bootstrap script (from this repo) to the droplet
and run it as root:

```bash
# from your laptop, in the repo root
scp scripts/server-bootstrap.sh root@<DROPLET_IP>:/root/
ssh root@<DROPLET_IP> "chmod +x /root/server-bootstrap.sh && /root/server-bootstrap.sh"
```

The script (idempotent, safe to re-run):

- Adds 2 GB swap (skip if already present)
- Updates apt + installs base packages
- Installs Node 22 LTS via NodeSource
- Installs certbot via snap
- Configures **ufw**: deny incoming except 22 / 80 / 443
- Configures **fail2ban** with sane SSH defaults (5 fails / 10 min → 1 h ban)
- Enables **unattended-upgrades** (auto security patches)
- Creates an `app` user with passwordless sudo
- Copies your `root/.ssh/authorized_keys` to `app/.ssh/authorized_keys`
- Creates `/home/app/rent-tool`, `/home/app/backups`, `/home/app/logs`
- Removes the default nginx site

After it finishes, verify you can SSH in as `app`:

```bash
ssh app@<DROPLET_IP>
sudo whoami      # should print "root"
node --version   # should print v22.x
```

## 2. Disable root password auth (optional, recommended)

Once you've confirmed key-based SSH works for `root` AND `app`, harden:

```bash
ssh root@<DROPLET_IP>
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config
systemctl restart ssh
```

Now only key-auth works. **Keep your private key backed up.**

## 3. Clone the repo + install deps

(Done by the deploy script in RT-13.3 / RT-13.13 — see the routines TASKS list
under Week 13 for the systemd unit, deploy script, and CI workflow that
automate steps 3–5.)

```bash
ssh app@<DROPLET_IP>
cd /home/app
git clone https://github.com/<your-account>/RentTools.io.git
cd RentTools.io
cp .env.example .env.production
# edit .env.production — fill in JWT_SECRET, CRON_SECRET, GOOGLE_GEMINI_API_KEY,
# DATABASE_URL=file:./data/prod.db
nano .env.production

mkdir -p data
npm ci
npx prisma generate
npx tsx prisma/push-schema.ts
npm run build
```

Test it manually first:

```bash
npm run start &
curl -I http://127.0.0.1:3000   # expect 200 or 307
```

## 4. Run as a systemd service

Covered by RT-13.4. The unit file lives at `deploy/systemd/rent-tool.service`
in this repo. Copy it to `/etc/systemd/system/`, reload, enable, start.

## 5. Reverse proxy + TLS

Covered by RT-13.5. The nginx config lives at `deploy/nginx/rent-tool.conf`.
Then run `certbot --nginx -d your-domain.com` to get the certs.

## 6. Cron for calendar sync (RT-13.8)

Calendar sync runs natively from the droplet's own cron — no third-party
scheduler. The crontab template lives at `deploy/cron/rent-tool.cron`
and calls a wrapper at `scripts/cron-sync.sh` so the `CRON_SECRET` is
sourced from `.env.production` rather than inlined in the crontab.

Install (as root on the droplet):

```bash
# 1. Make sure the wrapper is executable (git should preserve this,
#    but re-applying is harmless).
sudo chmod +x /home/app/rent-tool/scripts/cron-sync.sh

# 2. Lock down the env file so other users on the box can't read it.
sudo chmod 600 /home/app/rent-tool/.env.production
sudo chown app:app /home/app/rent-tool/.env.production

# 3. Install the crontab for the `app` user. EDITOR=cat lets us pipe
#    the file in non-interactively; otherwise: `sudo crontab -u app -e`
#    and paste the contents.
sudo -u app crontab /home/app/rent-tool/deploy/cron/rent-tool.cron

# 4. Verify.
sudo -u app crontab -l
```

The wrapper logs to `/home/app/logs/rent-tool-cron.log`. Tail it after
the next 10-minute boundary to confirm:

```bash
tail -f /home/app/logs/rent-tool-cron.log
# expect lines like:
# [2026-05-04T19:30:01Z] OK {"ok":true,...,"results":[...]}
```

Successful runs accumulate `SyncLog` rows in the database (`level=info`).
Failures show up in the log file with `FAIL rc=...` and as `level=error`
rows in `SyncLog`, which the in-app banner picks up after 3 consecutive
failures (RT-9.4).

**Rotating the log.** If the log gets large, add a small logrotate snippet:

```bash
sudo tee /etc/logrotate.d/rent-tool-cron >/dev/null <<'EOF'
/home/app/logs/rent-tool-cron.log {
    weekly
    rotate 8
    compress
    missingok
    notifempty
    copytruncate
    su app app
}
EOF
```

## 7. Backups (RT-13.9)

`scripts/backup-db.sh` runs nightly at 03:15 (added to the same crontab
that drives sync — see §6). It uses `sqlite3 .backup` (online, safe to
run while the app is serving requests) and writes into a tiered layout:

```
/home/app/backups/
  daily/    — newest 14 snapshots
  weekly/   — newest 8 Sunday snapshots
  monthly/  — newest 6 first-of-month snapshots
  latest    — symlink → most recent daily
```

Sunday and 1st-of-month backups are **hardlinked** into the higher tiers,
so the same data isn't stored twice. Worst case you keep ~28 distinct
on-disk snapshots.

Initial setup:

```bash
sudo chmod +x /home/app/rent-tool/scripts/backup-db.sh

# Run once manually to confirm it produces a valid backup before
# trusting the cron entry.
sudo -u app /home/app/rent-tool/scripts/backup-db.sh
ls -la /home/app/backups/daily/
```

After installing the crontab from §6, the next 03:15 will trigger the
nightly backup automatically. Tail the log to confirm:

```bash
tail -f /home/app/logs/rent-tool-backup.log
# expect a line like:
# [2026-05-05T03:15:01+00:00] OK /home/app/backups/daily/prod-20260505-0315.db (243712 bytes)
```

### Restore procedure

> **Tested and documented.** Always test on a copy of the droplet (or in
> a tmp dir) before touching live data.

```bash
# 1. Pick the backup you want.
ls -la /home/app/backups/daily/

# 2. Stop the app so nothing writes during the swap.
sudo systemctl stop rent-tool

# 3. Move the live DB out of the way (don't delete — keep as a fallback).
mv /home/app/rent-tool/data/prod.db /home/app/rent-tool/data/prod.db.preroll

# 4. Copy the backup into place.
cp /home/app/backups/daily/prod-YYYYMMDD-HHMM.db /home/app/rent-tool/data/prod.db
chown app:app /home/app/rent-tool/data/prod.db

# 5. Start the app and smoke-test (login, list properties).
sudo systemctl start rent-tool
sudo journalctl -u rent-tool -n 50 --no-pager
curl -fsS http://127.0.0.1:3000/api/health
```

If anything goes wrong, swap `prod.db.preroll` back. After a successful
restore, delete the `.preroll` file once you've verified a few hours of
clean operation.

## 8. Health endpoint + uptime monitoring

Covered by RT-13.10. Public health endpoint at `/api/health`.

## 9. Migrate data from Turso (if applicable)

Covered by RT-13.7. The migration script at `scripts/migrate-turso-to-local.ts`
copies all tables from your Turso instance to the local SQLite file.

## 10. Auto-deploy from GitHub (RT-13.13)

`.github/workflows/deploy.yml` SSHes into the droplet on every push to
`master` and runs `scripts/deploy.sh`. The workflow is **inert by default**
— it only runs once you set the `DROPLET_HOST` repo variable, so the
public repo doesn't fail on every push for forks.

One-time setup:

```bash
# 1. On your laptop — generate a deploy keypair (no passphrase).
ssh-keygen -t ed25519 -f droplet_deploy -N ""

# 2. Append the .pub to the app user's authorized_keys on the droplet.
cat droplet_deploy.pub | ssh root@<DROPLET_IP> 'cat >> /home/app/.ssh/authorized_keys'
ssh root@<DROPLET_IP> 'chown app:app /home/app/.ssh/authorized_keys && chmod 600 /home/app/.ssh/authorized_keys'

# 3. Get the droplet's host key fingerprint for known_hosts pinning.
ssh-keyscan <DROPLET_IP>
# Copy the ed25519 line(s) — you'll paste them into DROPLET_KNOWN_HOSTS below.

# 4. Allow the `app` user passwordless sudo for ONLY the systemctl restart
#    that deploy.sh needs. As root on the droplet:
echo 'app ALL=(root) NOPASSWD: /bin/systemctl restart rent-tool' \
  > /etc/sudoers.d/rent-tool-deploy
chmod 440 /etc/sudoers.d/rent-tool-deploy
visudo -c   # syntax check
```

In the GitHub repo Settings → Secrets and variables → Actions:

| Kind | Name | Value |
|------|------|-------|
| Secret | `DEPLOY_KEY` | contents of `droplet_deploy` (the private key, the whole `-----BEGIN…END-----` block) |
| Variable | `DROPLET_HOST` | the droplet's IP or hostname |
| Variable | `DROPLET_USER` | `app` |
| Variable | `DROPLET_KNOWN_HOSTS` | the `ssh-keyscan` output from step 3 |

After the variables exist, the next push to `master` triggers a deploy.
You can also run it manually from the Actions tab via `workflow_dispatch`.

The deploy script is conservative: it aborts on any uncommitted changes
in the droplet's working copy, runs `npm ci` + Prisma generate + `npm run
build` BEFORE restarting the service, applies migrations via
`prisma/push-schema.ts`, and smoke-tests `/api/health` after restart.
A broken build never kills the running service.

## 11. Resource baseline + hourly alerts (RT-13.14)

Steady-state target on the $6 droplet (1 GB RAM, 25 GB SSD):

| Metric | Idle | Under sync load | Hard ceiling |
|--------|------|-----------------|--------------|
| RAM used | < 400 MB | < 600 MB | 900 MB (systemd `MemoryMax`) |
| Disk used | < 3 GB | n/a | 80% triggers alert |
| Load 1m | < 0.3 | < 0.8 | n/a |

Install ops tooling (run once as root):

```bash
apt-get install -y htop iotop vnstat
systemctl enable --now vnstat   # cumulative bandwidth
```

`scripts/check-resources.sh` runs hourly via cron and posts an alert when
RAM ≥ 90% or disk ≥ 80% (overridable via `RAM_WARN_PCT` / `DISK_WARN_PCT`
in `.env.production`). It tries Telegram first, then a generic webhook,
then falls back to log-only — so the cron is safe even before you wire
up an alert sink.

To enable Telegram alerts:

```bash
# 1. Create a bot via @BotFather, get the token.
# 2. Send any message to the bot, then visit:
#    https://api.telegram.org/bot<TOKEN>/getUpdates
#    The "chat.id" field is your TELEGRAM_CHAT_ID.
# 3. Add to /home/app/rent-tool/.env.production:
echo 'TELEGRAM_BOT_TOKEN=...' >> /home/app/rent-tool/.env.production
echo 'TELEGRAM_CHAT_ID=...'   >> /home/app/rent-tool/.env.production
```

Test the alert path manually (forces a fake threshold breach):

```bash
RAM_WARN_PCT=1 DISK_WARN_PCT=1 sudo -u app /home/app/rent-tool/scripts/check-resources.sh
# expect a Telegram message + a line in /home/app/logs/rent-tool-resources.log
```

---

## Troubleshooting

**Build runs out of memory (OOM kill).** You're probably on the $4 droplet
without swap. Verify `swapon --show` returns 2 GB. Re-run `server-bootstrap.sh`
to set it up if missing.

**Node service won't start.** `journalctl -u rent-tool -f` shows the actual
error. Common issues: missing env vars, wrong Node version, permission on
`data/prod.db`.

**TLS issues.** `certbot certificates` shows valid certs. Renewal: `certbot renew`
(systemd timer auto-runs this twice a day, so you should never need to).

**Lost SSH access.** DO web console works as a fallback — log in as `root` with
the password you saved when provisioning.
