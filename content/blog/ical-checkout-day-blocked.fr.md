---
slug: ical-checkout-day-blocked
locale: fr
title: "iCal bloque le jour de départ ? Le décalage d'un jour qui dévore vos nuits"
excerpt: Votre calendrier se synchronise bien, mais le jour de départ apparaît réservé sur l'autre plateforme. Pourquoi le DTEND exclusif d'iCal et les fuseaux horaires bloquent en silence une nuit vendable.
status: published
tags:
  - calendar-sync:Synchro calendrier
  - ical:iCal
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/ical-checkout-day-blocked.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Un voyageur a quitté mon appartement de Tachkent un samedi à 11 h. À 13 h, le logement était nettoyé et prêt. Quelqu'un a voulu réserver précisément ce samedi sur Booking.com — et a obtenu « non disponible ». La nuit était perdue, et je ne comprenais pas pourquoi : les calendriers se synchronisaient parfaitement. Les dates étaient juste décalées d'exactement un jour.

Personne ne vous prévient de ce bug. Le flux iCal est frais, les horodatages sont à jour, chaque récupération réussit — et la plateforme bloque quand même le mauvais jour. Voici pourquoi cela arrive, comment le prouver chez vous en deux minutes, et le correctif exact de chaque cause.

## TL;DR

- Un calendrier peut se synchroniser parfaitement et bloquer la mauvaise nuit — le bug n'est pas l'obsolescence.
- Le `DTEND` d'iCal est **exclusif** : le jour de départ doit rester réservable, pas bloqué.
- Deux causes : un flux qui bloque le départ *de façon inclusive*, ou un **décalage de fuseau horaire**.
- Les événements `VALUE=DATE` sont sûrs ; un `DATE-TIME` finissant par `Z` est le risque.
- Ouvrez le `.ics` et lisez `DTSTART` / `DTEND` : huit chiffres, sans `T`, signifie journée entière.
- Chaque jour de départ bloqué à tort est une nuit vendable que vous ne voyez jamais passer.

## Le bug qui se cache derrière une synchro qui marche

La plupart des problèmes de calendrier tournent autour d'un flux qui devient obsolète : une URL réinitialisée, un flux que la plateforme a discrètement coupé après des échecs répétés, un import qui affiche « Dernière synchro : jamais ». Si c'est votre symptôme, c'est l'article frère qu'il vous faut, sur [pourquoi un calendrier Airbnb cesse de se synchroniser](/blog/airbnb-calendar-not-syncing) : sept causes, toutes liées à un flux qui ne se met pas à jour.

Ici, c'est l'inverse. Le flux se met à jour normalement. L'horodatage « Dernier import » date de vingt minutes. Chaque réservation sur Airbnb apparaît sur Booking.com dans la fenêtre de récupération. Et pourtant une nuit précise — presque toujours un jour de départ, parfois la nuit avant une arrivée — apparaît indisponible alors que le logement est vide, c'est prouvé.

Vous n'obtenez aucune erreur. Vous obtenez un calendrier qui se trompe, avec aplomb et en silence, d'exactement un jour. On ne le remarque que lorsqu'un voyageur écrit « c'est complet chez vous » pour une date que vous savez libre — ou quand vous partez vous-même chercher pourquoi un samedi très demandé ne s'est jamais vendu.

## Pourquoi le jour de départ doit être libre

iCal n'est pas un format flou, c'est une norme — [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) — et elle décrit précisément le fonctionnement d'une plage de dates. Pour un événement journée entière, la réservation est l'intervalle semi-ouvert `[DTSTART, DTEND)`. `DTSTART` est inclus. `DTEND` **non**. C'est le matin *après* la dernière nuit.

Prenons un séjour de trois nuits : arrivée le 10 juillet, départ le 13. Le voyageur dort du 10 au 12 — trois nuits. Le bloc iCal correct ressemble à ceci :

```
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260710
DTEND;VALUE=DATE:20260713
SUMMARY:Reserved
END:VEVENT
```

Notez `DTEND:20260713`, pas `20260712`. Le 13 est le jour de départ et, selon la règle exclusive, il est **libre** : un nouveau voyageur peut arriver l'après-midi même. Ce n'est pas une faille, c'est ainsi que les réservations consécutives sont censées fonctionner. Les plateformes le modélisent correctement : Airbnb et Booking.com considèrent toutes deux le jour de départ comme réservable pour une arrivée le jour même — c'est précisément ce qui vous permet une rotation serrée sur un week-end très demandé.

Donc, quand le jour de départ apparaît bloqué, c'est que quelque chose, entre la plateforme source et la plateforme de destination, a cessé de respecter le `DTEND` exclusif. Cela se produit de deux façons.

## Cause 1 : un flux qui bloque le jour de départ

Le premier défaut est un `DTEND` inclusif. Quelque part dans la chaîne, une nuit qui devrait être libre est comptée comme occupée.

Cela se manifeste de deux manières. Soit le **générateur de flux** est fautif — un script cron maison ou un channel manager dépassé écrit `DTEND:20260714` (un jour de trop) ou émet un bloc distinct pour le jour de départ —, soit l'**importateur** traite `DTEND` comme inclusif et bloque jusqu'au 13 inclus alors que le flux indique `20260713`.

En pratique, le générateur est le coupable habituel, car les grandes plateformes appliquent bien la règle exclusive. Si vous synchronisez Airbnb directement vers Booking.com sans couche intermédiaire, vous tombez rarement dessus. Vous tombez dessus quand un troisième outil s'intercale — votre script, un petit PMS, un export tableur-vers-iCal — qui se trompe d'une unité. Le classique : quelqu'un raisonne « le séjour va du 10 au 13 » et écrit `DTEND:20260713` au sens **inclusif**, alors qu'iCal lit cette même valeur comme **exclusive** et libère le 13. Trop ou pas assez bloqué : tout dépend du modèle mental de l'auteur — et le format ne l'avertit dans aucun sens.

Le résultat, c'est de l'argent réel : chaque jour de départ bloqué à tort est une rotation le jour même que vous ne pouvez pas vendre. Sur un logement qui enchaîne les séjours en haute saison, c'est une nuit par semaine — perdue, sans le moindre message d'erreur.

## Cause 2 : les fuseaux horaires déplacent la nuit

Le second défaut est plus subtil et, pour les hôtes transfrontaliers, bien plus fréquent. Il vient des flux qui exportent les dates en `DATE-TIME` plutôt qu'en `DATE` journée entière.

Un événement journée entière n'a pas de fuseau : `20260713`, c'est le 13 partout sur Terre. Mais certains flux exportent une réservation avec une heure et un fuseau — ou pire, normalisée en UTC :

```
DTSTART:20260713T000000Z
DTEND:20260716T000000Z
```

Le `Z` signifie UTC. La plateforme importatrice doit maintenant convertir cela dans *son* heure locale avant de décider sur quel jour calendaire tombe le bloc. Un bloc qui commence à `20260713T000000Z` — minuit UTC — devient, depuis un fuseau cinq heures derrière UTC, 19 h le **12** juillet. Tronquez à la date et vous venez de bloquer le 12, une nuit qui devrait être libre. Le bloc a glissé d'un jour en arrière. Désormais, c'est la nuit *avant* l'arrivée de votre voyageur qui apparaît indisponible.

Placez le logement à l'est d'UTC et ça glisse dans l'autre sens. Un départ qui devait libérer une matinée laisse au contraire la nuit bloquée, parce que l'heure convertie arrondit au jour suivant. Même cause, symptôme inverse.

Par-dessus s'ajoute l'heure d'été et son décalage d'une heure. Une réservation qui tombait parfaitement sur la frontière en hiver peut déraper d'un jour pendant les semaines où la source et la destination ne sont pas sur le même calendrier de changement d'heure : l'Europe et les États-Unis changent d'heure à des dates différentes, il existe donc chaque printemps et chaque automne une fenêtre de deux à trois semaines où un événement `DATE-TIME` proche de minuit bascule. Si votre décalage d'un jour n'apparaît qu'une partie de l'année — voilà pourquoi.

L'indice est dans le flux lui-même : une valeur `DATE-TIME` (elle contient un `T`, souvent un `Z` final ou un préfixe `TZID=`) dépend du fuseau et c'est le suspect numéro un. Un simple `VALUE=DATE` de huit chiffres sans `T` y est insensible.

## Comment le prouver chez vous

Pas besoin de deviner. Deux minutes avec le flux brut tranchent la question.

1. Récupérez l'URL d'**export** iCal de la plateforme source — celle que vous copiez depuis Airbnb (Calendar → Sync calendars → Export) ou Booking.com (Calendar & Pricing → Sync calendars → Export).
2. Collez-la directement dans un navigateur. Vous obtenez un fichier `.ics` ou un mur de texte qui commence par `BEGIN:VCALENDAR`. Si vous tombez plutôt sur une page d'erreur HTML, votre problème est l'obsolescence, pas les dates — retour à la [check-list du flux figé](/blog/airbnb-calendar-not-syncing).
3. Trouvez le `VEVENT` d'une réservation dont vous connaissez les vraies dates par cœur. Lisez son `DTSTART` et son `DTEND`.

Interprétez maintenant ce que vous voyez :

| À quoi ressemble la ligne du flux | Ce que ça veut dire | Risque de décalage |
| --- | --- | --- |
| `DTSTART;VALUE=DATE:20260710` | Journée entière, sans fuseau | Aucun — la forme sûre |
| `DTEND;VALUE=DATE:20260713` | Jour de départ, exclusif (correct) | Aucun |
| `DTEND;VALUE=DATE:20260712` | Dernière nuit, pas le jour de départ | Bug inclusif — bloque la rotation |
| `DTSTART:20260710T140000Z` | Une heure en UTC | Élevé — convertie selon le fuseau |
| `DTSTART;TZID=...:20260710T140000` | Une heure dans un fuseau nommé | Moyen — dépend de l'importateur |

Recoupez ensuite avec la destination : ouvrez le jour en question dans le calendrier de l'autre plateforme. Si le flux dit que le jour de départ est libre (`DTEND` est la date de départ, journée entière) mais que la destination l'affiche bloqué, c'est l'importateur le coupable. Si le mauvais jour est déjà inscrit dans le flux lui-même, c'est la source ou un outil intermédiaire.

## Comment corriger chaque cause

Le correctif dépend du maillon fautif de la chaîne et, surtout, de savoir si vous le contrôlez.

**Si vous contrôlez le générateur de flux** (votre propre script, un exportateur auto-hébergé) : émettez des événements journée entière en `VALUE=DATE` et fixez `DTEND` au **jour de départ**, pas à la dernière nuit. N'émettez jamais d'heure pour un bloc journée entière. Ce seul changement élimine les deux causes à la source : aucun fuseau à convertir, aucune erreur de bornage.

**Si la source émet du `DATE-TIME` et que vous ne pouvez pas la changer :** placez une couche de normalisation entre les plateformes. Elle absorbe le flux brouillon, réécrit chaque réservation en événement journée entière (`VALUE=DATE`) dans le fuseau du logement, et republie aux autres plateformes un flux propre à importer. C'est exactement ce que fait un outil au fait d'iCal comme [RentTools](/onboard) à chaque récupération : il épingle chaque bloc au jour calendaire local du logement avant que quiconque, en aval, ne puisse le mal lire. La roulette des fuseaux à travers les frontières, c'est fini.

**Si l'importateur traite `DTEND` comme inclusif** et que vous ne pouvez pas corriger le code de la plateforme (vous ne pouvez pas), deux options : ajouter un jour tampon de ménage pour que le jour de départ soit bloqué volontairement — voir [les jours tampons](/blog/cleaning-buffer-days) — ou passer par une couche intermédiaire qui compense. Le tampon masque le symptôme au lieu de le soigner — ce qui convient, jusqu'au jour où vous voudrez vendre cette rotation.

Après tout correctif, vérifiez comme vous avez diagnostiqué : récupérez le flux, confirmez que `DTEND` est bien la date de départ en journée entière, puis regardez que le calendrier de destination affiche le jour de départ comme réservable. Ne croyez pas que ça a marché — regardez la case.

## Ce que le décalage d'un jour coûte vraiment

Pourquoi une séance de diagnostic en vaut la peine : ce bug est invisible et récurrent. Il ne vous coûte pas une nuit une fois ; il coûte une nuit par réservation touchée, à chaque fois, jusqu'à ce que vous le trouviez.

Voici un logement à rotation serrée à 120 $ de tarif de base, où le bug bloque deux rotations par mois :

| Scénario | Nuits perdues / mois | Perte / mois | Perte / an |
| --- | --- | --- | --- |
| 2 jours de départ bloqués, base 120 $ | 2 | 240 $ | 2 880 $ |
| Haute saison, 1 nuit bloquée / semaine | 4 | 480 $ | (selon saison) |
| Décalage sur la nuit avant arrivée, 1 / mois | 1 | 120 $ | 1 440 $ |

Ce ne sont pas des remboursements que vous voyez dans un rapport — ce sont des réservations qui n'ont jamais eu lieu : une demande qui a heurté un mur « non disponible » et qui est partie chez le voisin. Le calcul est approximatif, car il dépend de la fréquence à laquelle vos trous sont des rotations le jour même, mais le sens est clair : une fuite récurrente d'une nuit, sur un logement à vraie demande de rotation, c'est un montant annuel à quatre chiffres — et il n'apparaît nulle part comme un problème que vous pourriez pointer du doigt.

De plus, il se cumule avec ce qui est juste à côté. Un jour de départ bloqué à tort est une rotation invendable ; un jour de départ *libéré* à tort, c'est ainsi qu'on récolte une [double réservation](/blog/avoiding-double-bookings). La même règle du `DTEND` exclusif, les deux sens de défaillance — et le seul moyen de savoir de quel côté vous êtes, c'est de lire le flux.

## FAQ

**Pourquoi le jour où mon voyageur part apparaît-il indisponible pour une nouvelle réservation ?**
Parce que quelque chose, dans votre chaîne de synchronisation, traite le jour de départ comme occupé. Selon les règles iCal, le jour de départ est le `DTEND` exclusif — le matin après la dernière nuit, réservable pour une arrivée le jour même. S'il apparaît bloqué, soit un générateur de flux a écrit la plage de façon inclusive, soit une conversion de fuseau a décalé le bloc d'un jour.

**Que veut dire que `DTEND` est exclusif ?**
Que la date de fin ne fait pas partie de la réservation. Un séjour avec `DTSTART:20260710` et `DTEND:20260713` couvre les nuits du 10, du 11 et du 12 — trois nuits — et laisse le 13 libre. Beaucoup lisent `20260713` comme « bloqué jusqu'au 13 inclus », mais le format dit le contraire. C'est précisément cet écart qui est la source la plus fréquente des bugs de décalage d'un jour.

**Mon calendrier se synchronise à l'heure mais bloque les mauvaises dates. Est-ce pareil qu'un flux obsolète ?**
Non, et pour le correctif la distinction compte. Un flux obsolète est un problème de fraîcheur — l'import a cessé de se mettre à jour, et vous le corrigez en réparant l'URL ou en réajoutant l'import. Un flux aux mauvaises dates se met à jour normalement ; ce sont les dates à l'intérieur qui sont fausses. Vérifiez d'abord l'horodatage « Dernier import » : horodatage récent plus mauvaises dates égale décalage d'un jour, pas obsolescence.

**Comment savoir si mon flux iCal utilise des dates ou des date-heures ?**
Collez l'URL d'export dans un navigateur et regardez un `VEVENT`. Si vous voyez `DTSTART;VALUE=DATE:20260710` — huit chiffres, sans `T` —, c'est un événement journée entière, insensible aux fuseaux. Si la date est suivie d'un `T` et d'une heure, et surtout d'un `Z` final, c'est un `DATE-TIME`, et une conversion de fuseau a lieu quelque part en aval.

**L'heure d'été peut-elle vraiment décaler une réservation d'un jour ?**
Seulement pour les flux qui utilisent `DATE-TIME` près d'une frontière de minuit, et seulement les semaines où la région source et la région de destination ne sont pas sur le même calendrier de changement d'heure. L'Europe et l'Amérique du Nord changent d'heure à des dates différentes ; il existe donc chaque printemps et chaque automne une courte fenêtre où un événement proche de minuit tombe sur le mauvais jour calendaire. Les événements `VALUE=DATE` journée entière ne sont jamais touchés.

**Un channel manager ou une couche intermédiaire corrige-t-il cela ?**
Possible — si la couche normalise les flux en événements journée entière à la date locale avant de les republier. Cela supprime l'ambiguïté de fuseau pour tout l'aval. Cela n'aide pas si la couche émet elle-même du `DATE-TIME` ou se trompe d'une unité : le correctif, c'est un traitement correct des dates, pas la simple présence d'un outil. Lisez le flux republié et confirmez qu'il émet du `VALUE=DATE`.

**Un jour tampon de ménage, c'est une solution ou un pansement ?**
Un pansement, mais utile. Un tampon d'un jour bloque le jour de départ volontairement, si bien qu'un décalage qui le bloque aussi devient invisible — cette nuit, vous ne la vendiez pas de toute façon. Le problème revient à l'instant où vous retirez le tampon pour vendre une rotation très demandée. Traitez donc le tampon comme une couverture, pas un remède, et corrigez quand même le traitement des dates.

**Pourquoi est-ce parfois la nuit avant l'arrivée qui est bloquée, et non le jour de départ ?**
Le sens dépend de la direction dans laquelle le décalage de fuseau pousse la date. Un bloc normalisé en UTC glisse vers l'avant depuis un fuseau derrière UTC et peut bloquer la nuit avant l'arrivée ; depuis un fuseau devant UTC, il glisse vers l'arrière et laisse une nuit de départ bloquée. Même cause, symptôme inverse — les deux se règlent en épinglant le bloc à la date locale du logement.

## Un avis tranché

Si vous gérez plus d'une plateforme et que vous n'avez jamais ouvert votre flux `.ics` brut dans un navigateur, faites-le cette semaine. Pas parce que c'est cassé (peut-être que non), mais parce que c'est la seule panne de calendrier qui vous coûte de l'argent avec zéro signal. Un flux obsolète finit par s'annoncer : un voyageur se plaint, une date ne se met pas à jour, un horodatage refroidit. Un décalage d'un jour, lui, transforme simplement en silence vos meilleures nuits de rotation en « non disponible » et envoie la réservation à quelqu'un d'autre. Les quinze secondes nécessaires pour confirmer que votre flux émet du `VALUE=DATE` et un `DTEND` de départ exclusif sont l'audit de chiffre d'affaires le moins cher que vous mènerez jamais.
