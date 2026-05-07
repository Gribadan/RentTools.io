---
slug: self-hosting-property-manager-droplet
locale: de
title: "Hostverwaltung selbst betreiben auf einem 4-$-Droplet"
excerpt: Wie Sie eine Kurzzeitvermietungs-Hostverwaltung auf einem günstigen DigitalOcean-Droplet selbst betreiben. Echte RAM-Zahlen, echte Build-Limits, echte Monatskosten.
status: draft
tags:
  - self-hosting:Selbst-Hosting
  - host-tips:Host-Tipps
  - infrastructure:Infrastruktur
ogImageUrl: /blog-covers/self-hosting-property-manager-droplet.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Hostverwaltung selbst betreiben auf einem 4-$-Droplet

Meine erste Cloud-Rechnung als Host war 73 $. Ich hatte mich durch die AWS-Konsole geklickt, sinnvoll wirkende Voreinstellungen genommen und endete mit einer t3.medium, die rund um die Uhr im Leerlauf lief, plus einem verwalteten Postgres, das ich nie abfragte. Nach Kündigung zog ich das ganze Setup auf ein 4-$-DigitalOcean-Droplet mit SQLite um. Es läuft dort seit über einem Jahr. Es bedient eine kleine, aber reale Nutzerbasis. Es ist nicht in Flammen aufgegangen.

Dieser Beitrag zeigt, wie man das macht, was am unteren Ende bricht und der ehrliche Trade-off zwischen 4-$-Box und verwaltetem Service.

## TL;DR

- Ein 512-MB- bis 1-GB-DigitalOcean-Droplet betreibt einen kleinen Next.js + SQLite-Hostverwalter zur Laufzeit problemlos. Builds sind eine andere Geschichte.
- Build-Artefakt auf einem CI-Runner (GitHub Actions, GitLab CI) bauen, per SSH ans Droplet schicken. Das Droplet kompiliert nichts.
- SQLite bewältigt eine Single-Host-Last mühelos. Zehntausende Buchungen, einstellige ms-Lesezeit, datei-basierte Backups.
- Cloudflare vor dem Droplet gibt Ihnen kostenlos TLS, kostenlose DDoS-Abwehr und kostenloses statisches Caching. Nutzen.
- Gesamtmonatskosten für 1- bis 50-Objekte-Host: 4 bis 6 $ Droplet, 0 $ Cloudflare, 0 $ GitHub-Actions-Free-Tier. 4 bis 10 $/Monat ist die realistische Untergrenze.

## Der Fall fürs Selbst-Hosten (und dagegen)

Selbst-Hosten einer Hostverwaltung ist nicht für jeden. Seien Sie ehrlich, auf welcher Seite Sie stehen.

Sie sollten Selbst-Hosten erwägen, wenn:

1. Sie ohnehin eine Linux-Box für etwas anderes betreiben (Privat-Site, Home-Lab, VPN). Der marginale Aufwand für eine weitere App ist klein.
2. Sie 1 bis 50 Objekte haben und 25 bis 200 $/Monat PMS-Gebühr vermeiden wollen.
3. Sie Ihre Daten besitzen wollen — Gast-Pass-Scans sollten nicht in einer geteilten SaaS-Datenbank liegen, deren Firma in drei Jahren übernommen werden könnte.
4. Sie es genießen, Dinge um 23:00 zu reparieren, weil die Freude den Schlafverlust überwiegt.

Sie sollten NICHT selbst hosten, wenn:

1. Sie 100+ Objekte haben. Echte Channel-Manager-APIs (Hostaway, Lodgify) sind das Geld wert; die iCal-only-Welt ist zu lückenhaft.
2. Sie einen Hauptberuf haben, der keine Reaktion auf 03:00-Alarme erlaubt. Selbst-Hosten heißt: Sie sind das Bereitschafts-Team.
3. Sie 99,999 % Verfügbarkeit erwarten. Single-Droplet heißt Single-Point-of-Failure. Reboot, Netzwerk-Aussetzer, voll gelaufene Festplatte — Sie regeln die Wiederherstellung.
4. Sie „Logs anschauen" als Strafe sehen. Selbst-Hosten ist meist Logs anschauen.

Ehrlicher Mittelweg: erst eine kostenlose gehostete Instanz probieren ([RentTools](/onboard) ist ein Beispiel; es gibt andere). Passt es, bleiben. Wenn mehr Kontrolle gewünscht, ist das 4-$-Droplet der nächste Schritt. Wenn das überschritten ist, kommt ein verwaltetes PMS.

## Die Droplet-Größenfrage

DigitalOceans günstigste Droplets liegen bei 4 bis 6 $/Monat, je nach Region und aktuellem Pricing. 512-MB- bis 1-GB-Box mit 1 vCPU und 10 bis 25 GB SSD. Ihre [Preisseite](https://www.digitalocean.com/pricing/droplets) ist die maßgebliche Referenz; Zahlen verschieben sich quartalsweise.

Für eine einzelne Next.js-App plus SQLite beschreiben die [Next.js-Production-Deploy-Docs](https://nextjs.org/docs/app/building-your-application/deploying) den Standard-`node`-Server. Realistischer Ressourcenverbrauch auf meiner Box, über Monate beobachtet:

1. **Laufzeit-RAM**: 250 bis 400 MB resident für den Node-Prozess unter normalem Verkehr (1 bis 5 gleichzeitige Anfragen).
2. **Laufzeit-CPU**: unter 5 % einer vCPU im Schnitt. Spitzen auf 30 % bei iCal-Sync-Zyklen alle 10 Minuten.
3. **Plattenverbrauch durch SQLite**: unter 100 MB für eine Datenbank mit 50 Objekten, 8.000 Buchungen, 12.000 Gästen. SQLite ist kompakt.
4. **Plattenverbrauch durch Node + node_modules**: 600 MB bis 1 GB. Das ist der Teil, der das größere Droplet wünscht.

Die 1-GB-Stufe handhabt alles komfortabel. Die 512-MB-Stufe schafft Laufzeit, aber Sie laufen bei Operationen wie Bulk-Migrationen oder Backup-Wiederherstellung in OOM. Wenn das Budget erlaubt: 1 GB. Sonst: schwere Operationen woanders ausführen (CI, Laptop) und Ergebnisse zur kleinen Box schicken.

Was Sie NICHT wollen: den Build auf dem Droplet laufen lassen. Mehr dazu gleich.

## Woanders bauen, auf der Box laufen lassen

Der nützlichste Trick am unteren Ende.

Next.js-Builds auf kleinen Boxen laufen schlecht. Der Build-Prozess startet mehrere Worker, hält den ganzen Dependency-Graphen im Speicher, kompiliert TypeScript, optimiert Bundles, generiert vorgerenderte Seiten und produziert ein `.next/`-Verzeichnis, das 10× größer als die Quelle ist. Auf einem 1-GB-Droplet:

1. Frisst alles RAM in 30 bis 60 Sekunden.
2. Löst den OOM-Killer aus, der meist den Build, manchmal aber die laufende App tötet.
3. Hinterlässt einen inkonsistenten halb-gebauten Deploy und einen kurzen Ausfall.

Lösung: Artefakt auf einer stärkeren Maschine bauen, Ergebnis schicken. Zwei Muster funktionieren:

1. **GitHub-Actions-Runner.** Runner haben 16 GB RAM. Build in 2 bis 4 Minuten. Der Runner produziert ein Tarball von `.next/`, kopiert es per `scp` ans Droplet, das Droplet entpackt und startet den systemd-Dienst neu. Kosten: 0 $ im GitHub-Actions-Free-Tier für öffentliche und die meisten kleinen privaten Repos.
2. **Ihr Laptop.** Gleiche Idee, manuell. `npm run build` lokal, `rsync` rüber, neu starten. Weniger reproduzierbar als CI, aber okay für Einzel-Operation, die einmal pro Woche deployt.

Das Muster funktioniert, weil die Laufzeit-Anforderungen (`node server.js` gegen ein vorgebautes `.next/`) deutlich leichter sind als die Build-Anforderungen (kompilieren, bündeln, optimieren). Das Droplet macht nur die einfache Hälfte.

Bei CI: [GitHub-Actions-Docs](https://docs.github.com/en/actions) decken die Workflow-YAML; das [DigitalOcean-Tutorial zu systemd-verwalteten Node-Apps](https://www.digitalocean.com/community/tutorials) ist die Standardreferenz für die Droplet-Seite. `systemd` für den Node-Prozess konfigurieren, dann erholen sich Reboots und Crashes automatisch.

## SQLite reicht

Die andere Überraschung: wie weit SQLite trägt.

Für einen Single-Tenant- oder Single-Host-Hostverwalter bewältigt SQLite Lasten, die konventionell Postgres nahelegen würden. Einige Dinge, die entgegen der Erwartung funktionieren:

1. **Gleichzeitige Lesevorgänge**: WAL-Modus erlaubt viele parallele Leser. Selbst ein 100-Objekte-Dashboard, das Dutzende Buchungen abfragt, liest sauber.
2. **Schreib-Durchsatz**: Single-Host-Schreibvorgänge sind im schlimmsten Fall einstellig pro Sekunde. Weit unter SQLite's Decke von Tausenden Schreibvorgängen pro Sekunde auf Standard-Disk.
3. **Backups**: Eine SQLite-Datenbank ist eine Datei. Tägliche Backups sind `cp data/prod.db data/backups/$(date +%F).db`, schnell selbst bei Gigabyte-Größe, weil der OS-Page-Cache das Lesen sequenziell macht.
4. **Migrationen**: Standard-Prisma-Migrationen funktionieren. Die „kein gleichzeitiger Schreiber"-Beschränkung trifft bei Schema-Änderungen, aber eine 30-Sekunden-Pause ist akzeptabel für ein Single-Host-Tool, das nicht 100 % zeitkritisch ist.

Szenarien, in denen SQLite bricht: Multi-Region (keine Replikation), schwere Multi-Tenant-Schreib-Fanout (passt besser zu Postgres oder einem Schreib-shardierten Setup), Volltextsuche auf Millionen Reihen (machbar mit FTS5, aber Postgres ist idiomatischer). Nichts davon trifft einen kleinen Hostverwalter.

Migrationspfad ist okay, falls Sie wachsen. Prismas Datenbank-Adapter-Muster (`@prisma/adapter-libsql`) bedeutet, dass SQLite gegen Turso, libSQL repliziert oder volles Postgres zu tauschen meist eine Umgebungsvariablen-Änderung ist. Erst auf SQLite bauen, später tauschen, wenn nötig.

Vertiefung, warum wir den SQLite-Ansatz wählten: Schreibe in unserem [Reinigungs-Plan-Beitrag](/blog/cleaning-schedule-automation), der auf derselben Datenbank lebt und zeigt, wie die Daten-Form aussieht.

## Cloudflare, TLS und die langweilige Infra

Vor dem Droplet läuft Cloudflare. Free-Tier. Voller (strict) TLS-Modus. Vorteile sind groß für die Kosten (null):

1. **Kostenloses TLS-Zertifikat.** Wird automatisch bereitgestellt. Kein Let's-Encrypt-Cron, kein certbot.
2. **DDoS-Abwehr.** Ein kleiner Host wird kaum gezielt DDoS'd, aber ein fehlverhaltener Bot hat meine CPU ein- oder zweimal getroffen. Cloudflare absorbiert es.
3. **Statisches Caching.** Bilder, Schriften und die Next.js-statischen `_next/static/`-Pfade cachen am Edge. Senkt Bandbreite und CPU-Last des Droplets genug, dass die 1-GB-Stufe sich geräumiger anfühlt.
4. **DNS am gleichen Ort wie der Proxy.** Ein Dashboard für alles.

Volles Setup: Domain-Registrar zeigt NS-Records auf Cloudflare, Cloudflare proxied Apex und www-Record zur Droplet-IP, das Droplet betreibt nginx, das Cloudflares Verkehr mit strict TLS terminiert, nginx leitet an den lokalen Next.js-Prozess weiter. Die ganze DNS-zu-App-Kette dauert vielleicht eine Stunde, wenn Sie es schon mal gemacht haben, zwei bis drei Stunden beim ersten Mal.

Der unsexy Schritt ist `systemd`. Ihre Next.js-App als systemd-Unit (`rent-tool.service` bei uns) eintragen, und Sie sorgen sich nicht mehr um Start-bei-Boot, Restart-bei-Crash, Log-Rotation und Ressource-Limits. systemd ist das Betriebssystem, das sagt: ist okay, die Box allein zu lassen.

*Abbildung 1: Die Deploy-Pipeline. Push auf master → GitHub Actions baut → scp Tarball ans Droplet → systemd reload. Screenshot folgt; landet unter /blog/self-hosting-property-manager-droplet/figure-1.png.*

## Was am unteren Ende bricht

Was auf meiner 6-$-Box wirklich gebrochen ist, in Häufigkeitsreihenfolge:

1. **Disk voll.** Logs sammeln sich. Alte Backups sammeln sich. Ein halb gescheitertes `npm install` lässt Schrott in `~/.npm`. `logrotate` einrichten, Backup-Aufbewahrungs-Politik festlegen (letzte 14 täglich + letzte 12 monatlich) und einmal im Monat `du -sh /var/log /home/app/.npm /tmp` laufen lassen. Zweimal im Jahr habe ich ENOSPC getroffen und nur gemerkt, weil der Deploy scheiterte.
2. **Speicher-Druck bei manueller Operation.** Ein einmaliger SQL-Dump, ein Prisma-Schema-Push, ein Skript, das alle Buchungen in den Speicher lädt. Das CI-Build-Muster löst den Routinefall; manuelle Fälle verlangen Disziplin (streamen, nicht laden; pipen, nicht ansammeln). `--max-old-space-size=512` zu einmaligen `tsx`-Aufrufen als Sicherheitsnetz.
3. **Domain-Konfigurations-Drift.** Cloudflare ändert eine Voreinstellung, oder DNS-TTL cacht länger als erwartet. 24-Stunden-Fix-Fenster ist normal. TTLs während aktiver Änderungen auf 60 Sekunden, danach auf Voreinstellung zurück.
4. **Eine Next.js-Minor-Version, die eine Dependency brach.** Zweimal in 18 Monaten. Fix ist schnell (Paket zurückrollen, Fix pushen); die Lehre: CI den Build vor dem Deploy laufen lassen, dann erreicht die kaputte Version nie das Droplet.

Was NICHT gebrochen ist: SQLite-Korruption, systemd-Wackeligkeit, das Droplet selbst rebootet unerwartet. DigitalOceans kleine Droplets sind überraschend stabil. Die langweilige Infrastruktur bleibt langweilig.

## FAQ

**Ist SQLite wirklich produktionsreif?**
Ja für Single-Writer-Lasten in der Größenordnung eines einzelnen Hosts. Nein für Multi-Region oder schreib-lastiges Multi-Tenant-SaaS. Die [Appropriate-Uses](https://www.sqlite.org/whentouse.html)-Seite des SQLite-Teams ist die kanonische Referenz; wir passen ins „Datenbank für die Anwendung"-Muster.

**Warum DigitalOcean und nicht AWS / GCP / Hetzner?**
Persönliche Vorliebe. DOs UI ist die einfachste, das Klein-Droplet-Pricing fair, und die Doku gut. Hetzner ist günstiger bei gleichem RAM und gleich gut. AWS ist Overkill für 4-$-Ambitionen. GCP ist okay, aber die Free-Tier-Regeln verwirrend.

**Was ist mit einem Raspberry Pi zu Hause?**
Funktioniert. Fügt zwei neue Fehlermodi hinzu: Wohn-ISP (dynamische IPs, ISP-blockierter Port 443) und Heim-Stromausfälle. Wer beides überbrücken kann, dem ist der Pi günstiger als jede Cloud-Option. Ich würde keinen einkommens-relevanten Service so betreiben, aber als Hobbyist-Setup ist es okay.

**Wie überwache ich Uptime?**
Ein kostenloser Uptime-Monitor (BetterStack, UptimeRobot, Pingdom Free-Tier) trifft minütlich einen `/api/health`-Endpoint und alarmiert bei Fehler. Endpoint sollte günstig sein (keine DB-Query), damit der Monitor selbst die Box nicht belastet.

**Was ist mit Backups?**
Nächtliche `cp` der SQLite-Datei in ein Backups-Verzeichnis, plus Offsite (S3-kompatibler Speicher wie Backblaze B2 zu 6 $/TB) wöchentlich. Restore quartalsweise testen — Backups, von denen Sie nie wiederhergestellt haben, sind keine Backups.

**Bewältigt mein Droplet 1.000 Objekte?**
Wahrscheinlich, aber nicht auf der günstigsten Stufe. Auf 2 GB RAM und 2 vCPUs (~12 $/Monat) heben, dann hat die Box Platz. Darüber ist der Engpass meist der iCal-Poll-Zyklus, nicht das Droplet.

## Eine Meinung

Was der Klein-Droplet-Ansatz wirklich kauft, ist **die Abwesenheit eines Anbieters**. Nicht die Ersparnis (ein gehosteter Service kostet 25 bis 200 $/Monat für ähnliche Funktionen; Ersparnis ist real, aber sekundär). Die Abwesenheit.

Wenn mein Domain-Registrar seine UI ändert, wenn DigitalOcean in meiner Region einen 30-Minuten-Netzwerk-Aussetzer hat, wenn Cloudflare eine Einstellung deprecated — all das bemerke ich und passe an. Keines davon legt mich lahm, weil keines meine Daten oder meinen Code besitzt. Wenn DO morgen pleite geht, würde ich die SQLite-Datei am Wochenende per `scp` nach Hetzner schieben und Montag wieder laufen.

Vergleich: ein gehostetes PMS. Der Anbieter ändert sein Pricing, wird von einem größeren PMS gekauft, das konsolidieren will, sunsettet den Free-Tier oder hat einen mehrtägigen Ausfall. Sie warten. Die Daten sind ihre in der Praxis, auch wenn sie auf dem Papier Ihre sind. Das 4-$-Droplet ist der Preis, aus dieser Beziehung auszusteigen.

Das ist die Pointe. Die Ersparnis ist der Bonus.
