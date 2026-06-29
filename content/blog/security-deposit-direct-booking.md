---
slug: security-deposit-direct-booking
locale: en
title: "Security deposit for a direct booking: the hold, not the charge"
excerpt: A damage deposit on a direct booking isn't a charge — it's a Stripe pre-authorization hold. The 7-day window that eats it, the right amount, and the chargeback trap.
status: published
tags:
  - host-tips:Host tips
  - pricing:Pricing
  - tools:Tools
ogImageUrl: /blog-covers/security-deposit-direct-booking.webp
ogImageWidth: 1600
ogImageHeight: 900
---

A guest cracked the glass cooktop on a direct booking last spring — a $190 part plus an hour of an installer's time. I went to capture the security deposit I was sure I'd taken at booking, three weeks earlier. There was nothing to capture. The pre-authorization had quietly expired after seven days, weeks before the guest ever turned the key, and I never noticed because the dashboard still listed it under "authorized" until I clicked in and read the fine print. I ate the $190. The deposit machinery had worked exactly as designed. I just hadn't understood the design.

This is the post I needed that week: what a damage deposit on a direct booking actually is, why it's a hold and not a charge, the one window that decides whether it's there when you need it, and how taking one wrong invites a chargeback that costs more than the damage.

## TL;DR

- A direct-booking damage deposit is a **pre-authorization hold**, not a charge — you only capture it if something breaks.
- A Stripe manual-capture hold **expires after 7 days**. Place it 1–2 days before check-in, never at booking.
- You can capture **part** of a hold (the actual repair) and release the rest — but you can never capture *more* than you authorized.
- Hold nothing and you have no recourse; capture aggressively and you invite a [chargeback](/blog/chargeback-direct-booking-dispute).
- Size it to your worst *realistic single incident* — **$200–500** for a standard 1BR, more for pets or high-value units.
- For most small hosts, **card-on-file** (charge only if damage occurs) or a **non-refundable damage waiver** beats a refundable hold.

## Why a platform never made you think about this

Airbnb retired the guest-facing security deposit in 2019 and folded protection into AirCover — a contractual reimbursement, not a hold you control. Booking.com lets you set a "damage deposit," but the pre-authorization runs on the platform's rails, released automatically in 7–14 days unless you flag damage in the extranet. Either way, the money plumbing isn't yours. [Here's what each platform scheme actually pays out](/blog/airbnb-aircover-vs-booking-damage-deposit), depreciation haircuts and all.

The day you take a [direct booking](/blog/direct-booking-website-math), every bit of that vanishes. There's no AirCover, no extranet button, no resolution team. "Take a deposit" stops being a toggle and becomes a thing you have to build yourself, usually on Stripe. And the first thing you learn is that the word "deposit" is misleading — you're not collecting money. You're placing a hold.

## A hold is not a charge — and your guest must know it

This is the single most misunderstood mechanic in direct booking, by hosts and guests both.

When you place a $400 deposit with a card processor, you run an **authorization** for $400. The bank checks the card is valid and has the funds, then reduces the guest's available credit by $400. No money moves. Nothing lands in your account. It's a reservation against their balance, like the hold a hotel or gas pump places.

Money only moves when you **capture** the authorization — and you only do that if there's damage. If there's no damage, you let the hold expire or cancel it, and the $400 of headroom returns to the guest's card. You never paid a processing fee, because no charge ever cleared. Stripe's percentage applies to captured amounts only.

Two things bite here if you skip the guest communication:

- **A hold still shows up.** On most cards a $400 authorization appears as a *pending* line on the statement, and the guest's available balance drops by $400 for the duration. To a guest who wasn't warned, that reads as "you charged me $400." You'll get the panicked message at 9 p.m. Tell them in writing, before you place it, that it's a refundable hold and will drop off.
- **Debit cards are worse.** Many debit-card banks treat an authorization as an immediate debit, pulling the $400 out of the checking account for real and refunding it days later when you release. For a guest living close to their balance, that's a genuine problem. Take deposits on credit cards where you can; for debit, consider a smaller hold or a waiver instead.

## The seven-day window that ate my deposit

Here's the trap that cost me the cooktop.

A Stripe PaymentIntent set to manual capture — the standard way to place a hold — **stays authorizable for seven days**. Capture it inside that window and it works. Let the window pass and Stripe automatically cancels the authorization; the hold is gone, and there's nothing left to capture.

Now look at the timeline of a normal booking. A guest books on the 1st for a stay starting the 22nd. If you place the hold at booking — which feels like the responsible thing — it expires on the 8th. Two full weeks before the guest arrives, your deposit silently evaporated. Damage on the 23rd has nothing behind it. That is exactly what happened to me.

The fix is a scheduling discipline, not a bigger deposit:

- **Place the hold 1–2 days before check-in.** Late enough that it covers the stay, early enough to catch a declined card before the guest is standing at the door.
- **Capture (or release) within 48 hours of checkout.** Inspect, decide, act. Don't let the hold ride to day seven hoping you'll get around to it.
- **Automate the reminder.** Whatever runs your calendar should ping you to place the hold the day before arrival. Doing it by memory is how you end up paying for a cooktop.

If your stays routinely run longer than seven nights, a single hold can't cover the whole stay anyway — the window expires mid-stay. That's the case where card-on-file (below) stops being optional.

## How much to actually hold

The instinct is to anchor the deposit to the value of everything in the unit. That's the wrong anchor. You'll never replace the whole apartment from one deposit, and a hold large enough to try will scare off good guests and slam into card limits. Size it to your **worst realistic single incident** — the thing that actually goes wrong, not the catastrophe insurance is for.

| Property type | Typical single-incident damage | Deposit to hold |
| --- | --- | --- |
| Standard 1BR, no pets | Stained sofa, broken glass top, lost key set | $200–300 |
| 2–3BR family unit | The above plus appliance, minor wall repair | $300–500 |
| Pet-friendly | Carpet, scratched floors, deep clean | +$150–250 on top |
| High-value / design-led | Statement furniture, electronics, art | $500–1,000 |
| Event-risk (large group, holiday weekend) | Over-occupancy, noise fines, party cleanup | $1,000–2,000 |

Two calibration rules. First, the deposit should comfortably cover your **deductible-sized** events — the $150 stain, the $190 cooktop — because those are the ones that actually happen and that no insurer will bother with. Second, keep it under roughly **50% of the booking value** for a standard stay; past that, guests read it as a red flag and book the listing down the street that doesn't ask.

## Capture exactly what broke — and not a cent more

When damage does happen, you don't capture the whole hold. You capture the repair.

Stripe lets you **partially capture** an authorization: hold $400, capture $190 for the cooktop, and the remaining $210 releases back to the guest automatically. You can capture less than you authorized, but you can **never capture more** — which is the real reason to size the hold to your worst case rather than your average. Capture once; there's no second bite at the same authorization.

Before you capture a single dollar:

- **Photograph the damage with a timestamp**, ideally against the dated check-out photos you took. No dated evidence and a contested capture becomes a coin flip.
- **Quote the actual cost** — the part, the labour, the receipt. A deposit is reimbursement for real loss, not a fine. Capturing $400 for a $190 repair is the fastest way to turn a guest into a disputant.
- **Message the guest first**, with the photos and the number, before you capture. Most reasonable guests accept a documented $190. Almost none accept a silent $400 they discover on their statement.

The processing fee (≈2.9% + $0.30 in the US, lower on European cards) applies only to what you capture, so capturing $190 costs you about $5.80 in fees — a rounding error against the repair.

## The chargeback trap

Here's where a deposit can cost you more than the damage. The moment you capture an authorization the guest disputes, you're in chargeback territory — and on a direct booking, **you are the merchant of record**, fully exposed. The processor pulls the captured amount back plus a fee the instant the dispute opens, before anyone reads your side. I wrote the whole [direct-booking chargeback playbook](/blog/chargeback-direct-booking-dispute) separately, but two points matter specifically for deposits:

- A captured deposit a guest disputes as "I didn't authorize this" is **friendly fraud**, and you win it only with a signed booking agreement that spells out the deposit, dated damage photos, and proof the guest stayed. Have all three before you capture, or don't capture.
- Turn on **3-D Secure** for the original payment. It shifts fraud liability for the booking to the card issuer and makes the "I never booked this" dispute far harder to win against you.

The asymmetry is the whole lesson: a $190 capture you can't defend can become a $190 reversal plus a $15 dispute fee plus the time, and a dinged dispute ratio with your processor. Capture only what you can prove.

## The two cleaner alternatives

For a lot of small hosts, a refundable hold is more friction and more risk than the rare damage justifies. Two alternatives I now use more than the hold itself:

**Card-on-file, charge only if needed.** Instead of authorizing a hold, you save the guest's card at booking (Stripe's SetupIntent) with their explicit consent, and charge it *off-session* only if damage occurs after checkout. No seven-day window, no scary pending hold on the guest's statement, works for long stays. The trade-off: an off-session charge with the guest gone is the *most* chargeback-prone way to collect, so your booking agreement has to authorize it in plain language and you need the same photo evidence. It's lower friction up front and higher risk on the back end.

**A non-refundable damage waiver.** A flat fee — typically $39–75 — the guest pays at booking instead of a deposit, that covers accidental damage up to a cap. It's the model Vrbo's Property Damage Protection runs. Guests prefer it (no hold, no balance hit), it's revenue not a liability, and third-party underwriters (Superhog, Waivo, and similar) will administer it and pay out claims for a per-booking cut. You give up the deterrent effect of a real deposit, but you also give up the support tickets and the chargeback exposure. For a standard sub-$250/night unit, the math usually favours the waiver.

## A worked example, start to finish

A direct guest books a 4-night stay at $180/night — $720 plus a $60 cleaning fee, $780 total. You set a $300 damage deposit, disclosed in the booking agreement they sign.

1. **At booking:** you charge the $780 stay (3-D Secure on), and save the card on file. You do **not** place the hold yet.
2. **Day before check-in:** you place a $300 manual-capture authorization. It clears; the guest sees a $300 pending hold and a message from you explaining it's refundable.
3. **Checkout:** you inspect within the day. A wine stain on the rug needs a $40 professional clean.
4. **You capture $40**, send the guest the receipt photo, and the remaining $260 releases. Fee on the capture: about $1.46.
5. **Net:** you're made whole on the rug, the guest is out $40 they accept because they saw the evidence, and the hold expired the way it should — captured, documented, no dispute.

The version where this goes wrong is identical except you placed the hold at booking on the 1st, it expired on the 8th, and on checkout day there was no $300 to touch. Same deposit, same guest, same stain — and you pay the $40 yourself. The mechanic that decides it isn't the amount. It's the timing.

## FAQ

**Can I take a security deposit on a direct booking through Stripe?**
Yes. You place a manual-capture PaymentIntent (an authorization hold) for the deposit amount, and capture it only if there's damage. It's the standard way direct-booking hosts handle deposits without a platform. The deposit is separate from the charge for the stay itself.

**How long does a Stripe authorization hold last?**
Seven days for card payments. After that Stripe automatically cancels the authorization and the hold disappears. This is why you place the hold a day or two before check-in, not at booking — a hold placed weeks ahead expires before the guest ever arrives.

**Does placing a hold charge the guest's card?**
No money moves on an authorization. The guest's available credit drops by the hold amount and a pending line may show on their statement, but nothing reaches your account and no processing fee applies until you capture. If there's no damage, you release the hold and the balance returns.

**How much should a vacation rental security deposit be?**
Size it to your worst realistic single incident, not the value of everything in the unit. A standard 1BR runs $200–300; pet-friendly and high-value units justify more. Keep it under roughly half the booking value for a normal stay, or guests read it as a warning sign.

**What happens if I don't capture the hold in time?**
The authorization expires after seven days and there's nothing left to capture — the deposit is simply gone, with no charge to the guest and no money to you. If you missed the window and there's damage, your only recourse is a fresh off-session charge on a saved card, which the guest can more easily dispute.

**Can the guest dispute a captured deposit?**
Yes, and on a direct booking you're the merchant of record, so the dispute is yours to fight. A captured deposit the guest contests is friendly fraud; you win it with a signed booking agreement, dated damage photos, and proof of stay. Capture only what you can document, and only the actual repair cost.

**Is a damage waiver better than a deposit?**
For most small hosts, yes. A non-refundable waiver fee ($39–75) the guest pays at booking removes the hold, the seven-day window, and most of the chargeback risk, and it's revenue rather than a liability. You lose the deterrent effect of a real deposit but gain far fewer support headaches.

**Can I hold a deposit on a debit card?**
You can, but many banks treat a debit authorization as an immediate withdrawal and refund it days later, which genuinely pinches a guest living close to their balance. Prefer credit cards for holds; for debit guests, use a smaller hold, a waiver, or card-on-file instead.

## One opinionated take

For a standard unit under about $250 a night, skip the refundable hold entirely. The seven-day window, the panicked guest messages, the chargeback exposure, and the day you forget to place it cost more, in aggregate, than the rare bit of damage a deposit actually recovers. Save the real holds for pets, large groups, and high-value units where the downside is genuinely large — and for everything else, save the card on file, write a clear damage clause into your booking agreement, and charge only when something breaks. If you're setting up direct bookings from scratch, [start with the rest of the stack first](/onboard); the deposit is the last thing to bolt on, not the first.
