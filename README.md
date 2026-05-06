# RentTools.io

> **Free, open-source property manager for short-term rental hosts.**
> Sync Airbnb, Booking.com, Vrbo, and any iCal-compatible platform into one dashboard. Automate cleaning schedules, scan guest passports, manage multiple properties with co-host access, and read host-focused guides on the in-house blog. Use it free at **[renttools.io](https://renttools.io)**.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/website?url=https%3A%2F%2Frenttools.io%2Fapi%2Fhealth&label=renttools.io)](https://renttools.io)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript)](https://www.typescriptlang.org/)

---

## What it does

If you list a place on Airbnb, Booking.com, Vrbo, or any other platform that exposes an iCal export, you have at least four browser tabs open at any given moment. RentTools collapses them into one dashboard.

The pitch is the same as the home page: **stop juggling calendar tabs.** Every 10 minutes RentTools pulls each platform's iCal feed and republishes a single combined feed back. Airbnb sees Booking.com's bookings and vice versa — the same protection a $100–300/mo channel manager offers, just free and open-source.

### Core features

- **Cross-platform calendar sync.** iCal export URLs from Airbnb, Booking.com, Vrbo, Hostaway, Lodgify, and 7 other platforms feed into one combined output. Manual reservations live alongside synced ones, with double-booking detection across them.
- **Cleaning schedule.** Every check-out → check-in turnover surfaces as a row in the schedule, with cleaner assignments, buffer-day conflicts flagged, copy/print to hand off to a cleaner, and a per-property master toggle when a property doesn't need cleaning logic.
- **Multi-property + co-host.** Add as many properties as you need. Invite co-hosts (managers) by link with one-click access grants. Cleaners are a separate role with a stripped-down view that only shows their assigned properties.
- **Guest passport extraction.** Drop a passport photo, get the structured fields back (name, DOB, document number, country) via Google Gemini OCR. Cyrillic-aware. Output is shaped for hotel registration forms.
- **Pre-arrival guest forms.** Generate a one-time share link, the guest fills out their info on a dedicated form, the data lands on the reservation. No accounts, no apps for the guest.
- **Message templates.** Per-property templates with variables (`{{guestName}}`, `{{checkIn}}`, `{{wifiPassword}}`, …). Copy to clipboard, paste into Airbnb / Booking.com / WhatsApp. Multi-language.
- **Group invites.** Send the guest a one-tap WhatsApp or Telegram group invite link from the reservation row.
- **Reports.** Past-3 / 6 / 12 / 24-month or all-time KPIs across properties: occupancy, ADR, revenue, with a custom-legend chart and CSV export.
- **Public iCal feed.** Each property exposes its own combined export URL — paste it back into Airbnb / Booking so they pick up your manual blocks and other-platform bookings.
- **Cmd-K guest search.** Find any past guest across every property in one keystroke, with document export when you need to file paperwork.
- **Reading material.** A host-focused blog at [renttools.io/blog](https://renttools.io/blog) covers calendar sync, double-booking prevention, cleaning workflows, GDPR, and self-hosting. Each post ships with structured `BlogPosting` + `FAQPage` JSON-LD; the blog is also indexed at [`/llms.txt`](https://renttools.io/llms.txt) for AI retrieval.

### What it doesn't do (yet)

- Channel-manager API integrations (Airbnb partner API, Booking.com Connect). RentTools talks iCal only — that's deliberate, it's how we stay free.
- Dynamic pricing. Use PriceLabs / Wheelhouse for that.
- Public marketplace listing. RentTools does not publish your property anywhere; it stitches together listings you already have.

---

## Why open source

You trust RentTools with your booking data and guest documents. The full source is here so you can verify exactly what it does (and doesn't do) with that data — no proprietary backend, no opaque "pro plan" tier with extra features behind a paywall. Self-host the same code on a $4 droplet if you want full data sovereignty.

---

## Use it free

Sign up at **[renttools.io](https://renttools.io)** — no credit card, per-account rate limits keep usage sane on the shared instance.

You can also self-host the same code on any cheap Linux box. The maintainer's instance runs on a $4 DigitalOcean droplet behind Cloudflare. See [docs/DROPLET-SETUP.md](docs/DROPLET-SETUP.md) for the runbook.

---

## FAQ

**Is it really free?**
Yes. No paid tier, no upsell. The maintainer pays for hosting and the Gemini API; per-account rate limits keep usage sane.

**How do I connect Airbnb, Booking.com, or another platform?**
Paste the iCal export URL the platform gives you. Airbnb: *Calendar → Availability settings → Sync calendars → Export*. Booking.com: *Property → Calendar → Sync calendars → Export*. Vrbo and most other OTAs offer a similar export. RentTools polls them every 10 minutes.

**Does it actually prevent double-bookings?**
It cuts the risk dramatically — not to zero, but close. iCal sync is *not* real-time. Airbnb refreshes imported calendars every 2–4 hours; Booking.com every 2–6 hours. The free middle layer (RentTools) refreshes faster, but it can't speed up the destination platform's own poll. For 1–3 listings, the iCal handshake handles 99% of cases. For 20+ listings or 90%+ occupancy, look at a paid channel manager.

**Can guests see my data?**
No. Each property is scoped to its owner + invited managers + assigned cleaners. The only public surface is the per-property iCal feed (read-only, blocks-only — no guest names exposed) and the optional pre-arrival form share link (one-time, scoped to a single reservation).

**Where is data stored?**
SQLite on the maintainer's droplet (EU region). Daily backups, 14-day / 8-week / 6-month retention. See [renttools.io/privacy](https://renttools.io/privacy) for the full list of what's collected and how to delete your account.

**Can I export my data?**
Yes — *Profile → Export my data* gives you a JSON dump of everything tied to your account. Account deletion (GDPR right-to-erasure) is one click in the same panel.

**What happens to passport photos after extraction?**
The image is sent to Google Gemini once for OCR, then discarded. Only the structured fields (name, DOB, etc.) are stored, attached to the reservation.

**Why no mobile app?**
The web app is mobile-responsive (375 px+) and installable as a PWA — *Add to Home Screen* on iOS / Android gets you 90 % of an app's experience without app stores or review delays.

**I'd rather self-host. How hard is it?**
About 30 minutes from a fresh Ubuntu droplet. The runbook in [docs/DROPLET-SETUP.md](docs/DROPLET-SETUP.md) walks through systemd, nginx, Let's Encrypt, cron, and SQLite backups. MIT-licensed — do whatever you want with it.

**How do I report a bug or request a feature?**
[Open an issue](https://github.com/Gribadan/RentTools.io/issues/new) on this repo. Or use the in-app **Send feedback** button — it lands in the maintainer's super-admin queue.

**Is there an API?**
The internal REST endpoints are documented in [docs/API.md](docs/API.md) but they're scoped to the logged-in session — there's no public API key system yet. If you need scripted access against your own account, ping me via an issue.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, server + client components) |
| Language | TypeScript (strict) |
| UI | Tailwind CSS 4, light + dark theme, mobile-responsive, PWA |
| Auth | jose JWT in HTTP-only cookie + bcryptjs, Google One Tap |
| Database | SQLite (libSQL) via Prisma 7, hand-rolled migrations |
| AI | Google Gemini 2.5 (passport OCR + cover-image generation) |
| SEO | Per-page JSON-LD (`Article`, `FAQPage`, `BlogPosting`, `SoftwareApplication`, `Organization`, `WebSite`, `BreadcrumbList`), dynamic sitemap, `/llms.txt` |
| Errors | Sentry |
| Uptime | BetterStack |
| Hosting | DigitalOcean droplet, Cloudflare-proxied, Let's Encrypt TLS |

---

## Repo layout

```
src/app/                  Next.js App Router routes (pages + API)
src/components/           React components
src/lib/                  Utilities (auth, prisma, ical, markdown, i18n, …)
prisma/                   Schema + hand-rolled push-schema.ts + seed scripts
content/blog/             Markdown source for blog posts (frontmatter-driven)
public/blog-covers/       Generated cover images (committed)
public/uploads/           Runtime uploads (gitignored)
scripts/                  Build-time + maintenance scripts
deploy/                   nginx config, systemd unit, cron jobs
.github/workflows/        CI + auto-deploy pipeline
docs/                     Setup runbook, API reference, contributing guide
```

---

## License

MIT — see [LICENSE](LICENSE). Translation: do anything you want, just don't blame the maintainer if it breaks.

## Contributing

Issues and PRs welcome. See [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md) for code style, branch naming, and how to add a new route.
