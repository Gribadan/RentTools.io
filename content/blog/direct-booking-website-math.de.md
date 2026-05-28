---
slug: direct-booking-website-math
locale: de
title: "Direktbuchungs-Website: Wann sich der Verzicht auf OTA-Provision lohnt"
excerpt: Eine durchgerechnete P&L: Airbnb-Provision für den Gastgeber gegen 3 % Stripe bei Direktbuchung — und die Stammgastquote, die entscheidet, ob sich Ihre eigene Seite lohnt.
status: published
tags:
  - host-tips:Gastgeber-Tipps
  - pricing:Preisgestaltung
  - tools:Tools
  - booking-com:Booking.com
ogImageUrl: /blog-covers/direct-booking-website-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Meine erste Direktbuchungsseite habe ich gebaut, um „Airbnbs 15 % Provision zu umgehen". Drei Monate und vierzig Buchungen später habe ich die echte P&L durchgerechnet und etwas entdeckt, vor dem mich kein Gastgeber-Forum gewarnt hatte: Bei Airbnbs Standard-Gebührenmodell war die Provision, die ich umging, größtenteils die des *Gastes*, nicht meine. Bei einer Buchung über 600 $ bekam ich fast dieselben 582 $ — ob über Airbnb oder über meinen eigenen Stripe-Link. Der Gast sparte 85 $. Ich sparte dreißig Cent.

Damit begann das Verständnis, wo eine Direktbuchungs-Website tatsächlich Geld bringt — und wo sie nur einen Rabatt aus der Tasche der Plattform in die Tasche des Gastes verschiebt. Die Antwort hängt an zwei Zahlen, die die meisten Gastgeber nie trennen: nach welchem Gebührenmodell Ihre Plattform arbeitet, und welcher Anteil Ihrer Buchungen von Stammgästen und Empfehlungen kommt. Hier ist die ganze Rechnung.

## TL;DR

- Bei Airbnbs **geteiltem Gebührenmodell** bringt der Wechsel zur Direktbuchung dem *Gastgeber* fast nichts — die ~14 % Servicegebühr zahlt der Gast, nicht Sie. Die Ersparnis landet beim Gast.
- Beim **reinen Gastgeber-Gebührenmodell** (Airbnb) und Booking.coms **15 %** trägt der Gastgeber die Provision — dort spart Direktbuchung echtes Geld: rund **72 $ bei einer 600-$-Buchung**.
- Eine Direktbuchung über Stripe kostet **2,9 % + 0,30 $** (etwa **18 $ bei 600 $**); EWR-Karten sind günstiger, ~1,5 %.
- Alles entscheidet Ihre **Stammgast- und Empfehlungsquote**. Einen Fremden über Werbung zu gewinnen kostet **50–150 $ pro Buchung** — oft mehr als die gesparte Provision.
- Ein kostenpflichtiges Website-Tool (~**480 $/Jahr**) rechnet sich ab etwa **7 Buchungen/Jahr mit gastgeberseitiger Provision**. Darunter: eine kostenlose Seite nehmen.
- Bei Direktbuchung verlieren Sie **AirCover, Chargeback-Schutz und Plattform-Vertrauen** — rechnen Sie das ein, bevor Sie die gesparte Provision feiern.

## Was die OTA-Provision Sie wirklich kostet

Jeder Gastgeber nennt die Provision als eine Zahl. In Wahrheit sind es zwei völlig verschiedene Zahlen, je nach Gebührenmodell — und genau diese Differenz ist der Kern des Ganzen.

Schicken wir eine einzelne Buchung durch jedes Modell: ein Objekt für 150 $/Nacht, 4 Nächte, **600 $ Grundbetrag**.

| Kanal | Gebührenmodell | Gastgeber erhält | Gast zahlt |
|---|---|---|---|
| Airbnb (geteilte Gebühr) | 3 % Gastgeber + ~14 % Gast | 582 $ | ~685 $ |
| Airbnb (reine Gastgeber-Gebühr) | 15 % Gastgeber, 0 % Gast | 510 $ | 600 $ |
| Booking.com | 15 % Gastgeber (+ ~1,1 % Zahlungen) | 504–510 $ | 600 $ |
| Vrbo (Pay-per-Booking) | 5 % + 3 % Abwicklung | 552 $ | 600 $ |
| Direkt (Stripe, US-Karte) | 2,9 % + 0,30 $ | 582 $ | 600 $ |

Sehen Sie sich die erste und die letzte Zeile an. Beim **geteilten** Modell von Airbnb — immer noch der Standard für die meisten unabhängigen, nicht per Software angebundenen Gastgeber — erhält der Gastgeber **582 $**. Eine direkte Stripe-Buchung bringt **582,30 $**. Für den Gastgeber ist das dieselbe Zahl. Was Sie mit der Direktbuchung „umgehen" würden, sind die **85 $, die der Gast** obendrauf gezahlt hat — keine Kosten, die Sie getragen haben.

Jetzt die Zeilen mit reiner Gastgeber-Gebühr und Booking.com. Dort erhält der Gastgeber **510 $**, die Direktbuchung bringt **582 $** — echte **72 $ Ersparnis pro Buchung**. Das ist die Lücke, die sich zu verfolgen lohnt.

Die erste Frage lautet also nicht „soll ich Direktbuchungen annehmen". Sie lautet „nach welchem Gebührenmodell arbeite ich". Prüfen Sie es in Ihrer Airbnb-Auszahlungsübersicht: Sieht der Gast eine „Servicegebühr"-Zeile, sind Sie im geteilten Modell, und die gastgeberseitige Provision, die Sie zurückholen könnten, ist winzig. Gibt es keine Gast-Servicegebühr und liegt Ihre Auszahlung ~15 % unter dem Nächtigungsbetrag, sind Sie im reinen Gastgeber-Modell — und dort steckt echte Marge in der Direktbuchung. Die meisten per Software angebundenen und die meisten Objekte in der EU laufen im reinen Gastgeber-Modell, ob der Gastgeber das nun gemerkt hat oder nicht.

## Die Stripe-Seite: Was eine Direktbuchung wirklich einbringt

Stripes Standardsatz liegt bei **2,9 % + 0,30 $** pro erfolgreicher Zahlung in den USA. Bei 600 $ sind das **17,70 $**. Im EWR kosten Karten derselben Region etwa **1,5 % + 0,25 €**, ein europäischer Gastgeber mit europäischen Gästen zahlt also eher **9–10 $** bei derselben Buchung. Auslandskarten legen rund **1,5 %** drauf, die Währungsumrechnung weitere **1–2 %** — gut zu wissen, wenn Ihr Gast in einer anderen Währung zahlt als Ihre Auszahlung.

Zwei Kosten, die der Rat „nimm einfach Stripe" verschweigt:

- **Kautionen und Vorautorisierungen.** Ersetzen Sie den Plattformschutz durch eine erstattbare Kaution, berechnet Stripe die Gebühr beim Einzug, und Sie zahlen sie auf den tatsächlich belasteten Betrag. Eine Vorautorisierung, die Sie wieder freigeben, kostet nichts — das ist das richtige Muster für die meisten Aufenthalte.
- **Erstattungen geben die Gebühr nicht zurück.** Stripe behält die 0,30 $ (früher auch den Prozentsatz, den geben sie bei voller Erstattung inzwischen zurück). Eine Buchung, die zweimal storniert und neu gebucht wird, hat Stripe dreimal bezahlt.

Unter dem Strich: direkt über Stripe erhält der Gastgeber **~582 $ bei 600 $** mit US-Karten, **~590 $** bei EWR-internen Karten. Die Abwicklung ist wirklich günstig. Der teure Teil der Direktbuchung ist nie die Zahlungsschiene — es ist, den Gast überhaupt auf Ihre Seite zu bekommen.

## Die Zahl, die alles entscheidet: Ihre Stammgast- und Empfehlungsquote

Hier liegt die Falle. Ein Gastgeber liest „spare 15 %", baut eine Website, schaltet Google-Anzeigen auf „Ferienwohnung [Stadt]" und wartet. Der Klick kostet **0,80–2,50 $**, die Landingpage konvertiert mit **1–3 %**, also liegen die **Gesamtkosten, um eine Direktbuchung von einem kalten Fremden zu gewinnen, bei 50–150 $** — Sie haben gerade die Provision ausgegeben, die Sie sparen wollten. Und das *ohne* die Bewertungswand der Plattform, ihre Streitschlichtung oder die Gast-Verifizierung.

Fremde an der Plattform vorbei zu gewinnen ist für fast jeden kleinen Gastgeber ein Verlustgeschäft. Die OTA kann eines sehr gut, was Sie nicht können: Ihr Objekt einem Reisenden zeigen, der nie von Ihnen gehört hat, genau in dem Moment, in dem er zahlbereit ist. Diese Vorstellung kauft die Provision.

Die Direktbuchungen, die wirklich Geld bringen, sind die mit **null Akquisekosten**:

- **Stammgäste.** Jemand, der schon da war und es geliebt hat. Ihn auf Airbnb erneut zu gewinnen heißt, die Provision ein zweites Mal für einen Gast zu zahlen, den Sie längst hatten.
- **Empfehlungen.** Deren Freund, der vorab vertrauend ankommt, weil ein echter Mensch für Sie gebürgt hat.
- **Ihr eigenes Publikum.** Ein Objekt mit Instagram, einer Gäste-Mailingliste, einer „beim nächsten Mal direkt buchen"-Karte auf der Küchentheke.

Für diese Gäste ist der Direktkanal reine Marge: 72 $ Ersparnis (reine Gastgeber-/Booking-Sätze) bei Buchungen, für die Sie sonst erneut den vollen Preis zahlen würden. Ihre Stammgast- und Empfehlungsquote *ist* Ihr Direktbuchungs-Potenzial. Alles andere ist Werbeausgabe im Kostüm der Ersparnis.

Typische Quoten nach Objekttyp, aus dem, was ich bei Gastgebern sehe, mit denen ich arbeite: ein transienter **Stadtapartment-Studio liegt bei 5–10 % Stammgästen** (meist Geschäftsreisende), eine **Strand-2-Zimmer-Wohnung bei 15–25 %** (Familien im Jahresurlaub), eine **Hütte am Urlaubsort bei 30–40 %** (dieselben Skifahrer jeden Februar). Die Hütte ist, wo Direktbuchung Geld druckt. Das Stadtstudio ist, wo ein Direktkanal es leise verliert.

## Eine durchgerechnete Amortisation: kostenlos vs. kostenpflichtiges Website-Tool

Eine integrierte Direktbuchungsseite — Lodgify, Hostfully, Uplisting — kostet rund **40 $/Monat, ~480 $/Jahr**, manchmal plus 1–2 % pro Direktbuchung. Der kostenlose Weg (ein öffentlicher iCal-Feed, damit der Kalender ehrlich bleibt, plus ein Stripe-Zahlungslink oder ein einseitiges Buchungsformular) kostet **0–50 $/Jahr**.

Amortisation des kostenpflichtigen Tools, bei 72 $ Ersparnis pro Buchung mit gastgeberseitiger Provision:

| Objekt | Buchungen/Jahr | Direkt (Stamm+Empf.) | Ersparnis/Jahr | Urteil kostenpflichtig |
|---|---|---|---|---|
| Stadt-Studio (geteilt, 7 % Stamm) | 90 | ~6 | ~0 $* | Nein — die Ersparnis ist die des Gastes |
| Strand-2-Zi. (Booking-lastig, 20 %) | 60 | ~12 | ~864 $ | Grenzwertig — kostenloser Weg bringt mehr |
| Berghütte (Gastgeber-Gebühr, 35 %) | 40 | ~14 | ~1.008 $ | Ja — rechnet sich ~2×, kostenloser Weg ist reiner Gewinn |

*Der Vorbehalt beim Studio ist der geteilte Gebühr-Befund von oben: Selbst bei 6 Direktbuchungen ist die Ersparnis des Gastgebers nahe null, wenn die Alternative das geteilte Airbnb-Modell war. Der richtige Schritt dort ist gar keine eigene Seite — sondern das Objekt auf Airbnb zu lassen und einzustreichen, dass der Gast, nicht Sie, die Gebühr zahlt.

Das Muster: Ein **kostenpflichtiges** Website-Tool braucht etwa **7 Buchungen mit Gastgeber-Provision pro Jahr**, nur um seine eigenen Kosten zu decken. Die meisten Gastgeber unter 5 Objekten erreichen das mit Direktvolumen allein nie — weshalb der **kostenlose Weg** für fast alle unterhalb eines stammgaststarken Urlaubsobjekts gewinnt. Sie brauchen keine 480-$-Website, um einem früheren Gast einen Stripe-Link zu mailen. Die parallele Amortisation für das Tool, das all das synchronisiert, steht in [Channel-Manager-Amortisationsrechnung](/blog/channel-manager-break-even-math) — gleiche Form, andere Zahl.

## Die versteckten Kosten, die niemand einrechnet

Die gesparte Provision ist die sichtbare Zahl. Diese hier sind die unsichtbaren, und mindestens zwei davon haben mich echtes Geld gekostet.

- **Kein AirCover.** Airbnbs Garantie bis 3 Mio. $ folgt dem Gast nicht zu Ihrer Direktbuchung. Sie ersetzen sie durch eine erstattbare Kaution (deckelt Ihr Risiko auf die Kaution) oder eine Kurzzeitvermietungs-Versicherung (**500–1.500 $/Jahr**). Bei einer Direktbuchung ist der kaputte Fernseher ganz allein Ihr Problem. Der vollständige Vergleich, was jedes Schutzmodell tatsächlich zahlt, steht in [AirCover vs. Booking.com-Kaution](/blog/airbnb-aircover-vs-booking-damage-deposit).
- **Chargebacks.** Das ist der, der beißt. Ein Gast, der die Zahlung bei seiner Bank anficht, stellt *Sie* gegen ein Kartennetzwerk mit dünnen Beweisen und einer **Chargeback-Gebühr von 15 $** — ob Sie gewinnen oder verlieren. Airbnb fängt dieses Risiko auf der Plattform ab; Stripe nicht. Ein nicht erstattbarer Tarif plus eine klare, unterschriebene Buchungsvereinbarung ist Ihre einzige Verteidigung.
- **Vertrauen und Bewertungen.** Ein Fremder legt keine 600 $ auf eine namenlose Buchungsseite ohne Bewertungswand. Aus demselben Grund konvertieren Kalt-Anzeigen mit 1–3 %: Das Vertrauen, das die OTA Ihnen vermietet, ist echt. Direktbuchung konvertiert nur *warmen* Traffic — Menschen, die Ihnen bereits vertrauen.
- **Compliance und Verwaltung.** Sie sind jetzt der Verkäufer im rechtlichen Sinn. Steuerrechnungen, Erstattungen, [Gästeregistrierung](/blog/guest-registration-laws-short-term-rental) und die Kurtaxe-Erhebung, die früher die Plattform erledigt hat — alles bei Ihnen. Kalkulieren Sie eine Stunde pro Direktbuchung, bis Sie Vorlagen haben.

Summiert ergibt die ehrliche Ersparnis pro Direktbuchung **72 $ minus** einem Anteil für Versicherung, Chargeback-Risiko und Verwaltungszeit — nennen wir es reale **40–55 $** bei reinen Gastgeber-/Booking-Sätzen, und immer noch im Grunde **null** beim geteilten Airbnb-Modell.

## Wie ich es tatsächlich betreibe (der Hybrid)

Ich betreibe keine reine Direktbuchungs-Operation, und ich denke, die meisten Gastgeber sollten das auch nicht. Das Setup, das funktioniert:

1. **Jedes OTA-Inserat bleibt aktiv.** Sie sind mein Akquisekanal. Jeder Fremde entdeckt mich dort, und ich zahle gern die Maut, um ihn einmal kennenzulernen.
2. **Wandeln Sie die Beziehung, nicht die Buchung.** Ein Gast, der sichtlich zufrieden ist, bekommt während des Aufenthalts ein unaufdringliches „Stammgäste nehmen wir direkt, so geht's" — eine Karte, eine Mail, eine Zeile in der Checkout-Nachricht. Keine Rabattschlacht auf der Plattform, das verstößt ohnehin gegen die Regeln.
3. **Machen Sie den Direktweg kostenlos und reibungslos.** Ein öffentlicher iCal-Feed hält den Direktkalender mit den OTAs synchron, damit ich mich nie selbst doppelt buche. Ein Stripe-Zahlungslink plus eine einseitige Vereinbarung schließen die Buchung ab. Werkzeugkosten insgesamt: nahe null.
4. **Teilen Sie die Ersparnis bei reinen Gastgeber-/Booking-Sätzen.** Bieten Sie dem Stammgast **5 % Rabatt** auf den Direktpreis. Er schlägt immer noch die Servicegebühr der OTA, und ich erhalte immer noch mehr, als die Plattform gezahlt hätte. Beide Seiten gewinnen; nur die Plattform geht der Provision verlustig.
5. **Niemals Anzeigen, um Fremde direkt zu jagen.** Das ist die Grenze. Kalt-Akquise ist die Aufgabe der Plattform, und sie ist besser darin, als mein Werbebudget es je sein wird.

Die Kalendersynchronisation darunter — OTA-Feeds plus Direktbuchungen plus Reinigungspuffer, alles an einem Ort, damit der Direktkanal keine Doppelbuchung produziert — ist genau das, was [RentTools](/onboard) macht, kostenlos und Open Source. Die Direktbuchungsseite ist optional; der Kalender, der sie vor dem Knall bewahrt, ist es nicht.

## FAQ

**Lohnt sich eine Direktbuchungs-Website für einen kleinen Gastgeber?**
Nur mit einer echten Stammgast- oder Empfehlungsbasis. Für ein Objekt mit 30 %+ Rückkehrerquote (Urlaubshütten, lange Geschäftsaufenthalte) ist ein Direktkanal für genau diese Gäste sehr rentabel, weil die Akquisekosten null sind. Für ein transientes Stadtstudio bei 5–10 % Stammgästen kostet ein Direkttrichter meist mehr an Tools und Verwaltung, als er spart. Entscheidend ist Ihre Stammgastquote, nicht Ihr Buchungsvolumen.

**Wie viel Provision verlangt Airbnb tatsächlich vom Gastgeber?**
Das hängt vom Gebührenmodell ab. Beim geteilten Modell zahlt der Gastgeber rund 3 % und der Gast obendrauf eine ~14 % Servicegebühr. Beim reinen Gastgeber-Modell zahlt der Gastgeber rund 15 % und der Gast keine Servicegebühr. Prüfen Sie Ihre Auszahlungsübersicht: Eine sichtbare „Servicegebühr" beim Gast bedeutet geteiltes Modell, und Ihre echten gastgeberseitigen Kosten sind gering.

**Spare ich mit Direktbuchung, wenn ich Airbnbs geteiltes Modell habe?**
Kaum. Im geteilten Modell erhält der Gastgeber bei einer direkten Stripe-Buchung etwa gleich viel wie bei Airbnb, weil die große Gebühr der Gast zahlte, nicht Sie. Der Wechsel zur Direktbuchung schenkt diese Ersparnis vor allem dem Gast. Sinnvoll ist es nur, wenn Sie Ihren Direktpreis anheben und einen Teil des Gast-Vorteils abschöpfen, oder wenn Sie eine Gastbeziehung aufbauen statt Kosten zu senken.

**Welchen Zahlungsdienstleister sollte ich für Direktbuchungen nutzen?**
Stripe ist der Standard für die meisten Gastgeber: 2,9 % + 0,30 $ pro Zahlung in den USA, günstiger bei EWR-internen Karten. Er übernimmt PCI-Compliance, Vorautorisierungen für Kautionen und Erstattungen. PayPal und Square sind Alternativen mit ähnlichen Sätzen. Was Sie auch wählen: Nutzen Sie Vorautorisierungen statt vorab eingezogener Kautionen, und speichern Sie Kartennummern niemals selbst.

**Wie schütze ich mich ohne AirCover bei einer Direktbuchung?**
Zwei Ebenen. Erstens eine erstattbare Kaution als Stripe-Vorautorisierung, bemessen am realistischen schlimmsten Fall (150–500 € für ein Apartment). Zweitens eine Kurzzeitvermietungs-Versicherung (500–1.500 $/Jahr) für Schäden oberhalb der Kaution. Eine unterschriebene Buchungsvereinbarung mit klarer Schadensklausel macht beides durchsetzbar. Sie tauschen die Plattformgarantie gegen Ihre eigenen Unterlagen.

**Verliere ich nicht die Airbnb-Bewertungen und das Vertrauen, auf denen Buchungen beruhen?**
Bei Fremden ja — und genau deshalb sollten Sie Fremde nicht direkt jagen. Das Vertrauen aus der OTA-Bewertungswand konvertiert den kalten Besucher. Direktbuchung funktioniert für Gäste, die Ihnen bereits vertrauen: frühere Gäste und deren Empfehlungen. Halten Sie Ihre OTA-Inserate für Entdeckung und Reputation; nutzen Sie Direkt nur für die warmen Beziehungen, die Sie sich verdient haben.

**Kann ich mit Airbnb Ärger bekommen, wenn ich Gäste direkt nehme?**
Sie dürfen Ihre Direktseite *innerhalb der Airbnb-Nachrichten* vor einem Aufenthalt nicht bewerben oder zu Buchungen außerhalb auffordern — das verstößt gegen die Regeln und kann Nachrichten markieren oder Ihr Konto sanktionieren. In Ordnung ist: ein Gast, der nach dem Aufenthalt von sich aus schreibt, oder eine Karte in der Unterkunft. Halten Sie die Umwandlung außerhalb der Plattformkanäle und nach der Buchung, nicht im Airbnb-Thread.

**Was ist der günstigste Weg, mit Direktbuchungen zu starten?**
Ein öffentlicher iCal-Feed, damit der Kalender kanalübergreifend synchron bleibt, plus ein Stripe-Zahlungslink und eine einseitige Buchungsvereinbarung, die Sie per Mail senden. Gesamt: unter 50 $/Jahr, oft 0 $. Eine gehostete Buchungsseite für 480 $/Jahr brauchen Sie erst, wenn Ihr Direktvolumen die Kosten deckt — was bei den meisten Gastgebern unter 5 Objekten nie passiert. Starten Sie kostenlos, upgraden Sie nur, wenn die Zahlen es sagen.

## Eine klare Meinung

Die OTA ist nicht Ihr Feind, und die Provision ist kein Raub. Sie ist der Preis einer Vorstellung bei einem Fremden, der Sie sonst nie gefunden hätte — und ein fairer Preis, denn denselben Fremden selbst zu gewinnen käme Sie teurer und mit schlechterer Konversion. Der Fehler ist nicht, die Provision zu zahlen. Der Fehler ist, sie *zweimal* für denselben Gast zu zahlen.

Bauen Sie also den günstigstmöglichen Direktweg für die Gäste, die Sie schon gewonnen haben, halten Sie jedes Inserat aktiv für die, die Sie noch nicht haben, und geben Sie keinen Dollar für Werbung aus, um einen kalten Reisenden von der Plattform zu zerren — für eine Gebühr, die Sie in der Hälfte der Fälle gar nicht gezahlt haben. Direktbuchung ist ein Bindungswerkzeug, kein Akquisekanal. Gastgeber, die das verstehen, behalten still ein paar Tausend mehr pro Jahr. Die, die es nicht verstehen, bauen eine Website, schalten Anzeigen und wundern sich, warum sie „die 15 % umgehen" ärmer gemacht hat.
