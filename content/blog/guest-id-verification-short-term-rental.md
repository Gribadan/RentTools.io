---
slug: guest-id-verification-short-term-rental
locale: en
title: "Guest ID verification for short-term rentals: who checks, who doesn't"
excerpt: Airbnb verifies every guest but never shows you the ID. Booking.com checks nothing. The cost math for screening direct bookings, and how long to keep the scan.
status: published
tags:
  - host-tips:Host tips
  - tools:Tools
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/guest-id-verification-short-term-rental.webp
ogImageWidth: 1600
ogImageHeight: 900
---

In March a guest booked four nights at my smaller Tashkent apartment through the direct-booking page. Plausible name, polite messages, paid in full with a card 36 hours before arrival. Six weeks later Stripe emailed: the cardholder had disputed the charge as unauthorised. The name on the card was not the name on the booking, I had never asked for an ID, and the only evidence I could send the bank was a copy of my house rules. I lost **$480** for the stay, **$15** for the dispute fee, and the **$60** clean I had already paid for.

That booking is why I finally sat down and worked out who verifies a guest's identity on each platform. The answer is lopsided. Airbnb verifies everyone and tells you nothing. Booking.com verifies nobody and says so in your own listing's fine print. On a direct booking, the verifier is you — and most hosts never notice until the chargeback lands.

## TL;DR

- Airbnb checks every guest's government ID before booking. You never see it.
- Booking.com verifies the card, not the person: any name, any email, one card.
- On a direct booking you are the merchant of record. Fraud is your loss alone.
- A document-plus-selfie check is $1.50. One chargeback costs the whole stay.
- Break-even: the check pays off if more than 1 direct booking in 400 is fraud.
- Keep the ID copy only as long as registration law requires, then delete it.

## What each platform actually verifies

Here is what each platform puts between a stranger and your door code.

| Platform | What the guest must provide | What you see | What is left to you |
| --- | --- | --- | --- |
| Airbnb | Legal name, address, phone, government ID, usually a selfie matched to it | "Identity verified" on the profile, first name, reviews | Nothing before booking; in-person ID at check-in if your listing says so |
| Booking.com | Name, email, phone, a card that passes a pre-authorisation | Full name, phone, relay email, sometimes nationality | Everything. The platform has not looked at the person at all |
| Vrbo | Verified email and phone, a card | Name, profile, past reviews | ID check at check-in or via your own pre-arrival form |
| Direct booking | Whatever your form asks | Whatever your form collects | Everything, including the chargeback |

**Airbnb** has required identity verification from guests since 2023, starting with the 35 largest countries — about 90% of bookings at the time — and widening since. A guest uploads a passport, driving licence, or national ID, and in most markets a selfie that Airbnb matches against the document. You, the host, get a verified marker on the profile and nothing else: no document, no date of birth, no address. Airbnb also runs a reservation screen before the booking lands. It looks at the length of the trip, the distance between the guest's home and the listing, whether it is a weekend, how far ahead they booked, and whether the account has positive reviews. That screen is the "anti-party" system Airbnb rolled out in 2022, and it is the reason a one-night Saturday booking from someone 15 km away with no reviews sometimes gets blocked before you ever see it. One more rule that matters: Airbnb prohibits booking on behalf of someone else, outside Airbnb for Work. The verified person is supposed to be the person who arrives.

**Booking.com** verifies the payment instrument and the email address. That is the whole list. A guest can book your apartment under any name they like, with any phone number, as long as the card passes a pre-authorisation. There is no document, no selfie, no screening of the reservation itself. The tell is in your own listing: under **Property → Policies**, Booking.com prints the standard line "Guests are required to show a photo ID and credit card at check-in" into the Important information block. That sentence exists because the platform has decided verification is your job, and it is warning the guest that you will do it. Most apartment hosts never do.

**Vrbo** sits in between. It validates the guest's email and phone and shows you a profile with review history, but as of October 2026 it does not put a government document between the guest and the Book button. Treat a Vrbo guest the way you treat a Booking.com guest.

**Direct bookings** verify exactly what your form verifies. Stripe or PayPal confirm the card is live. 3-D Secure confirms the cardholder authorised the charge. Nothing confirms that the cardholder is the person who will sleep in your bed — unless you ask.

## What a verification catches, and what it never will

An ID check is a narrow tool: very good at four things, useless at three others.

It catches:

1. **True fraud.** A stolen card and a made-up name. The pattern is consistent: the card name does not match the booking name, the booking lands within 48 hours of arrival, three or more nights are paid at once, and the "guest" asks to change the arriving person at the last minute. A document-plus-selfie check stops this at step one, because the thief cannot produce an ID in the cardholder's name.
2. **Underage bookers.** Your minimum age — 18 by default, 21 or 25 if the unit attracts parties — is unenforceable unless somebody looks at a date of birth. Airbnb enforces its own 18+ rule for you; Booking.com and your direct form do not.
3. **Undisclosed third-party bookings.** "It's for my brother, he'll arrive at 8." Fine when it is disclosed. A problem when the person on the hook for the charge is not the person in the unit, because every later dispute starts from "I never stayed there".
4. **Evidence.** The [chargeback playbook](/blog/chargeback-direct-booking-dispute) lists the three pieces of evidence that win a friendly-fraud dispute: a signed booking agreement, an ID that matches the cardholder, and smart-lock entry logs. ID match is the one that proves the person who paid was the person who arrived.

It does not catch:

- A guest with a real ID and bad intentions. Reviews, screening questions, and a party-risk filter do more here than any document.
- The guest who shows a flawless passport at check-in and hands the key to six friends an hour later.
- Damage. An ID check is not a deposit. The [security deposit post](/blog/security-deposit-direct-booking) covers the hold that actually pays for a broken table.

## The cost math for direct bookings

There are three ways to verify a direct guest, and they sit at three price points.

**1. Manual.** Your pre-arrival form asks for a photo of the ID and a selfie holding it. You compare the name to the booking and to the card, the photo to the selfie, and glance at the expiry date. Two to three minutes per guest, roughly an hour a year at 25 direct bookings. It costs nothing, catches the obvious name mismatch, and misses a decent forgery. The GDPR handling is entirely on you.

**2. A verification API.** Stripe Identity lists document verification with selfie matching at **$1.50 per check**; Veriff, Persona, and Onfido sit in the same $1–3 band at small volumes. The guest gets a link, uploads the document, takes the selfie, and the provider tells you pass or fail. At 25 bookings a year that is **$37.50**. It catches forgeries better than you do, it automates the match, and the document sits in the provider's dashboard, where you can delete it on a schedule instead of hunting through a phone.

**3. A bundled screening service.** Truvi (the company that used to be Superhog), Autohost, and Chekin wrap ID verification in a larger product: risk scoring on the reservation, a damage waiver or damage protection, and in Chekin's case the police registration upload for Spain, Italy, and Portugal. List prices move, but expect roughly **$2–6 per reservation** or **$5–15 per listing per month**. If you need registration anyway, this is the cheaper path; if you only need the ID, it is paying for a dashboard you will not open.

Now the number that decides whether any of this is worth it. Take an average direct stay of three nights at $160, so **$480** of revenue. Add the **$15** Stripe dispute fee and the **$60** clean you have already paid. One true-fraud chargeback costs about **$555**. Call it $550.

The check pays for itself when the expected loss per booking exceeds its price:

| Fraud rate on direct bookings | Expected loss per booking | Does a $1.50 check pay? |
| --- | --- | --- |
| 1 in 100 | $5.50 | Yes, by a mile |
| 1 in 300 | $1.83 | Yes |
| 1 in 400 | $1.38 | Borderline |
| 1 in 1,000 | $0.55 | Not on fraud alone |

The break-even is **1 fraudulent booking in about 370**. If you run two listings and take 25 direct bookings a year each, that is one bad booking every seven years. I had mine in year two. Most hosts I have compared notes with land somewhere between 1 in 150 and 1 in 500, which is squarely in "yes".

Two caveats. If you have taken 200 direct bookings without a chargeback, the manual method is fine and the API is a luxury. And yes, 3-D Secure shifts stolen-card liability to the bank, but it covers "unauthorised" disputes only: nothing for "I never stayed there" friendly fraud, the underage booker, or the third-party stay, and many US-issued cards are not enrolled in it at all. 3-D Secure protects the money. The ID check protects the booking.

## When to run the check

Timing is the part hosts get wrong even when they have decided to verify.

Run it **after payment, before the door code**. For me that means within 48 hours of the booking confirmation, and the access code goes out only after the check passes. If the guest fails or stalls, I refund and release the dates. That costs me a relisting and some annoyance. A failed check at check-in costs the night, because now there is a stranger on the doorstep with luggage and you are negotiating at 22:00.

For platform bookings the rule is different:

- **Airbnb:** do not re-verify what Airbnb has already done, unless a registration law requires the data. If you want the in-person check, put "government ID shown at check-in" in your House Rules; Airbnb allows it when it is disclosed before booking.
- **Booking.com and Vrbo:** verify. In person at check-in, as the fine print promises, or through a pre-arrival form 48 hours before arrival if you run self check-in. The [pre-arrival form post](/blog/pre-arrival-guest-forms) has the completion-rate numbers.

If you will not verify everyone, use the three-flag rule: a booking made **less than 48 hours out**, for **three or more nights**, where the **card name does not match the guest name**, always gets checked. Those three flags describe nearly every fraudulent booking I have seen, and they are the same signals Airbnb's own screen weighs.

## What to do with the ID afterwards

This is where the manual method quietly becomes a liability. A passport photo in a WhatsApp thread is personal data, and in the EU and UK it falls under GDPR the moment it arrives on your phone.

Your lawful basis depends on why you collected it. Fraud prevention is a **legitimate interest** under Article 6(1)(f). A guest-registration law is a **legal obligation** under Article 6(1)(c). Say which one applies in a one-paragraph privacy notice on the booking form; the [GDPR post for hosts](/blog/gdpr-for-vacation-rental-hosts) has a template you can lift.

Retention follows the purpose, which is Article 5(1)(e), storage limitation. If you collected the ID against fraud, the thing it protects you from is a chargeback, and a cardholder has roughly **120 days** from the charge to open one. Keeping the copy for four to five months after checkout is defensible. Keeping it for three years "just in case" is not. If a registration law applies, follow that clock instead: Spain's registration decree requires records be kept for **3 years**; Germany's hotel registration form is kept for **one year** and must then be destroyed within three months. Italy wants the data transmitted to the police portal within 24 hours and has no interest in you keeping a copy at all. The [guest registration guide](/blog/guest-registration-laws-short-term-rental) has the per-country detail.

Where to keep it matters as much as how long. Not the camera roll, not the chat app. A folder per month with the deletion date in its name, or the verification provider's dashboard, which keeps the document out of your devices entirely and deletes it with one click. I burned myself here too: for a year my "ID folder" was a WhatsApp chat with my co-host, and the day I audited it there were 40 passports in it going back to a stay that had checked out 14 months earlier.

## The check-in line that does not feel like a border crossing

Guests do not mind showing ID. They mind not knowing why. The line that works for me, sent with the pre-arrival form and repeated at the door:

> Local rules mean I need to see one ID per adult at check-in. It takes 30 seconds, and nothing is copied unless the registration form requires it.

For remote check-in, replace "at check-in" with "before I send the door code", and send the form 3–5 days out, not the night before. A guest who gets the request on the day of arrival reads it as suspicion. The same guest who gets it with the parking instructions four days earlier reads it as procedure.

If your calendar already runs through [RentTools](/onboard), every reservation has a shareable guest-form link. Send it with the confirmation, not the day before arrival: the request lands while the guest is still excited about the booking, not while they are standing in the rain.

## FAQ

**Does Airbnb verify guests' ID?**
Yes. Since 2023, guests booking in the largest 35 countries, and now most markets, must submit a government ID before Airbnb lets them book, usually with a selfie matched to the document. You see an "Identity verified" marker on the profile, never the document itself. You can also require it explicitly under Requirements for guests, which is what makes the check binding for instant-book listings.

**Can I ask an Airbnb guest to show ID at check-in?**
Yes, as long as your listing says so before they book. Airbnb allows hosts to require a government ID in person at check-in when it is disclosed in the House Rules or the listing description. What Airbnb discourages is asking guests to send copies through the message thread. If a registration law requires a copy, collect it through your own form and tell the guest which law.

**Does Booking.com verify guest identity?**
No. Booking.com validates the payment card and the email address and nothing else. The sentence "Guests are required to show a photo ID and credit card at check-in" that Booking.com prints into your listing's fine print exists precisely because the platform leaves verification to the host.

**Is it legal to ask a guest for a copy of their passport?**
In the EU and UK, yes, provided you have a lawful basis and tell the guest what it is. Fraud prevention is a legitimate interest; a guest-registration law is a legal obligation. You cannot keep the copy indefinitely and you cannot use it for anything else. Check your country's registration rules first, because some, Italy among them, want the data transmitted rather than the copy kept.

**How long can I keep a guest's ID copy?**
As long as the purpose lasts. If you collected it against fraud, the chargeback window closes about 120 days after the charge, so delete it four to five months after checkout. If a registration law requires retention, follow its clock: Spain says three years, Germany says one year for the registration form. Write the deletion date on the folder the day you create it.

**What is the cheapest way to verify ID for direct bookings?**
A pre-arrival form with an ID photo and a selfie, compared by eye, costs nothing except two to three minutes per guest. The next step up is Stripe Identity at about $1.50 per check, which handles the document check and the selfie match automatically. Bundled screening services cost more and add risk scoring, damage cover, and in some cases the police registration upload.

**Does ID verification help me win a chargeback?**
It is one of the three pieces of evidence that win friendly-fraud disputes, alongside a signed booking agreement and smart-lock entry logs. A stolen-card dispute where the name on the ID matches the name on the card is winnable. One where you never checked usually is not, because you cannot show the bank who stayed.

**What if the guest refuses to show ID?**
Before check-in: refund and release the dates. A guest who will not identify themselves on a direct booking is exactly the guest the check exists to filter out. At check-in on Airbnb, message through the platform so the refusal is on record, then contact support. On a direct booking, your terms should say that refusing the ID check is a cancellation by the guest, and your refund policy should apply from there.

## One opinionated take

A $1.50 check is not insurance against bad guests. It is the price of making a direct booking as safe as an Airbnb booking, which is the standard your guests already assume you meet. If a platform will not verify the guest for you, and you will not either, you are not running a direct-booking channel. You are running a free trial for anyone with a stolen card.
