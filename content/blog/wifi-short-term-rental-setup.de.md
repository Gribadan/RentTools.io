---
slug: wifi-short-term-rental-setup
locale: de
title: "WLAN für Ferienwohnungen: Geschwindigkeit, Router und LTE-Failover"
excerpt: "Wie viel Mbit/s Gäste wirklich brauchen, der Router, der den vierten Monat überlebt, und das 4G-Backup, das drei Ausfallnächte zu einem Nicht-Ereignis macht."
status: published
tags:
  - host-tips:Gastgeber-Tipps
  - tools:Tools
  - automation:Automatisierung
ogImageUrl: /blog-covers/wifi-short-term-rental-setup.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Die erste Ein-Sterne-Bewertung wegen WLAN bekam ich für einen Router, der 47 Wochen im Jahr tadellos lief. In der Woche, in der er es nicht tat, brach einer Geschäftsreisenden in zwölf Minuten dreimal das Videocall ab. Sie gab auf, reichte vom Handy-Hotspot kein Support-Ticket mehr ein und hinterließ eine Bewertung mit dem Titel „WLAN unbrauchbar" — ohne Text. Der Router startete sich etwa eine Stunde nach ihrem Auszug selbst neu und lief die nächsten neun Monate problemlos. Ich hätte nie erfahren, dass er ausgefallen war, wenn sie es mir nicht öffentlich, im falschesten Moment, an der meistgelesenen Stelle des Inserats gesagt hätte.

Dies ist der Beitrag über das WLAN-Setup, das diese Bewertung verhindert. Die Mbit/s-Zahl, die Gäste tatsächlich brauchen (es ist nicht die auf der Speedtest-Werbung), den Router, der den vierten Monat in einer realen Wohnung übersteht, und das LTE-Backup für 10 Euro im Monat, das aus dem schlimmsten Beschwerdetyp ein Nicht-Ereignis macht, bevor der Gast etwas merkt.

## TL;DR

- Die meisten Gäste brauchen 25 Mbit/s im Download, nicht 100. Kaufen Sie Reserve, nicht die Zahl auf der Marketingseite.
- Ein Router für 40 Euro reicht für eine Wohnung. Ab vier Wohnungen macht die Ausfallrate ein Mesh-Set für 180 Euro günstiger als die Rückerstattungen.
- Ein LTE-Failover mit Daten-eSIM für 10 Euro pro Monat kostet im Jahr weniger als die Erstattung einer einzigen Ausfallnacht.
- Der größte versteckte Kostenpunkt ist der stille Ausfall — der Router stoppt am ersten von fünf Nächten und Sie erfahren es aus der Bewertung am siebten Tag.
- SSID und Passwort gehören an drei Stellen: laminierte Karte auf der Arbeitsplatte, digitales Gästehandbuch, Aufkleber am Smart Lock. Gäste finden die Stelle, an der sie zuerst nachsehen.
- Heartbeat-Ping alle 5 Minuten, Alarm nach drei aufeinanderfolgenden Ausfällen. Einmal eingerichtet, zwanzig Minuten Aufwand, nie wieder eine Ein-Stern-Bewertung wegen WLAN.

## Wie viel Mbit/s wirklich gebraucht werden

Gastgeber zahlen zu viel für Geschwindigkeit, weil die Provider-Seite den 100-Mbit-Tarif zehnmal attraktiver erscheinen lässt als den 25-Mbit-Tarif für 15 Euro Aufpreis. Dann schreibt ein Gast „WLAN war langsam" in die Bewertung einer Wohnung mit Glasfaseranschluss, der am Morgen nach der Reinigung 480 Mbit/s lieferte.

Was „langsam" in solchen Bewertungen fast immer bedeutet:

- Das Signal sank im Schlafzimmer auf einen Balken. Der Router stand im Flur hinter einem Metallheizkörper.
- Der Router stürzte tagsüber für 40 Minuten ab und startete sich neu, bevor der Gast Sie anschreiben konnte.
- Der DNS war falsch konfiguriert, und das Netflix-Vorschaubild lud 14 Sekunden.
- Der Gast verband sich mit dem 2,4-GHz-Band, weil das 5-GHz-Band denselben Namen trug und das Smartphone das lautere, langsamere Signal wählte.

Keines dieser Probleme lässt sich mit mehr Mbit/s lösen. Sie lassen sich mit Router-Platzierung, einem funktionierenden zweiten Band und einem DNS lösen, der nicht der Provider-Standard ist. Das reale Bandbreitenbudget für typische Nutzungsfälle:

| Nutzung | Pro Stream | Komfort-Reserve |
| --- | --- | --- |
| Netflix 1080p | 5 Mbit/s | 8 Mbit/s |
| Netflix 4K | 25 Mbit/s | 35 Mbit/s |
| Zoom / Google Meet HD | 3,5 Mbit/s Up, 3,5 Mbit/s Down | 6 Mbit/s |
| Spotify | <1 Mbit/s | 1 Mbit/s |
| Cloud-Backup im Hintergrund | 5–10 Mbit/s Up | 15 Mbit/s Up |

Zwei Erwachsene, die parallel 4K-Netflix auf zwei Fernsehern schauen, während eine dritte Person einen Zoom-Call führt, benötigen rund 80 Mbit/s Download und 8 Mbit/s Upload. Das ist der schlimmste plausible Fall für eine 2-Zimmer-Wohnung, und eine symmetrische 100/100-Glasfaserleitung deckt ihn doppelt ab.

Die Zahl, die in Märkten mit vielen Remote-Workern wirklich entscheidet — Lissabon, Mexiko-Stadt, Bali, Tiflis —, ist die **Upload-Geschwindigkeit**. Ein Gast mit vier Zoom-Calls am Tag auf einem 100/10-Mbit-Kabeltarif, während drei weitere im Netz hängen, läuft einmal pro Woche in die Upload-Decke und nennt das „Ihr WLAN". Wenn Sie die Wahl haben: 50/50 oder 100/100 Glasfaser. Zehn Euro mehr, diese Bewertung nie wieder.

## Der Router, der den vierten Monat übersteht

Ich habe in genug Wohnungen genug Consumer-Router ersetzt, um eine Regel zu haben: Die Ausfallrate einer 40-Euro-Plastikbox in einer realen Ferienwohnung ist so hoch, dass sich ein Mesh-System ab der vierten Wohnung bereits rechnet.

Was bei mir tatsächlich kaputtgegangen ist:

- Günstige Dualband-Router (TP-Link Archer C6, AC1750-Klasse): Einer von dreien fällt innerhalb von 18 Monaten 24/7-Betrieb aus. Meist Kondensatoren in feuchten Küchen.
- Mittlere Klasse (ASUS RT-AX55, Netgear Nighthawk AX1800): Einer von acht fällt im gleichen Zeitraum aus. Meist Firmware — das Gerät läuft, aber das 5-GHz-Band fällt still aus und nur ein Neustart hilft.
- Mesh-Systeme (TP-Link Deco, Google Nest, eero): Einer von zwanzig fällt in 24 Monaten aus. Die Redundanz steckt im System: Wenn ein Knoten stirbt, versorgen die anderen weiter, während Sie Ersatz schicken.

Die Kostenrechnung über vier Objekte und 24 Monate:

| Setup | Hardware | Ersatz | Erstattungen | 24-Monats-Summe |
| --- | --- | --- | --- | --- |
| Router 40 € × 4 | 160 € | 160 € (3 Tausche) | 400 € (4 Nächte × 100 €) | **720 €** |
| Mittlere Klasse 90 € × 4 | 360 € | 180 € (2 Tausche) | 200 € (2 Nächte × 100 €) | **740 €** |
| Mesh 180 € × 4 Objekte (2 Knoten je) | 720 € | 90 € (1 Tausch) | 100 € (1 Nacht × 100 €) | **910 €** |

Die Mesh-Zahl sieht in der Hardware-Spalte am schlechtesten aus. In der Gast-Spalte sieht sie am besten aus: Die Funkschatten im hinteren Schlafzimmer verschwinden, die Bewertung mit dem abreißenden Signal kommt nie, und die eine volle Erstattung, die Sie vermeiden, ist sechs Monate Mehrkosten wert. Ab dem fünften oder sechsten Objekt ist Mesh die günstigste Zeile in der Tabelle.

Für eine kleine Wohnung reicht ein solider Router der mittleren Klasse. Der Break-even-Punkt, ab dem sich Mesh lohnt, liegt bei etwa **80 m² Wohnfläche oder drei Räumen mit geschlossenen Türen zwischen Router und Bett**. Darunter gewinnt ein einzelner AX1800-Router in zentraler Position.

## Das LTE-Failover, das fast niemand installiert

Hier ist die Zahl, die das Gespräch verändert: Ein LTE-Failover-Router (oder USB-Modem im Hauptrouter) mit einer Daten-SIM für 8–12 Euro pro Monat kostet im Jahr rund **140 Euro**. Eine erstattete Ausfallnacht bei einem 90-Euro-Inserat sind **90 Euro plus verlorene Bewertung**. Die LTE-Failover-Rechnung wird nach dem ersten vermiedenen Ausfall irrelevant.

Die üblichen Setups:

- Ein Consumer-Router mit USB-Port, an dem ein 4G-USB-Modem hängt (TP-Link Archer C7, Netgear Nighthawk, die meisten AsusWRT-Builds). Modem rein, Failover in der Admin-Oberfläche konfigurieren, fertig. ~40 Euro Modem, 8 Euro SIM pro Monat.
- Ein dediziertes LTE-Failover-Gerät (TP-Link MR600, Teltonika RUT240, Cradlepoint für die Enterprise-Klasse). Sitzt zwischen Modem und Switch; fällt der WAN aus, wechselt der Verkehr nahtlos auf LTE. ~100 Euro Gerät, 10 Euro SIM pro Monat.
- Ein Mesh-System mit nativer LTE-Backhaul-Unterstützung (TP-Link Deco X20-4G, Nest WiFi Pro mit gekoppeltem Smartphone). Höhere Hardware-Kosten, aber das gesamte Netz — Funkschatten eingeschlossen — läuft weiter.

Der eSIM-Markt macht das 2026 günstig. **Airalo** und **Holafly** verkaufen reine Daten-eSIMs für 5–10 Euro pro Monat in den meisten Ländern, ohne Vertrag, ohne SIM-Wechsel; viele Failover-Geräte unterstützen eSIM mittlerweile direkt. Vor drei Jahren gab es diese Option für Hobby-Gastgeber nicht; heute ist sie die rentabelsten 150 Euro, die Gastgeber in ein Objekt stecken können.

Eine Einschränkung: Failover-Geschwindigkeit ist 4G, nicht Glasfaser. Ein Gast mitten im Zoom-Call sieht beim Wechsel ein bis zwei Sekunden Qualitätsverlust, und wenn das Objekt nur zwei 4G-Balken empfängt, ist der Rest des Tages „WLAN ist langsam" statt „WLAN ist tot". Das eine ist eine Vier-Sterne-Bewertung. Das andere eine Erstattung und ein Stern.

## Das Monitoring, das den stillen Ausfall fängt

Der Router kann laufen, und das Internet kann tot sein. Das Gebäudekabel wurde durchtrennt, der Provider hat einen Regional-Ausfall, das Modem hängt, ohne dass der Router es merkt. Nichts davon erscheint im Admin-Panel des Routers als Fehler. Erkennen lässt es sich nur durch einen Test von außerhalb des Netzes.

Das Setup, das ich pro Objekt umsonst betreibe:

1. Ein kleines Heartbeat-Skript auf einem 35-Euro-Raspberry-Pi oder, heute häufiger, auf einem VPS — pingt die öffentliche IP des Objekts alle 5 Minuten.
2. Nach drei aufeinanderfolgenden Fehlschlägen (15 Minuten ohne Antwort) sendet es eine Telegram- oder Slack-Nachricht.
3. Nach 30 Minuten Fehlern geht zusätzlich eine Nachricht an die Reinigungskraft mit der Standardanweisung „Bitte den mit dem grünen Aufkleber markierten Router neu starten".

Aufwand: 20 Minuten beim ersten Objekt, 5 Minuten bei jedem weiteren. Sie bekommen die erste Warnung etwa eine Stunde, bevor der Gast es merkt, und in 80 Prozent der Fälle lässt sich der Router fernzurücksetzen (oder die Reinigungskraft schicken), bevor der Gast überhaupt etwas sieht.

Wer kein Skript laufen lassen will, nimmt:

- **UptimeRobot** Free: 50 Monitore, 5-Minuten-Intervall, E-Mail- und Push-Benachrichtigungen. 0 Euro pro Monat.
- **BetterStack** (früher Better Uptime) Starter: 30-Sekunden-Intervall, On-Call-Rotationen. 20 Euro pro Monat für ernsthafte Betreiber.
- Einen Consumer-Router mit eingebautem Ping-Watchdog (die meisten AsusWRT- und OpenWRT-Builds): kein externer Dienst nötig.

Das ist die rentabelste Stunde WLAN-Arbeit, die Gastgeber jemals erledigen. Der Ausfall, der sonst ein Stern geworden wäre, wird abgefangen, und Sie erfahren davon um 11:30 Uhr, wenn Sie Zeit haben, statt um 23:45 Uhr, wenn der Gast bereits tippt.

## Wo Gäste wirklich nach dem Passwort suchen

Drei Stellen. Der Gast schaut an eine und nie an die anderen zwei:

1. **Eine laminierte Karte auf der Arbeitsplatte oder dem Tisch im Eingangsbereich.** Plastik, A6. SSID und Passwort 24-Punkt-fett, damit ein Smartphone mit gerissenem Display sie aus einem Meter Entfernung liest. Kosten: 2 Euro Druck, 1 Euro Laminierung, 4 Minuten Aufwand.
2. **Das digitale Gästehandbuch.** Dieselben SSID und Passwort als erste Zeile des WLAN-Abschnitts. Wer [ein digitales Gästehandbuch](/de/blog/digital-guidebook-short-term-rental) nutzt, hat dort bereits ein Feld dafür. Wer nicht: schicken Sie die WLAN-Info als separate Nachricht 30 Minuten nach Check-in, nicht im Willkommensabsatz.
3. **Ein kleiner Aufkleber am Smart-Lock-Tastenfeld oder am Schlüsselsafe.** Drei Zeilen: SSID, Passwort, „Wenn das WLAN nicht geht, schreiben Sie mir bitte zuerst". Das fängt die Gäste, die um Mitternacht ankommen und die Karte auf der Arbeitsplatte nicht finden, weil das Licht aus ist.

Ich schreibe das WLAN nicht mehr in die Willkommensnachricht. Gäste scrollen vorbei und fragen es später in einem von drei Aufenthalten. Die Karte auf der Arbeitsplatte und der Aufkleber am Schloss werden einmal von jedem Gast in der ersten Minute gelesen.

## Was tun, wenn das WLAN während des Aufenthalts ausfällt

Das Vorgehen ähnelt der [Self-Check-in-Ausfall-Prozedur](/de/blog/self-check-in-failure-playbook): erste Minute Nachricht, erste Stunde Lösung, danach die Bewertung.

Erste Minute: Eingang innerhalb von 5 Minuten bestätigen. „Ich sehe den Alarm, das LTE-Backup sollte in 30 Sekunden aktiv sein — bitte 60 Sekunden warten und neu verbinden; falls es nicht klappt, schreiben Sie mir gleich." Wenn Ihr Monitoring schneller war als der Gast, geht diese Nachricht raus, bevor der Gast schreibt — und der ganze Vorfall verwandelt sich von einer Beschwerde in einen Service-Gewinn.

Erste Stunde: Wenn das LTE-Failover läuft, ist das Netz zurück. Wenn nicht, zwei Optionen:

- Fern-Neustart (smarte Steckdose am Router-/Modem-Combo, 15 Euro auf dem Marktplatz, vom Gastgeber-Handy steuerbar): 90 Prozent der Router-Probleme lösen sich.
- Reinigungskraft oder Co-Host fährt hin: 30 Minuten Reaktionszeit in den meisten Städten, 5 Minuten vor Ort, Problem gelöst.

Die Entschädigung: Bei einem Ausfall unter 90 Minuten ist „Ich verlängere Ihren Check-out um eine Stunde und schicke einen Kaffee-Gutschein für das Café unten" das richtige Angebot. Bei 6+ Stunden ist die richtige Antwort eine Nacht zurück und ein klares „Das passiert nicht noch einmal, hier ist, was wir geändert haben". Bieten Sie keine Teilrückerstattung an, bevor der Gast fragt — das trainiert ihn, beim nächsten Mal mehr zu fordern. Sobald der Gast es einmal erwähnt: schnell und sichtbar erstatten, bevor die Bewertung gepostet wird.

## FAQ

**Wie viel WLAN-Geschwindigkeit braucht eine Airbnb-Wohnung?**

Für die meisten Objekte sind 50–100 Mbit/s im Download und mindestens 10 Mbit/s im Upload komfortabel — zwei parallele 4K-Streams plus ein Zoom-Call laufen problemlos. Billigere Tarife (25/5) reichen für einen Stream und leichtes Surfen — okay für eine Studio-Wohnung, nicht genug für eine Familie in der 3-Zimmer-Wohnung. Symmetrische Glasfaser (100/100) ist das Upgrade, das für Remote-Work-Gäste am meisten bringt, denn der Upload ist die Stelle, an der Kabelpakete Calls aushungern.

**Lohnt sich Mesh-WLAN bei nur einer Ferienwohnung?**

Bei einer kleinen Studio- oder 1-Zimmer-Wohnung unter 60 m² nein — ein gut platzierter Router der mittleren Klasse reicht und ist günstiger. Bei einer 2+-Zimmer-Wohnung, L-förmigem Grundriss oder Räumen mit geschlossenen Türen zwischen Router und Bett ja — das 180-Euro-Mesh-Set beseitigt die Funklücke im hinteren Schlafzimmer, die die meisten „WLAN war langsam"-Bewertungen verursacht. Bei drei oder vier Objekten kippt auch die Ausfallrechnung Richtung Mesh.

**Was ist das günstigste LTE-Backup für eine Ferienwohnung?**

Ein USB-4G-Modem (30–40 Euro, Huawei E3372 oder ähnlich) an einem Router mit USB-WAN-Unterstützung plus reine Daten-eSIM für 5–10 Euro pro Monat von Airalo oder einem lokalen Anbieter — zusammen 100–150 Euro im ersten Jahr. Ein dediziertes Failover-Gerät (TP-Link MR600, Teltonika RUT240) ist hardwareseitig teurer, aber in einer Minute installiert. Beide rechnen sich beim ersten vermiedenen Ausfall in einem Objekt für 70 Euro plus pro Nacht.

**Sollte das Gäste-WLAN vom eigenen Admin-Netz getrennt sein?**

Ja. Die meisten Consumer- und Prosumer-Router unterstützen ein Gastnetzwerk — aktivieren Sie es, vergeben Sie die öffentliche SSID und das Passwort, und lassen Sie das Admin-Netz unter einer anderen SSID mit Admin-Zugang nur für Sie und Ihre Smart-Home-Geräte. So kann der Gast den Router nicht versehentlich neu starten, nicht neu flashen und nicht auf das Web-Interface eines Smart Locks zugreifen. Außerdem können Sie das Gastnetz neu starten, ohne die Smart-Lock-Verbindung zu verlieren.

**Wie beweise ich, dass das WLAN lief, wenn ein Gast das Gegenteil behauptet?**

Externes Uptime-Monitoring laufen lassen (UptimeRobot, BetterStack, selbst gehostetes Ping-Skript). Das Monitoring erzeugt eine öffentliche Statusseite oder ein herunterladbares Log mit 5-Minuten-Pings. Behauptet ein Gast „WLAN war den ganzen Aufenthalt aus", das Log zeigt aber 100 % Uptime, haben Sie Beweise für eine Beschwerde bei Airbnb-Support, der bei nachprüfbaren Falschaussagen Bewertungen manchmal entfernt oder moderiert. Das Monitoring zahlt sich beim ersten erfolgreichen Einspruch aus.

**Können Gäste meine Router-Einstellungen ändern?**

Wenn sie im Admin-Netz sind und das Admin-Passwort kennen (manchmal auf dem Router gedruckt), ja — sie können Einstellungen ändern, das Netz umbenennen, das Passwort ändern und Sie aussperren. In einem korrekt eingerichteten Gastnetz nein — kein Zugriff auf die Admin-Oberfläche. Ändern Sie das Standard-Admin-Passwort am Tag der Installation; die Defaults sind öffentlich bekannt, und manche Gäste probieren sie tatsächlich aus.

**Brauche ich ein Captive Portal oder eine Nutzungsvereinbarung?**

In den meisten Ländern nein — der Gast ist kein Nutzer eines öffentlichen WLAN, sondern ein zahlender Mieter, der eine inkludierte Annehmlichkeit nutzt. In einigen Jurisdiktionen (Italien, Teile Spaniens) wurde historisch eine Identifizierung für jedes kommerzielle WLAN verlangt; in der Praxis wird das bei Ferienwohnungen selten durchgesetzt. Wer sich absichern will: ein einseitiges Captive Portal mit „Mit der Verbindung erklären Sie, das Netz nicht für illegale Zwecke zu nutzen; Verkehr wird protokolliert" lässt sich in 20 Minuten auf den meisten Prosumer-Routern einrichten und schiebt die Haftung sauber zum Gast.

**Welche Router-Marke hält in heißem oder feuchtem Klima?**

In meinen Objekten überleben ASUS und mittelpreisige TP-Link die Consumer-Klasse von Netgear um rund 50 Prozent in feuchten Küstenwohnungen. Mesh-Systeme mit passiver Kühlung (ohne Lüfter) leben länger als aktiv gekühlte, weil die Lüfter blockieren. Die Maßnahme, die wirklich die Lebensdauer verlängert und jede Markenwahl schlägt: den Router in die kühlste Ecke des Raumes stellen, mindestens 30 cm über dem Boden, mit 10 cm Freiraum auf allen Seiten. Ein Router auf einem hohen Regal in einem belüfteten Flur lebt doppelt so lange wie derselbe Router auf dem Fernsehschrank neben dem Heizkörper.

## Eine entschiedene Position

Die meisten Gastgeber zahlen zu viel für Geschwindigkeit und zu wenig für Verfügbarkeit. Ein Gast vergisst 100 Mbit/s am dritten Tag seines Aufenthalts. Er verzeiht nie null Mbit/s am ersten. Wer aus diesem Beitrag nur eine Sache mitnimmt, sollte vor dem nächsten Router-Kauf [ein Monitoring](/de/onboard) einrichten — denn der Router, den Sie schon haben, ist wahrscheinlich in Ordnung, und der stille Ausfall, von dem Sie nichts wissen, ist der eigentliche Autor der Bewertung.
