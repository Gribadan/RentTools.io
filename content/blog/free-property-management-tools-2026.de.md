---
slug: free-property-management-tools-2026
locale: de
title: "Kostenlose Hostverwaltungs-Tools für Kurzzeitvermieter 2026"
excerpt: Übersicht 2026 zu kostenloser Hostverwaltung für Airbnb- und Booking.com-Hosts. Verwaltete Free-Tarife, Self-Hosting, DIY-Kombinationen — und wo jede Option bricht.
status: draft
tags:
  - host-tips:Host-Tipps
  - calendar-sync:Kalendersynchronisation
  - tools:Tools
ogImageUrl: /blog-covers/free-property-management-tools-2026.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Kostenlose Hostverwaltungs-Tools für Kurzzeitvermieter 2026

Ein Freund mit drei Wohnungen fragte mich letzten Monat, ob es etwas Kostenloses gebe, das macht, was Hostaway macht. Kurze Antwort: nicht wirklich. Längere Antwort ist der Rest dieses Beitrags — die kostenlosen Tools, was sie tatsächlich tun, und die stillen Grenzen, die man erst beim zweiten Objekt findet.

## TL;DR

- „Kostenlos" heißt in diesem Bereich eines von dreien: ein Freemium-SaaS mit 1-Objekt-Limit, eine verwaltete Instanz, die der Maintainer bezahlt, oder Open-Source-Code zum Selbsthosten.
- Smoobus Free-Tarif und die verwaltete [RentTools](/onboard)-Instanz sind die zwei legitimen Free-SaaS-Optionen, die heute die meisten Hosts nutzen können. Beide haben echte Grenzen.
- Die Selbst-Host-Open-Source-Seite ist dünn. RentTools ist eines der wenigen aktiven Projekte; der Rest sind verlassene Skripte oder generische Kalender-Stitcher.
- Eine DIY-Kombination (Google Kalender plus iCal-Stitcher) deckt Basis-Sync, mehr nicht. Richtig für ein Objekt, falsch ab zwei.
- Kostenlose Tools kosten Zeit, kein Geld. Zeit einplanen, bevor Sie sich festlegen.

## Was „kostenlos" hier wirklich heißt

Die Suchseiten zu „kostenloser Hostverwaltungs-Software" sind irreführend. Die meisten Tools haben einen „Free Trial" über 14 Tage, einen „Free Plan" ohne die Funktionen, die Hosts wirklich brauchen, oder ein „Frei für ein Objekt"-Tor, das beim Wachsen umkippt. Die Kategorien lohnen sich vor dem Einkauf zu trennen.

1. **Freemium-SaaS.** Anbieter betreibt den Server und lässt Sie eine kleine Untergruppe gratis nutzen, in der Hoffnung auf Upgrade. Smoobu ist das sauberste Beispiel. AvaiBook war früher hier; sitzt heute innerhalb von Booking Holdings, und der Free-Tarif ist schwerer zugänglich als früher.
2. **Maintainer-finanzierter SaaS.** Ein kleines Team oder eine Einzelperson zahlt das Hosting und gibt das Produkt weg. Meist um eine Funktion gebaut (Kalender-Sync, Reinigungsplan). RentTools' verwaltete Instanz auf renttools.io gehört hier hin. Nachhaltig, solange der Maintainer die Rechnung zahlen kann.
3. **Open-Source-Selbst-Host.** Sie bekommen den Code, betreiben den Server, zahlen das Hosting. Kostenlos in Software, nicht in Zeit. Das RentTools-Repo gehört auch hier hin; es liefert Deploy-Skripte mit, sodass Sie eine eigene Kopie auf einem 4-$-Droplet betreiben können.
4. **DIY-Kombinationen.** Kalender-App, Tabelle und iCal-Konverter zusammenflicken. Kostenlos, wenn Sie Ihre Stunden nicht zählen. Funktioniert auf sehr kleiner Skala.

Richtige Antwort für 1–2 Objekte ist meist Kategorie 2 oder 4. Für 3–10 meist Kategorie 1 oder 3. Über 10 selten überhaupt kostenlos, dazu komme ich noch.

## Verwaltete Free-Tools

### Smoobu (Free-Tarif)

Smoobu gehört seit 2021 zu [SiteMinder](https://www.siteminder.com/) und ist die polierteste Freemium-Option. Der Free-Tarif: ein Objekt, mit Channel Manager (Airbnb plus Booking via iCal), eine Basis-Inbox und Kalender-Sicht. Bewertungs-Import kostenpflichtig. Direktbuchungs-Website kostenpflichtig. Mehrnutzer-Zugriff kostenpflichtig. Berichte kostenpflichtig.

Bei einem Objekt und vor allem zentraler Inbox plus Kalender ist der Free-Tarif der großzügigste am Markt. Der Haken ist das 1-Objekt-Limit. Am Tag, an dem Sie ein zweites listen, schulden Sie nach aktuellem Pricing rund 25 €/Monat pro Objekt — die aktuelle Zahl auf der Smoobu-Seite prüfen, weil Freemium-Preise sich verschieben.

### RentTools (verwaltete Instanz)

Offenlegung: das ist das Projekt, auf dem dieser Beitrag lebt. Ich betreibe renttools.io als „kostenlos für jeden"-Instanz auf einem einzigen 4-$-Droplet, aus eigener Tasche. Die verwaltete Instanz macht Kalender-Sync zwischen iCal-kompatiblen Plattformen, Reinigungsplan mit Reinigungskraft-Rolle und Gastdaten-Extraktion aus Pass-Scans. Mehrere Objekte unterstützt. Kein künstliches Objekt-Limit.

Ehrliche Grenzen: Ich rate-limite die API und den iCal-Poll, damit ein Nutzer nicht den Free-Tarif für andere blockiert. Kein 24/7-Support-Team. Stirbt der Server nachts, ist er bis morgens unten. Die volle Deploy-Geschichte gibt es im [Self-Hosting-Beitrag](/blog/self-hosting-property-manager-droplet), inkl. was läuft und was brechen könnte.

### AvaiBook

[AvaiBook](https://www.avaibook.com/) war ein spanischer PMS, kam 2018 zu Booking Holdings. Sie hatten jahrelang einen sinnvollen Free-Tarif. Den gibt es laut Preisseite weiter, aber die Bedingungen haben sich geändert; zuletzt geprüft auf wenige Buchungen pro Monat und ein Objekt limitiert. Wer in Spanien hostet und vor allem auf Booking inseriert: einen Blick wert. Außerhalb dieses Profils ist der Free-Tarif so eingeschränkt, dass die zwei oben meistens schlagen.

### Lobenswerte Erwähnungen, die nicht wirklich kostenlos sind

Einige Namen tauchen in „Free PMS"-Listen auf, die nicht hingehören. Lodgify und Hostaway bieten nur Free Trials, keine Free Plans. Tokeets „Starter" wurde eingestellt. Hospitable (früher Smartbnb) ist nur kostenpflichtig. Wenn eine Vergleichsseite sie in einer „kostenlos"-Spalte zeigt, verkauft die Seite Klicks, keine Infos.

## Self-Host-Free-Tools

### RentTools (Open Source)

Gleiches Produkt wie die verwaltete Instanz, aber der Code liegt unter MIT auf GitHub und liefert ein `scripts/install-build.sh` für jede Linux-Box mit Node und SQLite. Sie geben das vom Maintainer bezahlte Hosting auf und bekommen unbegrenzte Rate Limits, volle Datenhoheit und die Freiheit zu erweitern. Gesamtkosten: rund 4 $/Monat für ein DigitalOcean-Droplet plus eine Domain. Die Anleitung im [Self-Hosting-Beitrag](/blog/self-hosting-property-manager-droplet), inkl. SQLite-Einstellungen und wo der Build auf derselben Maschine an RAM-Mangel scheitert.

Realistisch für: Hosts, die sich auf der Kommandozeile zu Hause fühlen. Nicht realistisch für: Hosts, die sich noch nie per SSH verbunden haben.

### Andere Open-Source-Optionen, die wert sind, gekannt zu werden

Die harte Wahrheit: Es gibt kein blühendes Open-Source-PMS-Ökosystem. Ein paar Projekte existieren auf GitHub, aber die meisten sind verlassen, halbfertig oder von einem einzelnen Host als persönliches Tool geschrieben.

Was ich tatsächlich in der Praxis gesehen habe und teils empfehle:

1. **[ical-merger / ical-stitch-Skripte](https://github.com/topics/ical-merger).** Einseitige Python- oder Node-Skripte, die N iCal-Feeds rein und einen gemergten Feed raus geben. Nützlich als Baustein; kein PMS. Eine Kalender-App brauchen Sie weiterhin.
2. **NextCloud + Calendar.** NextCloud ist eine selbst gehostete Produktivitätssuite. Der Kalender abonniert iCal und kann mit Cron-Jobs und der Tasks-App zu einem Basis-PMS zusammengeklebt werden. Machbar. Nicht angenehm.
3. **HomeAssistant-Kalender-Integrationen.** Überraschend viele Hosts betreiben HomeAssistant für die Smart-Lock-Seite und schrauben Kalender-Sync dort dran. Real, aber nur sinnvoll, wenn Sie ohnehin HomeAssistant fahren.

Das Muster: Die Open-Source-Seite der Ferienvermietungs-Software ist dünn, weil der adressierbare Markt der Hosts, die den Code wollen, klein ist. Die meisten Hosts wollen das Ergebnis, nicht die Quelle. Wer in der kleinen Gruppe ist, wählt meist RentTools oder einen Skript-Baustein.

## DIY-Kombinationen mit Allzweck-Software

Diese Option erzählt Ihnen niemand aus der PMS-Industrie, weil sie sie schlecht aussehen lässt.

Das Grundrezept:

1. iCal-Export-URL aus jeder Plattform holen, auf der Sie inserieren. Airbnb unter Kalender → Verfügbarkeitseinstellungen → „Kalender exportieren". Booking im Extranet unter Kalender → Kalender synchronisieren → „Kalender exportieren". Detaillierte Anleitung im [Kalender-Sync-Beitrag](/blog/airbnb-booking-calendar-sync-free).
2. Jede URL in Google Kalender abonnieren (oder Apple Kalender, oder Outlook). Jede Plattform wird eine farbige Schicht.
3. Jede neue Buchung manuell aus der eingehenden Schicht in einen Master-„Buchungen"-Kalender kopieren, den Sie wieder an alle Plattformen exportieren.

Gesamtkosten: null. Gesamtzeit pro Buchung: rund 90 Sekunden. Bei 30 Buchungen/Monat sind das 45 Minuten/Monat oder 9 Stunden/Jahr manuelles Kopieren.

Funktioniert bei einem Objekt. Mühsam bei zwei. Eintrittskarte zur Doppelbuchung bei drei, weil der manuelle Schritt der Schwachpunkt ist. Der Grund, warum ich überhaupt angefangen habe, Software zu schreiben, war, dass die Tabellen-und-Google-Kalender-Version dieser Konstruktion bei Objekt drei aufhörte zu skalieren.

*Abbildung 1: Google Kalender mit drei iCal-Schichten (Airbnb, Booking, Vrbo) übereinander. Screenshot folgt; landet unter /blog/free-property-management-tools-2026/figure-1.png.*

## Was jedes kostenlose Tool schlecht macht

Geteilte Schwachpunkte aller Free-Optionen, kategorienübergreifend:

1. **Channel-Manager-API-Zugriff.** Keines der kostenlosen Tools hat direkte Integrationen mit der Airbnb-Partner-API oder der Booking-Connectivity-API, weil der Zugang einen Partnervertrag mit Geld und Umsatzbeteiligung verlangt. Free-Tools synchronisieren via iCal mit 2–6 Stunden Verzögerung. Im Detail im [Doppelbuchungs-Beitrag](/blog/avoiding-double-bookings).
2. **Direktbuchungs-Website.** Die Freemium-Optionen verstecken das hinter dem bezahlten Plan. Die Self-Host-Optionen erwarten, dass Sie Ihre eigene mitbringen. Wer eine Direkt-Site will, ist hier nicht richtig.
3. **Bewertungs-Automatisierung.** Auto-Sendung von Bewertungs-Anfragen, Scraping aus jeder Plattform, Anzeige von Bewertungs-Widgets. Bezahlt überall. Manuell machbar.
4. **Mehrnutzer-/Team-Zugriff.** System mit Co-Host oder Verwalter teilen ist fast überall kostenpflichtig. RentTools' Free-Tarif unterstützt es; Smoobus nicht.
5. **Langzeit-Berichte.** Jahresvergleiche, Auslastung, Kanal-Mix. Free zeigt aktuellen Monat plus 90-Tage-Chart. Mehr ist kostenpflichtig.

Wenn Ihre Operation eines davon täglich braucht, schmerzt Free. Wenn Sie es einmal pro Quartal brauchen und manuell in eine Tabelle ziehen können, ist Free okay.

## Wann Free die falsche Antwort ist

Drei Muster, in denen ich einem Freund raten würde, einfach zu bezahlen:

1. **Über 10 Objekte.** Die Stückzahl-Ökonomie kippt. Ein bezahltes PMS zu 25 $/Objekt/Monat sind grob 3.000 $/Jahr für 10 Objekte. Der Zeitaufwand für einen Free-Stack auf dieser Größe (manuelles Kalender-Mergen, manuelles Bewertungs-Moderieren, manuelles Reports-Ziehen) liegt klar über 100 Stunden/Jahr. Bezahlen.
2. **Operationen mit bezahltem Reinigungsteam von 3+.** Das Team braucht echte Plansicht, echte Benachrichtigungen, echten Foto-Upload für die Nach-Reinigungs-Checkliste. Free-Tools machen eines davon gut, keines alle drei.
3. **Hosts mit 90 % Auslastung, die bei Direktbuchungen wirklich konkurrieren.** Free-Tools können keinen echten Direktbuchungs-Funnel. Wer das Marketing seiner Listings auf den Punkt hat, ist Free entwachsen.

Für alle anderen funktioniert Free. Die meisten unabhängigen Hosts mit 1–3 Objekten auf Airbnb plus Booking decken mit den Free-Optionen aus diesem Beitrag 80 % der Operations ab, die restlichen 20 % sind sonntagvormittags in einer Tabelle erledigt.

## Wie wählen

Entscheidungsbaum, vereinfacht:

1. **Ein Objekt, niedriges Volumen.** Smoobu Free-Tarif oder die DIY-Kombination. Smoobu gewinnt bei Inbox-Qualität; DIY bei Datenhoheit.
2. **1 bis 3 Objekte, echtes Tool ohne Bezahlen.** RentTools verwaltete Instanz.
3. **3 bis 10 Objekte, mit Kommandozeile zu Hause.** Self-Hosted RentTools.
4. **3 bis 10 Objekte, ohne Kommandozeile.** Smoobu kostenpflichtig (25 €/Objekt/Monat) ist die günstigste glaubwürdige Option, die ich empfehlen würde. Zeit gegen Geld.
5. **Über zehn oder über 90 % Auslastung.** Echter Channel Manager: Hostaway, Lodgify oder ein regionaler Anbieter. Der [iCal-vs.-Channel-Manager-API-Beitrag](/blog/avoiding-double-bookings) deckt ab, wann die Verzögerung wirklich beißt.

## FAQ

**Gibt es einen Open-Source-Klon von Hostaway?**
Nicht wirklich. Es gibt Open-Source-Bausteine dessen, was Hostaway tut (Kalender-Sync, Basis-CRM, Planung), aber kein Projekt, das ich gesehen habe, repliziert die Channel-Manager-API-Integration, die Hostaway verkauft. Der API-Zugang ist der Burggraben, und APIs kosten Geld.

**Bleibt die kostenlose RentTools-Instanz kostenlos?**
Plan: ja. Die Hosting-Rechnung ist rund 5 $/Monat, das Projekt ist ein Nebentool, kein Geschäft. Wenn die Nutzerzahl über das hinauswächst, was ein Droplet bedienen kann, füge ich Spenden- oder Pro-Konto-Bezahltarife für höhere Rate Limits hinzu, bevor ich die Free-Stufe ändere.

**Was ist mit Beds24, Tokeet oder anderen Namen, die ich gesehen habe?**
Beds24 hat einen technisch kostenlosen Tarif mit starken Einschränkungen (nur Kalender-Sync, keine Inbox). Tokeet hat seinen Free-Tarif vor Jahren eingestellt. Beide vor Annahmen googeln; diese Anbieter ändern Preisseiten leise.

**Ist Smoobu nach der SiteMinder-Übernahme datentechnisch sicher?**
SiteMinder ist eine börsennotierte australische Firma mit echtem Sicherheitsprogramm; die Übernahme hat Smoobus Datenhandhabung nicht wesentlich geändert. Hauptrisiko im Free-SaaS-Muster ist Produkt-Richtungs-Risiko — wenn SiteMinder entscheidet, dass Smoobus Free-Tarif den Upsell stört, könnte er schrumpfen. Bisher nicht passiert.

**Kann ich auf einem Raspberry Pi statt einem DigitalOcean-Droplet selbst hosten?**
Bei RentTools ja. SQLite auf einer SD-Karte ist für das Volumen eines einzelnen Hosts okay. Reinigungs-Tooling und Cron für Backups funktionieren gleich. Ein Raspberry Pi 4 mit 2 GB RAM bewältigt die Last komfortabel.

**Mein Land hat ein regionales PMS mit Free-Tarif — soll ich das nutzen?**
Oft ja. AvaiBook (Spanien), Bnovo und Realto (GUS) und einige regionale Anbieter kennen lokale Plattformen besser als die globalen Namen. Wer länderspezifisch arbeitet, schlägt mit einem regionalen Tool meist den globalen Free-Tarif.

## Eine Meinung

Die Free-Tools-Landschaft ist eine Momentaufnahme, und die Aufnahme sieht in 18 Monaten anders aus. Die Tools, die 2027 noch da sein dürften, sind die mit nachhaltiger Kostenstruktur — meist ein bezahlter Tarif, der den Free-Tarif stützt (Smoobu), oder ein kleiner, fokussierter Umfang, den ein Maintainer auf 5 $/Monat betreiben kann (RentTools).

Vermeiden Sie Free-Tools, die einen vollen Hostaway-Funktionsumfang im Free-Tarif versprechen. Die Stückzahl-Ökonomie existiert nicht. Entweder ist das Tool risikokapitalfinanziert und pivotiert, wenn das Geld weg ist, oder das Tool ist irreführend und das „kostenlos" ist so beschnitten, dass es nutzlos ist. Ehrliche Free-Tools sind ehrlich darüber, kleiner im Umfang zu sein als die bezahlten. Das ist das Filter-Signal.
