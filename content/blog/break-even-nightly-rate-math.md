---
slug: break-even-nightly-rate-math
locale: en
title: "Break-even nightly rate: the floor where a booking starts losing money"
excerpt: Worked math for the nightly rate below which a short-term-rental booking loses money — the per-stay vs per-night cost split, the break-even formula, and three lowball requests scored.
status: published
tags:
  - pricing:Pricing
  - host-tips:Host tips
  - tools:Tools
ogImageUrl: /blog-covers/break-even-nightly-rate-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

I once accepted a $39 same-day booking for a single night because the calendar was empty and "$39 beats nothing." It did not beat nothing. The cleaner cost me $45 before the guest had even unlocked the door, the night ran the heat and the hot water and a load of laundry, and Airbnb took its cut off the top. I netted about $33 and spent close to $60 to earn it. I had paid a stranger roughly $25 to sleep in my apartment, and I felt clever doing it. The empty night I was so afraid of would have cost me $0.

That's the trap this post is about. An empty night is a sunk cost — it's already paid for whether or not anyone shows up. A *below-floor* booking is worse than empty: it's an active loss you opt into. The line between them is your break-even nightly rate, and almost no host has actually calculated theirs.

## TL;DR

- An empty night is sunk cost; a below-floor booking is an active loss.
- Break-even floor = (per-stay cost ÷ nights + per-night cost) ÷ (1 − commission).
- One-night stays carry the whole cleaning bill, so their floor is highest.
- A 1-night floor near $80 can fall under $25 once a stay runs a week.
- Winter heat and a 15% host-only fee both push the floor up, not down.
- Below the floor you're paying the guest to stay — set a minimum price.

## What "break-even" actually means for one night

The mortgage, the insurance, the property tax, the internet bill — those are fixed. You pay them whether the unit is full or dark all month. So when you're deciding whether to accept a specific booking, you ignore them completely. They are not a cost *of that booking*; they're a cost of *owning the place*, and they're already spent.

What a booking actually costs you is only the money that leaves your pocket *because a guest is in the unit that you wouldn't have spent if the night stayed empty*. That's the variable cost, and it's the only number that decides whether a given rate makes you money or loses it.

This is why "$39 beats an empty night" is the wrong frame. The empty night costs nothing extra. The $39 booking costs me a cleaner, utilities, consumables, and a commission cut. The right question is never "is this better than empty?" It's **"does this rate cover what this specific booking will cost me to host?"** If yes, every dollar above that is real margin on a night that would otherwise have earned zero. If no, you're subsidizing a stranger's holiday.

## The three cost buckets

Variable cost isn't one number — it comes in three shapes, and mixing them up is how the $39 booking looks fine until the cleaner's invoice lands. Split it cleanly:

**Per-stay costs** — paid once per booking, regardless of length. The cleaner ($40–80 a turnover depending on size), the linen and towel laundry ($6–12), the consumable restock you do at handover (welcome coffee, fresh toiletries, a roll of trash bags — call it $5–10). A one-night guest and a seven-night guest cost you almost the same here. That's the whole reason short stays are expensive to host.

**Per-night costs** — paid for each night the guest is there. Electricity, water, gas/heating, the daily slice of consumables (coffee pods, toilet paper, dish soap, laundry detergent). In a temperate month this might be $10–14 a night for a 1BR; in deep winter, with the heat running, it climbs to $20+.

**Percentage costs** — a cut off the top of whatever you charge. Airbnb's host-only fee is around 15%; the split fee is closer to 3% to the host; Booking.com runs ~15% commission; Vrbo lands near 8% plus payment processing. On a direct booking it's just the card fee, roughly 2.9% + $0.30. This one scales with your rate, so it doesn't just add to the floor — it multiplies it.

To keep the model honest I'm assuming **all-in pricing** here — the nightly rate covers everything, no separate cleaning fee bolted on. That's increasingly how the platforms want it displayed anyway, and it makes the floor a single clean number. (If you're still running a separate cleaning fee, the trade-offs are their own post: [cleaning fee vs all-in pricing](/blog/airbnb-cleaning-fee-vs-all-in-pricing).)

Put the three buckets together and the break-even rate for a stay of **N** nights is:

```
break-even nightly rate = (per-stay cost / N + per-night cost) / (1 − commission)
```

The `(1 − commission)` in the denominator is the part hosts forget. If a night costs you $25 to host and the platform takes 15%, you don't charge $25 — you charge $25 / 0.85 = $29.41, because $4.41 of that rate never reaches you. Charge exactly $25 and you've worked the turnover for free.

## The break-even table by length of stay

Plug in a real 1BR city apartment: per-stay cost $55 (cleaner $45 + laundry $10), per-night cost $13, commission 15%. Watch what length of stay does to the floor.

| Stay length | Per-stay cost ÷ nights | + per-night | Pre-commission | Break-even rate |
|---|---|---|---|---|
| 1 night | $55.00 | $13 | $68.00 | **$80** |
| 2 nights | $27.50 | $13 | $40.50 | **$48** |
| 3 nights | $18.33 | $13 | $31.33 | **$37** |
| 5 nights | $11.00 | $13 | $24.00 | **$28** |
| 7 nights | $7.86 | $13 | $20.86 | **$25** |

The one-night floor is $80; the seven-night floor is $25. Same apartment, same costs — the only thing that moved is how many nights share that single $55 turnover bill. A one-night guest pays the whole cleaning cost in one go; a week-long guest spreads it across seven nights until it nearly disappears.

This is the math underneath every length-of-stay discount you've ever seen. A host offering 20% off for a week isn't being generous — their break-even on a seven-night stay is a third of their one-night floor, so they have enormous room to discount and still clear margin. (The flip side — how deep that discount can safely go — is [length-of-stay discount math](/blog/length-of-stay-discount-math).) It's also why a $50 one-night booking is a loss while a $50 seven-night booking is a healthy $25/night of margin. The rate alone tells you nothing; the rate *next to the stay length* tells you everything.

## Three lowball requests, scored

The floor earns its keep when a cheap request lands and you have thirty seconds to decide. Here are three, against the table above.

| Request | Offered rate | Floor for that length | Verdict | Margin / loss |
|---|---|---|---|---|
| Same-day, 1 night | $55 | $80 | **Reject** | −$21 on the night |
| Tomorrow, 4 nights | $50 | $31 | **Accept** | +$63 over the stay |
| Weekend gap, 2 nights | $38 | $48 | **Reject** | −$16 over the stay |

The same-day one-nighter at $55 *feels* like found money on an empty Tuesday. It isn't: you keep $46.75 after commission and spend $68 hosting it, a $21 loss for the privilege of a turnover. The four-night at $50 looks lower per night but it's the only winner — the cleaning bill spreads thin and every night clears $15.75 over the floor, $63 of real margin. The weekend two-nighter at $38 is the seductive one, because $38 sounds reasonable and weekends feel valuable; run it against the $48 two-night floor and you're down $16.

Notice the pattern: the decision never tracks how big the rate *sounds*. $55 is a reject and $50 is an accept, because one is a one-night stay carrying a full cleaning bill and the other spreads it over four. Score the rate against the floor for *that length*, or you'll keep mistaking the expensive losses for wins.

## The floor moves — and it moves the wrong way for your instincts

Two forces shift the floor, and both do it at the exact moment you're most tempted to discount.

**Commission.** Run that same 1BR on Airbnb's host-only fee (≈15%) and your one-night floor is $80. Switch to the split fee (≈3% to you) and the floor drops to about $70; take a direct booking with just a card fee and it's near $68. The platform you're on quietly sets your floor $10+ higher than your raw costs imply — which is one more reason a direct booking at the *same* displayed rate is worth more to you than an Airbnb one. ([Host-only vs split fee math](/blog/airbnb-host-only-fee-vs-split-fee-math) has the full breakdown.)

**Season.** In January the heat runs all day and your per-night cost jumps from $13 to $22. That lifts the one-night floor from $80 to about $91 and the three-night floor from $37 to $47. Winter is exactly when occupancy sags and the urge to slash rates is strongest — and it's the season your floor is *highest*, because every night now burns more gas. Hosts routinely cut winter rates below their own cold-weather break-even and conclude that "winter just isn't profitable." Winter is fine; they were filling it with loss-making bookings.

The instinct in both cases is backwards. Low demand makes you want to drop the rate; rising costs are simultaneously pushing the floor up. Discount into that without re-running the number and you'll book a full calendar of nights that each lose a few dollars, then wonder why a busy month paid worse than a quiet one.

## When to accept below the floor on purpose

The floor is a default, not a law. There are real reasons to dip under it — but they're deliberate investments, not "$39 beats nothing" reflexes.

- **A brand-new listing with zero reviews.** Your first five reviews are worth more than the margin on five bookings. Pricing under the floor to buy review volume is a legitimate launch tactic — with an end date, after which you price for profit.
- **A gap-filler that unlocks a bigger booking.** A lone orphan night between two reservations earns nothing and is hard to sell; taking it slightly under floor to avoid a dead night can pencil out, especially if it lets you raise a minimum-night setting elsewhere. (The orphan-night case has its own logic: [orphan night and gap night math](/blog/orphan-night-gap-night-math).)
- **A long stay that anchors a slow month.** A 21-night booking at a touch under your short-stay floor can still clear a fat margin, because the per-stay cost vanishes across three weeks — and it spares you 21 nights of marketing, messaging, and turnovers.

What every one of these shares: you know the number you're accepting, you know why, and you've decided the trade is worth it. That's the opposite of the same-day reflex, where you accept a loss because you never ran the math and "empty" scared you more than "negative."

## Wiring the floor into your pricing

Knowing your floor is useless if the decision lands at 11pm when a same-day request pings and you're tired. The fix is to make the floor a setting, not a judgment call.

Every platform has a minimum-price field. Set it to your *one-night* floor — the highest one — and the calendar will simply refuse to sell a night below it. Layer length-of-stay discounts on top so longer stays can legitimately price down toward their lower floors without you touching anything. The result: the system says no to the loss-making $39 one-nighter automatically, and says yes to the profitable $50 four-nighter, with no 11pm math from you.

Where it gets fiddly is that your floor isn't one number — it's per-season and per-platform, and the per-night cost genuinely changes between July and January. Tracking that across Airbnb, Booking.com, and Vrbo by hand is exactly the kind of cross-platform bookkeeping that drifts out of date the week you stop watching it. Pulling every listing's costs and rates into one place so the floor is always current is the sort of thing [RentTools](/onboard) is built to handle, free, across every platform at once.

## FAQ

**What is a break-even nightly rate for a short-term rental?**
It's the lowest rate at which a booking covers the money you actually spend to host it — cleaning, laundry, utilities, consumables, and the platform's commission — with nothing left over and nothing lost. Below it, the booking costs you more than it earns. Above it, every extra dollar is margin on a night that would otherwise have earned zero. It is not the rate that covers your mortgage; fixed costs like the mortgage are paid whether the unit is booked or empty, so they don't belong in a per-booking decision.

**Why is the floor so much higher for one-night stays?**
Because the cleaning and laundry bill is the same whether a guest stays one night or seven, and a one-night guest pays all of it in a single night. Spread a $55 turnover across one night and it adds $55 to that night's cost; spread it across seven and it adds under $8. That single fact is why one-night stays need a much higher rate to break even, and why most hosts either price them high or set a two-night minimum.

**Should I ever accept a booking below my break-even rate?**
Only as a deliberate investment, never as a reflex. Legitimate reasons: a brand-new listing buying its first reviews, an orphan night that would otherwise sit dead, or a long stay that anchors a slow month and spreads its costs thin. In each case you know the number, you know why you're accepting it, and you've set an end date or a condition. Accepting a loss simply because the night was empty and "something beats nothing" is the mistake the floor exists to prevent.

**Does my cleaning fee cover the cleaning cost?**
Partly, and less than you think. The platform takes commission on the cleaning fee too, so a $50 cleaning fee on a 15% host-only listing nets you about $42.50 against a cleaner who might cost $45 — you're already underwater before utilities. That leakage is one reason this post models all-in pricing instead, where the nightly rate carries the full cost and the floor is a single honest number rather than a fee that quietly fails to cover itself.

**How does commission change my break-even floor?**
It divides your raw cost by `(1 − commission)`, so higher commission means a higher floor. A night that costs you $25 to host needs a $25 rate at 0% commission, $25.77 at 3% (Airbnb split fee), and $29.41 at 15% (host-only or Booking.com). The platform you're on can move your floor $4–5 a night before you've spent a cent more — which is why the same displayed rate is worth more to you on a direct booking than on a high-commission channel.

**Is my break-even rate higher in winter?**
Usually yes, and it's the seasonal trap most hosts fall into. Heating pushes your per-night cost up — often from around $13 to $22 for a 1BR — which lifts the floor by roughly $10 a night across every stay length. Winter is also when demand drops and the urge to discount is strongest, so hosts cut rates below a floor that just rose, fill the calendar with small losses, and decide winter isn't profitable. Re-run the floor each season; don't carry your summer number into January.

**How do I stop accepting loss-making bookings automatically?**
Set your platform's minimum-price field to your one-night floor — the highest of all your break-even numbers — so the calendar physically can't sell a night below it. Then add length-of-stay discounts so longer bookings can price down toward their lower floors on their own. That combination rejects the loss-makers and accepts the winners without you doing math at the moment a request lands, which is exactly when you're least equipped to do it.

## One opinionated take

Most hosts think their pricing problem is that their rates are too low. It usually isn't. The problem is that they've never separated the two kinds of empty: the night nobody books, which costs them nothing, and the night they fill below their floor, which costs them real money they then can't see because "at least it was booked." The second one hides inside a full calendar and a respectable occupancy rate, and it's why plenty of 85%-occupied listings clear less than 65%-occupied ones run by someone who knows their floor. Calculate the number, set it as your minimum, and let the empty nights stay empty — they were the cheaper option all along.
