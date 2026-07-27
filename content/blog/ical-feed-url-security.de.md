---
slug: ical-feed-url-security
locale: de
title: "iCal-Feed-Sicherheit: was Ihr Kalenderlink wirklich verrät"
excerpt: "Die iCal-Export-URLs von Airbnb und Booking.com sind Passwörter ohne Ablaufdatum. Was im Feed wirklich steckt, wie Sie Ihren lesen und wann Sie ihn erneuern."
status: published
tags:
  - ical:iCal
  - calendar-sync:Kalendersynchronisation
  - data-protection:Datenschutz
  - host-tips:Host-Tipps
ogImageUrl: /blog-covers/ical-feed-url-security.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Elf Monate. So lange stand meine Airbnb-Export-URL in einem offenen Forenthread – von Google indexiert, lesbar für jeden, der weit genug scrollte. Ich hatte sie vollständig hineinkopiert, um zu fragen, warum Booking.com den Feed nicht zieht. Nach zwanzig Minuten kam die Antwort: Der Importslot war in Ordnung, beim Kopieren hatte sich ein Leerzeichen in die URL geschmuggelt. Ich schloss den Tab. Die URL blieb. Sie ist ein Token ohne Ablaufdatum und ohne eine einzige Zeile Zugriffsprotokoll – elf Monate lang lieferte sie jedes belegte Datum einer meiner Wohnungen an jeden aus, der danach fragte.

Hier steht, was tatsächlich in diesen Feeds liegt, wie Sie Ihren eigenen in anderthalb Minuten lesen, über welche fünf Wege die URL nach draußen gelangt und wie Sie sie auf jeder Plattform erneuern.

## TL;DR

- Eine iCal-Export-URL ist ein Passwort: kein Ablauf, kein Log, kein Widerruf.
- Airbnbs Feed kann mehr als Daten enthalten – lesen Sie Ihren selbst nach.
- Booking.coms Export gibt nur Daten preis. Der gute Fall, nicht die Regel.
- Die Inserats-ID steht in der URL – jeder Feed ist sofort zuordenbar.
- Ein Klick erneuert Airbnbs URL – und killt sofort jeden Abonnenten.
- Feed mit Gastnamen geleakt: Datenpanne, und die 72-Stunden-Frist läuft.

## Die URL ist ein Passwort – nur behandelt sie niemand so

Jede Plattform mit Kalenderexport löst die Authentifizierung gleich bequem: Das Geheimnis ist die URL selbst. Airbnb liefert etwas in der Form `https://www.airbnb.com/calendar/ical/12345678.ics?s=<Token mit 32 Zeichen>`. Booking.com liefert `https://admin.booking.com/hotel/hoteladmin/ical.html?t=<Token>`. Kein Login, kein Header, keine Signatur, keine IP-Freigabeliste. URL abrufen, Datei bekommen.

Das ist kein Versehen, sondern die einzige Bauweise, die hier funktioniert: Am anderen Ende sitzt der Import-Worker von Booking.com, und der kann sich nicht als Sie anmelden. Die gesamte [kostenlose iCal-Verknüpfung](/blog/airbnb-booking-calendar-sync-free) lebt davon, dass eine anonyme Maschine die URL nach Zeitplan abruft. Das Protokoll dahinter, [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), kennt den Begriff „autorisierter Abonnent" schlicht nicht.

Drei Eigenschaften machen dieses Token schlechter als ein Passwort:

1. **Es läuft nie ab.** Ein Passwort von 2023 werden Sie irgendwann zum Wechseln aufgefordert. Eine Feed-URL von 2023 liefert heute einen aktuellen, lebenden Kalender.
2. **Es gibt kein Zugriffsprotokoll.** Airbnb sagt Ihnen nicht, dass der Feed letzten Monat 400-mal von Adressen abgerufen wurde, die nichts mit Booking.com zu tun haben. Das Leck lässt sich nicht entdecken. Es lässt sich nur unterstellen.
3. **Es ist auf einen Blick zuordenbar.** Die `12345678` im Pfad ist Ihre Inserats-ID. Hängen Sie sie an `airbnb.com/rooms/` und Sie stehen auf dem öffentlichen Inserat: Fotos, Viertel, ungefähre Adresse. Der Feed muss Sie gar nicht benennen. Das erledigt die URL.

Punkt drei macht aus einer langweiligen Datumsliste etwas, das Sie interessieren sollte. Belegte Daten allein sind Rauschen. Belegte Daten, fest an eine bestimmte Straße in einer bestimmten Stadt gebunden, sind ein Belegungsplan für eine Wohnung – inklusive der Nächte, in denen niemand darin ist.

## Öffnen Sie Ihren eigenen Feed und lesen Sie ihn

Hören Sie auf zu raten, was in Ihrem Feed steht. Es ist eine reine Textdatei, und Sie lesen sie im Browser.

Export-URL in die Adresszeile, Enter. Zwei Dinge können passieren: Der Browser lädt eine `.ics`-Datei herunter, oder er zeigt eine Textwand, die mit `BEGIN:VCALENDAR` beginnt. Beim Download öffnen Sie die Datei mit einem beliebigen Texteditor – es ist Text, kein Binärformat. Editor, VS Code, was am nächsten liegt.

Vor Ihnen liegt eine Folge von `VEVENT`-Blöcken, einer pro belegtem Zeitraum. Einer sieht ungefähr so aus:

```
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260803
DTEND;VALUE=DATE:20260809
UID:1a2b3c4d5e6f@airbnb.com
SUMMARY:Reserved
DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMXXXXXXXX
END:VEVENT
```

Scrollen Sie jetzt die ganze Datei durch und beantworten Sie sich drei Fragen:

- **Steht irgendwo ein Name in `SUMMARY`?** Mal ist es ein nüchternes `Reserved` oder `Not available`. Mal der Vorname des Gastes, manchmal plus erster Buchstabe des Nachnamens.
- **Existiert der Block `DESCRIPTION` überhaupt, und was steht darin?** Airbnb hat Exporte ausgeliefert, in denen dieses Feld einen Buchungslink, einen Bestätigungscode und die letzten vier Ziffern der Gast-Telefonnummer enthielt. Ob das bei Ihnen so ist, hängt von Plattform, Objekttyp und Jahr ab – genau deshalb lesen Sie die Datei, statt einem Blogbeitrag darüber zu glauben.
- **Wie weit reicht er?** Die meisten Exporte decken rund zwölf Monate nach vorn ab. Manche nehmen auch Vergangenes mit – dann ist die Datei kein Zukunftsplan mehr, sondern eine Belegungshistorie.

Anderthalb Minuten. Machen Sie das für jeden Feed, den Sie je exportiert haben, auf jeder Plattform, bevor Sie weiterlesen.

## Was jede Plattform tatsächlich in die Datei schreibt

Das Folgende fand ich im Juli 2026 in meinen eigenen Exporten: zwei Wohnungen, drei Plattformen. Nehmen Sie es als Landkarte, nicht als Spezifikation – diese Felder haben sich schon geändert und werden es wieder tun.

| Plattform | Daten | Gastname | Telefon / Kontakt | Buchungsnummer |
| --- | --- | --- | --- | --- |
| Airbnb-Export | Ja | Manchmal, in `SUMMARY` | Letzte 4 Ziffern kamen in `DESCRIPTION` vor | Ja, als Link ins Hosting-Menü |
| Booking.com-Export | Ja | Nein – `CLOSED - Not available` | Nein | Nein |
| Vrbo-Export | Ja | Häufig, in `SUMMARY` | Nein | Ja |
| Eigener Zwischen-Feed | Ja | Nur wenn Sie es hineinschreiben | Nur wenn Sie es hineinschreiben | Nur wenn Sie es hineinschreiben |

Booking.com ist hier der Anständige: markiert Zeiträume als belegt und schweigt zum Rest. Deshalb kann ein importierter Booking-Feed gar keine Gastdaten nach Airbnb tragen, selbst wenn Sie es wollten. Prüfen müssen Sie Airbnb und Vrbo.

Diese Asymmetrie hat einen sehr praktischen Grund. Hosts denken an den Feed, den sie **importieren** – der füllt schließlich den Kalender. Das Risiko sitzt im Feed, den sie **exportieren**: einmal eingerichtet, irgendwo eingefügt, nie wieder geöffnet.

## Fünf Wege, auf denen die Feed-URL nach draußen gelangt

Jedes Leck, das ich gesehen oder selbst verursacht habe, fällt in eine dieser Kategorien.

**1. Öffentliches Debugging.** Mein Fall, und mit Abstand der häufigste. Die Synchronisation steht, Sie posten in einer Host-Gruppe, auf Reddit oder in ein GitHub-Issue – und die URL kommt mit hinein, denn wie soll Ihnen sonst jemand helfen. Der Thread überlebt Ihr Problem um Jahre, und Google indexiert ihn. Ist die Seite öffentlich und die Datei Text, wird später auch der **Inhalt** auffindbar, nicht nur der Link.

**2. Screenshots.** Sie fotografieren das Panel „Kalender synchronisieren" ab, um Reinigungskraft oder Co-Host zu zeigen, wo sie klicken müssen. Das Exportfeld ist im Bild, ausgeklappt, im Fokus. Gastnamen werden auf Screenshots ständig unkenntlich gemacht, URL-Felder so gut wie nie.

**3. Aufgegebene Tools.** Sie haben in zwei Jahren vier Channel-Manager getestet. In jeden wanderte die URL. Drei dieser Konten liegen brach, eine der Firmen wurde inzwischen übernommen – und alle halten weiterhin ein funktionierendes Token. Niemand löscht einen Testzugang, und ein gelöschtes Konto ist ohnehin kein widerrufenes Token. Widerrufen heißt hier: erneuern.

**4. Geteilte Kalender-Apps.** Den Feed in Google Kalender zu abonnieren, ist unkritisch. Diesen Google-Kalender auf „öffentlich verfügbar machen" zu stellen, ist es nicht – und das sind zwei Klicks im selben Einstellungsbereich. Der öffentliche Google-Kalender veröffentlicht Ihren Feed dann unter einer neuen URL, die Sie nie angelegt haben.

**5. Objektübergabe.** Der Co-Host geht, die Reinigungskraft wechselt, die Wohnung wird verkauft. Jede URL, die Sie herausgegeben haben, funktioniert weiter. Für eine Zeichenkette, die jemand irgendwann in sein eigenes Tool kopiert hat, gibt es in keiner Übergabe-Checkliste eine Zeile.

## So erneuern Sie die URL auf jeder Plattform

Erneuern ist das einzige Gegenmittel. Ein Widerruf für einen einzelnen Abonnenten existiert nirgendwo in diesem Ökosystem – das Token gilt ganz oder gar nicht, also trifft die Erneuerung jeden legitimen Empfänger im selben Moment wie den unerwünschten. Planen Sie das ein, bevor Sie klicken.

**Airbnb.** Kalender → Inserat wählen → Verfügbarkeit → **Kalender synchronisieren** → Ihren Export suchen und **URL zurücksetzen**. Die alte URL löst sofort nicht mehr auf. Bei allen Plattformen und Tools, die sie importieren, ist der Feed nun tot, und die meisten scheitern still, statt zu warnen. Rechnen Sie mit fünfzehn Minuten, um die neue URL überall einzutragen, und prüfen Sie am Folgetag bei jedem Empfänger den Zeitstempel des letzten Imports.

**Booking.com.** Extranet → Kalender & Preise → **Kalender synchronisieren**. Nicht jede Extranet-Version zeigt beim Export einen Zurücksetzen-Knopf. Fehlt er, liefert das Löschen und Neuanlegen des Exports ein neues Token; fehlt auch dieser Weg, erneuert der Partner-Support die URL auf Ticket – und dieses Ticket lohnt sich, statt achselzuckend weiterzumachen. Booking-Exporte tragen am wenigsten, aber dieselbe URL legt Ihre Belegung trotzdem vollständig offen.

**Vrbo.** Kalender → Einstellungen → Import/Export. Gleiches Muster: neu generieren, danach überall nachziehen.

Was immer Sie erneuern: Notieren Sie, wohin die neue URL gegangen ist. Hosts scheuen die Erneuerung nicht wegen des Klicks, sondern weil sie nicht wissen, welche vier Tools am Donnerstag still aufhören zu synchronisieren. Drei Zeilen an derselben Stelle, an der Ihre Inserats-IDs liegen, erledigen das dauerhaft.

Halten Sie nach jeder Erneuerung achtundvierzig Stunden lang die [Prüfungen gegen Doppelbuchungen](/blog/avoiding-double-bookings) parat. Ein toter Importslot sieht exakt aus wie ein funktionierender – bis zwei Gäste dieselbe Woche buchen: Airbnb zieht importierte Kalender alle 2 bis 4 Stunden, Booking.com alle 2 bis 6, und keiner der beiden meldet sich, wenn statt eines Kalenders ein 404 zurückkommt.

## Wann ein geleakter Feed ein meldepflichtiger Vorfall ist

Wenn bei Ihnen Gäste aus der EU oder Großbritannien übernachten, ist das keine Ordnungsfrage mehr, sondern eine rechtliche mit Frist.

Art. 4 Abs. 12 DSGVO fasst unter „Verletzung des Schutzes personenbezogener Daten" auch die unbefugte *Offenlegung* von Daten und den unbefugten *Zugang* dazu – nicht nur Diebstahl, nicht nur Hack. Eine Feed-URL in einem offenen Thread ist eine Offenlegung. Die Anschlussfrage lautet, ob es sich um personenbezogene Daten handelt, und die Antwort hängt vollständig davon ab, was Sie beim Öffnen der Datei gefunden haben.

- **Nur Daten, keine Namen** (typischer Booking.com-Export): die Belegung eines identifizierbaren Objekts. Für sich genommen schwach, in Kombination mit der öffentlichen Inseratsadresse aber eher ein personenbezogenes Datum über Sie als über Ihre Gäste. Dokumentieren, erneuern, weitermachen.
- **Vornamen von Gästen oder Namen plus Buchungscode**: klar personenbezogen. Art. 33 DSGVO startet ab Kenntnisnahme eine 72-Stunden-Frist zur Meldung an die Aufsichtsbehörde, sofern die Panne nicht voraussichtlich ohne Risiko für die Rechte und Freiheiten der Betroffenen bleibt.
- **Namen plus Kontaktfragmente plus exakte Aufenthaltsdaten**: Diese Kombination kippt die Risikobewertung, weil sie einem Fremden verrät, wer an welchen Nächten unter welcher Adresse wohnt.

Zwei praktische Anmerkungen. Art. 33 Abs. 5 DSGVO verlangt, jede Panne und Ihre Begründung zu dokumentieren – auch die, die Sie bewusst nicht melden. Ein datierter Absatz reicht, entscheidend ist, dass er existiert, bevor jemand fragt. Und Verantwortlicher sind hier Sie, nicht Airbnb: Die Plattform hat eine Exportfunktion bereitgestellt, wohin die URL wandert, haben Sie entschieden. [Die DSGVO-Grundlagen für Vermieter](/blog/gdpr-for-vacation-rental-hosts) behandeln Rechtsgrundlage und Speicherfristen, auf denen das hier aufsetzt.

## Exportieren sollten Sie den Feed, den Sie kontrollieren

Die strukturelle Lösung: hören Sie ganz auf, plattformgenerierte Token herauszugeben.

Setzen Sie eine Schicht dazwischen, die Ihnen gehört. Beide Plattformen importieren aus Ihrem Feed, und nach draußen – in ein Tool, auf einen Screenshot, in ein Forum – geht nur noch diese eine URL. Die Erneuerung wird zu einer Handlung statt zu vieren, deshalb führen Sie sie auch tatsächlich durch. In der Datei stehen exakt die Felder, die Sie ausliefern wollen: Für den Belegungsabgleich genügen `DTSTART`, `DTEND`, `UID` und ein `SUMMARY` mit dem Wert `Busy` – nichts, was aus einem Kalender ein Dossier macht. Und wenn der Co-Host geht, wechseln Sie eine Zeichenkette.

Zu einem guten Teil deshalb ist [RentTools](/onboard) so gebaut, wie es gebaut ist: Es zieht Quell-Feeds alle 10 Minuten, gibt pro Objekt einen minimalen ausgehenden Feed aus und erneuert dessen URL auf Zuruf, ohne die Einstellungen von Airbnb oder Booking.com anzufassen. Auf einem Droplet für 4 $ selbst hosten oder die gehostete Instanz nehmen – so oder so ist das Token, das Sie in fremde Software kopieren, eines, das Sie selbst abschalten können.

Die eingehende Seite repariert das nicht. Airbnbs Export-URL existiert, ob Sie sie nutzen oder nicht, und wenn Sie je eine erzeugt haben, ist sie in diesem Moment aktiv. Erneuern Sie diese heute und entscheiden Sie morgen, was Sie künftig exportieren.

## FAQ

**Ist mein Airbnb-iCal-Link privat?**
Er ist unveröffentlicht, aber nicht privat. Kein Passwort, keine Anmeldeprüfung: Wer die URL hat, bekommt die Datei. Airbnb erzeugt ein langes Zufallstoken, damit niemand es errät, doch dieser Schutz endet in der Sekunde, in der die URL an einer öffentlichen Stelle steht. Behandeln Sie sie wie ein Passwort, dessen Login-Historie Sie nie zu sehen bekommen.

**Kann jemand über meinen Kalenderlink die Namen meiner Gäste sehen?**
Möglicherweise, und die verbindliche Antwort steht nur in Ihrer eigenen Datei. Der Export von Booking.com markiert Termine als belegt und gibt überhaupt keine Gastdaten preis. In Exporten von Airbnb und Vrbo tauchte der Vorname des Gastes im Terminfeld auf, und Airbnb hat Exporte ausgeliefert, deren Beschreibungsfeld einen Buchungslink und die letzten vier Ziffern einer Telefonnummer enthielt. Öffnen Sie die Datei im Texteditor, statt zu vermuten.

**Wie setze ich meine Airbnb-Export-URL zurück?**
Kalender öffnen, Inserat wählen, Verfügbarkeit aufrufen, dann Kalender synchronisieren. Den Export-Eintrag suchen und URL zurücksetzen wählen. Der alte Link stirbt sofort und ohne Übergangsfrist, halten Sie die Liste der Empfänger also bereit und aktualisieren Sie sie in derselben Sitzung.

**Bricht das Zurücksetzen meine synchronisierten Kalender?**
Ja, alle auf einmal, und meist lautlos. Die importierende Plattform zeigt den Feed weiter als verbunden an und holt dabei still nichts mehr. Tragen Sie nach der Erneuerung die neue URL bei jedem Empfänger ein und prüfen Sie am Folgetag jeden Zeitstempel des letzten Imports, statt dem grünen Status zu vertrauen.

**Ist eine geleakte iCal-URL eine meldepflichtige Datenpanne?**
Das hängt vom Inhalt der Datei ab. Ein Feed ohne Gastdaten, nur mit Terminen, ist ein schwacher Fall und bleibt meist eine interne Notiz. Ein Feed mit Gastnamen oder mit Namen, Buchungscodes und exakten Aufenthaltsdaten ist eine Verletzung des Schutzes personenbezogener Daten, und Art. 33 DSGVO gibt Ihnen ab Kenntnisnahme 72 Stunden zur Meldung an die Aufsichtsbehörde, sofern Sie kein fehlendes Risiko begründen können. Halten Sie in jedem Fall fest, was passiert ist und wie Sie entschieden haben: Dokumentiert werden muss jede Panne, auch die nicht gemeldete.

**Kann Google meinen iCal-Feed indexieren?**
Der Feed selbst wird selten gecrawlt, weil nichts auf ihn verlinkt. Der Forenbeitrag, in den Sie die URL kopiert haben, wird es mit Sicherheit – und genau dort sitzt die Lücke. Sobald die Seite im Index steht, ist der Link über die Suche auffindbar, und ein Textkalender dahinter landet in Caches, die Sie nicht mehr leeren können.

**Wie oft sollte ich die Export-URL wechseln?**
Nicht nach Zeitplan, sondern nach Ereignissen. Wechseln Sie, wenn ein Co-Host oder eine Reinigungskraft nicht mehr für Sie arbeitet, wenn Sie einen Channel-Manager oder ein Buchungstool abbestellen, wenn Sie die URL irgendwo für Support veröffentlicht haben und wenn ein Objekt übergeben oder verkauft wird. Ein Wechsel nach Kalender erzeugt nur kaputte Synchronisationen im Takt, ohne einem echten Risiko zu entsprechen.

**Und der Feed, den mein Channel-Manager ausgibt?**
Gleiche Regeln, gleiche Fehlerbilder, plus eine Zugabe: Der ausgehende Feed eines Channel-Managers bündelt oft mehrere Objekte, sodass eine einzige geleakte URL Ihr gesamtes Portfolio offenlegt statt einer Wohnung. Prüfen Sie, ob das Tool Ihnen erlaubt, diese URL selbst neu zu erzeugen. Wenn dafür ein Support-Ticket nötig ist, wissen Sie das besser vorher als freitags um 23:00 Uhr.

## Eine pointierte Meinung

Gehen Sie davon aus, dass jede Export-URL, die Sie je erzeugt haben, bereits kompromittiert ist – beweisen können Sie das Gegenteil nicht, und die Plattformen geben Ihnen keinerlei Möglichkeit zur Prüfung. Erneuern Sie diese Woche alle, und richten Sie Ihr Setup danach so ein, dass nur noch eine Feed-URL Ihre Hand verlässt: die, die Sie in zehn Sekunden selbst neu erzeugen.

Und wenn die Synchronisation streikt und Sie Hilfe brauchen: Kopieren Sie nie die URL. Kopieren Sie die ersten zwanzig Zeilen der Datei, mit herausgeschnittenen Tokens und `UID`s. Jeder, der Ihr Problem lösen kann, schafft das anhand der Datei. Wer die lebende URL braucht, debuggt etwas anderes.
