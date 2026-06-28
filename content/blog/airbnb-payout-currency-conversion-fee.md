---
slug: airbnb-payout-currency-conversion-fee
locale: en
title: "Airbnb payout currency conversion fee: the hidden 3% spread"
excerpt: List in one currency, get paid in another? Airbnb and Booking.com bake ~3% into every cross-currency payout. The real math, and how to stop paying it.
status: published
tags:
  - airbnb:Airbnb
  - booking-com:Booking.com
  - host-tips:Host tips
  - pricing:Pricing
ogImageUrl: /blog-covers/airbnb-payout-currency-conversion-fee.webp
ogImageWidth: 1600
ogImageHeight: 900
---

For a year I let Airbnb pick the exchange rate on my payouts. Then I reconciled twelve months of statements against the mid-market rate on each payout date and found I'd been losing about 3.1% on every transfer — roughly $560 on $18,000 of payouts, for a currency conversion I could have done myself for a tenth of the cost. The fee never shows up as a line item. It's baked into the rate, which is exactly why most hosts never catch it.

## TL;DR

- Airbnb's payout rate runs ~3% below mid-market when payout and listing currency differ.
- The fee is hidden in the rate — no line item, no receipt, easy to miss for years.
- On €30,000/year of payouts that's about €900 handed over for nothing.
- Cheapest fix: list and get paid in the *same* currency — zero conversion.
- Can't match? Receive in the listing currency via Wise (~0.5%), convert yourself.
- Booking.com hides the same FX inside virtual-card charges and its payouts.

## Where the fee actually hides

Every cross-currency payout has two exchange rates in play. There's the **mid-market rate** — the real one, the number you get when you type "EUR to USD" into Google or look at XE. Then there's the rate your payout provider actually gives you, which is always a little worse. The gap between them is the spread, and the spread is the fee.

Banks and platforms love this mechanism because it doesn't look like a fee. A wire transfer charges you $25 and you see "$25" on the statement, so you feel it. A currency conversion charges you 3% and shows you a single converted number with no breakdown, so you don't. You'd have to know the mid-market rate on the exact day, multiply it out yourself, and compare — which is precisely the friction the model relies on.

Airbnb doesn't publish its spread. But if you reconcile a year of payouts against the daily mid-market rate, the answer lands consistently near 3% — sometimes 2.5% on liquid pairs like EUR/USD, sometimes north of 4% on thinner ones like USD to Uzbek som or Polish złoty. Treat 3% as the working number and check your own pairs.

The conversion only happens when two things disagree: the **currency your listing is priced in** and the **currency of your payout method**. If both are EUR, no conversion, no spread, nothing to fix. The fee exists entirely in the gap between those two settings — which is good news, because it means you control both of them.

## What the spread really costs

Three percent sounds like a rounding error until you annualise it against payout volume. Here's the same 3% spread across three realistic hosts:

| Host | Listing currency | Payout currency | Annual payouts | Lost to spread/yr |
| --- | --- | --- | --- | --- |
| Coastal flat, prices in EUR, UK bank | EUR | GBP | €30,000 | ~€900 |
| City studio, prices in USD, EU bank | USD | EUR | $45,000 | ~$1,350 |
| Two units, price in USD, local bank | USD | UZS | $18,000 | ~$560 (often more) |

The middle host is losing more than a month's worth of one unit's revenue every year, silently, to a rate nobody quoted them. None of these hosts is doing anything wrong operationally — they're getting booked, cleaning on time, hitting their reviews. They're just leaking yield through a setting they've never opened.

For context on how this stacks with the *other* invisible drains on a payout, the timing of the money matters as much as the rate — see [Airbnb and Booking.com payout timing](/blog/airbnb-booking-com-payout-timing) for the cash-flow side of the same statement.

## Fix 1: Match your listing and payout currency

The cleanest fix costs nothing and takes five minutes: make the two currencies the same so there's nothing to convert.

You have two levers. You can change the **listing currency** (Airbnb: Listings → your listing → Pricing, or the currency selector in the listing editor — note this changes the currency guests see your nightly rate in) or you can change the **payout currency** (Account → Payments & payouts → Payout methods, where the currency is tied to the method you add).

Which one to move depends on what you can't change. If your bank only holds one currency, move the listing to match the bank. If you have a multi-currency bank account, move the payout method to match the listing — keep prices in the currency your guests expect to see, and receive in that same currency.

One caveat: not every country gets every option. Airbnb's available payout methods and currencies depend on where your account is registered, and some hosts genuinely cannot add a payout method in their listing currency. That's exactly the case Fix 2 solves.

## Fix 2: Receive in the listing currency, convert it yourself

If your bank can't hold the listing currency, the move is to stop letting Airbnb do the conversion and do it yourself at a tenth of the cost. A multi-currency account — Wise is the cleanest, Payoneer the runner-up — gives you local bank details in several currencies: a EUR account with an IBAN, a USD account with ACH and wire details, a GBP account with a sort code, and so on.

The flow: add the local-currency receiving details as your Airbnb payout method. Airbnb now pays you in the listing currency with **no conversion** — it's a same-currency transfer as far as the platform is concerned. The money lands in your multi-currency account untouched. Then, when you actually need your home currency, you convert inside that account at the provider's rate, which is far tighter than the platform's.

Here's how the conversion cost compares across who's doing the converting:

| Who converts | Typical markup over mid-market | Notes |
| --- | --- | --- |
| Airbnb / the platform | ~3% (2.5–4%+) | Hidden in the rate, no breakdown, no choice of timing |
| Your local bank | 2–4% | Varies wildly; ask for the rate before you accept it |
| Payoneer | ~2% | Cheaper than the platform, not as sharp as Wise |
| Wise | ~0.4–0.6% + small fixed fee | Mid-market rate plus a transparent stated fee |

On that $45,000-a-year studio, swapping a ~3% platform conversion for a ~0.5% Wise conversion turns a $1,350 annual cost into about $225. You keep roughly $1,100 a year for the price of opening a free account and changing one payout setting.

The honest catch: a multi-currency account is one more login, one more thing to reconcile, and the convert step is manual unless you batch it. For a host clearing under ~$10,000/year it may not be worth the overhead — at that volume the spread is maybe $200–300 and your time has a price too. Above that, the math is one-sided.

## Booking.com is a different animal

Booking.com hides the same FX cost in two different places depending on your payment model.

If you're on **Payments by Booking.com** (Booking collects from the guest and pays you out), the payout works much like Airbnb: a payout currency is attached to your bank details, and if it differs from the currency the reservation was priced in, a conversion spread applies on the way to you.

If you're on the **virtual credit card** model (Booking issues you a one-time card to charge yourself), the trap moves upstream. The card is denominated in the booking's currency — often EUR. When you run that card through your own card terminal or payment processor and it settles into an account in a *different* currency, your acquiring bank does the conversion, and its FX markup (commonly 1–3%) is now your cost, not Booking's. You can lose the spread without ever seeing a "conversion" anywhere, because it happens inside your processor's settlement. If you're already wrestling with that card flow, the mechanics in [why Booking.com virtual cards get declined](/blog/booking-com-virtual-card-declined) cover the adjacent failure modes.

The fix is the same shape as Airbnb's: settle the card into an account that holds the card's currency, then convert yourself.

## A 20-minute audit you can run today

You don't need a spreadsheet to find out whether this is costing you. You need three numbers.

1. Open your last payout. Note the **amount you received** and the **currency**.
2. Find the **gross booking total** that payout corresponds to, in the **listing currency**, minus the platform's host fee.
3. Look up the **mid-market rate** for that pair on the payout date. Multiply the net booking total by it. That's what you *should* have received.

The gap between step 3 and step 1, as a percentage, is your real spread. If it's under ~0.5%, you're already matched or already self-converting — stop here, you're fine. If it's 2–4%, you're paying the platform to do something Wise does for a fraction, and Fix 1 or Fix 2 will pay for the 20 minutes many times over. Run it once a year, because payout settings have a way of resetting when you add a new bank or a new listing.

While you're auditing the money, the nightly rate it all flows from is the other lever worth a look — [the real break-even nightly rate](/blog/break-even-nightly-rate-math) shows what each booking actually has to clear before any of these fees. And if you're setting all this up from scratch, [RentTools](/onboard) keeps the operational side — calendars, cleaning, guest data — out of the way so you can focus on the numbers that move.

## FAQ

**Does Airbnb charge a currency conversion fee?**
Not as a stated fee, but yes in effect. When your payout currency differs from your listing currency, Airbnb converts at a rate worse than the mid-market rate, and that spread — commonly around 3% — is the fee. It's built into the exchange rate rather than itemised, so it doesn't appear as a "conversion fee" line anywhere on your payout.

**What is Airbnb's exchange rate markup?**
Airbnb doesn't publish a figure. Hosts who reconcile their payouts against the mid-market rate on the payout date consistently find a spread near 3%, ranging from roughly 2.5% on liquid pairs like EUR/USD to over 4% on thinner currencies. Check your own pairs rather than trusting a single number, because the markup is wider on less-traded currencies.

**How do I change my Airbnb payout currency?**
Go to Account, then Payments & payouts, then Payout methods. The currency is tied to the payout method, so you change it by adding a payout method denominated in the currency you want. Available currencies depend on the country your account is registered in, and some are only offered through specific methods like Payoneer or international bank transfer.

**Can I get paid by Airbnb in a different currency than my listing?**
Yes — and that mismatch is exactly what triggers the conversion spread. If your listing is priced in EUR and your payout method is in USD, Airbnb converts every payout. To avoid it, either match the two currencies or receive into a multi-currency account that holds the listing currency so no conversion happens at payout time.

**Is Wise or Payoneer better for receiving Airbnb payouts?**
Both let you receive in the listing currency and avoid the platform's spread, but Wise converts at roughly 0.4–0.6% over mid-market versus Payoneer's roughly 2%. For pure cost on currency conversion, Wise wins. Payoneer can still make sense if it's already in your workflow or offers a payout currency Wise doesn't support in your country.

**Does Booking.com convert currency on payouts too?**
Yes. On Payments by Booking.com it works like Airbnb — a spread applies when your payout currency differs from the reservation currency. On the virtual-card model the conversion moves to your own payment processor, which applies its own FX markup when the card settles into a different-currency account. Either way you can pay an FX spread you never explicitly agreed to.

**Why is my Airbnb payout less than I expected?**
After the host service fee and any taxes, the next most common reason a payout looks short is a currency conversion you didn't account for. Compare what you received against the net booking total times the mid-market rate on the payout date. If there's a 2–4% gap that the fees don't explain, that's the FX spread.

**Should I price my listing in my home currency or my guests' currency?**
Price in whatever currency makes guests most comfortable booking — usually the dominant currency of your guest base — then solve the payout side separately with a matched payout method or a multi-currency account. Don't distort your pricing to dodge the FX fee; fix the conversion where it actually lives, on the payout, not on the price the guest sees.

## One opinionated take

A 3% currency spread is the most boring line in your whole P&L and that's exactly why it survives. It isn't dramatic like a chargeback or visible like a cleaning bill, so it never makes the to-do list — it just quietly deducts a month of one unit's profit every year while you optimise the things that feel urgent. Spend the 20 minutes once. The fee that hides in the rate is the one worth hunting, precisely because it was designed not to be found.
