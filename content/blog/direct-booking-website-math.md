---
slug: direct-booking-website-math
locale: en
title: "Direct booking website math: when escaping OTA commission pays off"
excerpt: A worked P&L on Airbnb's host cut vs a direct site's 3% Stripe fee — and the repeat-guest rate that decides whether your own booking page pays off.
status: published
tags:
  - host-tips:Host tips
  - pricing:Pricing
  - tools:Tools
  - booking-com:Booking.com
ogImageUrl: /blog-covers/direct-booking-website-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

I built my first direct booking page to "escape Airbnb's 15% cut." Three months and forty bookings later I worked out the actual P&L and found something nobody on the host forums had told me: under Airbnb's default fee model, the cut I was escaping was mostly the *guest's*, not mine. I was netting almost the same $582 on a $600 booking whether it came through Airbnb or my own Stripe link. The guest saved $85. I saved thirty cents.

That was the start of understanding where a direct booking website actually makes money — and where it just moves a discount from the platform into the guest's pocket. The answer turns on two numbers most hosts never separate: which fee model your platform runs, and what share of your bookings are repeat or referral guests. Here is the full math.

## TL;DR

- Under Airbnb's **split-fee** model, going direct saves the *host* almost nothing — the guest pays the ~14% service fee, not you. The savings land in the guest's wallet.
- Under **host-only fee** (Airbnb) and **Booking.com's 15%**, the host eats the commission — that is where direct booking saves real money: roughly **$72 on a $600 booking**.
- A direct booking via Stripe costs **2.9% + $0.30** (about **$18 on $600**); EEA cards run cheaper, ~1.5%.
- The number that decides everything is your **repeat + referral rate**. Acquiring a stranger via ads costs **$50–$150 per booking** — often more than the commission you'd save.
- A paid direct-site tool (~**$480/year**) breaks even at about **7 host-paid-commission bookings/year**. Below that, use a free page.
- You lose **AirCover, chargeback protection, and platform trust** going direct — price those in before you celebrate the saved commission.

## What the OTA commission actually costs you

Every host quotes the commission as one number. It is two completely different numbers depending on the fee model, and the difference is the whole post.

Run a single booking through each: a $150/night listing, 4-night stay, **$600 subtotal**.

| Channel | Fee model | Host receives | Guest pays |
|---|---|---|---|
| Airbnb (split fee) | 3% host + ~14% guest | $582 | ~$685 |
| Airbnb (host-only fee) | 15% host, 0% guest | $510 | $600 |
| Booking.com | 15% host (+ ~1.1% payments) | $504–$510 | $600 |
| Vrbo (pay-per-booking) | 5% + 3% processing | $552 | $600 |
| Direct (Stripe, US card) | 2.9% + $0.30 | $582 | $600 |

Look at the first and last rows. On Airbnb's **split-fee** model — still the default for most independent hosts not connected through software — the host nets **$582**. A direct Stripe booking nets **$582.30**. For the host, those are the same number. The thing you'd be "escaping" by going direct is the **$85 the guest** paid on top, not a cost you were carrying.

Now look at host-only fee and Booking.com. There the host nets **$510**, and the direct booking nets **$582** — a real **$72 saved per booking**. That is the gap worth chasing.

So the first question is not "should I take direct bookings." It is "which fee model am I on?" Check it in your Airbnb payout breakdown: if the guest sees a "service fee" line, you're on split fee and the host-side commission you'd recover is tiny. If there's no guest service fee and your payout is ~15% below the nightly total, you're on host-only fee and direct booking has real margin in it. Most software-connected and most EU-based listings are on host-only fee whether the host realised it or not.

## The Stripe side: what a direct booking really nets

Stripe's standard rate is **2.9% + $0.30** per successful charge in the US. On a $600 booking that's **$17.70**. In the EEA, cards from the same region run about **1.5% + €0.25**, so a European host taking European guests pays closer to **$9–$10** on the same booking. International cards add roughly **1.5%** on top, and currency conversion another **1–2%** — worth knowing if your guests pay in a different currency than your payout.

Two costs the "just use Stripe" advice skips:

- **Deposits and pre-auths.** If you replace platform damage protection with a refundable deposit, Stripe charges you when you capture it and you eat a fee on any amount actually charged. A pre-auth that you release costs nothing, which is the right pattern for most stays.
- **Refunds don't return the fee.** Stripe keeps the $0.30 (and historically the percentage too, though they now refund the percentage on full refunds). A booking that cancels and rebooks twice has paid Stripe three times.

Net it out: direct via Stripe lands the host **~$582 on $600** for US cards, **~$590** for intra-EEA. The processing is genuinely cheap. The expensive part of direct booking is never the payment rail — it's getting the guest to your page in the first place.

## The number that decides everything: your repeat + referral rate

Here is the trap. A host reads "save 15%" and builds a Squarespace site, runs Google Ads for "[city] vacation rental," and waits. The ads cost **$0.80–$2.50 per click**, the landing page converts at **1–3%**, so the all-in **cost to acquire one direct booking from a cold stranger is $50–$150**. You just spent the commission you were trying to save — and you did it *without* the platform's review wall, dispute mediation, or guest verification.

Acquiring strangers off-platform is, for almost every small host, a losing trade. The OTA is very good at one thing you are not: putting your listing in front of a traveller who has never heard of you, at the exact moment they're ready to pay. That introduction is what the commission buys.

The direct bookings that actually make money are the ones with **zero acquisition cost**:

- **Repeat guests.** Someone who already stayed and loved it. Re-acquiring them on Airbnb means paying commission a second time on a guest you already won.
- **Referrals.** Their friend, who arrives pre-trusting because a real person vouched for you.
- **Your own audience.** A property with an Instagram, a guest email list, a "book direct next time" card on the kitchen counter.

For these guests, the direct channel is pure margin: $72 saved (host-only/Booking rates) on bookings you'd otherwise pay full freight to win again. Your repeat + referral rate *is* your direct-booking opportunity. Everything else is marketing spend dressed up as savings.

Typical rates by property type, from what I see across hosts I work with: a transient **city studio runs 5–10% repeat** (business travellers rebooking, mostly), a **beach 2BR 15–25%** (annual-holiday families), and a **destination cabin 30–40%** (the same skiers every February). The cabin is where direct booking prints money. The city studio is where a direct funnel quietly loses it.

## A worked break-even: free direct vs a paid direct-site tool

A built-in direct-booking site — Lodgify, Hostfully, Uplisting — runs roughly **$40/month, ~$480/year**, sometimes plus a 1–2% per-booking fee on direct reservations. A free path (a public iCal feed to keep the calendar honest, plus a Stripe payment link or a one-page booking form) runs **$0–$50/year**.

Break-even on the paid tool, at $72 saved per host-paid-commission booking:

| Property | Bookings/yr | Direct (repeat+ref) | Saving/yr | Paid tool verdict |
|---|---|---|---|---|
| City studio (split fee, 7% repeat) | 90 | ~6 | ~$0* | No — savings are the guest's, not yours |
| Beach 2BR (Booking-heavy, 20%) | 60 | ~12 | ~$864 | Marginal — free path nets more |
| Mountain cabin (host-only, 35%) | 40 | ~14 | ~$1,008 | Yes — pays back ~2x, free path is pure profit |

*The studio's caveat is the split-fee finding above: even on 6 direct bookings, if the platform alternative was split-fee Airbnb, the host's saving is near zero. The right move there is not a direct site at all — it's leaving the listing on Airbnb and pocketing the fact that the guest, not you, pays the fee.

The pattern: a **paid** direct-site tool needs about **7 host-commission bookings a year** just to clear its own cost. Most hosts under 5 listings never hit that on direct volume alone, which is why the **free path wins** for almost everyone below a strong-repeat destination property. You don't need a $480 website to email a past guest a Stripe link. For the parallel break-even on the tool that syncs all this, see [channel manager break-even math](/blog/channel-manager-break-even-math) — the logic is the same shape, different number.

## The hidden costs nobody prices in

The saved commission is the visible number. These are the invisible ones, and at least two of them have cost me real money.

- **No AirCover.** Airbnb's up-to-$3M host guarantee does not follow the guest to your direct booking. You replace it with a refundable deposit (caps your downside at the deposit) or a short-term-rental insurance policy (**$500–$1,500/year**). On a direct booking, the broken TV is entirely your problem. The full comparison of what each protection scheme actually pays is in [AirCover vs Booking.com damage deposit](/blog/airbnb-aircover-vs-booking-damage-deposit).
- **Chargebacks.** This is the one that bites. A guest who disputes the charge with their bank puts *you* against a card network with weak evidence and a **$15 chargeback fee** whether you win or lose. Airbnb absorbs this risk on-platform; Stripe does not. A non-refundable rate plus a clear, signed booking agreement is your only defence.
- **Trust and reviews.** A stranger will not put $600 into a no-name booking page with no review wall. This is the same reason cold-ad direct bookings convert at 1–3%: the trust the OTA rents you is real. Direct only converts *warm* traffic — people who already trust you.
- **Compliance and admin.** You're now the merchant of record. Tax invoicing, refund handling, [guest registration](/blog/guest-registration-laws-short-term-rental) and tourist-tax collection that the platform used to do for you — all yours. Budget an hour per direct booking for the first few until you've templated it.

Add it up and the honest per-booking saving on a direct booking is **$72 minus** an allocation for insurance, chargeback risk, and admin time — call it a real **$40–$55** on host-only/Booking rates, and still essentially **zero** on split-fee Airbnb.

## How I actually run it (the hybrid)

I don't run a direct-only operation and I don't think most hosts should. The setup that works:

1. **Keep every OTA listing live.** They are my acquisition channel. Every stranger discovers me there, and I happily pay the toll to meet them once.
2. **Convert the relationship, not the booking.** During the stay, a guest who's clearly happy gets a low-key "we take repeat guests directly, here's how" — a card, an email, a line in the checkout message. No discount war on the platform, which violates the terms anyway.
3. **Make the direct path free and frictionless.** A public iCal feed keeps the direct calendar in sync with the OTAs so I never double-book myself. A Stripe payment link plus a one-page agreement closes the booking. Total tooling cost: near zero.
4. **Split the savings on host-only/Booking rates.** Offer the repeat guest **5% off** the direct rate. They still beat the OTA's guest fee, and I still net more than the platform would have paid me. Both sides win; the platform is the only one out the commission.
5. **Never run ads to chase strangers direct.** That's the line. Cold acquisition is the platform's job, and it's better at it than my ad budget will ever be.

The calendar sync underneath this — OTA feeds plus the direct bookings plus cleaning buffers, all in one place so the direct channel can't strand a double booking — is exactly what [RentTools](/onboard) does, free and open-source. The direct booking site is optional; the calendar that keeps it from blowing up is not.

## FAQ

**Is a direct booking website worth it for a small host?**
Only if you have a real repeat or referral base. For a property with a 30%+ returnee rate (destination cabins, long-stay corporate units), a direct channel for those specific guests is high-ROI because the acquisition cost is zero. For a transient city studio at 5–10% repeat, a direct funnel usually costs more in tooling and admin than it saves. The deciding number is your repeat rate, not your booking volume.

**How much commission does Airbnb actually charge the host?**
It depends on the fee model. Under the split-fee model, the host pays about 3% and the guest pays a ~14% service fee on top. Under the host-only fee model, the host pays around 15% and the guest pays no service fee. Check your payout breakdown: a visible guest "service fee" means you're on split fee and your real host-side cost is small.

**Do I save money going direct if I'm on Airbnb's split-fee model?**
Barely. On split fee the host nets about the same on a direct Stripe booking as on Airbnb, because the guest was paying the big fee, not you. Going direct mostly hands that saving to the guest. It only makes sense if you raise your direct rate to capture some of what the guest saves, or if you're trying to build a guest relationship rather than cut a cost.

**What payment processor should I use for direct bookings?**
Stripe is the default for most hosts: 2.9% + $0.30 per charge in the US, cheaper for intra-EEA cards. It handles PCI compliance, pre-authorisations for deposits, and refunds. PayPal and Square are alternatives with similar rates. Whatever you pick, use pre-auths rather than charging deposits up front, and never store card numbers yourself.

**How do I protect myself without AirCover on a direct booking?**
Two layers. First, a refundable deposit held as a Stripe pre-authorisation, sized to your realistic worst case (€150–€500 for an apartment). Second, a short-term-rental insurance policy ($500–$1,500/year) for damage above the deposit. A signed booking agreement with a clear damage clause is what makes either enforceable. You are trading the platform's guarantee for your own paperwork.

**Won't I lose the Airbnb reviews and trust that make guests book?**
For strangers, yes — which is exactly why you should not chase strangers direct. The trust the OTA's review wall provides is what converts a cold visitor. Direct booking works for guests who already trust you: past guests and their referrals. Keep your OTA listings for discovery and reputation; use direct only for the warm relationships you've already earned.

**Can I get in trouble with Airbnb for taking guests direct?**
You can't advertise your direct site or solicit off-platform bookings *inside Airbnb's messaging* before a stay — that violates their terms and can get messages flagged or your account penalised. What's fine: a guest who has already stayed contacting you later, or a physical card left in the unit. Keep the conversion off the platform's channels and after the booking, not inside the Airbnb thread.

**What's the cheapest way to start taking direct bookings?**
A public iCal feed to keep your calendar synced across channels, plus a Stripe payment link and a one-page booking agreement you send by email. Total cost: under $50/year, often $0. You do not need a $480/year hosted booking site until your direct volume clears its cost — which for most hosts under 5 listings is never. Start free, upgrade only when the numbers say so.

## One opinionated take

The OTA is not your enemy and the commission is not theft. It is the price of an introduction to a stranger who would never have found you otherwise — and it's a fair price, because acquiring that same stranger yourself would cost you more in ad spend with worse conversion. The mistake isn't paying the commission. The mistake is paying it *twice* on the same guest.

So build the cheapest possible direct path for the guests you've already won, keep every listing live for the strangers you haven't, and never spend a dollar on ads trying to drag a cold traveller off-platform to save a fee that, half the time, you weren't even paying. Direct booking is a retention tool, not an acquisition channel. Hosts who understand that quietly keep an extra few thousand a year. Hosts who don't build a website, run some ads, and wonder why "escaping the 15%" left them poorer.
