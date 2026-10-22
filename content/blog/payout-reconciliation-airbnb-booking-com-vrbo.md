---
slug: payout-reconciliation-airbnb-booking-com-vrbo
locale: en
title: "Payout reconciliation: match every booking to the money that landed"
excerpt: Airbnb, Booking.com, and Vrbo pay net, in batches, and with offsets. A 30-minute monthly match of booked, expected, and landed — and the five gaps it catches.
status: published
tags:
  - host-tips:Host tips
  - airbnb:Airbnb
  - booking-com:Booking.com
  - taxes:Taxes
ogImageUrl: /blog-covers/payout-reconciliation-airbnb-booking-com-vrbo.webp
ogImageWidth: 1600
ogImageHeight: 900
---

In my first year of hosting I found a Booking.com virtual card 41 days after the guest had checked out. Three nights, €290, never charged. By then the card had expired, partner support could not reactivate it, and the stay I had cleaned, laundered, and reviewed earned me exactly nothing. My bank balance had looked fine the whole time, because twelve other payouts had landed around it.

That is the problem with checking the bank and calling it done. Platforms pay net of fees, in batches, sometimes weeks late, and they quietly offset this month's refund against next month's stay. The only way to know you were paid for every night you hosted is to match each booking to the money it produced. It takes me 30 minutes a month for two apartments, and in my worst month it found about $570.

## TL;DR

- Your bank balance can't tell you if every stay paid. A per-booking match can.
- Three columns per stay: booked (gross), expected (net of fees), landed (bank).
- The match key is the confirmation code. Every platform report carries it.
- Weekly 10-minute pass for deadlines: virtual cards, damage claims, no-shows.
- Monthly 30-minute pass for amounts, before the Booking.com statement closes.
- Most months find nothing. One bad month pays for years of the habit.

## Why the bank balance can't tell you whether you were paid

A bank statement is a list of transfers. A booking calendar is a list of stays. The two almost never line up one-to-one, for four reasons.

**Net, not gross.** Airbnb sends the host subtotal minus its fee: 3% on the split-fee model, about 15% on host-only. Payments by Booking.com sends the stay minus a 15% commission (more with Genius or Preferred Partner) and a 1.1–3.1% payment fee. Vrbo, from October 29, takes 12% all in. Nobody sends you the number on the reservation.

**Batched.** Booking.com typically pays monthly or bi-weekly, one transfer covering every stay in the cycle. Five reservations become one bank line. If one of the five is missing from the batch, the total still looks plausible.

**Offset.** When you approve a refund on Airbnb after the payout has gone out, Airbnb does not send you an invoice. It takes the money from your next payout, which may belong to a different guest, a different listing, or a different month. That stay now looks short by $45, and the one that caused it looks fine.

**Late, or never sent.** On the Booking.com virtual-card model the money does not move until you charge the card yourself. Nothing reminds you. The [payout timing post](/blog/airbnb-booking-com-payout-timing) has the full calendar of when each platform releases money; reconciliation is how you notice when that calendar was not met.

Add currency conversion on top, and the gap between "what I booked" and "what arrived" is never zero, even in a month when nothing went wrong.

## The three columns: booked, expected, landed

Every stay gets one row and three numbers.

1. **Booked** — the gross amount on the reservation: nightly rate times nights, plus cleaning fee, before any platform fee. This is what the guest saw.
2. **Expected** — what should reach you after the platform's cut. You calculate this from the fee structure, not from the payout.
3. **Landed** — what actually arrived, matched by confirmation code, not by date or amount.

The match key matters more than anything else. Dates drift because of batching and amounts drift because of offsets, but the confirmation code is printed on every platform report and every payout line. Match on code, then compare amounts.

How to compute the expected column per channel:

| Channel | Expected payout | Where the fee shows up |
| --- | --- | --- |
| Airbnb, split fee | Host subtotal × 0.97 | Service fee column in the transaction CSV |
| Airbnb, host-only fee | Host subtotal × 0.85 (check your exact rate) | Same column, bigger number |
| Payments by Booking.com | Stay × (1 − commission − payment fee) | Netted on the payout statement |
| Booking.com virtual card | Full stay, charged by you | Commission invoiced monthly, separately |
| Vrbo pay-per-booking | Stay × 0.88 from October 29 | Deducted before the payout |
| Direct booking via Stripe | Stay × 0.971 − $0.30 (US cards) | Stripe balance transactions |

On the virtual-card model, the commission is not a deduction, it is a separate monthly bill. That bill gets its own row in the reconciliation: expected commission against invoiced commission. It is also where most Booking.com errors live, as the [commission and VAT math](/blog/booking-com-commission-vat-math) shows.

Set a tolerance before you start. I accept ±1 unit of currency for rounding on same-currency payouts and up to 3% on cross-currency ones, because the conversion spread lives there. If that 3% bothers you, it should: the [currency conversion post](/blog/airbnb-payout-currency-conversion-fee) explains how to stop paying it.

## Where to pull each number

You need one report per channel and one bank export. None of them requires a paid tool.

**Airbnb.** Menu → Earnings opens the transaction history, which exports as a CSV. Filter by payout date for the month. The rows that matter: *Reservation* rows carry the confirmation code, nights, gross earnings, and service fee; *Payout* rows tell you which reservations went into which bank transfer; *Adjustment* and *Resolution Payout* rows are refunds and damage reimbursements. Read the adjustments first. They explain most "short" Airbnb stays before you start hunting.

**Booking.com.** The extranet's Finance tab holds three things: the monthly **reservation statement** (what Booking.com thinks you hosted and will bill commission on), the **invoices** (the commission bill itself), and, on Payments by Booking.com, the **payout overview** listing every reservation inside each transfer. Download all three.

**Vrbo.** The payments report in the Vrbo dashboard lists each reservation with gross, fees, and payout. Since this is the first season on the new 12% structure, check the fee column line by line on your first November statement. The [Vrbo commission post](/blog/vrbo-12-percent-commission-math) explains why stays booked before October 29 are the ones to watch.

**Direct bookings.** Stripe's balance history shows each charge, its fee, and the payout it landed in. Disputes and refunds appear as their own negative lines.

**The booking list itself.** This is the column most hosts skip, and it is the one that catches missing money. The platform reports only show stays the platform knows were paid or billed. A list of every stay you actually hosted, from every source, is what tells you a row is missing entirely. If your calendars already run through [RentTools](/onboard), the merged calendar is that list: one view of every reservation across Airbnb, Booking.com, Vrbo, and direct, with dates and source. iCal feeds do not carry prices, so the amounts still come from the platform reports. The calendar tells you what to look for.

## A worked month: two listings, sixteen stays

Here is my October, two apartments, roughly $7,600 of bookings. Listing A runs on Airbnb and Payments by Booking.com. Listing B adds a Booking.com virtual-card rate, Vrbo, and the odd direct booking.

| Source | Stays | Expected | Landed | Gap | What it was |
| --- | --- | --- | --- | --- | --- |
| Airbnb | 7 | $3,259 | $3,214 | −$45 | A refund I approved, offset against a later payout |
| Payments by Booking.com | 3 | €1,149 | €1,149 | 0 | Matched |
| Booking.com virtual card | 3 | €1,060 | €676 | −€384 | One card never charged |
| Booking.com commission invoice | — | €159.00 | €194.40 | −€35.40 | Shortened stay billed at five nights |
| Vrbo | 2 | $851 | $851 | 0 | Matched, old rate, booked before Oct 29 |
| Direct, Stripe | 1 | $466 | $466 | 0 | Matched |
| Damage claim | — | $120 | $0 | −$120 | Burned worktop, no claim filed yet |

Taking the gaps one at a time:

**The Airbnb $45** was not lost. A guest's kettle had died, I agreed to a $45 refund through the Resolution Center, and Airbnb took it from the next payout, which belonged to a different stay. The Adjustment row in the CSV explained it in ten seconds. Status: explained, closed.

**The €384 virtual card** was real money. A three-night stay on listing B, checked out 19 days earlier, card never charged because the stay ended on a Sunday and I had batched card charges for Monday and then forgot. Booking.com virtual cards stay chargeable for roughly 14 to 30 days after checkout depending on the setup, so I charged it that afternoon with days to spare. The [virtual card playbook](/blog/booking-com-virtual-card-declined) covers what to do when the charge declines. Status: recovered.

**The €35.40 commission** came from a guest who booked five nights at €118 and left after three for a family emergency. I charged the virtual card for €354, three nights, and never touched the reservation statement. Booking.com billed commission on the original €590: €88.50 instead of €53.10. Booking.com lets you correct the reservation statement for a shortened stay before the invoice is issued; the deadline is printed in the extranet, and it is short. Status: corrected, in time.

**The $120 damage claim** never appeared in any report, which is the point. My cleaner's checkout photos showed a scorch mark on the worktop. There was no matching *Resolution Payout* row, because I had never filed. AirCover wants a claim within 14 days of checkout, and it was day 9. The [AirCover post](/blog/airbnb-aircover-vs-booking-damage-deposit) explains why dated photos decide these. Status: filed, paid three weeks later.

Total recovered or prevented: about **$570**, or 7.5% of the month. That was my worst month. The median month finds a rounding error and nothing else, and that is fine. You are not reconciling to find money every month. You are reconciling so the bad month gets caught while the deadlines are still open.

## The five gaps that show up again and again

Across two years of doing this, almost every gap falls into one of five buckets:

1. **Uncharged virtual cards.** The most expensive and the most common on Booking.com. The card expires; the money goes with it.
2. **Uncorrected reservation statements.** Shortened stays, no-shows you forgot to mark, a cancellation that went through the guest's message and not the extranet. Booking.com bills commission on the statement as it stands. The [no-show post](/blog/booking-com-no-show-fee) covers the 48-hour marking window that feeds this.
3. **Offsets that look like losses.** Airbnb refunds and adjustments landing against an unrelated payout. They are not money missing; they are money already accounted for. Learn to read them first so you do not waste 20 minutes on a false alarm.
4. **Damage you never claimed.** Reconciliation is the only moment you compare the cleaner's notes against what got paid. If there is damage and no reimbursement row, the claim was never filed.
5. **The wrong rate.** A commission that changed (Vrbo this month), a Genius discount you thought you had switched off, a host-only fee applied to one listing and not the other. The expected column catches these; the landed column alone never will.

One more, rarer but nasty: a payout that landed twice. It happens when a reservation is modified after the first payout. Returning it promptly is cheaper than having the platform claw it back from a busy month.

## The schedule: weekly ten minutes, monthly thirty

Deadlines and amounts run on different clocks, so I split the job.

**Weekly, about ten minutes, every Monday.** Only the things with a deadline:

- Every Booking.com virtual card for a stay that has started: charged? (Validity window: roughly 14–30 days.)
- Every checkout in the last 14 days with damage in the cleaner's notes: claim filed?
- Every Booking.com check-in in the last 48 hours where nobody arrived: marked as a no-show?

**Monthly, about thirty minutes.** The full three-column match. I do it in two sittings: the Booking.com reservation statement in the first working days of the month, before its correction deadline, and the amounts once the Booking.com payout has landed mid-month. Everything else, Airbnb, Vrbo, Stripe, gets matched in the second sitting.

Keep the output. One spreadsheet tab per month, one row per stay, a status column with four values: *matched*, *explained*, *recovered*, *written off*. At year end, that tab is your tax file. In the EU the platforms already send your income to the tax office under [DAC7](/blog/dac7-airbnb-booking-tax-reporting); a host with twelve reconciled tabs can answer a question about any figure in that report in minutes. A host without them has to rebuild the year from bank lines.

## FAQ

**How do I reconcile Airbnb payouts with my bank account?**
Export the transaction history from Menu → Earnings as a CSV and filter by payout date. Each Payout row lists the reservations it contains by confirmation code. Match those payouts to your bank transfers by amount and date, then check each reservation's gross earnings and service fee against what you expected. Read the Adjustment rows first: they explain most stays that look short.

**Why is my Booking.com payout less than the reservation total?**
Payments by Booking.com deducts the commission, typically 15% and more with Genius or Preferred Partner, plus a payment fee of 1.1% to 3.1% before paying you. VAT may be charged on the commission depending on your country. If the gap is bigger than those three items, check the reservation statement for a stay billed at the wrong amount.

**What happens if I forget to charge a Booking.com virtual card?**
The card stays chargeable only for a limited window after checkout, commonly around 14 to 30 days depending on the setup. Once it expires you have to ask partner support to reactivate it, and past a certain point you cannot collect at all. A weekly check of every virtual card for stays that have started is the cheapest fix.

**Can I correct a Booking.com reservation statement after a guest leaves early?**
Yes, within the correction window before the monthly commission invoice is issued. Update the checkout date or amount on the reservation statement in the extranet's Finance section. If you miss the deadline, Booking.com bills commission on the original reservation and you have to raise it with partner support instead.

**How often should a short-term rental host reconcile payouts?**
Twice, on two clocks. A weekly ten-minute pass for anything with a deadline: virtual cards, damage claims within 14 days, no-shows within 48 hours. A monthly pass of about thirty minutes for amounts, timed around the Booking.com reservation statement and payout. Two listings and sixteen stays take me about thirty minutes in total.

**Do I need accounting software to reconcile rental income?**
No. A spreadsheet with one row per stay and three amount columns, booked, expected, and landed, is enough for up to roughly 20 listings. What matters is the match key: the confirmation code, which every platform report includes. Accounting software helps at year end, but it will happily import a payout that is missing a stay.

**How long should I keep payout reports?**
Keep them as long as your tax authority can audit the year, which is commonly five to ten years in the EU depending on the country. The platforms send your income to the tax office under DAC7, so your own reconciled records are what you use to explain any figure they report.

## One opinionated take

Hosts obsess over a 3% fee difference between platforms and then never check whether the platform paid at all. A missed virtual card is a 100% fee on that stay. Reconciliation is not bookkeeping for its own sake; it is the only control you have over money that someone else collects on your behalf. If you will not spend thirty minutes a month on it, you have not chosen the cheapest channel. You have chosen not to know.
