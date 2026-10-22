---
slug: payout-reconciliation-airbnb-booking-com-vrbo
locale: de
title: "Auszahlungsabgleich: Wurde jede Buchung wirklich bezahlt?"
excerpt: Airbnb, Booking.com und Vrbo zahlen netto, gebündelt und mit Verrechnungen. Ein monatlicher 30-Minuten-Abgleich – und die fünf Lücken, die er findet.
status: published
tags:
  - host-tips:Host-Tipps
  - airbnb:Airbnb
  - booking-com:Booking.com
  - taxes:Steuern
ogImageUrl: /blog-covers/payout-reconciliation-airbnb-booking-com-vrbo.webp
ogImageWidth: 1600
ogImageHeight: 900
---

In meinem ersten Jahr als Gastgeber habe ich eine virtuelle Kreditkarte von Booking.com 41 Tage nach dem Check-out des Gastes wiedergefunden. Drei Nächte, 290 €, nie belastet. Die Karte war inzwischen abgelaufen, der Partner-Support konnte sie nicht reaktivieren, und der Aufenthalt, für den ich geputzt, gewaschen und eine Bewertung geschrieben hatte, brachte mir genau nichts. Mein Kontostand sah die ganze Zeit völlig normal aus – drumherum waren zwölf andere Auszahlungen eingegangen.

Genau das ist das Problem mit „Kontostand geprüft, passt schon“. Die Plattformen zahlen netto, gebündelt, manchmal Wochen später, und sie verrechnen die Erstattung aus diesem Monat stillschweigend mit einem Aufenthalt im nächsten. Ob jede vermietete Nacht bezahlt wurde, erfahren Sie nur, wenn Sie jede Buchung dem Geld zuordnen, das sie eingebracht hat. Für zwei Wohnungen brauche ich dafür 30 Minuten im Monat, und in meinem schlechtesten Monat hat der Abgleich rund 570 $ gefunden.

## TL;DR

- Der Kontostand zeigt nicht, ob jeder Aufenthalt bezahlt ist. Der Abgleich schon.
- Drei Spalten pro Aufenthalt: gebucht (brutto), erwartet (netto), eingegangen.
- Der Abgleichsschlüssel ist die Buchungsnummer – sie steht in jedem Bericht.
- Wöchentlich 10 Minuten für Fristen: virtuelle Karten, Schäden, No-Shows.
- Monatlich 30 Minuten für Beträge, bevor die Booking.com-Abrechnung schließt.
- Meist findet sich nichts. Ein schlechter Monat bezahlt die Gewohnheit für Jahre.

## Warum der Kontostand nicht sagt, ob Sie bezahlt wurden

Ein Kontoauszug ist eine Liste von Überweisungen. Ein Buchungskalender ist eine Liste von Aufenthalten. Eins zu eins passen die beiden fast nie zusammen, und das hat vier Gründe.

**Netto statt brutto.** Airbnb überweist die Gastgeber-Zwischensumme abzüglich der eigenen Gebühr: 3 % beim geteilten Gebührenmodell, rund 15 % beim Modell, in dem nur der Gastgeber zahlt. Payments by Booking.com überweist den Aufenthalt abzüglich 15 % Provision (mit Genius oder Preferred Partner mehr) und einer Zahlungsgebühr von 1,1–3,1 %. Vrbo nimmt ab dem 29. Oktober pauschal 12 %. Den Betrag aus der Buchung überweist Ihnen niemand.

**Gebündelt.** Booking.com zahlt in der Regel monatlich oder zweiwöchentlich aus, eine Überweisung für alle Aufenthalte des Zeitraums. Aus fünf Buchungen wird eine Zeile auf dem Kontoauszug. Fehlt eine davon im Paket, sieht die Summe trotzdem plausibel aus.

**Verrechnet.** Wenn Sie auf Airbnb nach der Auszahlung eine Erstattung genehmigen, schickt Ihnen Airbnb keine Rechnung. Das Geld wird von der nächsten Auszahlung abgezogen – und die kann zu einem anderen Gast, einer anderen Unterkunft oder einem anderen Monat gehören. Dieser Aufenthalt wirkt nun um 45 $ zu niedrig, und der eigentliche Auslöser sieht völlig sauber aus.

**Spät – oder nie.** Beim Modell mit virtueller Kreditkarte von Booking.com bewegt sich kein Geld, bis Sie die Karte selbst belasten. Niemand erinnert Sie daran. Wann jede Plattform Geld freigibt, steht im [Beitrag zu den Auszahlungszeiten](/blog/airbnb-booking-com-payout-timing); der Abgleich ist der Moment, in dem Sie merken, dass dieser Zeitplan nicht eingehalten wurde.

Rechnen Sie noch Währungsumrechnung dazu, und die Differenz zwischen „gebucht“ und „angekommen“ ist nie null – selbst in einem Monat, in dem nichts schiefging.

## Die drei Spalten: gebucht, erwartet, eingegangen

Jeder Aufenthalt bekommt eine Zeile und drei Zahlen.

1. **Gebucht** – der Bruttobetrag der Reservierung: Nachtpreis mal Nächte plus Reinigungsgebühr, vor allen Plattformgebühren. Das, was der Gast gesehen hat.
2. **Erwartet** – was nach dem Anteil der Plattform bei Ihnen ankommen sollte. Diese Zahl berechnen Sie selbst aus der Gebührenstruktur, nicht aus der Auszahlung.
3. **Eingegangen** – was tatsächlich angekommen ist, zugeordnet über die Buchungsnummer, nicht über Datum oder Betrag.

Der Schlüssel ist wichtiger als alles andere. Daten verschieben sich durch Bündelung, Beträge durch Verrechnungen, aber die Buchungsnummer steht in jedem Plattformbericht und in jeder Auszahlungszeile. Erst über die Nummer zuordnen, dann Beträge vergleichen.

So berechnen Sie die Spalte „erwartet“ je Kanal:

| Kanal | Erwartete Auszahlung | Wo die Gebühr auftaucht |
| --- | --- | --- |
| Airbnb, geteilte Gebühr | Gastgeber-Zwischensumme × 0,97 | Spalte Servicegebühr im Transaktions-CSV |
| Airbnb, nur Gastgeber zahlt | Gastgeber-Zwischensumme × 0,85 (eigenen Satz prüfen) | Gleiche Spalte, höherer Betrag |
| Payments by Booking.com | Aufenthalt × (1 − Provision − Zahlungsgebühr) | Verrechnet in der Auszahlungsübersicht |
| Booking.com, virtuelle Karte | Voller Betrag, von Ihnen belastet | Provision wird monatlich separat in Rechnung gestellt |
| Vrbo, Pay-per-Booking | Aufenthalt × 0,88 ab dem 29. Oktober | Vor der Auszahlung abgezogen |
| Direktbuchung über Stripe | Aufenthalt × 0,971 − 0,30 $ (US-Karten) | Saldotransaktionen in Stripe |

Beim Modell mit virtueller Karte ist die Provision kein Abzug, sondern eine eigene Monatsrechnung. Sie bekommt im Abgleich eine eigene Zeile: erwartete gegen berechnete Provision. Dort steckt auch der Großteil der Booking.com-Fehler, wie die [Rechnung zu Provision und Mehrwertsteuer](/blog/booking-com-commission-vat-math) zeigt.

Legen Sie vorab eine Toleranz fest. Ich akzeptiere ±1 Währungseinheit Rundungsdifferenz bei Auszahlungen in derselben Währung und bis zu 3 % bei Auszahlungen mit Umrechnung, weil dort der Wechselkursaufschlag steckt. Wenn Sie diese 3 % stören, zu Recht: Der [Beitrag zur Währungsumrechnung](/blog/airbnb-payout-currency-conversion-fee) erklärt, wie Sie aufhören, sie zu zahlen.

## Woher jede Zahl kommt

Sie brauchen einen Bericht pro Kanal und einen Export aus dem Onlinebanking. Kostenpflichtige Tools sind nicht nötig.

**Airbnb.** Menü → Einnahmen öffnet den Transaktionsverlauf, der sich als CSV exportieren lässt. Nach Auszahlungsdatum für den Monat filtern. Die relevanten Zeilen: *Reservation*-Zeilen enthalten Buchungsnummer, Nächte, Bruttoeinnahmen und Servicegebühr; *Payout*-Zeilen zeigen, welche Buchungen in welcher Überweisung gelandet sind; *Adjustment*- und *Resolution Payout*-Zeilen sind Erstattungen und Schadensersatz. Lesen Sie die Korrekturen zuerst. Sie erklären die meisten scheinbar zu niedrigen Airbnb-Aufenthalte, bevor Sie überhaupt zu suchen beginnen.

**Booking.com.** Im Bereich „Finanzen“ des Extranets liegen drei Dinge: die monatliche **Reservierungsübersicht** (was Booking.com für einen Aufenthalt hält und mit Provision berechnet), die **Rechnungen** (die Provisionsrechnung selbst) und bei Payments by Booking.com die **Auszahlungsübersicht** mit allen Buchungen pro Überweisung. Laden Sie alle drei herunter.

**Vrbo.** Der Zahlungsbericht im Vrbo-Dashboard zeigt pro Buchung Brutto, Gebühren und Auszahlung. Da dies die erste Saison mit der neuen 12-%-Struktur ist, prüfen Sie die Gebührenspalte in der ersten Novemberabrechnung Zeile für Zeile. Warum vor allem Buchungen von vor dem 29. Oktober interessant sind, steht im [Beitrag zur Vrbo-Provision](/blog/vrbo-12-percent-commission-math).

**Direktbuchungen.** Der Saldoverlauf in Stripe zeigt jede Zahlung, ihre Gebühr und die Auszahlung, in der sie gelandet ist. Rückbuchungen und Erstattungen erscheinen als eigene negative Zeilen.

**Die Buchungsliste selbst.** Diese Spalte überspringen die meisten Gastgeber, dabei findet genau sie das fehlende Geld. Plattformberichte zeigen nur Aufenthalte, die die Plattform für bezahlt oder abgerechnet hält. Dass eine Zeile ganz fehlt, sehen Sie nur in einer Liste aller tatsächlich vermieteten Aufenthalte aus allen Quellen. Wenn Ihre Kalender bereits über [RentTools](/onboard) laufen, ist der zusammengeführte Kalender genau diese Liste: alle Reservierungen von Airbnb, Booking.com, Vrbo und direkt, mit Datum und Quelle. iCal-Feeds enthalten keine Preise, die Beträge kommen also weiterhin aus den Plattformberichten. Der Kalender sagt Ihnen, wonach Sie suchen müssen.

## Ein Monat durchgerechnet: zwei Unterkünfte, sechzehn Aufenthalte

Mein Oktober: zwei Wohnungen, Buchungen im Wert von rund 7.600 $. Unterkunft A läuft über Airbnb und Payments by Booking.com. Bei Unterkunft B kommen eine Booking.com-Rate mit virtueller Karte, Vrbo und gelegentliche Direktbuchungen dazu.

| Quelle | Aufenthalte | Erwartet | Eingegangen | Differenz | Ursache |
| --- | --- | --- | --- | --- | --- |
| Airbnb | 7 | 3.259 $ | 3.214 $ | −45 $ | Von mir genehmigte Erstattung, mit späterer Auszahlung verrechnet |
| Payments by Booking.com | 3 | 1.149 € | 1.149 € | 0 | Stimmt |
| Booking.com, virtuelle Karte | 3 | 1.060 € | 676 € | −384 € | Eine Karte nie belastet |
| Provisionsrechnung Booking.com | — | 159,00 € | 194,40 € | −35,40 € | Verkürzter Aufenthalt mit fünf Nächten abgerechnet |
| Vrbo | 2 | 851 $ | 851 $ | 0 | Stimmt, alter Satz, vor dem 29.10. gebucht |
| Direkt, Stripe | 1 | 466 $ | 466 $ | 0 | Stimmt |
| Schadensforderung | — | 120 $ | 0 $ | −120 $ | Brandfleck auf der Arbeitsplatte, noch nicht gemeldet |

Die Differenzen der Reihe nach:

**Die 45 $ bei Airbnb** waren nicht verloren. Beim Gast war der Wasserkocher kaputtgegangen, ich hatte über das Lösungscenter 45 $ Erstattung zugesagt, und Airbnb hat sie von der nächsten Auszahlung abgezogen, die zu einem anderen Aufenthalt gehörte. Die Adjustment-Zeile im CSV hat das in zehn Sekunden erklärt. Status: erklärt, erledigt.

**Die 384 € auf der virtuellen Karte** waren echtes Geld. Drei Nächte in Unterkunft B, Check-out vor 19 Tagen, Karte nie belastet: Der Aufenthalt endete an einem Sonntag, ich sammle Kartenbelastungen für den Montag – und habe es vergessen. Virtuelle Karten von Booking.com bleiben je nach Einstellung etwa 14 bis 30 Tage nach dem Check-out belastbar, ich habe sie also noch am selben Nachmittag mit Puffer belastet. Was zu tun ist, wenn die Belastung abgelehnt wird, steht im [Leitfaden zu virtuellen Karten](/blog/booking-com-virtual-card-declined). Status: zurückgeholt.

**Die 35,40 € Provision** stammen von einer Gästin, die fünf Nächte zu je 118 € gebucht hatte und wegen eines Notfalls in der Familie nach drei abgereist ist. Ich habe 354 € für drei Nächte von der virtuellen Karte abgebucht und die Reservierungsübersicht nicht angefasst. Booking.com hat die Provision auf die ursprünglichen 590 € berechnet: 88,50 € statt 53,10 €. Einen verkürzten Aufenthalt können Sie in der Reservierungsübersicht korrigieren, bevor die Rechnung erstellt wird; die Frist steht im Extranet, und sie ist kurz. Status: rechtzeitig korrigiert.

**Die 120 $ Schadensforderung** tauchten in keinem Bericht auf – genau darum geht es. Auf den Check-out-Fotos meiner Reinigungskraft war ein Brandfleck auf der Arbeitsplatte zu sehen. Eine passende *Resolution Payout*-Zeile gab es nicht, weil ich nie etwas gemeldet hatte. AirCover verlangt die Meldung innerhalb von 14 Tagen nach dem Check-out, und es war Tag 9. Warum datierte Fotos solche Fälle entscheiden, erklärt der [Beitrag zu AirCover](/blog/airbnb-aircover-vs-booking-damage-deposit). Status: gemeldet, drei Wochen später ausgezahlt.

Insgesamt zurückgeholt oder verhindert: rund **570 $**, also 7,5 % des Monats. Das war mein schlechtester Monat. Im typischen Monat findet der Abgleich eine Rundungsdifferenz und sonst nichts, und das ist in Ordnung. Sie gleichen nicht ab, um jeden Monat Geld zu finden. Sie gleichen ab, damit der schlechte Monat auffällt, solange die Fristen noch laufen.

## Die fünf Lücken, die immer wieder auftauchen

In zwei Jahren ist fast jede Differenz in einer von fünf Kategorien gelandet:

1. **Nicht belastete virtuelle Karten.** Die teuerste und häufigste Lücke bei Booking.com. Die Karte läuft ab, und das Geld geht mit.
2. **Nicht korrigierte Reservierungsübersichten.** Verkürzte Aufenthalte, vergessene No-Show-Meldungen, eine Stornierung, die per Nachricht vom Gast kam statt über das Extranet. Booking.com berechnet die Provision auf die Übersicht, so wie sie dasteht. Das 48-Stunden-Fenster für No-Shows steht im [Beitrag zu No-Show-Gebühren](/blog/booking-com-no-show-fee).
3. **Verrechnungen, die wie Verluste aussehen.** Airbnb-Erstattungen und Korrekturen, die von einer fremden Auszahlung abgezogen werden. Das ist kein fehlendes Geld, sondern bereits verbuchtes. Lesen Sie sie zuerst, dann sparen Sie sich 20 Minuten Fehlalarm.
4. **Schäden, die Sie nie gemeldet haben.** Der Abgleich ist der einzige Moment, in dem Sie die Notizen der Reinigungskraft mit dem vergleichen, was gezahlt wurde. Gibt es einen Schaden, aber keine Erstattungszeile, wurde nie etwas gemeldet.
5. **Der falsche Satz.** Eine geänderte Provision (Vrbo in diesem Monat), ein Genius-Rabatt, den Sie für abgeschaltet hielten, die reine Gastgebergebühr auf einer Unterkunft und die geteilte auf der anderen. Die Spalte „erwartet“ findet das; die Spalte „eingegangen“ allein findet es nie.

Und eine seltene, aber unangenehme: eine Auszahlung, die doppelt eingegangen ist. Das passiert, wenn eine Buchung nach der ersten Auszahlung geändert wird. Sie sofort zurückzugeben ist billiger, als sie sich in einem vollen Monat zurückholen zu lassen.

## Der Rhythmus: wöchentlich zehn Minuten, monatlich dreißig

Fristen und Beträge laufen nach unterschiedlichen Uhren, deshalb teile ich die Arbeit.

**Wöchentlich, etwa zehn Minuten, jeden Montag.** Nur was eine Frist hat:

- Jede virtuelle Booking.com-Karte für einen bereits begonnenen Aufenthalt: belastet? (Gültigkeit: etwa 14–30 Tage.)
- Jeder Check-out der letzten 14 Tage mit Schaden in den Notizen der Reinigungskraft: gemeldet?
- Jede Booking.com-Anreise der letzten 48 Stunden, bei der niemand kam: als No-Show markiert?

**Monatlich, etwa dreißig Minuten.** Der vollständige Abgleich über alle drei Spalten. Ich mache ihn in zwei Etappen: die Reservierungsübersicht von Booking.com in den ersten Werktagen des Monats, vor Ablauf der Korrekturfrist, und die Beträge, sobald Mitte des Monats die Booking.com-Auszahlung eingegangen ist. Alles andere – Airbnb, Vrbo, Stripe – gleiche ich in der zweiten Etappe ab.

Bewahren Sie das Ergebnis auf. Ein Tabellenblatt pro Monat, eine Zeile pro Aufenthalt, eine Statusspalte mit vier Werten: *stimmt*, *erklärt*, *zurückgeholt*, *abgeschrieben*. Am Jahresende ist dieses Blatt Ihre Steuerakte. In der EU melden die Plattformen Ihre Einnahmen ohnehin nach [DAC7](/blog/dac7-airbnb-booking-tax-reporting) ans Finanzamt; wer zwölf abgeglichene Blätter hat, beantwortet jede Frage zu einer Zahl aus dieser Meldung in Minuten. Wer keine hat, rekonstruiert das Jahr aus Kontoauszügen.

## FAQ

**Wie gleiche ich Airbnb-Auszahlungen mit meinem Kontoauszug ab?**
Exportieren Sie den Transaktionsverlauf über Menü → Einnahmen als CSV und filtern Sie nach Auszahlungsdatum. Jede Payout-Zeile listet die enthaltenen Buchungen mit Buchungsnummer auf. Ordnen Sie diese Auszahlungen über Betrag und Datum den Überweisungen auf dem Konto zu und prüfen Sie dann Bruttoeinnahmen und Servicegebühr jeder Buchung gegen Ihren erwarteten Wert. Lesen Sie zuerst die Adjustment-Zeilen: Sie erklären die meisten scheinbar zu niedrigen Aufenthalte.

**Warum ist meine Booking.com-Auszahlung niedriger als der Buchungsbetrag?**
Payments by Booking.com zieht vor der Auszahlung die Provision ab, meist 15 % und mit Genius oder Preferred Partner mehr, dazu eine Zahlungsgebühr von 1,1 % bis 3,1 %. Je nach Land kann auf die Provision Mehrwertsteuer anfallen. Ist die Differenz größer als diese drei Posten, prüfen Sie die Reservierungsübersicht auf einen Aufenthalt mit falschem Betrag.

**Was passiert, wenn ich vergesse, eine virtuelle Karte von Booking.com zu belasten?**
Die Karte ist nur für begrenzte Zeit nach dem Check-out belastbar, üblicherweise etwa 14 bis 30 Tage, je nach Einstellung. Danach müssen Sie den Partner-Support um Reaktivierung bitten, und ab einem gewissen Punkt ist das Geld nicht mehr einzuziehen. Eine wöchentliche Prüfung aller virtuellen Karten für begonnene Aufenthalte ist die günstigste Lösung.

**Kann ich die Reservierungsübersicht bei Booking.com korrigieren, wenn ein Gast früher abreist?**
Ja, innerhalb der Korrekturfrist vor der monatlichen Provisionsrechnung. Ändern Sie das Abreisedatum oder den Betrag in der Reservierungsübersicht im Bereich „Finanzen“ des Extranets. Verpassen Sie die Frist, berechnet Booking.com die Provision auf die ursprüngliche Buchung, und Sie müssen den Fall über den Partner-Support klären.

**Wie oft sollten Ferienwohnungs-Vermieter ihre Auszahlungen abgleichen?**
Zweimal, nach zwei Uhren. Wöchentlich etwa zehn Minuten für alles mit Frist: virtuelle Karten, Schadensmeldungen innerhalb von 14 Tagen, No-Shows innerhalb von 48 Stunden. Monatlich etwa dreißig Minuten für die Beträge, abgestimmt auf die Reservierungsübersicht und die Auszahlung von Booking.com. Zwei Unterkünfte mit sechzehn Aufenthalten kosten mich insgesamt rund eine halbe Stunde.

**Brauche ich eine Buchhaltungssoftware für meine Mieteinnahmen?**
Nein. Bis etwa 20 Unterkünfte reicht eine Tabelle mit einer Zeile pro Aufenthalt und drei Betragsspalten: gebucht, erwartet, eingegangen. Entscheidend ist der Abgleichsschlüssel, die Buchungsnummer, die in jedem Plattformbericht steht. Buchhaltungssoftware hilft beim Jahresabschluss, importiert aber auch klaglos eine Auszahlung, in der ein Aufenthalt fehlt.

**Wie lange sollte ich Auszahlungsberichte aufbewahren?**
So lange, wie das Finanzamt das Jahr prüfen kann – in der EU je nach Land üblicherweise fünf bis zehn Jahre, in Deutschland seit 2025 acht Jahre für Buchungsbelege. Die Plattformen melden Ihre Einnahmen nach DAC7 ans Finanzamt, und Ihre eigenen abgeglichenen Unterlagen sind das, womit Sie jede gemeldete Zahl erklären.

## Eine klare Meinung

Gastgeber streiten wochenlang über 3 % Gebührenunterschied zwischen Plattformen und prüfen nie, ob die Plattform überhaupt gezahlt hat. Eine vergessene virtuelle Karte ist eine Gebühr von 100 % auf diesen Aufenthalt. Der Abgleich ist keine Buchhaltung um ihrer selbst willen, sondern die einzige Kontrolle, die Sie über Geld haben, das jemand anderes für Sie einsammelt. Wer dafür keine dreißig Minuten im Monat übrig hat, hat sich nicht für den günstigsten Kanal entschieden. Sondern dafür, es nicht wissen zu wollen.
