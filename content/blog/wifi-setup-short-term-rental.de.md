---
slug: wifi-setup-short-term-rental
locale: de
title: "WLAN für Kurzzeitvermietungen: Speed, Mesh und Gast-Netz-Mathematik"
excerpt: Wie viel WLAN-Geschwindigkeit eine Kurzzeitvermietung wirklich braucht, wann ein einzelner Router Mesh schlägt und warum ein Gast-Netz 2026 nicht optional ist — mit Zahlen und echten Hardware-Empfehlungen.
status: published
tags:
  - host-tips:Host-Tipps
  - tools:Tools
  - guest-comms:Gästekommunikation
ogImageUrl: /blog-covers/wifi-setup-short-term-rental.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Meine erste 1-Stern-Bewertung war wegen WLAN. Eine Familie mit zwei Kindern checkte an einem Freitag im März in meine 65-m²-Wohnung in Taschkent ein, und am Samstagmittag schickte der Vater eine vierzeilige Nachricht: *„WLAN bricht im Schlafzimmer ab. Kann nicht arbeiten. Wir reisen Sonntag ab."* Der Router war die weiße Plastik-Combobox, die mir mein ISP vier Jahre zuvor gegeben hatte — in der Küche hinter einem Heizkörper aus Metall, sendend in eine ziegelmauer-bewehrte Wohnung auf demselben 2,4-GHz-Kanal wie 14 andere Wohnungen. Der Fix kostete 120 $ neue Hardware und eine Stunde Kabelverlegen. Die Bewertung ließ ich stehen.

Diesen Beitrag hätte ich im Februar gebraucht. Wieviel Geschwindigkeit das Listing wirklich braucht — gemessen in Mbit/s, nicht in ISP-Marketing —, wann ein einzelner Router nicht mehr reicht, warum ein separates Gast-Netz 2026 nicht optional ist, und drei ehrliche Hardware-Stufen mit den Fehlermodi, vor denen niemand auf Amazon warnt.

## TL;DR

- Eine vierköpfige Familie bringt **10 bis 14 verbundene Geräte**, nicht 4. Mit mindestens 12 gleichzeitigen Clients planen.
- Für einen 4K-Streaming-Haushalt plus einen Homeoffice-Call ist die Untergrenze **75 Mbit/s down / 15 Mbit/s up**, gemessen an der schwächsten Ecke der Wohnung, nicht am Router.
- Ein Router deckt rund **55 m² ziegelbewehrte Wohnung** ab. Darüber Mesh; der Übergang ist scharf.
- **Immer eine eigene Gast-SSID nutzen.** Nicht aus Höflichkeit — wegen DSGVO, um eigene NAS / Drucker / Kameras nicht offenzulegen, und zur Isolation, wenn eines Gastes Malware-belastetes Android das LAN überflutet.
- Gesamtkosten der Stack-Anschaffung pro Wohnung sind **80 bis 400 $ einmalig**, plus 35–60 $/Monat ISP. Die teure Option zahlt sich aus, sobald eine WLAN-Bewertung 300 $ entgangene Buchungen kostet.

## Was „schnell genug" wirklich heißt

Die meisten Hosts fragen „reichen 100 Mbit/s?". Die ehrliche Antwort: kommt drauf an, was angeschlossen ist und wo.

Eine typische Vier-Personen-Gruppe kommt mit: 4 Handys, 1–2 Laptops, 1 Smart-TV (eigener oder Ihrer, oft beide), 1 Tablet, 1 Kindle, je 1 Smartwatch, manchmal Switch oder Steam Deck, manchmal Babyfon. Das sind 11 bis 14 Clients am Access Point. Sie senden nicht alle gleichzeitig, halten aber alle eine offene Verbindung.

Realistische Mbit/s pro typische Aufgabe, **Download**:

| Aufgabe | Down | Up | Anmerkung |
|---|---|---|---|
| Netflix HD | 5 Mbit/s | 0,1 | Ein Stream. |
| Netflix 4K | 25 Mbit/s | 0,1 | Der Große. |
| YouTube 4K | 20 Mbit/s | 0,1 | |
| Zoom HD-Videoanruf | 3,5 Mbit/s | 3,5 | Symmetrisch. |
| Google Meet HD | 3,5 Mbit/s | 3,5 | |
| Spotify | 0,3 Mbit/s | 0 | Vernachlässigbar. |
| iCloud / Google Photos Sync | 5 Mbit/s | 25 Mbit/s | Richtung zählt. |
| Steam-Spiele-Download | 80–200 Mbit/s | 0 | Sättigt alles unter Glasfaser. |

Realistische Worst-Case-Last Freitagabend: Netflix 4K am TV (25), ein Elternteil auf Zoom (3,5/3,5), ein Teenager auf YouTube 4K (20), Spotify im Hintergrund (0,3) und ein Handy-Backup, das still 800 Fotos zu 25 Mbit/s up lädt.

Total: **~50 Mbit/s down, ~30 Mbit/s up**, anhaltend für 90 Minuten. Plus 30 % Reserve für Retransmits und Overhead, Untergrenze **75 down / 40 up**. Die meisten ISPs verkaufen „100 Mbit/s" als 100 down / 10 up — die 10 up ist der Teil, der den Homeoffice-Gast scheitern lässt. Symmetrische 100/100-Glasfaser zahlen, wo verfügbar; der monatliche Aufpreis ist selten über 5 $.

Die Zahl, die man im Listing nennt, ist die **niedrigere von zwei**: was der ISP versprach und was die schwächste Ecke wirklich liefert. [fast.com](https://fast.com) aus dem Schlafzimmer am weitesten vom Router laufen lassen. Diese Zahl minus 20 % ist, was eine ehrliche Listing-Beschreibung sagt.

## Single-Router gegen Mesh: wo die Linie verläuft

Die billige Antwort lautet „die Wohnung ist klein, ein Router reicht". Die billige Antwort ist in der Hälfte der Fälle falsch.

Was Reichweite wirklich begrenzt, sind **Wände, nicht Quadratmeter**. Trockenbau kostet rund 3 dB im 5-GHz-Band pro Wand. Ziegel 8 dB. Stahlbeton 12 dB+. Sobald ein 5-GHz-Signal zwei Ziegelwände gequert hat, hat es 75 % Leistung verloren, und Ihr Handy fällt auf 2,4 GHz zurück, das in jedem Wohnhaus mit 30 Nachbar-Geräten und Mikrowellen verstopft ist.

Ungefähre Single-Router-Reichweite in echter Wohnungs-Konstruktion:

- **Trockenbau + Holzständer (typische US-Wohnung):** ein Router deckt bis ~85 m².
- **Ziegel / europäisch:** bis ~55 m².
- **Stahlbeton / Sowjet-Bau:** bis ~35 m².

Darüber schlägt Mesh jeden Single-Router. Mesh-Untergrenze sind zwei Knoten; der zweite sitzt etwa auf halbem Weg zwischen erstem und toter Ecke. Verkabeltes Backhaul (ein Ethernet-Kabel zwischen den Knoten, unter der Sockelleiste versteckt) lohnt die 15-Minuten-Installation — drahtloses Backhaul kostet etwa die Hälfte des Durchsatzes am zweiten Knoten.

Der Übergang ist schärfer, als die Spec-Sheets vermuten lassen. Unterhalb der Schwelle schlägt ein 90-$-Router ein 200-$-Mesh am Router-Standort. Oberhalb schlägt 200-$-Mesh ein 400-$-Router an der toten Ecke. **Wohnung speccen, nicht Geschmack.**

## Das Gast-Netz ist nicht optional

Drei Gründe, warum eine eigene Gast-SSID kein „nice-to-have" mehr ist, sondern harte Pflicht, in Reihenfolge des Schadens beim Fehlen:

1. **Datenschutz und DSGVO.** Wenn ein Gast in Ihr Haupt-WLAN kommt, kann er das LAN scannen. Er sieht den Hostnamen Ihres Druckers (`HP-LaserJet-2055-OFFICE`), Ihres NAS (`SYNOLOGY-FAMILIE`), Ihres Laptops, manchmal den Hostnamen Ihrer Sicherheitskamera. Nichts davon ist illegal zu sehen, aber in EU-Jurisdiktionen ist das genau die Art beiläufiger Datenleckage, die DSGVO Artikel 32 („geeignete technische Maßnahmen") zu vermeiden erwartet. Eine eigene Gast-SSID mit aktivierter **AP-Isolation** — jedes Gast-Gerät sieht nur das Gateway, keine anderen Clients — löst das in einem Häkchen. Die meisten modernen Router zeigen das unter „Gast-Netzwerk → Client-Isolation". Mehr zum Compliance-Bild siehe [DSGVO für Ferienvermieter](/blog/gdpr-for-vacation-rental-hosts).
2. **Durchsatz-Isolation.** Eines Gastes Android mit bösartiger Sideload-App startet ARP-Spoofing im LAN oder lädt im Hintergrund 60 GB Spiel. Im flachen Netz stockt Ihre IP-Kamera. Im isolierten Gast-VLAN merkt die Kamera nichts.
3. **Credential-Rotation.** Wenn Sie das Gast-Passwort wechseln (sollten Sie alle 4–8 Wochen), brechen Sie nicht Ihre eigenen Geräte auf der Haupt-SSID. Zwei SSIDs, zwei Passwörter, zwei Lebenszyklen.

Das richtige Setup ist eine Haupt-SSID für eigene Geräte (Kameras, Smart Locks, NAS) und eine Gast-SSID mit Isolation. Beide auf derselben Hardware; der Router sendet einfach zwei Netze. Jeder Router ab 60 $ unterstützt das 2026. Ihrer nicht? Tauschen.

Hinweis zum Namen: Die Gast-SSID nicht nach der Wohnungsnummer benennen („APT-12-Guest"). Das verrät Passanten, welche Einheit kurzzeit-vermietet wird, und ist die Sorte schwaches Signal, das Ihre Wohnung in Gebäuden mit Anti-Airbnb-WEG flaggt. Generischen Namen wählen. „Wi-Fi-2.4" reicht.

## Drei ehrliche Hardware-Stufen

Die Stufe wählen, die zur Wohnungsgröße und zur Toleranz für Problem-Verfolgung passt.

### 60–120 $: TP-Link Archer AX55 oder gleichwertig

Ein einzelner Wi-Fi-6-Router. AX3000-Klasse als Untergrenze. Deckt zuverlässig bis 55 m² Ziegel oder 85 m² Trockenbau. Zwei SSIDs (Haupt + Gast) mit Isolation. Vernünftiges QoS, sodass eines Gastes Torrent nicht den Video-Call eines anderen abwürgt. 5-Minuten-Setup über App, dann von der App trennen und das Gerät allein laufen lassen.

Richtige Stufe für Studio oder 1-Zimmer bis ~55 m². Falsche Stufe für 2-Zimmer mit Ziegelwänden zwischen Räumen — das Schlafzimmer-WLAN misst 12 Mbit/s und die Bewertung sagt „unbenutzbar".

### 180–280 $: Asus ZenWiFi XD4 / Eero 6+ / TP-Link Deco X55 — 2er-Mesh

Zwei-Knoten-Mesh. Beide Knoten Wi-Fi 6. Ein Knoten am Gateway, einer am Halbpunkt. Mit Ethernet-Backhaul (Kabel an Sockelleiste, 4-$-Keystone-Buchse je Ende) liefert der zweite Knoten ~85 % des Durchsatzes des ersten. Ohne Backhaul ~50 %.

Richtige Stufe für 60–100 m². Eero ist am einfachsten einzurichten, aber auch laut bei der Forderung nach Amazon-Account; wer Amazon-Accounts prinzipiell meidet, wählt Asus oder TP-Link.

### 320–420 $: Asus ZenWiFi XT9 / Ubiquiti UniFi Express + AP — 3er oder Prosumer

Drei-Knoten-Mesh oder Prosumer-Hardware. Lohnt über 100 m² oder in Stahlbeton-Wohnungen oder beim verschachtelten L-Grundriss, den einzelne Mesh-Knoten nicht überbrücken.

Ubiquiti ist die bessere Langzeit-Wahl: erlaubt Trennung der Gast-SSID in echtes VLAN mit Bandbreitenkappen, das Gast-Netz auf 14:00-Anreise und 11:30-Auscheck terminieren und Pro-Aufenthalt-Verkehrslogs ziehen, falls ein Gast etwas bestreitet. Setup-Kurve steiler — Stunde, nicht 10 Minuten — aber Sie machen es nur einmal.

### Was überspringen

- Combo-Modem-Router des ISP. Zuverlässig als Modems, schwach als Router. Combo in Bridge-Modus, neuen Router an dessen WAN-Port, das WLAN der Combo ab dem Punkt ignorieren.
- Alles, was 2026 „AC1200" oder „N300" sagt. 802.11ac/n unter Kosten verkauft. Wi-Fi-6-Untergrenze (AX1500 / AX3000) kostet 20 $ mehr und spart einen Hardware-Tausch in zwei Jahren.
- WLAN-Repeater (Steckdosen-Single-Band). Halbieren Durchsatz, verdoppeln Latenz. Mesh ist die Antwort, wenn ein Router nicht reicht.

## Die Fehlermodi, vor denen niemand warnt

Drei Versagen fressen 30 % Ihrer Jahr-1-WLAN-Kopfschmerzen:

**ISP-Ausfall am Samstagvormittag.** Glasfaser fällt, Sie wissen 90 Minuten nichts, die Bewertung des Gastes sagt „kein Internet". Zwei Lösungen. (1) Ein 4G/5G-Failover-Dongle am USB- oder WAN-2-Port des Routers, das übernimmt, wenn die Primärleitung stirbt. Hardware 40 $, SIM mit 50 GB/Monat 10 $. (2) Eine Status-Karte für Gäste — selbst eine gedruckte Karte am Kühlschrank: „Internet down? Host kontaktieren unter +X. Wir haben 4G-Backup." Beide Optionen kappen den Worst-Case-Bewertungsschaden.

**Die 2,4-GHz-Verstopfung, die niemand erwähnt.** In jedem urbanen Wohnhaus ist das 2,4-GHz-Band über Etage 4 unbenutzbar — jeder Nachbar, jede Mikrowelle, jeder Bluetooth-Lautsprecher. IoT-Geräte, die *nur* 2,4 GHz sprechen (Smart-Birnen, Smart Lock, billiges Babyfon), auf eine separate „IoT"-SSID zwingen, die nur 2,4 GHz sendet. Handy und Laptop kommen auf die 5-GHz-/6-GHz-Haupt-SSID und sehen die 2,4-GHz-Verstopfung nie.

**Der Router, der 9 Monate nicht rebootet.** Konsumenten-Router lecken Speicher. Bis Monat 6 fallen sie auf 30 % der Tag-1-Leistung, und ein Gast schreibt eine WLAN-Bewertung, die Sie nicht verstehen, weil Ihr Speedtest aus eigener Wohnung in Monat 7 200 Mbit/s zeigt. Wöchentlichen Auto-Reboot im Admin-Panel planen — jeden Dienstag um 04:00. Die meisten Router zeigen das; manche brauchen einen 4-$-Steckdosen-Timer. Der langweilige Fix, der 90 % der „WLAN wurde langsamer im Verlauf"-Bewertungen zurückkauft.

## FAQ

**Wieviel Down/Up im Airbnb-Listing nennen?**
Die **niedrigere von zwei**: die ISP-Werbe-Geschwindigkeit und das [fast.com](https://fast.com)-Ergebnis aus dem Schlafzimmer am weitesten weg. Minus 20 % für den Schlecht-Abend-Fall. Bei 200/100-Glasfaser und 65 Mbit/s im Schlafzimmer um 22:00 „60 Mbit/s" listen. Aufgeblasene Listings sind der größte Treiber von WLAN-1-Stern-Bewertungen.

**Brauche ich wirklich ein Gast-Netz für einen Gast?**
Ja. Grund ist nicht Durchsatz — es ist, dass das Gast-Telefon Ihr LAN scannt, ob Sie es wollen oder nicht, und Ihren NAS-Hostnamen zu sehen ist die „Ich fühlte mich beobachtet"-Sorte Detail, die auf Reddit landet. Gast-SSID einmal einrichten, weggehen, nie wieder dran denken.

**Lohnt Mesh für ein 45-m²-Studio?**
Nein. Ein Wi-Fi-6-Router deckt 45 m² in jedem Wohnungsbau außer einem Bunker. 100 $ sparen und in [Smart-Lock-vs.-Schlüsselsafe-Mathematik](/blog/smart-lock-vs-lockbox-cost-math) stecken.

**Kann ich WLAN als Extra-Gebühr abrechnen?**
Technisch ja auf den meisten Plattformen; praktisch nein — Gäste 2026 erwarten WLAN inklusive wie Strom. Separat zu bepreisen senkt die Conversion 8–12 % laut den wenigen Studien dazu. In die Nachtrate einbacken und weiterziehen.

**Mein ISP-Modem ist auch Router. Brauche ich wirklich einen weiteren?**
Bei einem Studio kommt man manchmal mit der Combo durch. Bei allem Größeren ist das Combo-WLAN zu schwach. Combo in **Bridge-Modus** (Admin-Panel hat eine Einstellung; ISP kann es per Telefon in 2 Minuten machen), dann Ihren echten Router an den WAN-Port. Combo als schicken Glasfaser-zu-Ethernet-Wandler behandeln und vergessen.

**Wie rotiere ich das Gast-Passwort, ohne Gast-Zugang im Aufenthalt zu brechen?**
Passwort auf der Willkommens-Karte vorab gedruckt und zwischen Aufenthalten rotieren, nicht während eines. Reinigungskraft kann es am Auscheck-Tag in 90 Sekunden in der Router-App rotieren. Der Host, der täglich rotiert, schafft mehr Gast-Nachricht-Arbeit, als die Rotation verhindert.

**Was ist mit Ethernet-Anschlüssen für Gäste, die kabeln wollen?**
Ein 5-$-Ethernet-Kabel sichtbar am Schreibtisch nahe dem Smart-TV ist im „für die Arbeit hier"-Subset zwei Sterne wert. Vom Router (oder einem 15-$-unmanaged Switch) zum Schreibtisch. Niemand beklagt einen verkabelten Port. Viele Gäste beklagen, dass keiner da war.

**Soll ich das WLAN-Passwort vor Anreise im Reiseführer posten?**
Ja, und auf der Willkommens-Karte am Küchentisch und auf einem Klebezettel neben dem Router. Häufigster Grund einer 4-Sterne-Airbnb-Bewertung: „brauchte 20 Minuten, um das WLAN-Passwort zu finden". An drei Orten posten. Auch in der Bestätigungsnachricht des [Anreiseformulars](/blog/pre-arrival-guest-forms).

**Ist der billige „AX1800"-Router auf Amazon zu 50 $ wirklich okay?**
Manchmal. Risiko ist, dass es ein Vorgängerchipsatz ist, keine Firmware-Updates nach Jahr 2 und eine CPU, die ab 8 gleichzeitigen Clients einknickt. 30 $ mehr für eine bekannte Marke (TP-Link, Asus, Netgear) mit 2024er- oder 2025er-Veröffentlichungsdatum ausgeben. Jahr-1-Ersparnis lohnt nicht den Jahr-3-Ersatz.

## Eine Meinung

WLAN ist das einzige Stück Infrastruktur in einer Kurzzeitvermietung, bei dem Gäste eine Bewertung basierend auf der schlechtesten einzelnen Stunde des Aufenthalts schreiben. Ihr Bett kann 4 von 5 in Komfort sein, Ihre Küche 4 von 5 in Ausstattung, Ihr Check-in 4 von 5 in Freundlichkeit, und Sie bekommen trotzdem 4,7. Ein langsamer Samstag im WLAN, und die Bewertung ist 3 Sterne und nennt es ausdrücklich. Die Asymmetrie macht die billige Option teuer.

200 $ in die richtige Hardware und 30 Minuten Setup für die Gast-SSID. Wöchentlicher Auto-Reboot, 4G-Failover, Passwort an drei Stellen. Der ganze Stack ist zwei Abende Arbeit und zehn Jahre Nicht-mehr-dran-denken. Hosts, die das überspringen, haben innerhalb der ersten acht Aufenthalte eine schlechte WLAN-Bewertung. Die Mathematik ist nicht subtil.
