---
slug: avoiding-double-bookings
locale: de
title: "Doppelbuchungen vermeiden: der einzige Spickzettel, den Hosts brauchen"
excerpt: Spickzettel für Kurzzeitvermieter zur Vermeidung von Doppelbuchungen. Sync-Intervalle, Puffertage, Regeln für manuelle Einträge und der 24-Stunden-Vor-Anreise-Check.
status: draft
tags:
  - double-bookings:Doppelbuchungen
  - calendar-sync:Kalendersynchronisation
  - host-tips:Host-Tipps
ogImageUrl: /blog-covers/avoiding-double-bookings.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Doppelbuchungen vermeiden: der einzige Spickzettel, den Hosts brauchen

Meine erste echte Doppelbuchung kam nicht aus Sync-Verzögerung. Sie kam daher, dass ich auf Booking.com einen Freitag für einen Freund blockiert hatte, der vorbeischauen wollte, vergessen hatte, die Sperre auf Airbnb zu spiegeln, und zwei Stunden später eine Sofortbuchung über Airbnb für genau diesen Freitag bekam. Lag null. Ich hatte einfach zwei Kalender, die unterschiedliche Dinge sagten, weil ich einen bearbeitet und den anderen vergessen hatte.

Diese Geschichte zählt, weil die meisten „So vermeidest du Doppelbuchungen"-Artikel an iCal-Aktualisierungsintervallen kleben und die häufigere Ursache ignorieren: Hosts, die eine Plattform editieren und den Rest vergessen. Das hier ist der Spickzettel, den ich damals gebraucht hätte.

## TL;DR

- Stellen Sie auf jeder Plattform jeden importierten Kalender auf das schnellste Intervall — und kalkulieren Sie trotzdem mit **2 bis 6 Stunden** Verzögerung.
- Bei Objekten mit Same-Day-Reinigungsteam einen **1-Tages-Puffer** dazu; bei kleinen Studios, die Sie selbst reinigen, ohne Puffer.
- Manuelle Sperren (Eigennutzung, Wartung) **immer in einem kanonischen Kalender** eintragen und propagieren lassen. Niemals zwei Plattformen per Hand pflegen.
- Vor jeder Anreise einen **24-Stunden-Check** fahren: beide Plattformen öffnen, prüfen, dass die Termine noch übereinstimmen.
- Eine Doppelbuchung pro hundert ist eine mathematische Tatsache, kein moralisches Versagen. Eine Entschuldigungs-Vorlage griffbereit halten.

## Der Spickzettel

Fünf Regeln. In Reihenfolge ihrer Trefferquote.

1. **Ein kanonischer Kalender.** Wählen Sie eine einzige Wahrheit für manuelle Sperren (Eigennutzung, Familie, Wartung). Alle anderen Plattformen importieren von dort. Keine manuelle Sperre in zwei Plattformen tippen.
2. **Schnellster Poll auf jedem importierten Feed.** Airbnb, Booking, Vrbo: jeden öffnen, jeden importierten Kalender auf das niedrigste verfügbare Intervall stellen. Keiner bietet weniger als 2 Stunden — das ist okay.
3. **Manchmal ein Puffertag.** Bei Objekten mit Same-Day-Reinigungsteam einen 1-Tages-Puffer nach dem Auschecken einplanen. Bei kleinen Wohnungen, die Sie in zwei Stunden selbst reinigen, weglassen: Der Umsatzverlust übersteigt das Risiko.
4. **24-Stunden-Check vor jeder Anreise.** Am Tag vor der Anreise beide Plattformen öffnen und prüfen, dass die Termine übereinstimmen. 30 Sekunden. Fängt das stille Sync-Versagen 1 von 300 ab.
5. **Entschuldigungs-Vorlage parat.** Wenn die seltene Doppelbuchung passiert, sind Sie in der U-Bahn / schlafen / fahren. Halten Sie eine höfliche, ruhige Vorlage bereit, die die Lage erklärt, dem Verlierer das Geld erstattet und auf eine Alternativunterkunft in der Nähe verweist.

Wenn Sie alle fünf machen, fällt Ihre Doppelbuchungsquote unter die Quote von Karten-Zahlungsfehlern, No-Shows und Schlüsselsafe-Aussperrungen. Sie ist nicht null. Sie liegt etwa auf der Höhe, von einem Auto erfasst zu werden, das Sie übersehen haben.

## Sync-Intervall: das Rad richtig drehen

Die meisten Hosts wissen, dass iCal „alle paar Stunden" aktualisiert, ohne die tatsächliche Einstellung zu prüfen. Die tatsächliche Einstellung zählt.

Jede Plattform hat ihre eigene. Die konfigurierbaren zum Zeitpunkt:

1. **Airbnb** — importierte Kalender aktualisieren nach Airbnbs Plan (zwischen 2 und 4 Stunden, nicht vom Host konfigurierbar). Ausgehende Exporte aktualisieren etwa alle 2 Stunden.
2. **Booking.com** — Extranet erlaubt manuelle Aktualisierung pro Feed; automatische Aktualisierung läuft alle 2 bis 6 Stunden. Es gibt keine UI, sie schneller zu machen.
3. **Vrbo** — am langsamsten der großen drei. Bis zu 12 Stunden in Extremfällen. URL rotieren, falls ein Feed über 24 Stunden hängt.

Was Sie ändern können, ist Ihr eigener ausgehender Poll. Mit einer Zwischenschicht wie dem [Open-Source-RentTools](/onboard) den eingehenden Poll auf das niedrigste Intervall stellen — 10 Minuten ist vernünftig; darunter verschwendet Airbnbs Bandbreite, ohne etwas zu kaufen, weil die Zielplattform weiterhin langsam pollt.

Zum Hintergrund, warum das iCal-Protokoll bei „alle paar Stunden" deckelt und kein Push bietet, lesen Sie [unsere Schritt-für-Schritt-Anleitung, wie Airbnb- und Booking.com-Kalender synchronisieren](/blog/airbnb-booking-calendar-sync-free).

## Puffertage: wann einer (und wann nicht)

Die meisten Hosts setzen „1 Puffertag" als Standard und prüfen ihn nie wieder. Die Entscheidung ist ein Kompromiss, und die richtige Antwort ist pro Objekt verschieden.

Die Mathematik: 1 Puffertag pro Wechsel kostet eine Verkaufsnacht. Bei 90 $ Nachtrate und 30 Wechseln pro Jahr sind das 2.700 $ Umsatz, vor Steuern. Der Nutzen ist, was Sie sonst durch (a) Reinigungsqualitäts-Probleme und (b) das seltene Same-Day-Auschecken-zu-Anreisen-Chaos verlieren würden.

Entscheidungsregeln, die ich nutze:

1. **Studio / 1-Zimmer, das ich in unter 90 Minuten selbst reinige**: null Puffertage. Same-Day-Anreise klappt. Die Ersparnis schlägt das marginale Reinigungsrisiko.
2. **Familienvilla mit externem Reinigungsteam, 4-Stunden-Wechsel**: 1 Puffertag. Auschecken bis 11 / Anreise ab 15 ist zu eng; 1 Puffertag kauft echten Spielraum.
3. **Objekt mit seltenen Gästen, 7+ Nächte**: 1 Puffertag. Der Umsatzverlust ist klein (lange Aufenthalte = weniger Wechsel/Jahr), und Langzeitgäste sind anspruchsvoller bei Sauberkeit.
4. **Dasselbe Objekt nur auf iCal-synchronisierten Plattformen (kein API-Channel-Manager)**: Den Puffer auf der führenden Plattform setzen und per iCal weitergeben lassen. Nie auf der nachgelagerten setzen: Der Puffer muss landen, bevor die nachgelagerte Plattform pollt, nicht danach.

Den Puffer ganz weglassen, wenn die Wechsel rund laufen und das Reinigungsteam fest ist. Wieder einsetzen, sobald ein schlechter Reinigungsvorfall passiert.

## Regeln für manuelle Einträge: die Offline-Kalender-Falle

Das ist die Falle, die mich mit der Freitags-Sperre erwischt hat. Die Regel ist einfach und nicht verhandelbar: **Niemals eine manuelle Kalendersperre in zwei Plattformen tippen**. Eine als kanonisch wählen, iCal den Rest erledigen lassen.

Drei Wege:

1. **Booking.com als kanonisch.** Sperre im Booking-Extranet. Airbnb importiert Bookings iCal, Sperre propagiert im Airbnb-Poll-Fenster (2 bis 4 Stunden). Funktioniert, weil Bookings Extranet-Kalender die dichteste UI der drei hat.
2. **Airbnb als kanonisch.** Sperre in Airbnb. Booking importiert. Gleiche Logik, andere Richtung.
3. **Externer Kalender als kanonisch.** Google Kalender (oder Ihre [RentTools](/onboard)-Instanz) für persönliche Sperren. Beide Plattformen importieren. Nützlich bei vielen persönlichen Sperren (Renovierung, Nebensaison, Familie).

Was Sie wählen, schreiben Sie sich auf den Handy-Hintergrund, kleben einen Zettel hin, tätowieren es. Wenn der nächste Freund fragt, ob die Wohnung am Wochenende frei ist, lautet die Antwort „Ich sperre es jetzt in $KANONISCH." Nicht „Moment, ich sperre es in beiden."

Bei mehreren Objekten und mehreren Eigentümern (Co-Host-Setup) gemeinsam die Regel festlegen und schriftlich fixieren. Die Hälfte der schlechten Doppelbuchungsgeschichten von Hosts, die ich kenne, lief über einen Mit-Eigentümer, der auf einer Plattform sperrte, auf die der Haupt-Host keinen Zugriff hatte.

## Der 24-Stunden-Vor-Anreise-Check

Der langweilige Lebensretter. Jede Buchung bekommt einen Check 24 Stunden vorher.

Der Check dauert 30 Sekunden:

1. Buchung in der empfangenden Plattform öffnen.
2. Genaue Termine notieren.
3. Den Kalender der anderen Plattform für dasselbe Objekt öffnen.
4. Bestätigen, dass die Termine als gesperrt angezeigt werden.
5. Sind sie es nicht: Manuell auf der zweiten Plattform sperren (seltener Sync-Fehler oder kaputtes eigenes Setup). Nach Anreise des Gastes ermitteln.

Sie finden ein Problem etwa alle 200 bis 400 Buchungen. Fast immer ein vorübergehendes Thema, das Sie sonst nicht entdeckt hätten: Die Quellplattform hat die Feed-URL still rotiert, ein Cron auf dem Server ist gestorben, eine Sommerzeit-Umstellung hat einen Mitternachts-Cron verwirrt.

Diesen Check bei Langzeitbuchungen nicht überspringen; ein Konflikt schmerzt dort am meisten, weil ein 3-Wochen-Gast nicht trivial umziehen kann.

Sie können einen Teil automatisieren. RentTools schickt einen „keine Konflikte gefunden, bis morgen"-Vor-Anreise-Check per E-Mail. Viele Channel Manager machen Ähnliches. Manuell ist okay bei unter 20 Buchungen pro Monat — ein paar Minuten pro Woche.

## FAQ

**Was zählt als Doppelbuchung?**
Zwei bestätigte Reservierungen verschiedener Gäste, die mindestens eine Nacht im selben Objekt überlappen. Eine Reservierung plus persönliche Sperre zählt nicht, auch wenn die Entschuldigung ähnlich ausfällt.

**Wie oft passiert eine Doppelbuchung mit iCal-Sync wirklich?**
Anekdotisch im niedrigen einstelligen Bereich pro Jahr bei Hosts mit unter 5 Objekten auf Airbnb plus Booking. Höher mit mehr als drei Plattformen (mehr Poll-Paare, mehr Lücken). Nochmal höher mit Vrbo, das von den großen drei am langsamsten pollt.

**Sollte ich meine Annahmequote begrenzen, um Doppelbuchungen zu vermeiden?**
Nein. Annahmequote zählt fürs Airbnb-Suchranking. Die richtigen Werkzeuge (Sync, Puffer, Check) drücken die Doppelbuchungsquote unter die Rauschgrenze, ohne Buchungen abzulehnen.

**Was tun, wenn eine Doppelbuchung passiert?**
Die zweite Buchung sofort erstatten, Entschuldigungs-Vorlage schicken, Alternative anbieten. Die meisten Gäste sind bei schneller Reaktion und sauberer Erstattung gnädig. Ein doppelt gebuchter Gast, der 36 Stunden auf Antwort wartet, schreibt 1 Stern; einer, der nach 30 Minuten hört, lässt meist nichts zurück.

**Behebt der Wechsel zu einem bezahlten Channel Manager das?**
Größtenteils ja. Channel Manager mit Airbnbs Partner-API plus Bookings Connectivity-API bekommen Updates in beide Richtungen nahezu in Echtzeit, was die iCal-Lücke schließt. Ab 25 bis 50 $ pro Objekt und Monat mit Vertragsbindung. Rechnet sich erst über ~20 Objekten oder 90 % Auslastung.

**Ändert sich die Puffertag-Logik im Winter / in der Nebensaison?**
Leicht. In der Nebensaison können Sie Puffer schrumpfen, weil das Wechselrisiko mit niedrigerem Volumen sinkt; in der Hauptsaison umgekehrt. Ich behalte ganzjährig die gleiche Einstellung und akzeptiere die Unschärfe. Der kognitive Aufwand fürs saisonale Nachjustieren ist mehr wert, als die Optimierung bringt.

## Eine Meinung

Wer 1 bis 3 Objekte hat und sich um Doppelbuchungen Sorgen macht, sollte diese Woche das Wichtigste tun: **die Kanonischer-Kalender-Regel plus den 24-Stunden-Check**. Beides kostet nichts. Beides braucht fünf Minuten Setup. Zusammen fangen sie 90 % der Fehler ab, die teurere Werkzeuge zu lösen versprechen.

Die teureren Werkzeuge (Channel Manager, kostenpflichtige PMS-Suiten) sind real und für volumenstarke Hosts richtig. Sie sind auch eine Steuer, die kleine Hosts für ein Problem zahlen, das sie mit einem Klebezettel kostenlos hätten lösen können. Den Klebezettel zuerst.
