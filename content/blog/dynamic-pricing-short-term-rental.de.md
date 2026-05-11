---
slug: dynamic-pricing-short-term-rental
locale: de
title: "Dynamic Pricing für Kurzzeitvermieter: PriceLabs, Wheelhouse, Beyond"
excerpt: Durchgerechneter Vergleich von PriceLabs, Wheelhouse und Beyond Pricing für Kurzzeitvermieter — Gebühren, realer Umsatzhub, Break-even bei 1, 3 und 8 Objekten und die drei Einstellungen, die wirklich zählen.
status: published
tags:
  - host-tips:Host-Tipps
  - pricing:Preise
  - tools:Tools
  - automation:Automatisierung
ogImageUrl: /blog-covers/dynamic-pricing-short-term-rental.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Als ich zum ersten Mal einem Dynamic-Pricing-Tool die Kontrolle über meinen Kalender überließ, hat es meinen Freitagspreis um 34 $ gesenkt — am Tag vor einem ausverkauften Fußballspiel drei Straßen weiter. Das Tool schaute auf den stadtweiten Pickup, die Preishistorie meines Objekts und den Slider „Auslastungsziel", den ich auf Default gelassen hatte. Es schaute nicht auf den Spielplan des Stadions 400 Meter vor meiner Haustür. Ich erwischte es in der Mittagspause, zog den Preis um 58 $ wieder hoch, und das Zimmer wurde an diesem Abend um 21:14 gebucht. Der Hub, den das Tool an den elf Tagen davor unauffällig gegeben hatte, hatte diesen einen Fehler längst überkompensiert — aber genau dieser Fehler ist der Artikel. Dynamic Pricing ist nicht „einrichten und vergessen". Es ist ein Rechner, der drei richtig eingestellte Parameter und ein Paar Augen pro Woche braucht.

Hier kommt der durchgerechnete Vergleich der drei Tools, zwischen denen unabhängige Vermieter wirklich wählen: PriceLabs, Wheelhouse und Beyond. Mit echten Zahlen bei 1, 3 und 8 Objekten, dem Break-even-Hub, den jedes Tool liefern muss, den Einstellungen, die entscheiden, ob Sie nach Monat zwei dabeibleiben, und einer Portfolio-Regel, die sowohl „jeder braucht ein Tool" als auch „Excel reicht" schlägt.

## TL;DR

- Dynamic-Pricing-Tools kosten **15–40 $ pro Objekt pro Monat** (oder 1 % Umsatz) — Break-even liegt bei rund **0,5–1 % Umsatzhub**, unter dem, was jede seriöse Studie meldet.
- **PriceLabs** ist das Tool für Operatoren — granulare Steuerung, 19,99 $/Objekt fix, ab 30+ Objekten auf ~10 $. Richtig für Vermieter, die tunen wollen.
- **Beyond Pricing** ist das „lass es laufen"-Tool — 1 % Buchungsumsatz, brauchbare Defaults, schwache Granularität. Richtig für Eigentümer, die nicht wöchentlich einloggen wollen.
- **Wheelhouse** liegt dazwischen — 1 % Umsatz oder Flat-Tarif; das UI ist das sauberste, die Anpassung leichter als bei PriceLabs.
- Die Stellschrauben, die wirken, sind **Basispreis**, **Mindestpreis** und **Auslastungskurve** — nicht die Marke. Ein falsch konfiguriertes PriceLabs verliert Geld. Ein gut eingestelltes Beyond schlägt beide.
- Unter **2 Objekten** schlägt ein 20-$-Monats-Tool plus ein manueller Veranstaltungskalender Excel nur, wenn Ihre Zeit nichts kostet. Über **5 Objekten** zahlt sich jedes der drei mehrfach aus.
- Jedes Tool braucht **wöchentlich einen menschlichen Blick** — keines weiß vom Stadion, dem Marathon, der lokalen Konferenz oder den Schulferien in dem Land, aus dem der Anreiseflug startet.

## Was die Tools wirklich tun

Lässt man das Marketing weg, machen die drei Plattformen dieselben fünf Dinge mit unterschiedlicher Gewichtung:

1. **Pickup-Daten ziehen** für Ihr Postleitzahlengebiet (wie schnell vergleichbare Listings künftige Termine wegbuchen).
2. **Die Wettbewerbsposition Ihres Objekts schätzen** gegen eine vom Tool automatisch gebildete Peer Group (1–3 Zimmer, ähnliche Ausstattung, gleicher Stadtteil).
3. **Den Nachtpreis anpassen** nach oben oder unten vom Basispreis, Tag für Tag, abhängig von Tagen bis zur Anreise und einem groben Nachfragesignal.
4. **Den Preis pushen** an Airbnb, Booking.com, Vrbo oder einen Channel Manager — alle paar Stunden.
5. **Schutzschienen sichtbar machen** — Mindestpreis, Maximalpreis, Wochentags-Multiplikatoren, Last-Minute-Rabattkurve, LOS-Multiplikatoren — damit das Modell an einem Datum, das Sie besser kennen, keinen Unsinn macht.

Die Unterschiede:

| Funktion | PriceLabs | Wheelhouse | Beyond |
| --- | --- | --- | --- |
| Preismodell | 19,99 $/Objekt/Monat fix (sinkt bei Skala) | 1 % Buchungsumsatz oder Flat-Tier | 1 % Buchungsumsatz |
| Mindestnächte je Wochentag | Ja, granular | Ja | Eingeschränkt |
| Eigene LOS-Multiplikator-Kurven | Ja, voll | Ja | Nur Standardkurve |
| Last-Minute-Rabattkurve | Per Objekt | Per Objekt | 3 Presets |
| Mass-Override-Kalender | Ja | Ja | Ja |
| Marktdashboards (frei) | Ja — auch ohne Abo nützlich | Nein | Nein |
| Hospitable / Hostaway / Smoobu | Ja | Ja | Ja |
| Testphase | 30 Tage | 30 Tage | 30 Tage |
| Kündigung | Per E-Mail, jederzeit | Per E-Mail | Per E-Mail |

Beyond hat eine bekannte Schwachstelle für Studios in dichten Stadtmärkten: Die Peer Group hängt sich zu sehr an Ein-Zimmer-Wohnungen im selben Haus, schraubt damit den „fairen Preis"-Schätzer hoch und kostet Sie leise Auslastung. PriceLabs erlaubt es, Listings aus der Peer Group zu entfernen; Wheelhouse erlaubt Gewichtung; Beyond zeigt diese Einstellung nicht.

## Die Gebührenmathematik bei 1, 3 und 8 Objekten

Annahme: Basisobjekt mit **120 $ ADR**, **70 % Auslastung**, **30 Nächte × 0,70 = 21 gebuchte Nächte/Monat**, **2.520 $ Monatsumsatz**. Echte Zahlen aus einem Lissabonner Studio von mir 2024, gerundet.

| Objekte | Monatsumsatz | PriceLabs (19,99 $/Objekt) | Wheelhouse (1 %) | Beyond (1 %) |
| --- | --- | --- | --- | --- |
| 1 | 2.520 $ | 20 $ | 25 $ | 25 $ |
| 3 | 7.560 $ | 60 $ | 76 $ | 76 $ |
| 8 | 20.160 $ | 160 $ | 202 $ | 202 $ |
| 15 | 37.800 $ | 300 $ (~15 $-Tier) | 378 $ | 378 $ |
| 30 | 75.600 $ | 300 $ (~10 $-Tier) | 756 $ | 756 $ |

Bei einem Objekt ist der Unterschied 5 $/Monat — Rauschen. Bei acht Objekten sind es 42 $/Monat — 504 $/Jahr, relevant. Bei dreißig Objekten ist PriceLabs 456 $/Monat billiger als die Prozentmodelle. Prozent-Tarife treffen genau das Segment, das sie am meisten nutzt. Wheelhouse und Beyond bieten Portfolios ab 20+ einen Flat-Tier auf Anfrage an — fragen Sie; der öffentliche 1-%-Preis ist der Listenpreis.

## Break-even-Hub: Wie viel Umsatz muss das Tool zurückspielen?

Die ehrliche Frage lautet nicht „verdient das Tool mir Geld", sondern „verdient es mir mehr Geld, als ich mit einem vernünftigen Basispreis und einer wöchentlichen manuellen Review gemacht hätte".

Ein Tool, das **20 $/Monat auf 2.520 $ Listingsumsatz** kostet, muss **0,79 % Bruttohub** liefern, um die Abogebühr zu decken — also etwa **20 $ Zusatzbuchung pro Monat** oder **eine zusätzlich gebuchte Wochenendnacht je Quartal** bei einem 60-$-Wochenendaufschlag.

Ein Tool mit **1 % Umsatz** hat Break-even genau beim Hub, den es liefert. Hebt es den Umsatz um 1 %, ist der Vermieter bei null. Es muss also glaubhaft **mehr als 1 %** liefern, damit die Gebühr überhaupt sinnvoll ist — gemessen an einer realen Referenz (manuell + Airbnb Smart Pricing aus), nicht an einem leeren Kalender.

Anbieterstudien melden 10–40 % Hub. Unabhängige Analysen (Host-Foren, AirDNA-Quartalsberichte, eine Rentals-United-Studie 2024 zu 200 Listings mit PriceLabs vs. Kontrollgruppe) zeigen realistische **5–15 %** beim Wechsel von manuell auf dynamisch und **2–6 %** beim Wechsel zwischen Tools. Headline-Werte über 20 % vergleichen meist „Tool an" gegen „Airbnb Smart Pricing an" — eine deutlich schwächere Basis als „vernünftig manuell".

Bei realistischen 8 % Hub auf 2.520 $/Monat sind das **202 $/Monat Neuumsatz**. Minus 20 $ PriceLabs → **182 $/Monat netto**. Minus 1 % Beyond → **177 $/Monat netto**. Bei diesem Hub spielt das Gebührenmodell kaum eine Rolle; der Hub selbst spielt enorm rein.

Bei 2 % Hub (weil der Basispreis bereits nah am richtigen Wert stand und das Modell nur Spitzen einfängt), bringt dasselbe Objekt 30 $ netto bei PriceLabs, 25 $ bei Beyond. Immer noch positiv, deutlich näher am Rauschen. Unter 1 % Hub kippen die Prozentmodelle ins Negative.

## Die drei Einstellungen, die entscheiden

Ich habe Vermieter gesehen, die sechs Monate PriceLabs liefen ließen, „funktioniert nicht" sagten und kündigten — die echte Ursache war ein um 20 % zu niedriger Basispreis und ein um 30 % zu niedriger Mindestpreis. Das Modell machte exakt das, was ihm gesagt wurde. Die Defaults killen die Mathematik.

### 1. Basispreis

Der Basispreis ist der Anker für „durchschnittliche Nachfrage an einem durchschnittlichen Tag". Jede Anpassung läuft von dort. Stellen Sie ihn 10 % zu tief, holt jeder Dollar, den das Modell wieder draufpackt, nur den Preis ein, den Sie manuell sofort gesetzt hätten.

Richtiger Wert: **die höchste Nachtrate, bei der Ihr Listing über die letzten 90 Tage 70 % Auslastung hält, ohne Spitzenwochenenden und Events.** Nicht der Mittelwert — das obere Ende des stabilen Bereichs. Ein Studio, das an fünf nicht-Peak-Dienstagen für 115, 118, 122, 125, 128 $ wegging, hat Basispreis 128 $, nicht 122 $. Von 128 $ aus rabattiert das Modell aggressiv am ruhigen Montag. Von 122 $ aus kann es am vollen Samstag nicht hoch genug heraufmarkieren.

### 2. Mindestpreis

Der Boden, unter den das Tool nicht geht — egal, wie leer der Kalender ist. PriceLabs und Wheelhouse setzen ihn defaultmäßig auf **65–70 % des Basispreises**. Beyond eher auf **60 %**. Der Boden verhindert, dass das Tool an einem Dienstag ein Zimmer für 40 $ verkauft, wenn die Reinigungskraft 35 $ pro Turnover kostet.

Richtiger Wert: **Reinigungsgebühr + Nebenkosten + variable Kosten pro Nacht**, plus 25 % Aufschlag. Für die meisten Stadt-Studios sind das 50–70 $/Nacht. Vermieter, die 80–90 $ setzen, schauen im Nebensaison-Leerstand zu — der Boden blockiert das Aufgreifen von Nachfrage bei 70–78 $.

### 3. Auslastungskurve / Zielwert

Der Schieber, der entscheidet, wie aggressiv das Tool näher am Datum rabattiert. „Push for high occupancy" — schnell senken in den letzten 14 Tagen. „Push for high ADR" — Preise halten, niedrigere Auslastung in Kauf nehmen.

Für unabhängige Vermieter mit 1–5 Objekten ist die Mitte fast immer richtig — weder aggressiver Rabatt noch sturer ADR. Aggressive Auslastung ist richtig für neue Listings, die Review-Tempo brauchen. Sturer ADR ist richtig für gereifte Listings mit starkem Direktbuchungsstrom. Die meisten Objekte liegen in der Mitte.

Die Falle: Jedes Tool stellt das Onboarding auf „high occupancy" voreingestellt — weil der Sales-Case lautet „wir haben einen leeren Kalender gefüllt". Ist Ihr Kalender nicht leer, ändern Sie das am ersten Tag.

## Wo jedes Tool gewinnt

**PriceLabs** gewinnt für Vermieter, die das Listing als Workflow behandeln. Mit der granularen Steuerung sagen Sie dem Modell, dass dieses Objekt vom 15. Juni bis 1. September 7 Mindestnächte hat, dass Sonntag der richtige Tag für 3-Nacht-Minimum ist, dass LOS-Rabatte bei 7-21-28-90 Tagen abgestuft sind, weil so Ihr Wiederkunden-Cluster aussieht. Dazu kommt das kostenlose Marktdashboard auf [pricelabs.co/markets](https://hello.pricelabs.co/) — selbst ohne Abo den Besuch wert. Die zweitbeste freie Marktanalyse nach Airbnbs eigenem Dashboard.

**Beyond** gewinnt bei abwesenden Eigentümern und Vermietern, die das nebenbei machen. Basispreis setzen, eine von drei „Strategien" wählen — Beyond produziert etwas Vertretbares. Es optimiert nicht so wie PriceLabs, fliegt aber auch nicht in die Luft. Für ein Ferienhaus, das 8 Wochen pro Jahr bucht, rechtfertigt der Mehrhub gegenüber manuell die Zeit, die PriceLabs verlangt, kaum. Beyond ist die richtige Wahl.

**Wheelhouse** gewinnt für Vermieter, die das sauberste UI wollen und die Prozentgebühr zahlen können. Es ist von den dreien am einfachsten an einen Teilzeit-Co-Host weiterzugeben. Die Anpassung liegt zwischen PriceLabs und Beyond — genug, um eine Peer Group zu korrigieren, nicht genug für objektgenaue LOS-Kurven. Bei 3–10 Objekten oft die richtige Wahl.

## Wo Excel das Tool schlägt

Es gibt drei Szenarien, in denen ich selbst die Tool-Subscription wieder gekündigt habe, weil ein vernünftiger manueller Plan gewonnen hat:

- **Ein einzelnes Listing in einem gesättigten Markt.** Wenn der Markt so dicht ist (Lissabon-Zentrum im Oktober), dass jedes vergleichbare Listing unabhängig vom Preis voll wird, geht der Hub gegen null — das Listing füllt sich für 100 $ wie für 130 $. Manuell setzen, wöchentlich Pickup beobachten.
- **Ein neues Listing ohne Bewertungen.** Das Modell weiß nicht, dass Ihr Objekt einen 130-$-fair-price hat; es sieht eine Bewertungs-Null-Einheit und setzt 80–90 $. Bis 8–10 Bewertungen schlägt manuell plus „Einführungspreis"-Framing in der Beschreibung das Tool.
- **Ein Listing für Langaufenthalte.** Wenn 70 %+ der Nächte 14+ Tage sind, ist das Tagespreismodell Rauschen — das Tool optimiert die 30 % der Nächte, die um 5 $ schwanken. Nutzen Sie die Corporate-Rate-Mechanik auf Booking.com und sparen Sie sich die Dynamic-Pricing-Gebühr.

Außerhalb dieser drei: Sobald 3 Listings aktiv buchen, liegt der Break-even-Hub so niedrig (<1 %), dass die Frage nicht mehr „brauche ich ein Tool" ist, sondern „welches".

## Was ich heute laufen habe

Drei Listings in Lissabon und Taschkent, alle bei PriceLabs für 19,99 $/Objekt. Ich schaue einmal pro Woche in den Kalender — meist Dienstagabend, zehn Minuten. Ich überschreibe das Modell auf Daten, die ich besser kenne (lokale Konferenz, Marathon, Schulferien in Inbound-Märkten) und lasse den Rest laufen. Im März 2026 habe ich den Basispreis nach achtzehn aufeinanderfolgenden Wochen >85 % Auslastung um 8 % erhöht; das Modell hat sofort nachjustiert, die nächsten zwei Wochen wurden zum höheren Tarif ohne Auslastungsdelle weggebucht. Die Gebühr ist 720 $/Jahr. Der Hub, gemessen an meinem manuellen Baseline von 2023, liegt bei 11–12 % — bei 30.000 $/Jahr pro Listing also mehr als 3.500 $/Jahr Neuumsatz pro Listing. Die Gebühr ist Rundungsfehler.

Wenn RentTools Ihr Ausgangspunkt für den Kalenderabgleich über die Plattformen hinweg ist, ist Dynamic Pricing der nächste logische Layer, sobald die Buchungen stabil laufen. [Starten Sie mit dem Kalenderabgleich](/onboard) und schalten Sie ein Pricing-Tool dazu, wenn Sie 90 saubere Buchungstage haben, mit denen man es füttern kann.

## FAQ

**Funktioniert Airbnbs eigenes Smart Pricing als Dynamic-Pricing-Tool?**

Nein. Airbnb Smart Pricing ist ein Marktbodensignal — es zeigt, was vergleichbare Listings kosten, und drückt Sie ans untere Ende der Spanne. In meinen Listings hat es konstant 15–25 % unter der Rate gepreist, die ich manuell hätte ansetzen können. Es ist das richtige Tool für Vermieter, die harte Auslastungsziele um jeden Preis treffen müssen; es ist das falsche Tool für Umsatz. Schalten Sie es aus und preisen Sie entweder manuell oder lassen Sie ein echtes Dynamic-Pricing-Tool darüber laufen.

**Wie lange muss die Testphase laufen, um eine Aussage treffen zu können?**

Mindestens 60 Tage, mit einem sauberen Basispreis ab Tag eins. Die ersten 30 Tage jeder Testphase spiegeln nur den Übergang von Ihren alten Preisen auf die Sicht des Modells — Buchungen vor der Modellübernahme zählen nicht. Vergleichen Sie das 60–90-Tage-Fenster nach Modellstabilisierung mit derselben Saison im Vorjahr. Ein Hub von 4–8 % bei geringem Aufwand ist ein gutes Ergebnis.

**Sind die 1 % bei Wheelhouse / Beyond auf den Bruttoumsatz oder auf den Hub?**

Auf den Bruttoumsatz. Das Tool nimmt 1 % von jeder Buchung, die es anfasst, nicht 1 % vom Mehrertrag gegenüber manuellen Preisen. Deshalb werden Prozentmodelle bei Skala teuer — bei 75.000 $/Monat Umsatz zahlen Sie 750 $/Monat, egal ob das Tool 12 % oder 2 % Hub geliefert hat. PriceLabs' Fixpreismodell ist die ehrlichere Bepreisung für Vermieter mit starkem Umsatz, aber moderatem Hub.

**Kann ich zwei Tools gleichzeitig laufen lassen?**

Nein. Die Plattformen kämpfen miteinander — eines pusht einen Preis an Airbnb, das andere vier Stunden später einen anderen, und Sie haben einen Monat lang einen Kalender wie ein Stroboskop. Manche Vermieter nutzen PriceLabs nur für das Analytics-Dashboard und Beyond für die tatsächliche Bepreisung — das funktioniert, weil nur eines schreibt. Zwei schreibende Tools gleichzeitig garantieren Doppelbuchungen.

**Was passiert mit meinen Preisen, wenn ich kündige?**

Der Preis auf Airbnb / Booking.com friert auf dem Wert ein, den das Tool zuletzt gepusht hat. Die Plattformen „erinnern" sich nicht an Ihre manuellen Preise von vor sechs Monaten. Vor der Kündigung setzen Sie für die nächsten 90 Tage über das Plattform-UI sinnvolle manuelle Preise und kündigen dann erst. Sonst wachen Sie mit einem Halbjahr 80-$-Wochenenden auf, weil der letzte Push an einem ruhigen Dienstag war.

**Funktioniert das Tool mit Booking.com Genius-Preisen?**

Ja, mit Vorbehalt. Das Tool sieht den von Ihnen gesetzten Preis als Basis; Booking.com legt den Genius-Rabatt (10 % für Genius 1, 15 % für Genius 2) obenauf. Wenn Ihr Tool 120 $ in der Erwartung von 120 $ Umsatz preist, zahlt ein Genius-2-Gast 102 $ und nach Booking.com-Provision bleiben Ihnen 86 $. Manche Tools (PriceLabs) lassen Sie den Genius-Rabatt im Preis berücksichtigen; andere (Beyond) nicht. Bewusst einrichten, nicht zufällig — mehr Details im [Booking.com-Genius-Math-Post](/blog/booking-com-genius-levels-math).

**Funktioniert das Tool für ein Listing als einziges in einem kleinen Dorf?**

Bedingt. Das Modell braucht eine Peer Group von 8+ ähnlichen Listings in vernünftigem Radius, um ein verteidigbares Marktsignal zu erzeugen. In einem Dorf mit ein bis zwei Konkurrenten fällt das Tool auf stadtweite Daten zurück, die hier meist falsch sind. Manuelle Preise mit Saisonkalender (Hoch / Schulter / Niedrig) und Event-Day-Overrides schlagen jedes der drei Tools in diesem Szenario. Sobald Sie selbst 3+ Objekte haben, wird das Tool wieder relevant.

## Eine pointierte Meinung

Die Tools sind commoditisiert. PriceLabs, Wheelhouse und Beyond liegen bis auf 20 % aufeinander beim Hub; die 20 %, die unterschiedlich sind, sind überwiegend nicht „wer ist klüger", sondern „wessen UI passt zu *Ihrem* Workflow". Der Vermieter, der wöchentlich einloggt und tunt, schlägt den Vermieter, der das teurere Tool gekauft und das Dashboard nie geöffnet hat. Nehmen Sie das günstigste Tool, dessen UI Sie tatsächlich benutzen werden, stellen Sie die drei Parameter ab Tag eins richtig ein und tragen Sie einen Dienstagabend-Termin in den Kalender ein, bevor die Testphase endet.
