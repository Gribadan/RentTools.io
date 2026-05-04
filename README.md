# RentTools.io

> **Free, open-source property manager for short-term rental hosts.**
> Sync any iCal-compatible calendar (Airbnb, Booking.com, Vrbo, and more), automate cleaning schedules, extract guest passport data — all in one tool. Use it free at **[renttools.io](https://renttools.io)**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/website?url=https%3A%2F%2Frenttools.io%2Fapi%2Fhealth&label=renttools.io)](https://renttools.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)

---

## What it does

If you list a place on Airbnb, Booking.com, Vrbo, or any other platform that exposes an iCal export, you have at least four browser tabs open at any given moment. RentTools collapses them into one dashboard:

- **Calendar sync** — pulls bookings from any iCal-compatible platform (Airbnb, Booking.com, Vrbo, and more) via the export URLs they already give you. Manual bookings live alongside synced ones with double-booking warnings.
- **Cleaning automation** — turns every check-out → check-in window into a cleaning task. Mark each cleaning done, skipped, add notes, print today's list. Add cleaners as restricted-role users so they only see what's relevant.
- **Guest passports** — drop a passport photo, get the fields back (name, DOB, document number, country) extracted by Google Gemini. Output is sanitized for hotel registration forms (Cyrillic supported).
- **Message templates** — per-property templates with variables (`{{guestName}}`, `{{checkIn}}`, `{{wifiPassword}}`, …) — copy to clipboard, paste into Airbnb / WhatsApp.
- **Public iCal feed** — every property exposes its own combined feed URL so other platforms can read your manual bookings back.
- **Cmd-K guest search** across every property you own.

Why open source: you trust us with your booking data and guest documents. The full source is here so you can see exactly what we do (and don't do) with it.

---

## Use it free

Sign up at **[renttools.io](https://renttools.io)** — no credit card, rate-limited per account so the free tier stays free.

You can also self-host the same code on any cheap Linux box. The maintainer's instance runs on a $4 DigitalOcean droplet — see [docs/DROPLET-SETUP.md](docs/DROPLET-SETUP.md) for the runbook.

---

## FAQ

**Is it really free?**
Yes. No paid tier, no upsell. The maintainer pays for hosting and the Gemini API; per-account rate limits keep usage sane.

**How do I connect Airbnb, Booking.com, or another platform?**
You paste the iCal export URL the platform gives you. Airbnb: *Calendar → Availability settings → Sync calendars → Export*. Booking.com: *Property → Calendar → Sync calendars → Export*. Vrbo and most other OTAs offer a similar export. RentTools polls them every 10 minutes.

**Can guests see my data?**
No. Each property is scoped to its owner. The only public surface is the per-property iCal feed (read-only, blocks-only — no guest names exposed). Anyone with the feed URL sees blocked dates, not who booked.

**Where is data stored?**
SQLite on the maintainer's droplet (EU region). Daily backups, 14-day / 8-week / 6-month retention. See [docs/PRIVACY](https://renttools.io/privacy) for the full list of what's collected and how to delete your account.

**Can I export my data?**
Yes — *Profile → Export my data* gives you a JSON dump of everything tied to your account. Account deletion (GDPR) is one click in the same panel.

**What happens to passport photos after extraction?**
The image is sent to Google Gemini once for OCR, then discarded. Only the structured fields (name, DOB, etc.) are stored, attached to the reservation.

**Why no mobile app?**
The web app is mobile-responsive (375 px+) and installable as a PWA — *Add to Home Screen* on iOS / Android gets you 90 % of an app's experience without app stores.

**I'd rather self-host. How hard is it?**
About 30 minutes from a fresh Ubuntu droplet. The runbook in [docs/DROPLET-SETUP.md](docs/DROPLET-SETUP.md) walks through systemd, nginx, Let's Encrypt, cron, and SQLite backups. MIT licensed — do whatever you want with it.

**How do I report a bug or request a feature?**
[Open an issue](https://github.com/Gribadan/rent-tool/issues/new) on this repo.

**Is there an API?**
The internal REST endpoints are documented in [docs/API.md](docs/API.md) but they're scoped to the logged-in session — there's no public API key system yet. If you need scripted access against your own account, ping me via an issue.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS 4, dark theme |
| Auth | jose JWT in HTTP-only cookie + bcryptjs |
| Database | SQLite via Prisma 7 + libSQL adapter |
| AI | Google Gemini |
| Errors | Sentry |
| Uptime | BetterStack |
| Hosting | DigitalOcean droplet, Cloudflare-proxied, Let's Encrypt TLS |

---

## License

MIT — see [LICENSE](LICENSE). Translation: do anything you want, just don't blame me if it breaks.

## Contributing

Issues and PRs welcome. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for code style, branch naming, and how to add a new route.
