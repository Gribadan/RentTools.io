---
slug: dynamic-pricing-short-term-rental
locale: en
title: "Dynamic pricing for short-term rentals: PriceLabs, Wheelhouse, Beyond"
excerpt: A worked comparison of PriceLabs, Wheelhouse, and Beyond Pricing for short-term rental hosts — fees, lift, break-even at 1, 3, and 8 listings, and the three settings that decide whether the tool earns its keep.
status: published
tags:
  - host-tips:Host tips
  - pricing:Pricing
  - tools:Tools
  - automation:Automation
ogImageUrl: /blog-covers/dynamic-pricing-short-term-rental.webp
ogImageWidth: 1600
ogImageHeight: 900
---

The first time I let a dynamic pricing tool drive my calendar, it cut my Friday rate by $34 the day before a sold-out football match three blocks away. The tool was looking at city-wide pickup, my listing's historical price, and an "occupancy targeting" slider I had left at the default. It was not looking at the schedule of the stadium 400 metres from my front door. I caught it at lunch, overrode the price back up by $58, and the room still booked at 21:14 that evening. The lift the tool had quietly given me on the previous eleven days more than paid back the one mistake — but the mistake is the post. Dynamic pricing is not "set and forget." It is a calculator that needs three settings right and one human eye per week.

This is a worked comparison of the three tools most independent hosts actually weigh — PriceLabs, Wheelhouse, and Beyond — with real cost math at 1, 3, and 8 listings, the break-even lift each one needs to deliver, the settings that decide whether you keep it after month two, and a per-portfolio rule that beats "everyone should use a tool" and "spreadsheet is enough."

## TL;DR

- Dynamic pricing tools cost **$15–$40 per listing per month** (or 1% of revenue) — the break-even is roughly a **0.5–1% revenue lift**, which is below what every credible study reports.
- **PriceLabs** is the operator's tool — granular controls, $19.99/listing flat, drops to ~$10 at 30+ listings. Best for hosts who want to tune.
- **Beyond Pricing** is the "leave it alone" tool — 1% of booked revenue, decent defaults, weak granularity. Best for owners who don't want to log in weekly.
- **Wheelhouse** sits between them — 1% of revenue or a flat tier; UI is the cleanest, customisation lighter than PriceLabs.
- The settings that move the needle are **base price**, **minimum price**, and **occupancy curve** — not the brand. A misconfigured PriceLabs loses money. A well-tuned Beyond beats both.
- Below **2 listings**, a $20/month flat fee + a manual events calendar usually beats DIY only if your time costs $0; above **5 listings**, any of the three pays back several times over.
- Every tool needs a **human eye on the weekly calendar** — none of them know about the stadium, the marathon, the local conference, or the school holiday in the country the inbound flight starts from.

## What the tools actually do

Strip the marketing and the three platforms do the same five things, with different weighting:

1. **Pull market pickup data** for your zip / postcode (how fast other listings are selling for upcoming dates).
2. **Estimate your listing's competitive position** against a peer set the tool builds automatically (1–3 bed, similar amenities, same neighbourhood).
3. **Adjust your nightly rate** up or down from a base price, day by day, according to days-to-arrival and seat-of-pants demand signals.
4. **Push the price** to Airbnb, Booking.com, Vrbo, or a channel manager every few hours.
5. **Surface override rails** — minimum price, maximum price, day-of-week multipliers, last-minute discount curve, length-of-stay multipliers — so you can stop the model from doing something stupid on a date you know more about than it does.

The differences:

| Capability | PriceLabs | Wheelhouse | Beyond |
| --- | --- | --- | --- |
| Pricing model | Flat $19.99/listing/mo (drops at scale) | 1% of booked revenue or flat tier | 1% of booked revenue |
| Min-night rules per day-of-week | Yes, granular | Yes | Limited |
| LOS multipliers (custom curves) | Yes, full custom | Yes | Default curve only |
| Last-minute discount curve | Custom per listing | Custom | Preset, three options |
| Override calendar (mass edits) | Yes | Yes | Yes |
| Market dashboards (free tier) | Yes — useful even without subscription | No | No |
| Hospitable / Hostaway / Smoobu integration | Yes | Yes | Yes |
| Free trial | 30 days | 30 days | 30 days |
| Cancel by | Email any time | Email any time | Email any time |

Beyond has a notable weak spot for hosts running studio apartments in dense city markets: its peer set tends to anchor too high on one-bed units in the same building, which drags the model's "fair price" estimate up and quietly costs you fill rate. PriceLabs lets you exclude listings from the peer set; Wheelhouse lets you bias the comparison; Beyond does not surface this control to the customer.

## The fee math at 1, 3, and 8 listings

Assume a baseline listing at **$120 ADR**, **70% occupancy**, **30 nights × 0.70 = 21 booked nights/month**, **$2,520/month revenue**. Real numbers from a Lisbon studio I ran in 2024, rounded.

| Listings | Monthly revenue | PriceLabs ($19.99/listing) | Wheelhouse (1%) | Beyond (1%) |
| --- | --- | --- | --- | --- |
| 1 | $2,520 | $20 | $25 | $25 |
| 3 | $7,560 | $60 | $76 | $76 |
| 8 | $20,160 | $160 | $202 | $202 |
| 15 | $37,800 | $300 (~$15/listing tier) | $378 | $378 |
| 30 | $75,600 | $300 (~$10/listing tier) | $756 | $756 |

At one listing, the difference is $5/month — noise. At 8 listings, it is $42/month — $504/year, enough to matter. At 30 listings, PriceLabs is $456/month cheaper than the percentage models. The percentage-of-revenue plans hurt portfolio scale, which is exactly the segment that uses them most. Wheelhouse and Beyond will quote you a flat tier on portfolios of 20+ — ask for it; the public 1% price is the rack rate.

## Break-even lift: how much revenue does the tool need to earn back?

The honest question is not "does the tool make me money," it is "does it make me more money than I would have made running a sensible base price and a weekly manual review?"

A tool that costs **$20/month on a $2,520/month listing** needs to add **0.79% to gross revenue** to break even at the subscription line — about **$20 of extra bookings per month**, or **one extra booked weekend night per quarter** at a $60 weekend bump.

A tool that costs **1% of revenue** breaks even at exactly the lift it produces vs. the no-tool baseline. So if the tool lifts revenue by 1%, the host nets zero. The tool has to credibly lift revenue by **more than 1%** to be worth the fee at all — and the lift has to be vs. a real comparator (manual + Airbnb Smart Pricing turned off), not vs. an empty calendar.

Vendor studies report 10–40% lift. Independent analysis (host forum threads, the AirDNA quarterly markets reports, a 2024 PriceLabs vs. control study by Rentals United on 200 listings) puts the realistic figure at **5–15%** for a host moving from manual to dynamic, and **2–6%** for a host moving from one tool to another. Headline numbers above 20% are usually comparing tool-on against Airbnb-Smart-Pricing-on, which is a much worse baseline than "any sensible manual schedule."

At a realistic 8% lift on $2,520/month, that is **$202/month of new revenue**. Subtract $20 PriceLabs fee → **$182/month net**. Subtract 1% Beyond fee → **$177/month net**. The fee model barely matters at this lift; the lift matters enormously.

If the tool produces a 2% lift (because your base price was already close to right and the model only catches a few peak dates), the same listing nets $30/month net of PriceLabs and $25 net of Beyond. Still positive, much closer to noise. Below 1% lift, the percentage-fee tools turn negative.

## The three settings that decide if the tool earns its keep

I have seen hosts run PriceLabs for six months, conclude "it doesn't work," and cancel — when the actual problem was that the base price was set 20% too low and the minimum price was set 30% too low. The model was doing exactly what it was told. The defaults are what kill the math.

### 1. Base price

The base price is what the model uses as its anchor for "average demand on an average day." Every adjustment goes up or down from there. Set it 10% too low and every dollar the model adds back is just clawing its way to where you would have priced manually.

Right value: **the highest nightly rate at which your listing fills at 70% occupancy across the last 90 days, excluding peak weekends and events.** Not the average — the upper end of the steady-state range. A studio that booked at $115, $118, $122, $125, $128 on five non-peak Tuesdays has a base price of $128, not $122. The model will discount aggressively from $128 on slow Mondays. It cannot mark up high enough from $122 on busy Saturdays.

### 2. Minimum price

The floor below which the tool refuses to drop, no matter how empty the calendar. PriceLabs and Wheelhouse default to **65–70% of base price**. Beyond defaults closer to **60%**. The floor exists to stop the tool from selling a room at $40 on a Tuesday when your cleaner costs $35 per turnover.

Right value: **cleaning fee + utilities + variable cost per night**, marked up 25%. For most urban studios, that is $50–$70/night. Hosts who set it at $80–$90 watch the calendar sit empty in shoulder season because the floor blocks the algorithm from picking up demand at $70–$78.

### 3. Occupancy curve / target

This is the dial that decides how aggressively the tool discounts as the date gets closer. "Push for high occupancy" tells it to drop fast in the last 14 days. "Push for high ADR" tells it to hold prices and accept lower fill.

For independent hosts on 1–5 listings, the right setting is almost always **middle-of-the-road** — neither aggressive discount nor stubborn ADR. Aggressive occupancy is right for new listings that need review velocity. Stubborn ADR is right for mature listings with strong direct booking pipelines. Most listings sit in the middle.

The trap: every tool ships its onboarding flow with "high occupancy" pre-selected because the case study a sales person tells is "we filled an empty calendar." If your calendar is not empty, change it on day one.

## Where each tool wins

**PriceLabs** wins for hosts who treat the listing as a workflow. The granular controls let you tell the model that this property has a 7-night minimum from June 15 to September 1, that Sundays are the right day for a 3-night minimum, that LOS discounts step at 7-21-28-90 days because that is how your repeat business clusters. It also has a free market dashboard at [pricelabs.co/markets](https://hello.pricelabs.co/) that is worth the visit even if you never subscribe — the city-level ADR + occupancy snapshot is the second best piece of free data on the market after Airbnb's own dashboard.

**Beyond** wins for absentee owners and host families. You set the base price, choose one of three "strategies," and Beyond will produce something defensible. It will not optimise the way PriceLabs can, but it will not blow up either. For a vacation home that produces 8 weeks of bookings a year, the marginal lift over manual rarely justifies the time PriceLabs asks. Beyond is the right pick.

**Wheelhouse** wins for hosts who want the cleanest UI and are willing to pay the percentage fee. It is the easiest of the three to teach a part-time co-host. The customisation sits between PriceLabs and Beyond — enough to fix a peer set, not enough to do per-property LOS curves. At 3–10 listings, it is often the right call.

## The cases where the tool loses to a spreadsheet

There are three scenarios where I have stopped paying for a dynamic pricing tool, and a sensible manual schedule beat the model:

- **A single listing in a saturated market.** When the market is so thick (Lisbon centre in October) that every comparable listing fills regardless of price, the lift the tool produces is zero — the listing fills at $100 or $130 alike. Set the price manually, watch pickup weekly.
- **A new listing without reviews.** The model has no idea your listing has a $130 fair price; it sees a no-review unit and prices it at $80–$90. Until you have 8–10 reviews, manual + an "introductory rate" framing in the description beats the tool.
- **A long-stay listing.** If 70%+ of nights are 14+ day stays, the daily-rate model is just noise — the tool spends a lot of compute optimising the 30% of nights that swing for $5. Use the corporate-rate machinery on Booking.com and skip the dynamic tool entirely.

Outside those three, by the time you have 3 listings actively booked, a dynamic pricing tool's break-even is so low (<1%) that the question is which one, not whether.

## What I run today

Three listings in Lisbon + Tashkent, on PriceLabs at $19.99 each. I look at the calendar once a week — usually Tuesday evening — for ten minutes. I override the model on dates I know better than it does (local conference, marathon, school holiday in inbound markets) and let it run the rest. I lifted base price by 8% in March 2026 after eighteen straight weeks of >85% occupancy; the model immediately recalibrated and the next two weeks booked at the higher rate without a dip in fill. The fee is $720/year. The lift, measured against my manual baseline from 2023, is 11–12%, which on $30,000/year per listing is more than $3,500/year of new revenue per listing. The fee is rounding error.

If RentTools is your starting point for keeping calendars in sync across platforms, dynamic pricing is the next logical layer once you have steady bookings — [start with the calendar sync](/onboard) and add a pricing tool when you have 90 days of clean booking history to feed it.

## FAQ

**Does Airbnb's own Smart Pricing work as a dynamic pricing tool?**

No. Airbnb Smart Pricing is a market-floor tool — it tells you what other comparable listings cost and pushes you toward the lower end of the range. In my own listings it has consistently priced 15–25% below the rate I could have charged manually. It is the right tool for a host trying to hit hard occupancy targets at any price; it is the wrong tool for revenue. Turn it off, and either price manually or run a real dynamic pricing tool on top.

**How long does the trial need to be before I can tell if the tool is working?**

A minimum of 60 days, with a clean base price set on day one. The first 30 days of any dynamic pricing trial reflect the migration from your old prices to the model's view of fair price — bookings made before the model took over are not the model's. Compare the 60–90 day window after the model is steady against the same season in the prior year. A 4–8% lift in that window is a good outcome at low effort.

**Is the 1% Wheelhouse / Beyond fee on gross revenue or on the lift?**

On gross revenue. The tool charges 1% of every booking it touches, not 1% of the increment over what you would have charged manually. This is why percentage-fee tools get expensive at scale — at $75,000/month of revenue, you pay $750/month whether the tool lifted you 12% or 2%. PriceLabs's flat-fee model is the more honest pricing for hosts with strong revenue but moderate lift.

**Can I run two tools at once?**

No. The platforms will fight each other — one pushes a price to Airbnb, the other pushes a different price four hours later, and you spend the month with a calendar that looks like a strobe light. Some hosts use PriceLabs for the analytics dashboard and Beyond for the actual pricing — that works, because only one is writing to the calendar. Two write-permission tools at once is a guarantee of overbooking errors.

**What happens to my prices if I cancel?**

The price on Airbnb / Booking.com freezes at whatever the tool last pushed. The platforms do not "remember" your manual prices from six months ago. Before cancelling, set every date in the next 90 days to a sensible manual rate inside your platform UI, then cancel the tool. Otherwise you wake up to a six-month stretch of $80 weekends because the tool's last push happened during a slow Tuesday.

**Does the tool work with Booking.com Genius pricing?**

Yes, with caveats. The tool sees the price you set as the base; Booking.com applies the Genius discount (10% for Genius 1, 15% for Genius 2) on top. If your tool is pricing at $120 expecting a $120 booking, a Genius 2 guest pays $102 and you get $86 after Booking.com's commission. Some tools (PriceLabs) let you back-out the Genius discount in the price calculation; others (Beyond) do not. Set this up consciously, not by accident — covered in more depth in [the Booking.com Genius levels math post](/blog/booking-com-genius-levels-math).

**Will the tool work for a listing that is the only one in a small village?**

Marginally. The model needs a peer set of 8+ similar listings within a reasonable radius to produce a defensible market signal. In a small village with one or two competitors, the tool falls back on city-level data, which is usually wrong. Manual pricing with a seasonal calendar (high / shoulder / low) and event-day overrides will beat any of the three tools in that scenario. The tool re-enters the picture if you cross 3 properties yourself.

## One opinionated take

The tools are commoditised. PriceLabs, Wheelhouse, and Beyond are within 80% of each other on lift; the 20% that differs is overwhelmingly about which model fits the *host's* workflow, not which is "smarter." The host who logs in weekly and tunes is going to beat the host who paid for the more expensive tool and never opened the dashboard. Pick the cheapest tool whose UI you will actually use, set the three settings right on day one, and put a Tuesday-evening review on the calendar before you cancel the trial.
