---
slug: airbnb-calendar-not-syncing
locale: en
title: "Airbnb calendar not syncing? 7 reasons your iCal feed goes stale"
excerpt: "Airbnb calendar not syncing with Booking.com? The 7 reasons an iCal feed goes stale, the one timestamp that flags each, and the exact fix for all seven."
status: published
tags:
  - calendar-sync:Calendar sync
  - ical:iCal
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/airbnb-calendar-not-syncing.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Last winter my Booking.com calendar quietly stopped pulling my Airbnb blocks. Nothing errored — no email, no red banner. The import just froze on a Tuesday, and I didn't notice until a guest from Lyon booked a week I'd already filled on Airbnb. The feed wasn't broken in any way the dashboard would admit to. It was *stale*, and stale is the one failure mode iCal never warns you about.

This is the guide I wish I'd had that night: the single number that tells you whether a feed is actually broken, the seven reasons it goes quiet, and the exact fix for each.

## TL;DR

- iCal sync almost never throws an error — it goes **stale silently**. The tell is the *Last imported* timestamp, not a banner.
- The most common cause is a **reset source URL**: the import still points at a URL the source retired, so every fetch fails.
- Airbnb pulls imported feeds every **2–4 hours**, Booking.com every **2–6 hours**. "Not synced yet" for three hours is normal, not broken.
- A feed older than **24 hours** is a real problem. Paste the source URL into a browser — you want `BEGIN:VCALENDAR`, not an HTML error page.
- Platforms **drop a feed** after repeated failed fetches and don't tell you. Re-adding the import wakes it up.
- A middle layer polling every **10 minutes** shrinks the danger window but can't speed up the destination platform's own pull.

## Why iCal goes quiet instead of breaking

iCal sync is a *pull*, not a *push*. When you "connect" Airbnb to Booking.com, neither platform opens a live API to the other. The destination platform just fetches a public `.ics` URL on its own timer — every few hours — and overwrites its imported blocks with whatever it found.

That design has a nasty side effect. If the source URL stops responding — wrong URL, source briefly down, source rotated its link — the destination doesn't surface a failure. It keeps the last data it successfully fetched and tries again next cycle. From the dashboard's point of view, nothing is wrong. The calendar still shows blocks; they're just frozen in time.

A real API connection would throw a `401` or `404` you'd see. iCal throws nothing. The protocol ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545)) has no push channel and no standard "this feed is dead" signal that the big platforms surface to hosts. So the failure is invisible until a second guest books a date your other platform thinks is open.

## The only diagnostic that matters: "Last imported"

Before you change a single URL, read one number: when did this feed last import successfully?

- **Airbnb:** Calendar → pick the listing → **Availability** → **Sync calendars** → under **Imported calendars**, each feed shows *Last imported X ago*.
- **Booking.com:** extranet → **Calendar & Pricing** → **Sync calendars** → the import section lists each connected feed with its last sync time.

Now read it like this:

| Last imported | Verdict |
| --- | --- |
| Minutes to a few hours ago | Healthy. Stop here. |
| 4–12 hours ago | Probably fine on Booking.com (2–6h cycle); borderline on Airbnb (2–4h). Re-check in an hour. |
| More than 24 hours ago | Broken. Work the list below. |
| "Never" / blank | Never successfully fetched once. URL is wrong, or the source throttled the first pull. |

This timestamp is the whole game. Ninety percent of "my calendar isn't syncing" panics are either a healthy feed inside its normal window, or a feed that's been dead for days and nobody checked the date.

## The seven reasons a feed goes stale — and the fix for each

### 1. The source URL was reset (the number-one cause)

**Symptom:** the feed used to work; *Last imported* is now days old or "never". **Cause:** someone clicked **Reset URL** on the source platform — you, a co-host, or you yourself after a leaked-link scare. Resetting kills the old URL instantly, and the destination is still holding the retired one. Every fetch since has 404'd silently.

**Fix:** copy the *current* export URL from the source, delete the dead import on the destination, and re-add it. Then test the URL (see reason 5's check). Treat the export URL like a password — resetting it is the right move after a leak, but you must update every place that imports it the same day.

### 2. You're inside the normal refresh window (false alarm)

**Symptom:** you blocked dates on Airbnb 40 minutes ago and Booking.com still shows them open. **Cause:** nothing is wrong. Booking.com pulls every 2–6 hours; it simply hasn't run its next cycle yet.

**Fix:** wait. If it's been longer than 6 hours for Booking.com or 4 hours for Airbnb, *then* treat it as real and move down the list. This is the single most common false alarm — hosts watch the destination for ten minutes and conclude sync is broken when it's just asleep until the next poll.

### 3. The platform silently dropped the feed after repeated failures

**Symptom:** the feed worked, then the source was briefly down for a day (maintenance, a rotated URL you later fixed), and now it never recovers even though the URL is live again. **Cause:** after several consecutive failed fetches, some platforms stop polling a feed entirely and don't re-enable it automatically. The failure counter latched.

**Fix:** delete the import and re-add the exact same URL. That resets the counter and the platform starts polling from scratch. A live URL that still won't sync after 24 hours is almost always this.

### 4. iCal is disabled on the source account

**Symptom:** there's no export URL to copy at all, or the **Sync calendars** panel is missing from the source. **Cause:** accounts on a channel-manager or API partner contract have iCal switched off by design — the platform assumes the API is the source of truth. Some Booking.com property types (traditional hotels, as opposed to vacation rentals) never expose iCal either.

**Fix:** if you signed a partner/API agreement, this is expected — your sync runs over the API, not iCal. If you didn't sign anything and iCal is simply gone, contact partner support; they can turn it back on for vacation-rental property types.

### 5. The feed imports but the blocks don't land

**Symptom:** *Last imported* is fresh — minutes ago — but the dates still show open. **Cause:** the import succeeded, but the events carry no busy status, or the importer only reads all-day `DATE` events and the source emitted timed ones. This is rare with Airbnb and Booking.com (they emit clean all-day blocks) and common with hand-rolled or obscure feeds.

**Fix:** open the `.ics` in a text editor and look at one `VEVENT`. You want `DTSTART;VALUE=DATE:20260714` style all-day blocks covering the dates you expect. Here's the quick browser test for *any* iCal URL:

1. Paste the export URL into a browser address bar.
2. A live feed downloads a `.ics` file or shows plaintext starting with `BEGIN:VCALENDAR`.
3. An HTML error page, a login screen, or a blank response means the URL is dead — go back to reason 1.

### 6. A time-zone offset shifts every block by a day

**Symptom:** blocks import, but land one day off — checkout day blocked, check-in day open, or the reverse. **Cause:** a feed that emits *timed* events with a `TZID` the destination reads in UTC can roll a block across midnight. A 23:00 local start becomes the next day in UTC.

**Fix:** prefer all-day (`VALUE=DATE`) blocks over timed ones. The major platforms already do this; if you control the feed (a self-hosted tool, a custom export), emit dates, not datetimes. If you're stuck consuming a timed feed, the one-day shift is the tell — don't waste an hour blaming the URL.

### 7. You hit the import-slot cap

**Symptom:** you can't add another imported calendar, or the newest one is silently ignored. **Cause:** most platforms cap imported feeds at roughly five per listing. List on Airbnb, Booking.com, Vrbo, Expedia, and a direct site, and you run out of slots fast when every platform has to import every other one.

**Fix:** collapse the mesh into a hub-and-spoke. Instead of N platforms each importing N−1 others, run one middle-layer feed per platform: each platform imports the hub, the hub imports each platform. Two platforms is four direct URLs; the hub makes it two. This is also the reason direct cross-import quietly stops scaling past two platforms — more on that in [avoiding double bookings](/blog/avoiding-double-bookings).

## When the gap is the platform's, not yours

Here's the honest part. Even with all seven causes ruled out and every feed healthy, the destination platform's own poll is the floor. Booking.com pulls every 2–6 hours, and nothing you do changes that.

A middle layer helps with half the problem. An open-source tool like [RentTools](/onboard) — or a cron job you write yourself — polls the *source* feeds every 10 minutes, so your hub learns about a new Airbnb booking within ten minutes instead of hours. What it can't do is make Booking.com pull *from the hub* any faster than Booking.com wants to. The only thing that beats the poll cycle entirely is real-time API connectivity, which Airbnb and Booking.com sell only to certified PMS vendors at $100–300 a month.

For one to three listings, don't lose sleep over the refresh window. The stale-feed causes above — a reset URL nobody updated, a feed the platform quietly dropped — cause far more double bookings at small scale than the 2–6 hour poll ever will. If you want the full setup walkthrough rather than the troubleshooting, start with [how to sync Airbnb and Booking.com calendars for free](/blog/airbnb-booking-calendar-sync-free).

## FAQ

**Why does my Airbnb calendar say "Last sync: never"?**
The feed has never successfully fetched once. Three usual causes: the import URL is wrong (paste it into a browser — you should get a `.ics` download or text starting `BEGIN:VCALENDAR`, not an error page); the source platform rotated its URL after you copied an older one; or Airbnb briefly throttled the very first fetch on a new feed. Wait an hour, then re-check before assuming it's broken.

**How long should Airbnb take to sync an imported calendar?**
Airbnb pulls imported feeds every 2 to 4 hours. Booking.com is slower, 2 to 6 hours, and Vrbo can be slower still. If you blocked dates a few minutes ago, the other platform legitimately won't know yet. Only treat it as a problem once the feed is past its normal window.

**My Booking.com calendar isn't blocking dates I filled on Airbnb. What's wrong?**
Check the *Last imported* timestamp on Booking.com's side first. If it's hours old and fresh, the import is working and you're just inside the refresh window — wait. If it's more than 24 hours old or "never", the URL is likely dead: reset on Airbnb's side, or dropped by Booking.com after failed fetches. Re-copy the current Airbnb export URL and re-add the import.

**Does resetting my iCal URL break my existing syncs?**
Yes, immediately. The moment you click Reset URL, the old link stops working and every platform still importing it goes stale silently. Reset is the correct response to a leaked URL, but the same day you reset, you must paste the new URL into every place that was importing the old one.

**How do I test whether an iCal URL is actually alive?**
Paste it into a browser address bar. A live feed either downloads a `.ics` file or shows plaintext beginning with `BEGIN:VCALENDAR`. If you get an HTML error page, a login screen, or nothing, the URL is dead — that's your problem, not the destination platform.

**Can a stale iCal feed cause a double booking?**
Yes — it's the exact mechanism. If your Booking.com import of Airbnb's calendar has been frozen for two days, Booking.com still shows dates as open that Airbnb already sold. A second guest books them, and now you owe one of the two a cancellation and an apology. That's why the weekly timestamp check matters.

**Why is there no error when iCal sync fails?**
Because iCal is a pull protocol with no push channel and no standard health signal. The destination fetches a URL on a timer; if the fetch fails, it keeps the last good data and retries later. There's nothing in the standard that tells the destination to alert you, so it doesn't.

**How often does RentTools refresh feeds?**
Every 10 minutes on the source side. That means the hub knows about a new booking within ten minutes, versus the hours a direct platform-to-platform import takes. It still can't force the destination platform to pull from the hub faster than its own 2–6 hour cycle — no iCal tool can.

## One opinionated take

Stop treating the refresh window as the enemy. The dramatic-sounding "iCal isn't real-time" problem causes fewer double bookings at small scale than the boring stuff: a URL someone reset and forgot to update, a feed the platform quietly stopped polling. Both are invisible unless you look at the *Last imported* timestamp — so look at it. Once a week, open each imported feed and read one date. It's a twenty-second habit that catches the silent failures the dashboard is happy to hide from you.
