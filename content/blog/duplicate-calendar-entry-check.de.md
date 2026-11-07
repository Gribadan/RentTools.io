---
slug: duplicate-calendar-entry-check
locale: de
title: "Doppelter Kalendereintrag oder echte Doppelbuchung?"
excerpt: "Zwei überlappende Balken beweisen keine zwei Gästebuchungen. Prüfen Sie Quellen und Bestätigungen und halten Sie belegte Nächte während der Klärung gesperrt."
status: published
tags:
  - calendar-sync:Kalendersynchronisierung
  - host-tips:Gastgeber-Tipps
ogImageUrl: /blog-covers/duplicate-calendar-entry-check.webp
ogImageWidth: 1600
ogImageHeight: 900
tldr: |
  - Ordnen Sie jeden überlappenden Eintrag dem richtigen Inserat und der ursprünglichen Buchung zu.
  - Unterscheiden Sie doppelte Darstellung, Buchung mit manueller Sperre und zwei echte bestätigte Buchungen.
  - Korrigieren Sie die belegte Ursache und prüfen Sie Verfügbarkeit und Reinigung; löschen Sie keinen Feed nur für eine aufgeräumte Ansicht.
---

Zwei Balken belegen dieselben Daten im Unterkunftskalender. Einen davon zu entfernen erscheint als schnelle Lösung. Klären Sie zuerst, was beide darstellen: denselben Aufenthalt auf zwei Wegen, eine zusätzliche Verfügbarkeitssperre oder zwei echte Buchungen, die nicht gleichzeitig in derselben Unterkunft erfüllt werden können.

Davon hängt das weitere Vorgehen ab. Ein Darstellungs- oder Importproblem verlangt eine Prüfung der Datensätze und Verbindungen; ein echter Konflikt verlangt eine Bearbeitung der Buchungen. Beides lässt sich nicht sicher lösen, indem der scheinbar überflüssige Eintrag verschwindet.

## Beide Einträge zu ihren Quellen zurückverfolgen

Beginnen Sie bei der richtigen vermietbaren Einheit, nicht nur einem ähnlichen Inseratsnamen. Öffnen Sie soweit möglich die Quelle jedes Eintrags und vergleichen Sie Plattform, Anreise, Abreise und aktuellen Status mit dem ursprünglichen Buchungskonto. Buchungsreferenzen gehören in private Arbeitsnotizen. Farbe oder Ereignistitel sind Hinweise, keine Bestätigung eines weiteren Gastes.

Airbnbs [Anleitung zur Kalendersynchronisierung](https://www.airbnb.com/help/article/99) beschreibt die Übertragung gebuchter Nächte und bestimmter Verfügbarkeitssperren. Prüfen Sie deshalb einen geschlossenen Zeitraum im empfangenden Kalender, bevor Sie ihn als zusätzliche Buchung zählen.

Halten Sie die Richtung jeder Verbindung fest, die den Zeitraum liefern könnte. Prüfen Sie, ob ein lokaler Buchungseintrag und ein importiertes Ereignis dieselbe Originalbuchung beschreiben oder zwei Feeds fälschlich als unabhängige Verkäufe gelten. Gleiche Daten genügen nicht: Verschiedene Gäste können dieselben Nächte buchen, und eine geänderte Buchung kann beim Empfänger noch alte Daten haben.

Für technische Prüfungen definiert der [UID-Abschnitt der iCalendar-Spezifikation](https://www.rfc-editor.org/rfc/rfc5545#section-3.8.4.7) eine Kennung für eine Kalenderkomponente. Nutzen Sie diese zum Nachverfolgen eines Ereignisses, nicht als Ersatz für den Buchungsnachweis. Ändern Sie keine Kennungen als schnelle Reparatur und veröffentlichen Sie keine vollständigen Feed-Adressen in Hilfefragen.

**Veranschaulichendes Beispiel:** Das Quellkonto bestätigt einen Aufenthalt von Dienstag bis Freitag. Zwei Kalenderdarstellungen beziehen sich auf genau diesen Aufenthalt. Belegt bleiben Dienstag-, Mittwoch- und Donnerstagnacht: drei Nächte, nicht sechs. Das gilt erst, wenn genau eine echte Buchung bestätigt ist; ähnliche Balken beweisen es nicht. Wirkt der Zeitraum verlängert, prüfen Sie die [Grenze des Abreisetags](/de/blog/ical-checkout-day-blocked).

## Nach bestätigten Fakten unterscheiden

Wählen Sie den nächsten Schritt anhand der Originaldatensätze, nicht danach, welche Erklärung die Ansicht am einfachsten aufräumen würde.

| Bestätigte Fakten | Bedeutung | Nächster Schritt |
| --- | --- | --- |
| Eine aktive Buchung wird zweimal dargestellt | Doppelte Darstellung eines Aufenthalts | Zugehörige Datensätze oder Verbindung prüfen; belegte Nächte geschützt lassen. |
| Zwei aktive Buchungen derselben Einheit teilen eine belegte Nacht | Echter Buchungskonflikt | Zuständige Person und Plattformen umgehend einbeziehen; keine Buchung zum Verbergen löschen. |
| Eine Buchung und eine separate manuelle Sperre | Aufenthalt plus Verfügbarkeitsbeschränkung | Sperrgrund vor einer Änderung feststellen. |

Ist eine Quelle noch nicht prüfbar, bleibt die Einordnung offen. Geben Sie keine sicher belegte Nacht frei, nur weil die zweite Beschriftung unklar ist. Die [Prüfung blockierter Daten](/de/blog/blocked-calendar-dates-not-reservations) hilft, Buchungen von anderen Einschränkungen zu unterscheiden.

## Auf der richtigen Ebene korrigieren und die nächste Anreise prüfen

RentTools importiert Kalenderereignisse nach Unterkunft und Plattform und verwendet bei der Abstimmung die Ereigniskennung. Das bedeutet weder, dass ähnliche Einträge verschiedener Quellen eigene Buchungen sind, noch dass beliebige Überschneidungen automatisch zusammengeführt werden können. Prüfen Sie zuerst den Bezug zur Originalbuchung.

Entfernen Sie keine Kalenderverbindung bloß für eine ruhigere Ansicht. Beim Löschen eines RentTools-Links werden auch die importierten Ereignisse dieser Plattform für die Unterkunft entfernt. Die Ansicht wirkt übersichtlicher, während wichtige Verfügbarkeitsinformationen fehlen können. Ist die Verbindung falsch, nutzen Sie die [Checkliste zum Ersetzen eines Feeds](/de/blog/replace-calendar-feed-checklist) und schützen Sie betroffene Nächte während der Korrektur.

Hat sich die Originalbuchung geändert, vergleichen Sie ihre aktuellen Daten nach dem nächsten Import mit jedem Empfänger. Bleibt eine Ansicht veraltet, untersuchen Sie diesen Aktualisierungsweg, statt eine Ersatzbuchung anzulegen. Ändern Sie nur den Datensatz oder die Einstellung, deren Rolle geklärt ist. Notieren Sie die Änderung, damit niemand dieselbe Bereinigung wiederholt.

Bei zwei echten Buchungen müssen beide Originaldatensätze für die zuständige Person sichtbar bleiben. Wenden Sie sich an den Support der jeweiligen Plattformen und informieren Sie betroffene Gäste situationsgerecht und zutreffend. Dieser Leitfaden verspricht weder Gebührenbefreiung noch bestimmte Erstattungen oder Ersatzunterkünfte.

Prüfen Sie abschließend die Verkaufskalender und die Vorbereitung: Belegte Nächte bleiben geschlossen, unabhängige Sperren erhalten und für die tatsächliche Abreise gibt es einen vereinbarten Reinigungsplan mit einer zuständigen Person. Zwei Balken rechtfertigen keine zwei Reinigungseinsätze. Eine aufgeräumte Ansicht beweist keine fertige Unterkunft.
