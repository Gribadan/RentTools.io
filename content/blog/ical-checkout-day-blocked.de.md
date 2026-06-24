---
slug: ical-checkout-day-blocked
locale: de
title: "iCal blockiert den Abreisetag? Der Off-by-One-Fehler, der Nächte frisst"
excerpt: Ihr Kalender synchronisiert sauber, doch der Abreisetag gilt auf der anderen Plattform als belegt. Warum iCals exklusives DTEND und Zeitzonen leise eine verkaufbare Nacht blockieren.
status: published
tags:
  - calendar-sync:Kalendersynchronisation
  - ical:iCal
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/ical-checkout-day-blocked.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Ein Gast checkte an einem Samstag um 11 Uhr aus meiner Wohnung in Taschkent aus. Bis 13 Uhr war die Wohnung gereinigt und bezugsfertig. Jemand wollte genau diesen Samstag auf Booking.com buchen — und bekam „nicht verfügbar". Die Nacht war weg, und ich verstand nicht, warum: Die Kalender synchronisierten einwandfrei. Die Daten waren nur um genau einen Tag verschoben.

Vor diesem Fehler warnt niemand. Der iCal-Feed ist frisch, die Zeitstempel aktuell, jeder Abruf gelingt — und die Plattform blockiert trotzdem den falschen Tag. Hier steht, warum das passiert, wie Sie es in zwei Minuten bei sich nachweisen und wie Sie jede Ursache beheben.

## TL;DR

- Ein Kalender kann sauber synchronisieren und trotzdem die falsche Nacht blockieren — es liegt nicht am Veralten.
- iCals `DTEND` ist **exklusiv**: Der Abreisetag soll buchbar bleiben, nicht gesperrt sein.
- Zwei Ursachen: ein Feed, der den Abreisetag *inklusiv* sperrt, oder **Zeitzonen-Versatz**.
- Ganztägige `VALUE=DATE`-Termine sind sicher; ein `DATE-TIME` mit `Z` am Ende ist das Risiko.
- Öffnen Sie die `.ics` und lesen Sie `DTSTART` / `DTEND`: acht Ziffern, kein `T`, heißt ganztägig.
- Jeder fälschlich gesperrte Abreisetag ist eine verkaufbare Nacht, die Sie nie zu sehen bekommen.

## Der Fehler, der sich hinter funktionierender Synchronisation versteckt

Die meisten Kalenderprobleme drehen sich um einen veraltenden Feed: eine zurückgesetzte URL, ein Feed, den die Plattform nach wiederholten Fehlversuchen still abgeschaltet hat, ein Import mit der Meldung „Letzte Synchronisierung: nie". Wenn das Ihr Symptom ist, gehört Ihnen der Schwester-Artikel dazu, [warum ein Airbnb-Kalender nicht mehr synchronisiert](/blog/airbnb-calendar-not-syncing): sieben Ursachen, alle davon, dass der Feed sich nicht aktualisiert.

Hier ist es umgekehrt. Der Feed aktualisiert sich einwandfrei. Der Zeitstempel „Zuletzt importiert" ist zwanzig Minuten alt. Jede Buchung auf Airbnb erscheint innerhalb des Abrufintervalls auf Booking.com. Und doch gilt eine bestimmte Nacht — fast immer ein Abreisetag, manchmal die Nacht vor einer Anreise — als belegt, obwohl die Wohnung nachweislich leer ist.

Sie bekommen keine Fehlermeldung. Sie bekommen einen Kalender, der selbstbewusst und leise um genau einen Tag danebenliegt. Auffallen tut es nur, wenn ein Gast schreibt „bei Ihnen ist belegt" für ein Datum, das Sie als frei kennen — oder wenn Sie selbst auf die Suche gehen, warum sich ein gefragter Samstag nie verkauft hat.

## Warum der Abreisetag frei sein muss

iCal ist kein vages Format, sondern ein Standard — [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) — und er beschreibt präzise, wie ein Datumsbereich funktioniert. Für einen ganztägigen Termin ist die Buchung das halboffene Intervall `[DTSTART, DTEND)`. `DTSTART` ist enthalten. `DTEND` **nicht**. Es ist der Morgen *nach* der letzten Nacht.

Nehmen wir einen Aufenthalt von drei Nächten: Anreise 10. Juli, Abreise 13. Der Gast übernachtet vom 10. bis zum 12. — drei Nächte. Der korrekte iCal-Block sieht so aus:

```
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260710
DTEND;VALUE=DATE:20260713
SUMMARY:Reserved
END:VEVENT
```

Beachten Sie `DTEND:20260713`, nicht `20260712`. Der 13. ist der Abreisetag, und nach der exklusiven Regel ist er **frei**: Ein neuer Gast kann am selben Nachmittag einchecken. Das ist kein Schlupfloch, sondern wie aufeinanderfolgende Buchungen funktionieren sollen. Die Plattformen bilden das korrekt ab: Airbnb und Booking.com behandeln den Abreisetag beide als buchbar für eine Anreise am selben Tag — genau das erlaubt Ihnen den engen Wechsel an einem gefragten Wochenende.

Wenn der Abreisetag also als belegt erscheint, hat etwas zwischen Quell- und Zielplattform aufgehört, das exklusive `DTEND` zu respektieren. Das passiert auf zwei Wegen.

## Ursache 1: ein Feed, der den Abreisetag blockiert

Der erste Fehler ist ein inklusives `DTEND`. Irgendwo in der Kette wird eine Nacht, die frei sein sollte, als belegt gezählt.

Das zeigt sich zweifach. Entweder ist der **Feed-Generator** falsch — ein selbstgebautes Cron-Skript oder ein veralteter Channel Manager schreibt `DTEND:20260714` (einen Tag zu weit) oder gibt einen eigenen Block für den Abreisetag aus —, oder der **Importeur** behandelt `DTEND` als inklusiv und sperrt bis einschließlich 13., obwohl der Feed `20260713` sagt.

In der Praxis ist meist der Generator schuld, denn die großen Plattformen beherrschen die exklusive Regel. Wenn Sie Airbnb ohne Zwischenschicht direkt nach Booking.com synchronisieren, stoßen Sie selten darauf. Sie stoßen darauf, wenn ein drittes Werkzeug in der Kette steckt — Ihr Skript, ein kleineres PMS, ein Tabellen-zu-iCal-Export —, das sich um eins verzählt. Der Klassiker: Jemand denkt „der Aufenthalt geht vom 10. bis zum 13." und schreibt `DTEND:20260713` im Sinne von **inklusiv**, während iCal denselben Wert als **exklusiv** liest und den 13. freigibt. Ob zu viel oder zu wenig gesperrt wird, hängt allein vom Denkmodell des Autors ab — und das Format warnt ihn in keine Richtung.

Das Ergebnis ist echtes Geld: Jeder fälschlich gesperrte Abreisetag ist ein Wechsel am selben Tag, den Sie nicht verkaufen können. Bei einer Unterkunft, die in der Hochsaison Rücken an Rücken läuft, ist das eine Nacht pro Woche — weg, ohne eine einzige Fehlermeldung.

## Ursache 2: Zeitzonen verschieben die Nacht

Der zweite Fehler ist subtiler und für grenzüberschreitende Hosts weit häufiger. Er kommt von Feeds, die Daten als `DATE-TIME` statt als ganztägiges `DATE` ausgeben.

Ein ganztägiger Termin hat keine Zeitzone: `20260713` ist überall auf der Welt der 13. Manche Feeds geben eine Buchung aber mit Uhrzeit und Zeitzone aus — oder, schlimmer, auf UTC normalisiert:

```
DTSTART:20260713T000000Z
DTEND:20260716T000000Z
```

Das `Z` steht für UTC. Jetzt muss die importierende Plattform das in *ihre* lokale Zeit umrechnen, bevor sie entscheidet, auf welchen Kalendertag der Block fällt. Ein Block, der um `20260713T000000Z` beginnt — Mitternacht UTC —, wird aus einer Zeitzone fünf Stunden hinter UTC zu 19 Uhr am **12.** Juli. Auf ein Datum gekürzt, haben Sie gerade den 12. gesperrt — eine Nacht, die frei sein sollte. Der Block ist um einen Tag nach vorn gerutscht. Jetzt gilt die Nacht *vor* der Anreise Ihres Gastes als belegt.

Liegt die Unterkunft östlich von UTC, rutscht es andersherum. Eine Abreise, die einen Morgen freigeben sollte, lässt die Nacht stattdessen belegt, weil die umgerechnete Zeit auf den nächsten Tag aufrundet. Gleiche Ursache, umgekehrtes Symptom.

Obendrauf kommt die Sommerzeit mit ihrem Versatz von einer Stunde. Eine Buchung, die im Winter perfekt auf der Grenze lag, kann um einen Tag verrutschen — in den Wochen, in denen Quell- und Zielseite auf unterschiedlichem Umstellungsplan sind: Europa und die USA stellen die Uhren an verschiedenen Daten um, also gibt es jedes Frühjahr und jeden Herbst ein Fenster von zwei bis drei Wochen, in dem ein `DATE-TIME`-Termin nahe Mitternacht kippt. Wenn Ihr Tagesversatz nur einen Teil des Jahres auftaucht — das ist der Grund.

Der Hinweis steckt im Feed selbst: Ein `DATE-TIME`-Wert (er hat ein `T`, oft ein abschließendes `Z` oder einen `TZID=`-Präfix) ist zeitzonenabhängig und der Hauptverdächtige. Ein schlichtes `VALUE=DATE` mit acht Ziffern und ohne `T` ist immun.

## So weisen Sie es bei sich nach

Sie müssen nicht raten. Zwei Minuten mit dem rohen Feed klären es.

1. Holen Sie sich die iCal-**Export**-URL der Quellplattform — die, die Sie aus Airbnb (Calendar → Sync calendars → Export) oder Booking.com (Calendar & Pricing → Sync calendars → Export) kopieren.
2. Fügen Sie sie direkt in einen Browser ein. Sie erhalten eine `.ics`-Datei oder eine Textwand, die mit `BEGIN:VCALENDAR` beginnt. Bekommen Sie stattdessen eine HTML-Fehlerseite, ist Ihr Problem das Veralten, nicht die Daten — zurück zur [Checkliste für den festgefahrenen Feed](/blog/airbnb-calendar-not-syncing).
3. Suchen Sie das `VEVENT` einer Buchung, deren echte Daten Sie genau kennen. Lesen Sie ihr `DTSTART` und `DTEND`.

Nun deuten Sie, was Sie sehen:

| So sieht die Feed-Zeile aus | Was sie bedeutet | Versatz-Risiko |
| --- | --- | --- |
| `DTSTART;VALUE=DATE:20260710` | Ganztägig, ohne Zeitzone | Keins — die sichere Form |
| `DTEND;VALUE=DATE:20260713` | Abreisetag, exklusiv (korrekt) | Keins |
| `DTEND;VALUE=DATE:20260712` | Letzte Nacht, nicht Abreisetag | Inklusiv-Fehler — sperrt den Wechsel |
| `DTSTART:20260710T140000Z` | Eine Uhrzeit in UTC | Hoch — wird je Zeitzone umgerechnet |
| `DTSTART;TZID=...:20260710T140000` | Eine Uhrzeit in einer benannten Zone | Mittel — hängt vom Importeur ab |

Gleichen Sie anschließend mit der Zielseite ab: Öffnen Sie den fraglichen Tag im Kalender der anderen Plattform. Sagt der Feed, der Abreisetag sei frei (`DTEND` ist das Abreisedatum, ganztägig), die Zielseite zeigt ihn aber belegt, ist der Importeur schuld. Steckt der falsche Tag schon im Feed selbst, sind es die Quelle oder ein Zwischenwerkzeug.

## So beheben Sie jede Ursache

Die Behebung hängt davon ab, welches Glied der Kette falsch ist — und vor allem, ob Sie es kontrollieren.

**Wenn Sie den Feed-Generator kontrollieren** (Ihr eigenes Skript, ein selbst gehosteter Exporter): Geben Sie ganztägige Termine mit `VALUE=DATE` aus und setzen Sie `DTEND` auf den **Abreisetag**, nicht auf die letzte Nacht. Geben Sie für einen Ganztagesblock nie eine Uhrzeit aus. Diese eine Änderung erledigt beide Ursachen an der Quelle: keine Zeitzone zum Umrechnen, kein Zaunpfahlfehler.

**Wenn die Quelle `DATE-TIME` ausgibt und Sie es nicht ändern können:** Setzen Sie eine normalisierende Schicht zwischen die Plattformen. Sie nimmt den unsauberen Feed auf, schreibt jede Buchung in einen ganztägigen `VALUE=DATE`-Termin in der Zeitzone der Unterkunft um und veröffentlicht den anderen Plattformen einen sauberen Feed zum Import. Genau das tut ein iCal-bewusstes Werkzeug wie [RentTools](/onboard) bei jedem Abruf: Es pinnt jeden Block auf den lokalen Kalendertag der Unterkunft, bevor jemand weiter unten ihn falsch lesen kann. Das Zeitzonen-Roulette über Grenzen hinweg ist vorbei.

**Wenn der Importeur `DTEND` als inklusiv behandelt** und Sie den Plattform-Code nicht ändern können (können Sie nicht), haben Sie zwei Möglichkeiten: einen Puffertag für die Reinigung einbauen, sodass der Abreisetag absichtlich gesperrt ist — siehe [Puffertage](/blog/cleaning-buffer-days) —, oder über eine Zwischenschicht leiten, die es ausgleicht. Der Puffer verdeckt das Symptom, statt es zu heilen — in Ordnung, bis zu dem Tag, an dem Sie diesen Wechsel verkaufen wollen.

Prüfen Sie nach jeder Behebung so, wie Sie diagnostiziert haben: Feed abrufen, sicherstellen, dass `DTEND` das ganztägige Abreisedatum ist, dann nachsehen, dass der Zielkalender den Abreisetag als buchbar zeigt. Vertrauen Sie nicht darauf, dass es geklappt hat — schauen Sie auf die Zelle.

## Was der Tagesversatz wirklich kostet

Der Grund, warum sich eine Diagnosesitzung lohnt: Dieser Fehler ist unsichtbar und kehrt wieder. Er kostet Sie nicht einmal eine Nacht — er kostet eine Nacht pro betroffener Buchung, jedes Mal, bis Sie ihn finden.

Hier eine Unterkunft mit engem Wechsel zu 120 $ Basispreis, bei der der Fehler zwei Wechsel pro Monat sperrt:

| Szenario | Verlorene Nächte / Monat | Verlust / Monat | Verlust / Jahr |
| --- | --- | --- | --- |
| 2 gesperrte Abreisetage, 120 $ Basis | 2 | 240 $ | 2.880 $ |
| Hochsaison, 1 gesperrte Nacht / Woche | 4 | 480 $ | (saisonal) |
| Versatz auf die Nacht vor Anreise, 1 / Monat | 1 | 120 $ | 1.440 $ |

Das sind keine Erstattungen, die Sie in einem Bericht sehen — das sind Buchungen, die nie zustande kamen: Nachfrage, die gegen eine „nicht verfügbar"-Wand lief und zur Unterkunft nebenan ging. Die Rechnung ist weich, weil sie davon abhängt, wie oft Ihre Lücken Wechsel am selben Tag sind, doch die Richtung ist klar: ein wiederkehrendes Ein-Nacht-Leck bei einer Unterkunft mit echter Wechselnachfrage ist eine vierstellige Jahreszahl — und sie taucht nirgends als Problem auf, auf das Sie zeigen könnten.

Außerdem verstärkt es sich mit dem, was direkt daneben liegt. Ein fälschlich gesperrter Abreisetag ist ein Wechsel, den Sie nicht verkaufen können; ein fälschlich *freigegebener* Abreisetag ist, wie eine [Doppelbuchung](/blog/avoiding-double-bookings) entsteht. Dieselbe exklusive `DTEND`-Regel, beide Fehlerrichtungen — und auf welcher Sie stehen, erfahren Sie nur, indem Sie den Feed lesen.

## FAQ

**Warum gilt der Tag, an dem mein Gast abreist, als nicht verfügbar für eine neue Buchung?**
Weil etwas in Ihrer Sync-Kette den Abreisetag als belegt behandelt. Nach den iCal-Regeln ist der Abreisetag das exklusive `DTEND` — der Morgen nach der letzten Nacht, buchbar für eine Anreise am selben Tag. Gilt er als belegt, hat entweder ein Feed-Generator den Bereich inklusiv geschrieben oder eine Zeitzonen-Umrechnung den Block um einen Tag verschoben.

**Was heißt es, dass `DTEND` exklusiv ist?**
Es heißt, dass das Enddatum nicht Teil der Buchung ist. Ein Aufenthalt mit `DTSTART:20260710` und `DTEND:20260713` deckt die Nächte vom 10., 11. und 12. ab — drei Nächte — und lässt den 13. frei. Viele lesen `20260713` als „belegt bis einschließlich 13.", aber das Format sagt das Gegenteil. Genau dieser Widerspruch ist die häufigste Quelle für Tagesversatz-Fehler im Kalender.

**Mein Kalender synchronisiert pünktlich, blockiert aber die falschen Daten. Ist das dasselbe wie ein veralteter Feed?**
Nein, und für die Behebung ist der Unterschied wichtig. Ein veralteter Feed ist ein Aktualitätsproblem — der Import läuft nicht mehr, und Sie beheben es, indem Sie die URL reparieren oder den Import neu hinzufügen. Ein Feed mit falschen Daten aktualisiert sich einwandfrei; die Daten darin stimmen nicht. Prüfen Sie zuerst den Zeitstempel „Zuletzt importiert": aktueller Stempel plus falsche Daten ist ein Tagesversatz, kein Veralten.

**Wie prüfe ich, ob mein iCal-Feed Datums- oder Datum-Zeit-Werte verwendet?**
Fügen Sie die Export-URL in einen Browser ein und sehen Sie sich ein `VEVENT` an. Steht dort `DTSTART;VALUE=DATE:20260710` — acht Ziffern, kein `T` —, ist es ein ganztägiger Termin und zeitzonen-immun. Folgt auf das Datum ein `T` mit Uhrzeit, und erst recht ein abschließendes `Z`, ist es ein `DATE-TIME`, und irgendwo weiter unten findet eine Zeitzonen-Umrechnung statt.

**Kann die Sommerzeit eine Buchung wirklich um einen Tag verschieben?**
Nur bei Feeds, die `DATE-TIME` nahe einer Mitternachtsgrenze verwenden, und nur in den Wochen, in denen Quell- und Zielregion auf unterschiedlichem Umstellungsplan sind. Europa und Nordamerika stellen die Uhren an verschiedenen Daten um, also gibt es jedes Frühjahr und jeden Herbst ein kurzes Fenster, in dem ein Termin nahe Mitternacht auf den falschen Kalendertag fällt. Ganztägige `VALUE=DATE`-Termine sind nie betroffen.

**Behebt ein Channel Manager oder eine Zwischenschicht das?**
Kann sein — wenn die Schicht Feeds auf ganztägige lokale Datumstermine normalisiert, bevor sie sie weitergibt. Das beseitigt die Zeitzonen-Mehrdeutigkeit für alles weiter unten. Es hilft nicht, wenn die Schicht selbst `DATE-TIME` ausgibt oder sich um eins verzählt — die Behebung ist korrekte Datumsbehandlung, nicht das bloße Vorhandensein eines Werkzeugs. Lesen Sie den weitergegebenen Feed und bestätigen Sie, dass er `VALUE=DATE` ausgibt.

**Ist ein Reinigungspuffer eine Lösung oder ein Pflaster?**
Ein Pflaster, aber ein nützliches. Ein Ein-Tages-Puffer sperrt den Abreisetag absichtlich, sodass ein Versatz, der ihn ebenfalls sperrt, unsichtbar wird — diese Nacht haben Sie ohnehin nicht verkauft. Das Problem kehrt in dem Moment zurück, in dem Sie den Puffer fallen lassen, um einen gefragten Wechsel zu verkaufen. Behandeln Sie den Puffer also als Deckung, nicht als Heilung, und reparieren Sie trotzdem die Datumsbehandlung.

**Warum wird manchmal die Nacht vor der Anreise gesperrt statt der Abreisetag?**
Die Richtung hängt davon ab, wohin der Zeitzonen-Versatz das Datum schiebt. Ein auf UTC normalisierter Block rutscht aus einer Zone hinter UTC nach vorn und kann die Nacht vor der Anreise sperren; aus einer Zone vor UTC rutscht er nach hinten und lässt eine Abreisenacht gesperrt. Gleiche Ursache, umgekehrtes Symptom — beides löst sich, indem man den Block auf das lokale Datum der Unterkunft pinnt.

## Eine klare Meinung

Wenn Sie mehr als eine Plattform betreiben und Ihren rohen `.ics`-Feed noch nie in einem Browser geöffnet haben, tun Sie es diese Woche. Nicht, weil etwas kaputt ist (vielleicht ist es das nicht), sondern weil das der eine Kalenderfehler ist, der Sie Geld kostet — bei null Signal. Ein veralteter Feed meldet sich irgendwann: Ein Gast beschwert sich, ein Datum aktualisiert nicht, ein Zeitstempel wird kalt. Ein Tagesversatz verwandelt einfach leise Ihre besten Wechselnächte in „nicht verfügbar" und leitet die Buchung zu jemand anderem. Die fünfzehn Sekunden, um zu bestätigen, dass Ihr Feed `VALUE=DATE` und ein exklusives Abreise-`DTEND` ausgibt, sind das billigste Umsatz-Audit, das Sie je durchführen werden.
