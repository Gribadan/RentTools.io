---
slug: chargeback-direct-booking-dispute
locale: de
title: "Chargeback bei Direktbuchung: so gewinnen Sie den Zahlungsstreit"
excerpt: Ein Gast hat Ihre Direktbuchung bei der Bank angefochten. Die Reason Codes, die Beweise, die gewinnen, und die 15-€-Gebühr, die Sie in jedem Fall zahlen.
status: published
tags:
  - host-tips:Gastgeber-Tipps
  - pricing:Preisgestaltung
  - booking-com:Booking.com
ogImageUrl: /blog-covers/chargeback-direct-booking-dispute.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Ein Gast checkte aus meiner Wohnung aus, hinterließ eine Fünf-Sterne-Bewertung und focht 38 Tage später die komplette Zahlung über 1.180 € bei seiner Bank an — mit der Begründung „Leistung nicht erbracht". Stripe buchte die 1.180 € noch am selben Nachmittag von meinem Konto ab, plus 15 € Bearbeitungsgebühr, bevor auch nur ein Mensch meine Seite gelesen hatte. In genau diesem Moment lernt man die harte Wahrheit über das Direktgeschäft: Sobald Sie Gäste nicht mehr über Airbnb abrechnen, sind Sie der Händler gegenüber der Bank — und ein Chargeback ist nicht länger das Problem der Plattform. Es ist Ihres, und die Karten sind von vornherein schlecht gemischt.

Das hier ist das Playbook für den Streit, mit dem Sie nicht gerechnet haben. Was ein Chargeback wirklich ist, die vier Reason Codes, die ein Kurzzeitvermieter tatsächlich zu sehen bekommt, welche Beweise jeden einzelnen gewinnen und wie Sie die ungewinnbaren Fälle im Vorfeld abdrehen.

## TL;DR

- Bei Airbnb schluckt die Plattform Chargebacks. Bei Direktbuchungen **sind Sie der Händler** — voll exponiert.
- Stripe zieht die strittige Summe **plus 15 € Gebühr** ein, sobald der Streit eröffnet wird. Die 15 € sind weg, auch wenn Sie gewinnen.
- Der Karteninhaber hat rund **120 Tage** für den Widerspruch. Sie haben meist nur **7 bis 21 Tage** zum Kontern.
- **Friendly Fraud** (Gast hat übernachtet, dann angefochten) gewinnt man mit Einlass-Logs. **Echten Betrug** fast nie.
- Unterschriebener Buchungsvertrag, ID-Abgleich und Smart-Lock-Logs sind die drei Beweise, die gewinnen.
- **3-D Secure** verlagert die Betrugshaftung auf die Bank — einschalten, und das Gestohlene-Karte-Chargeback ist nicht mehr Ihres.

## Warum eine Direktbuchung Sie exponiert und eine Plattformbuchung nicht

Bucht ein Gast über Airbnb, ist Airbnb der Händler gegenüber der Bank. Auf der Kartenabrechnung des Gastes steht „Airbnb". Ficht dieser Gast die Zahlung an, läuft der Streit zwischen seiner Bank und Airbnb — und Airbnb hat ein Betrugsteam, eine Rechtsabteilung und einen Vertrag mit den Kartennetzwerken, der den Schlag abfängt. Sie erfahren davon höchstens als stornierte Reservierung. Das Chargeback berührt Ihr Konto nie.

Gehen Sie direkt — eigene Website, Stripe-Zahlungslink, Kartenterminal an der Tür — ist dieser Puffer weg. Auf der Abrechnung des Gastes steht jetzt *Ihr* Name. Sie sind der Händler. Ficht der Gast an, holt sich seine Bank das Geld direkt aus Ihrem Stripe-Guthaben, und Sie müssen die Rechtmäßigkeit der Zahlung beweisen. Das ist der größte versteckte Preis des Direktgeschäfts, und genau deshalb sagt Ihnen die [Wirtschaftlichkeitsrechnung zur Direktbuchung](/blog/direct-booking-website-math), das Chargeback-Risiko einzupreisen, bevor Sie die gesparte Provision feiern.

Hier ist die Asymmetrie, die wehtut. Wird ein Chargeback eingereicht, bucht Stripe sofort die volle strittige Summe von Ihrem Konto ab **plus 15 € Bearbeitungsgebühr**. Es gibt keine Schonfrist, in der Sie erst antworten dürfen — das Geld ist am ersten Tag weg. Gewinnen Sie den Streit Wochen später, erstattet Stripe die strittige Summe. Die 15 € **nicht**. Die Gebühr sind die Bearbeitungskosten der Bank, und sie gehören Ihnen, egal ob Sie gewinnen oder verlieren. Selbst ein todsicherer Sieg bei einer Buchung über 1.180 € kostet Sie also 15 € und rund eine Stunde Beweissammlung. Eine Niederlage kostet 1.195 € und die Übernachtung.

## Die vier Reason Codes, die ein Gastgeber tatsächlich sieht

Jedes Chargeback trägt einen Reason Code — ein Etikett des Kartennetzwerks dafür, warum der Karteninhaber anficht. Als Vermieter bekommen Sie nur vier davon je zu sehen, und sie sind nicht gleich gut zu gewinnen.

| Reason Code (Visa) | Was der Gast behauptet | Ehrliche Gewinnchance |
|---|---|---|
| 13.1 — Leistung nicht erbracht | „Ich habe die bezahlte Übernachtung nie bekommen" | Hoch, mit Einlass-Beweisen |
| 13.3 — Nicht wie beschrieben | „Die Unterkunft war nicht wie inseriert" | Mittel — hängt an Inserat und Fotos |
| 13.6 — Gutschrift nicht erfolgt | „Ich habe storniert und nie eine Rückzahlung erhalten" | Hoch, wenn die Police signiert wurde |
| 10.4 — Betrug ohne Kartenpräsenz | „Diese Zahlung habe ich nie getätigt" (gestohlene Karte) | Nahezu null |

Die ersten drei sind **Friendly Fraud** — ein echter Gast, der wirklich gebucht hat und trotzdem anficht. Vielleicht hat er die Zahlung vergessen, vielleicht sah der Partner die Abrechnung, vielleicht versucht er, Geld zurückzuholen, das ihm die Stornopolice nicht schuldet. Diese Fälle gewinnt man, weil es eine Papierspur gibt: eine Buchung, einen Vertrag, eine Übernachtung, die nachweislich stattfand.

Der vierte, 10.4, ist **echter Betrug**: Ihre Wohnung wurde mit der Nummer einer gestohlenen Karte gebucht. Der rechtmäßige Karteninhaber hat tatsächlich nie gebucht, und ficht er an, stehen die Regeln des Kartennetzwerks fast automatisch auf seiner Seite. Es gibt keinen Beweis, der bei einer Zahlung ohne Kartenpräsenz das „Das war ich nicht" schlägt, weil die Haftung für unautorisierte kartenlose Zahlungen standardmäßig beim Händler liegt. Das Einzige, was diese Haftung verschiebt, ist 3-D Secure — dazu gleich mehr.

## Drei echte Streitfälle und was jeder kostet

Zahlen machen die Asymmetrie greifbar. Hier sind drei Streitfälle, die ein Gastgeber im Jahr realistisch einfangen kann, mit dem Geld, das wirklich auf dem Spiel steht.

| Szenario | Reason Code | Ihre Beweise | Wahrscheinlicher Ausgang | Netto-Verlust |
|---|---|---|---|---|
| Gast übernachtet 4 Nächte, ficht 38 Tage später an, er habe nie gewohnt | 13.1 | Signierter Vertrag, Smart-Lock-Logs, Chatverlauf, WLAN-Verbindungslog | **Sieg** | 15 € Gebühr |
| Gestohlene Karte bucht ein Wochenende für 800 €, echter Inhaber ficht an | 10.4 | Keine, die zählen — Zahlung war unautorisiert | **Niederlage** | 815 € |
| Gast storniert im Gratisfenster, Sie erstatten 50 % nach Ihrer strengeren Police | 13.6 | Signierte Stornopolice, Erstattungsbeleg, Zeitstempel | **Sieg** | 15 € Gebühr |

Szenario eins ist der Streit, den ich beim ersten Mal verloren und beim zweiten gewonnen habe — nicht weil sich die Fakten änderten, sondern weil ich beim zweiten Mal die Einlass-Logs hatte. Szenario zwei gewinnt man nicht über Beweise; man gewinnt es, indem man die Buchung gar nicht erst so annimmt, dass die Haftung bei Ihnen bleibt. Szenario drei entscheidet sich allein daran, ob der Gast Ihre Stornopolice vor der Zahlung signiert hat. Hat er das, sieht die Bank einen vereinbarten Vertrag und entscheidet für Sie. Lag Ihre Police in einem PDF, das niemand angeklickt hat, verlieren Sie einen Kampf, den Sie hätten gewinnen müssen.

Das Muster: Zwei der drei werden **gewonnen oder verloren, bevor der Streit überhaupt eingereicht wird** — zum Buchungszeitpunkt, in den Beweisen, deren Erfassung Sie eingerichtet haben. Das Anfechten ist nur der Moment, in dem Sie die Vorbereitung einlösen.

## Welche Beweise eine Anfechtung wirklich gewinnen

Wenn Sie ein Chargeback anfechten (der Fachbegriff ist *Representment* — Sie reichen die Zahlung der ausstellenden Bank erneut mit Beweisen ein), streiten Sie nicht mit dem Gast. Sie reichen ein Dossier bei einem Bankanalysten ein, der 90 Sekunden und eine Checkliste hat. Vager Protest verliert. Konkrete, datierte, von Dritten überprüfbare Belege gewinnen. Die vier Bausteine, die den Ausschlag geben:

- **Ein signierter Buchungsvertrag.** Keine Bestätigungs-E-Mail — ein Dokument, dem der Gast aktiv zugestimmt hat, mit Daten, Gesamtbetrag, Objekt und Stornobedingungen. Eine E-Signatur mit Zeitstempel und der IP des Gastes ist Gold wert. Das ist das Wirkungsvollste, was Sie sammeln können, und Sie sammeln es bei der Buchung, nicht nach dem Streit. Verankert ist das im Ablauf der [Gastformulare vor der Anreise](/blog/pre-arrival-guest-forms).
- **Beweis, dass die Übernachtung stattfand.** Smart-Lock-Logs, die die Türöffnung mit dem von Ihnen gesendeten Code zeigen. Router-Logs mit einem verbundenen Gerät. Ein Zugangsprotokoll vom Tastenfeld. Sie sind datiert, schwer zu fälschen und widerlegen „Leistung nicht erbracht" direkt. Ein Gast, der eine Übernachtung anficht, in die er physisch hineingegangen ist, wird vom eigenen Handy widerlegt, das sich in Ihr Netz eingewählt hat.
- **Der Chatverlauf.** Die vollständige Nachrichtenhistorie — Buchungsbestätigung, Anreise-Anweisungen, das „Danke, war super" beim Auszug. Ein Gast, der Ihnen an Tag vier dankt und an Tag vierzig anficht, hat Ihnen den Widerspruch selbst geliefert.
- **Die ursprünglichen Autorisierungsdaten.** Das AVS-Ergebnis (Adressprüfung) und der CVC-Abgleich aus dem Moment der Belastung. Eine übereinstimmende Rechnungsadresse und CVC sagen der Bank, dass der Karteninhaber beim Kauf präsent war — und das untergräbt einen Betrugsvorwurf im Keim.

Reichen Sie alles als ein klares Dossier mit einer Zusammenfassung in zwei Sätzen ein: *Gast buchte am X, stimmte den Bedingungen zu (beigefügt), betrat das Objekt physisch am Y (Logs beigefügt) und schrieb uns am Z. Die Zahlung ist gültig.* Banken belohnen Kürze, die durch Dokumente gestützt ist. Aufsätze ignorieren sie.

## So reagieren Sie: der Ablauf der Anfechtung und die Uhr

Die Uhr ist der Teil, den Gastgeber falsch machen. Zwei Fristen zählen, und sie gehören verschiedenen Parteien.

Erstens das Fenster des Gastes: Nach den Regeln von Visa und Mastercard hat ein Karteninhaber in der Regel bis zu **120 Tage** ab der Transaktion (oder ab dem erwarteten Leistungsdatum), um den Streit einzureichen. Deshalb kann ein Chargeback mehr als einen Monat nach dem Auszug eintreffen und wie aus dem Nichts wirken — es liegt locker im Fenster.

Zweitens *Ihr* Fenster: Sobald der Streit eingereicht ist, zeigt Stripe eine **Antwortfrist, meist 7 bis 21 Tage**, bis zu der Sie Ihre Beweise einreichen müssen. Verpassen Sie sie, verlieren Sie automatisch — keine Beweise, sofortige Niederlage. Nach Ihrer Einreichung lässt sich die ausstellende Bank Zeit: Eine Entscheidung kann **60 bis 75 Tage** dauern. Ein einzelner Streit kann also zwei bis drei Monate offen liegen, während Ihr Geld bei der Bank ruht.

Der Ablauf, der Reihe nach:

1. **Erstatten Sie nicht aus Panik.** Erstatten Sie, nachdem ein Chargeback bereits eingereicht ist, können Sie doppelt zahlen — das Chargeback *und* die Erstattung — weil sie über getrennte Wege laufen. Lösen Sie es auf einem Gleis, nie auf beiden.
2. **Lesen Sie zuerst den Reason Code.** Er sagt Ihnen, welche Beweise zählen. Ein 13.1 will Einlass-Logs, ein 13.6 will Ihre Stornopolice. Das falsche Dossier zum Code einzureichen ist ein Schuss in den Ofen.
3. **Stellen Sie das Dossier zusammen** — Vertrag, Übernachtungsbeweis, Chatverlauf, Autorisierungsdaten — und schreiben Sie die Zwei-Satz-Zusammenfassung.
4. **Reichen Sie vor der Stripe-Frist ein**, dann warten Sie die 60 bis 75 Tage bis zur Bankentscheidung ab.

Eine Feinheit, die man kennen sollte: Visas Regeln **Compelling Evidence 3.0** erlauben einem Händler, einen Betrugsstreit vorab abzuwenden, indem er zwei frühere, unbestrittene Transaktionen desselben Karteninhabers nachweist, verknüpft über übereinstimmende Daten wie IP oder Gerät. Für einen Gastgeber, der die meisten Gäste genau einmal sieht, trifft das selten zu — aber wenn ein Stammgast anficht, ist es eine echte Option.

## Prävention: die Streitfälle, die Sie vor ihrem Beginn ersticken

Die ehrliche Branchenquote gewonnener Anfechtungen im Tourismus liegt bei rund **20 bis 40 Prozent**, und der echte Betrug drückt den Schnitt, weil er praktisch nicht zu gewinnen ist. Die Rechnung sagt: Prävention schlägt den Prozess jedes Mal. Vier Hebel erledigen den Großteil der Arbeit:

- **Schalten Sie 3-D Secure ein.** Authentifiziert ein Gast eine kartenlose Zahlung über 3DS (den „Diesen Kauf bestätigen"-Schritt der Bank), **verschiebt sich die Haftung für Betrugs-Chargebacks von Ihnen auf die ausstellende Bank**. Genau das Gestohlene-Karte-Szenario, das Sie über Beweise nicht gewinnen können? Mit 3DS schluckt es die Bank statt Sie. Für Direktbuchungen ist das die wertvollste Einstellung, die Sie umlegen können, und Stripe kann 3DS bei riskanten Zahlungen automatisch verlangen.
- **Verlangen Sie AVS- und CVC-Abgleich.** Lehnen Sie Zahlungen ab, bei denen Rechnungsadresse oder CVC nicht passen. Ein Betrüger mit gestohlener Kartennummer hat oft die Postleitzahl nicht. Das siebt einen Teil des echten Betrugs schon an der Tür aus.
- **Lassen Sie den Gast Ihre Bedingungen signieren.** Eine Storno- und Hausordnungsvereinbarung, aktiv und vor der Zahlung akzeptiert, verwandelt ein „Aussage gegen Aussage" bei 13.6 in einen Vertrag, den die Bank lesen kann. Keine E-Signatur, keine Verteidigung.
- **Nehmen Sie eine Kaution oder Vorautorisierung, statt später nachzubelasten.** Überraschende Zusatzbelastungen auf eine Karte sind Chargeback-Köder. Erfassen Sie eine klare Kaution im Voraus; muss ein Schaden ersetzt werden, ist das ein Gespräch, keine stille Nachbelastung. Hier zeigt sich auch der Wert des Schutzes auf Plattformseite — [AirCover gegen die Booking.com-Kaution](/blog/airbnb-aircover-vs-booking-damage-deposit): wer direkt geht, trägt dieses Risiko selbst.

Der rote Faden: Ein Chargeback entscheidet sich an dem, was Sie bei der Buchung eingerichtet haben, nicht daran, wie heftig Sie hinterher argumentieren. Erfassen Sie den Vertrag, erfassen Sie die Zugangs-Logs, authentifizieren Sie die Karte — und die einzigen Streitfälle, die Sie verlieren, sind die seltenen echten Betrugsfälle, die 3-D Secure ohnehin der Bank überlässt. Jede Buchung, jeden Vertrag und jeden Einlass-Datensatz an einem Ort zu halten, damit Sie das Dossier in zehn Minuten statt an einem Abend zusammenstellen, ist genau das, wofür ein einziges Betriebs-Dashboard da ist: [holen Sie Reservierungen und Gästedaten in eine Ansicht](/onboard), bevor Sie sie für einen Streit brauchen.

## FAQ

**Kann ein Gast eine Ferienwohnung oder Direktbuchung per Chargeback zurückbuchen?**
Ja. Sobald ein Gast direkt an Sie zahlt — eigene Website, Stripe-Link oder Terminal — kann er diese Zahlung bei seiner Bank anfechten, und Sie als Händler müssen sie verteidigen. Bei Airbnb oder Vrbo ist die Plattform der Händler und schluckt den Streit; das ist eines der Dinge, für die Ihre Provision bezahlt. Das Direktgeschäft tauscht diesen Schutz gegen die gesparte Gebühr.

**Wird das Geld sofort eingezogen, wenn ein Chargeback eingereicht wird?**
Ja. Bei Stripe werden die strittige Summe plus 15 € Bearbeitungsgebühr im Moment der Streiteröffnung vom Guthaben abgebucht, noch bevor Sie antworten. Gewinnen Sie die Anfechtung, erstattet Stripe die strittige Summe — die 15 € aber nie. Ein Sieg kostet Sie also trotzdem 15 € und Ihre Zeit, eine Niederlage den vollen Übernachtungsbetrag plus diese 15 €.

**Wie gewinne ich als Gastgeber ein Chargeback?**
Reichen Sie der ausstellenden Bank ein dichtes Beweis-Dossier ein: einen vom Gast signierten Vertrag, Beweis, dass die Übernachtung stattfand (Smart-Lock-Logs, WLAN-Verbindungen, Zugangsprotokolle), den Chatverlauf samt Danke beim Auszug und den AVS/CVC-Abgleich der Zahlung. Passen Sie die Beweise zum Reason Code, schreiben Sie eine Zwei-Satz-Zusammenfassung und reichen Sie vor der Stripe-Frist ein. Konkrete, datierte Dokumente gewinnen, emotionale Aufsätze verlieren.

**Wie lange hat ein Gast Zeit, eine Zahlung anzufechten?**
In der Regel bis zu 120 Tage ab der Transaktion oder dem erwarteten Leistungsdatum nach den Regeln von Visa und Mastercard. Deshalb kann ein Chargeback mehr als einen Monat nach dem Auszug eintreffen. Ist es eingereicht, haben Sie ein deutlich kürzeres Fenster — 7 bis 21 Tage zum Einreichen der Beweise — und die finale Entscheidung der Bank kann weitere 60 bis 75 Tage dauern.

**Lohnt sich 3-D Secure für Direktbuchungen?**
Für die meisten Gastgeber ja. Authentifiziert ein Gast die Zahlung über 3-D Secure, verschiebt sich die Haftung für betrugsbezogene Chargebacks von Ihnen auf die ausstellende Bank. Das neutralisiert genau den Streittyp, den Sie über Beweise nicht gewinnen können — das „Diese Zahlung habe ich nie getätigt" bei gestohlener Karte. Der Preis ist etwas mehr Reibung an der Kasse, aber bei höherwertigen Buchungen ist dieser Schutz es wert.

**Schützt eine Kaution allein vor Chargebacks?**
Eine Kaution hilft beim Schadensersatz, nicht direkt beim Chargeback — auch die Kautionsbelastung kann ein Gast anfechten. Was Streit wirklich verhindert, ist die Authentifizierung der Karte (3DS, AVS, CVC) und eine signierte Vereinbarung. Nehmen Sie die Kaution als klare, vereinbarte Vorautorisierung im Voraus statt als überraschende Belastung später, denn überraschende Belastungen sind selbst ein häufiger Chargeback-Auslöser.

**Was passiert, wenn ich nach einem eingereichten Chargeback erstatte?**
Sie können doppelt zahlen. Erstattung und Chargeback laufen über getrennte Wege, sodass eine Erstattung auf eine bereits strittige Zahlung bedeuten kann, dass das Geld Ihr Konto über beide Wege verlässt. Wählen Sie ein Gleis: Lassen Sie entweder den Chargeback-Prozess die Sache klären, oder — wenn Sie dem Gast recht geben — lösen Sie es über den Streit, nicht über eine parallele Erstattung.

## Eine klare Meinung

Das erste verlorene Chargeback lehrt, dass das Direktgeschäft nicht nur eine Provisionsersparnis ist — es ist eine Risikoverlagerung von der Plattform auf Sie, und die meisten Gastgeber preisen diese Verlagerung nie ein. Die Lösung ist nicht, Direktbuchungen zu fürchten; sie ist, jede direkte Zahlung wie eine Transaktion zu behandeln, die Sie zwei Monate später vielleicht schriftlich verteidigen müssen. Authentifizieren Sie die Karte, lassen Sie den Gast etwas unterschreiben, erfassen Sie die Tür-Logs und halten Sie alles an einem Ort. Tun Sie das, und die einzigen Chargebacks, die Sie je verlieren, sind die echten Betrugsfälle — und 3-D Secure überlässt die meisten davon stillschweigend der Bank. Der Gastgeber, der den Buchungsvertrag als optionales Papier behandelt, ist der Gastgeber, der einem Fremden ein Gratis-Wochenende finanziert und 15 € fürs Vergnügen draufzahlt.
