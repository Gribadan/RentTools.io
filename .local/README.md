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
│   ├── env.production            <- live droplet env (full set)
│   ├── sentry.txt                <- Sentry DSN + auth token
│   ├── betterstack.txt           <- BetterStack uptime API token
│   ├── cloudflare-token.txt      <- Cloudflare API token (zone-pinned)
│   └── airbnb-ical-urls.txt      <- per-property iCal export URLs (sensitive!)
└── notes/
    └── *.md                      <- anything else: passwords, runbook drafts
```

---

## Secrets the app needs at runtime

These are read from the environment, not from `.local/`. Use `.local/` to store
them as plain files so you have a backup, then copy into `.env.local` (dev) or
the droplet's `.env.production` (prod).

| Variable                  | Required | What it is                                                                       |
|---------------------------|----------|----------------------------------------------------------------------------------|
| `JWT_SECRET`              | yes      | Random 32+ byte string. Sign session tokens. Generate: `openssl rand -hex 32`    |
| `CRON_SECRET`             | yes      | Random secret for `/api/calendar/cron` access. Same generator as above.          |
| `GOOGLE_GEMINI_API_KEY`   | yes      | Gemini Vision key for passport extraction. https://aistudio.google.com           |
| `DATABASE_URL`            | yes      | `file:./data/prod.db` for the droplet's local SQLite. Self-hosters: any path.    |
| `NEXT_PUBLIC_SENTRY_DSN`  | optional | Sentry DSN. Leave blank to disable error tracking entirely.                      |
| `SENTRY_AUTH_TOKEN`       | optional | Used at build time to upload source maps for readable stack traces.              |

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

- [ ] **Rotate ALL passwords that were ever committed.** The old `README.txt` (now moved to `.local/credentials.txt`) contained Gribadan's and Yakov's passwords in plaintext. Even though the file was moved, it's permanently in git history. **Change both passwords in the app before going public** — see "Rotating leaked passwords" below.
- [ ] Run `git log -p --all | rg -i "(eyJ[A-Za-z0-9_-]{20}|libsql://[a-z0-9.-]+\.turso\.io|AIza[A-Za-z0-9_-]{30,}|admin\.booking\.com/.*\?|airbnb\.[^/]+/calendar/ical/[0-9]+\.ics)"` — must return zero hits OR every hit must be a now-rotated credential
- [ ] `.env`, `.env.local`, `.env.production` are NOT tracked (they aren't — they're in `.gitignore`)
- [ ] No hardcoded fallback secrets in source files (cron URL is now server-rendered, JWT fallback only triggers in dev with explicit refusal in production)
- [ ] `.local/` is gitignored
- [ ] No backup `.sqlite` files committed
- [ ] No `node_modules/` committed
- [ ] All Airbnb/Booking iCal URLs are stored on the server only (they're per-property tokens — anyone with the URL can read your booking data)

## Rotating leaked passwords

The `README.txt` was committed in `7f1c55d` (2026-04-04), `70b5a4c` (2026-04-04), and `fb9eb45` (2026-04-05) before being moved here. Anyone reading the public git history can see those passwords. To make them harmless:

1. Log in as Gribadan → Profile → Change password → use a NEW strong password (`openssl rand -base64 18`)
2. Log in as Yakov → Profile → Change password → use a NEW strong password
3. Save the new passwords in `.local/credentials.txt` (the gitignored file you now have)
4. Optional: rewrite git history with `git filter-repo --path README.txt --invert-paths` and force-push. This DOES rewrite history (which is normally avoided) but for a soon-to-be-public repo it's the cleanest move. Coordinate with anyone else who has the repo cloned.

If you skip step 4, the old passwords are still visible in history — but the rotation in steps 1–2 makes them useless against your account.

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
