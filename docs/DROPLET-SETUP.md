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
git clone https://github.com/<your-account>/rent-tool.git
cd rent-tool
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

## 6. Cron, backups, monitoring

Covered by RT-13.8 / RT-13.9 / RT-13.10. Crontab lives at
`deploy/cron/rent-tool.cron`. Backup script at `scripts/backup-db.sh`.

## 7. Migrate data from Turso (if applicable)

Covered by RT-13.7. The migration script at `scripts/migrate-turso-to-local.ts`
copies all tables from your Turso instance to the local SQLite file.

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
