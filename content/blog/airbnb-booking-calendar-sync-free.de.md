---
slug: airbnb-booking-calendar-sync-free
locale: de
title: Airbnb- und Booking.com-Kalender kostenlos synchronisieren (2026)
excerpt: Airbnb- und Booking.com-Kalender kostenlos per iCal synchronisieren. Schritt-für-Schritt, echte Aktualisierungsintervalle und wann sich ein bezahlter Channel Manager lohnt.
status: draft
tags:
  - airbnb:Airbnb
  - booking-com:Booking.com
  - calendar-sync:Kalendersynchronisation
  - ical:iCal
ogImageUrl: /blog-covers/airbnb-booking-calendar-sync-free.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Airbnb- und Booking.com-Kalender kostenlos synchronisieren (2026)

Im letzten Juni hätte ich beinahe einen Gast aus Stuttgart doppelt eingebucht. Airbnb sperrte die Termine in dem Moment, in dem er bezahlte; Booking.com zeigte dieselbe Woche noch vier Stunden lang als verfügbar an. Bis der iCal-Feed nachgezogen hatte, hatte ein Gast aus Taschkent bereits die gleichen Termine angefragt. Eine Buchung wurde erstattet, eine behalten, und ich verbrachte den Abend mit jeder Hilfeartikel-Seite zur Frage, wie man Airbnb und Booking.com synchronisiert, ohne 200 $ im Monat dafür auszugeben.

Diese Anleitung ist das Ergebnis. Kostenlose Werkzeuge, echte Aktualisierungsintervalle, eine ehrliche Antwort darauf, was funktioniert und was nicht.

## TL;DR

- Sowohl Airbnb als auch Booking.com bieten kostenlose, private **iCal-Export-URLs**. Kein Partnervertrag nötig.
- iCal ist pro URL einseitig. Zwei Listings bedeuten **zwei URLs in jede Richtung**: Airbnbs Export in Booking, Bookings Export in Airbnb.
- Airbnb aktualisiert importierte Kalender alle **2 bis 4 Stunden**. Booking.com alle **2 bis 6 Stunden**. Aus dieser Lücke kommen die seltenen Doppelbuchungen.
- Eine kostenlose Zwischenschicht (das Open-Source-Projekt [RentTools](/onboard) oder ein selbstgebauter Cron) aktualisiert schneller, kann aber den Poll-Takt der Zielplattform nicht beschleunigen.
- Bei 1 bis 3 Listings deckt iCal 99 % der Fälle. Ab 20+ Listings oder 90 % Auslastung lohnt sich ein bezahlter Channel Manager.

## Das eigentliche Problem

Zwei Buchungsportale. Eine physische Wohnung. Sobald jemand auf Airbnb bucht, müssen alle anderen Portale es innerhalb von Minuten wissen, nicht Stunden.

Wer nur auf Airbnb inseriert, braucht nichts davon. Airbnbs Kalender ist seine eigene Quelle der Wahrheit.

Der Ärger fängt beim zweiten Listing an. Sie haben zwei Quellen, die übereinstimmen müssen. Der Haken: Keine Plattform gibt der anderen eine private API. Man bekommt nur eine öffentlich lesbare iCal-URL, die die Gegenseite in eigenem Takt abfragt.

Genau das überspringen die meisten Gratis-Anleitungen. iCal-Sync ist **nicht** echtzeitfähig. Sie ist „meistens schnell genug", und die Momente, in denen sie es nicht ist, sind genau die, die wehtun: zwei Gäste, die innerhalb des Poll-Fensters dieselben Termine buchen.

Drei Dinge sind unten zu tun. Die iCal-URL aus Airbnb holen, eine aus Booking.com holen und entscheiden, was wohin zeigt. Es gibt kein viertes.

## Schritt 1: Airbnb-iCal-URL holen

Öffnen Sie Ihr Airbnb-Host-Dashboard. Der Pfad:

1. Oben auf **Kalender** klicken.
2. Das Listing wählen, das synchronisiert werden soll.
3. Rechts in der Seitenleiste auf **Verfügbarkeit**, dann **Kalender synchronisieren**.
4. Auf **Kalender exportieren** klicken.
5. Die lange URL kopieren. Sie sieht ungefähr so aus: `https://www.airbnb.com/calendar/ical/12345678.ics?s=AAA...`.

*Abbildung 1: Airbnbs Panel „Kalender synchronisieren". Screenshot folgt; landet unter /blog/airbnb-booking-calendar-sync-free/figure-1.png.*

Zwei Dinge vor dem Weitermachen. Erstens: Diese URL ist privat. Wer sie hat, kann jedes gebuchte Datum auf Airbnb lesen. Behandeln Sie sie wie ein Passwort. Zweitens: Die URL bleibt statisch, bis Sie auf **URL zurücksetzen** klicken — das tun Sie, wenn sie je nach außen geraten ist.

Wer **Kalender synchronisieren** beim ersten Mal überspringt, bei dem hat Airbnb noch keine URL erzeugt. Mindestens einmal anklicken, um die Funktion zu wecken. Den [offiziellen Airbnb-Hilfeartikel](https://www.airbnb.com/help/article/99) für die kanonische Schrittfolge lesen.

## Schritt 2: Booking.com-iCal-URL holen

Bookings Pfad ist zwei Klicks tiefer als Airbnbs, und das ist der Grund, warum die meisten Hosts vor Erreichen beider URLs aufgeben:

1. Im Booking.com-Extranet anmelden.
2. Die Unterkunft wählen.
3. In der Seitenleiste auf **Kalender & Preise** klicken.
4. Auf **Kalender synchronisieren** klicken. (Falls nicht sichtbar: Ihr Objekttyp hat möglicherweise keinen iCal-Zugang. Ferienwohnungen ja; klassische Hotels meistens nicht.)
5. Unter **Kalender exportieren** auf **Exportieren** klicken.
6. URL kopieren. Format etwa: `https://admin.booking.com/hotel/hoteladmin/ical.html?t=AAA...`.

*Abbildung 2: Kalender-Export im Booking.com-Extranet. Screenshot folgt; landet unter /blog/airbnb-booking-calendar-sync-free/figure-2.png.*

Eine Falle: Booking.com versteckt das iCal-Panel bei Konten mit bestimmten Partnerverträgen. Wer einen Channel-Manager-API-Vertrag hat (kleine Hosts in der Regel nicht), bei dem ist iCal absichtlich deaktiviert. Wenn iCal komplett fehlt und Sie keinen Partnervertrag unterschrieben haben, kontaktieren Sie den Partner-Support — der schaltet es wieder frei.

Bookings eigene [Partner-Hub-Anleitung](https://partner.booking.com/en-us/help/calendar-and-pricing/setting-availability/syncing-your-airbnb-and-bookingcom-calendars) führt mit Screenshots durch, die zur aktuellen 2026-UI passen.

## Schritt 3: Airbnb- und Booking.com-Kalender verdrahten

Drei Optionen. Keine ist falsch; die richtige hängt von der Anzahl der Listings ab.

1. **Direkter Kreuz-Import.** Airbnbs URL in Bookings Importfeld einfügen, Bookings URL in Airbnbs Importfeld. Fertig. Jede Seite pollt die andere im eigenen Takt. Kostenlos. Kein drittes Tool. Funktioniert für zwei Plattformen. Skaliert nicht mehr, sobald Sie ein drittes Portal hinzufügen (Vrbo, Expedia, Hostaway-Reseller): Sie müssten jede URL bei jeder anderen Plattform hinterlegen, und die meisten Plattformen begrenzen Importslots auf fünf.
2. **Kostenlose Zwischenschicht.** Ein kleines Open-Source-Tool sitzt zwischen den Plattformen. Sowohl Airbnb als auch Booking importieren von dort; das Tool importiert von beiden. Synchronisation wird zu einer URL pro Plattform, und ein drittes Portal kostet nur zwei neue URLs, nicht vier. Die Aktualisierung in der Mitte kann viel schneller sein als die der Plattformen selbst: Die [RentTools](/onboard)-Instanz pollt alle 10 Minuten. Weiterhin kostenlos; selbst betrieben läuft sie auf einem 4-$-Droplet, oder Sie nutzen die gehostete Version.
3. **Bezahlter Channel Manager.** Hostaway, Lodgify, Smoobu. Echte APIs (sofern das Hostkonto qualifiziert) statt iCal, was nahezu Echtzeit-Synchronisation in beide Richtungen bedeutet. Ab 25 bis 50 $ pro Objekt und Monat, mit Vertragsbindung. Lohnt sich ab 20 Listings oder über 90 % Auslastung. Darunter ist es meistens Augenwischerei.

Ich fahre Option 2 für meine zwei Wohnungen. Die Rechnung: Bei zwei Listings bedeutet die Zwischenschicht, dass eine neue Plattform mit **zwei** URLs ausreicht statt der vier, die Option 1 verlangt. Fünf Minuten Setup; zahlt sich beim nächsten Vrbo-Listing aus.

## Die Aktualisierungsintervall-Falle, vor der niemand warnt

Hier kommt der Teil, den kein Hilfeartikel direkt sagt.

Wenn Airbnb sagt „Kalender werden automatisch synchronisiert", meint es: Airbnb pollt importierte iCals alle 2 bis 4 Stunden. Booking pollt alle 2 bis 6 Stunden. Vrbo kann langsamer sein.

Stellen Sie sich Option 1 vor. Was passiert, wenn ein Gast Ihre Wohnung um 14:00 Uhr auf Airbnb bucht:

1. Airbnb sperrt die Termine sofort auf seiner Seite.
2. Booking.com zieht Airbnbs iCal-Feed irgendwann zwischen 16:00 und 20:00.
3. Bis zu sechs Stunden lang zeigt Ihr Booking-Listing weiterhin „verfügbar".
4. Findet ein zweiter Gast in diesem Fenster Ihr Booking-Listing und bucht dieselben Termine, haben Sie eine Doppelbuchung.

Das ist selten. Es braucht zeitgleiche Käufer auf beiden Plattformen innerhalb der Poll-Lücke, was bei einem kleinen Host mit niedrigem Buchungsvolumen praktisch nie passiert. Aber es passiert, und wenn es passiert, kostet es Sie eine Erstattung, eine möglicherweise negative Bewertung und 90 Minuten E-Mail an zwei Fremde, denen Sie erklären, warum.

Die Zwischenschicht (Option 2) hilft bei der Hälfte. Unsere gehostete Instanz pollt Quellfeeds alle 10 Minuten, RentTools weiß also innerhalb von 10 Minuten von der neuen Airbnb-Buchung. Sie beschleunigt **nicht** Booking.coms Poll *von RentTools*. Booking braucht weiterhin seine eigenen 2 bis 6 Stunden.

Die einzige Lösung für die Zielseite ist Konnektivität auf API-Ebene — und das heißt Option 3.

Genau dafür gibt es Channel Manager. Nicht Features. Nicht hübsche Dashboards. Echtzeit-Updates in der anderen Richtung. Hintergrund, warum iCal nie schneller sein kann als sein Poll-Zyklus, gibt es im Protokoll selbst — beschrieben in [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545); eine „Push"-Erweiterung implementieren die großen Plattformen nicht.

## FAQ

**Ändert sich Airbnbs iCal-URL, wenn ich sie rotiere?**
Ja. Auf **URL zurücksetzen** im Airbnb-Sync-Panel klicken, und die alte URL funktioniert sofort nicht mehr. Sobald Sie ein Leck vermuten, einsetzen: ein öffentlicher Slack, ein Screenshot, eine Forenantwort. RentTools rotiert seinen ausgehenden Feed-URL aus demselben Grund auf Anfrage.

**Woran erkenne ich, dass die iCal-Synchronisation funktioniert?**
Auf beiden Plattformen den Zeitstempel des letzten Abrufs prüfen. Airbnb zeigt ihn unter **Kalender synchronisieren → Importierte Kalender → Zuletzt importiert**. Booking zeigt das Äquivalent unter jedem Feed. Ist ein Zeitstempel älter als 12 Stunden, stimmt etwas auf der Quellseite nicht: URL geändert, Quelldrosselung oder URL rotiert.

**Geht das auch ohne drittes Tool?**
Ja. Option 1, der direkte Kreuz-Import, funktioniert bei zwei Plattformen. Sobald die dritte dazu kommt, werden Sie es bereuen.

**Ist iCal wirklich kostenlos?**
Ja. Sowohl Airbnb als auch Booking.com bieten es als Selbstbedienung in jedem Hostkonto. Wenn ein Tool eine monatliche Gebühr nur für iCal-Sync verlangt, zahlen Sie für die Komfortschicht, nicht für das Protokoll.

**Was kostet RentTools?**
Die gehostete Instanz ist aktuell kostenlos. Selbst betreiben ist auch kostenlos, wenn ein Linux-Server vorhanden ist. Wir tragen Hosting und Gemini-API-Kosten selbst. Mehr zu den Doppelbuchungs-Risiken, gegen die die Sync gedacht ist, im Beitrag [Doppelbuchungen vermeiden](/blog/avoiding-double-bookings).

**Brauche ich das, wenn ich nur auf Airbnb inseriere?**
Nein. Single-Plattform-Hosts brauchen iCal-Sync gar nicht. Sparen Sie diesen Beitrag für den Tag, an dem Sie auf einem zweiten Portal inserieren.

**Was, wenn Airbnbs Importslot „Letzte Synchronisation: nie" anzeigt?**
Drei übliche Ursachen. (1) Die Quell-URL ist falsch: in den Browser einfügen; Sie sollten eine `.ics`-Datei oder Klartext mit `BEGIN:VCALENDAR` bekommen. Eine HTML-Fehlerseite bedeutet falsche URL. (2) Die Quellplattform hat ihre URL neu generiert und die alte ist ungültig: rotieren, Airbnbs Import aktualisieren. (3) Airbnb drosselt neue Feeds in der ersten Stunde manchmal stillschweigend. Eine Stunde warten, dann nochmal prüfen, bevor Sie von einem Defekt ausgehen.

**Nutzt Booking.com das importierte iCal wirklich, oder hat es eigene Logik?**
Booking behandelt importierte Ereignisse als undurchsichtige Blöcke: Termine, die im Feed als belegt markiert sind, werden auf Booking als nicht verfügbar markiert. Es schaut nicht auf Gastnamen, Preise oder anderes. Das ist Feature, kein Bug: Ein geleakter iCal-Export von Booking offenbart nur Ihre Buchungstermine, nie Gastdaten.

## Eine Meinung

Wer eine oder zwei Wohnungen hat und auf Airbnb plus Booking.com inseriert: **Bezahlen Sie noch keinen Channel Manager**. Verdrahten Sie Option 1 oder 2. Das Aktualisierungsintervall-Risiko ist real, aber bei niedrigem Volumen selten, und die Monatsgebühr eines bezahlten Tools übersteigt bei zwei Listings die erwarteten Kosten einer jährlichen Doppelbuchungs-Erstattung.

Wer zehn oder mehr Objekte mit nahezu 90 % Auslastung betreibt, schaut sich Smoobu vor Hostaway an. Smoobus Preise sind bei kleineren Volumina ehrlich, und es legt Channel-Manager-APIs offen, die andere hinter Vertriebstelefonaten verstecken.

Das ist kein Verkaufsargument für mein Tool. Das ist die Mathematik.
