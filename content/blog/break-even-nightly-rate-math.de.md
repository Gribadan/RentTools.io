---
slug: break-even-nightly-rate-math
locale: de
title: "Break-even-Übernachtungspreis: ab wann eine Buchung Verlust macht"
excerpt: Die Mathematik des Übernachtungspreises, unter dem eine Ferienwohnungs-Buchung Verlust macht — Kosten pro Aufenthalt vs. pro Nacht, die Break-even-Formel und drei Tiefpreis-Anfragen bewertet.
status: published
tags:
  - pricing:Preisgestaltung
  - host-tips:Host-Tipps
  - tools:Tools
ogImageUrl: /blog-covers/break-even-nightly-rate-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Ich habe einmal eine Same-Day-Buchung für eine einzige Nacht zu 39 $ angenommen, weil der Kalender leer war und „39 $ sind besser als nichts". Waren sie nicht. Die Reinigungskraft kostete mich 45 $, bevor der Gast überhaupt die Tür aufgeschlossen hatte; die Nacht ließ Heizung, Warmwasser und eine Ladung Wäsche laufen, und Airbnb zog seinen Anteil oben ab. Übrig blieben rund 33 $, ausgegeben habe ich fast 60 $. Ich hatte einem Fremden faktisch 25 $ dafür gezahlt, dass er in meiner Wohnung schläft — und kam mir dabei clever vor. Die leere Nacht, vor der ich solche Angst hatte, hätte 0 $ gekostet.

Um diese Falle geht es hier. Eine leere Nacht ist ein versunkener Kostenposten — sie ist bezahlt, ob jemand auftaucht oder nicht. Eine Buchung *unter dem Boden* ist schlimmer als leer: ein aktiver Verlust, für den Sie sich freiwillig entscheiden. Die Grenze dazwischen ist Ihr Break-even-Übernachtungspreis, und fast kein Gastgeber hat den seinen je ausgerechnet.

## TL;DR

- Eine leere Nacht ist versunkener Aufwand; eine Buchung unter dem Boden ist Verlust.
- Boden = (Kosten pro Aufenthalt ÷ Nächte + Kosten pro Nacht) ÷ (1 − Provision).
- Eine-Nacht-Buchungen tragen die volle Reinigung, ihr Boden ist am höchsten.
- Ein Eine-Nacht-Boden nahe 80 $ fällt unter 25 $, sobald ein Aufenthalt eine Woche läuft.
- Heizung im Winter und 15% Host-only-Gebühr heben den Boden, sie senken ihn nicht.
- Unter dem Boden zahlen Sie an den Gast — legen Sie einen Mindestpreis fest.

## Was „Break-even" für eine Nacht wirklich heißt

Hypothek, Versicherung, Grundsteuer, Internet — das sind Fixkosten. Sie zahlen sie, ob voll belegt oder den ganzen Monat dunkel. Wenn Sie also entscheiden, ob Sie eine bestimmte Buchung annehmen, ignorieren Sie sie vollständig. Sie sind kein Kostenposten *dieser Buchung*; sie sind ein Kostenposten *des Besitzes der Wohnung*, und sie sind längst ausgegeben.

Was eine Buchung tatsächlich kostet, ist nur das Geld, das aus Ihrer Tasche geht, *weil ein Gast in der Wohnung ist — Geld, das Sie nicht ausgegeben hätten, wäre die Nacht leer geblieben*. Das sind die variablen Kosten, und nur sie entscheiden, ob ein Preis Gewinn bringt oder Verlust.

Deshalb ist „39 $ sind besser als eine leere Nacht" der falsche Rahmen. Die leere Nacht kostet nichts extra. Die 39 $-Buchung kostet mich Reinigungskraft, Nebenkosten, Verbrauchsgüter und einen Provisionsanteil. Die richtige Frage lautet nie „ist das besser als leer?", sondern **„deckt dieser Preis, was genau diese Buchung mich an Betreuung kostet?"**. Wenn ja, ist jeder Dollar darüber echte Marge auf einer Nacht, die sonst null verdient hätte. Wenn nein, subventionieren Sie den Urlaub eines Fremden.

## Die drei Kostentöpfe

Variable Kosten sind keine einzelne Zahl — sie kommen in drei Formen, und sie zu verwechseln ist der Grund, warum die 39 $-Buchung gut aussieht, bis die Rechnung der Reinigungskraft eintrifft. Trennen Sie sauber:

**Kosten pro Aufenthalt** — einmal pro Buchung fällig, egal wie lang. Die Reinigungskraft (40–80 $ pro Wechsel je nach Größe), Wäsche für Bettzeug und Handtücher (6–12 $), das Auffüllen der Verbrauchsgüter beim Wechsel (Willkommens-Kaffee, frische Toilettenartikel, eine Rolle Müllbeutel — sagen wir 5–10 $). Ein Gast für eine Nacht und einer für sieben kosten Sie hier fast dasselbe. Genau deshalb sind Kurzaufenthalte teuer in der Betreuung.

**Kosten pro Nacht** — für jede Nacht fällig, die der Gast da ist. Strom, Wasser, Gas/Heizung, der Tagesanteil der Verbrauchsgüter (Kaffeekapseln, Toilettenpapier, Spülmittel, Waschpulver). In einem milden Monat sind das vielleicht 10–14 $ pro Nacht für eine 2-Zimmer-Wohnung; im tiefen Winter, mit laufender Heizung, steigt es auf über 20 $.

**Prozentuale Kosten** — ein Anteil oben von dem, was Sie verlangen. Airbnbs Host-only-Gebühr liegt bei rund 15%, die geteilte Gebühr näher an 3% für den Gastgeber; Booking.com nimmt ~15% Provision; Vrbo landet nahe 8% plus Zahlungsabwicklung. Bei einer Direktbuchung ist es nur die Kartengebühr, rund 2,9% + 0,30 $. Diese Zahl wächst mit Ihrem Preis, also addiert sie nicht nur zum Boden — sie multipliziert ihn.

Damit das Modell ehrlich bleibt, rechne ich hier mit **All-in-Preisen** — der Übernachtungspreis deckt alles, keine separate Reinigungsgebühr obendrauf. So wollen es die Plattformen ohnehin zunehmend angezeigt sehen, und der Boden wird zu einer einzigen sauberen Zahl. (Wenn Sie noch eine separate Reinigungsgebühr führen — die Abwägungen dazu sind ein eigener Beitrag: [Reinigungsgebühr vs. All-in-Preis](/blog/airbnb-cleaning-fee-vs-all-in-pricing).)

Legen Sie die drei Töpfe zusammen, sieht der Break-even-Preis für einen Aufenthalt von **N** Nächten so aus:

```
Break-even-Übernachtungspreis = (Kosten pro Aufenthalt / N + Kosten pro Nacht) / (1 − Provision)
```

Das `(1 − Provision)` im Nenner ist der Teil, den Gastgeber vergessen. Kostet eine Nacht Sie 25 $ und die Plattform nimmt 15%, verlangen Sie nicht 25 $ — Sie verlangen 25 $ / 0,85 = 29,41 $, denn 4,41 $ dieses Preises erreichen Sie nie. Verlangen Sie genau 25 $, haben Sie den Wechsel gratis gemacht.

## Die Break-even-Tabelle nach Aufenthaltslänge

Setzen Sie eine echte 2-Zimmer-Stadtwohnung ein: Kosten pro Aufenthalt 55 $ (Reinigung 45 $ + Wäsche 10 $), Kosten pro Nacht 13 $, Provision 15%. Sehen Sie, was die Aufenthaltslänge mit dem Boden macht.

| Aufenthaltslänge | Kosten pro Aufenthalt ÷ Nächte | + pro Nacht | Vor Provision | Break-even-Preis |
|---|---|---|---|---|
| 1 Nacht | 55,00 $ | 13 $ | 68,00 $ | **80 $** |
| 2 Nächte | 27,50 $ | 13 $ | 40,50 $ | **48 $** |
| 3 Nächte | 18,33 $ | 13 $ | 31,33 $ | **37 $** |
| 5 Nächte | 11,00 $ | 13 $ | 24,00 $ | **28 $** |
| 7 Nächte | 7,86 $ | 13 $ | 20,86 $ | **25 $** |

Der Eine-Nacht-Boden ist 80 $; der Sieben-Nächte-Boden 25 $. Dieselbe Wohnung, dieselben Kosten — das Einzige, was sich bewegte, ist, wie viele Nächte sich diese eine 55 $-Reinigungsrechnung teilen. Ein Eine-Nacht-Gast zahlt die ganze Reinigung auf einen Schlag; ein Wochengast verteilt sie auf sieben Nächte, bis sie fast verschwindet.

Das ist die Mathematik hinter jedem Langzeit-Rabatt, den Sie je gesehen haben. Ein Gastgeber mit 20% für eine Woche ist nicht großzügig — sein Boden für sieben Nächte ist ein Drittel seines Eine-Nacht-Bodens, also hat er enormen Spielraum zum Rabattieren und bleibt trotzdem in der Marge. (Die Kehrseite — wie tief der Rabatt gehen darf — ist [die Mathematik der Langzeit-Rabatte](/blog/length-of-stay-discount-math).) Deshalb ist eine 50 $-Buchung für eine Nacht ein Verlust, eine 50 $-Buchung für sieben Nächte aber gesunde 25 $ Marge pro Nacht. Der Preis allein sagt nichts; der Preis *neben der Aufenthaltslänge* sagt alles.

## Drei Tiefpreis-Anfragen, durchgerechnet

Der Boden verdient sich, wenn eine billige Anfrage eintrifft und Sie dreißig Sekunden zum Entscheiden haben. Hier drei, gegen die Tabelle oben.

| Anfrage | Gebotener Preis | Boden für diese Länge | Urteil | Marge / Verlust |
|---|---|---|---|---|
| Same-Day, 1 Nacht | 55 $ | 80 $ | **Ablehnen** | −21 $ in der Nacht |
| Morgen, 4 Nächte | 50 $ | 31 $ | **Annehmen** | +63 $ über den Aufenthalt |
| Lücke am Wochenende, 2 Nächte | 38 $ | 48 $ | **Ablehnen** | −16 $ über den Aufenthalt |

Die Same-Day-Einzelnacht zu 55 $ *fühlt* sich an wie gefundenes Geld an einem leeren Dienstag. Ist es nicht: Sie behalten 46,75 $ nach Provision und geben 68 $ für die Betreuung aus, ein Verlust von 21 $ für das Vergnügen eines Wechsels. Die vier Nächte zu 50 $ sehen pro Nacht niedriger aus, sind aber der einzige Gewinner — die Reinigungsrechnung verteilt sich dünn, und jede Nacht bringt 15,75 $ über dem Boden, 63 $ echte Marge. Die zwei Wochenend-Nächte zu 38 $ sind die verführerische: 38 $ klingt vernünftig, und Wochenenden fühlen sich wertvoll an; rechnen Sie gegen den 48 $-Boden für zwei Nächte, und Sie liegen 16 $ im Minus.

Achten Sie auf das Muster: Die Entscheidung folgt nie dem, wie groß der Preis *klingt*. 55 $ sind eine Ablehnung, 50 $ eine Annahme, weil das eine eine einzelne Nacht mit voller Reinigungsrechnung ist und das andere sie auf vier verteilt. Bewerten Sie den Preis gegen den Boden für *diese Länge*, sonst halten Sie weiter teure Verluste für Gewinne.

## Der Boden bewegt sich — gegen Ihre Instinkte

Zwei Kräfte verschieben den Boden, und beide tun es genau in dem Moment, in dem Sie am stärksten zum Rabatt neigen.

**Provision.** Lassen Sie dieselbe 2-Zimmer-Wohnung über Airbnbs Host-only-Gebühr (≈15%) laufen, ist Ihr Eine-Nacht-Boden 80 $. Wechseln Sie zur geteilten Gebühr (≈3% für Sie), fällt der Boden auf etwa 70 $; nehmen Sie eine Direktbuchung mit nur einer Kartengebühr, sind es nahe 68 $. Die Plattform setzt Ihren Boden still um 10 $+ höher, als die nackten Kosten nahelegen — ein weiterer Grund, warum eine Direktbuchung zum *gleichen* angezeigten Preis Ihnen mehr wert ist als eine über Airbnb. ([Host-only vs. geteilte Gebühr](/blog/airbnb-host-only-fee-vs-split-fee-math) hat die volle Aufschlüsselung.)

**Saison.** Im Januar läuft die Heizung den ganzen Tag, und Ihre Kosten pro Nacht springen von 13 $ auf 22 $. Das hebt den Eine-Nacht-Boden von 80 $ auf etwa 91 $ und den Drei-Nächte-Boden von 37 $ auf 47 $. Der Winter ist genau die Zeit, in der die Belegung einbricht und der Drang zum Rabatt am stärksten ist — und es ist die Saison, in der Ihr Boden am *höchsten* steht, weil jede Nacht jetzt mehr Gas verbrennt. Gastgeber senken ihre Winterpreise immer wieder unter ihren eigenen Kaltwetter-Boden und schließen, „der Winter rechnet sich einfach nicht". Der Winter ist in Ordnung — sie haben ihn mit Verlustbuchungen gefüllt.

In beiden Fällen lügt der Instinkt. Geringe Nachfrage will, dass Sie den Preis senken; steigende Kosten drücken zugleich den Boden hoch. Rabattieren Sie da hinein, ohne die Zahl neu zu rechnen, und Sie buchen einen vollen Kalender voller Nächte, die je ein paar Dollar verlieren, und wundern sich dann, warum ein voller Monat schlechter zahlte als ein ruhiger.

## Wann man bewusst unter den Boden geht

Der Boden ist eine Voreinstellung, kein Gesetz. Es gibt echte Gründe, darunterzugehen — aber das sind bewusste Investitionen, keine „39 $ sind besser als nichts"-Reflexe.

- **Ein brandneues Inserat ohne Bewertungen.** Ihre ersten fünf Bewertungen sind mehr wert als die Marge auf fünf Buchungen. Unter dem Boden zu preisen, um Bewertungsvolumen zu kaufen, ist eine legitime Starttaktik — mit Enddatum, nach dem Sie auf Gewinn preisen.
- **Ein Lückenfüller, der eine größere Buchung freischaltet.** Eine einzelne Waisennacht zwischen zwei Reservierungen verdient nichts und ist schwer zu verkaufen; sie leicht unter dem Boden zu nehmen, um eine tote Nacht zu vermeiden, kann aufgehen — besonders wenn es Ihnen erlaubt, anderswo eine Mindestnächte-Regel anzuheben. (Der Waisennacht-Fall hat seine eigene Logik: [Mathematik von Waisennächten und Lücken](/blog/orphan-night-gap-night-math).)
- **Ein Langaufenthalt, der einen schwachen Monat hält.** Eine 21-Nächte-Buchung knapp unter Ihrem Kurzaufenthalts-Boden bringt trotzdem eine fette Marge, weil die Kosten pro Aufenthalt sich über drei Wochen auflösen — und sie erspart Ihnen 21 Nächte Marketing, Nachrichten und Wechsel.

Was alle drei teilen: Sie kennen die Zahl, die Sie annehmen, Sie wissen warum, und Sie haben entschieden, dass der Tausch sich lohnt. Das ist das Gegenteil des Same-Day-Reflexes, bei dem Sie einen Verlust annehmen, weil Sie nie gerechnet haben und „leer" Ihnen mehr Angst machte als „minus".

## Den Boden in die Preise einbauen

Den eigenen Boden zu kennen, nützt nichts, wenn die Entscheidung um 23 Uhr fällt, eine Same-Day-Anfrage pingt und Sie müde sind. Die Lösung: den Boden zur Einstellung machen, nicht zur Entscheidung im Moment.

Jede Plattform hat ein Feld für den Mindestpreis. Setzen Sie ihn auf Ihren *Eine-Nacht*-Boden — den höchsten — und der Kalender weigert sich schlicht, eine Nacht darunter zu verkaufen. Legen Sie Langzeit-Rabatte darüber, damit längere Aufenthalte legitim zu ihren niedrigeren Böden hin preisen können, ohne dass Sie etwas anfassen. Das Ergebnis: Das System sagt automatisch Nein zur verlustreichen 39 $-Einzelnacht und Ja zu den profitablen vier Nächten zu 50 $ — ohne 23-Uhr-Mathematik von Ihnen.

Knifflig wird es, weil Ihr Boden keine einzelne Zahl ist — er ist pro Saison und pro Plattform, und die Kosten pro Nacht ändern sich tatsächlich zwischen Juli und Januar. Das von Hand über Airbnb, Booking.com und Vrbo zu führen, ist genau die plattformübergreifende Buchhaltung, die in der Woche veraltet, in der Sie aufhören hinzuschauen. Die Kosten und Preise jedes Inserats an einem Ort zusammenzuführen, damit der Boden stets aktuell ist, ist genau das, wofür [RentTools](/onboard) gebaut ist — kostenlos und über alle Plattformen zugleich.

## FAQ

**Was ist ein Break-even-Übernachtungspreis bei Ferienwohnungen?**
Es ist der niedrigste Preis, bei dem eine Buchung das Geld deckt, das Sie tatsächlich für ihre Betreuung ausgeben — Reinigung, Wäsche, Nebenkosten, Verbrauchsgüter und die Plattform-Provision — ohne Überschuss und ohne Verlust. Darunter kostet die Buchung mehr, als sie einbringt. Darüber ist jeder zusätzliche Dollar Marge auf einer Nacht, die sonst null verdient hätte. Es ist nicht der Preis, der Ihre Hypothek deckt; Fixkosten wie die Hypothek werden gezahlt, ob gebucht oder leer, und gehören daher nicht in eine Einzelbuchungs-Entscheidung.

**Warum ist der Boden für Eine-Nacht-Aufenthalte so viel höher?**
Weil die Rechnung für Reinigung und Wäsche dieselbe ist, ob ein Gast eine Nacht oder sieben bleibt, und ein Eine-Nacht-Gast sie ganz in einer einzigen Nacht zahlt. Verteilen Sie einen 55 $-Wechsel auf eine Nacht, addiert er 55 $ zu ihr; auf sieben verteilt, unter 8 $. Wegen dieser einen Tatsache brauchen Eine-Nacht-Aufenthalte einen viel höheren Preis, um break-even zu erreichen, und deshalb preisen die meisten Gastgeber sie hoch oder setzen ein Minimum von zwei Nächten.

**Sollte ich je eine Buchung unter meinem Break-even-Preis annehmen?**
Nur als bewusste Investition, nie als Reflex. Legitime Gründe: ein brandneues Inserat, das seine ersten Bewertungen kauft, eine Waisennacht, die sonst tot bliebe, oder ein Langaufenthalt, der einen schwachen Monat hält und seine Kosten dünn verteilt. In jedem Fall kennen Sie die Zahl, Sie wissen warum Sie annehmen, und Sie haben ein Enddatum oder eine Bedingung gesetzt. Einen Verlust nur deshalb anzunehmen, weil die Nacht leer war und „etwas besser als nichts" ist, ist genau der Fehler, gegen den der Boden existiert.

**Deckt meine Reinigungsgebühr die Reinigungskosten?**
Teilweise, und weniger, als Sie denken. Die Plattform nimmt auch auf die Reinigungsgebühr Provision, also lässt eine 50 $-Gebühr auf einem Host-only-Inserat mit 15% Ihnen rund 42,50 $ gegenüber einer Reinigungskraft, die 45 $ kosten kann — Sie sind schon vor den Nebenkosten unter Wasser. Dieses Leck ist ein Grund, warum dieser Beitrag stattdessen mit All-in-Preisen rechnet, bei denen der Übernachtungspreis die vollen Kosten trägt und der Boden eine einzige ehrliche Zahl ist statt einer Gebühr, die sich still nicht selbst deckt.

**Wie verändert die Provision meinen Break-even-Boden?**
Sie teilt Ihre nackten Kosten durch `(1 − Provision)`, also bedeutet höhere Provision einen höheren Boden. Eine Nacht, die Sie 25 $ kostet, braucht einen Preis von 25 $ bei 0% Provision, 25,77 $ bei 3% (Airbnbs geteilte Gebühr) und 29,41 $ bei 15% (Host-only oder Booking.com). Die Plattform kann Ihren Boden um 4–5 $ pro Nacht verschieben, bevor Sie einen Cent mehr ausgegeben haben — weshalb derselbe angezeigte Preis Ihnen bei einer Direktbuchung mehr wert ist als auf einem Kanal mit hoher Provision.

**Ist mein Break-even-Preis im Winter höher?**
Meist ja, und das ist die saisonale Falle, in die die meisten Gastgeber tappen. Die Heizung treibt Ihre Kosten pro Nacht hoch — oft von rund 13 $ auf 22 $ für eine 2-Zimmer-Wohnung —, was den Boden um etwa 10 $ pro Nacht über jede Aufenthaltslänge hebt. Der Winter ist auch die Zeit, in der die Nachfrage fällt und der Drang zum Rabatt am stärksten ist, also senken Gastgeber die Preise unter einen gerade gestiegenen Boden, füllen den Kalender mit kleinen Verlusten und entscheiden, der Winter rechne sich nicht. Rechnen Sie den Boden jede Saison neu; tragen Sie Ihre Sommerzahl nicht in den Januar.

**Wie höre ich auf, automatisch verlustreiche Buchungen anzunehmen?**
Setzen Sie das Mindestpreis-Feld Ihrer Plattform auf Ihren Eine-Nacht-Boden — den höchsten von allen — damit der Kalender physisch keine Nacht darunter verkaufen kann. Fügen Sie dann Langzeit-Rabatte hinzu, damit längere Buchungen von selbst zu ihren niedrigeren Böden hin preisen. Diese Kombination lehnt die Verlustbringer ab und nimmt die Gewinner an, ohne dass Sie im Moment der Anfrage rechnen — genau dem Moment, in dem Sie am schlechtesten dafür gerüstet sind.

## Eine pointierte Meinung

Die meisten Gastgeber denken, ihr Preisproblem sei, dass ihre Preise zu niedrig sind. Meist ist es das nicht. Das Problem ist, dass sie nie die zwei Arten von leer getrennt haben: die Nacht, die niemand bucht und die nichts kostet, und die Nacht, die sie unter ihrem Boden füllen und die echtes Geld kostet, das sie danach nicht sehen, weil „immerhin war's gebucht". Das Zweite versteckt sich in einem vollen Kalender und einer ansehnlichen Belegung — und deshalb verdienen reichlich zu 85% belegte Inserate weniger als zu 65% belegte von jemandem, der seinen Boden kennt. Rechnen Sie die Zahl, setzen Sie sie als Minimum, und lassen Sie die leeren Nächte leer — sie waren von Anfang an die günstigere Wahl.
