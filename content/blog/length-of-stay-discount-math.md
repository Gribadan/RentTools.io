---
slug: length-of-stay-discount-math
locale: en
title: "Length-of-stay discount math: when 7-day and 28-day discounts actually pay"
excerpt: A worked spreadsheet of weekly and monthly Airbnb discount math. The breakeven at 60%, 75%, and 90% occupancy, and a per-listing rule to pick yours.
status: published
tags:
  - host-tips:Host tips
  - pricing:Pricing
  - airbnb:Airbnb
ogImageUrl: /blog-covers/length-of-stay-discount-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

The first time Airbnb suggested I offer a 20% monthly discount, I clicked accept without thinking. Two months later I noticed the apartment had quietly drifted into being a long-stay rental at 80% of its nightly rate, and I was still paying the cleaner the same per-turnover fee. The "smart" discount had cost me about $1,400 over the quarter.

This post is the math I should have done before that click. Worked numbers for 7-day and 28-day discounts at three real occupancy levels, the breakeven that almost no host calculates, and a per-listing rule that beats Airbnb's defaults.

## TL;DR

- A length-of-stay discount only earns its keep if it **shifts demand**, not if it discounts bookings you'd have gotten anyway.
- Airbnb's default suggestion (10% weekly, 20% monthly) assumes high competition and middling occupancy. Below 65% occupancy it can lose you money.
- The breakeven for a 20% monthly discount is roughly **+15% extra occupancy** vs your current rate. Most listings don't get that much lift.
- Cleaning fees and turnover wear are fixed-per-stay, so longer stays raise margin even at the same nightly rate — the discount has to earn ground beyond that.
- Rule: start at **5% weekly, 10% monthly**. Ratchet up only after two months of measured demand.

## The hidden cost of "smart" discounts

The trap is selection bias. Airbnb shows you the discount as if every guest who books a 28-day stay would have left for someone cheaper without it. They wouldn't. A meaningful share of long-stay guests pick a property because they liked it — work trip, relocation, slow travel — and would have booked even at full price.

When you set a 20% monthly discount you cut nightly revenue on **two** kinds of stays: the new ones the discount won you, and the old ones you would have closed anyway. Most hosts only model the first half.

The right mental model is the same one wholesalers use: a price cut is profitable when the volume gain on new sales exceeds the margin loss on existing sales. Airbnb's pricing UI does not surface that math. It just suggests a number.

## A worked spreadsheet at three occupancy levels

Three listings, identical at $100/night, $40 cleaning fee, 30 days in the month. Operating cost is $200/month fixed plus $40 per turnover. The only thing that varies is starting occupancy.

### Listing A — 60% occupancy, no discount

- 6 stays of 3 nights = 18 nights booked.
- Revenue: 18 × $100 + 6 × $40 cleaning = $2,040.
- Costs: $200 fixed + 6 × $40 = $440.
- **Profit: $1,600.**

### Listing A — same listing, 20% monthly discount on 28-night stays

A 28-night booking is rare at 60% occupancy. Say the discount converts one. Other stays stay short.

- 1 stay of 28 nights at $80/night + $40 cleaning = $2,280.
- Plus 1 stay of 2 nights at $100 = $200.
- Revenue: $2,480 vs the no-discount $2,040. **+$440.**
- Costs: $200 + 2 × $40 = $280. (Fewer turnovers wins something.)
- Profit: $2,200. **+$600.**

That's a real win. The catch: this only happened because the discount won an entirely new long-stay booking. If the same 28-night guest would have paid full price, the math is:

- 1 stay × 28 × $80 + cleaning = $2,280, vs the same guest at $100 = $2,840. **−$560 burned.**

So the discount is worth it iff conversion lift > 0 monthly bookings per month. In a low-occupancy listing that's plausible — empty nights are the usual state, so a long-stay guest is mostly net new.

### Listing B — 75% occupancy, no discount

- 7.5 stays of 3 nights = 22.5 nights.
- Revenue: 22.5 × $100 + 7.5 × $40 = $2,550.
- Costs: $200 + 7.5 × $40 = $500.
- **Profit: $2,050.**

### Listing B — 75%, 20% monthly discount

The risk is that a long-stay guest displaces existing short-stay demand. In 75%-occupancy markets the calendar is half-full of would-have-bookeds. Say the discount converts one 28-night stay that displaces 4 of the existing 3-night stays you'd have closed at full price.

- New: 28 nights at $80 + $40 cleaning = $2,280.
- Lost: 4 × ($300 + $40 cleaning) = $1,360.
- Plus the 2 unaffected short stays: $680.
- Revenue: $2,960 vs $2,550 baseline. **+$410.**
- Costs: $200 + 3 × $40 = $320 (one long stay + two short).
- Profit: $2,640. **+$590.**

Less impressive than Listing A. And this is the optimistic case: it assumed the long-stay guest was *additional*, not a substitution. If 100% of the long-stay demand is substitution, profit drops below the no-discount baseline.

### Listing C — 90% occupancy, no discount

- 9 stays of 3 nights = 27 nights.
- Revenue: 27 × $100 + 9 × $40 = $3,060.
- Costs: $200 + 9 × $40 = $560.
- **Profit: $2,500.**

### Listing C — 90%, 20% monthly discount

At 90% occupancy you have almost no empty nights. Every long-stay booking displaces something you would have closed anyway. Best case the discount converts one 28-night guest who *would not* have come otherwise — but at 90% your nights are already mostly full of buyers.

- New 28-night stay displaces 7 short stays (you can only run 30 nights total): 28 × $80 + $40 = $2,280.
- Plus the 0–1 short stays squeezed in: $0 to $340.
- Revenue: $2,280–$2,620 vs $3,060 baseline. **−$440 to −$780.**
- Profit: drops 17–31%.

At high occupancy the discount is just a pay cut. Airbnb's default suggestion does not know your occupancy. It is the same number for the empty-week host and the booked-solid host.

## The breakeven you can run on a napkin

For a 28-night guest at a flat 20% discount:

- Discount cost: 28 × ($100 − $80) = **$560 per long stay**.
- You'd need to win one *additional* long stay above the baseline you would have without the discount to break even, **and** the booking must not displace short stays whose total revenue is also $560+.

Short stays at $300 each gross $1,200 over 4 stays. So a long stay that displaces 4 of them is a money loser even after winning the new long stay. The discount has to be big enough to win net-new demand, which means:

- Below ~65% occupancy: most long-stay bookings are net-new. **Discount likely pays.**
- 65–80%: depends on the share of empty nights. **Run for one quarter, then re-evaluate.**
- 80%+: long-stay bookings displace existing demand. **Discount is dead weight.**

The rule of thumb: the discount has to *cause* a booking that would not have otherwise existed at the same total revenue. Airbnb's suggestion is built on the median listing, which sits around 60–70% occupancy. Above the median you are subsidising guests Airbnb's algorithm assumed were never going to book.

## Cleaning fees, turnover wear, and other reasons longer is better anyway

Long stays look profitable for reasons that have nothing to do with the discount.

- **Cleaning is a fixed cost per stay**, not per night. A 28-night stay has one cleaning. Fourteen 2-night stays have fourteen. At $40 each, that is a $520 cleaning-fee swing in your favour before any discount math.
- **Turnover wear** (linens, mattress, paint, the inevitable small breakages) scales with the number of guests through the door, not nights. Long stays mean fewer suitcases bumping doorframes.
- **Communication overhead** is roughly fixed per booking. Each new guest needs check-in instructions, ID requests, post-stay messages.

This means even at a 20% nightly discount, a long stay is **structurally** more profitable than the same number of nights split into short stays. The catch: this is true at *zero* discount too. It is the long stay that earns the margin, not the discount that wins it. The discount only earns ground when it changes who books, and not by very much.

## The actual rule for setting your number

After running both options across two listings for fourteen months, here is the rule that beat Airbnb's defaults on both:

1. **Start at 5% weekly and 10% monthly**, not Airbnb's 10/20. These are small enough to not hurt and large enough to show in search filters that sort by total price.
2. **Track three numbers per quarter**: 7-night-plus stays, 28-night-plus stays, and total occupancy. Compare against the same quarter last year if you have it.
3. **Raise the discount only if** 28-day stays grew by more than the discount cost. Concretely: a 10% monthly discount needs about +12% lift in long stays vs the previous quarter. If you do not hit that, the discount is not earning its keep — drop back.
4. **Ratchet down at 80%+ occupancy.** If you are nearly full, you are leaving money on the table on every long stay. Cut the discount in half and watch the long-stay rate. If it does not change, you found money.

For more on the operational side of long stays — back-to-back cleanings, mid-stay turnover, longer stays as a cleaner-management tool — see [setting cleaning buffer days](/blog/cleaning-buffer-days).

## A note on Booking.com

Booking.com's UI does not show a "monthly discount" field at all — what it shows is a **length-of-stay rate plan**. Practically the same lever, very different framing. Booking lets you set a rate plan for "7+ nights" and "28+ nights" with a different nightly rate per plan. The upside: the headline price in search results stays at full rate (good for click-through), and the discount only fires once a guest is on the price-detail page. The downside: most hosts forget the rate plan exists and never set one.

If you list on both, set the same effective discount on both. Asymmetric discounts cost you on whichever platform has the higher nightly: a smart guest will check both, see the gap, and book the cheaper one. Internal price arbitrage between your own listings is the worst kind of leakage.

If you do not have a calendar manager in front of both yet, [the free iCal sync setup](/blog/airbnb-booking-calendar-sync-free) is the prerequisite.

## FAQ

**What is the actual default weekly and monthly discount Airbnb suggests in 2026?**
Airbnb's default Smart Pricing suggestion in the host dashboard is a **10% weekly discount** for 7-night-plus stays and a **20% monthly discount** for 28-night-plus stays. The exact numbers can vary by market. They are presented as "pricing tips" and you can accept them with one click — which is most hosts' first introduction to the discount system.

**Should I offer a weekly discount at all if I have low occupancy?**
A small one (5–7%) helps you appear in Airbnb's price-sorted searches even when your listing is not naturally a weekly-priced one. It is closer to a marketing cost than a real margin cut. The math on a 5% weekly discount almost always pays back at sub-70% occupancy.

**What about Booking.com Genius — does that interact with my length-of-stay discount?**
Yes, and it stacks. A 10% Genius discount on top of a 20% monthly rate plan gives a 28% effective discount, not 30%. Booking.com applies them multiplicatively. If you opted into Genius before setting up rate plans, double-check the effective price on a sample booking before publishing the new plan.

**Does a long-stay discount change my Airbnb search ranking?**
Indirectly. Airbnb's ranking weighs total stay price for queries that filter by length, so a discount-applied total can outrank a no-discount listing for the same dates. For short queries (under 7 nights) the discount has zero ranking effect. The bigger ranking lever for length is your minimum-stay setting, not the discount.

**Can I set the discount per season?**
Airbnb's UI exposes one global weekly and monthly discount per listing — not per season. Workarounds: set custom prices for specific date ranges instead, or use a third-party pricing tool (PriceLabs, DPGO) that overrides the global discount with date-specific overrides. Booking.com rate plans can be season-bound natively.

**My competitors all show 30% monthly discounts. Should I match?**
Probably not. The 30% headline discount is usually being applied on top of a higher nightly rate the host raised for exactly that purpose. Compare *effective* nightly rates after the discount, not the headline discount percentage. Half the hosts running 30% off are netting a higher effective rate than a host showing 10% off a more honest baseline.

**How long should I run a new discount before judging it?**
Two months for the booking-window data to populate. Airbnb's median search-to-booking lead time is about 21 days; Booking.com's is closer to 7. A 30-day evaluation window misses the long-stay segment you are trying to influence.

**Does this all change if I run a hotel-style fixed-rate listing on Booking?**
Yes. Hotel-style listings on Booking.com use a "Fully Flexible Rate" plan that charges per night and ignores length-of-stay rate plans. If you signed up as "Hotel" rather than "Vacation rental", the rate-plan UI may not be exposed to you at all. Contact partner support; the property type can usually be flipped without re-listing.

## One opinionated take

The single most expensive habit I had as a new host was clicking "accept" on Airbnb's default discount suggestions. They are not wrong on average — they are wrong on *my listing*, because my listing is not average. Yours is not either.

If you do nothing else with this post: open your Airbnb host dashboard, find your length-of-stay discounts, and at least look at the number. If it is 20% on a listing that runs above 80% occupancy, you are subsidising guests who would have booked anyway. The discount is a tool, not a default. Set it from your data, or [pick something simple to manage your data with](/onboard) — but stop letting Airbnb pick it for you.
