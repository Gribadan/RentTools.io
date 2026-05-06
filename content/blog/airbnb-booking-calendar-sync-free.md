---
slug: airbnb-booking-calendar-sync-free
locale: en
title: How to sync Airbnb and Booking.com calendars in one place (free, 2026)
excerpt: Sync Airbnb and Booking.com calendars for free with iCal. Step-by-step guide, real refresh-interval numbers, and when a paid channel manager is worth it.
status: draft
tags:
  - airbnb:Airbnb
  - booking-com:Booking.com
  - calendar-sync:Calendar sync
  - ical:iCal
ogImageUrl: /blog-covers/airbnb-booking-calendar-sync-free.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# How to sync Airbnb and Booking.com calendars in one place (free, 2026)

Last June I almost double-booked a guest from Stuttgart. Airbnb blocked the dates the second they paid; Booking.com still showed the same week as available for another four hours. By the time the iCal feed caught up, a guest from Tashkent had already requested those dates. I refunded one booking, kept the other, and spent that evening reading every help-center article on how to sync Airbnb and Booking.com calendars without paying $200 a month for it.

This guide is the result. Free tools, real refresh-interval numbers, an honest answer for what works and what doesn't.

## TL;DR

- Both Airbnb and Booking.com expose private **iCal export URLs** for free. No partner contract needed.
- iCal is one-way per URL. Two listings means **two URLs in each direction**: A's export into B, B's export into A.
- Airbnb refreshes imported calendars every **2 to 4 hours**. Booking.com every **2 to 6 hours**. That gap is where the rare double bookings come from.
- A free middle layer (the open-source [RentTools](/onboard), or a hand-rolled cron) refreshes faster, but it can't speed up the destination platform's own poll.
- For 1 to 3 listings, iCal handles 99% of cases. For 20+ listings or 90%+ occupancy, look at a paid channel manager.

## The actual problem

Two listing sites. One physical apartment. The minute someone books on Airbnb, every other site needs to know within minutes, not hours.

If you only list on Airbnb, you don't need any of this. Airbnb's calendar is its own source of truth.

The trouble starts at listing two. You have two source-of-truth calendars that need to agree. The catch: neither platform will hand the other a private API. They will only give you a publicly readable iCal URL that the other side polls on its own schedule.

This is what most free guides skip. iCal sync is **not** real-time. It is "fast enough most of the time", and the moments it is not are exactly the moments that hurt: two guests booking the same dates within the polling window.

There are three things to do below. Get the iCal URL out of Airbnb, get one out of Booking.com, and decide what to point at what. There is no fourth thing.

## Step 1: Get Airbnb's iCal URL

Open your Airbnb host dashboard. The path:

1. Click **Calendar** at the top.
2. Pick the listing you want to sync.
3. Click **Availability** in the right sidebar, then **Sync calendars**.
4. Click **Export Calendar**.
5. Copy the long URL. It looks roughly like `https://www.airbnb.com/calendar/ical/12345678.ics?s=AAA...`.

*Figure 1: Airbnb's Sync calendars panel. Screenshot pending; will live at /blog/airbnb-booking-calendar-sync-free/figure-1.png.*

Two things to check before you move on. First, that URL is private. Anyone with it can read every booking date you have on Airbnb. Treat it like a password. Second, Airbnb's URL stays static unless you click **Reset URL**, which is what you do if you ever leak it.

If you skipped **Sync calendars** the first time, Airbnb won't have generated a URL yet. Click **Sync calendars** at least once to wake the feature up. Read the [official Airbnb help article](https://www.airbnb.com/help/article/99) for the canonical version of these steps.

## Step 2: Get Booking.com's iCal URL

Booking's path is two clicks deeper than Airbnb's, and it's the reason most hosts give up before getting both:

1. Sign in to your Booking.com extranet.
2. Pick the property.
3. Click **Calendar & Pricing** in the sidebar.
4. Click **Sync calendars**. (If you don't see it, your property type may not have iCal exposed. Vacation rentals do; traditional hotels mostly don't.)
5. Under **Export your calendar**, click **Export**.
6. Copy the URL. Format roughly: `https://admin.booking.com/hotel/hoteladmin/ical.html?t=AAA...`.

*Figure 2: Booking.com extranet calendar export. Screenshot pending; will live at /blog/airbnb-booking-calendar-sync-free/figure-2.png.*

One trap: Booking.com hides the iCal panel for accounts on certain partner contracts. If you have a channel-manager API agreement (most small hosts don't), iCal is disabled by design. If iCal is missing entirely from your extranet and you haven't signed any partner deal, contact partner support. They turn it back on.

Booking's own [Partner Hub guide](https://partner.booking.com/en-us/help/calendar-and-pricing/setting-availability/syncing-your-airbnb-and-bookingcom-calendars) walks through it with screenshots that match the current 2026 UI.

## Step 3: Wire your Airbnb and Booking.com calendars together

Three options. None is wrong; the right one depends on how many listings you have.

1. **Direct cross-import.** Paste Airbnb's URL into Booking's import field, and Booking's URL into Airbnb's import field. Done. Each side polls the other on its own schedule. Free. No third tool. Works for two platforms. Stops scaling the moment you add a third (Vrbo, Expedia, Hostaway resellers): you would need to add every URL to every other platform, and most platforms cap import slots at five.
2. **A free middle layer.** A small open-source tool sits between the platforms. Both Airbnb and Booking import from it; it imports from both of them. Sync becomes one URL per platform, and adding a third platform takes only two new URLs, not four. Refresh on the middle layer can be much faster than the platforms themselves: the [RentTools](/onboard) instance polls every 10 minutes. Still free; you can run it on a $4 droplet if you self-host or use the hosted version.
3. **A paid channel manager.** Hostaway, Lodgify, Smoobu. Real APIs (when the host's account qualifies) instead of iCal, which means near-real-time sync in both directions. They start at $25 to $50 per property per month and assume a longer contract. Worth it past 20 listings or above 90% occupancy. Below that it's mostly cope.

I run option 2 for my two apartments in Tashkent. The math: at two listings, the middle layer means I add a new platform by adding **two** URLs total, not the four that option 1 would force. Five minutes of setup; pays for itself the next time I list on Vrbo.

## The refresh-interval gotcha nobody warns you about

Here is the bit no help-center article will tell you straight.

When Airbnb says "calendars sync automatically", they mean Airbnb pulls your imported iCals every 2 to 4 hours. Booking pulls every 2 to 6 hours. Vrbo can be slower than that.

Imagine you wired option 1. Here is what happens when a guest books your apartment on Airbnb at 14:00:

1. Airbnb blocks the dates immediately on its own side.
2. Booking.com pulls Airbnb's iCal feed sometime between 16:00 and 20:00.
3. For up to six hours, your Booking listing still says "available".
4. If a second guest finds your Booking listing in that window and books the same dates, you have a double booking.

It is rare. It needs simultaneous shoppers on both platforms within the polling gap, which for a small host with low booking volume essentially never happens. But it does happen, and when it does it costs you a refund, a possibly negative review, and 90 minutes of email to two strangers explaining why.

The middle-layer option (number 2) helps half of this. Our hosted instance pulls source feeds every 10 minutes, so RentTools knows about the new Airbnb booking within 10 minutes of it happening. It does **not** speed up Booking.com's poll *of RentTools*. Booking still takes its own 2 to 6 hours.

The only fix for the destination side is API-level connectivity, which means option 3.

This is the actual reason channel managers exist. Not features. Not pretty dashboards. Real-time updates the other direction. For background on why iCal can never be faster than its polling cycle, the protocol itself is described in [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545); there is no "push" extension that the major platforms implement.

## FAQ

**Does Airbnb's iCal URL change if I rotate it?**
Yes. Click **Reset URL** in Airbnb's Sync calendars panel and the old URL stops working immediately. Use it the moment you suspect a URL leaked: a public Slack, a screenshot, a forum reply. RentTools rotates its outbound feed URL on demand for the same reason.

**How do I know iCal sync is actually working?**
Cross-check the imported calendar's last-fetch timestamp on both platforms. Airbnb shows it under **Sync calendars → Imported calendars → Last imported**. Booking shows the equivalent under each imported feed. If a timestamp is more than 12 hours old, something is wrong on the source side: URL changed, source platform throttling, or the source URL was rotated.

**Can I do this without a third tool?**
Yes. Option 1, direct cross-import, works fine for two platforms. The moment you add a third you will regret it.

**Is iCal really free?**
Yes. Airbnb and Booking.com both expose it as a self-service feature on every host account. If a tool is charging you a monthly fee just for iCal sync, you are paying for the convenience layer, not the protocol.

**What does RentTools cost?**
The hosted instance is free, currently. Self-host is also free if you have a Linux box. We pay our own hosting and Gemini API costs. For more on the underlying double-booking risks the calendar sync is meant to defuse, read [avoiding double bookings](/blog/avoiding-double-bookings).

**Should I bother if I only list on Airbnb?**
No. Single-platform hosts don't need iCal sync at all. Save this article for the day you list on a second platform.

**What if Airbnb's import slot says "Last sync: never"?**
Three usual causes. (1) The source URL is wrong: paste it into a browser; you should get a `.ics` file download or a chunk of plaintext starting with `BEGIN:VCALENDAR`. If you get an HTML error page, the URL is bad. (2) The source platform regenerated its URL and the old one is now invalid: rotate it, update Airbnb's import. (3) Airbnb sometimes silently throttles new feeds for the first hour or so. Wait an hour, then check again before assuming it is broken.

**Does Booking.com actually use the iCal I import, or does it have its own logic?**
Booking treats imported events as opaque blocks: dates marked busy in your imported feed become dates marked unavailable on Booking. It does not look at guest names, prices, or anything else. That is a feature, not a bug: it means a leaked iCal export from Booking only exposes your booking dates, never guest details.

## One opinionated take

If you have one or two properties and you are listing on Airbnb plus Booking.com, **do not pay for a channel manager yet**. Wire option 1 or 2 above. The refresh-interval risk is real but rare at low volume, and a paid tool's monthly fee will, at two listings, exceed the expected cost of one annual double-booking refund.

If you have ten or more properties and are running near-90% occupancy, look at Smoobu before Hostaway. Smoobu's pricing is honest at smaller volumes, and it exposes channel-manager APIs that the others gate behind sales calls.

This is not a sales pitch for the tool I run. It is the math.
