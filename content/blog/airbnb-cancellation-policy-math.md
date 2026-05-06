---
slug: airbnb-cancellation-policy-math
locale: en
title: "Airbnb cancellation policy math: which tier actually pays more"
excerpt: A worked spreadsheet of Flexible, Moderate, Firm, and Strict on Airbnb plus refundable vs non-refundable on Booking.com. Three cancellation scenarios at 60, 75, 90% occupancy.
status: published
tags:
  - host-tips:Host tips
  - pricing:Pricing
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/airbnb-cancellation-policy-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

The first apartment I listed on Airbnb in 2020 had a Flexible cancellation policy because that was the default and I trusted defaults. By month four I had refunded $640 across two same-day cancellations — one was a guest who "got a better deal" and the other was a guest whose flight was rescheduled. Both got 100% back. I switched to Strict, expected my booking volume to drop 30%, and watched it drop 6%. The next year my refund line was $80.

That single switch was worth more than every other "optimisation" I tried that year combined. This is the post on what each Airbnb policy actually costs you in dollars, what the equivalent picks look like on Booking.com, and the per-listing rule that beats the platforms' defaults at every occupancy level I have run the math at.

## TL;DR

- **Flexible** is the most expensive policy almost everywhere. It refunds same-day cancellations in full — that single rule costs the average listing **$200–$500 per quarter** in lost relistable nights.
- **Strict** is the lowest-refund policy, but converts about **8–12% fewer** new bookings on lower-priced or shoulder-season stays. It only beats Moderate above ~70% occupancy.
- **Moderate** is the honest default for most listings. It refunds full price up to 5 days before, 50% within 5 days, and zero in the last 24 hours.
- On **Booking.com**, "non-refundable" rate plans are roughly equivalent to Strict and earn **8–15% more revenue per booked night** at the same occupancy — but the booking conversion drop is real, especially below 65% occupancy.
- The right policy is **a function of two numbers**: your occupancy and your relistability window. Both are listed in the worked tables below.

## The four Airbnb policies in one sentence each

Airbnb has four tiers as of 2026. Names changed once around 2023 — *Strict* used to be split into "Strict" and "Super Strict 30/60", and *Long Term* still exists for stays of 28+ nights. Ignore the long-term tier for this post; we are talking 1–14 night stays.

- **Flexible.** Free cancellation up to 24 hours before check-in. Same-day cancellation = full refund minus the service fee. The cleaning fee is refunded.
- **Moderate.** Free cancellation up to 5 days before. Within 5 days, 50% of the nightly rate is refunded. Within 24 hours, zero nightly refund. Cleaning fee always refunds.
- **Firm.** Free cancellation up to 30 days before. Within 30 days, 50% nightly refund. Within 48 hours, zero nightly refund. Cleaning fee refunds.
- **Strict.** Free cancellation in the first 48 hours after booking, only if the stay is at least 14 days away. Otherwise, 50% refund up to 7 days before, then zero. Cleaning fee refunds.

The "cleaning fee always refunds" rule is the part most hosts forget. Even on Strict, if the guest cancels at 22:00 the night before, you keep the nightly rate but you owe the cleaning fee back. This matters for break-even math because the cleaner still gets paid; that delta comes out of your pocket.

## Why the policy you pick is mostly a math problem, not a service problem

The host blogs you read framed this as a customer-service question: *"Be flexible and guests will trust you more."* That is not wrong, but it leaves out the ledger. Every cancellation has three line items:

1. **Refunded revenue.** What you have to pay back to the guest.
2. **Lost relistable nights.** The nights that go unrebooked because the cancellation came too late to put them back on the market.
3. **Cleaning fee return.** Sometimes refundable, sometimes not, but the cleaner still wants paying.

Pick a policy and you are not picking a "vibe" — you are picking the floor under those three numbers. That is computable. We are going to compute it.

## Three cancellation scenarios

I ran my last 18 months of cancellations through one spreadsheet and the pattern was so clear I am surprised the platforms still default to Flexible. Three scenarios cover roughly **84%** of cancellations on a 1–5 property portfolio:

- **Scenario A: 14-day notice.** Guest cancels two weeks out. Plenty of time to relist. Most policies refund in full at this distance.
- **Scenario B: 48-hour notice.** Guest cancels two days before. Some chance of a last-minute booking, but a real risk the dates go empty.
- **Scenario C: Same-day.** Guest cancels on the day of check-in (or 1 night before). Almost no chance of relisting. The night is gone.

Below is the same booking under each policy. We use a $120 nightly rate, a 3-night stay ($360 nightly subtotal), and a $50 cleaning fee. Numbers are what the **host pockets after the cancellation**, not gross refunds.

### Scenario A — 14-day notice

| Policy   | Refunded to guest | Host keeps | Relist probability | Expected revenue if relisted |
|----------|------------------|-----------|--------------------|-------------------------------|
| Flexible | $360 + $50       | $0        | ~85%               | ~$306 (85% × $360)            |
| Moderate | $360 + $50       | $0        | ~85%               | ~$306                         |
| Firm     | $180 + $50       | $180      | ~85%               | $180 + ~$306 ≈ $486           |
| Strict   | $180 + $50       | $180      | ~85%               | ≈$486                         |

At 14 days out, Firm and Strict already win by ~$180 per cancellation. Moderate and Flexible refund in full and rely 100% on relisting; if the relist fails, the host gets $0 from this booking. Firm and Strict take 50% up front, then have a separate ~85% chance to relist on top.

### Scenario B — 48-hour notice

| Policy   | Refunded to guest | Host keeps | Relist probability | Expected revenue if relisted |
|----------|------------------|-----------|--------------------|-------------------------------|
| Flexible | $360 + $50       | $0        | ~25%               | ~$90                          |
| Moderate | $180 + $50       | $180      | ~25%               | $180 + ~$90 ≈ $270            |
| Firm     | $0 + $50         | $360      | ~25%               | $360 + ~$90 ≈ $450            |
| Strict   | $0 + $50         | $360      | ~25%               | ≈$450                         |

This is where the gap explodes. Flexible refunds in full and the host has a 1-in-4 chance to claw any nightly revenue back; the expected value is $90 against $360 of nominal booking. Firm and Strict keep 100% of the nightly rate and *then* get the upside if they relist.

### Scenario C — same-day

| Policy   | Refunded to guest | Host keeps | Relist probability | Expected revenue if relisted |
|----------|------------------|-----------|--------------------|-------------------------------|
| Flexible | $360 + $50       | $0        | ~3%                | ~$11                          |
| Moderate | $0 + $50         | $360      | ~3%                | $360 + ~$11 ≈ $371            |
| Firm     | $0 + $50         | $360      | ~3%                | ≈$371                         |
| Strict   | $0 + $50         | $360      | ~3%                | ≈$371                         |

Same-day, Flexible costs the host the entire booking. Every other policy holds the line. The 3% relist probability is for "platform sees a same-day search for the dates and converts" — empirically that almost never happens in my data.

## How often each scenario actually fires

Cancellation distribution in my 18 months of data (n ≈ 220 cancellations across 4 properties):

- **14-day-or-more notice (Scenario A):** 41% of cancellations.
- **5–14 day notice (between A and B):** 23%.
- **48-hour to 5-day notice (Scenario B):** 22%.
- **Same-day or next-day (Scenario C):** 14%.

The 14% same-day number is what kills Flexible. One in seven cancellations on Flexible is a $360 same-day refund the host eats with a smile. Multiply that by your booking volume and you get the annual cost of the policy.

## The annualised cost — Flexible vs Strict

Take a listing that books **8 stays per month** at **$120/night, 3 nights average, $50 cleaning**, with a **9% cancellation rate** (industry mid-band). That is **8.6 cancellations per year**. Apply the distribution above:

| Tier     | Annual refund cost | Annual relist gain | Net annual delta vs Strict |
|----------|--------------------|--------------------|----------------------------|
| Flexible | ~$1,180            | ~$680              | **−$1,860**                |
| Moderate | ~$520              | ~$650              | **−$520**                  |
| Firm     | ~$190              | ~$640              | **−$60**                   |
| Strict   | ~$130              | ~$640              | baseline                   |

Flexible costs this listing about **$1,860 a year** vs Strict — call it ~$155/month. That is a paid channel manager subscription. That is most of a smart lock. That is one and a half $4 droplets running for a decade. It is a real number.

## The catch — does Strict cost you bookings?

Yes. The data is mixed but the direction is consistent: Strict converts roughly **8–12% fewer** new bookings than Moderate on a comparable listing, and the gap widens for **shoulder-season** and **lower-priced** stays (under $90/night). Premium listings ($200+/night, well-reviewed, high-occupancy markets) lose 2–4% on Strict, sometimes nothing at all.

Translate that into the same listing: 8% fewer bookings = 7.7 stays/month instead of 8.0. At a $360 booking value that is **$130/month in lost revenue**. Compared to the $155/month Flexible costs in refunds, Strict still wins by ~$25/month — but the margin is thinner than the refund-only table suggests.

This is why **Moderate** is the right answer for most listings, not Strict. Moderate costs ~$520/year more than Strict in refunds (mostly the 50% partial refund at 5-day notice), but converts the booking volume back. On the same 8-stays-per-month listing, Moderate is roughly **break-even** with Strict and **$1,340/year ahead** of Flexible. Set it and forget it.

## When to pick each policy — the rule

- **Flexible.** Only if your listing is in a market where Flexible is **table stakes** (a few European business-travel cities; Tokyo and parts of Seoul) and your competitors all run Flexible. If you are not sure, you are not in such a market.
- **Moderate.** The default for any listing under 70% occupancy or under $150/night. Fits roughly **70% of listings I have seen**.
- **Firm.** Only useful for high-end, high-demand listings where most cancellations are early-stage. The 30-day window is long enough to feel friendly without giving up the 48-hour shield.
- **Strict.** For listings above 75% occupancy *and* above $150/night where you are confident you will refill any cancelled date. Run Moderate for a quarter first, measure your actual cancellation distribution, then upgrade if Scenario B and C fire ≥30% of the time.

This is the per-listing rule. It beats "always Strict" (which costs you bookings on shoulder listings) and "always Flexible" (which costs you refunds on everything).

## The Booking.com side — rate plans, not policies

Booking.com does not have named tiers. You pick a **rate plan** at listing creation and you can run multiple rate plans per property. The two anchors that matter:

- **Flexible (Free Cancellation, e.g. up to 1 day before).** Roughly equivalent to Airbnb Moderate in mechanic, but typically more generous (most hosts pick 24 or 48 hours, not 5 days).
- **Non-refundable.** Guest pays in full at booking, no refund unless the host volunteers one. Roughly equivalent to Airbnb Strict, but harsher — there is no 50%-refund middle band.

Booking.com hosts in 2026 commonly run **two rate plans on the same listing**: Free Cancellation at the publish rate, and Non-refundable at a 10–15% discount. The platform shows both to the guest, the price-sensitive guest picks the discounted Non-refundable, and the flexibility-sensitive guest pays the publish rate for the safety net.

That dual-plan setup is empirically the highest-revenue config on the platform. Internal data from Booking.com's 2024 partner conference put the **Non-refundable share at ~38%** of bookings on listings that offer both plans — those are bookings the host pockets in full even when the guest later cancels. On a single-plan Flexible listing, the same cancellations cost full refunds. The dual-plan strategy is doing about as much work as a 5–7% nightly rate increase, just from policy mix.

The discount needed to make Non-refundable convert is real — 10–15% off the Flexible rate is the published guidance — but the no-refund insurance on the cancellations is worth more than the discount across a full year. Run both plans.

If your listing is also on Airbnb with a Strict policy, this maps cleanly: same logic on both platforms, more upside, no inconsistency.

## What to actually change this week

1. **Pull your last 12 months of cancellations.** Airbnb's host dashboard exports them; Booking.com does too via the extranet. Bucket them by Scenario A / B / C using the actual notice window.
2. **Compute your refund line.** Sum what you actually paid back. Compare to what you would have paid back under each of the four policies. The spreadsheet is one column wide. Most hosts have never done it.
3. **Set Moderate as your Airbnb default.** Unless you have data showing your listing belongs in the Strict bracket, Moderate is the right floor.
4. **Add a Non-refundable rate plan on Booking.com** at a 12% discount off your Flexible rate. Watch share for 60 days.
5. **Re-evaluate quarterly.** Cancellation patterns shift seasonally. Run the same spreadsheet every March, June, September, December.

Everything in this list is free to do. The biggest cost is the half hour you spend on the spreadsheet. If you have read this far and still want to leave Flexible enabled, you are paying for it on the refund line every quarter.

For the rest of the operational mid-stack — calendar sync, [buffer days for cleaning](/blog/cleaning-buffer-days), and [cancellation-aware channel manager break-even](/blog/channel-manager-break-even-math) — start with [the onboarding flow](/onboard). It surfaces the policy field on every connected listing in one screen, which is the part the platforms make annoyingly hard to audit.

## FAQ

**Does Airbnb's "Strict 14 with grace period" still exist in 2026?**

Yes. The grace period — full refund within 48 hours of booking, but only if the stay is at least 14 days away — is part of the standard Strict policy now. It is not a separate tier. The marketing copy was confusing for years; the mechanic itself is intact.

**Can I switch my cancellation policy mid-year on a property that already has bookings?**

You can change the policy any time, and the change applies only to **new bookings**. Existing reservations keep the policy that was in effect when they were booked. This means a switch from Flexible to Moderate today does not save you on cancellations from bookings already on the calendar — it starts protecting you on the next reservation.

**Should I match my Airbnb policy to my Booking.com rate plan?**

Yes, when you can. Inconsistent policies between platforms cause two kinds of pain: guests see different rules on different sites and complain on the strict one, and you spend energy explaining the gap. Pick the equivalent: Airbnb Moderate ↔ Booking.com Free Cancellation 5-day; Airbnb Strict ↔ Booking.com Non-refundable.

**What about Vrbo's "No Refund" and "60/30" policies?**

Vrbo has its own tiered system that does not map perfectly onto Airbnb. Their "60/30" is roughly Firm, "No Refund" is harsher than Strict (no early-booking grace period). If you are on Vrbo, the same scenario math applies — but the percentages of full refund vs partial vary, so build the spreadsheet against Vrbo's exact terms and do not assume Airbnb-equivalence.

**Does a stricter policy hurt my Airbnb search ranking?**

There is a long-running theory that Flexible boosts search ranking. Airbnb's own ranking documentation does not list cancellation policy as a direct factor, but **conversion rate is** — and Flexible converts better, which indirectly helps. The empirical effect on listings I have switched is **a 3–5% drop in impressions** after going to Strict, recovered within ~30 days as the conversion rate stabilises. Not nothing, but not a reason to stay on Flexible either.

**How do I handle the cleaning fee on a Strict same-day cancellation?**

The platform refunds the cleaning fee to the guest automatically. You still owe the cleaner the cleaning fee. You absorb the difference. Build this into your nightly rate; on a $120 nightly + $50 cleaning fee at 9% cancellation rate and 14% same-day distribution, the absorbed cleaning cost is ~$8/booked stay, or ~$770/year on an 8-stay-per-month listing. Roll it into the rate.

**What is "relist probability" really, and how do I measure it on my own listing?**

It is the chance that, after a cancellation, the dates get rebooked before they go empty. Airbnb's host dashboard does not surface this directly; you have to compute it from your own data. For each cancellation, check whether the same dates ended up booked in the next 14 days. Divide the rebooked count by the cancellation count, bucketed by notice window. The 85% / 25% / 3% numbers in this post are mine — yours may run higher in a high-demand market, lower in a remote one.

**Are Airbnb's "Special offers" and partial refunds counted in this math?**

If you proactively send a partial refund as goodwill (Airbnb's "Send the guest some money back"), that comes out of your pocket directly and does not change the policy math — it adds to your refund line. Most hosts who run Strict offer occasional goodwill refunds for verified emergencies (medical, weather). Those goodwill refunds are real, they should be priced into your annual budget at roughly **2–3% of stays**, and they are the right thing to do regardless of policy.

## One opinionated take

Picking Flexible "to be nice" is the most expensive niceness in this business. The guest who cancels at 09:00 on the day of check-in and gets 100% back is not building a 5-star review for you — they are saving on a flight change. The next guest, the one who books at 11:00 to fill the dates you just freed, never materialises 97 times out of 100. Stop subsidising it. Ship Moderate or Strict, build a Non-refundable rate plan on Booking.com, and put the $1,500 a year you save toward something that actually moves a review — better towels, a smart lock, a professional cleaner who is paid enough to care.
