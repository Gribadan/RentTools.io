# `.local/` — your personal stuff

Everything in this directory is git-ignored (see `.gitignore`). It's where you
keep credentials, SSH keys, deploy notes, and anything else that should NOT
end up in a public repository.

This README is the only file in here that's tracked. Add anything else freely.

---

## Recommended layout

Create these as you need them — none are required, but they're the standard
spots so future-you (and any AI assistant) knows where to look.

```
.local/
├── README.md                     <- this file (committed)
├── env.production                <- production env vars (NEVER commit)
├── env.development               <- local dev overrides
├── ssh/
│   ├── droplet_ed25519           <- SSH private key for DO droplet
│   └── droplet_ed25519.pub
├── deploy/
│   ├── DROPLET.md                <- droplet IP, root pw, deployment steps
│   ├── DOMAIN.md                 <- domain registrar login, DNS records
│   └── nginx.conf.bak            <- saved server config
├── secrets/
│   ├── jwt-secret.txt            <- the JWT_SECRET value
│   ├── cron-secret.txt           <- the CRON_SECRET value
│   ├── gemini-api-key.txt        <- Google Gemini key
│   ├── turso-token.txt           <- Turso auth token (kept until DO migration done)
│   └── airbnb-ical-urls.txt      <- per-property iCal export URLs (sensitive!)
└── notes/
    └── *.md                      <- anything else: passwords, runbook drafts
```

---

## Secrets the app needs at runtime

These are read from the environment, not from `.local/`. Use `.local/` to store
them as plain files so you have a backup, then copy into `.env.local` (dev) or
the droplet's `.env.production` (prod).

| Variable               | Required | What it is                                                                  |
|------------------------|----------|-----------------------------------------------------------------------------|
| `JWT_SECRET`           | yes      | Random 32+ byte string. Sign session tokens. Generate: `openssl rand -hex 32` |
| `CRON_SECRET`          | yes      | Random secret for `/api/calendar/cron` access. Same generator as above.      |
| `GOOGLE_GEMINI_API_KEY`| yes      | Gemini Vision key for passport extraction. https://aistudio.google.com      |
| `TURSO_DATABASE_URL`   | until DO | libSQL/Turso URL while still on Vercel+Turso. After DO migration: file path. |
| `TURSO_AUTH_TOKEN`     | until DO | Turso auth token. Drop after DO migration.                                  |
| `DATABASE_URL`         | on DO    | After DO migration: `file:./data/prod.db` (local SQLite path).              |

---

## How to generate fresh secrets

```bash
# Strong random secret (Linux/macOS/WSL/Git Bash)
openssl rand -hex 32

# Same on PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Max 256}) -as [byte[]])
```

---

## Going public-safe checklist

Before flipping the GitHub repo to public, walk through:

- [ ] Check `git log -p | grep -iE "(eyJ|libsql://|AIza|password)"` — no real secrets in history
- [ ] `.env`, `.env.local`, `.env.production` are NOT tracked (they aren't — they're in `.gitignore`)
- [ ] No hardcoded fallback secrets in source files (cron URL is now server-rendered, JWT fallback only triggers in dev with explicit refusal in production)
- [ ] `.local/` is gitignored
- [ ] No backup `.sqlite` files committed
- [ ] No `node_modules/` committed
- [ ] All Airbnb/Booking iCal URLs are stored on the server only (they're per-property tokens — anyone with the URL can read your booking data)

---

## After moving to a DO droplet

Update this README's `deploy/DROPLET.md` template with:

- Droplet IP and SSH command
- Root password (or note that you only use SSH key auth)
- App user (e.g. `app`) and its home dir
- Database file path on the droplet
- Backup location and rotation policy
- DNS provider login + relevant records
- Let's Encrypt cert renewal command
- Last-known-good rollback procedure
