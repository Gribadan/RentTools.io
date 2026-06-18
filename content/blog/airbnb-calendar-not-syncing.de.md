---
slug: airbnb-calendar-not-syncing
locale: de
title: "Airbnb-Kalender synchronisiert nicht? 7 Gründe für einen veralteten iCal-Feed"
excerpt: "Airbnb-Kalender synchronisiert nicht mit Booking.com? Die 7 Gründe, warum ein iCal-Feed veraltet, der eine Zeitstempel, der jeden verrät, und die Lösung für alle sieben."
status: published
tags:
  - calendar-sync:Kalendersynchronisation
  - ical:iCal
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/airbnb-calendar-not-syncing.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Letzten Winter hat mein Booking.com-Kalender lautlos aufgehört, meine Airbnb-Sperren zu ziehen. Kein Fehler — keine E-Mail, kein rotes Banner. Der Import ist an einem Dienstag eingefroren, und ich habe es erst gemerkt, als ein Gast aus Lyon eine Woche gebucht hat, die ich auf Airbnb längst belegt hatte. Der Feed war in keiner Weise „kaputt", die das Dashboard zugegeben hätte. Er war *veraltet* — und Veralten ist der eine Fehlerfall, vor dem iCal nie warnt.

Das ist der Leitfaden, den ich in jener Nacht gebraucht hätte: die eine Zahl, die verrät, ob ein Feed wirklich kaputt ist, die sieben Gründe, warum er verstummt, und die genaue Lösung für jeden.

## TL;DR

- iCal wirft fast nie einen Fehler — der Feed **veraltet lautlos**. Das Anzeichen ist der Zeitstempel des letzten Imports, kein Banner.
- Die häufigste Ursache ist eine **zurückgesetzte Quell-URL**: Der Import zeigt noch auf eine URL, die die Quelle ausgemustert hat, also scheitert jeder Abruf.
- Airbnb zieht importierte Feeds alle **2–4 Stunden**, Booking.com alle **2–6 Stunden**. „Noch nicht synchronisiert" nach drei Stunden ist normal, nicht kaputt.
- Ein Feed, der älter als **24 Stunden** ist, ist ein echtes Problem. Fügen Sie die Quell-URL in den Browser ein — Sie wollen `BEGIN:VCALENDAR` sehen, keine HTML-Fehlerseite.
- Plattformen **verwerfen einen Feed** nach wiederholt gescheiterten Abrufen und sagen nichts. Den Import neu anlegen weckt ihn wieder auf.
- Eine Zwischenschicht, die alle **10 Minuten** abfragt, verkleinert das Risikofenster, kann aber den eigenen Abruf der Zielplattform nicht beschleunigen.

## Warum iCal verstummt, statt zu brechen

iCal-Sync ist ein *Abruf*, kein *Push*. Wenn Sie Airbnb mit Booking.com „verbinden", öffnet keine der Plattformen der anderen eine Live-API. Die Zielplattform ruft einfach eine öffentliche `.ics`-URL nach ihrem eigenen Takt ab — alle paar Stunden — und überschreibt ihre importierten Sperren mit dem, was sie gefunden hat.

Dieses Design hat einen unangenehmen Nebeneffekt. Wenn die Quell-URL aufhört zu antworten — falsche URL, Quelle kurz down, Quelle hat ihre URL rotiert —, meldet das Ziel keinen Fehler. Es behält die zuletzt erfolgreich abgerufenen Daten und versucht es im nächsten Zyklus erneut. Aus Sicht des Dashboards ist alles in Ordnung. Der Kalender zeigt weiter Sperren an — nur eben in der Zeit eingefroren.

Eine echte API-Verbindung würde einen `401` oder `404` werfen, den Sie sehen würden. iCal wirft nichts. Das Protokoll ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545)) hat keinen Push-Kanal und kein Standardsignal „dieser Feed ist tot", das die großen Plattformen an Hosts durchreichen. Der Fehler bleibt also unsichtbar — bis ein zweiter Gast Daten bucht, die Ihre andere Plattform für frei hält.

## Die einzige Diagnose, die zählt: der letzte Import

Bevor Sie auch nur eine URL ändern, lesen Sie eine Zahl: Wann wurde dieser Feed zuletzt erfolgreich importiert?

- **Airbnb:** Calendar → Unterkunft wählen → **Availability** → **Sync calendars** → unter **Imported calendars** zeigt jeder Feed, wie lange der letzte Import her ist.
- **Booking.com:** Extranet → **Calendar & Pricing** → **Sync calendars** → der Import-Bereich listet jeden verbundenen Feed mit seinem letzten Sync-Zeitpunkt.

Lesen Sie es jetzt so:

| Letzter Import | Urteil |
| --- | --- |
| Minuten bis wenige Stunden her | Gesund. Hören Sie hier auf. |
| 4–12 Stunden her | Bei Booking.com wohl in Ordnung (2–6-h-Takt); bei Airbnb grenzwertig (2–4 h). In einer Stunde erneut prüfen. |
| Mehr als 24 Stunden her | Kaputt. Arbeiten Sie die Liste unten ab. |
| „Nie" / leer | Noch nie erfolgreich abgerufen. URL falsch, oder die Quelle hat den ersten Abruf gedrosselt. |

Dieser Zeitstempel ist das ganze Spiel. Neun von zehn „Mein Kalender synchronisiert nicht"-Paniken sind entweder ein gesunder Feed im normalen Fenster oder ein Feed, der seit Tagen tot ist und auf dessen Datum niemand geschaut hat.

## Die sieben Gründe, warum ein Feed veraltet — und die Lösung für jeden

### 1. Die Quell-URL wurde zurückgesetzt (die Ursache Nummer eins)

**Symptom:** Der Feed lief; der letzte Import ist jetzt Tage her oder „nie". **Ursache:** Jemand hat auf der Quellplattform **Reset URL** geklickt — Sie, ein Co-Host oder Sie selbst nach einem Schreck um eine geleakte URL. Das Zurücksetzen tötet die alte URL sofort, und das Ziel hält noch die ausgemusterte. Jeder Abruf seitdem ist still mit 404 gescheitert.

**Lösung:** Kopieren Sie die *aktuelle* Export-URL von der Quelle, löschen Sie den toten Import am Ziel und legen Sie ihn neu an. Dann die URL testen (siehe die Prüfung in Grund 5). Behandeln Sie die Export-URL wie ein Passwort — Zurücksetzen nach einem Leak ist richtig, aber Sie müssen sie noch am selben Tag überall aktualisieren, wo sie importiert wird.

### 2. Sie sind im normalen Aktualisierungsfenster (Fehlalarm)

**Symptom:** Sie haben vor 40 Minuten Daten auf Airbnb gesperrt, und Booking.com zeigt sie noch frei. **Ursache:** nichts. Booking.com zieht alle 2–6 Stunden; der nächste Zyklus ist einfach noch nicht gelaufen.

**Lösung:** warten. Wenn es bei Booking.com länger als 6 Stunden oder bei Airbnb länger als 4 Stunden her ist, *dann* behandeln Sie es als echt und gehen die Liste weiter. Das ist der häufigste Fehlalarm — Hosts beobachten das Ziel zehn Minuten lang und schließen, der Sync sei kaputt, dabei schläft er nur bis zum nächsten Abruf.

### 3. Die Plattform hat den Feed nach wiederholten Fehlern lautlos verworfen

**Symptom:** Der Feed lief, dann war die Quelle einen Tag kurz down (Wartung, eine rotierte URL, die Sie später gefixt haben), und jetzt erholt er sich nicht mehr, obwohl die URL wieder lebt. **Ursache:** Nach mehreren gescheiterten Abrufen in Folge hören manche Plattformen ganz auf, einen Feed abzufragen, und schalten ihn nicht von selbst wieder ein. Der Fehlerzähler ist eingerastet.

**Lösung:** Löschen Sie den Import und legen Sie genau dieselbe URL neu an. Das setzt den Zähler zurück, und die Plattform beginnt von vorn. Eine lebende URL, die nach 24 Stunden immer noch nicht synchronisiert, ist fast immer dieser Fall.

### 4. iCal ist auf dem Quellkonto deaktiviert

**Symptom:** Es gibt gar keine Export-URL zum Kopieren, oder das Panel **Sync calendars** fehlt an der Quelle. **Ursache:** Konten mit einem Channel-Manager- oder API-Partnervertrag haben iCal per Design abgeschaltet — die Plattform nimmt die API als Quelle der Wahrheit an. Manche Booking.com-Objekttypen (klassische Hotels, anders als Ferienunterkünfte) zeigen iCal nie an.

**Lösung:** Wenn Sie einen Partner-/API-Vertrag unterschrieben haben, ist das so gewollt — Ihr Sync läuft über die API, nicht über iCal. Haben Sie nichts unterschrieben und iCal ist einfach weg, wenden Sie sich an den Partner-Support; für Ferienunterkünfte schalten sie es wieder frei.

### 5. Der Feed importiert, aber die Sperren landen nicht

**Symptom:** Der letzte Import ist frisch — vor Minuten —, aber die Daten zeigen weiter frei. **Ursache:** Der Import war erfolgreich, aber die Termine tragen keinen Belegt-Status, oder der Importer liest nur ganztägige `DATE`-Termine, und die Quelle hat zeitgebundene gesendet. Bei Airbnb und Booking.com selten (sie senden saubere Ganztagssperren), bei selbstgebauten oder obskuren Feeds häufig.

**Lösung:** Öffnen Sie die `.ics` in einem Texteditor und schauen Sie auf ein `VEVENT`. Sie wollen Ganztagssperren im Stil `DTSTART;VALUE=DATE:20260714` über die erwarteten Daten. Hier der schnelle Browser-Test für *jede* iCal-URL:

1. Fügen Sie die Export-URL in die Adresszeile des Browsers ein.
2. Ein lebender Feed lädt entweder eine `.ics`-Datei herunter oder zeigt Klartext, der mit `BEGIN:VCALENDAR` beginnt.
3. Eine HTML-Fehlerseite, ein Login-Bildschirm oder eine leere Antwort heißt: Die URL ist tot — zurück zu Grund 1.

### 6. Ein Zeitzonen-Versatz verschiebt jede Sperre um einen Tag

**Symptom:** Sperren importieren, landen aber einen Tag daneben — Abreisetag gesperrt, Anreisetag frei, oder umgekehrt. **Ursache:** Ein Feed, der *zeitgebundene* Termine mit einer `TZID` sendet, die das Ziel in UTC liest, kann eine Sperre über Mitternacht rollen. Ein Start um 23:00 Ortszeit wird in UTC zum Folgetag.

**Lösung:** Bevorzugen Sie Ganztagssperren (`VALUE=DATE`) gegenüber zeitgebundenen. Die großen Plattformen tun das bereits; wenn der Feed Ihnen gehört (selbst gehostet, Custom-Export), senden Sie Daten, keine Zeitstempel. Müssen Sie einen zeitgebundenen Feed konsumieren, ist der Versatz von genau einem Tag das Anzeichen — verschwenden Sie keine Stunde damit, die URL zu beschuldigen.

### 7. Sie sind ans Import-Slot-Limit gestoßen

**Symptom:** Sie können keinen weiteren importierten Kalender hinzufügen, oder der neueste wird lautlos ignoriert. **Ursache:** Die meisten Plattformen begrenzen importierte Feeds auf etwa fünf pro Unterkunft. Listen Sie auf Airbnb, Booking.com, Vrbo, Expedia und einer Direkt-Seite, gehen die Slots schnell aus, wenn jede Plattform jede andere importieren muss.

**Lösung:** Falten Sie das Netz zu einer Nabe-Speiche-Struktur zusammen. Statt dass N Plattformen je N−1 andere importieren, betreiben Sie einen Zwischen-Feed pro Plattform: Jede Plattform importiert die Nabe, die Nabe importiert jede Plattform. Zwei Plattformen sind vier Direkt-URLs; die Nabe macht zwei daraus. Das ist auch der Grund, warum der direkte Kreuz-Import jenseits von zwei Plattformen lautlos aufhört zu skalieren — mehr dazu in [Doppelbuchungen vermeiden](/blog/avoiding-double-bookings).

## Wenn die Lücke die der Plattform ist, nicht Ihre

Jetzt der ehrliche Teil. Selbst wenn alle sieben Ursachen ausgeschlossen sind und jeder Feed gesund ist, ist der eigene Abruf der Zielplattform die Untergrenze. Booking.com zieht alle 2–6 Stunden, und daran ändern Sie nichts.

Eine Zwischenschicht hilft bei der Hälfte des Problems. Ein Open-Source-Tool wie [RentTools](/onboard) — oder ein Cronjob, den Sie selbst schreiben — fragt die *Quell*-Feeds alle 10 Minuten ab, sodass Ihre Nabe von einer neuen Airbnb-Buchung in zehn Minuten erfährt statt in Stunden. Was es nicht kann: Booking.com dazu bringen, *aus der Nabe* schneller zu ziehen, als Booking.com will. Das Einzige, was den Abruf-Zyklus ganz schlägt, ist Echtzeit-API-Anbindung, die Airbnb und Booking.com nur an zertifizierte PMS-Anbieter für 100–300 $ im Monat verkaufen.

Bei einer bis drei Unterkünften müssen Sie wegen des Aktualisierungsfensters nicht schlecht schlafen. Die Veraltungs-Ursachen oben — eine zurückgesetzte, nicht aktualisierte URL, ein Feed, den die Plattform lautlos verworfen hat — verursachen bei kleinem Maßstab weit mehr Doppelbuchungen als der 2–6-Stunden-Abruf je. Wollen Sie die volle Einrichtung statt der Fehlersuche, beginnen Sie mit [Airbnb- und Booking.com-Kalender kostenlos synchronisieren](/blog/airbnb-booking-calendar-sync-free).

## FAQ

**Warum sagt mein Airbnb-Kalender „Last sync: never"?**
Der Feed wurde noch nie erfolgreich abgerufen. Drei übliche Ursachen: Die Import-URL ist falsch (fügen Sie sie in den Browser ein — Sie sollten einen `.ics`-Download oder Text mit `BEGIN:VCALENDAR` bekommen, keine Fehlerseite); die Quellplattform hat ihre URL rotiert, nachdem Sie eine ältere kopiert haben; oder Airbnb hat den allerersten Abruf eines neuen Feeds kurz gedrosselt. Warten Sie eine Stunde und prüfen Sie erneut, bevor Sie von kaputt ausgehen.

**Wie lange sollte Airbnb für die Synchronisation eines importierten Kalenders brauchen?**
Airbnb zieht importierte Feeds alle 2 bis 4 Stunden. Booking.com ist langsamer, 2 bis 6 Stunden, und Vrbo kann noch langsamer sein. Wenn Sie vor wenigen Minuten Daten gesperrt haben, weiß die andere Plattform es legitim noch nicht. Behandeln Sie es erst als Problem, wenn der Feed über sein normales Fenster hinaus ist.

**Mein Booking.com-Kalender sperrt keine Daten, die ich auf Airbnb belegt habe. Was ist los?**
Prüfen Sie zuerst den letzten Import auf Booking.com-Seite. Ist er ein paar Stunden alt und frisch, läuft der Import und Sie sind nur im Aktualisierungsfenster — warten. Ist er über 24 Stunden alt oder „nie", ist die URL wahrscheinlich tot: auf Airbnb-Seite zurückgesetzt oder von Booking.com nach Fehlern verworfen. Kopieren Sie die aktuelle Airbnb-Export-URL und legen Sie den Import neu an.

**Bricht das Zurücksetzen meiner iCal-URL bestehende Syncs?**
Ja, sofort. In dem Moment, in dem Sie Reset URL klicken, funktioniert die alte URL nicht mehr, und jede Plattform, die sie noch importiert, veraltet lautlos. Zurücksetzen ist die richtige Reaktion auf eine geleakte URL, aber am selben Tag müssen Sie die neue URL überall einfügen, wo die alte importiert wurde.

**Wie teste ich, ob eine iCal-URL tatsächlich lebt?**
Fügen Sie sie in die Adresszeile des Browsers ein. Ein lebender Feed lädt entweder eine `.ics`-Datei oder zeigt Klartext, der mit `BEGIN:VCALENDAR` beginnt. Bekommen Sie eine HTML-Fehlerseite, einen Login-Bildschirm oder nichts, ist die URL tot — das ist Ihr Problem, nicht das der Zielplattform.

**Kann ein veralteter iCal-Feed eine Doppelbuchung auslösen?**
Ja — das ist genau der Mechanismus. Ist Ihr Booking.com-Import des Airbnb-Kalenders zwei Tage eingefroren, zeigt Booking.com weiter Daten frei, die Airbnb längst verkauft hat. Ein zweiter Gast bucht sie, und Sie schulden einem der beiden eine Stornierung und eine Entschuldigung. Deshalb zählt die wöchentliche Zeitstempel-Kontrolle.

**Warum gibt es keinen Fehler, wenn die iCal-Synchronisation scheitert?**
Weil iCal ein Abruf-Protokoll ohne Push-Kanal und ohne Standard-Gesundheitssignal ist. Das Ziel ruft eine URL nach Takt ab; scheitert der Abruf, behält es die letzten guten Daten und versucht es später. Im Standard gibt es nichts, was das Ziel zwingt, Sie zu alarmieren — also tut es das nicht.

**Wie oft aktualisiert RentTools die Feeds?**
Alle 10 Minuten auf der Quellseite. Das heißt, die Nabe erfährt von einer neuen Buchung in zehn Minuten statt in den Stunden, die ein direkter Plattform-zu-Plattform-Import braucht. Die Zielplattform dazu zwingen, schneller als ihr eigener 2–6-Stunden-Zyklus aus der Nabe zu ziehen, kann es trotzdem nicht — das kann kein iCal-Tool.

## Eine Meinung mit Haltung

Hören Sie auf, das Aktualisierungsfenster als den Feind zu sehen. Das spektakulär klingende „iCal ist nicht in Echtzeit"-Problem verursacht bei kleinem Maßstab weniger Doppelbuchungen als das Langweilige: eine URL, die jemand zurückgesetzt und zu aktualisieren vergessen hat, ein Feed, den die Plattform lautlos nicht mehr abfragt. Beides bleibt unsichtbar, solange Sie nicht auf den letzten Import schauen — also schauen Sie. Einmal pro Woche jeden importierten Feed öffnen und ein Datum lesen. Eine Zwanzig-Sekunden-Gewohnheit, die die stillen Fehler fängt, die das Dashboard nur zu gern vor Ihnen verbirgt.
