---
slug: utility-cost-short-term-rental-math
locale: en
title: "Utility cost per night for short-term rentals: a worked breakdown"
excerpt: What electricity, heat, water, and internet really cost per booked night — a per-night breakdown across three seasons, and why a guest's open-window AC habit blows the model up.
status: published
tags:
  - host-tips:Host tips
  - pricing:Pricing
ogImageUrl: /blog-covers/utility-cost-short-term-rental-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

In July my electric bill for a one-bedroom jumped 40% over the same month a year earlier, and occupancy was flat. I drove over expecting a failing AC unit. What I found was the air-conditioning set to 18°C and the balcony door wedged open with a chair, because the guests liked the breeze *and* the cold. They weren't being malicious. They were doing exactly what anyone does in a room where the electricity is free — and to them, it was. That month cost me an extra $46 on one listing, and it's the single clearest picture I have of why utilities are the operating line hosts model worst.

Most hosts take the annual utility bill, divide by twelve, and file it under "fixed costs" — a number that has nothing to do with any individual booking. It isn't fixed. A large slice of it moves with occupancy and, worse, with guest behaviour you don't control. This post is the per-night math: what each utility actually costs you per occupied night, which part is fixed and which is variable, and where the money quietly leaks.

## TL;DR

- Utilities run **$5–10 per occupied night** for a 1BR — most hosts never attribute it per booking.
- It's a **hybrid cost**: internet is fixed per night; HVAC and water scale with occupancy.
- The **guest-behaviour tax** is real — a guest pays no bill, so they don't conserve.
- HVAC is the swing line: summer AC and winter heat can **double** the per-night number.
- Internet looks cheap until occupancy drops — a fixed $45/mo costs more per *booked* night.
- Annualized, a single 1BR runs **~$1,500–1,800/year** in utilities; three listings, ~$4,800.
- A $120 smart thermostat with guest setpoint limits often pays back in one summer.

## Why utilities are a hybrid cost, not a fixed one

The reason utilities get mis-modeled is that the bill arrives monthly, looks roughly steady, and gets treated like rent — a flat number you pay regardless. Split it into its parts and that illusion falls apart, because the bill is actually three different kinds of cost wearing one envelope.

**Pure fixed.** Internet, any standing connection charge on electricity or gas, and a flat refuse fee don't care whether the unit is full or empty. You pay the same $45 for fibre in a month you booked 25 nights and a month you booked 5. This part really is fixed — but only per *calendar* night. Per *booked* night, it gets more expensive the emptier you are, which is the opposite of how hosts intuit it.

**Variable with occupancy.** Water and sewer move almost entirely with bodies in the unit: showers, dishwashing, and the turnover laundry that runs after every checkout. An empty week uses near-zero water; a back-to-back week of four-guest stays uses a lot. This line tracks your [occupancy rate](/blog/short-term-rental-occupancy-rate-math) closely.

**Variable with behaviour.** Heating and cooling — the HVAC line — is the wild one. It scales with occupancy, but it scales far more with what the guest does to the thermostat and the windows. Two identical units at identical occupancy can post HVAC bills that differ by a factor of two, entirely on guest habit.

Lump those together and divide by twelve and you've thrown away every lever you have. Separate them and you can see exactly which part you can cut (behaviour), which part you can't (fixed standing charges), and which part is simply the cost of doing business (occupancy-linked water).

## The per-night breakdown, three seasons

Here's a realistic per-occupied-night model for a temperate-climate one-bedroom, at 2026 US residential rates (roughly $0.17/kWh electricity, mixed electric-plus-gas heat). The three columns are a shoulder month (April), a peak-cooling month (July), and a peak-heating month (January). "Per occupied night" is the month's bill divided by the nights actually booked that month.

| Utility | Shoulder | Summer (AC) | Winter (heat) |
|---|---|---|---|
| Electricity | $2.00 | $3.70 | $2.40 |
| Heating (gas) | — | — | $3.20 |
| Water + sewer | $0.60 | $0.70 | $0.55 |
| Internet (allocated) | $2.50 | $2.05 | $2.80 |
| Refuse / trash | $0.35 | $0.35 | $0.35 |
| **Per occupied night** | **~$5.45** | **~$6.80** | **~$9.30** |

A few things in that table are worth slowing down on.

The **internet line moves even though the bill never changes.** It's a flat $45/month. The per-night number shifts — $2.50 in a shoulder month with 18 booked nights, $2.05 in a busy summer with 22, $2.80 in a slow winter with 16 — purely because you're dividing a fixed cost across a different number of nights. When occupancy craters, your fixed utilities don't shrink; they just spread over fewer bookings, so each one carries more. In the dead of a slow winter, internet alone is your largest single utility line.

The **HVAC swing is the whole story.** Electricity nearly doubles from April to July on cooling alone, and the winter column adds a separate gas heating line that lands at $3.20 — more than the entire shoulder-month electric bill. Across the year the heating and cooling lines are where two-thirds of your variable utility spend lives, and they're the only lines a guest can move.

The **water line is small but not zero.** In the US it's typically $0.50–0.70 per night for a 1BR; in much of Europe, where combined water-and-sewer rates run three to four times higher, the same usage lands closer to €1.50–2.00. If your turnover laundry runs in-unit rather than at the cleaner's, this line climbs with every changeover — which is also why it's quietly a [cleaning-cost question](/blog/consumables-cost-per-stay-math) as much as a utility one.

These are 1BR numbers at US rates. A studio runs lighter; a three-bedroom that sleeps eight runs heavier on every line because eight people shower, cook, and run the AC harder than two do. And if you're hosting in Germany, France, or Spain, scale the energy lines up by roughly 1.8–2x — European electricity has run far above US rates for years, which makes the guest-behaviour tax below sting that much more.

## The guest-behaviour tax — the part the bill hides

Here's the uncomfortable core of the whole topic: **a guest pays no utility bill, so a guest has no reason to conserve.** Every cost signal that makes you turn off a light, close a door, or nudge the thermostat a degree is absent for the person in your unit. They are optimizing purely for comfort, with the price set to zero. That's not a character flaw — it's incentives, and it's perfectly predictable.

What it looks like in practice:

- **AC at 18°C with a window or balcony door open** — the case that started this post. The compressor runs continuously against an open thermal boundary, which is the single most expensive thing a guest can do to your bill. A unit cooling against the outdoors can pull two to three times its normal HVAC draw.
- **Heat at 25°C in January**, often with a window cracked because it got "stuffy." Same physics, opposite season.
- **Every light on, every appliance idle-on** — TV, lamps, the second AC unit in the bedroom nobody's sleeping in.
- **Their own laundry**, run as several small loads instead of one full one, plus long daily showers that a resident paying the water bill would shorten without thinking.

A resident household self-regulates because the bill lands in their name. A guest household doesn't, because it doesn't. The result is that the *same unit* posts a materially higher per-night utility cost as a short-term rental than it would lived in — not because rentals are wasteful by nature, but because the price signal that drives conservation never reaches the person at the thermostat.

You can't lecture your way out of this. A note asking guests to "please be mindful of energy use" reads as cheap and changes nothing — the guest still has zero cost reason to comply. The only things that work are structural: limits and automation that don't depend on goodwill.

## Where the money actually leaks: HVAC and laundry

Strip away the small lines and two drivers account for nearly all the variance between a cheap utility month and an expensive one.

**HVAC is the big one.** On the table above, the gap between the shoulder column and the winter column is almost entirely heating, and the gap between shoulder and summer is almost entirely cooling. Everything else — water, internet, trash — barely moves. So if you're going to spend attention anywhere on this line, spend it on the thermostat. A single guest running the AC against an open door for a week can add more to your bill than your entire water-and-sewer line for the month.

**In-unit laundry is the quiet second.** Every turnover runs at least one hot-water load of towels and linens, and guests on longer stays run their own on top. A hot wash plus a dryer cycle pulls real electricity and real water, and unlike HVAC it happens on a fixed schedule you can count: once per stay, minimum. If your changeovers run in-unit, your water and a chunk of your electricity scale directly with turnover frequency — which means a high-turn studio doing 22 short stays a month gets hit on utilities the same way it gets hit on [consumables](/blog/consumables-cost-per-stay-math) and cleaning: more resets, more loads, more cost per night occupied.

Notice what's *not* on the leak list: standby draw, phantom load, the fridge. They're real, but they're small and fixed — chasing them is rounding-error optimization. The money is in the two lines a guest controls and a turnover triggers.

## What it costs across a year

The per-night number feels like noise. Annualize it and it joins the ranks of lines you'd never ignore. Take the same temperate 1BR averaging about $7 per occupied night blended across the seasons, at three occupancy levels:

| Occupancy profile | Occupied nights/yr | Per night | Per year (1 listing) | 3 listings |
|---|---|---|---|---|
| Low / long stays | 150 | $7 | $1,050 | $3,150 |
| Steady 1BR | 230 | $7 | $1,610 | $4,830 |
| High-turn studio | 300 | $7 | $2,100 | $6,300 |

A steady single 1BR is spending roughly $1,600 a year keeping the lights on and the unit at temperature — the same order of magnitude as the [maintenance reserve](/blog/maintenance-reserve-short-term-rental-math) you'd set aside without a second thought, and bigger than most hosts' consumables line. Across a three-listing portfolio it's nearly $4,800. And every one of those tables assumes *average* guest behaviour; a summer of open-door AC across three listings can add several hundred dollars on top, invisibly, because no single bill ever looks alarming enough to investigate.

This is also why utilities belong in your floor price, not in a separate "overhead" bucket you forget about. The full treatment of which costs have to clear before a booking makes money is in [break-even nightly rate math](/blog/break-even-nightly-rate-math) — and utilities are one of its line items, sitting right next to cleaning and consumables. A $7-per-night utility cost on a $120 ADR is nearly 6% of gross, every booked night. That is not a rounding error.

## Capping the line without hurting the review

The fix is never to make the unit less comfortable — a cold guest in January writes a review that costs you more than a year of gas. The fix is to remove the *waste* the guest doesn't notice, while leaving the comfort they do.

- **A smart thermostat with guest limits** is the highest-leverage purchase on this whole page. Set a permitted range — say 19–24°C — so the guest can pick their comfort inside a band but can't run the compressor against an 18°C setpoint. Configure it to auto-revert to an eco setpoint at checkout, so the unit isn't heating an empty room between stays. A $120 device that trims 20% off a $900 annual HVAC bill pays for itself in a single season, and the guest never feels constrained because nobody actually wants 18°C.
- **An open-window / door sensor** that pauses the HVAC when the thermal boundary opens kills the single most expensive failure mode directly. Some smart thermostats do this natively; a standalone sensor is cheap.
- **Occupancy-aware setbacks** — drop heating/cooling automatically when motion sensors show the unit's been empty for hours — catch the guest who leaves the AC blasting all day while they're at the beach.
- **LED everything and a heat-pump system** if you're choosing hardware. This is the slow, structural version — it lowers the baseline so guest behaviour swings a smaller number.

What doesn't work is asking. The guest-behaviour tax is an incentive problem, and incentive problems don't yield to polite notes. They yield to a thermostat that simply won't go to 18°C with the door open.

The piece most hosts miss is that you can't manage this line if you can't see it. One listing, you'll eventually notice a weird bill. Three listings on three different occupancy curves, and "which unit's HVAC ran hot last month, and was it the open-door guest or just a cold snap?" becomes a question you can't answer from a stack of utility statements — which is exactly the kind of per-listing operational state [RentTools](/onboard) is built to keep in one place, free, alongside the calendar that tells you how many turnovers — and how many laundry loads — are about to hit each unit.

## FAQ

**How much do utilities cost per night for an Airbnb?**
For a one-bedroom at US rates, budget $5–10 per occupied night, blended across the year. The low end is a mild shoulder-season month; the high end is peak summer cooling or peak winter heating. A studio runs lighter, a three-bedroom heavier. In Europe, where energy costs roughly double US rates, scale the electricity and heating lines up by about 1.8–2x. The number matters less than the fact that it's real, recurring, and partly within your control.

**Are utilities a fixed or a variable cost for a short-term rental?**
Both — that's the whole trap. Internet, standing connection charges, and flat refuse fees are fixed. Water and sewer scale with occupancy. Heating and cooling scale with occupancy and with guest behaviour. If you treat the whole bill as fixed and divide by twelve, you lose sight of the variable lines that actually move, and you never notice the guest-behaviour tax on HVAC.

**Why is my Airbnb electric bill so high compared to when I lived there?**
Because the person at the thermostat no longer pays the bill. A resident conserves automatically — the cost lands in their name. A guest optimizes for comfort with the price set to zero, so the AC runs colder, the heat runs hotter, windows get left open, and lights stay on. The same unit posts a materially higher per-night energy cost as a rental than it did lived in, purely on incentives.

**Should I include utilities in my nightly rate?**
Yes — utilities are an operating cost that has to clear before a booking makes money, so they belong in your floor price alongside cleaning and consumables. At roughly $7 per occupied night on a $120 nightly rate, utilities are close to 6% of gross every booked night. Folding them into your break-even math is the only way to know your real margin.

**Will a smart thermostat actually save money in a rental?**
In most cases, yes, and faster than in an owner-occupied home — because the waste it prevents is larger. Set a permitted temperature range so guests can't run extreme setpoints, auto-revert to an eco setting at checkout so you're not conditioning an empty unit between stays, and add open-window detection to stop the AC running against an open door. A $120 device trimming 20% off a $900 annual HVAC bill pays back in one season, and guests don't notice because nobody actually wants the unit at 18°C.

**How do I stop guests running the AC with the windows open?**
You can't stop them with a note — they have no cost reason to comply. You stop it structurally: a smart thermostat with open-window/door detection pauses the HVAC the moment the thermal boundary opens, and occupancy-aware setbacks cut conditioning when the unit's been empty for hours. The open-door-with-AC case is the single most expensive thing a guest can do to your bill, so it's the one worth automating away rather than asking about.

**Does in-unit laundry add much to utilities?**
More than hosts expect. Every turnover runs at least one hot-water load of towels and linens, and longer-stay guests add their own. A hot wash plus a dryer cycle pulls real electricity and water on a fixed per-stay schedule, so a high-turnover listing's utility cost climbs with changeover frequency the same way its cleaning and consumables costs do. If your water bill looks high, count your monthly turnovers before you suspect a leak.

**How much should a portfolio of listings budget for utilities annually?**
A steady single 1BR runs about $1,500–1,800 a year at US rates; three listings land near $4,800. High-turnover studios run higher because more turnovers mean more laundry loads and more resets. Budget it as a real annual line, refresh the per-night rate after a twelve-month look-back, and watch the summer and winter peaks — that's where the guest-behaviour tax hides in plain sight.

## One opinionated take

Utilities are the operating line hosts model worst, because the bill is just steady enough to look fixed and just variable enough to quietly drain you. The mistake is averaging it away — divide by twelve, call it overhead, never attribute it per booking, and you blind yourself to the one part of the line you can actually move. Separate the fixed lines from the behaviour-driven ones, accept that a guest will never conserve a resource they don't pay for, and spend your one unit of effort on the thermostat rather than a note nobody reads. The waste lives in HVAC and laundry, it's worth four figures a year per listing, and the fix is a band on the thermostat, not a plea to be mindful.
