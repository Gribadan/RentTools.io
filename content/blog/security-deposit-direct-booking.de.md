---
slug: security-deposit-direct-booking
locale: de
title: "Kaution bei Direktbuchung: reservieren, nicht abbuchen"
excerpt: Eine Kaution bei Direktbuchung ist keine Abbuchung, sondern eine Stripe-Reservierung. Das 7-Tage-Fenster, das sie auffrisst, die richtige Höhe und die Chargeback-Falle.
status: published
tags:
  - host-tips:Gastgeber-Tipps
  - pricing:Preisgestaltung
  - tools:Tools
ogImageUrl: /blog-covers/security-deposit-direct-booking.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Letztes Frühjahr zerbrach ein Gast bei einer Direktbuchung das Glas-Kochfeld — ein Ersatzteil für 190 $ plus eine Stunde Monteur. Ich wollte die Kaution einziehen, die ich mir sicher war, drei Wochen zuvor bei der Buchung reserviert zu haben. Es gab nichts einzuziehen. Die Reservierung war nach sieben Tagen still abgelaufen, zwei Wochen bevor der Gast überhaupt den Schlüssel umdrehte, und ich hatte es nicht bemerkt, weil im Dashboard weiterhin „autorisiert" stand — bis ich hineinklickte und das Kleingedruckte las. Die 190 $ zahlte ich selbst. Der Kautions-Mechanismus hatte genau so funktioniert, wie er gedacht war. Ich hatte nur nicht verstanden, wie er gedacht war.

Das ist der Beitrag, den ich in jener Woche gebraucht hätte: Was eine Kaution bei einer Direktbuchung wirklich ist, warum sie eine Reservierung und keine Abbuchung ist, welches eine Fenster darüber entscheidet, ob sie im richtigen Moment da ist, und wie eine falsch genommene Kaution zu einem Chargeback führt, der mehr kostet als der Schaden.

## TL;DR

- Eine Kaution bei Direktbuchung ist eine **Reservierung (Autorisierung)**, keine Abbuchung — Sie ziehen sie nur ein, wenn etwas kaputtgeht.
- Eine Stripe-Reservierung mit manuellem Einzug **läuft nach 7 Tagen ab**. Setzen Sie sie 1–2 Tage vor dem Check-in, nie bei der Buchung.
- Sie können einen **Teil** einziehen (die echte Reparatur) und den Rest freigeben — aber nie *mehr*, als Sie reserviert haben.
- Reservieren Sie nichts, haben Sie kein Druckmittel; ziehen Sie aggressiv ein, laden Sie sich einen [Chargeback](/blog/chargeback-direct-booking-dispute) ein.
- Bemessen Sie sie am *schlimmsten realistischen Einzelfall* — **200–300 $** für eine normale 1-Zimmer-Wohnung, mehr bei Haustieren oder hochwertigen Objekten.
- Für die meisten kleinen Gastgeber schlagen **Karte hinterlegt** (nur bei Schaden abbuchen) oder eine **nicht erstattbare Schadenspauschale** die Reservierung.

## Warum eine Plattform Sie nie darüber nachdenken ließ

Airbnb hat die gastseitige Kaution 2019 abgeschafft und den Schutz in AirCover überführt — eine vertragliche Erstattung, keine Reservierung, die Sie steuern. Booking.com lässt Sie eine „Kaution" festlegen, doch die Autorisierung läuft über die Schienen der Plattform und wird nach 7–14 Tagen automatisch freigegeben, sofern Sie den Schaden nicht im Extranet melden. So oder so gehört die Zahlungsmechanik nicht Ihnen. [Was jedes Plattform-Modell tatsächlich auszahlt](/blog/airbnb-aircover-vs-booking-damage-deposit), Abschläge für Abnutzung inklusive.

An dem Tag, an dem Sie eine [Direktbuchung](/blog/direct-booking-website-math) annehmen, verschwindet das alles. Kein AirCover, kein Extranet-Knopf, kein Konfliktteam. „Eine Kaution nehmen" ist kein Schalter mehr, sondern etwas, das Sie selbst bauen — meist auf Stripe. Und das Erste, was Sie lernen: Das Wort „Kaution" führt in die Irre. Sie sammeln kein Geld ein. Sie setzen eine Reservierung.

## Eine Reservierung ist keine Abbuchung — und Ihr Gast muss das wissen

Das ist die am meisten missverstandene Mechanik der Direktbuchung, bei Gastgebern wie bei Gästen.

Wenn Sie eine Kaution von 400 $ über einen Zahlungsdienst setzen, lösen Sie eine **Autorisierung** über 400 $ aus. Die Bank prüft, ob die Karte gültig ist und gedeckt, und senkt das verfügbare Limit des Gastes um 400 $. Es bewegt sich kein Geld. Auf Ihrem Konto landet nichts. Es ist eine Reservierung auf seinem Guthaben — wie der Block, den ein Hotel oder eine Tankstelle setzt.

Geld bewegt sich erst, wenn Sie die Autorisierung **einziehen** — und das tun Sie nur bei Schaden. Gibt es keinen Schaden, lassen Sie die Reservierung ablaufen oder stornieren sie, und die 400 $ Spielraum kehren auf die Karte des Gastes zurück. Sie zahlen keine Gebühr, weil nie eine Abbuchung erfolgt ist. Der Prozentsatz von Stripe gilt nur für eingezogene Beträge.

Zwei Dinge beißen hier, wenn Sie die Kommunikation mit dem Gast auslassen:

- **Eine Reservierung ist trotzdem sichtbar.** Auf den meisten Karten erscheint eine Autorisierung über 400 $ als *vorgemerkte* Zeile im Auszug, und das verfügbare Guthaben des Gastes sinkt für die Dauer um 400 $. Für einen ungewarnten Gast liest sich das als „Sie haben mir 400 $ abgebucht". Die Panik-Nachricht um 21 Uhr ist Ihnen sicher. Sagen Sie schriftlich, bevor Sie reservieren, dass es eine erstattbare Reservierung ist und von selbst verschwindet.
- **Bei Debitkarten ist es schlimmer.** Viele Banken behandeln eine Autorisierung auf der Debitkarte als sofortige Abbuchung — sie ziehen die 400 $ real vom Konto und erstatten sie Tage später bei der Freigabe. Für einen Gast, der knapp am Limit lebt, ist das ein echtes Problem. Nehmen Sie Kautionen nach Möglichkeit auf Kreditkarten; bei Debit denken Sie über eine kleinere Reservierung oder eine Pauschale nach.

## Das Sieben-Tage-Fenster, das meine Kaution fraß

Hier ist die Falle, die mich das Kochfeld kostete.

Ein Stripe-PaymentIntent mit manuellem Einzug — der Standardweg, eine Reservierung zu setzen — **bleibt sieben Tage einziehbar**. Ziehen Sie innerhalb dieses Fensters ein, funktioniert es. Lassen Sie das Fenster verstreichen, storniert Stripe die Autorisierung automatisch; die Reservierung ist weg, und es bleibt nichts einzuziehen.

Sehen Sie sich nun den Zeitstrahl einer normalen Buchung an. Ein Gast bucht am 1. für einen Aufenthalt ab dem 22. Setzen Sie die Reservierung bei der Buchung — was sich verantwortungsvoll anfühlt — läuft sie am 8. ab. Zwei volle Wochen vor der Anreise ist Ihre Kaution still verdunstet. Ein Schaden am 23. hat nichts dahinter. Genau das ist mir passiert.

Die Lösung ist eine Disziplin im Timing, keine höhere Kaution:

- **Setzen Sie die Reservierung 1–2 Tage vor dem Check-in.** Spät genug, um den Aufenthalt abzudecken, früh genug, um eine abgelehnte Karte zu erwischen, bevor der Gast an der Tür steht.
- **Ziehen Sie ein (oder geben Sie frei) innerhalb von 48 Stunden nach dem Check-out.** Prüfen, entscheiden, handeln. Lassen Sie die Reservierung nicht bis zum siebten Tag laufen in der Hoffnung, Sie kämen noch dazu.
- **Automatisieren Sie die Erinnerung.** Was auch immer Ihren Kalender führt, sollte Sie am Tag vor der Anreise anstoßen, die Reservierung zu setzen. Es aus dem Gedächtnis zu tun, ist der sichere Weg, das Kochfeld selbst zu bezahlen.

Wenn Ihre Aufenthalte regelmäßig länger als sieben Nächte dauern, kann eine einzelne Reservierung ohnehin nicht den ganzen Aufenthalt abdecken — das Fenster läuft mitten im Aufenthalt ab. Das ist der Fall, in dem die hinterlegte Karte (unten) keine Option mehr ist.

## Wie viel Sie wirklich reservieren sollten

Der Instinkt ist, die Kaution am Wert von allem in der Wohnung zu verankern. Das ist der falsche Anker. Sie ersetzen die ganze Wohnung nie aus einer Kaution, und eine Reservierung, die groß genug für den Versuch ist, verschreckt gute Gäste und stößt an Kartenlimits. Bemessen Sie sie am **schlimmsten realistischen Einzelfall** — an dem, was tatsächlich schiefgeht, nicht an der Katastrophe, für die es Versicherungen gibt.

| Objekttyp | Typischer Einzelschaden | Reservierungshöhe |
| --- | --- | --- |
| Normale 1-Zimmer-Wohnung, keine Tiere | Fleck auf dem Sofa, zerbrochenes Glas, verlorene Schlüssel | 200–300 $ |
| 2–3 Zimmer für Familien | Das Obige plus Gerät, kleine Wandreparatur | 300–500 $ |
| Haustierfreundlich | Teppich, zerkratzte Böden, Grundreinigung | +150–250 $ obendrauf |
| Hochwertig / designorientiert | Markante Möbel, Elektronik, Kunst | 500–1.000 $ |
| Party-Risiko (große Gruppe, Feiertag) | Überbelegung, Lärm-Bußgelder, Party-Reinigung | 1.000–2.000 $ |

Zwei Kalibrierungsregeln. Erstens: Die Kaution sollte Ereignisse **in Selbstbehalt-Größe** locker abdecken — den Fleck für 150 $, das Kochfeld für 190 $ — denn die passieren wirklich und kein Versicherer kümmert sich darum. Zweitens: Halten Sie die Kaution unter etwa **50 % des Buchungswerts** für einen normalen Aufenthalt; darüber lesen Gäste sie als Warnsignal und buchen die Wohnung nebenan, die das nicht verlangt.

## Ziehen Sie genau das ein, was kaputtging — und keinen Cent mehr

Wenn ein Schaden eintritt, ziehen Sie nicht die ganze Reservierung ein. Sie ziehen die Reparatur ein.

Stripe erlaubt einen **Teileinzug** der Autorisierung: 400 $ reserviert, 190 $ für das Kochfeld eingezogen, und die übrigen 210 $ werden automatisch an den Gast freigegeben. Sie können weniger als das Reservierte einziehen, aber **nie mehr** — und das ist der eigentliche Grund, die Reservierung am schlimmsten Fall zu bemessen, nicht am Durchschnitt. Einzug einmal; einen zweiten Biss an derselben Autorisierung gibt es nicht.

Bevor Sie einen einzigen Dollar einziehen:

- **Fotografieren Sie den Schaden mit Zeitstempel**, idealerweise gegen die datierten Check-out-Fotos. Keine datierten Belege, und ein strittiger Einzug wird zum Münzwurf.
- **Nennen Sie die tatsächlichen Kosten** — Teil, Arbeit, Beleg. Eine Kaution ist Erstattung eines echten Verlusts, keine Strafe. 400 $ für eine Reparatur von 190 $ einzuziehen, ist der schnellste Weg, einen Gast zum Bestreiter zu machen.
- **Schreiben Sie zuerst dem Gast** — mit Fotos und Betrag, vor dem Einzug. Die meisten vernünftigen Gäste akzeptieren dokumentierte 190 $. Kaum einer akzeptiert stille 400 $, die er im Auszug entdeckt.

Die Gebühr (≈2,9 % + 0,30 $ in den USA, niedriger bei europäischen Karten) fällt nur auf das Eingezogene an, also kostet der Einzug von 190 $ etwa 5,80 $ — ein Rundungsfehler gegen die Reparatur.

## Die Chargeback-Falle

Hier kann eine Kaution mehr kosten als der Schaden. In dem Moment, in dem Sie eine Autorisierung einziehen, die der Gast bestreitet, sind Sie im Chargeback-Gebiet — und bei einer Direktbuchung **sind Sie der Händler (Merchant of Record)**, voll exponiert. Der Dienst zieht den eingezogenen Betrag plus Gebühr zurück, sobald der Streit eröffnet wird, bevor jemand Ihre Seite liest. Den ganzen [Chargeback-Leitfaden für Direktbuchungen](/blog/chargeback-direct-booking-dispute) habe ich separat geschrieben, doch zwei Punkte zählen speziell für Kautionen:

- Eine eingezogene Kaution, die ein Gast als „das habe ich nicht autorisiert" bestreitet, ist **friendly fraud**, und Sie gewinnen sie nur mit einem unterschriebenen Buchungsvertrag, der die Kaution festhält, datierten Schadensfotos und dem Nachweis, dass der Gast vor Ort war. Haben Sie alle drei vor dem Einzug — oder ziehen Sie nicht ein.
- Schalten Sie **3-D Secure** für die ursprüngliche Zahlung ein. Es verlagert die Betrugshaftung auf den kartenausgebenden Bank und macht den Streit „ich habe das nie gebucht" weit schwerer gegen Sie zu gewinnen.

Die Asymmetrie ist die ganze Lektion: Ein Einzug von 190 $, den Sie nicht verteidigen können, wird zu einer Rückbuchung von 190 $ plus einer Streitgebühr von 15 $ plus Zeit und einer angeschlagenen Streitquote bei Ihrem Dienst. Ziehen Sie nur ein, was Sie beweisen können.

## Die zwei saubereren Alternativen

Für viele kleine Gastgeber ist eine erstattbare Reservierung mehr Reibung und Risiko, als der seltene Schaden rechtfertigt. Zwei Alternativen, die ich heute öfter nutze als die Reservierung selbst:

**Karte hinterlegt, nur bei Bedarf abbuchen.** Statt eine Reservierung zu autorisieren, hinterlegen Sie die Karte des Gastes bei der Buchung (Stripe SetupIntent) mit ausdrücklicher Zustimmung und buchen *off-session* nur ab, falls nach dem Check-out ein Schaden auftaucht. Kein Sieben-Tage-Fenster, keine erschreckende Vormerkung im Auszug, funktioniert für lange Aufenthalte. Der Haken: eine Off-Session-Abbuchung beim abgereisten Gast ist der *anfälligste* Weg für Chargebacks, also muss Ihr Buchungsvertrag das in klarer Sprache erlauben, und Sie brauchen dieselben Fotobelege. Weniger Reibung vorn, mehr Risiko hinten.

**Eine nicht erstattbare Schadenspauschale.** Eine feste Gebühr — typisch 39–75 $ —, die der Gast bei der Buchung statt einer Kaution zahlt und die versehentlichen Schaden bis zu einem Limit abdeckt. Nach diesem Modell läuft Vrbos Property Damage Protection. Gäste bevorzugen es (keine Reservierung, kein Schlag aufs Guthaben), es ist Umsatz statt Verbindlichkeit, und externe Versicherer (Superhog, Waivo und ähnliche) verwalten die Pauschale und zahlen Ansprüche gegen einen Anteil pro Buchung. Sie geben den Abschreckungseffekt einer echten Kaution auf, aber auch die Support-Tickets und die Chargeback-Exposition. Für eine normale Wohnung unter 250 $ pro Nacht spricht die Rechnung meist für die Pauschale.

## Ein durchgerechnetes Beispiel, von Anfang bis Ende

Ein Direktgast bucht 4 Nächte zu 180 $ — 720 $ plus 60 $ Reinigungsgebühr, 780 $ gesamt. Sie legen eine Kaution von 300 $ fest, im unterschriebenen Buchungsvertrag offengelegt.

1. **Bei der Buchung:** Sie buchen die 780 $ für den Aufenthalt ab (3-D Secure an) und hinterlegen die Karte. Die Reservierung setzen Sie **noch nicht**.
2. **Am Tag vor dem Check-in:** Sie setzen eine Autorisierung über 300 $ mit manuellem Einzug. Sie geht durch; der Gast sieht eine Vormerkung über 300 $ und Ihre Nachricht, dass sie erstattbar ist.
3. **Check-out:** Sie prüfen noch am selben Tag. Ein Weinfleck auf dem Teppich braucht eine Reinigung für 40 $.
4. **Sie ziehen 40 $ ein**, schicken dem Gast das Beleg-Foto, und die übrigen 260 $ werden freigegeben. Gebühr auf den Einzug: etwa 1,46 $.
5. **Unterm Strich:** Beim Teppich sind Sie ausgeglichen, der Gast ist 40 $ los, die er akzeptiert, weil er den Beleg sah, und die Reservierung lief ab, wie sie soll — eingezogen, dokumentiert, kein Streit.

Die Version, in der das schiefgeht, ist identisch, außer dass Sie die Reservierung bei der Buchung am 1. gesetzt haben, sie am 8. ablief und am Check-out-Tag keine 300 $ zu berühren waren. Dieselbe Kaution, derselbe Gast, derselbe Fleck — und die 40 $ zahlen Sie selbst. Was es entscheidet, ist nicht die Höhe. Es ist das Timing.

## FAQ

**Kann ich bei einer Direktbuchung über Stripe eine Kaution nehmen?**
Ja. Sie setzen einen PaymentIntent mit manuellem Einzug (eine Reservierung) über den Kautionsbetrag und ziehen ihn nur bei Schaden ein. So handhaben Direktbuchungs-Gastgeber Kautionen ohne Plattform. Die Kaution ist von der Zahlung für den Aufenthalt selbst getrennt.

**Wie lange hält eine Stripe-Reservierung?**
Sieben Tage bei Kartenzahlungen. Danach storniert Stripe die Autorisierung automatisch, und die Reservierung verschwindet. Deshalb setzt man sie ein bis zwei Tage vor dem Check-in, nicht bei der Buchung: eine Wochen im Voraus gesetzte Reservierung läuft ab, bevor der Gast je ankommt.

**Bucht eine Reservierung von der Karte des Gastes ab?**
Bei einer Autorisierung bewegt sich kein Geld. Das verfügbare Limit des Gastes sinkt um den Reservierungsbetrag und eine Vormerkung kann im Auszug erscheinen, aber auf Ihrem Konto landet nichts und keine Gebühr fällt an, bis Sie einziehen. Gibt es keinen Schaden, geben Sie frei und das Guthaben kehrt zurück.

**Wie hoch sollte eine Kaution für eine Ferienwohnung sein?**
Bemessen Sie sie am schlimmsten realistischen Einzelfall, nicht am Wert von allem in der Wohnung. Eine normale 1-Zimmer-Wohnung liegt bei 200–300 $; haustierfreundliche und hochwertige Objekte rechtfertigen mehr. Halten Sie sie unter etwa der Hälfte des Buchungswerts für einen normalen Aufenthalt, sonst lesen Gäste sie als Warnung.

**Was passiert, wenn ich die Reservierung nicht rechtzeitig einziehe?**
Die Autorisierung läuft nach sieben Tagen ab und es bleibt nichts einzuziehen — die Kaution ist schlicht weg, keine Abbuchung beim Gast und kein Geld für Sie. Ist das Fenster verpasst und liegt Schaden vor, ist Ihr einziges Mittel eine neue Off-Session-Abbuchung auf einer hinterlegten Karte, die der Gast leichter bestreitet.

**Kann der Gast eine eingezogene Kaution bestreiten?**
Ja, und bei einer Direktbuchung sind Sie der Händler, also ist der Streit Ihrer. Eine eingezogene Kaution, die der Gast bestreitet, ist friendly fraud; Sie gewinnen sie mit unterschriebenem Buchungsvertrag, datierten Schadensfotos und dem Aufenthaltsnachweis. Ziehen Sie nur ein, was Sie dokumentieren können, und nur die echten Reparaturkosten.

**Ist eine Schadenspauschale besser als eine Kaution?**
Für die meisten kleinen Gastgeber ja. Eine nicht erstattbare Pauschale (39–75 $), die der Gast bei der Buchung zahlt, entfernt die Reservierung, das Sieben-Tage-Fenster und den Großteil des Chargeback-Risikos, und sie ist Umsatz statt Verbindlichkeit. Sie verlieren den Abschreckungseffekt einer echten Kaution, gewinnen aber weit weniger Support-Ärger.

**Kann ich eine Kaution auf einer Debitkarte reservieren?**
Sie können, aber viele Banken behandeln eine Debit-Autorisierung als sofortige Abbuchung und erstatten sie Tage später, was einen knapp kalkulierenden Gast echt drückt. Bevorzugen Sie für Reservierungen Kreditkarten; bei Debit-Gästen nutzen Sie eine kleinere Reservierung, eine Pauschale oder die hinterlegte Karte.

## Eine pointierte Meinung

Für ein normales Objekt unter etwa 250 $ pro Nacht verzichten Sie ganz auf die erstattbare Reservierung. Das Sieben-Tage-Fenster, die panischen Gästenachrichten, die Chargeback-Exposition und der Tag, an dem Sie sie zu setzen vergessen, kosten in Summe mehr als der seltene Schaden, den eine Kaution tatsächlich zurückholt. Heben Sie echte Reservierungen für Haustiere, große Gruppen und hochwertige Objekte auf, wo der Nachteil wirklich groß ist — und hinterlegen Sie für alles andere die Karte, schreiben Sie eine klare Schadensklausel in den Buchungsvertrag und buchen Sie nur ab, wenn etwas kaputtgeht. Wenn Sie Direktbuchungen gerade erst aufsetzen, [bauen Sie zuerst den Rest des Stacks](/onboard); die Kaution ist das Letzte, was man anschraubt, nicht das Erste.
