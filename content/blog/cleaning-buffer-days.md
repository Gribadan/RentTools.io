---
slug: cleaning-buffer-days
locale: en
title: "Setting buffer days right: stop back-to-back cleaning chaos"
excerpt: How to pick the right cleaning buffer days for short-term rentals. The revenue-vs-quality tradeoff, the math, and a per-property rule that scales.
status: draft
tags:
  - cleaning:Cleaning
  - host-tips:Host tips
  - calendar-sync:Calendar sync
ogImageUrl: null
---

# Setting buffer days right: stop back-to-back cleaning chaos

I ran zero buffer days for the first eighteen months. Same-day checkouts at 11:00 and check-ins at 15:00, four hours of frantic turnover, and the cleaner messaging me "where is the spare bedsheet" while a guest stood at the door. We never missed a turnover. We also never had a calm one.

This post is the math I should have done in month one. When buffer days earn their cost, when they do not, and a per-property rule that beats the "always one day" or "always zero" defaults most hosts pick.

## TL;DR

- A buffer day is an empty night you intentionally do not rent. It costs you one night of revenue per turnover.
- Zero buffers work for studios you clean yourself in 90 minutes or less. Anything bigger, the math flips.
- One buffer day is the right answer for family villas, multi-bed apartments, and any property using an external cleaning crew.
- Two buffer days are a luxury, not a strategy. Skip them unless the property has special turnover needs (large group cleanups, deep maintenance cycles).
- Set the buffer once on the canonical platform, let iCal propagate. Never set it on both platforms manually.

## The buffer-day decision

The standard host advice is "one day buffer". Pick a property, click the setting, walk away. It is the safest default but it is rarely the right one. Buffer days have a real cost and the cost depends on the property.

The decision rests on three variables:

1. **How long does cleaning actually take?** Not the optimistic estimate. The median across the last 20 turnovers, including the bad ones with the missing key and the broken kettle.
2. **What is the gap between checkout time and check-in time?** Most platforms default to 11:00 checkout and 15:00 check-in. Four hours. That is the actual same-day window.
3. **What does a lost night cost you?** Average nightly rate, multiplied by your turnover frequency, minus tax. For a property at $90/night doing 30 turnovers a year, one buffer day costs roughly $2,700.

If cleaning genuinely fits in the 4-hour window with margin, zero buffer is correct. If it does not, one buffer is correct. The rest of this post is just sharpening that decision.

## The revenue math

The temptation is to think of one buffer day as "tiny". It is not.

Take a small one-bedroom apartment doing 30 turnovers a year at a $90 nightly rate. One buffer day per turnover removes 30 sellable nights from the calendar. At $90 each, that is $2,700 a year of forgone revenue, before any tax adjustment.

Now compare that to a single bad cleaning incident. A guest checks in at 15:00 and the bedsheet is not changed because the cleaner ran out of time. They send a 1-star review. The review costs you (very roughly) one or two months of reduced bookings on Airbnb's search rank. At a $90 rate and a 50% occupancy hit on those months, that is $1,300 to $2,700 in lost revenue. Right around the cost of a year of buffer days.

So the math is not "buffer days are free" or "buffer days are expensive". The math is: **a buffer day is roughly equivalent to one bad-review prevention per year**. If your same-day turnovers prevent more than one bad review a year, the buffer day pays for itself. If they do not, it does not.

Three patterns where the math favours zero buffer:

1. **Studios cleaned by the host in under 90 minutes.** The 4-hour same-day window is generous; cleaning quality stays high; the buffer-day cost is pure waste.
2. **Properties with low turnover frequency.** A villa that gets 12 bookings a year suffers less from buffer-day cost (12 × $200 = $2,400) but also has fewer same-day risk events. Buffer math is closer to neutral.
3. **Properties with same-day discount offerings.** A small subset of hosts run "last-minute checkout-to-check-in" deals. Same-day turnovers become a feature; the buffer day is the wrong default.

Three patterns where the math favours one buffer day:

1. **Multi-bedroom properties cleaned by an external crew.** The 4-hour window is tight when the cleaner has multiple beds, multiple bathrooms, and arrives 20 minutes late.
2. **Family villas with high cleaning intensity.** Pool, garden, multiple living spaces. Cleaning genuinely takes 6 to 8 hours. Same-day is impossible without burning the cleaner.
3. **Properties where you bundle linen-laundry into the cleaning visit.** Adding laundry adds 90 to 120 minutes. Doable in a 4-hour window only if everything else goes perfectly. It rarely does.

## Cleaning quality is the hidden cost of zero buffer

The revenue side of the buffer math is easy. The cleaning side is where most hosts underestimate.

A cleaner working a same-day turnover with no buffer is in optimisation mode. They are tracking the clock. They are reading guest messages because the next guest already messaged about an early check-in. They are not noticing the small things: the smudge on the bathroom mirror, the stray hair on the pillow, the half-empty shampoo bottle.

You will not see those issues in your reviews because most guests do not bother flagging them. They just rate four stars instead of five. Over a year, your average rating drifts from 4.9 to 4.7. Airbnb's search rank cares about that drift more than you might think.

The hidden costs of running zero buffer on a property that does not fit the pattern:

1. **Cleaner turnover.** A cleaner forced into back-to-back turnovers without slack quits. Replacing them costs you weeks of inconsistent quality while the new person learns your standards.
2. **Forgotten supplies.** When the cleaner finishes a turnover at 14:55 with a 15:00 check-in, they cannot also pop out to buy more dishwasher tablets. The next guest finds an empty dispenser and reports it.
3. **Property micro-damage going unreported.** A scuff on the wall, a chip in a mug. A cleaner with 10 free minutes flags these to you. A cleaner with zero free minutes does not.

This is where I changed my mind. After 18 months of zero-buffer running, I added a 1-day buffer on the two larger properties. The cleaner relaxed. My average rating climbed back. The forgone revenue was real but smaller than the rating recovery.

The [cleaning module post](/blog/cleaning-schedule-automation) goes deeper into the cleaner-side workflow. The two posts are bookends: this one decides if you need a buffer; that one structures the work that fits inside it.

## Buffer days and double-booking risk

A side benefit of buffer days that hosts rarely discuss: they reduce the risk of an iCal-induced double booking.

iCal feeds refresh slowly. Airbnb pulls 2 to 4 hours; Booking.com pulls 2 to 6 hours. A buffer day on the leading platform takes effect immediately on that platform but takes the full poll cycle to land on the trailing platform. When a property has a 1-day buffer, the 2-to-6-hour lag has 24 hours to absorb itself. When a property has zero buffer, the lag has zero margin.

I have written about [the double-booking math in detail](/blog/avoiding-double-bookings) including why same-day check-ins are the highest-risk window. The summary: buffer days are not a primary defence against double bookings, but they are a free secondary one. If you have decided on a buffer day for cleaning reasons, you are also getting some sync-lag insurance for free.

The reverse is not true. Adding a buffer day purely to reduce double-booking risk is the wrong reason. Fix your sync setup instead. Buffer days are a cleaning decision.

*Figure 1: Same-day turnover timeline vs 1-day-buffer turnover. Screenshot pending; will live at /blog/cleaning-buffer-days/figure-1.png.*

## How to set buffer days on Airbnb and Booking.com

Both major platforms support buffer days. Neither calls them "buffer days". The terminology is different on each, which is part of why hosts misconfigure them.

**Airbnb.** The setting is at Listings → your listing → Availability → "Preparation time". Choose 1 night before, 1 night after, or both. Most hosts want "1 night after checkout" only. That blocks the day after each checkout from new bookings. Airbnb's [help article on preparation time](https://www.airbnb.com/help/article/487) covers the mechanics.

**Booking.com.** The equivalent is in the extranet under Property → Policies → House rules → Pre-arrival/preparation time, or by setting a per-room minimum-gap rule. Booking's UI is less obvious; Booking's [Partner Hub guide](https://partner.booking.com/en-gb/help) is the canonical reference but the exact path moves around with their UI redesigns.

**Vrbo / Expedia / smaller platforms.** Each has its own version. The good news: if you configure the buffer on your canonical platform and the others import via iCal, the buffer propagates automatically. The empty night becomes a "blocked" event in the iCal feed, and the importing platform respects it.

A common configuration mistake: setting the buffer on both platforms manually. This double-counts. Airbnb sees its own 1-day buffer plus Booking's iCal'd 1-day buffer plus its own subsequent 1-day buffer, and you end up with 3 nights blocked instead of 1. Set the buffer on the canonical side. Let iCal carry it. Trust the propagation.

If you self-host with [RentTools](/onboard) or another middle-layer tool, the same rule applies. Set the buffer once, in the canonical place, and let the syncing layer do its job.

## FAQ

**Should I always pick the same buffer for every property in my portfolio?**
No. The buffer is a per-property decision driven by cleaning time, turnover frequency, and crew. A studio with no crew should run zero buffer; a 4-bed villa with a crew should run one. Forcing the same setting across both is leaving money or cleaning quality on the table.

**Can I have a different buffer on weekends vs weekdays?**
On Airbnb, no — the preparation-time setting is single-valued. On Booking.com you can sometimes vary by rate plan. In practice, do not bother. Variable buffers add cognitive overhead with marginal revenue benefit.

**What if my cleaner is also my partner / family / a single trusted person?**
Same math, but the bad-review risk drops because a family cleaner usually compensates by working longer when needed. Zero buffer often works for family-cleaned properties even when the property is large. The buffer is bought to protect the cleaner; if the cleaner is OK without it, you do not need to buy it.

**Will a 2-day buffer make my cleaning even better?**
Mostly no. Beyond 1 day, the marginal cleaning-quality gain shrinks fast and the revenue cost does not. Two-day buffers are right for properties needing multi-day deep cleans (after long stays of 4+ weeks, or seasonal property-prep) but the rest of the year, one is enough.

**Does the buffer block my own personal use?**
On most platforms, no. The buffer applies between two paid bookings. You can still manually block it for your own use without the buffer interfering. Verify on each platform; the edge cases vary.

**My property is a 1-bed apartment that I clean myself in 2 hours. What buffer should I use?**
Zero. The 4-hour same-day window covers a 2-hour clean with comfortable margin. The exception: if you have a day job and cannot reliably show up between 11:00 and 15:00, add 1 day of buffer for scheduling flexibility — that is a calendar-availability decision, not a cleaning-quality one.

## One opinionated take

The single biggest buffer-day mistake hosts make is treating it as a one-time switch. They click "1 day buffer" during onboarding and never revisit it.

Revisit it once a year. Look at your turnover count, your cleaning-time data, and your average review rating. If you are at zero buffer with 4.9 stars and a happy cleaner, do nothing. If you are at zero buffer with 4.6 stars and a cleaner who messages you stressed every week, add one. If you are at one buffer with 4.95 stars on a property that is fully booked anyway, consider dropping back to zero on the off-season months.

The buffer day is a knob, not a setting. Hosts who treat it as a knob make better operational decisions than hosts who pick a default and forget it.
