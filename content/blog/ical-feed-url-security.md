---
slug: ical-feed-url-security
locale: en
title: "iCal feed URL security: what your calendar link leaks"
excerpt: Your Airbnb and Booking.com iCal export URLs are passwords with no expiry. What each feed actually leaks, how to read yours in 90 seconds, and when to rotate.
status: published
tags:
  - ical:iCal
  - calendar-sync:Calendar sync
  - data-protection:Data protection
  - host-tips:Host tips
ogImageUrl: /blog-covers/ical-feed-url-security.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Eleven months. That is how long my Airbnb calendar export URL sat in a public forum thread, indexed by Google, readable by anyone who scrolled that far. I had pasted the whole thing in to ask why Booking.com wasn't picking up the feed. Someone answered in twenty minutes — my import slot was fine, the URL had picked up a stray space on copy — and I closed the tab. The URL stayed. It is a bearer token with no expiry and no access log, and for eleven months it handed every booked date in one of my apartments to anyone who asked for it.

This is the post about what is actually inside those feeds, how to read your own in about ninety seconds, the five places the URL escapes, and how to rotate it on each platform when it does.

## TL;DR

- An iCal export URL is a password: no expiry, no access log, no revocation.
- Airbnb's feed can carry more than dates. Read yours before assuming.
- Booking.com's export blocks dates only. That is the good case, not the rule.
- The listing ID sits in the URL path, so a leaked feed is attributable.
- Rotating Airbnb's URL takes one click and breaks every subscriber instantly.
- A leaked feed with guest names is a breach on a 72-hour clock.

## The URL is a password, and nobody treats it like one

Every platform that offers calendar export solves authentication the same lazy way: the secret is the URL. Airbnb hands you something shaped like `https://www.airbnb.com/calendar/ical/12345678.ics?s=<32-character token>`. Booking.com hands you `https://admin.booking.com/hotel/hoteladmin/ical.html?t=<token>`. There is no login, no header, no signature, no IP allowlist. Fetch the URL, get the file.

That design is not a bug. It is the only design that works, because the thing on the other end is Booking.com's import worker and it cannot log in as you. The whole [free iCal sync setup](/blog/airbnb-booking-calendar-sync-free) depends on the URL being fetchable by an anonymous machine on a schedule, and the protocol behind it, [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), has no concept of an authenticated subscriber.

Three properties of this token make it worse than a password:

1. **It never expires.** A password you set in 2023 at least prompts you to change it. A feed URL from 2023 still returns a live, current calendar today.
2. **There is no access log.** Airbnb will not tell you that the feed was fetched 400 times last month from an address that is not Booking.com. You cannot detect the leak. You can only assume it.
3. **It is attributable on sight.** That `12345678` in the path is your listing ID. Paste it after `airbnb.com/rooms/` and you get the public listing — photos, neighbourhood, the approximate address. The feed does not have to name you. The URL does.

Point three is what turns a boring list of dates into something worth caring about. A calendar of busy dates in isolation is noise. A calendar of busy dates bound to a specific street in a specific city is an occupancy schedule for a building — including the nights nobody is in it.

## Open your own feed and read it

Stop guessing what your feed contains. It is a plain-text file and you can read it in a browser.

Take your export URL, paste it into the address bar, hit enter. One of two things happens: the browser downloads a `.ics` file, or it renders a wall of text starting with `BEGIN:VCALENDAR`. If it downloads, open it with any text editor — it is text, not a binary. Notepad, TextEdit, VS Code, whatever is closest.

You are looking at a sequence of `VEVENT` blocks, one per blocked range. A single one looks roughly like this:

```
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260803
DTEND;VALUE=DATE:20260809
UID:1a2b3c4d5e6f@airbnb.com
SUMMARY:Reserved
DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMXXXXXXXX
END:VEVENT
```

Now scroll the whole file and ask three questions:

- **Does `SUMMARY` ever contain a name?** On some exports it is a flat `Reserved` or `Not available`. On others it carries a guest's first name, or first name plus last initial.
- **Does `DESCRIPTION` exist at all, and what is in it?** Airbnb has shipped exports where this block carries a reservation link, a confirmation code, and the last four digits of the guest's phone number. Whether yours does depends on the platform, the property type, and the year — which is exactly why you read it instead of trusting a blog post about it.
- **How far back and forward does it run?** Most exports cover roughly 12 months forward. Some carry historical events too, which means the file is not just a forward schedule but an occupancy record.

Ninety seconds. Do it for every feed you have exported, on every platform, before you read the next section.

## What each platform actually puts in the file

Here is what I found in my own exports in July 2026, across two apartments listed on three platforms. Treat it as a starting map, not a specification — these fields have changed before and will change again.

| Platform | Dates | Guest name | Phone / contact | Reservation ID |
| --- | --- | --- | --- | --- |
| Airbnb export | Yes | Sometimes, in `SUMMARY` | Last 4 of phone has appeared in `DESCRIPTION` | Yes, as a hosting URL |
| Booking.com export | Yes | No — `CLOSED - Not available` | No | No |
| Vrbo export | Yes | Commonly, in `SUMMARY` | No | Yes |
| A middle-layer feed you run | Yes | Only if you put it there | Only if you put it there | Only if you put it there |

Booking.com is the well-behaved one. Its export marks ranges busy and says nothing else, which is why an imported Booking feed cannot leak guest details into Airbnb even if you wanted it to. Airbnb and Vrbo are the ones to check.

The asymmetry matters for a practical reason. Hosts think about the feed they **import** — the one that fills their calendar. The risk lives in the feed they **export**, which they set up once, pasted somewhere, and never opened again.

## The five places a feed URL escapes

Every leak I have seen or done myself falls into one of these.

**1. Debugging in public.** This is mine, and it is the most common by a distance. Sync breaks, you post in a host group or a subreddit or a GitHub issue, and the URL goes in because how else will anyone help. The thread outlives the problem by years and Google indexes it. If the page is public and the file is plain text, the *contents* become searchable too — not just the link.

**2. Screenshots.** You screenshot the Sync calendars panel to show a cleaner or a co-host where to click. The export field is on screen, fully expanded, in focus. Blur tools get applied to guest names constantly and to URL fields almost never.

**3. Abandoned tools.** You trialled four channel managers over two years. Each one got the URL pasted into it. Three of those accounts are dormant, one of the companies has since been acquired, and every one of them still holds a working token. Nobody deletes a trial account, and deleting the account is not the same as revoking the token anyway — only rotation is.

**4. Shared calendar apps.** Subscribing Google Calendar to the feed is fine. Setting that Google Calendar to "Make available to public" is not, and it is two clicks away in the same settings pane. The public Google Calendar then republishes your feed at a fresh URL you did not create.

**5. Handing over a property.** Co-host leaves, cleaner leaves, you sell the listing. Every URL you gave them keeps working. There is no offboarding checklist for a string of text somebody once pasted into their own tooling.

## Rotating the URL on each platform

Rotation is the only remedy. There is no "revoke for this one subscriber" anywhere in this ecosystem — the token is all-or-nothing, so rotating breaks every legitimate consumer at the same instant it breaks the illegitimate one. Plan for that before you click.

**Airbnb.** Calendar → pick the listing → Availability → **Sync calendars** → find your export and use **Reset URL**. The old URL stops resolving immediately. Every platform and tool that imports it now has a dead feed, and most will fail silently rather than warn you. Budget fifteen minutes to re-paste the new URL everywhere, and check each destination's "last imported" timestamp the next day.

**Booking.com.** Extranet → Calendar & Pricing → **Sync calendars**. Not every extranet build exposes a reset control on the export. If yours does not, deleting the export and creating a new one gets you a new token; if that path is also missing, partner support can regenerate it, and that ticket is worth filing rather than shrugging. Booking's exports carry the least, but the same URL still discloses your full occupancy.

**Vrbo.** Calendar → Settings → Import/Export. Same pattern: regenerate, then re-paste downstream.

Whatever you rotate, write down where the new URL went. The reason hosts avoid rotating is not the click — it is not knowing which four tools will quietly stop syncing on Thursday. A three-line note in the same place you keep your listing IDs solves that permanently.

After any rotation, re-run the [double-booking checks](/blog/avoiding-double-bookings) for the following 48 hours. A dead import slot looks exactly like a working one until two guests book the same week: Airbnb pulls imported calendars every 2 to 4 hours, Booking.com every 2 to 6, and neither shouts when the fetch returns a 404 instead of a calendar.

## When a leaked feed is a reportable breach

If you host guests from the EU or UK, this stops being tidiness and starts being a legal question with a deadline.

GDPR Article 4(12) defines a personal-data breach to include unauthorised *disclosure of* or *access to* personal data — not only theft, and not only a hack. A feed URL that lands in a public thread is a disclosure. The test that follows is whether the disclosed data is personal data, and the answer depends entirely on what you found when you opened the file.

- **Dates only, no names** (a typical Booking.com export): occupancy of an identifiable property. Weak on its own, but combined with a public listing address it is arguably personal data about you rather than your guests. Document it, rotate, move on.
- **Guest first names, or names plus a reservation code**: personal data, plainly. Article 33 puts you on a 72-hour clock to notify your supervisory authority from the moment you become aware, unless the breach is unlikely to result in a risk to the individuals' rights and freedoms.
- **Names plus contact fragments plus exact stay dates**: this is the combination that makes a risk assessment go the wrong way, because it tells a stranger who is staying where and on which nights.

Two practical notes. Article 33(5) requires you to document every breach and your reasoning, including the ones you decide not to report — a dated paragraph in a file is enough, as long as it exists before anyone asks. And you are the controller here, not Airbnb: the platform gave you an export feature, you chose where to put the URL. [The GDPR basics for hosts](/blog/gdpr-for-vacation-rental-hosts) covers the lawful basis and retention questions sitting underneath this one.

## The feed you export should be one you control

The structural fix is to stop handing out platform-generated tokens at all.

Put a layer you own in the middle. Both platforms import from your feed, and your feed is the only URL that ever gets pasted into a tool, a screenshot, or a forum. Rotation becomes one action instead of four, so you actually do it. The exported file contains exactly the fields you choose to emit — for availability sync that is `DTSTART`, `DTEND`, `UID`, and a `SUMMARY` of `Busy`, nothing that turns a schedule into a dossier. And when a co-host leaves, you rotate one string.

That is a large part of why [RentTools](/onboard) exists in the shape it does: it polls source feeds every 10 minutes, emits a minimal outbound feed per property, and rotates that outbound URL on demand without touching Airbnb's or Booking.com's settings. Self-host it on a $4 droplet or use the hosted instance; either way the token you paste into other people's software is one you can kill.

You still cannot fix the inbound side. Airbnb's export URL exists whether you use it or not, and if you have ever generated one, it is live right now. Rotate that one today, then decide what you export tomorrow.

## FAQ

**Is my Airbnb iCal link private?**
It is unlisted, not private. There is no password on it and no login check — anyone holding the URL gets the file. Airbnb generates a long random token so nobody guesses it, but that protection ends the moment the URL is written down somewhere public. Treat it exactly like a password that you can never see the login history for.

**Can someone see my guests' names from my calendar export link?**
Possibly, and only reading your own file will tell you. Booking.com's export marks dates busy with no guest details at all. Airbnb and Vrbo exports have carried guest first names in the event summary, and Airbnb has shipped exports whose description field included a reservation link and the last four digits of a phone number. Open the file in a text editor and look before you assume.

**How do I reset my Airbnb calendar export URL?**
Go to Calendar, select the listing, open Availability, then Sync calendars. Find the export entry and use Reset URL. The old link dies immediately with no grace period, so have the destinations ready to update in the same sitting.

**Does resetting the URL break my synced calendars?**
Yes, every one of them, instantly and usually silently. The importing platform keeps showing the feed as connected while quietly fetching nothing. After a rotation, paste the new URL into every destination and verify each one's last-imported timestamp the following day rather than trusting the green state.

**Is a leaked iCal URL a GDPR breach I have to report?**
It depends on what the file contains. A dates-only feed with no guest information is a weak case and usually stays an internal note. A feed carrying guest names, or names plus reservation codes and exact stay dates, is a personal-data breach, and Article 33 gives you 72 hours from awareness to notify your supervisory authority unless you can justify that there is no meaningful risk. Either way, write down what happened and what you concluded — documenting every breach is required even when reporting it is not.

**Can Google index my iCal feed?**
The feed itself is rarely crawled, because nothing links to it. The forum post where you pasted the URL absolutely is, and that is the real exposure. Once the page is indexed the link is discoverable by search, and a plain-text calendar behind it can end up cached in ways you cannot clear.

**How often should I rotate the export URL?**
Not on a schedule — on events. Rotate when a co-host or cleaner stops working with you, when you stop using a channel manager or booking tool, when you post the URL anywhere for support, and when you sell or hand over a listing. Calendar-based rotation just creates broken syncs on a timer without matching any actual risk.

**What about the feed my channel manager gives me?**
Same rules, same failure modes, and one extra: a channel manager's outbound feed often aggregates several properties, so a single leaked URL exposes your whole portfolio instead of one apartment. Check whether the tool lets you regenerate that URL yourself. If regeneration requires a support ticket, that is worth knowing before you need it at 23:00 on a Friday rather than after.

## One opinionated take

Assume every platform export URL you have ever generated is already compromised, because you cannot prove otherwise and the platforms give you no way to check. Rotate them all this week, then arrange your setup so the only feed URL that leaves your hands is one you can regenerate yourself in ten seconds.

And when sync breaks and you need help: never paste the URL. Paste the first twenty lines of the file with the tokens and UIDs cut out. Every person capable of diagnosing your problem can do it from the file. The ones who need the live URL are not debugging.
