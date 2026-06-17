---
slug: chargeback-direct-booking-dispute
locale: en
title: "Chargeback on a direct booking: the host's win-the-dispute playbook"
excerpt: A guest disputed your direct booking with their bank. The reason codes hosts actually face, the evidence that wins, and the $15 fee you pay either way.
status: published
tags:
  - host-tips:Host tips
  - pricing:Pricing
  - booking-com:Booking.com
ogImageUrl: /blog-covers/chargeback-direct-booking-dispute.webp
ogImageWidth: 1600
ogImageHeight: 900
---

A guest checked out of my apartment, left a five-star review, and 38 days later disputed the entire $1,180 charge with her bank as "services not rendered." Stripe debited my account that same afternoon — pulled the $1,180 back plus a $15 dispute fee — before a single human had read one word of my side. That is the moment you learn the hard truth about going direct: the day you stop charging guests through Airbnb, you become the merchant of record, and a chargeback is no longer the platform's problem. It is yours, and the deck is stacked.

This is the playbook for the dispute you didn't see coming. What a chargeback actually is, the four reason codes a short-term-rental host actually faces, what evidence wins each one, and the prevention that stops the unwinnable ones before they start.

## TL;DR

- On Airbnb the platform eats chargebacks. On direct bookings, **you are the merchant of record** — fully exposed.
- Stripe yanks the disputed amount **plus a $15 fee** the moment the dispute opens. The $15 is gone even if you win.
- A cardholder has roughly **120 days** to dispute. You usually get **7 to 21 days** to fight back.
- **Friendly fraud** (the guest stayed, then disputed) is winnable with check-in evidence. **True fraud** almost never is.
- A signed booking agreement, ID match, and smart-lock entry logs are the three pieces of evidence that win.
- **3-D Secure** shifts fraud liability to the bank — turn it on and the stolen-card chargeback stops being yours.

## Why a direct booking exposes you and a platform booking doesn't

When a guest books through Airbnb, Airbnb is the merchant of record. The charge on the guest's statement says Airbnb. If that guest disputes it, the fight is between the guest's bank and Airbnb — and Airbnb has a fraud team, a legal department, and a card-network relationship that absorbs the hit. You hear about it, at most, as a cancelled reservation. The chargeback never touches your bank account.

Go direct — your own website, a Stripe payment link, a card terminal at the door — and that buffer is gone. The charge on the guest's statement now carries *your* descriptor. You are the merchant of record. When the guest disputes, their bank claws the money straight out of your Stripe balance, and you are the one who has to prove the charge was legitimate. This is the single biggest hidden cost of going direct, and it is exactly why the [direct-booking break-even math](/blog/direct-booking-website-math) tells you to price in chargeback risk before you celebrate the saved commission.

Here is the asymmetry that makes it sting. When a chargeback is filed, Stripe immediately debits the full disputed amount from your account **plus a $15 dispute fee**. You don't get a grace period to respond first — the money is gone on day one. If you win the dispute weeks later, Stripe returns the disputed amount. It does **not** return the $15. The fee is the bank's processing cost, and it is yours whether you win or lose. So even a slam-dunk win on a $1,180 booking costs you $15 and roughly an hour of evidence-gathering. A loss costs you $1,195 and the stay.

## The four reason codes a host actually sees

Every chargeback carries a reason code — a card-network label for why the cardholder is disputing. As a rental host you will only ever see four of them, and they are not equally winnable.

| Reason code (Visa) | What the guest claims | Honest win odds |
|---|---|---|
| 13.1 — Services not provided | "I never got the stay I paid for" | High, with check-in evidence |
| 13.3 — Not as described | "The place wasn't what was advertised" | Medium — turns on your listing + photos |
| 13.6 — Credit not processed | "I cancelled and was never refunded" | High, if your policy was e-signed |
| 10.4 — Card-absent fraud | "I never made this charge" (stolen card) | Near zero |

The first three are **friendly fraud** — a real guest who really booked, then disputes anyway. Maybe they forgot the charge, maybe a partner saw the statement, maybe they're trying to claw back money a refund policy doesn't owe them. These are winnable because you have a paper trail: a booking, an agreement, a stay that demonstrably happened.

The fourth, 10.4, is **true fraud**: a stolen card number used to book your place. The legitimate cardholder genuinely never booked, and when they dispute, the card network's rules side with them almost automatically. There is no evidence you can submit that beats "this wasn't me" on a card-absent transaction, because liability for unauthorised card-absent charges sits with the merchant by default. The only thing that moves that liability is 3-D Secure — more on that below.

## Three real disputes, and what each one costs

Numbers make the asymmetry concrete. Here are three disputes a host can realistically catch in a year, with the actual money at stake.

| Scenario | Reason code | Your evidence | Likely outcome | Net cost to you |
|---|---|---|---|---|
| Guest stayed 4 nights, then disputed 38 days later claiming no stay | 13.1 | Signed agreement, smart-lock entry logs, message thread, WiFi connection log | **Win** | $15 fee |
| Stolen card used to book a $800 weekend; real cardholder disputes | 10.4 | None that matters — charge was unauthorised | **Lose** | $815 |
| Guest cancelled inside free window, you refunded 50% per your stricter policy | 13.6 | E-signed cancellation policy, refund record, timestamp | **Win** | $15 fee |

Scenario one is the dispute I lost the first time and won the second — not because the facts changed, but because the second time I had the entry logs. Scenario two is the one you cannot win on evidence; you win it by never accepting the booking in a way that leaves you holding the liability. Scenario three is decided entirely by whether the guest e-signed your cancellation policy before they paid. If they did, the bank sees an agreed contract and rules for you. If your policy lived in a PDF nobody clicked, you lose a fight you should have won.

The pattern: two of these three are won or lost **before the dispute is ever filed** — at booking time, in the evidence you set up to capture. The representment is just where you cash in the preparation.

## The evidence that actually wins a representment

When you fight a chargeback — the formal term is *representment*, you "re-present" the charge to the issuing bank with evidence — you are not arguing with the guest. You are submitting a packet to a bank analyst who has 90 seconds and a checklist. Vague protest loses. Specific, dated, third-party-verifiable proof wins. The four pieces that move the needle:

- **A signed booking agreement.** Not a confirmation email — a document the guest actively agreed to, listing the dates, the total, the property, and the cancellation terms. An e-signature with a timestamp and the guest's IP is gold. This is the single highest-leverage thing you can collect, and you collect it at booking, not after the dispute. The [pre-arrival guest forms](/blog/pre-arrival-guest-forms) workflow is where this lives.
- **Proof the stay happened.** Smart-lock entry logs showing the door opened with the code you sent. WiFi router logs showing a device connected. A keypad access record. These are timestamped, they're hard to fake, and they directly rebut "services not rendered." A guest who disputes a stay they physically entered is contradicted by their own phone joining your network.
- **The communication thread.** The full message history — booking confirmation, check-in instructions, the "thanks, we had a great time" message they sent on checkout. A guest who thanked you on day four and disputed on day forty has handed you the contradiction.
- **The original authorisation data.** The AVS (Address Verification System) result and the CVC match from the moment you charged the card. A matching billing address and CVC tells the bank the cardholder was present at purchase — which undercuts a fraud claim before it starts.

Submit these as a single clear packet with a two-sentence cover summary: *guest booked on X, agreed to terms (attached), physically entered the unit on Y (logs attached), and messaged us on Z. The charge is valid.* Banks reward brevity backed by documents. They ignore essays.

## How to respond — the representment workflow and the clock

The clock is the part hosts get wrong. Two deadlines matter, and they belong to different parties.

First, the guest's window: a cardholder generally has up to **120 days** from the transaction (or from the expected service date) to file the dispute under Visa and Mastercard rules. This is why a chargeback can land more than a month after checkout and feel like it came from nowhere — it's well inside the window.

Second, *your* window: once the dispute is filed, Stripe surfaces a **response deadline, usually 7 to 21 days out**, by which you must submit your evidence. Miss it and you forfeit automatically — no evidence, instant loss. After you submit, the issuing bank takes its time: a ruling can take **60 to 75 days**. So a single dispute can sit open for two to three months while your money sits with the bank.

The workflow, in order:

1. **Don't refund in a panic.** If you refund after a chargeback is already filed, you can end up paying twice — the chargeback *and* the refund — because they run on separate rails. Resolve it on one track or the other, never both.
2. **Read the reason code first.** It tells you which evidence matters. A 13.1 wants entry logs; a 13.6 wants your cancellation policy. Submitting the wrong packet for the code is a wasted shot.
3. **Assemble the packet** — agreement, stay proof, message thread, auth data — and write the two-sentence summary.
4. **Submit before the Stripe deadline**, then wait out the bank's 60-to-75-day ruling.

One nuance worth knowing: Visa's **Compelling Evidence 3.0** rules let a merchant pre-empt a fraud dispute by showing two prior undisputed transactions from the same cardholder, linked by matching data like IP or device. For a host who sees most guests exactly once, that rarely applies — but if you have a repeat guest who disputes, it's a live option.

## Prevention: the disputes you stop before they start

The honest industry win rate on travel-sector representments hovers around **20 to 40 percent**, and the true-fraud ones drag the average down because they're effectively unwinnable. The math says prevention beats litigation every time. Four controls do most of the work:

- **Turn on 3-D Secure.** When a guest authenticates a card-absent payment through 3DS (the bank's "approve this purchase" step), liability for fraud chargebacks **shifts from you to the issuing bank**. That stolen-card scenario you cannot win on evidence? With 3DS, the bank eats it instead of you. For direct bookings this is the highest-value setting you can flip, and Stripe can require it automatically on risky charges.
- **Require AVS and CVC matches.** Reject charges where the billing address or CVC doesn't match. A fraudster with a stolen card number often doesn't have the billing ZIP. This screens out a chunk of true fraud at the door.
- **Make the guest e-sign your terms.** A cancellation and house-rules agreement, actively accepted before payment, converts a "he-said-she-said" 13.6 into a contract the bank can read. No e-signature, no defence.
- **Hold a deposit or pre-authorisation, don't bolt charges on later.** Surprise add-on charges to a card are chargeback bait. Capture a clear deposit up front; if you need to recover damage, that's a conversation, not a silent re-charge. This is also where platform-side protection like [AirCover versus a Booking.com damage deposit](/blog/airbnb-aircover-vs-booking-damage-deposit) earns its keep — going direct means you carry that risk yourself.

The through-line: a chargeback is decided by what you set up at booking, not by how hard you argue afterwards. Capture the agreement, capture the access logs, authenticate the card, and the only disputes you lose are the rare true-fraud ones — which 3-D Secure hands to the bank anyway. Keeping every booking, agreement, and check-in record in one place so you can assemble that packet in ten minutes instead of an evening is exactly the kind of thing a single operational panel is for — [get your reservations and guest records into one view](/onboard) before you need them for a fight.

## FAQ

**Can a guest charge back a vacation rental or direct booking?**
Yes. Any time a guest pays you directly — your own site, a Stripe link, a card terminal — they can dispute that charge with their bank, and you are the merchant of record who has to defend it. On Airbnb or Vrbo the platform is the merchant of record and absorbs the dispute, which is one of the things your commission pays for. Going direct trades that protection for the saved fee.

**Do I lose the money immediately when a chargeback is filed?**
Yes. With Stripe, the disputed amount plus a $15 dispute fee is debited from your balance the moment the dispute opens, before you respond. If you win the representment, Stripe returns the disputed amount — but never the $15 fee. So a win still costs you $15 and your time; a loss costs you the full stay total plus the $15.

**How do I win a chargeback as a host?**
Submit a tight evidence packet to the issuing bank: a booking agreement the guest e-signed, proof the stay happened (smart-lock entry logs, WiFi connection logs, keypad records), the message thread including any checkout thank-you, and the original AVS/CVC match. Match the evidence to the reason code, write a two-sentence summary, and submit before Stripe's deadline. Specific, dated, verifiable documents win; protest essays lose.

**How long does a guest have to dispute a charge?**
Generally up to 120 days from the transaction or the expected service date under Visa and Mastercard rules. That's why a chargeback can arrive more than a month after checkout. Once it's filed, you typically have a much shorter window — 7 to 21 days — to submit your evidence, and the bank's final ruling can take another 60 to 75 days.

**Is 3-D Secure worth turning on for direct bookings?**
For most hosts, yes. When a guest authenticates the payment through 3-D Secure, liability for fraud-related chargebacks shifts from you to the issuing bank. That neutralises the one dispute type you cannot win on evidence — the stolen-card "I never made this charge" claim. The trade-off is a slightly higher checkout friction, but on higher-value bookings that protection is worth it.

**Can I just take a security deposit to avoid chargebacks?**
A deposit helps with damage recovery, not with chargebacks directly — a guest can dispute the deposit charge too. What actually prevents disputes is authenticating the card (3DS, AVS, CVC) and having an e-signed agreement. Take the deposit as a clear, agreed pre-authorisation up front rather than a surprise charge later, because surprise charges are themselves a common chargeback trigger.

**What happens if I refund a guest after they file a chargeback?**
You can end up paying twice. A refund and a chargeback travel on separate rails, so issuing a refund on a charge that's already in dispute can mean the money leaves your account through both. Pick one track: either let the chargeback process resolve it, or — if you agree the guest is owed — resolve it through the dispute, not a parallel refund.

## One opinionated take

The first chargeback you lose teaches you that going direct is not just a commission saving — it's a transfer of risk from the platform to you, and most hosts never price that transfer in. The fix is not to fear direct bookings; it's to treat every direct charge like a transaction you might have to defend in writing two months later. Authenticate the card, make the guest sign something, capture the door logs, and keep it all in one place. Do that and the only chargebacks you ever lose are the true-fraud ones — and 3-D Secure quietly hands most of those to the bank. The host who treats the booking agreement as optional paperwork is the host who funds a stranger's free weekend and pays $15 for the privilege.
