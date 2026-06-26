---
slug: booking-com-commission-vat-math
locale: en
title: "Booking.com commission: the real take rate after VAT and fees"
excerpt: Booking.com's 15% commission isn't the whole bill. Add VAT on the commission and the payments fee and your real take rate is closer to 19%. The worked math.
status: published
tags:
  - booking-com:Booking.com
  - pricing:Pricing
  - taxes:Taxes
  - host-tips:Host tips
ogImageUrl: /blog-covers/booking-com-commission-vat-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

The first time I reconciled a Booking.com payout against what I thought I'd earned, I was short by about 4% of the booking value and spent an evening hunting for the missing money. It wasn't missing. It was VAT — charged on the commission, not the booking — a line I'd never noticed because I'm under the registration threshold and Booking just nets it out of the weekly transfer before it ever reaches my account.

The "15% commission" everyone quotes is the headline, not the bill. By the time the money lands, Booking.com has taken the commission, the tax on that commission, and a payment fee — and on a typical EU listing the real cut is closer to 19% than 15%. Here's exactly what stacks, with a worked take-rate for four countries.

## TL;DR

- The quoted **15% commission is a base rate**, not your real cost — it ranges 10–25% by country and property type.
- Commission is charged on the **whole booking total**: nightly rate plus cleaning, pet, and extra-guest fees. Itemized local taxes are excluded.
- If you're **not VAT-registered**, Booking adds **local VAT to the commission** — 19% in Germany, 21% in Spain — as a cost you can't reclaim.
- **Payments by Booking.com** adds another **1.1–3.1%** payment fee on top, deducted before payout.
- Stack it up and a non-registered EU host's **real take rate is ~19%**, not 15%.
- Genius and Preferred Partner stack *on top of all this* — they raise the cut, they don't replace it.

## The headline rate is a starting point, not your cost

When a host says "Booking takes 15%," they mean the commission rate set on their property in the Extranet. That number is real, but it's three things at once that hosts conflate into one.

First, 15% is only the default. Booking.com's commission ranges from **10% to 25%** depending on the country, the property type, and whatever rate was set when the listing was onboarded. New holiday-rental listings in most of Europe start at 15%; some markets sit higher; a few negotiated or legacy listings sit lower. Check yours — it's on the Extranet under **Account → Commission**, and a surprising number of hosts have never looked.

Second, the commission is a *percentage of a base*, and the base is bigger than your nightly rate. That's where the first leak is.

Third, the commission rate is the only number Booking puts in front of you. The VAT on it and the payment fee are downstream, on different documents, and that's why hosts miss them for months.

## What the commission is actually charged on

Booking.com charges commission on the **total reservation amount** the guest pays for the stay — and "total" means more than the room.

The commission base includes the nightly rate, the cleaning fee, extra-guest fees, pet fees, and any other service charge you bundle into the reservation. The one consistent exclusion is **itemized local tax**: VAT charged to the guest and city or tourist tax, when those are configured as separate taxes rather than baked into the rate, sit outside the commission base.

That has two practical consequences.

A **€40 cleaning fee is not €40 in your pocket.** At a 15% rate, Booking takes €6 of it in commission before the tax-on-commission and payment fee even apply — so the cleaning fee nets you roughly €32, not €40, against a cost that was genuinely €40. If you're trying to recover cleaning cost through the fee, you're recovering about 80% of it. This is one more reason the [cleaning-fee-vs-all-in-pricing decision](/blog/airbnb-cleaning-fee-vs-all-in-pricing) isn't obvious.

**Tourist tax should be itemized, never baked in.** If you fold a €3-per-night city tax into your nightly rate, Booking charges 15%+ commission on that €3 too. Configure it as a tax in the Extranet and it drops out of the commission base entirely. The mechanics of who collects what are in the [tourist-tax breakdown](/blog/tourist-tax-airbnb-booking-vrbo); the commission angle is just: itemize it.

## The VAT line nobody mentions

This is the part that cost me an evening. Booking.com B.V. is a Dutch company, and its commission is a service it sells to you. That service is subject to VAT, and how the VAT is handled depends entirely on one thing: **whether you've given Booking a VAT number that's valid for EU transactions.**

If you **are** VAT-registered and provide a valid number, the EU **reverse-charge** mechanism applies. Booking invoices the commission with 0% VAT, and you account for the VAT yourself on your return — charging and reclaiming it in the same line, so for most registered businesses it nets to zero. The VAT costs you nothing; it's an accounting entry.

If you **are not** VAT-registered — which describes most hosts running one to five listings below their country's registration threshold — Booking is required under EU rules to **charge local VAT on its commission** and remit it through its OSS registration. Booking states this plainly for individual markets: without a valid EU VAT number, it applies 21% in Spain, 22% in Italy, and the local rate elsewhere, to every commission invoice. You cannot reclaim it, because you're not registered. It is a straight additional cost.

So the small host — the one who assumed staying under the VAT threshold *saved* money — is the one who pays VAT on the commission with no way to claw it back. The registered host, who charges VAT to guests and deals with the paperwork, gets the commission VAT for free. It's backwards from what most people expect, and Booking's UI does nothing to flag it.

## A worked take-rate, four countries

Take one clean €100 night — no cleaning fee, no city tax, to isolate the stack — booked by a guest paying through Payments by Booking.com, with a host who is **not** VAT-registered and pays a 15% base commission.

| Country | Commission 15% | VAT on commission | Payment fee ~1.1% | Booking keeps | You net | Real take rate |
| --- | --- | --- | --- | --- | --- | --- |
| Germany (19% VAT) | €15.00 | €2.85 | €1.10 | €18.95 | €81.05 | 19.0% |
| France (20% VAT) | €15.00 | €3.00 | €1.10 | €19.10 | €80.90 | 19.1% |
| Spain (21% VAT) | €15.00 | €3.15 | €1.10 | €19.25 | €80.75 | 19.3% |
| Italy (22% VAT) | €15.00 | €3.30 | €1.10 | €19.40 | €80.60 | 19.4% |

The quoted 15% is really **about 19%** for the non-registered host across the major EU markets. The VAT-on-commission line alone — €2.85 to €3.30 on a €100 night — is the 3% I couldn't find that first evening.

Now run the same booking for a **VAT-registered** host in Spain who provided a valid EU number:

- Commission: €15.00.
- VAT on commission: reverse-charged — you self-account and reclaim, **net €0**.
- Payment fee: €1.10 (also reverse-charged).
- **Booking's real cost to you: ~€16.10. You net €83.90 — a 16.1% take rate.**

The gap between the registered and non-registered host on the identical booking is about **three percentage points of every booking, forever.** Whether closing that gap is worth registering is a real decision with costs on the other side — once registered you charge VAT to guests and file returns — but you can't even weigh it if you don't know the gap exists.

## The payment fee on top

The third layer is the **payment-facilitation fee**. When you use Payments by Booking.com — Booking collects the guest's card and pays you by bank transfer or virtual card — Booking charges a processing fee of **1.1% to 3.1%**, varying by country, the reservation's currency, and how the guest paid. On the €100 examples above I used 1.1%, the low end you'll see in most domestic-currency EU bookings; a cross-currency booking or certain card types push it toward the top of the range.

The fee is deducted before your payout lands, on the same statement as the commission, which is why it blends into the "why is this less than I expected" feeling rather than showing up as its own surprise. If your market lets you take the guest's payment directly through your own processor instead, you trade Booking's fee for your processor's — usually a wash, sometimes cheaper — but in many markets Payments by Booking.com is effectively mandatory for new listings, so treat the 1.1%+ as part of the floor.

## How Genius and Preferred Partner change the stack

The programs hosts opt into don't replace this stack — they **modify the base it's calculated on, or add to the rate**, and the VAT and payment fee ride along on the new number.

**[Genius](/blog/booking-com-genius-levels-math)** discounts the price the *guest* pays — 10%, 15%, or 20%. Your commission is then charged on the lower amount, so the absolute commission shrinks, but you've given up more revenue than you saved in commission. A Genius Level 1 booking of a €100 night becomes a €90 booking: commission 15% × €90 = €13.50, VAT and payment on the smaller base — but you collected €90, not €100. The discount is the cost, not the commission.

**[Preferred Partner](/blog/booking-com-preferred-partner-math)** does the opposite: you pay roughly **+2% commission** (17% instead of 15%) for a ranking boost. That +2% is charged on the full base, and the VAT rides on the higher commission too. For a non-registered Spanish host, Preferred turns the ~19.3% real take rate into roughly 21.6%.

Run both at once — Preferred Partner on a Genius booking — and you're paying 17% commission on a discounted nightly rate, plus VAT on that commission, plus the payment fee, on a price the guest already got 10% off. That can be the right trade in a soft market. It is never the cheap option the individual opt-in screens make it look like.

## How to find your real number

Stop estimating and read it off the documents. Three places in the Extranet:

1. **Account → Commission** shows your actual base rate. Confirm it's 15% and not something a previous manager negotiated up.
2. **Finance → Invoices** shows the monthly commission invoice with the **VAT line broken out separately.** If you see a VAT amount there, you're paying it — which means Booking doesn't have a valid EU VAT number for you, and that VAT is a cost.
3. **Finance → Reservation statements** (or your payout reports) show the **payment charge** per reservation when you're on Payments by Booking.com.

Add the three for one real booking and divide by what the guest paid. That percentage — not the 15% headline — is what Booking actually costs you, and it's the number you should be using when you compare against [running a direct-booking site](/blog/direct-booking-website-math) or weigh Booking against [Airbnb's host-only vs split fee](/blog/airbnb-host-only-fee-vs-split-fee-math).

## How to shrink the take

You can't negotiate the VAT or the payment fee, but you can shrink the base they're charged on and decide which programs are worth their cut.

- **Itemize every tax.** City tax, tourist tax, and guest-facing VAT configured as separate taxes drop out of the commission base. Bundled into the rate, they're commissioned.
- **Reconsider bundled fees.** Every euro of cleaning or extra-guest fee carries the full ~19% stack. That doesn't mean drop the fee — it means know that you recover ~80% of it, and price accordingly.
- **Audit your active programs.** Genius and Preferred Partner each add a measurable cost. Run them for 60 days, measure the booking lift, and keep only the ones that pay back. The [Genius breakeven math](/blog/booking-com-genius-levels-math) is a worked example of how to decide.
- **Know your VAT position.** If you're near the registration threshold, the three-point commission-VAT gap belongs in the calculation alongside the cost of registering. Ask an accountant with the real number in hand.
- **Don't double-pay across platforms.** If you also list on Airbnb, the prerequisite to running both without [double-bookings](/blog/avoiding-double-bookings) is calendar sync — which [RentTools does for free](/onboard), so the only thing you're comparing platform to platform is the take rate, not the operational risk.

## FAQ

**What is Booking.com's commission rate for hosts?**
The default is 15% in most of Europe, but the rate ranges from 10% to 25% depending on the country, property type, and what was set when the listing was created. Check your actual rate in the Extranet under Account → Commission rather than assuming 15% — it can be higher, and a small number of negotiated listings are lower.

**Does Booking.com charge VAT on its commission?**
Yes, if you haven't given Booking a VAT number that's valid for EU transactions. As a Dutch company, Booking is required to apply local VAT to its commission for non-registered partners — 19% in Germany, 20% in France, 21% in Spain, 22% in Italy — and it pays that VAT to the authorities. For a non-registered host this is an additional cost you can't reclaim. Registered hosts who provide a valid number get the reverse-charge treatment, which nets to zero.

**What does Booking.com commission apply to — just the nightly rate?**
No. Commission is charged on the full reservation total: the nightly rate plus cleaning fees, pet fees, extra-guest fees, and any other service charge you add. The main exclusion is itemized local tax (guest VAT and city or tourist tax) when those are configured as separate taxes. Bake a tax into your nightly rate and you pay commission on it.

**How much is the Payments by Booking.com fee?**
When Booking collects the guest's payment for you, the processing fee runs from 1.1% to 3.1% of the reservation, depending on the country, currency, and the guest's payment method. It's deducted before your payout and shown on your reservation statements, separate from the commission.

**What is my real take rate after everything?**
For a non-VAT-registered host in a major EU market paying 15% base commission and using Payments by Booking.com, the all-in cut is about 19% of the booking — roughly 15% commission, 3% VAT on that commission, and 1.1% payment fee. A VAT-registered host on the same booking pays about 16%, because the commission VAT reverse-charges to zero.

**Does Genius or Preferred Partner replace the commission?**
No — they stack on it. Genius discounts the price the guest pays, so commission is charged on a smaller amount but you collect less revenue. Preferred Partner adds roughly 2% to your commission rate for a ranking boost, and the VAT rides on that higher commission. Both are costs layered on top of the base stack, not alternatives to it.

**Do I pay commission if a guest cancels or no-shows?**
You pay commission on whatever you actually collect. A fully refunded cancellation generates no commission; a cancellation fee or a charged no-show does, on the amount charged. The mechanics of recovering money from a no-show, and when the charge sticks, are in the [no-show fee breakdown](/blog/booking-com-no-show-fee).

**Where do I see the VAT Booking charged me?**
In the Extranet under Finance → Invoices. The monthly commission invoice lists the VAT as a separate line. If there's a VAT amount on it, Booking doesn't hold a valid EU VAT number for you and that VAT is a real cost — which is the single fastest way to confirm whether you're the non-registered host paying the higher effective rate.

## One opinionated take

Every host can quote their commission rate and almost none can quote their take rate. Those are different numbers, and the gap between them — VAT on the commission, the payment fee, the program surcharges — is three to seven points of every booking that never appears on the screen where you set the rate.

Pull one real reservation statement this week and do the division. If the answer is 19% where you'd been assuming 15%, that's not Booking cheating you — it's all disclosed, on invoices you've been auto-filing. It's that the one number Booking shows you up front is the one number that isn't the whole story, and the only way to manage a cost is to first measure the real one.
