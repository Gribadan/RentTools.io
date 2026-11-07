---
slug: duplicate-calendar-entry-check
locale: en
title: "Duplicate calendar entry or double booking? Check the source"
excerpt: "Two overlapping calendar bars do not prove two guest bookings. Trace their sources, compare confirmed stays and keep occupied nights protected while you check."
status: published
tags:
  - calendar-sync:Calendar sync
  - host-tips:Host tips
ogImageUrl: /blog-covers/duplicate-calendar-entry-check.webp
ogImageWidth: 1600
ogImageHeight: 900
tldr: |
  - Trace each overlapping entry to the correct listing and original reservation before changing anything.
  - Distinguish two views of one stay, a booking plus a manual hold, and two genuine confirmed bookings.
  - Fix the identified source or connection, then recheck availability and the turnover plan; do not delete a feed to tidy the screen.
---

Two bars cover the same dates in a rental calendar. It is tempting to remove one and make the screen look right. Before doing that, establish what each bar represents: the same stay reaching your view twice, a separate availability restriction, or two actual reservations that cannot both be honoured in the same home.

The distinction determines the next action. A display or import problem calls for tracing records and connections; a real booking conflict needs prompt handling of the reservations. Neither is resolved safely by deleting the first entry that looks redundant.

## Trace both entries to the original records

Start with the correct rentable unit, not just a similar listing name. Open each entry's source where available and compare its platform, arrival, departure and current status with the original booking account. Keep any reservation references in your private working notes. An event title or a colour is a clue, not confirmation of a separate guest.

Airbnb's [calendar-sync guide](https://www.airbnb.com/help/article/99) explains that connected calendars carry booked nights and some availability blocks. Consequently, a closed interval in another calendar should be investigated before being counted as an additional reservation.

Write down the direction of each connection that could supply the interval. Check whether a local reservation record and an imported event describe the same original booking, or whether two feeds are being mistaken for two independent sales. Matching dates alone are not enough: different guests can book the same dates, while one changed reservation can have stale dates in a receiver.

For a technical investigation, the [iCalendar specification's UID section](https://www.rfc-editor.org/rfc/rfc5545#section-3.8.4.7) defines an identifier for a calendar component. Use that as evidence for tracing an event, not as a substitute for checking the booking record. Do not edit identifiers in a feed as a quick fix or publish complete feed URLs in a support request.

**Illustrative comparison:** the original account confirms one stay arriving Tuesday and departing Friday. Two calendar representations cover that same stay. The occupied nights are still Tuesday, Wednesday and Thursday: three nights, not six. This conclusion depends on confirming that there is only one actual booking; it cannot be inferred from the matching bars alone. Check the [departure-day boundary](/blog/ical-checkout-day-blocked) if one view appears to extend the stay.

## Classify what the evidence actually establishes

Use the original records to choose the branch, rather than choosing the branch that makes the calendar easiest to clean up.

| Confirmed evidence | What it means | Next action |
| --- | --- | --- |
| One active booking, represented twice | A duplicate representation of one stay | Trace the records or connection responsible; preserve the occupied nights. |
| Two active bookings for the same unit sharing an occupied night | A genuine reservation conflict | Escalate promptly to the booking owner and the relevant platforms; do not erase either reservation to hide it. |
| One booking and a separate manual closure | A stay plus an availability restriction | Establish why the closure exists before changing it. |

If a source cannot yet be checked, leave the classification unresolved. Do not reopen a known occupied night just because the second entry has an unclear label. The [blocked-date review](/blog/blocked-calendar-dates-not-reservations) helps separate reservations from other restrictions.

## Resolve the right layer, then check the next stay

RentTools imports calendar events by property and platform, using the event identifier during reconciliation. That does not mean every similar-looking entry from different sources is a separate booking, or that arbitrary overlaps can be merged automatically. Check the source relationship before changing a local record.

Do not remove a calendar connection merely to clear the view. Removing a RentTools link also removes that platform's imported events for the property. The screen may look quieter while you have actually removed useful availability evidence. If a connection is wrong, review the [feed-replacement checklist](/blog/replace-calendar-feed-checklist) and protect affected nights while correcting the identified connection.

When an original reservation has changed, compare its current dates with each receiver after the next import. If one view remains stale, investigate that update path rather than creating another guest booking to compensate. Correct only the record or setting whose role you have established; keep a note of what changed so another team member does not repeat the cleanup.

For two genuine bookings, keep both original records visible to the person handling the conflict. Contact the relevant platform support and the affected guests with accurate information as appropriate. This guide does not promise a fee waiver, refund amount or relocation outcome.

Finish by checking the selling calendars and the preparation plan. Confirm the intended occupied nights remain unavailable, unrelated holds remain intact, and the actual departure has one agreed cleaning plan with a named responsible person. Two calendar bars are not a reason to send two cleaners, and a tidier calendar is not proof that the next arrival is ready.
