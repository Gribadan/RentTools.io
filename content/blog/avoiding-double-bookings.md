---
slug: avoiding-double-bookings
locale: en
title: "Avoiding double bookings: the only host cheat sheet you need"
excerpt: A cheat sheet for short-term rental hosts to prevent double bookings. Sync intervals, buffer days, manual-entry rules, and the 24-hour pre-arrival audit.
status: draft
tags:
  - double-bookings:Double bookings
  - calendar-sync:Calendar sync
  - host-tips:Host tips
ogImageUrl: null
---

# Avoiding double bookings: the only host cheat sheet you need

The first time I created a real double booking was not from sync lag. It was from blocking a Friday on Booking.com for a friend who said they would visit, forgetting to mirror the block on Airbnb, and getting an Airbnb instant-book on the same Friday two hours later. The lag was zero. I just had two calendars saying different things because I edited one and not the other.

That story matters because most "how to prevent double bookings" articles obsess over iCal refresh windows and ignore the more common cause: hosts editing one platform and forgetting the rest. This is the cheat sheet I wish I had then.

## TL;DR

- Set every imported calendar's poll to its fastest setting on every platform, then assume **2 to 6 hours** of lag anyway.
- Add a **1-day buffer** on properties with same-day cleaning crews; skip the buffer on small studios you clean yourself.
- For manual blocks (your own use, maintenance), **edit one canonical calendar and let it propagate**. Never edit two platforms by hand.
- Run a **24-hour pre-arrival audit** for every booking: open both platforms, confirm the dates still match.
- One double booking out of hundreds is a math fact, not a moral failure. Keep an apology template ready.

## Table of contents

1. The cheat sheet
2. Sync interval: set the dial right
3. Buffer days: when to insert one (and when not)
4. Manual entry rules: the offline-calendar trap
5. The 24-hour pre-arrival audit
6. FAQ

## The cheat sheet

Five rules. In order of how often each one will save you.

1. **One canonical calendar.** Pick a single source of truth for manual blocks (yours, family, maintenance). Every other platform imports from it. Never type a manual block into two platforms.
2. **Fastest poll on every imported feed.** Airbnb, Booking, Vrbo: open each, set every imported calendar's refresh to its lowest available setting. None offers under 2 hours; that is fine.
3. **One day of buffer, sometimes.** On properties with a same-day cleaning crew, add a 1-day after-checkout block. On small properties you clean yourself in two hours, skip it: the lost revenue exceeds the risk.
4. **24-hour audit before each arrival.** The day before a guest checks in, open both platforms and confirm the dates still match. 30 seconds. Catches the 1-in-300 silent sync failure.
5. **Apology template, ready to send.** When the rare double booking does happen, you will be on a metro / asleep / driving. Have a polite, calm template that explains the situation, refunds the loser, and points them at one alternate listing in your area.

If you do all five, your double-booking rate drops below the rate of card-payment failures, no-shows, and lockbox lockouts. It is not zero. It is roughly the rate of being struck by a car you did not see.

## Sync interval: set the dial right

Most hosts know iCal refreshes "every few hours" without checking the actual setting. The actual setting matters.

Each platform has its own. The configurable ones at the time of writing:

1. **Airbnb** — imported calendars refresh on Airbnb's schedule (between 2 and 4 hours, host-non-configurable). Outbound exports refresh approximately every 2 hours.
2. **Booking.com** — extranet allows manual refresh on a per-feed basis; automatic refresh runs every 2 to 6 hours. There is no UI to make it faster.
3. **Vrbo** — slowest of the major three. Up to 12 hours observed in extreme cases. Rotate the URL if a feed appears stuck for 24+ hours.

What you can change is your own outbound polling. If you use a middle layer like the [open-source RentTools](/onboard), set its inbound poll to the lowest interval it allows — 10 minutes is reasonable; under that wastes Airbnb's bandwidth without buying you anything because the destination platform still polls slow.

For the underlying mechanics of why the iCal protocol caps at "every few hours" rather than offering push, read [our walkthrough of how Airbnb and Booking.com calendars actually sync](/blog/airbnb-booking-calendar-sync-free).

## Buffer days: when to insert one (and when not)

Most hosts pick "1 day buffer" as a default and never revisit. The decision is a tradeoff and the right answer is per-property.

The math: 1 buffer day per turnover loses one revenue night. At a $90 nightly rate and 30 turnovers a year, that is $2,700 of forgone income, before factoring tax. The benefit is whatever you would have lost to (a) cleaning quality issues and (b) the rare double-booked checkout-then-checkin same-day chaos.

Decision rules I use:

1. **Studio / 1-bed I clean myself in under 90 minutes**: zero buffer days. Same-day check-in works. The savings outweigh the marginal cleaning-quality risk.
2. **Family villa with an external cleaning crew on a 4-hour turnaround**: 1 buffer day. Misalignment between checkout-by-11 and check-in-from-15 is too tight; 1 buffer day buys real margin.
3. **Property with rare guests staying 7+ nights**: 1 buffer day. The lost revenue is small (long stays mean fewer turnovers per year), and longer-stay guests are pickier about cleanliness.
4. **Same property on iCal-synced platforms only (no API channel manager)**: keep the buffer on the leading platform's side and let it propagate via iCal. Never set it on the trailing side: the buffer needs to land before the trailing platform polls, not after.

Skip the buffer altogether if your turnovers run on autopilot and your cleaning crew is dedicated. Reinsert it the moment you have one bad cleaning incident.

## Manual entry rules: the offline-calendar trap

This is the one that bit me with the Friday block. The rule is simple and the rule is non-negotiable: **never type a manual calendar block into two platforms by hand**. Pick one as canonical and let iCal do the rest.

Three ways to do that:

1. **Booking.com as canonical.** Block the date in Booking's extranet. Airbnb imports Booking's iCal, so the block propagates within Airbnb's poll window (2 to 4 hours). Works because Booking's extranet calendar is the densest UI of the three majors.
2. **Airbnb as canonical.** Block the date in Airbnb. Booking imports Airbnb's iCal. Same logic, opposite direction.
3. **An external calendar as canonical.** Use a Google Calendar (or your [RentTools](/onboard) instance) for personal blocks. Both Airbnb and Booking import from it. Useful when you have many personal blocks (renovations, off-season, family use).

Whichever you pick, set a phone wallpaper, write it on a sticky note, tattoo it. The next time a friend texts asking if your apartment is free for a weekend, the answer is "I'll block it on $CANONICAL right now". Not "let me block it on both, hold on".

If you have multiple properties and multiple owners (a co-host setup), agree on the rule together and put it in writing. Half the bad double-booking stories I have heard from other hosts in Tashkent involved a co-owner blocking on one platform that the primary host did not have access to mirror.

## The 24-hour pre-arrival audit

The boring saver. Every booking gets a 24-hour-before check.

The audit is 30 seconds:

1. Open the booking in the platform that received it.
2. Note the exact dates.
3. Open the other platform's calendar for the same property.
4. Confirm the dates show as blocked.
5. If they do not show as blocked, manually mark them blocked on the second platform (you have a rare sync failure or your own sync setup is broken). Investigate after the guest checks in.

You will find a problem roughly once every 200 to 400 bookings. Almost always it is a transient issue you would not have caught any other way: a feed URL that the source platform silently rotated, a cron job that died on the server, a daylight-savings shift that confused a midnight cron.

Do not skip this on long-stay bookings; those are the ones where a clash hurts most because you cannot trivially relocate a 3-week guest.

You can also automate part of the audit. RentTools sends a "no conflicts found, see you in 24 hours" pre-arrival check via email. Plenty of channel managers do similar. Manual is fine if you have under 20 bookings a month — the time cost is minutes per week.

## FAQ

**What counts as a double booking?**
Two confirmed reservations from different guests overlapping by at least one night on the same property. A reservation and a personal block do not count, though the apology owed is similar.

**How often does a double booking actually happen with iCal sync?**
Anecdotally, low single digits per year for hosts with under 5 properties on Airbnb plus Booking. Higher if you list on more than three platforms (more polling pairs, more chances for a gap). Higher again if you add Vrbo, which polls slowest of the three majors.

**Should I cap my acceptance rate to avoid double bookings?**
No. Acceptance rate impacts your search rank on Airbnb. The right tools (sync, buffers, audit) bring the double-booking rate below the noise floor without you needing to reject bookings.

**What do I do if a double booking happens?**
Refund the second booking immediately, send your apology template, and offer to find them an alternate. Most guests are gracious if the response is fast and the refund is clean. A double-booked guest who waits 36 hours for a reply will leave a 1-star review; one who hears back in 30 minutes usually leaves nothing.

**Will switching to a paid channel manager fix this?**
Mostly, yes. Channel managers using Airbnb's partner API plus Booking's connectivity API get near-real-time updates in both directions, which closes the iCal lag window. They start at $25 to $50 per property per month and assume a long contract. The math only works above ~20 properties or 90% occupancy.

**Does buffer-day logic change in winter / off-season?**
Slightly. In low season you can shrink buffers because turnover risk drops with lower volume; in high season do the opposite. I keep the same setting year-round and accept the imperfection. The cognitive cost of re-tuning per season is more than the optimisation is worth.

## One opinionated take

If you are a 1-to-3 property host worrying about double bookings, the single most useful thing you can do this week is **the canonical-calendar rule plus the 24-hour audit**. Both are free. Both take five minutes to set up. Together they catch 90% of the failures that fancier tools claim to fix.

The fancier tools (channel managers, paid PMS suites) are real, and they are right for high-volume hosts. They are also a tax small hosts pay for a problem they could have fixed for free with a sticky note. Pick the sticky note first.
