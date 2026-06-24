---
slug: ical-checkout-day-blocked
locale: en
title: "iCal checkout day blocked? The off-by-one bug eating your nights"
excerpt: Your calendar syncs fine but the checkout day shows as booked on the other platform. Why iCal's exclusive DTEND and timezone drift quietly block a night you could sell.
status: published
tags:
  - calendar-sync:Calendar sync
  - ical:iCal
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/ical-checkout-day-blocked.webp
ogImageWidth: 1600
ogImageHeight: 900
---

A guest checked out of my Tashkent flat at 11 a.m. on a Saturday in March. The flat was empty, cleaned, and ready by 13:00. Someone tried to book that exact Saturday night on Booking.com and got "not available". I lost the night and had no idea why — the calendars were syncing perfectly. The dates were just wrong by one.

This is the bug nobody warns you about. Your iCal feed is fresh, the timestamps are current, every fetch succeeds — and the platform still blocks the wrong day. Here's why it happens, how to prove it's happening to you in two minutes, and the exact fix for each cause.

## TL;DR

- A synced calendar can still block the wrong night — **staleness isn't the bug here**.
- iCal's `DTEND` is **exclusive**: the checkout day should stay bookable, not blocked.
- Two causes: a feed that blocks checkout *inclusively*, or **timezone date-drift**.
- All-day `VALUE=DATE` events are safe; a `DATE-TIME` ending in `Z` is the off-by-one risk.
- Open the `.ics` and read `DTSTART` / `DTEND`: 8 digits, no `T`, means all-day.
- Every wrongly-blocked turnover day is one sellable night you never even see.

## The bug that hides behind a working sync

Most calendar problems are about a feed going stale: a reset URL, a feed the platform quietly dropped after repeated failures, an import that says "Last sync: never". If that's your symptom, you want the sibling piece on [why an Airbnb calendar stops syncing](/blog/airbnb-calendar-not-syncing) — seven causes, all of them about the feed not updating.

This is the opposite problem. The feed updates fine. The *Last imported* timestamp is twenty minutes old. Every booking on Airbnb shows up on Booking.com within the polling window. And yet a specific night — almost always a checkout day, sometimes the night before an arrival — reads as unavailable when the flat is provably empty.

You don't get an error. You get a calendar that is confidently, silently wrong by exactly one day. The only way you notice is when a guest tells you "your place shows as booked" for a date you know is open, or when you go hunting for why a high-demand Saturday never sold.

## Why the checkout day is supposed to be free

iCal isn't a vague format — it's [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), and it's precise about how a date range works. For an all-day event, the booking is the half-open interval `[DTSTART, DTEND)`. `DTSTART` is included. `DTEND` is **not**. It's the morning *after* the last night.

Take a three-night stay: check-in July 10, checkout July 13. The guest sleeps the nights of the 10th, 11th, and 12th. The correct iCal block is:

```
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260710
DTEND;VALUE=DATE:20260713
SUMMARY:Reserved
END:VEVENT
```

Note `DTEND:20260713`, not `20260712`. The 13th is the checkout day, and under the exclusive rule it is **available** — a new guest can check in that afternoon. That's not a loophole; it's how back-to-back bookings are supposed to work. The platforms model it correctly: Airbnb and Booking.com both treat the checkout day as bookable for a same-day arrival, which is exactly what lets you run a tight turnaround on an event weekend.

So when the checkout day shows as blocked, something between the source platform and the destination platform has stopped respecting the exclusive `DTEND`. There are two ways that happens.

## Cause 1: a feed that blocks the checkout day

The first failure is an inclusive `DTEND`. Somewhere in the chain, a night that should be free gets counted as occupied.

It shows up two ways. Either the **feed generator** is wrong — a hand-rolled cron job or an older channel manager writes `DTEND:20260714` (a day too far) or emits a separate block for the checkout day — or the **importer** treats `DTEND` as inclusive and blocks through the 13th even though the feed said `20260713`.

In practice the generator side is the usual culprit, because the big platforms get the exclusive rule right. If you're syncing Airbnb directly into Booking.com with no middle layer, you rarely hit this. You hit it when there's a third tool in the path — a script you wrote, a smaller PMS, a spreadsheet-to-iCal exporter — that fence-posts the date range by one. The classic off-by-one: someone reasons "the stay is the 10th through the 13th" and writes `DTEND:20260713` meaning *inclusive*, when iCal would read that same value as *exclusive* and free up the 13th. Whether you over- or under-block depends entirely on which mental model the author had, and the format gives them no warning either way.

The result is real money: every checkout day that gets wrongly blocked is a same-day turnover you can't sell. On a listing that runs back-to-back in peak season, that's a night a week, gone, with no error message to tell you it happened.

## Cause 2: timezone drift turns one night into the wrong night

The second failure is subtler and, for cross-border hosts, far more common. It comes from feeds that export dates as `DATE-TIME` instead of all-day `DATE`.

An all-day event has no timezone — `20260713` means the 13th everywhere on Earth. But some feeds export bookings with a clock time and a timezone, or worse, normalized to UTC:

```
DTSTART:20260713T000000Z
DTEND:20260716T000000Z
```

That `Z` means UTC. Now the importing platform has to convert it to *its* idea of local time before deciding which calendar day the block lands on. A block starting `20260713T000000Z` — midnight UTC — viewed from a timezone five hours behind UTC becomes 19:00 on July **12th**. Truncate to a date and you've just blocked the 12th, a night that should have been free. The block slid one day earlier. Now the night *before* your guest arrives reads as unavailable.

Push the property east of UTC and it slides the other way. A checkout that should free up a morning instead keeps the night blocked because the converted time rounds up to the next day. Same root cause, opposite symptom.

Then daylight saving time adds a one-hour wobble on top. A booking that boundary-aligned perfectly in winter can drift by a day for the weeks where the source and destination are on different DST schedules — Europe and the US switch on different dates, so there's a two-to-three-week window every spring and autumn where a near-midnight `DATE-TIME` event flips. If your off-by-one only appears for part of the year, this is why.

The tell is in the feed itself: a `DATE-TIME` value (it has a `T`, often a trailing `Z` or a `TZID=` prefix) is timezone-sensitive and the prime off-by-one suspect. A plain `VALUE=DATE` with eight digits and no `T` is immune.

## How to prove it's happening to you

You don't have to guess. Two minutes with the raw feed settles it.

1. Get the source platform's iCal **export** URL — the one you copy out of Airbnb (Calendar → Sync calendars → Export) or Booking.com (Calendar & Pricing → Sync calendars → Export).
2. Paste it straight into a browser. You'll get a `.ics` file or a wall of plaintext starting with `BEGIN:VCALENDAR`. If you get an HTML error page instead, your problem is staleness, not dates — back to the [stale-feed checklist](/blog/airbnb-calendar-not-syncing).
3. Find the `VEVENT` for a booking whose real dates you know cold. Read its `DTSTART` and `DTEND`.

Now interpret what you see:

| What the feed line looks like | What it means | Off-by-one risk |
| --- | --- | --- |
| `DTSTART;VALUE=DATE:20260710` | All-day, timezone-free | None — this is the safe shape |
| `DTEND;VALUE=DATE:20260713` | Checkout day, exclusive (correct) | None |
| `DTEND;VALUE=DATE:20260712` | Last night, not checkout day | Inclusive bug — blocks the turnover |
| `DTSTART:20260710T140000Z` | A clock time in UTC | High — converts per timezone |
| `DTSTART;TZID=...:20260710T140000` | A clock time in a named zone | Medium — depends on importer |

Then cross-check the destination: open the day in question on the other platform's calendar. If the feed says the checkout day is free (`DTEND` is the checkout date, all-day) but the destination shows it blocked, the importer is the culprit. If the feed itself already encodes the wrong day, the source or a middle tool is.

## How to fix each cause

The fix depends on which link in the chain is wrong, and crucially, on whether you control it.

**If you control the feed generator** (your own script, a self-hosted exporter): emit all-day events with `VALUE=DATE`, and set `DTEND` to the **checkout day**, not the last night. Never emit a clock time for a full-day block. This one change kills both causes at the source — no timezone to convert, no fence-post to get wrong.

**If the source platform emits `DATE-TIME` and you can't change it:** put a normalizing layer between the platforms. A middle layer ingests the messy feed, rewrites every booking to an all-day `VALUE=DATE` event in the property's own timezone, and republishes a clean feed for the other platforms to import. This is precisely what an iCal-aware tool like [RentTools](/onboard) does on every pull — it pins each block to the property's local calendar day before anyone downstream can misread it. You stop playing timezone roulette across borders.

**If the importer is treating `DTEND` as inclusive** and you can't fix the platform's code (you can't), you have two options: add a one-day cleaning buffer so the checkout day is intentionally blocked anyway — see [buffer days](/blog/cleaning-buffer-days) — or route through a middle layer that compensates. The buffer hides the symptom rather than fixing it, which is fine until the day you want to sell that turnover night.

After any fix, verify the same way you diagnosed: pull the feed, confirm `DTEND` is the all-day checkout date, then check the destination calendar shows the checkout day as bookable. Don't trust that it worked — look at the cell.

## What the off-by-one actually costs

The reason this bug is worth a diagnostic session is that it's invisible and recurring. It doesn't cost you one night once; it costs you a night per affected booking, every time, until you find it.

Here's a tight-turnaround listing at a $120 base, running two same-day turnovers a month that the bug blocks:

| Scenario | Lost nights / month | Lost / month | Lost / year |
| --- | --- | --- | --- |
| 2 blocked turnover days, $120 base | 2 | $240 | $2,880 |
| Peak-season run, 1 blocked night / week | 4 | $480 | (seasonal) |
| Off-by-one before arrival, 1 / month | 1 | $120 | $1,440 |

Those aren't refunds you can see in a report — they're bookings that never happened, demand that hit a "not available" wall and went to the listing next door. The arithmetic is soft because it depends on how often your gaps are same-day, but the direction is clear: a recurring one-night leak on a listing with real turnover demand is a four-figure annual number, and it never shows up as a problem you can point at.

It also compounds with the thing it's adjacent to. A checkout day wrongly blocked is a turnover you can't sell; a checkout day wrongly *freed* is how you get a [double booking](/blog/avoiding-double-bookings). Same exclusive-`DTEND` rule, both failure directions, and the only way to know which one you're on is to read the feed.

## FAQ

**Why does the day my guest checks out show as unavailable for a new booking?**
Because something in your sync chain is treating the checkout day as occupied. Under iCal's rules the checkout day is the exclusive `DTEND` — it's the morning after the last night and should be bookable for a same-day arrival. If it reads as blocked, either a feed generator wrote the date range inclusively or a timezone conversion shifted the block by a day.

**What does it mean that DTEND is exclusive?**
It means the end date is not part of the booking. A stay with `DTSTART:20260710` and `DTEND:20260713` covers the nights of the 10th, 11th, and 12th — three nights — and leaves the 13th free. People routinely read `20260713` as "blocked through the 13th", but the format says the opposite. That mismatch is the single most common source of off-by-one calendar bugs.

**My calendar syncs on time but blocks the wrong dates. Is that the same as a stale feed?**
No, and the distinction matters for the fix. A stale feed is a freshness problem — the import stopped updating, and you fix it by repairing the URL or re-adding the import. A wrong-date feed is updating fine; the dates inside it are off. Check the `Last imported` timestamp first: recent timestamp plus wrong dates equals an off-by-one, not staleness.

**How do I check whether my iCal feed uses dates or date-times?**
Paste the source export URL into a browser and look at a `VEVENT`. If you see `DTSTART;VALUE=DATE:20260710` — eight digits, no `T` — it's an all-day event and timezone-immune. If you see a `T` followed by a clock time, and especially a trailing `Z`, it's a `DATE-TIME` and a timezone conversion is happening somewhere downstream.

**Can daylight saving time really shift a booking by a day?**
Only for feeds that use `DATE-TIME` near a midnight boundary, and only during the weeks when the source and destination regions are on different DST schedules. Europe and North America change clocks on different dates, so there's a short window each spring and autumn where a near-midnight event can land on the wrong calendar day. All-day `VALUE=DATE` events are never affected.

**Does using a channel manager or middle layer fix this?**
It can, if the layer normalizes feeds to all-day local-date events before republishing. That removes the timezone ambiguity for everything downstream. It does not help if the layer itself emits `DATE-TIME` or fence-posts the range — the fix is correct date handling, not the presence of a tool. Read the republished feed and confirm it emits `VALUE=DATE`.

**Is a cleaning buffer a fix or a band-aid?**
A band-aid, but a useful one. A one-day buffer blocks the checkout day deliberately, so an off-by-one that also blocks it becomes invisible — you weren't selling that night anyway. The problem returns the moment you drop the buffer to sell a high-demand turnover, so treat the buffer as cover, not a cure, and still fix the underlying date handling.

**Why does the bug sometimes block the night before check-in instead of the checkout day?**
Direction depends on which way the timezone offset pushes the date. A UTC-normalized block viewed from a timezone behind UTC slides earlier and can block the night before arrival; viewed from a timezone ahead of UTC it slides later and keeps a checkout night blocked. Same root cause, opposite symptom — both are resolved by pinning the block to the property's local date.

## One opinionated take

If you run more than one platform and you've never once opened your raw `.ics` feed in a browser, do it this week. Not because it's broken — maybe it isn't — but because this is the one calendar failure that costs you money with zero signal. A stale feed eventually announces itself: a guest complains, a date won't update, a timestamp goes cold. An off-by-one just quietly converts your best turnover nights into "not available" and routes the booking to someone else. The fifteen seconds it takes to confirm your feed emits `VALUE=DATE` and an exclusive checkout `DTEND` is the cheapest revenue audit you will ever run.
