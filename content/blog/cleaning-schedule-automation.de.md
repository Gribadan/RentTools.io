---
slug: cleaning-schedule-automation
locale: de
title: "Reinigungsplan automatisieren für Kurzzeitvermieter"
excerpt: Wie Kurzzeitvermieter den Reinigungsplan automatisieren. Papier-Notizbücher und geteilte Sheets durch einen Reinigungskraft-Workflow ersetzen, der wirklich skaliert.
status: draft
tags:
  - cleaning:Reinigung
  - host-tips:Host-Tipps
  - automation:Automatisierung
ogImageUrl: /blog-covers/cleaning-schedule-automation.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Reinigungsplan automatisieren für Kurzzeitvermieter

Zweieinhalb Jahre lang lief der Reinigungsplan meiner Wohnungen auf einem geteilten Google Sheet. Eine Spalte pro Objekt, eine Zeile pro Tag, ein Emoji für „muss gereinigt werden". Meine Reinigungskraft hatte ein Bookmark auf dem Handy. Wir verloren keinen Wechsel.

Wir skalierten auch nicht. Das Sheet hielt sich durch meinen dienstagsabendlichen Erinnerungs-Zyklus und ihre Bereitschaft, auf einem 5-Zoll-Bildschirm zu scrollen. An dem Tag, an dem ich eine dritte Wohnung dazu nahm, brauchte das Sheet Farbcodes, dann separate Tabs pro Reinigungskraft, dann eine Zellenformel, die ich drei Monate später nicht mehr lese. Da fing ich an, mir richtige Reinigungsplan-Automatisierung anzuschauen — nicht weil das Sheet versagt hatte, sondern weil die dritte Wohnung das Muster brach.

Dieser Beitrag zeigt, was automatisiert gehört, was manuell bleibt, und der Reinigungskraft-Rollen-Flow, den ich heute jedem Host ab seinem zweiten Objekt empfehle.

## TL;DR

- Eine Tabelle funktioniert für ein Objekt. Vielleicht zwei. Danach verfault jedes geteilte Sheet zu einem Knoten verbundener Zellen, dem niemand vertraut.
- Der Reinigungsplan sollte aus dem Kalender abgeleitet sein, nicht parallel gepflegt. Eine Quelle der Wahrheit: der Buchungskalender.
- Geben Sie der Reinigungskraft einen eigenen Login oder eine Magic-Link-Seite. Zeigen Sie die heutigen Objekte, Zeitfenster und einen Erledigt-Button. Mehr nicht.
- Pro Wechsel drei Dinge tracken: Status (offen / in Arbeit / erledigt), Notizen (Auffälligkeiten), Fotos (Beweis + Erinnerung).
- WhatsApp aufhören als Aufzeichnungssystem zu nutzen. Für Chat ja, nicht für „hast du Wohnung 3 gereinigt?".

## Das eigentliche Problem mit einem geteilten Sheet

Ein geteiltes Sheet funktioniert, weil es eine Liste ist. Das Problem: Die Liste hat ohne Filter keinen „Pro-Reinigungskraft"-Modus, und Filter in Sheets brechen, sobald die Reinigungskraft die falsche Zelle antippt.

Drei konkrete Dinge gehen schief beim Wachsen:

1. **Verschiedene Reinigungskräfte brauchen verschiedene Sichten.** Reinigungskraft A macht Studios, B macht Familienvillen. Filter und Tabs funktionieren nur, wenn alle sich disziplinieren, einander nicht die Sicht zu zerstören. Tun sie nicht.
2. **Status ist unscharf.** „Erledigt" in Grün am Dienstagabend kann 09:00 oder 14:00 heißen. Erledigt-Zeit zählt bei einer Anreise um 15:00.
3. **Historie ist unsichtbar.** „Hat die Küchenspüle letzten Monat geleckt?" verlangt Scrollen durch jede Woche überschriebene Zellen. Die Original-Notiz ist weg.

Ein zweckgebautes Reinigungs-Modul löst jedes davon, indem es das Datenmodell umkehrt. Statt eines 2D-Rasters, das man quer liest, sieht die Reinigungskraft eine Liste *ihrer* Aufgaben für *heute*, sortiert nach Anreisezeit. Der Host sieht ein Dashboard aller Wechsel über alle Reinigungskräfte. Gleiche Daten, zwei Sichten.

Sie brauchen kein 200-$/Monat-Tool dafür. Auch unsere kostenlose [RentTools](/onboard)-Instanz hat einen Reinigungskraft-Rollen-Flow, und das ist keine einzigartige Idee. Smoobu, Hostaway, Lodgify: jedes bezahlte PMS hat dasselbe Primitiv. Die Pointe ist, *irgendetwas* Zweckgebautes statt eines Sheets zu nutzen.

## Was ein Reinigungsplan tracken muss

Widerstehen Sie der Versuchung, alles zu tracken. Das Schema, das auf einen Bierdeckel passt, deckt 95 % der Fälle.

Pro Wechsel:

1. **Objekt**: welche Wohnung.
2. **Datum**: Reinigungstag, abgeleitet vom Auscheck-Datum der vorigen Buchung.
3. **Zeitfenster**: frühester Start (nach Auscheck) und spätestes Ende (vor Anreise).
4. **Zugewiesene Reinigungskraft**: der Mensch in Verantwortung. Genau einer; fällt sie aus, eskaliert es.
5. **Status**: offen → in Arbeit → erledigt. Optional: „Auffälligkeit", was den Host pingt.
6. **Notizen**: Freitext, von der Reinigungskraft. Kurz.
7. **Fotos**: 0–3 angehängt. Vorher / nachher / Schaden.

Mehr nicht. Widerstehen Sie „erwartete Dauer", „47-Punkte-Sub-Checkliste" oder „Material-Inventar". Jedes davon startet als gute Idee und verfault zu Rauschen, das niemand liest.

Die Checklisten-Debatte ist real. Meine Meinung: Eine Checkliste ist ein separates Dokument vom Plan. Der Plan sagt „muss bis 14:00 gereinigt sein"; die Checkliste sagt, „was Reinigung bei diesem Objekt heißt". Trennen. Checkliste drucken, in den Vorratsschrank kleben. Plan ins Tool.

Für ein Beispiel, wie sich Sync-Lag und Doppelbuchungsrisiko auf den Plan auswirken (das beeinflusst, wann ein Wechsel überhaupt im Plan auftaucht), siehe [unseren Spickzettel zur Vermeidung von Doppelbuchungen](/blog/avoiding-double-bookings).

## Der Reinigungskraft-Rollen-Flow (kein Host-Login nötig)

Die Reinigungskraft braucht keinen Host-Account. Einen zu geben ist ein leichtes Sicherheitsrisiko (sie sieht jedes Buchungsdetail) und ein UX-Desaster (das Dashboard ist nicht für ihren Job designt).

Das richtige Muster ist eine **dedizierte Reinigungskraft-Rolle**. Drei Regeln, was sie sieht:

1. Heutige Aufgaben zuerst. Morgen darunter. Kein Kalenderraster; eine chronologische Liste.
2. Nur die eigenen Objekte. Macht sie drei von Ihren sechs, sieht sie nicht die anderen drei.
3. Eine Aktion pro Zeile: ein Erledigt-Button. Tippen, bestätigen, fertig. Optional: „Auffälligkeit melden" daneben.

Authentifizierung überdenken Hosts. Die Reinigungskraft braucht kein Passwort. Ein persistenter Magic-Link-Cookie auf dem Handy reicht; sie bookmarked `https://ihrtool.example/cleaner/abc-token-xyz`, der Cookie hält sie ein Jahr eingeloggt, Rotation invalidiert den Link in dem Moment, in dem die Zusammenarbeit endet.

Bei Selbsthosting ist das ungefähr ein Nachmittag Arbeit. Bei einem gehosteten PMS (RentTools, Smoobu, Hostaway) ist der Flow ab Werk dabei.

## Fotos und Notizen: wann fragen, was erfassen

Der optionale Foto-Upload ist die einzige Funktion, die einen Reinigungskraft-Rollen-Flow seinen Aufwand wert macht. Zwei Fotos pro Wechsel geben Ihnen:

1. **Vor-Reinigung.** Zehn Sekunden, die die Reinigungskraft beim Eintreffen nimmt: der Zustand, in dem der vorherige Gast die Wohnung verlassen hat. Klärt 90 % der „der vorherige Gast hat X kaputt gemacht"-Streitigkeiten, wenn der nächste Gast es meldet.
2. **Nach-Reinigung.** Zustand, in dem die Wohnung ist, wenn die Reinigungskraft fertig ist. Klärt Schadensanträge, wenn ein Gast eincheckt und kaputtes Mobiliar meldet, das vier Stunden zuvor okay war.

Sie brauchen kein poliertes Foto. Ein Handy-Schnappschuss vom Bett und einer vom Bad reicht. Ablegen, vergessen, nur abrufen, wenn etwas streitig wird.

Notizen kommen in zwei Geschmacksrichtungen. **Reinigungskraft-Notizen** („Spülmaschinen-Tabs sind alle", „Gast hat einen Mantel vergessen") sind schnelle Textfelder. **Auffälligkeitsmeldungen** („Klimaanlage tropft, Wartung gepingt") sind dasselbe Feld mit einem Flag, das sofort den Host pingt. Ein Feld, zwei Semantiken, per Häkchen gesetzt.

Widerstehen Sie der Forderung nach einem Foto pro Checklisten-Punkt. Die Zeit der Reinigungskraft ist endlich, und wenn jeder Wechsel 30 Fotos braucht, fotografiert sie leere Wände, um die Regel zu erfüllen. Zwei echte Fotos schlagen dreißig Pflichtfotos.

## WhatsApp ist ein Chat-Tool, kein Aufzeichnungssystem

Jeder Host, mit dem ich gesprochen habe, betreibt eine WhatsApp-Gruppe mit der Reinigungskraft. Ich auch. Der Fehler, den wir alle zu lange gemacht haben, war, diese Gruppe als Wahrheitsquelle für den Reinigungsstatus zu behandeln.

WhatsApp ist gut für:
- Kurze „komme 30 Minuten später"-Nachrichten
- Fotos ungewöhnlicher Schäden, die eine Host-Meinung brauchen
- Koordination bei einer Änderung (heute andere Reinigungskraft; Materialbestellungs-Problem)

Es ist schlecht für:
- „Ist Wohnung 3 gereinigt?" mit der Antwort zwei Tage zurückgescrollt
- Tracken, welche Wechsel im Februar übersprungen wurden
- Eine neue Reinigungskraft einarbeiten, ohne 600 Nachrichten weiterzuleiten

WhatsApp für Chat. Reinigungs-Modul für Status. Die zwei sollten nicht um denselben Job konkurrieren. Wenn die Reinigungskraft in WhatsApp fragt „hast du den Wechsel als gereinigt markiert?", lautet die richtige Antwort „das tracke ich nicht. Dein Erledigt-Button tut es. Hast du ihn getippt?"

Das ist ein kultureller Wandel mehr als ein technischer. Es braucht eine Woche Disziplin, bis die Reinigungskraft aufhört, „erledigt"-Nachrichten zu schicken, und dem Tippen des Buttons vertraut.

## FAQ

**Brauche ich ein separates Tool, oder kann ich meinen bestehenden Buchungskalender erweitern?**
Sie können die meisten Kalender erweitern. Google Kalender plus ein paar Makros bringt Sie weit. Ab drei Objekten zahlt sich ein zweckgebautes Reinigungsmodul innerhalb des ersten Monats in eingesparter Koordinationszeit aus.

**Meine Reinigungskraft ist meine Mutter / Partner / eine einzige Vertrauensperson. Brauche ich wirklich eine Rolle?**
Streng nein. Mit einer Reinigungskraft, die auch Familie ist, funktioniert das WhatsApp-und-Sheet-Muster. Der Beitrag ist für den Moment, in dem Sie eine Nicht-Familien-Kraft einstellen oder auf zwei skalieren, wo rollenbasierter Zugriff den Aufwand wert wird.

**Was ist mit Inventar tracken (Toilettenpapier, Seife)?**
Anderes Anliegen, anderes Tool. Eine geteilte Einkaufslisten-Notiz reicht für zwei Objekte; ein echtes Inventar-Tool lohnt sich ab fünf. Nicht an den Reinigungsplan dranschrauben; sie haben unterschiedliche Aktualisierungs-Frequenzen.

**Pro Wechsel oder pro Stunde zahlen?**
Außerhalb des Themas hier, aber meine Meinung: pro Wechsel für Studios, pro Stunde für Villen. Wechsel-Bezahlung skaliert natürlich mit Buchungen; Stunden-Bezahlung passt zur Unvorhersehbarkeit großer Objekte. Innerhalb desselben Objekts mischen führt meist zu Neuverhandlungs-Streit.

**Was passiert, wenn die Reinigungskraft nicht erscheint?**
Status bleibt offen über das Reinigungsfenster hinaus; der Host wird gepingt. Von dort ist es ein Telefonat. Das Tool kann ein No-Show nicht lösen; es kann nur sichtbar machen, dass eines passiert ist, schnell.

**Gibt es eine kostenlose Option für den Reinigungskraft-Flow?**
Ja. Open-Source-PMS-Instanzen zum Selbsthosten (RentTools, KalSync etc.) haben Reinigungskraft-Rollen-Sichten. Auch kostenlose Tarife kleiner kommerzieller PMS-Anbieter. Die kostenlose Option ist nicht der Engpass; die Akzeptanz der Reinigungskraft meist schon.

## Eine Meinung

Der größte Reinigungs-Plan-Fehler ist, **die Reinigungskraft auf den Host-Kalender zu setzen**. Sie zeigen ihr das volle Buchungs-Dashboard, alle Objekte, alle Gastnamen, jede Anreisezeit. Die Reinigungskraft ist überfordert, der Host hat mehr Daten geteilt, als beabsichtigt, und niemand ist glücklicher.

Geben Sie der Reinigungskraft eine Liste. Heute. Erledigt-Button. Das ist die ganze Oberfläche. Wenn Ihr Tool das nicht kann, Tool wechseln oder die Rolle selbst in einem Nachmittag bauen. Die zweieinhalb Jahre auf dem Sheet waren gute Jahre; sie wären bessere Jahre gewesen, hätte ich die Reinigungskraft-Sicht in Monat vier gebaut.
