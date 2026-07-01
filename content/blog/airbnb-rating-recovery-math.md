---
slug: airbnb-rating-recovery-math
locale: en
title: "Airbnb rating recovery math: how many 5-stars erase one bad review"
excerpt: A single low review dents your Airbnb rating in seconds; climbing back is fixed math — how many 5-star stays it takes to erase one, by listing size.
status: published
tags:
  - airbnb:Airbnb
  - host-tips:Host tips
  - guest-comms:Guest comms
ogImageUrl: /blog-covers/airbnb-rating-recovery-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

A guest left me a 1-star in March. The listing sat at 4.90 across 20 stays — a clean, boring 1-bedroom that had never dropped below five stars for anything but a broken kettle. One review, one night, one guest who was angry the building had no lift, and the number on my listing page read 4.71 by the next morning. I did the thing every host does: I opened a spreadsheet and asked how many perfect stays it would take to get back to 4.90. The answer was not what I expected, and it is the same answer whether you have 20 reviews or 2,000.

This post is that spreadsheet. The exact arithmetic of how far one bad review knocks you, how many flawless stays it takes to climb back, and why the highest-rated listings are the slowest to recover.

## TL;DR

- One review moves your average by `(P − k) / (N + 1)` — the drop shrinks fast as review count `N` grows.
- The 4.80 Superhost line is only at risk on **small listings**. Past ~50 reviews, one 1-star can't break it.
- Restoring your **prior** average is fixed: `(P − k) / (5 − P)` five-star stays — and it does not depend on `N`.
- At 4.90, one 1-star costs **39 flawless stays** to erase. At 4.95 it costs **79**. Higher rating, slower recovery.
- At ~5 reviews a month, 39 clean stays is **about eight months** of unbroken 5-stars.
- A granted review removal deletes the whole debt in five minutes. Chase removal first, recovery second.

## The one formula that matters

Your Airbnb overall rating is a plain arithmetic mean: add up every guest's overall star rating, divide by the number of ratings. That is it. No decay, no weighting by recency, no secret sauce. Which means the whole thing is predictable with sixth-grade math.

Say your listing sits at average `P` across `N` reviews. A new review worth `k` stars lands. Your new average is:

```
new average = (P × N + k) / (N + 1)
```

The size of the drop is `(P − k) / (N + 1)`. Two things fall out of that immediately. First, a low review hurts in proportion to how far below your average it is — a 1-star on a 4.90 listing is a 3.90-point shock, a 4-star is only a 0.90-point shock. Second, the damage is divided by your review count plus one. A listing with 20 reviews feels a 1-star nineteen times harder than a listing with 400.

Now the recovery question. You took a `k`-star hit and you want to climb back to your original `P`. How many more 5-star stays does that take? Set the average back to `P` and solve:

```
5-star stays to restore P  =  (P − k) / (5 − P)
```

The `N` cancels out. **The number of perfect stays needed to erase one bad review does not depend on how many reviews you have.** A 20-review listing and a 2,000-review listing at the same 4.90 both need the same number of flawless stays to undo the same bad review. The big listing barely flinches on the day; it takes exactly as long to fully heal.

The intuition: each 5-star only buys you `(5 − P)` of headroom — on a 4.90 listing, a single perfect stay is worth just 0.10 above your line. The bad review put you `(P − k)` in the hole. Repaying a fixed debt with fixed-size payments takes a fixed number of payments, no matter how big your balance already is.

## Three listings, one 1-star

Here is the same 1-star review landing on three listings, all sitting at 4.90 before it hits. The only difference is how many reviews each had banked.

| Reviews before the 1-star | New average | Drop | Superhost 4.80 line |
| --- | --- | --- | --- |
| 20 | 4.71 | −0.19 | Lost |
| 50 | 4.82 | −0.08 | Safe |
| 100 | 4.86 | −0.04 | Safe |
| 200 | 4.88 | −0.02 | Safe |

The 20-review listing drops below the Superhost threshold and loses the badge on the next quarterly recalc. The 50-, 100-, and 200-review listings do not — they were carrying enough five-star ballast that a single 1-star can't push the raw average under 4.80. (Airbnb stores the raw average to two decimals and displays it rounded to one, so 4.82 shows as "4.8" but is safely above the 4.80 cutoff. The full mechanics of that cliff are in [Airbnb Superhost: the four thresholds](/blog/airbnb-superhost-requirements-math).)

So the first myth to kill: **one bad review does not "cost you Superhost" on an established listing.** It costs you Superhost on a *young* listing. If you have more than about 50 reviews at 4.90, a lone 1-star is a cosmetic dent to the displayed number, not a badge event. The panic is real; the badge risk usually isn't.

The 20-review case is the one that stings. To claw back to the 4.80 line — not your old 4.90, just the badge line — that listing needs **9 consecutive 5-star stays** (99 ÷ 21 climbs back to 144 ÷ 30 = 4.80 at exactly nine). To get all the way back to 4.90 it needs 39. Those are two different finish lines, and confusing them is where hosts either over-panic or under-react.

## The rating-debt table

Because recovery-to-prior is review-count-independent, you can print it on an index card. Here is what one bad review costs, in flawless stays, at different starting averages:

| Your average before | 5-star stays to fully restore it after one 1-star |
| --- | --- |
| 4.95 | 79 |
| 4.90 | 39 |
| 4.85 | 26 |
| 4.80 | 19 |
| 4.70 | 13 |

Read the top row again. A listing at **4.95** needs **79 perfect stays** to absorb a single 1-star, versus 13 for a listing at 4.70. The better your rating, the more expensive each bad review is to undo — because you have less headroom per 5-star. A 4.95 listing gains only 0.05 per perfect stay; a 4.70 listing gains 0.30. This is the counterintuitive part hosts never see coming: **grinding your rating up toward 5.0 makes you more fragile, not less.** The closer you are to the ceiling, the longer the fall-recovery takes.

And it depends heavily on which low rating you got. Same 4.90 listing, different bad reviews:

| The review you got | 5-star stays to erase it (from 4.90) |
| --- | --- |
| 1-star | 39 |
| 2-star | 29 |
| 3-star | 19 |
| 4-star | 9 |

A 4-star review — which most hosts don't even think of as "bad" — still costs nine perfect stays to erase from a 4.90 listing. That is why hosts chasing a 4.9+ display treat 4-stars as failures: at that altitude, a 4-star is a real setback, not a compliment with a rounding error.

## Turning stays into months

Nine or thirty-nine perfect stays sounds abstract until you convert it to calendar time. Not every guest reviews — Airbnb's review rate runs roughly 50–70% depending on your prompt discipline. Take a listing doing 9 bookings a month with about half of guests reviewing: that's ~4–5 fresh reviews a month.

At five reviews a month, the 4.90 listing's 39-stay debt is **about eight months** of nothing but 5-stars. Eight months in which a single 4-star resets part of the clock, because the recovery math above assumes an *unbroken* streak. Slip one 4-star into the run and you have added its own debt on top — the streak is doing double duty, and any crack in it stretches the timeline.

This is the number that should change your behaviour. The bad review already happened; it is a sunk 3.90-point hit. What you control is review *velocity* — how fast clean stays arrive to dilute it. A listing taking 4 reviews a month recovers in half the calendar time of one taking 2, from the identical starting point. The single highest-leverage move after a bad review is not the public reply. It is turning on a post-stay review request so the next fifteen happy guests actually leave the five stars that are doing the healing. The reply-writing tactics live in [how to respond to a 3-star review](/blog/responding-to-bad-airbnb-review); the velocity is what moves the number.

## Guest Favorite raises the stakes

Superhost's 4.80 line has real headroom. Airbnb's newer **Guest Favorite** badge, introduced in late 2023 to mark its most-loved listings, does not publish a hard numeric cutoff — but in practice the listings carrying it cluster tightly around 4.9. Airbnb describes it as a blend of ratings, review count, and reliability signals rather than a single threshold, so treat any exact number you see quoted online with suspicion.

The practical consequence is what matters here. A badge whose effective bar sits near 4.9 leaves almost no cushion. On the rating-debt table, a listing living at 4.90 to hold Guest Favorite is exactly the listing that pays 39 stays to undo a 1-star — and one 4-star in the recovery run can be enough to drop it out of the cohort. The badge that rewards a near-perfect rating is the same badge that punishes a single bad night hardest. If you are hunting Guest Favorite, the recovery math is not trivia; it is your risk model.

## What actually moves the number

Three levers, in order of leverage.

**Removal beats recovery on expected value.** A granted review removal deletes the review, the rating drops with it, and your average recalculates within minutes — the entire 39-stay debt vanishes for five minutes of work. Removal success runs roughly 15–30% on policy grounds (irrelevant content, retaliation, extortion). Even at a 20% hit rate, an instant deletion of an eight-month debt dominates any amount of grinding. File the removal request *first*, before you post a public reply, because a reply makes the case look resolved. The grounds and success rates are in [the 3-star response playbook](/blog/responding-to-bad-airbnb-review).

**Velocity dilutes what removal can't.** For the reviews you can't get removed — the fair ones — the only tool is more clean reviews, faster. A four-line post-stay message at the four-day mark converts 35–50% of guests who would otherwise stay silent. Doubling your review rate halves your recovery time. There is no other dial that does that.

**Stop optimising past your ceiling.** If your listing has a structural cap — a loud street, no lift, thin walls — you are not going to sustain 4.95, and chasing it just makes every 4-star a crisis. Pick the rating you can hold with normal hosting, bank the ballast of review count, and let the mean do its job. A dashboard that shows average rating, review velocity, and Superhost distance across every listing in one view — instead of clicking through Airbnb's tabs one listing at a time — is exactly what [RentTools](/onboard) puts on one screen.

## FAQ

**How is the Airbnb overall rating calculated?**
It is the simple arithmetic mean of every guest's overall star rating over the life of the listing — sum of all ratings divided by the number of ratings. There is no time-decay and no recency weighting on the overall number, so an old 5-star counts exactly as much as last week's. The displayed figure is that raw average rounded to one decimal place.

**How many 5-star reviews cancel out one 1-star?**
To return to your exact prior average, the count is `(P − 1) / (5 − P)` where `P` is the average you had before. At 4.90 that is 39 five-star stays; at 4.85 it is 26; at 4.80 it is 19. The number does not depend on how many reviews you already have — only on the average you are trying to restore.

**Does a bad review hurt more when I have fewer reviews?**
On the day, yes — the immediate drop is `(P − k) / (N + 1)`, so a smaller review count `N` means a bigger visible fall. A 1-star takes a 20-review listing from 4.90 to 4.71 but a 200-review listing only to 4.88. The recovery time to fully erase it, though, is identical for both.

**Will one 1-star cost me Superhost?**
Only if your listing is small. Below roughly 50 reviews at a 4.90 average, one 1-star can push the raw average under the 4.80 threshold and cost you the badge at the next quarterly recalc. Above that, you have enough five-star history that a single low review stays comfortably above the line.

**Is a 4-star review bad for my rating?**
At a high average, yes. A 4-star on a 4.90 listing pulls the average down and takes nine flawless stays to undo. It only reads as "good" against listings sitting at 4.5. If you are defending a 4.9 display or chasing Guest Favorite, treat 4-stars as misses.

**How long does it take to recover an Airbnb rating in real time?**
Convert stays to months using your review rate. A 4.90 listing needs 39 clean stays; at about five reviews a month that is roughly eight months of unbroken 5-stars. Faster review velocity shortens it proportionally — a listing earning reviews twice as fast recovers in half the calendar time.

**Should I ask guests to remove or change their review?**
You can't force it, and pestering a guest usually backfires. Your better shot is a formal removal request to Airbnb on policy grounds — irrelevant content, retaliation, or documented extortion — which, when granted, deletes the review and its rating impact instantly. Chase that before you spend eight months out-hosting the number.

## One opinionated take

Hosts treat a bad review as a wound that heals on its own if they just keep hosting well. The math says otherwise: a single 1-star on a 4.90 listing is a debt of 39 perfect stays, and time only pays it down as fast as clean reviews arrive. The two things that actually retire that debt are a removal request filed in the first hour and a review-request message that doubles how fast the next fifteen guests leave five stars. Everything else — the agonised public reply, the price cut, the week of second-guessing — moves the number by nothing. If you are going to obsess over one review, obsess over the two levers that are arithmetic, not the one that just feels productive.
