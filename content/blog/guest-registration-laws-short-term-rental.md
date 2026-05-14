---
slug: guest-registration-laws-short-term-rental
locale: en
title: "Guest registration laws for short-term rentals: a country-by-country guide"
excerpt: What guest data EU short-term rental hosts must collect and report to authorities — Spain, Italy, France, Portugal, Germany — with deadlines and retention rules.
status: published
tags:
  - gdpr:GDPR
  - host-tips:Host tips
  - data-protection:Data protection
ogImageUrl: /blog-covers/guest-registration-laws-short-term-rental.webp
ogImageWidth: 1600
ogImageHeight: 900
---

In December 2024 a host I know in Málaga spent an entire weekend trying to register a French couple in Spain's new SES.HOSPEDAJES portal. The form wanted forty-something fields per guest, including the relationship between the two travellers and the last four digits of the card they paid with. She got it submitted on the third try, twenty hours after check-in, four hours before the legal deadline. She had been hosting on Airbnb for six years and had never heard of the system until the rollout email landed.

That is the gap this post fills. Most hosts know GDPR exists. Almost none know that the same EU that wrote GDPR also runs a parallel set of laws that force you to collect guest ID and *hand it to the police*. Here is the country-by-country reality for the five biggest short-term-rental markets, with the deadlines and retention rules that actually bite.

## TL;DR

- Guest registration law and GDPR pull in opposite directions: one says collect and report, the other says collect as little as possible. You comply with both at once.
- **Spain** is the strictest: SES.HOSPEDAJES, ~40 fields per guest, submit within **24 hours** of check-in, keep records **3 years**.
- **Italy** runs Alloggiati Web — guest data to the Polizia di Stato within **24 hours** of arrival, plus the new CIN code on every listing.
- **France, Portugal, Germany** are lighter: a paper or digital form the guest fills, kept on file and shown to police on request — not proactively uploaded.
- Your lawful basis for all of this is **legal obligation**, not consent. A guest cannot refuse registration and still stay.
- The host's real exposure is not the fine — it is a platform escalation or a blocked listing when a registration number is missing.

## Two laws pulling in opposite directions

If you read [our GDPR guide for hosts](/blog/gdpr-for-vacation-rental-hosts), the whole spirit of that regulation is minimisation: collect the least data you can, keep it the shortest time you can, delete on request.

Guest registration law is the mirror image. It is a national-security and tax-enforcement instrument that long predates GDPR — France's *fiche de police* traces back to the 1940s — and it forces you to collect a passport or ID card, transcribe specific fields, and either upload them to a government system or hold them ready for inspection.

These two laws do not contradict each other, but they feel like they do. The reconciliation is GDPR Article 6(1)(c): processing necessary for compliance with a **legal obligation**. When the law of the country your apartment sits in says "register this guest", GDPR explicitly permits the collection. You do not need consent — and you should not ask for it, because consent can be withdrawn and a legal obligation cannot.

The practical consequence: your privacy notice needs one line that says *"where local law requires guest registration, we collect and submit ID data under legal obligation"*. That single sentence covers everything below.

## Spain: SES.HOSPEDAJES, the strictest of them all

Spain rebuilt its entire system under Royal Decree 933/2021, and after two delays it went mandatory on **2 December 2024**. The portal is SES.HOSPEDAJES, run by the Ministry of the Interior.

What makes Spain brutal is the field count. The old *parte de viajero* was a handful of fields. The new system asks for roughly **40 data points per booking**, including:

- Full ID document data for every guest over 14, including minors travelling with the party.
- The relationship between travellers (spouse, child, colleague).
- Payment data — the payment method, and for cards, partial card details and the holder.
- The contract data: dates, property reference, number of guests.

The deadline is **24 hours from check-in**, and you must keep the records for **three years**. Spain also requires the property itself to be pre-registered in the system before you can file a single guest.

The payment-data requirement is the part hosts hate, and it is the part most likely to be quietly walked back — collecting card details to satisfy a police system is exactly the kind of thing a data-protection authority eventually objects to. Until it changes, the law is the law. Submit what the form asks.

## Italy: Alloggiati Web and the 24-hour clock

Italy's system, Alloggiati Web, is run directly by the Polizia di Stato. Every host — including a single spare room — must request portal credentials from the local *questura* (police headquarters), then submit each guest's data within **24 hours of arrival**. For stays shorter than 24 hours, you submit at the moment of arrival.

The data set is smaller than Spain's: name, date and place of birth, nationality, document type and number. You transcribe it from the passport or ID and upload it, by web form, file upload, or API.

Italy added a second layer in 2024–2025: the **CIN**, the *Codice Identificativo Nazionale*. It is a national listing-identification code that must appear on every advertisement of the property — Airbnb, Booking.com, your own site. No CIN, and the platforms are obliged to suppress the listing. The CIN is separate from Alloggiati Web but lives in the same compliance bucket in a host's head, so treat them as one task.

On top of both: the regional tourist tax (*imposta di soggiorno*), which most municipalities now expect you to collect and remit monthly or quarterly. Three obligations, one country.

## France, Portugal, Germany: the paper-form countries

These three are lighter because the data mostly stays with you instead of going to a government portal in real time.

**France** uses the *fiche individuelle de police* for foreign guests, under article R611-42 of the CESEDA immigration code. The guest fills the form — name, date of birth, nationality, home address, dates, and for non-EU guests their entry details. You keep it for **six months** and hand it over if the police ask. There is no proactive upload for most hosts. Separately, you collect and remit the *taxe de séjour*.

**Portugal** runs the *boletim de alojamento* through the SIBA system. Note the name change: the old SEF border agency was dissolved in October 2023 and its functions moved to AIMA and the PSP/GNR police forces, but SIBA itself still operates. You submit the *boletim* — name, nationality, document, dates — within **three business days** of both check-in and check-out, for foreign guests.

**Germany** uses the *Meldeschein* (registration form) under the Bundesmeldegesetz, §§29–30. The guest signs it on arrival; foreign guests must show ID. You keep the forms for **one year**, then you are obliged to destroy them within three months of that period ending. Like France, it is hold-and-show, not upload. Larger operations also feed the *Beherbergungsstatistik*, the federal lodging statistics.

| Country | System | Deadline | Retention | Upload or hold |
|---------|--------|----------|-----------|----------------|
| Spain | SES.HOSPEDAJES | 24h from check-in | 3 years | Upload |
| Italy | Alloggiati Web | 24h from arrival | Per police guidance | Upload |
| France | Fiche de police | On arrival | 6 months | Hold and show |
| Portugal | SIBA boletim | 3 business days | Per SIBA guidance | Upload |
| Germany | Meldeschein | On arrival | 1 year | Hold and show |

## What this means for your data hygiene

The registration laws change *what* you collect. They do not change the GDPR rules on *how you hold it*. You still need:

1. **A short retention clock per country.** Spain says three years; Germany says one year then destroy. If you host in both, you cannot run one folder with one rule. Tag each scan with its jurisdiction and its delete-by date.
2. **A real delete step.** "Hand it to the police" is not "keep it forever". Once Spain's three years pass, the scan is pure liability — delete it. The single worst pattern is the four-year WhatsApp folder of passports nobody scrolls back to.
3. **One system, not five inboxes.** If a guest files a GDPR access request, you must be able to say exactly what you hold and where. Five email folders and a phone camera roll is not an answer. This is the entire reason [RentTools](/onboard) keeps guest documents in one place with an export button — registration law multiplies your document pile, and a pile you cannot search is a pile you cannot defend.

The work of transcribing forty fields from a passport into a government portal is also the work software is good at. Whatever you use — RentTools, a spreadsheet, a channel manager's add-on — the goal is the same: read the document once, store it once, submit it once, delete it on schedule. For the front half of that flow, see our note on [pre-arrival guest forms](/blog/pre-arrival-guest-forms): collecting the ID before arrival turns a 20-hour scramble into a 5-minute upload.

## FAQ

**Do I have to register guests if I only rent to people from my own country?**
Usually yes, but it varies. Spain and Italy require registration for all guests regardless of nationality. France and Portugal's police forms are aimed primarily at foreign nationals. Germany's Meldeschein covers everyone but the ID-check step is stricter for foreign guests. When in doubt, register everyone — over-collecting for a legal obligation is defensible; under-collecting is not.

**What happens if I miss the deadline?**
Fines exist on paper — Spain's regime allows penalties into the thousands of euros for repeated failures — but the realistic first consequence for a small host is administrative friction: a warning, a request to back-file, or in Italy a suppressed listing if your CIN is missing. The hosts who get fined are the ones who ignore the follow-up letter, not the ones who file a day late once.

**Can a guest refuse to give their passport?**
No, not if they want to stay. Because the basis is legal obligation, not consent, the guest cannot opt out and complete the booking. You should state this in your house rules and your pre-arrival message so it is never a surprise at the door.

**Does Airbnb or Booking.com do this for me?**
No. The platforms collect their own guest data for their own purposes, and in Italy they enforce the CIN display, but they do not file your *parte de viajero* or your Alloggiati Web entry. That submission is the host's legal responsibility, full stop. Anyone telling you the platform handles it is wrong.

**My apartment is outside the EU. Does any of this apply?**
The registration laws above are territorial — they apply to property located in that country. A flat in Tbilisi or Tashkent follows Georgian or Uzbek registration rules instead, which also exist and are often stricter than the EU's. The principle travels even when the specific portal does not: nearly every country has a guest-registration regime.

**How does this square with GDPR's "collect less" rule?**
GDPR's minimisation principle is bounded by what other laws require. If Spanish law mandates 40 fields, collecting those 40 fields is the minimum — you are not over-collecting, you are complying. Where GDPR still bites is everything *around* the registration: don't keep the data past the legal retention period, don't use it for marketing, don't store it somewhere insecure.

**Should I keep a copy of the passport image, or just the transcribed fields?**
Once you have submitted the required fields, the image itself is often no longer legally necessary — and it is the highest-risk thing you hold. Some jurisdictions expect you to retain the document copy; many only need the data. Default to keeping the image for the shortest defensible window, then drop to the transcribed fields only.

**Is there one tool that handles all five countries?**
Not cleanly. A few channel managers integrate with Alloggiati Web and SES.HOSPEDAJES directly; most hosts still file manually. What you can centralise is the *collection* step — one place that holds the guest's ID and the transcribed fields, so the actual portal submission is copy-paste rather than archaeology.

## One opinionated take

The single biggest mistake hosts make with guest registration is treating it as a paperwork chore separate from their data setup. It is not separate. Registration law is the reason your guest-data pile is large, and GDPR is the reason that pile is a liability. The two are the same problem viewed from two governments.

Solve it once: collect the ID before arrival, transcribe the fields into whatever system you use, submit to the portal inside the deadline, and put a delete-by date on every scan the day it lands. Hosts who run that loop spend ten minutes per booking and sleep fine. Hosts who treat each country's portal as a fresh emergency spend a weekend in December, like my friend in Málaga, finding out what SES.HOSPEDAJES wants four hours before the clock runs out.
