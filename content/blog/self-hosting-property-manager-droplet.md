---
slug: self-hosting-property-manager-droplet
locale: en
title: "Self-hosting your property manager on a $4 droplet"
excerpt: How to self-host a short-term-rental property manager on a cheap DigitalOcean droplet. Real RAM numbers, real build limits, real monthly cost.
status: draft
tags:
  - self-hosting:Self-hosting
  - host-tips:Host tips
  - infrastructure:Infrastructure
ogImageUrl: /blog-covers/self-hosting-property-manager-droplet.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Self-hosting your property manager on a $4 droplet

The first cloud bill I paid as a host was $73. I had clicked through the AWS console, picked sensible-looking defaults, and ended up with a t3.medium running idle 24/7 plus a managed Postgres I never queried. After cancelling that, I moved the whole setup to a $4-a-month DigitalOcean droplet with SQLite. It has been running there for over a year. It serves a small but real user base. It has not caught fire.

This is the post on how to do that, what breaks at the small end, and the honest tradeoff between the $4 box and a managed service.

## TL;DR

- A 512 MB to 1 GB DigitalOcean droplet runs a small Next.js + SQLite property manager fine at runtime. Builds are a different story.
- Build the artifact on a CI runner (GitHub Actions, GitLab CI), ship it to the droplet via SSH. The droplet never compiles anything.
- SQLite handles a single-host workload effortlessly. Tens of thousands of bookings, single-digit ms reads, file-based backups.
- Cloudflare in front of the droplet gives you free TLS, free DDoS protection, and free static caching. Use it.
- Total monthly cost for a 1-property to 50-property host: $4 to $6 droplet, $0 Cloudflare, $0 GitHub Actions free tier. $4 to $10 a month is the realistic floor.

## The case for self-hosting (and against)

Self-hosting a property manager is not for everyone. Be honest about which side you are on before reading further.

You should consider self-hosting if:

1. You already run a Linux box for something else (a personal site, a home lab, a VPN). The marginal effort of adding one more app is small.
2. You have 1 to 50 properties and want to avoid $25 to $200 a month in PMS fees.
3. You want to own your data — guest passport scans should not live on a shared SaaS database run by a company that might be acquired in three years.
4. You enjoy fixing things at 11pm because the joy outweighs the lost sleep.

You should NOT self-host if:

1. You have 100+ properties. Real channel-manager APIs (Hostaway, Lodgify) are worth the money at that scale; the iCal-only world is too lossy.
2. You have a day job that does not let you respond to a 3am alert. Self-hosting means you are the on-call team of one.
3. You expect five-nines uptime. Single droplet means single point of failure. A reboot, a network blip, a disk-full event — you own the recovery.
4. You consider "looking at logs" a punishment. Self-hosting is mostly about looking at logs.

The honest middle ground: try a free hosted instance first ([RentTools](/onboard) is one example; there are others). If it fits, stay there. If you want more control, the $4 droplet is the next step. If you outgrow that, a managed PMS is the step after.

## The droplet sizing question

DigitalOcean's cheapest droplets are in the $4 to $6 a month range, depending on region and current pricing. A 512 MB to 1 GB box with 1 vCPU and 10 to 25 GB of SSD storage. Their [pricing page](https://www.digitalocean.com/pricing/droplets) is the authoritative reference; numbers move every few quarters.

For a single Next.js app plus SQLite, the [Next.js production-deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) describe the standard `node` server you will run. Realistic resource use on my own box, observed over months:

1. **RAM at runtime**: 250 MB to 400 MB resident for the Node process under normal traffic (1 to 5 concurrent requests).
2. **CPU at runtime**: under 5% of one vCPU on average. Spikes to 30% during iCal sync cycles every 10 minutes.
3. **Disk used by SQLite**: under 100 MB for a database of 50 properties, 8000 bookings, 12000 guests. SQLite is dense.
4. **Disk used by Node + node_modules**: 600 MB to 1 GB. This is the part that wants the bigger droplet.

The 1 GB tier handles everything comfortably. The 512 MB tier handles runtime but you will hit OOM during operations like bulk migrations or restoring a backup. If your budget allows, pick 1 GB. If not, structure operations to do their heavy lifting elsewhere (CI, your laptop) and ship results to the small box.

What you do NOT want to do is run the build on the droplet. More on that next.

## Building elsewhere, running on the box

This is the single most useful trick at the cheap end.

Next.js builds on a small box go badly. The build process spawns multiple worker processes, holds the entire dependency graph in memory, runs TypeScript compilation, optimises bundles, generates pre-rendered pages, and produces a `.next/` directory that is 10x bigger than the source. On a 1 GB droplet, this combo will:

1. Eat all available RAM in 30 to 60 seconds.
2. Trigger the OOM killer, which usually kills the build but sometimes kills the running app instead.
3. Leave you with an inconsistent half-built deploy and a brief outage.

The fix is to build the artifact on a beefier machine and ship the result. Two patterns work:

1. **GitHub Actions runner.** Runners have 16 GB RAM. The build completes in 2 to 4 minutes. The runner produces a tarball of `.next/`, copies it to the droplet via `scp`, and the droplet just unpacks and restarts the systemd service. Cost: $0 on the GitHub Actions free tier for public repos and most small private ones.
2. **Your laptop.** Same idea, manual. `npm run build` on your machine, `rsync` the output, restart. Less repeatable than CI but fine for a one-person operation that deploys once a week.

The pattern works because the runtime requirements (`node server.js` against a pre-built `.next/`) are dramatically lighter than the build requirements (compile, bundle, optimise). The droplet only does the easy half.

If you go the CI route, the [GitHub Actions docs](https://docs.github.com/en/actions) cover the workflow YAML; the [DigitalOcean tutorial on systemd-managed Node apps](https://www.digitalocean.com/community/tutorials) is the standard reference for the droplet side. Wire `systemd` to manage the Node process so reboots and crashes recover automatically.

## SQLite is enough

The other surprise is how far SQLite takes you.

For a single-tenant or single-host property manager, SQLite handles workloads that would conventionally suggest Postgres. A few things that work, against expectations:

1. **Concurrent reads**: WAL mode allows many readers in parallel. Even a 100-property dashboard fetching dozens of bookings reads cleanly.
2. **Write throughput**: a single host's writes are single-digit per second at worst. Far below the SQLite ceiling of thousands of writes per second on commodity disk.
3. **Backups**: a SQLite database is a single file. Daily backups are `cp data/prod.db data/backups/$(date +%F).db`, which is fast even at gigabyte scale because the OS page cache makes the read sequential.
4. **Migrations**: standard Prisma migrations work. The "no concurrent writers" constraint hits during schema changes, but a 30-second pause is acceptable for a single-host tool that is not 100% time-sensitive.

The scenarios where SQLite breaks: multi-region (no replication), heavy multi-tenant write fan-out (better suited to Postgres or a write-sharded setup), and full-text search on millions of rows (workable with FTS5 but Postgres is more idiomatic). None of these apply to a small property manager.

The migration path is fine if you do outgrow it. Prisma's database adapter pattern (we use `@prisma/adapter-libsql`) means swapping SQLite for Turso, libSQL replicated, or full Postgres is mostly an environment variable change. Build for SQLite first, swap later if you need to.

For a deeper look at why we picked the SQLite approach, see the writeup in our [cleaning schedule automation post](/blog/cleaning-schedule-automation), which lives on the same database and shows what the data shape actually looks like.

## Cloudflare, TLS, and the boring infra

In front of the droplet I run Cloudflare. Free tier. Full (strict) TLS mode. The benefits are large for the cost (zero):

1. **Free TLS certificate.** The certificate is provisioned automatically. No Let's Encrypt cron, no certbot.
2. **DDoS shielding.** A small host is unlikely to be DDoSed deliberately, but a misbehaving bot has hit my server's CPU once or twice. Cloudflare absorbs it.
3. **Static caching.** Images, fonts, and the Next.js static `_next/static/` paths cache at the edge. This drops the droplet's bandwidth and CPU load enough that the 1 GB tier feels roomier.
4. **DNS at the same place as the proxy.** One dashboard for everything.

The full setup is: domain registrar points NS records at Cloudflare, Cloudflare proxies the apex and www record to the droplet IP, the droplet runs nginx terminating Cloudflare's traffic with strict TLS, nginx forwards to the local Next.js process. The whole DNS-to-app chain takes maybe an hour to wire up if you have done it before, two to three hours the first time.

The unsexy step is `systemd`. Wire your Next.js app as a systemd unit (`rent-tool.service` in our case) and you stop worrying about start-on-boot, restart-on-crash, log rotation, and resource limits. systemd is the operating system telling you it is fine to leave the box alone.

*Figure 1: The deploy pipeline. Push to master → GitHub Actions builds → scp tarball to droplet → systemd reload. Screenshot pending; will live at /blog/self-hosting-property-manager-droplet/figure-1.png.*

## What breaks on the cheap end

Things that have actually broken on my $6 box, in order of how often:

1. **Disk full.** Logs accumulate. Old backups accumulate. A `npm install` that fails halfway leaves cruft in `~/.npm`. Set up `logrotate`, set up a backup retention policy (keep last 14 daily + last 12 monthly), and run `du -sh /var/log /home/app/.npm /tmp` once a month. Twice in a year I have hit ENOSPC and only noticed because the deploy failed.
2. **Memory pressure during a manual operation.** A one-off SQL dump, a Prisma schema push, a script that loads all bookings into memory. The CI-build pattern fixes the routine case; the manual cases require discipline (stream don't load, pipe don't accumulate). Add `--max-old-space-size=512` to one-off `tsx` invocations as a safety net.
3. **Domain config drift.** Cloudflare changes a default, or DNS TTL caches longer than expected. A 24-hour fix window is normal. Have your TTLs at 60 seconds during active changes; bump back to default afterward.
4. **A Next.js minor version that broke a dependency.** Twice in 18 months. Fix is fast (rollback the package, push the fix); the lesson is to have CI run the build before the deploy lands, so the broken version never reaches the droplet.

What has NOT broken: SQLite corruption, systemd flakiness, the droplet itself rebooting unexpectedly. DigitalOcean's small droplets are surprisingly stable. The boring infrastructure stays boring.

## FAQ

**Is SQLite really safe for production?**
Yes for single-writer workloads at the scale of a single host's property manager. No for multi-region or write-heavy multi-tenant SaaS. The SQLite team's [Appropriate Uses](https://www.sqlite.org/whentouse.html) page is the canonical reference; we fit the "database for the application" pattern.

**Why DigitalOcean and not AWS / GCP / Hetzner?**
Personal preference. DO's UI is the simplest, the small-droplet pricing is fair, and the documentation is good. Hetzner is cheaper at the same RAM tier and equally good. AWS is overkill for $4-tier ambitions. GCP is fine but the free-tier rules are confusing.

**What about a Raspberry Pi at home?**
Works. Adds two new failure modes: residential ISP (dynamic IPs, ISP-blocked port 443) and home-power outages. If you can paper over both, the Pi is cheaper than any cloud option. I would not run a service my income depends on this way, but as a hobbyist setup it is fine.

**How do I monitor uptime?**
A free uptime monitor (BetterStack, UptimeRobot, Pingdom free tier) hits a `/api/health` endpoint every minute and alerts on failure. The endpoint should be cheap (no DB query) so the monitor itself does not load the box.

**What about backups?**
A nightly `cp` of the SQLite file to a backups directory, plus offsite (S3-compatible storage like Backblaze B2 at $6/TB) once a week. Test the restore quarterly — backups you have not restored from are not real backups.

**Will my droplet handle 1000 properties?**
Probably, but not on the cheapest tier. Bump to 2 GB RAM and 2 vCPUs ($12 a month-ish) and the box has room. Past that, the bottleneck is usually the iCal poll cycle, not the droplet.

## One opinionated take

The single thing the small-droplet approach actually buys you is **the absence of a vendor**. Not the saving (a hosted service is $25 to $200 a month for similar features; the saving is real but secondary). The absence.

When my domain registrar changes its UI, when DigitalOcean has a 30-minute network blip in my region, when Cloudflare deprecates a setting — those are all things I notice and adjust. None of them shut me down because none of them owns my data or my code. If DO went bankrupt tomorrow I would `scp` the SQLite file to Hetzner over a weekend and be running again Monday.

Compare to a hosted PMS. The vendor changes their pricing, gets acquired by a larger PMS that wants to consolidate, sunsets the free tier, or has a multi-day outage. You wait. The data is theirs in practice even when it is yours on paper. The $4 droplet is the price of opting out of that relationship.

That is the take. The savings are the bonus.
