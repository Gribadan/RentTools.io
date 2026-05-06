---
slug: gdpr-for-vacation-rental-hosts
locale: en
title: "GDPR for short-term rental hosts: what you actually need to do"
excerpt: Practical GDPR for short-term rental hosts. Five concrete actions this week: privacy notice, lawful basis, retention, sub-processors, deletion.
status: draft
tags:
  - gdpr:GDPR
  - host-tips:Host tips
  - data-protection:Data protection
ogImageUrl: null
---

# GDPR for short-term rental hosts: what you actually need to do

The first time I read the GDPR text I had been hosting on Airbnb for two months. I closed the tab after twenty pages and went back to collecting passport scans from EU guests in a Telegram folder. Three years later that Telegram folder is the part of my hosting setup I am most embarrassed by.

This is a practical guide for hosts who are not lawyers and do not want to become ones. Five concrete actions to take this week, plus what each one actually means.

## TL;DR

- GDPR applies to you the moment you accept a booking from someone in the EU, even if your apartment is outside the EU. Extraterritorial scope is real.
- You need a privacy notice the guest can read before they share their passport. One sentence at booking time, full text on a /privacy page.
- Your lawful basis is almost always **contract** plus **legal obligation** for guest registration. Not consent.
- Pick a retention period. Write it down. Stick to it. "Until I delete it" is not a period.
- A guest can ask you to delete their data. You need a flow for that. Not a perfect tool, but a flow.

## Does GDPR even apply to me?

If your apartment is in the EU and you rent it out: yes.

If your apartment is outside the EU but you accept guests from EU countries: also yes, because of the GDPR's extraterritorial scope. Article 3(2) extends the regulation to any controller "processing personal data of subjects in the Union" when offering goods or services to them. An Airbnb listing in Tashkent that takes a booking from a Berlin guest is, on paper, processing EU subject data and therefore covered. The European Commission's overview of [who must comply](https://commission.europa.eu/law/law-topic/data-protection/reform/rules-business-and-organisations/application-regulation/who-does-data-protection-law-apply_en) is clear about this; the [European Data Protection Board](https://www.edpb.europa.eu/edpb_en) publishes guidelines aimed at non-EU controllers.

In practice almost no Tashkent host has been fined by an EU data-protection authority. The risk is not enforcement against a small operator outside the bloc. The risk is your platform escalating because a single guest filed a complaint, your account picking up a content warning, and your future bookings declining. That is the realistic threat model. Treat GDPR as platform hygiene more than legal exposure.

There is one exception: hosts inside the EU with an LLC or sole-trader registration. For you the legal exposure is real and an actual fine can land. Read on with that intensity.

## The privacy notice (one sentence, then a page)

Most hosts skip this entirely or copy a template that uses words like "data subject" and "controller" and is unreadable.

The minimum compliant pattern is two layers:

1. **A one-sentence summary at the moment of collection.** When you ask for a passport photo, send a short message: "I keep this until 30 days after your stay, then delete it. Full details: link." Send it before they upload.
2. **A full page at /privacy.** Lists the categories of data, the purpose, the lawful basis, the retention period, and the contact for deletion requests. No legalese. Plain language wins because supervisory authorities now [explicitly prefer it](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en).

Our [/privacy page](/privacy) is the example I think small hosts can copy almost verbatim. It is around 600 words. The key sections:

- What data: passport scan, booking dates, communication history.
- Why: legal guest registration, dispute resolution, stay logistics.
- How long: a specific number of days, not "as needed".
- Who else: the platforms (Airbnb, Booking), and any tooling you use ([RentTools](/onboard), if you use it).
- How to delete: an email address that you actually check.

Skip the disclaimer paragraphs. Skip the "your privacy is important to us" line. Supervisory authorities call that performative. State the facts.

A common mistake: hosts reuse a template designed for an e-commerce shop. Those templates assume cookies, marketing analytics, third-party trackers. Most small hosts have none of that. The simpler the privacy page, the more credible it reads.

*Figure 1: The two-layer notice pattern. Short message at the moment of collection; full /privacy page below. Screenshot pending; will live at /blog/gdpr-for-vacation-rental-hosts/figure-1.png.*

## Lawful basis: contract, legal obligation, almost never consent

Article 6 of the GDPR lists six lawful bases. For short-term rental hosts, exactly two cover almost every case.

1. **Contract performance.** When a guest books your apartment, processing their name, dates, and contact info is necessary to perform the contract. You do not need additional consent. This covers booking-time data.
2. **Legal obligation.** When local law requires guest registration (Spain's parte de viajero, Italy's alloggiati web, France's fiche d'hôtel, Russia's FMS form, Uzbekistan's OVIR), the passport collection sits under "legal obligation". You do not need consent for that either.

What about consent? Consent is the right basis for marketing email, photos for social media use, voluntary loyalty programs. Almost nothing in routine hosting is consent-based, and treating it as if it were creates a problem: under GDPR, consent must be freely given. That means a guest can withdraw it. If you mark passport collection as consent-based, the guest can refuse and you cannot legally rent to them, which means it was never freely given in the first place. This is a known anti-pattern and the EDPB's [guidelines on consent](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en) call it out.

Practical rule: if a guest cannot say no without losing the rental, the basis is contract or legal obligation, not consent. Pick the right one in your privacy notice and you avoid the whole question.

## Retention period: pick a number

Most privacy notices say "as long as necessary". This is technically allowed under GDPR Article 5(1)(e) and practically useless. A supervisory authority will ask: necessary for what, and for how long? You need a number.

Three numbers I have settled on, and the reasoning behind each:

1. **Booking communications: 90 days after checkout.** Long enough to handle a delayed dispute, short enough that you are not hoarding chat logs forever.
2. **Passport scans: 30 days after checkout, unless local law forces longer.** In countries that require multi-year retention (Russia, several EU members), follow the legal requirement. Past that period, delete. The passport scan is the highest-risk piece of data you hold; the shorter the retention, the smaller the breach impact if your phone is stolen.
3. **Aggregated booking history: indefinite.** Names, dates, total revenue. You need this for tax, and tax authorities can come back five years later. Do not keep contact info inside this archive. Strip the email and phone before archiving.

The country-specific retention rules for guest passport data are scattered and inconsistent. I am writing a separate post on the country-by-country table including Spain, Portugal, Italy, France, Greece, Croatia, Russia, and Uzbekistan. Until that lands, default to "shortest period that local law allows" and cross-check with your municipality's tourism office.

The single biggest GDPR mistake I see hosts make is the WhatsApp folder of passport scans that goes back four years because nobody scrolls down to delete the old ones. The folder is the breach. Phone gets stolen, the guest's identity document is in a bad actor's hands, and the host had no business keeping it that long.

## Sub-processors: who else sees the data

A sub-processor is anyone besides you who handles guest data because they help you do the job. Examples:

- The **booking platforms** (Airbnb, Booking, Vrbo). These are joint controllers, not sub-processors. Their privacy policies cover their side.
- Your **PMS or sync tool**. If you use Hostaway, Lodgify, Smoobu, or RentTools, that is a sub-processor. List it.
- Your **cloud hosting**. If you self-host on a droplet, the cloud provider is technically a sub-processor. List it.
- Your **email provider**. The inbox where guests send you scans. Gmail, Outlook, Fastmail. List it.
- A **payment processor**. Stripe, Wise, your bank's merchant portal. List it.

You do not need a signed Data Processing Agreement for most small-host scenarios because the major platforms publish standard terms that apply to you automatically. You do need to list them in your /privacy page so a guest knows where their data flows.

A bad pattern: the privacy notice says "we may share your data with trusted partners". That phrase fails inspection. List the actual partners by name. If you cannot name them, you do not understand your own data flow well enough to operate.

A small adjacent point: the [cleaning module on a small property](/blog/cleaning-schedule-automation) often pulls in another sub-processor (the cleaner's app, if you use one). Cleaners see guest names and check-in times, which counts as personal data. Mention them too.

## The deletion-request flow

Article 17 of the GDPR gives any person the right to request deletion of their data. As a small host you will get one of these maybe once a year. You need a flow.

The flow does not have to be a tool. It has to do three things:

1. **Receive the request.** An email address (host@yourdomain or whatever you publish in /privacy). Not a contact form that goes to spam.
2. **Verify the request.** Match the email to the booking. If a stranger emails asking to delete "John Smith's data" without further detail, ask which booking and from which email it came. The verification step is required by GDPR; you cannot delete data on behalf of an impersonator.
3. **Actually delete.** Email folder cleanup, passport scan delete, calendar entry redact. Walk through each sub-processor and confirm. If the data lives in a tool you do not control (Airbnb's own systems), point the requester there. You cannot delete what is not yours; you can only delete your copy.

You have 30 days to respond under Article 12(3), extendable to 90 days for complex requests. A small-host deletion request is never complex; respond inside a week and you are fine.

Keep a small log: date received, requester, what you deleted, date completed. One row per request. If a supervisory authority ever asks, the log is your evidence the flow exists.

## FAQ

**I host outside the EU. Do I really need this?**
Strictly, yes, the moment you accept an EU guest. Practically, the enforcement risk on a single non-EU host is near zero. The reputational and platform-relationship risk is real. Treat it as platform hygiene, not legal exposure.

**Can I just use Airbnb's privacy policy?**
No. Airbnb is a controller for the data they hold; you are a controller for the data you hold separately (passport copies, direct messages, offline notes). Each controller needs its own privacy notice.

**Do I need a Data Protection Officer?**
For a 1-to-10 property host, almost certainly not. Article 37 lists when a DPO is required: large-scale processing of special categories, public authorities, systematic monitoring on a large scale. None of that applies to a small host.

**What about cookies on my website?**
If you have a personal landing page or a small website, you only need a cookie banner if you set cookies for analytics, advertising, or third-party embeds. A static page with none of those needs no banner. A static page with Google Analytics needs one with granular consent.

**Can I store guest data in Google Drive?**
Technically yes if you list Google as a sub-processor and apply the same retention rules. Practically I would not. Drive is too easy to overshare from. Use a folder you can encrypt at rest and that auto-deletes old files.

**What happens if I get a complaint?**
Most supervisory authorities give you a chance to fix issues before fining. They are not looking for small hosts to make examples of. A polite reply within the 30-day window, evidence that you have a privacy notice and a retention policy, and the fine usually does not happen. The hosts who get fined are the ones who ignore the letter.

## One opinionated take

The single most useful GDPR action a small host can take this week is **write down the retention period and stick to it**. Not the privacy notice (you can copy ours). Not the lawful-basis decision (it is almost always contract or legal obligation). The retention period.

Most small hosts I know are fine on every other axis and underwater on retention because they never picked a number. Pick one. Write it on the /privacy page. Set a calendar reminder for the deletion sweep on the first of every month. Delete what is past retention. The rest of GDPR follows from that one habit.
