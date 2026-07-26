---
slug: seasonal-pricing-short-term-rental-math
locale: en
title: "Seasonal pricing math: turn your booking history into a rate ladder"
excerpt: "Most hosts charge one rate all year. Build a seasonality index from your own occupancy, turn it into monthly rate multipliers, and stop leaking margin."
status: published
tags:
  - pricing:Pricing
  - host-tips:Host tips
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/seasonal-pricing-short-term-rental-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

My first full year hosting, I charged $110 a night for a city one-bedroom and never touched the number once. It felt disciplined. In July the calendar sold out by late April — every night gone, at $110, ninety days before anyone arrives. I told myself that was a good problem. It wasn't. A place that sells out three months early isn't popular; it's mispriced. The comparable unit two doors down was on $155 that July and also sold out. That's roughly $1,300 I handed to summer travellers who would have paid more, in a single month, because I was proud of a rate I'd picked in January.

## TL;DR

- A flat year-round rate is the most expensive pricing mistake hosts make.
- **Seasonality index** = each month's demand ÷ your annual average demand.
- Measure demand by occupancy at a held rate, not ADR — ADR is circular.
- Selling out 60+ days early isn't a win; it means you underpriced peak.
- Base rate = anchor × index, corrected by the sell-out test; rebuild yearly.
- The trough discount is a wash; the peak markup is the real money.

## Why a flat rate is the most expensive habit in hosting

A single nightly rate held all year leaks money at both ends of the calendar, and the two leaks are not the same size.

The low-season leak is the obvious one: in February your $110 sits at 48% occupancy when $85 might have filled 65% of the month. That feels like the expensive mistake because you can see the empty nights.

The peak leak is invisible, which is exactly why it's bigger. In July your $110 sold out — 96% occupancy, a calendar you were happy about — while the market would have carried $150 with barely a dent in occupancy. Nothing looks wrong. There are no empty nights to stare at. But every one of those 29 nights sold for $40 less than a guest was willing to pay, and you'll never see the counterfactual because sold-out calendars don't show you the demand you turned away.

Here's the rule that reframes the whole problem: **if your peak months sell out well before your normal booking window, you are underpricing them.** A city one-bedroom with a [median booking lead time](/blog/booking-lead-time-short-term-rental) of about two weeks should not have July fully booked in April. When it does, the calendar is telling you the rate is too low, in the only language a calendar has.

## What "seasonality" actually measures — and the metric to use

Seasonality is demand that moves with the calendar: the same apartment is worth more in July than in February because more people want it in July, full stop. The trick is measuring that demand without letting price contaminate the measurement.

The instinct is to use ADR — average daily rate — per month. Don't. ADR is circular: it's partly a function of the price *you* set, so if you charged more in July, July's ADR is high because you made it high, not because demand was high. You'd be reading your own decision back to yourself as if it were data.

Use **occupancy at a roughly held rate** instead. If you charged something close to $110 all year, then each month's occupancy is a clean read on how much the market wanted your place that month, with price held constant. That's the signal. Booking pace — how many days ahead each month fills — is a useful second read, and it matters most exactly where occupancy fails you, which is the next trap.

**The censoring trap.** Occupancy caps at 100%. A month that sells out reads as "100% demand" whether true demand was 101% or 180%. So occupancy *understates* your strongest months — the ones that sold out can't show you how far past full they'd have gone. That's why the sell-out test exists: for any month that clears ~90% or fills far ahead of your median lead time, treat the occupancy-derived multiplier as a floor, not an answer, and push the rate up until the month stops selling out 60+ days early.

## Build your seasonality index in one table

The index is one division. Take each month's occupancy (held near a constant rate), divide by your annual average occupancy, and you get a multiplier centered on 1.00. Here's a real-shaped city one-bedroom that averages 70% occupancy across the year:

| Month | Occupancy at held rate | Seasonality index |
|---|---|---|
| January | 45% | 0.64 |
| February | 48% | 0.69 |
| March | 58% | 0.83 |
| April | 68% | 0.97 |
| May | 78% | 1.11 |
| June | 88% | 1.26 |
| July | 96% | 1.37 |
| August | 95% | 1.36 |
| September | 82% | 1.17 |
| October | 70% | 1.00 |
| November | 55% | 0.79 |
| December | 62% | 0.89 |

Read July and August with the censoring trap in mind. They index at 1.37 and 1.36, but both sat above 95% occupancy — they hit the ceiling. Their true index is higher than the table can show; the number is a floor. October indexes at exactly 1.00, which makes it a clean anchor month: whatever rate holds October at a healthy occupancy is your ×1.00 reference.

To build yours, pull twelve months of reservations and count booked nights per month. The one prerequisite is that every booking lives in one place — if your nights are scattered across an Airbnb dashboard, a Booking.com extranet, and a Vrbo login, you can't count them cleanly. [Merging every reservation into one calendar](/onboard) turns this into a five-minute count instead of a three-tab reconciliation.

## Turn the index into a rate ladder

Pick an **anchor rate** — the single number you'd charge if forced to pick one, or your current flat rate. Multiply it by each month's index. That gives you a first-draft ladder. Then apply two corrections: the sell-out push at the top, and a cost floor at the bottom.

Anchoring at $110, the raw ladder and the corrected one:

| Month | Index | Raw (anchor × index) | Corrected base rate |
|---|---|---|---|
| January | 0.64 | $70 | $75 |
| February | 0.69 | $76 | $80 |
| March | 0.83 | $91 | $91 |
| April | 0.97 | $107 | $107 |
| May | 1.11 | $122 | $122 |
| June | 1.26 | $139 | $139 |
| July | 1.37 | $151 | $160 |
| August | 1.36 | $150 | $158 |
| September | 1.17 | $129 | $129 |
| October | 1.00 | $110 | $110 |
| November | 0.79 | $87 | $87 |
| December | 0.89 | $98 | $98 |

July and August got pushed above the raw number because they were censored — the raw $151 came from a capped occupancy, so I nudged them to $160 and $158 and will keep nudging next year if they still sell out early. January and February got floored: the raw math wanted $70 and $76, and I set $75 and $80 because that's near the point where a discount stops buying enough extra occupancy to matter.

**The cost floor.** Never let a low-season rate drop below the marginal cost of an occupied night — the cleaning share, [consumables](/blog/consumables-cost-per-stay-math), and the [utility delta](/blog/utility-cost-short-term-rental-math) a guest actually adds, usually $30–60. Below that line, an occupied night loses money and you're better off empty. The floor almost never binds in a normal market, but it's the guard rail that stops a naive index from pricing you into a loss during a dead January.

This base rate is the *seasonal* layer. Your weekend premium sits on top of it, per month — a [Friday/Saturday surcharge](/blog/weekend-pricing-premium-math) computed against July's $160 base, not against a frozen annual number. Stack the two; don't average them.

## The compression nights the index misses

The index is a monthly baseline. It's smooth by construction, and real demand isn't — a single conference, a music festival, a graduation weekend, or a public holiday can spike one date to double the month's rate while the rest of the month behaves normally.

Those are **compression nights**, and they need a daily override on top of the seasonal base, not a change to the month's index. If your city hosts a 40,000-person conference the second week of September, that week might carry 2× to 2.5× your September base of $129 — call it $260 to $320 — while the rest of September stays at $129. Fold that spike into the monthly index and you'd overprice the other three weeks and still underprice the event.

The practical split: the seasonality index sets your rate for a normal week in each month; a short list of known local events sets daily overrides. Keep a calendar of the ten or fifteen dates a year that compress your market — most hosts can name them from memory once they think about it — and price those individually. Everything else runs on the ladder.

## Where flat-rate hosts leak the most

Run the two leaks side by side and the surprise is which one matters.

**Peak, underpriced.** July, 30 rentable nights, sold 29 at $110 = $3,190 — and it sold out in April, 90 days before a two-week-median market should fill. Raise the base to $150. Even if occupancy slips from 96% to 90% — 27 nights — that's $4,050. You made **$860 more from one month** and stopped selling out a quarter ahead. Across a three-month summer, that's roughly $2,400 you were leaving on the table every year, invisibly, while feeling good about your sold-out calendar.

**Trough, overpriced.** February, 28 nights, 48% occupancy at $110 = about $1,540 (13 nights). Drop to $85 and lift occupancy to 65% — 18 nights — and you get $1,530. Essentially a wash on revenue. The discount didn't make you money; it moved five empty nights into occupied ones at a lower rate, and the two effects cancel.

So why bother discounting the trough at all? Because those five extra occupied nights are worth something the revenue line doesn't show: more [reviews per year](/blog/airbnb-rating-recovery-math), better Superhost stats, more recent-activity signal to the ranking algorithm, and each night still clears the ~$45 marginal cost. But make no mistake about where the money is. **The low-season discount is a wash you take for the reviews. The peak markup is the actual revenue.** Hosts spend their energy agonising over the February discount and never touch the July rate they should be raising.

## Don't borrow someone else's seasonality

Airbnb's Smart Pricing and third-party tools like PriceLabs or Wheelhouse all apply seasonality — but it's *market* seasonality, aggregated across your whole city or region. That's a fine starting point in your first year, when you have no history of your own. It's wrong the moment your micro-market diverges from the city average, and micro-markets always diverge.

A unit near a university peaks in August and September on move-in and family-visit weekends, then again at graduation — a curve nothing like the beach-driven summer peak the citywide model assumes. A ski-adjacent apartment inverts the whole thing: February is your July. A place near a hospital or a big employer may barely have a season at all, running flat at 75% because its demand is medical stays and business travel, not tourism. A citywide seasonality model averages all of these into a mush that fits none of them.

The [dynamic pricing tools](/blog/dynamic-pricing-short-term-rental) are worth using — for the daily last-minute adjustments and the compression-night detection they genuinely do well. But the monthly base should be *your* index, built from *your* twelve months, overriding whatever the tool's market curve suggests. Set the tool's seasonal profile by hand from your table; don't let it guess. In year one, borrow the market curve. By year two, you have the only data that actually describes your listing, and you should be pricing off it.

## FAQ

**How do I set seasonal prices on Airbnb?**
Airbnb lets you set custom nightly prices for date ranges directly in the calendar — select a block of dates, set the price, repeat per month using your rate ladder. If you use Smart Pricing, set a per-month minimum price so the algorithm can't drop you below your seasonal floor, since Smart Pricing left alone will happily undercut your peak. The cleanest approach is to set your twelve monthly base rates once at the start of the year, then only touch individual dates for events.

**What months are high season for short-term rentals?**
There's no universal answer — it's entirely local. Beach and lake markets peak in summer; ski markets peak in winter; city markets often have a spring and autumn shoulder peak plus event spikes; university-adjacent units peak at move-in and graduation. The only way to know yours is to hold your rate roughly constant for a year and read the monthly occupancy. Don't assume your curve matches the city average.

**Should I use occupancy or ADR to measure seasonality?**
Occupancy, measured at a roughly held rate. ADR is circular because it partly reflects the prices you chose, so a high-ADR month might just be a month you priced high, not a month with high demand. Occupancy at a constant rate isolates demand. The one exception: for months that sell out, occupancy caps at 100% and understates them, so use how early they sold out as the additional signal.

**How much more should peak cost than low season?**
Whatever stops the extremes from misbehaving — there's no fixed ratio. A common spread lands somewhere between 1.5× and 2.5× from trough to peak, but that's an outcome, not a target. Peak is priced correctly when it no longer sells out far ahead of your normal booking window; low season is priced correctly when it's near the point where a further discount stops buying meaningful occupancy. Let those two tests set the spread.

**Does Airbnb Smart Pricing handle seasonality?**
Partly. It applies market-level seasonality and reacts to demand, but it uses your whole city's curve, not your specific micro-market, and it doesn't know your cost floor. Left unsupervised it tends to underprice your true peak and can drop below break-even in your trough. Use it if you like, but set per-month minimum and maximum prices from your own index so it operates inside your ladder rather than replacing it.

**How often should I update my seasonal prices?**
Rebuild the twelve-month index once a year from the trailing twelve months of bookings. Within the year, you don't touch the monthly base rates unless a month is clearly misbehaving against the sell-out test — leave them alone. Compression nights and last-minute gaps get handled separately, as daily overrides, not by moving the whole month.

**Is seasonal pricing worth it for a single listing?**
Yes — arguably it matters more with one listing, because you have no portfolio to average out a mispriced peak. Seasonality is the single largest pricing lever most small hosts have and the one they most often ignore, precisely because a flat rate requires no decisions. One evening building the index typically pays for itself in the first peak month.

**How do I price the shoulder season?**
The index handles it automatically — shoulder months like April and September land near 1.00 and get roughly your anchor rate. The mistake in shoulder season isn't the base rate, it's the minimum stay: shoulder demand is patchier, so a rigid three-night minimum strands more single nights than it does in peak. Relax the minimum in shoulder months and let the ladder carry the price.

## One opinionated take

The weekend premium gets all the attention in host forums, and it's worth maybe a few percent a year. Seasonality is worth several times that, and hosts ignore it because a rate ladder doesn't give you the daily dopamine of watching a pricing tool nudge tonight's number. It's boring. You set twelve rates in an evening, override a dozen event dates, and leave it alone until next January. That's the whole system. The single most profitable hour you'll spend on pricing this year is the one where you build the index and finally raise the peak you've been quietly selling out three months early.
