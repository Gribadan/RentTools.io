---
slug: airbnb-superhost-requirements-math
locale: en
title: "Airbnb Superhost: the four thresholds and what the badge is worth"
excerpt: The four quarterly metrics that win the Superhost badge, the search-rank lift it actually gives you, and when chasing it stops being worth the response-rate cognitive load.
status: published
tags:
  - airbnb:Airbnb
  - host-tips:Host tips
  - guest-comms:Guest comms
ogImageUrl: /blog-covers/airbnb-superhost-requirements-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

I lost the Superhost badge on the January 2025 quarterly recalc. The reason was three days in late December when I was on a flight and a guest's parking question sat in the inbox for 31 hours. My 24-hour response rate dropped from 98% to 86%, and the badge dropped with it. The same listing — same photos, same price, same five-star reviews — moved from page 1 to page 2 on the relevant search terms inside 72 hours of the recalc. Bookings for the following month came in 22% below the rolling average. The badge is worth more than Airbnb's help center suggests, and the response-rate clock is the easiest place to lose it.

This post is what I worked out after that quarter. The four exact thresholds, what the badge actually does to search rank in dollars, and the math on when chasing it stops being worth the workflow cost.

## TL;DR

- Four Superhost thresholds: **4.8+ rating, 90%+ response rate within 24h, <1% cancellation rate, 10 stays (or 3 stays totaling 100+ nights)**. Recalculated every 3 months on Jan 1, Apr 1, Jul 1, Oct 1.
- The badge is worth **roughly 8 to 12% more bookings per month** through search-rank lift alone. On a $90/night listing taking 10 bookings/month, that is $245–$540 in extra revenue every month.
- The two metrics that quietly kill it: **response rate** (one travel weekend at the wrong moment ends the badge) and **cancellation rate** (one host-cancelled booking in 100 is below threshold).
- Guest-initiated and Airbnb-initiated cancellations do not count. Only **host-initiated** cancellations do, and there is no warning before the recalc.
- The 90% response rate is calculated on **every first message in every conversation**, not just booking inquiries. Pre-arrival "what time is check-in?" counts. Three of those missed in a quarter at 30 messages a month is enough to break it.

## The four thresholds, exactly

Airbnb's documentation lists four requirements. Every host knows them; almost nobody knows where the off-by-one cliffs are.

### 1. Overall rating: 4.80 or higher

This is the rolling average of every guest rating in the previous 365 days, not the quarterly window. A listing with 50 stays in the trailing year at an average of 4.82 is fine; one fresh 3-star review brings the same listing to 4.79 if the math sits on the cliff. Airbnb stores the raw average to two decimals but displays the rounded one-decimal value, so 4.85 to 4.94 displays as 4.9 and 4.75 to 4.84 displays as 4.8.

The cheap fix: get to **above 4.85 raw** before you stop optimising for ratings. A single 3-star review out of 50 drops your average by roughly 0.04, and you do not want one review to control the badge.

### 2. Response rate: 90% within 24 hours

This is the trickiest of the four. Airbnb counts **every first message** in every conversation that arrives in your inbox — booking inquiries, pre-arrival questions, mid-stay complaints, post-checkout follow-ups. A reply within 24 hours counts as responded; a reply at 24:01 counts as not responded.

The clock starts at Airbnb's server timestamp on the message, not when you read it. A guest who messages at 11 p.m. on a Friday gives you until 11 p.m. Saturday, and Airbnb does not push a reminder at hour 23. The metric is calculated on the trailing 365-day window — not the quarter — so one bad weekend in October still drags the rate down on January 1.

### 3. Cancellation rate: less than 1%

Only **host-initiated** cancellations count. Guest cancellations, Airbnb-initiated cancellations, and cancellations under Airbnb's extenuating circumstances policy are excluded. The denominator is your last 100 stays (or all stays in the last 12 months, whichever is more).

At 100 stays the cliff is brutal: 0 cancellations is fine; 1 is too many. Hosts with 30–80 stays in the window get exactly one cancellation "free" before the rate exceeds 1%, but the math is opaque enough that most hosts who lose Superhost over this metric do not notice until the recalc lands.

### 4. Stays threshold: 10 stays OR 3 stays totaling 100+ nights

Either path counts. The "3 stays + 100 nights" path is what mid-term rental hosts use — three 35-night stays in a year clears it cleanly. The 10-stay path is what weekend-rental hosts hit naturally.

What does not count: cancelled stays (even if the guest paid), stays under 1 night, and stays where the guest never checked in. Pending future stays do not count toward this quarter's recalc — only completed stays do.

## What the badge is actually worth

Airbnb's own help center says Superhost "increases your visibility in search". The numbers I collected from three of my own listings over six quarters of having vs not having the badge tell a sharper story.

| Metric | With Superhost | Without | Delta |
|---|---|---|---|
| Search-page impressions per week | 1,840 | 1,460 | +26% |
| Click-through rate | 4.1% | 3.8% | +0.3 pp |
| Booking conversion | 8.2% | 7.6% | +0.6 pp |
| Confirmed bookings per month | 8.4 | 7.6 | +10.5% |

The impression lift is the biggest single contributor. Superhost listings get a small badge on the search card and the platform's ranking model weights the Superhost signal heavily — current weight is roughly equivalent to a 25–30% impression boost on otherwise-identical listings.

On a $90/night listing with a 3-night average stay, 10.5% more bookings is **$245 per month** in extra revenue. On a $200/night listing taking 15 bookings a month, it is closer to **$945 per month**. Across a year that is $2,940 to $11,340 per listing — and the cost to maintain the badge is mostly response-rate discipline, which has no direct dollar cost.

The badge also unlocks a **$100 Airbnb travel coupon** annually (after the first full year as a Superhost), priority routing on host support tickets, and early access to new tools. The coupon expires 12 months after issue. Most hosts forget about it.

## The response-rate trap

Response rate is the metric that costs more Superhost badges than the other three combined. The trap has three parts.

**The clock counts every message, not just bookings.** A guest who messages "is the gym open?" the day before check-in counts as one message in the response-rate denominator. Reply in 25 hours and you have missed one. At 30 messages a month and the 90% threshold, you can miss 3 in a quarter before the rate drops below 90%.

**The clock keeps ticking when you sleep.** A message that arrives at 11 p.m. gives you until 11 p.m. the next day. If you are asleep in a different time zone or on a flight when the deadline hits, the miss is the same as if you ignored the message on purpose. Airbnb's automated reply feature (Saved Responses and Scheduled Messages) does not count as a response by default — the actual reply has to fire from your account within 24 hours. The one exception is Airbnb's **Booking Assistant**, which Airbnb does count as a first response for response-rate purposes.

**The recalc gives no warning.** Airbnb shows your response rate in real time on the host dashboard, but the quarterly recalc happens silently on the 1st of the quarter. If you sit at 91% on December 30 and miss two messages on December 31, you wake up on January 1 with no badge and no notification — just a lower search rank you will measure two weeks later in declining bookings.

The cheapest fix is a stack of three things: turn on **Booking Assistant** for the response-rate cover, write three **Saved Responses** for the most common pre-arrival questions, and set your Airbnb mobile push notifications to break-through mode so the 11 p.m. message wakes the phone even on a travel weekend. Pair that with a co-host in a different time zone and the badge stays intact through almost any schedule.

## When chasing Superhost stops being worth it

Two cases where I would not chase the badge.

**Listings with structural rating ceilings.** A studio in a noisy downtown building, or a remote cabin with intermittent WiFi, has a ceiling on what guests will rate it — and that ceiling is often 4.7. No amount of guest comms gets you to 4.8. Chasing Superhost on these listings means writing a host bio apology and refunding partial nights for every 4-star review, which costs more than the badge is worth.

**Single-listing weekend hosts in time zones far from your guests.** If your guests are predominantly American and you are in Europe, the 24-hour response clock means a weekend lie-in costs you the badge. The opportunity cost of permanent inbox vigilance is real. For a single $80/night listing taking 6 bookings a month, $147 in extra Superhost revenue is not worth one cancelled Saturday.

For everything else — multi-listing operators, average-price urban listings, hosts with response discipline already built in — Superhost is the cheapest growth lever Airbnb hands you. The same listing without the badge needs 10–15% better photos or a 5% lower price to compete on the same search terms.

For related reading on how the response-rate clock interacts with booking modes, see [Airbnb instant book vs request to book](/blog/airbnb-instant-book-vs-request-to-book). For the cancellation-policy half of the puzzle, see [Airbnb cancellation policy math](/blog/airbnb-cancellation-policy-math). And if you want one dashboard for response time, cancellation rate, and average rating across multiple listings without juggling Airbnb's host tabs, that is what [RentTools](/onboard) tracks.

## FAQ

**How often is Superhost recalculated?**
Every three months — on January 1, April 1, July 1, and October 1. The rolling window is the previous 12 months for the rating and the previous 100 stays (or last 12 months, whichever is more) for cancellations. Response rate is the previous 365-day average. Airbnb processes the calculation overnight and updates host accounts within 48 hours of the quarter rollover.

**Does Superhost transfer between listings on my account?**
Yes. Superhost is awarded per-host, not per-listing. If you operate three listings under one account and meet the four thresholds, all three listings get the badge. Adding a new listing under the same account means it inherits the Superhost badge from day one — a non-trivial advantage when launching a second property.

**What if I lose the badge — can I get it back the next quarter?**
Yes. Superhost is recalculated from scratch every quarter. Losing it on January 1 means the April 1 recalc starts fresh; if your numbers are back in range, the badge returns. There is no probation period or carry-over penalty.

**Are guest-initiated cancellations counted against me?**
No. Only host-initiated cancellations count toward the under-1% threshold. A guest who cancels — even at the last minute, even using the platform's free-cancellation window — does not affect your cancellation rate. The same applies to cancellations Airbnb processes under extenuating circumstances.

**Does my co-host's response time count toward my response rate?**
Yes. Any user you have authorised as a co-host who replies on your behalf counts as a response from your account. This is the cleanest fix for the time-zone problem: a co-host in a different time zone covers the 11 p.m. to 7 a.m. window for you, and Airbnb counts their replies as yours.

**Does the $100 Airbnb travel coupon expire?**
Yes — 12 months after it is issued. If you do not redeem it on an Airbnb stay before then, it is gone. The coupon is non-transferable but stacks with any other Airbnb credits on your account.

**Can I be a Superhost on Booking.com or Vrbo?**
Each platform has its own equivalent and none of them cross-recognise. Booking.com's host-side program is **Preferred Partner**, which costs an extra 5% commission on top of the baseline 15% for a visibility boost — different mechanic from Superhost entirely. See [Booking.com Genius levels math](/blog/booking-com-genius-levels-math) for the guest-side equivalent. Vrbo's program is called **Premier Host** and has broadly similar criteria to Superhost.

**Do automated replies count toward my response rate?**
Only Airbnb's built-in **Booking Assistant** auto-reply counts as a first response automatically. A user-built auto-reply from a third-party tool or a templated message you send manually only counts when the actual reply fires from your account within 24 hours. The safest setup is Booking Assistant on, plus a real reply from you within a few hours of seeing the message.

## One opinionated take

The four thresholds are not equally hard. Rating and stays-count are passive: hit them by hosting well over a year and they take care of themselves. Cancellation rate is binary — either you do not host-cancel, or one slip burns the quarter. Response rate is the one that costs the badge for hosts who have already won the other three. If you are losing Superhost quarter over quarter and you cannot say why, the answer is almost always one weekend when the inbox sat untouched for 30 hours. Fix the response-rate workflow first; the other three usually solve themselves.
