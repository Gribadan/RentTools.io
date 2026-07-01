---
slug: airbnb-rating-recovery-math
locale: de
title: "Airbnb-Bewertung retten: wie viele Fünf-Sterne eine schlechte tilgen"
excerpt: Eine schlechte Bewertung drückt Ihre Airbnb-Note in Sekunden — der Weg zurück ist feste Mathematik: wie viele makellose Fünf-Sterne eine tilgen, je nach Inseratsgröße.
status: published
tags:
  - airbnb:Airbnb
  - host-tips:Tipps für Gastgeber
  - guest-comms:Gästekommunikation
ogImageUrl: /blog-covers/airbnb-rating-recovery-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Im März hat mir ein Gast einen Stern gegeben. Das Inserat stand bei 4,90 über 20 Aufenthalte — ein langweiliges, sauberes 1-Zimmer-Apartment, das außer bei einem kaputten Wasserkocher nie unter fünf Sterne gefallen war. Eine Bewertung, eine Nacht, ein Gast, der sich darüber ärgerte, dass das Haus keinen Aufzug hat — und am nächsten Morgen stand auf der Inseratsseite 4,71. Danach tat ich, was jeder Gastgeber tut: Ich öffnete eine Tabelle und fragte mich, wie viele makellose Aufenthalte es braucht, um wieder auf 4,90 zu kommen. Die Antwort war nicht die, die ich erwartet hatte — und sie ist dieselbe, ob Sie 20 Bewertungen haben oder 2000.

Dieser Beitrag ist genau diese Tabelle. Die exakte Rechnung, wie tief eine schlechte Bewertung Sie zieht, wie viele makellose Aufenthalte der Weg zurück kostet und warum sich die am höchsten bewerteten Inserate am langsamsten erholen.

## TL;DR

- Eine Bewertung verschiebt den Durchschnitt um `(P − k) / (N + 1)` — der Einbruch schrumpft, je größer die Bewertungszahl `N`.
- Die Superhost-Linie 4,80 ist nur bei **kleinen Inseraten** gefährdet. Ab ~50 Bewertungen kann ein Stern sie nicht mehr reißen.
- Den **früheren** Durchschnitt zurückzuholen ist fix: `(P − k) / (5 − P)` Fünf-Sterne-Aufenthalte — unabhängig von `N`.
- Bei 4,90 kostet ein 1-Stern **39 makellose Aufenthalte**. Bei 4,95 sind es **79**. Höhere Note, langsamere Erholung.
- Bei ~5 Bewertungen im Monat sind 39 saubere Aufenthalte **rund acht Monate** ununterbrochener Fünf-Sterne.
- Eine bewilligte Löschung tilgt die ganze Schuld in fünf Minuten. Erst Löschung anstreben, dann erholen.

## Die eine Formel, die zählt

Die Airbnb-Gesamtnote ist ein schlichter arithmetischer Durchschnitt: alle Gesamtbewertungen der Gäste addieren, durch die Anzahl teilen. Das ist alles. Keine Abwertung über Zeit, keine Gewichtung nach Aktualität, kein Geheimrezept. Damit ist das Ganze mit Mathematik aus der sechsten Klasse vorhersehbar.

Nehmen wir an, Ihr Inserat steht bei einem Durchschnitt `P` über `N` Bewertungen. Eine neue Bewertung mit `k` Sternen landet. Ihr neuer Durchschnitt ist:

```
neuer Durchschnitt = (P × N + k) / (N + 1)
```

Daraus folgen sofort zwei Dinge. Erstens: Eine schlechte Bewertung schmerzt proportional dazu, wie weit sie unter Ihrem Durchschnitt liegt — ein 1-Stern auf einem 4,90-Inserat ist ein Schock von 3,90 Punkten, ein 4-Stern nur von 0,90. Zweitens: Der Schaden wird durch Ihre Bewertungszahl plus eins geteilt. Ein Inserat mit 20 Bewertungen spürt denselben 1-Stern neunzehnmal härter als eines mit 400.

Jetzt die Erholungsfrage. Sie haben einen `k`-Sterne-Treffer kassiert und wollen zurück auf Ihr ursprüngliches `P`. Wie viele Fünf-Sterne-Aufenthalte kostet das? Setzen Sie den Durchschnitt wieder auf `P` und lösen Sie auf:

```
Fünf-Sterne, um P wiederherzustellen  =  (P − k) / (5 − P)
```

Das `N` kürzt sich weg. **Wie viele makellose Aufenthalte es braucht, um eine schlechte Bewertung zu tilgen, hängt nicht davon ab, wie viele Bewertungen Sie haben.** Ein Inserat mit 20 und eines mit 2000 Bewertungen brauchen beim gleichen 4,90 exakt gleich viele saubere Aufenthalte, um dieselbe Bewertung zu tilgen. Das große Inserat zuckt am Tag des Einbruchs kaum — und braucht genauso lange, um vollständig zu heilen.

Die Intuition: Jeder Fünf-Sterne kauft Ihnen nur `(5 − P)` an Spielraum — auf einem 4,90-Inserat ist ein einziger makelloser Aufenthalt gerade 0,10 über Ihrer Linie wert. Die schlechte Bewertung hat Sie um `(P − k)` in ein Loch gestoßen. Eine feste Schuld mit festen Raten zu tilgen, braucht eine feste Anzahl Raten — egal, wie groß Ihr Saldo schon ist.

## Drei Inserate, ein 1-Stern

Hier landet derselbe 1-Stern auf drei Inseraten, alle vor dem Treffer bei 4,90. Der einzige Unterschied ist, wie viele Bewertungen jedes angespart hatte.

| Bewertungen vor dem 1-Stern | Neuer Durchschnitt | Einbruch | Superhost-Linie 4,80 |
| --- | --- | --- | --- |
| 20 | 4,71 | −0,19 | Verloren |
| 50 | 4,82 | −0,08 | Sicher |
| 100 | 4,86 | −0,04 | Sicher |
| 200 | 4,88 | −0,02 | Sicher |

Das 20-Bewertungen-Inserat fällt unter die Superhost-Schwelle und verliert das Abzeichen bei der nächsten Quartalsneuberechnung. Die Inserate mit 50, 100 und 200 nicht — sie tragen genug Fünf-Sterne-Ballast, dass ein einzelner 1-Stern den rohen Durchschnitt nicht unter 4,80 drücken kann. (Airbnb speichert den rohen Durchschnitt auf zwei Nachkommastellen und zeigt ihn auf eine gerundet, also erscheint 4,82 als „4,8", liegt aber sicher über der 4,80-Grenze. Die ganze Mechanik dieser Klippe steht in [„Airbnb-Superhost: die vier Schwellen"](/blog/airbnb-superhost-requirements-math).)

Damit fällt der erste Mythos: **Eine schlechte Bewertung kostet Sie auf einem gereiften Inserat nicht den Superhost.** Sie kostet den Superhost auf einem *jungen* Inserat. Wenn Sie mehr als etwa 50 Bewertungen bei 4,90 haben, ist ein einzelner 1-Stern eine kosmetische Delle an der Zahl, kein Abzeichen-Ereignis. Die Panik ist echt; das Abzeichen-Risiko meist nicht.

Der 20-Bewertungen-Fall ist der, der brennt. Um zurück auf die 4,80-Linie zu kriechen — nicht auf Ihre alten 4,90, nur auf die Abzeichen-Linie — braucht dieses Inserat **9 Fünf-Sterne-Aufenthalte am Stück** (99 ÷ 21 steigt auf 144 ÷ 30 = 4,80, exakt beim neunten). Um ganz zurück auf 4,90 zu kommen, sind es 39. Das sind zwei verschiedene Ziellinien, und sie zu verwechseln ist genau die Stelle, an der Gastgeber entweder überpaniken oder unterreagieren.

## Die Tabelle der Bewertungsschuld

Weil die Erholung auf den früheren Durchschnitt unabhängig von der Bewertungszahl ist, passt sie auf eine Visitenkarte. So viel kostet eine schlechte Bewertung in makellosen Aufenthalten bei verschiedenen Startdurchschnitten:

| Ihr Durchschnitt vorher | Fünf-Sterne, um ihn nach einem 1-Stern voll zurückzuholen |
| --- | --- |
| 4,95 | 79 |
| 4,90 | 39 |
| 4,85 | 26 |
| 4,80 | 19 |
| 4,70 | 13 |

Lesen Sie die oberste Zeile noch einmal. Ein Inserat bei **4,95** braucht **79 makellose Aufenthalte**, um einen einzigen 1-Stern zu schlucken — gegenüber 13 bei einem Inserat auf 4,70. Je höher die Note, desto teurer ist eine schlechte Bewertung zu tilgen — weil pro Fünf-Sterne weniger Spielraum bleibt. Ein 4,95-Inserat gewinnt nur 0,05 pro makellosem Aufenthalt; ein 4,70-Inserat 0,30. Das ist der widersinnige Teil, den Gastgeber nie kommen sehen: **Ihre Note Richtung 5,0 hochzuschleifen macht Sie fragiler, nicht sicherer.** Je näher an der Decke, desto länger dauert die Erholung nach dem Fall.

Und es hängt stark davon ab, welche niedrige Bewertung Sie erwischt hat. Dasselbe 4,90-Inserat, verschiedene schlechte Bewertungen:

| Die Bewertung, die Sie bekamen | Fünf-Sterne, um sie zu tilgen (von 4,90) |
| --- | --- |
| 1 Stern | 39 |
| 2 Sterne | 29 |
| 3 Sterne | 19 |
| 4 Sterne | 9 |

Ein 4-Stern — den die meisten Gastgeber gar nicht als „schlecht" einstufen — kostet trotzdem neun makellose Aufenthalte, um ihn von einem 4,90-Inserat zu tilgen. Deshalb behandeln Gastgeber, die eine 4,9+-Anzeige jagen, 4-Sterne als Fehlschläge: In dieser Höhe ist ein 4-Stern ein echter Rückschlag, kein Kompliment mit Rundungsfehler.

## Aufenthalte in Monate übersetzen

Neun oder neununddreißig makellose Aufenthalte klingen abstrakt, bis man sie in Kalenderzeit umrechnet. Nicht jeder Gast bewertet — die Bewertungsquote auf Airbnb liegt grob bei 50–70 %, je nach Ihrer Aufforderungsdisziplin. Nehmen Sie ein Inserat mit 9 Buchungen im Monat, bei dem etwa die Hälfte der Gäste bewertet: das sind ~4–5 frische Bewertungen im Monat.

Bei fünf Bewertungen im Monat ist die 39-Aufenthalte-Schuld des 4,90-Inserats **rund acht Monate** aus nichts als Fünf-Sternen. Acht Monate, in denen ein einziger 4-Stern einen Teil der Uhr zurückstellt, denn die Erholungsrechnung oben setzt eine *ununterbrochene* Serie voraus. Schieben Sie einen 4-Stern in den Lauf, haben Sie dessen eigene Schuld obendrauf gepackt — die Serie leistet doppelte Arbeit, und jeder Riss darin dehnt den Zeitrahmen.

Das ist die Zahl, die Ihr Verhalten ändern sollte. Die schlechte Bewertung ist schon passiert; sie ist ein versenkter Treffer von 3,90 Punkten. Was Sie steuern, ist die Bewertungs-*Geschwindigkeit* — wie schnell saubere Aufenthalte eintreffen, um sie zu verdünnen. Ein Inserat mit 4 Bewertungen im Monat erholt sich in halber Kalenderzeit gegenüber einem mit 2, vom identischen Startpunkt. Der wirksamste Hebel nach einer schlechten Bewertung ist nicht die öffentliche Antwort. Es ist eine eingeschaltete Bewertungsanfrage nach dem Aufenthalt, damit die nächsten fünfzehn zufriedenen Gäste die fünf Sterne, die Sie heilen, auch wirklich abgeben. Die Taktik der Antwort selbst steht in [„Wie man auf eine 3-Sterne-Bewertung reagiert"](/blog/responding-to-bad-airbnb-review); die Geschwindigkeit ist es, die die Zahl bewegt.

## Guest Favorite erhöht den Einsatz

Die Superhost-Linie 4,80 hat echten Spielraum. Airbnbs neueres Abzeichen **Guest Favorite**, Ende 2023 eingeführt, um die beliebtesten Inserate zu kennzeichnen, hat keine harte Zahlengrenze — aber in der Praxis drängen sich die Inserate, die es tragen, eng um 4,9. Airbnb beschreibt es als Mischung aus Note, Bewertungszahl und Zuverlässigkeitssignalen statt als einzelne Schwelle, also begegnen Sie jeder exakten Zahl, die im Netz kursiert, mit Misstrauen.

Die praktische Folge ist der Punkt. Ein Abzeichen, dessen faktische Latte nahe 4,9 liegt, lässt fast kein Polster. In der Tabelle der Bewertungsschuld ist ein Inserat, das bei 4,90 lebt, um Guest Favorite zu halten, genau das Inserat, das 39 Aufenthalte zahlt, um einen 1-Stern zu tilgen — und ein einziger 4-Stern im Erholungslauf kann reichen, um aus der Kohorte zu fallen. Das Abzeichen, das eine nahezu perfekte Note belohnt, ist dasselbe, das eine einzige schlechte Nacht am härtesten bestraft. Wenn Sie Guest Favorite jagen, ist die Erholungsmathematik kein Kuriosum, sondern Ihr Risikomodell.

## Was die Zahl wirklich bewegt

Drei Hebel, nach abnehmender Wirkung.

**Löschung schlägt Erholung im Erwartungswert.** Eine bewilligte Löschung entfernt die Bewertung, die Note fällt mit ihr weg, und Ihr Durchschnitt rechnet sich binnen Minuten neu — die ganze 39-Aufenthalte-Schuld verschwindet für fünf Minuten Arbeit. Die Löschquote liegt grob bei 15–30 % auf Richtliniengründen (irrelevanter Inhalt, Vergeltung, Erpressung). Selbst bei 20 % Trefferquote schlägt eine sofortige Tilgung einer Achtmonatsschuld jedes Erholungsschleifen. Reichen Sie den Löschantrag *zuerst* ein, vor der öffentlichen Antwort, denn eine Antwort lässt den Fall erledigt aussehen. Gründe und Erfolgsquoten stehen im [Leitfaden zur 3-Sterne-Antwort](/blog/responding-to-bad-airbnb-review).

**Geschwindigkeit verdünnt, was sich nicht löschen lässt.** Für die Bewertungen, die Sie nicht löschen lassen können — die fairen — ist das einzige Werkzeug mehr saubere Bewertungen, schneller. Eine vierzeilige Nachricht nach dem Aufenthalt am vierten Tag konvertiert 35–50 % der Gäste, die sonst geschwiegen hätten. Verdoppeln Sie Ihre Bewertungsquote, halbieren Sie Ihre Erholungszeit. Kein anderer Regler leistet das.

**Hören Sie auf, über Ihre Decke hinaus zu optimieren.** Hat Ihr Inserat eine strukturelle Grenze — laute Straße, kein Aufzug, dünne Wände —, halten Sie keine 4,95, und das Jagen danach macht nur jeden 4-Stern zur Krise. Wählen Sie die Note, die Sie mit normalem Gastgeben halten, sammeln Sie den Ballast aus Bewertungszahl an und lassen Sie den Durchschnitt seine Arbeit tun. Ein Dashboard, das Durchschnittsnote, Bewertungsgeschwindigkeit und Superhost-Abstand über jedes Inserat auf einem Bildschirm zeigt — statt sich durch Airbnbs Tabs Inserat für Inserat zu klicken —, ist genau das, was [RentTools](/onboard) auf eine Fläche bringt.

## FAQ

**Wie wird die Airbnb-Gesamtnote berechnet?**
Sie ist der schlichte arithmetische Durchschnitt aller Gesamtbewertungen der Gäste über die Lebensdauer des Inserats — Summe aller Bewertungen geteilt durch ihre Anzahl. Es gibt keine Zeitabwertung und keine Aktualitätsgewichtung auf der Gesamtzahl, ein alter Fünf-Sterne zählt also genauso viel wie der von letzter Woche. Angezeigt wird dieser rohe Durchschnitt, auf eine Nachkommastelle gerundet.

**Wie viele Fünf-Sterne heben einen 1-Stern auf?**
Um auf Ihren genauen früheren Durchschnitt zurückzukommen, ist die Zahl `(P − 1) / (5 − P)`, wobei `P` der Durchschnitt vorher ist. Bei 4,90 sind das 39 Fünf-Sterne-Aufenthalte; bei 4,85 sind es 26; bei 4,80 sind es 19. Die Zahl hängt nicht davon ab, wie viele Bewertungen Sie schon haben — nur vom Durchschnitt, den Sie zurückholen wollen.

**Schmerzt eine schlechte Bewertung mehr, wenn ich weniger Bewertungen habe?**
Am Tag ja — der sofortige Einbruch ist `(P − k) / (N + 1)`, eine kleinere Bewertungszahl `N` bedeutet also einen größeren sichtbaren Fall. Ein 1-Stern zieht ein 20-Bewertungen-Inserat von 4,90 auf 4,71, ein 200-Bewertungen-Inserat aber nur auf 4,88. Die Zeit, es voll zu tilgen, ist für beide identisch.

**Kostet mich ein 1-Stern den Superhost?**
Nur wenn Ihr Inserat klein ist. Unter etwa 50 Bewertungen bei einem Durchschnitt von 4,90 kann ein 1-Stern den rohen Durchschnitt unter die 4,80-Schwelle drücken und Sie das Abzeichen bei der nächsten Quartalsneuberechnung kosten. Darüber haben Sie genug Fünf-Sterne-Historie, dass eine einzelne niedrige Bewertung bequem über der Linie bleibt.

**Ist ein 4-Stern schlecht für meine Note?**
Bei hohem Durchschnitt ja. Ein 4-Stern auf einem 4,90-Inserat zieht den Durchschnitt nach unten und braucht neun makellose Aufenthalte zum Tilgen. Als „gut" liest er sich nur gegen Inserate bei 4,5. Wenn Sie eine 4,9-Anzeige verteidigen oder Guest Favorite jagen, behandeln Sie 4-Sterne als Fehlschläge.

**Wie lange dauert es, eine Airbnb-Note in Echtzeit zu erholen?**
Rechnen Sie Aufenthalte über Ihre Bewertungsquote in Monate um. Ein 4,90-Inserat braucht 39 saubere Aufenthalte; bei etwa fünf Bewertungen im Monat sind das rund acht Monate ununterbrochener Fünf-Sterne. Höhere Bewertungsgeschwindigkeit verkürzt es proportional — ein Inserat, das doppelt so schnell Bewertungen sammelt, erholt sich in halber Kalenderzeit.

**Soll ich Gäste bitten, ihre Bewertung zu löschen oder zu ändern?**
Erzwingen können Sie es nicht, und Drängen geht meist nach hinten los. Die bessere Chance ist ein förmlicher Löschantrag bei Airbnb auf Richtliniengründen — irrelevanter Inhalt, Vergeltung oder dokumentierte Erpressung —, der bei Bewilligung die Bewertung und ihre Wirkung auf die Note sofort entfernt. Streben Sie das an, bevor Sie acht Monate lang die Zahl weghosten.

## Eine pointierte Meinung

Gastgeber behandeln eine schlechte Bewertung wie eine Wunde, die von allein heilt, wenn man nur weiter gut gastgibt. Die Mathematik sagt etwas anderes: Ein einzelner 1-Stern auf einem 4,90-Inserat ist eine Schuld von 39 makellosen Aufenthalten, und die Zeit tilgt sie nur so schnell, wie saubere Bewertungen eintreffen. Die zwei Dinge, die diese Schuld wirklich abtragen, sind ein in der ersten Stunde eingereichter Löschantrag und eine Bewertungsanfrage, die verdoppelt, wie schnell die nächsten fünfzehn Gäste fünf Sterne geben. Alles andere — die durchlittene öffentliche Antwort, die Preissenkung, die Woche des Zweifelns — bewegt die Zahl um nichts. Wenn Sie sich schon an einer Bewertung festbeißen, beißen Sie sich an den zwei Hebeln fest, die Arithmetik sind, nicht an dem, der sich nur produktiv anfühlt.
