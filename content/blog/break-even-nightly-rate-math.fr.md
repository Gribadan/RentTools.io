---
slug: break-even-nightly-rate-math
locale: fr
title: "Tarif plancher par nuit : le seuil où une réservation devient une perte"
excerpt: La math du tarif par nuit en dessous duquel une réservation de location courte durée fait perdre de l'argent — coûts par séjour vs par nuit, la formule du seuil, et trois demandes bradées évaluées.
status: published
tags:
  - pricing:Tarification
  - host-tips:Conseils hôtes
  - tools:Outils
ogImageUrl: /blog-covers/break-even-nightly-rate-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

J'ai un jour accepté une réservation le jour même pour une seule nuit à 39 $, parce que le calendrier était vide et que « 39 $, c'est mieux que rien ». Ce n'était pas mieux que rien. La femme de ménage m'a coûté 45 $ avant même que le voyageur n'ait déverrouillé la porte ; la nuit a fait tourner le chauffage, l'eau chaude et une machine, et Airbnb a prélevé sa part en haut. Il m'est resté environ 33 $ et j'en ai dépensé près de 60 $. J'avais en réalité payé un inconnu 25 $ pour qu'il dorme dans mon appartement — et je me trouvais malin. La nuit vide qui me faisait si peur aurait coûté 0 $.

C'est de ce piège que parle cet article. Une nuit vide est un coût irrécupérable : il est payé, que quelqu'un se présente ou non. Une réservation *sous le plancher* est pire que vide : c'est une perte active que vous choisissez. La frontière entre les deux, c'est votre tarif plancher par nuit, et presque aucun hôte n'a jamais calculé le sien.

## TL;DR

- Une nuit vide est un coût irrécupérable ; une réservation sous le plancher est une perte.
- Plancher = (coût par séjour ÷ nuits + coût par nuit) ÷ (1 − commission).
- Une réservation d'une nuit porte tout le ménage : son plancher est le plus élevé.
- Un plancher d'une nuit proche de 80 $ tombe sous 25 $ dès qu'un séjour dure une semaine.
- Le chauffage l'hiver et la commission de 15 % relèvent le plancher, ne l'abaissent pas.
- Sous le plancher, vous payez le voyageur — fixez un prix minimum.

## Ce que « seuil de rentabilité » veut dire pour une nuit

L'emprunt, l'assurance, la taxe foncière, l'internet — ce sont des coûts fixes. Vous les payez que le logement soit plein ou éteint tout le mois. Donc, quand vous décidez d'accepter une réservation précise, vous les ignorez complètement. Ce n'est pas un coût *de cette réservation* ; c'est un coût *de la possession du logement*, et il est déjà dépensé.

Ce qu'une réservation vous coûte vraiment, c'est seulement l'argent qui sort de votre poche *parce qu'un voyageur est dans le logement — l'argent que vous n'auriez pas dépensé si la nuit était restée vide*. Voilà le coût variable, et c'est le seul chiffre qui décide si un tarif rapporte ou fait perdre.

C'est pourquoi « 39 $, c'est mieux qu'une nuit vide » est le mauvais cadre. La nuit vide ne coûte rien de plus. La réservation à 39 $ me coûte une femme de ménage, des charges, des consommables et une part de commission. La bonne question n'est jamais « est-ce mieux que vide ? », mais **« ce tarif couvre-t-il ce que cette réservation précise va me coûter à gérer ? »**. Si oui, chaque dollar au-dessus est une vraie marge sur une nuit qui aurait sinon rapporté zéro. Si non, vous subventionnez les vacances d'un inconnu.

## Les trois paniers de coûts

Le coût variable n'est pas un chiffre unique — il vient sous trois formes, et les confondre, c'est la raison pour laquelle la réservation à 39 $ paraît correcte jusqu'à l'arrivée de la facture du ménage. Séparez proprement :

**Coûts par séjour** — payés une fois par réservation, quelle que soit la durée. La femme de ménage (40–80 $ par rotation selon la taille), le lavage du linge et des serviettes (6–12 $), le réassort des consommables à l'arrivée (café de bienvenue, articles de toilette frais, un rouleau de sacs-poubelle — disons 5–10 $). Un voyageur d'une nuit et un voyageur de sept vous coûtent presque la même chose ici. C'est toute la raison pour laquelle les courts séjours coûtent cher à gérer.

**Coûts par nuit** — payés pour chaque nuit où le voyageur est là. Électricité, eau, gaz/chauffage, la part quotidienne des consommables (capsules de café, papier toilette, liquide vaisselle, lessive). Dans un mois tempéré, cela fait peut-être 10–14 $ par nuit pour un deux-pièces ; en plein hiver, chauffage allumé, cela grimpe à plus de 20 $.

**Coûts en pourcentage** — une part prélevée en haut de ce que vous facturez. La host-only fee d'Airbnb tourne autour de 15 %, la commission partagée plus près de 3 % pour l'hôte ; Booking.com prend ~15 % de commission ; Vrbo atterrit près de 8 % plus le traitement du paiement. Sur une réservation directe, ce n'est que les frais de carte, environ 2,9 % + 0,30 $. Ce chiffre croît avec votre tarif : il ne s'ajoute donc pas seulement au plancher — il le multiplie.

Pour garder le modèle honnête, je raisonne ici en **prix tout compris** — le tarif par nuit couvre tout, pas de frais de ménage ajoutés à côté. C'est de toute façon de plus en plus ainsi que les plateformes veulent l'affichage, et le plancher devient un seul chiffre net. (Si vous gardez encore des frais de ménage séparés, leurs arbitrages font l'objet d'un autre article : [frais de ménage vs prix tout compris](/blog/airbnb-cleaning-fee-vs-all-in-pricing).)

Mettez les trois paniers ensemble et le tarif plancher pour un séjour de **N** nuits ressemble à ceci :

```
tarif plancher par nuit = (coût par séjour / N + coût par nuit) / (1 − commission)
```

Le `(1 − commission)` au dénominateur, c'est la partie que les hôtes oublient. Si une nuit vous coûte 25 $ et que la plateforme prend 15 %, vous ne facturez pas 25 $ — vous facturez 25 $ / 0,85 = 29,41 $, parce que 4,41 $ de ce tarif ne vous parviennent jamais. Facturez exactement 25 $ et vous avez fait la rotation gratuitement.

## La table du plancher selon la durée de séjour

Prenez un vrai deux-pièces en ville : coût par séjour 55 $ (ménage 45 $ + linge 10 $), coût par nuit 13 $, commission 15 %. Regardez ce que la durée fait au plancher.

| Durée de séjour | Coût par séjour ÷ nuits | + par nuit | Avant commission | Tarif plancher |
|---|---|---|---|---|
| 1 nuit | 55,00 $ | 13 $ | 68,00 $ | **80 $** |
| 2 nuits | 27,50 $ | 13 $ | 40,50 $ | **48 $** |
| 3 nuits | 18,33 $ | 13 $ | 31,33 $ | **37 $** |
| 5 nuits | 11,00 $ | 13 $ | 24,00 $ | **28 $** |
| 7 nuits | 7,86 $ | 13 $ | 20,86 $ | **25 $** |

Le plancher d'une nuit est de 80 $ ; celui de sept nuits, de 25 $. Même appartement, mêmes coûts — la seule chose qui a bougé, c'est le nombre de nuits qui se partagent cette unique facture de ménage de 55 $. Un voyageur d'une nuit paie tout le ménage d'un coup ; un voyageur d'une semaine l'étale sur sept nuits jusqu'à ce qu'il disparaisse presque.

C'est la math derrière chaque remise longue durée que vous avez vue. Un hôte qui offre 20 % pour une semaine n'est pas généreux — son plancher sur sept nuits est le tiers de son plancher d'une nuit, il a donc une marge énorme pour remiser tout en restant rentable. (Le revers — jusqu'où la remise peut descendre — c'est [la math des remises longue durée](/blog/length-of-stay-discount-math).) C'est aussi pourquoi une réservation à 50 $ d'une nuit est une perte, alors qu'à 50 $ sur sept nuits c'est une saine marge de 25 $ par nuit. Le tarif seul ne dit rien ; le tarif *à côté de la durée du séjour* dit tout.

## Trois demandes bradées, évaluées

Le plancher gagne sa place quand une demande bon marché arrive et que vous avez trente secondes pour décider. En voici trois, contre la table ci-dessus.

| Demande | Tarif proposé | Plancher pour cette durée | Verdict | Marge / perte |
|---|---|---|---|---|
| Jour même, 1 nuit | 55 $ | 80 $ | **Refuser** | −21 $ sur la nuit |
| Demain, 4 nuits | 50 $ | 31 $ | **Accepter** | +63 $ sur le séjour |
| Trou le week-end, 2 nuits | 38 $ | 48 $ | **Refuser** | −16 $ sur le séjour |

La nuit unique le jour même à 55 $ *ressemble* à de l'argent tombé du ciel un mardi vide. Ça ne l'est pas : vous gardez 46,75 $ après commission et dépensez 68 $ pour la gérer, une perte de 21 $ pour le plaisir d'une rotation. Les quatre nuits à 50 $ paraissent plus basses par nuit, mais c'est la seule gagnante — la facture de ménage s'étale finement, et chaque nuit dégage 15,75 $ au-dessus du plancher, 63 $ de vraie marge. Les deux nuits du week-end à 38 $ sont la séduisante : 38 $ sonne raisonnable, et les week-ends paraissent précieux ; comparez au plancher de 48 $ pour deux nuits, et vous êtes en moins de 16 $.

Remarquez le schéma : la décision ne suit jamais l'air *imposant* du tarif. 55 $ se refuse et 50 $ s'accepte, parce que l'un est une nuit seule portant toute la facture de ménage et l'autre l'étale sur quatre. Évaluez le tarif contre le plancher de *cette durée*, sinon vous continuerez à prendre les pertes coûteuses pour des gains.

## Le plancher bouge — et dans le sens contraire à vos réflexes

Deux forces déplacent le plancher, et toutes deux le font au moment précis où vous êtes le plus tenté de remiser.

**La commission.** Faites tourner ce même deux-pièces via la host-only fee d'Airbnb (≈15 %) et votre plancher d'une nuit est de 80 $. Passez à la commission partagée (≈3 % pour vous) et le plancher tombe à environ 70 $ ; prenez une réservation directe avec seulement des frais de carte et il est proche de 68 $. La plateforme fixe discrètement votre plancher 10 $ et plus au-dessus de ce que vos coûts bruts laissent croire — une raison de plus pour qu'une réservation directe au *même* tarif affiché vous vaille davantage qu'une réservation Airbnb. ([La math host-only vs commission partagée](/blog/airbnb-host-only-fee-vs-split-fee-math) en donne le détail complet.)

**La saison.** En janvier, le chauffage tourne toute la journée et votre coût par nuit passe de 13 $ à 22 $. Cela hisse le plancher d'une nuit de 80 $ à environ 91 $, et celui de trois nuits de 37 $ à 47 $. L'hiver est justement le moment où le taux d'occupation fléchit et où l'envie de casser les prix est la plus forte — et c'est la saison où votre plancher est le *plus haut*, parce que chaque nuit brûle désormais plus de gaz. Les hôtes baissent encore et encore leurs tarifs d'hiver sous leur propre plancher de saison froide et concluent que « l'hiver, ça ne rapporte pas ». L'hiver va bien — ils l'ont rempli de réservations à perte.

Dans les deux cas, le réflexe ment. La faible demande vous pousse à baisser le tarif ; les coûts qui montent poussent simultanément le plancher vers le haut. Remisez là-dedans sans recalculer le chiffre, et vous remplirez un calendrier de nuits qui perdent chacune quelques dollars, puis vous vous demanderez pourquoi un mois chargé a moins payé qu'un mois calme.

## Quand accepter sous le plancher exprès

Le plancher est un réglage par défaut, pas une loi. Il y a de vraies raisons de passer en dessous — mais ce sont des investissements réfléchis, pas des réflexes « 39 $, c'est mieux que rien ».

- **Une annonce toute neuve sans avis.** Vos cinq premiers avis valent plus que la marge sur cinq réservations. Tarifer sous le plancher pour acheter du volume d'avis est une tactique de lancement légitime — avec une date de fin, après laquelle vous tarifez pour le profit.
- **Un bouche-trou qui débloque une réservation plus grosse.** Une nuit orpheline isolée entre deux réservations ne rapporte rien et se vend mal ; la prendre un peu sous le plancher pour éviter une nuit morte peut être rentable — surtout si cela vous permet de relever un minimum de nuits ailleurs. (Le cas de la nuit orpheline a sa propre logique : [la math des nuits orphelines et des trous](/blog/orphan-night-gap-night-math).)
- **Un long séjour qui ancre un mois faible.** Une réservation de 21 nuits juste sous votre plancher de court séjour dégage quand même une grosse marge, parce que le coût par séjour s'évapore sur trois semaines — et elle vous épargne 21 nuits de marketing, de messages et de rotations.

Ce que les trois partagent : vous connaissez le chiffre que vous acceptez, vous savez pourquoi, et vous avez décidé que l'échange en vaut la peine. C'est l'opposé du réflexe du jour même, où vous acceptez une perte parce que vous n'avez jamais fait le calcul et que « vide » vous faisait plus peur que « négatif ».

## Câbler le plancher dans vos tarifs

Connaître son plancher ne sert à rien si la décision tombe à 23 h, quand une demande pour le jour même sonne et que vous êtes fatigué. La solution : faire du plancher un réglage, pas un jugement sur le moment.

Chaque plateforme a un champ de prix minimum. Mettez-y votre plancher *d'une nuit* — le plus élevé — et le calendrier refusera tout simplement de vendre une nuit en dessous. Posez les remises longue durée par-dessus, pour que les séjours plus longs puissent légitimement tarifer vers leurs planchers plus bas sans que vous ne touchiez à rien. Résultat : le système dit non tout seul à la nuit unique à 39 $ qui perd de l'argent, et oui aux quatre nuits rentables à 50 $, sans aucune math de votre part à 23 h.

Là où ça se complique, c'est que votre plancher n'est pas un chiffre unique — il est par saison et par plateforme, et le coût par nuit change vraiment entre juillet et janvier. Suivre cela à la main sur Airbnb, Booking.com et Vrbo, c'est exactement la comptabilité multiplateforme qui se périme la semaine où vous cessez de la surveiller. Réunir les coûts et les tarifs de chaque annonce au même endroit pour que le plancher soit toujours à jour, c'est précisément ce que [RentTools](/onboard) est fait pour gérer — gratuitement et sur toutes les plateformes à la fois.

## FAQ

**Qu'est-ce qu'un tarif plancher par nuit en location courte durée ?**
C'est le tarif le plus bas auquel une réservation couvre l'argent que vous dépensez réellement à la gérer — ménage, linge, charges, consommables et commission de la plateforme — sans surplus et sans perte. En dessous, la réservation coûte plus qu'elle ne rapporte. Au-dessus, chaque dollar supplémentaire est une marge sur une nuit qui aurait sinon rapporté zéro. Ce n'est pas le tarif qui couvre votre emprunt ; les coûts fixes comme l'emprunt se paient que ce soit réservé ou vide, ils n'ont donc pas leur place dans une décision sur une réservation précise.

**Pourquoi le plancher est-il bien plus haut pour les séjours d'une nuit ?**
Parce que la facture de ménage et de linge est la même qu'un voyageur reste une nuit ou sept, et qu'un voyageur d'une nuit la paie entière en une seule nuit. Étalez une rotation de 55 $ sur une nuit et elle y ajoute 55 $ ; étalée sur sept, moins de 8 $. C'est à cause de ce seul fait que les séjours d'une nuit exigent un tarif bien plus élevé pour atteindre l'équilibre, et c'est pourquoi la plupart des hôtes les tarifent haut ou imposent un minimum de deux nuits.

**Devrais-je un jour accepter une réservation sous mon tarif plancher ?**
Seulement comme un investissement réfléchi, jamais par réflexe. Raisons légitimes : une annonce toute neuve qui achète ses premiers avis, une nuit orpheline qui resterait morte sinon, ou un long séjour qui ancre un mois faible en étalant ses coûts. Dans chaque cas, vous connaissez le chiffre, vous savez pourquoi vous acceptez, et vous avez fixé une date de fin ou une condition. Accepter une perte simplement parce que la nuit était vide et que « quelque chose vaut mieux que rien », c'est précisément l'erreur que le plancher existe pour éviter.

**Mes frais de ménage couvrent-ils le coût du ménage ?**
En partie, et moins que vous ne le pensez. La plateforme prend aussi une commission sur les frais de ménage : des frais de 50 $ sur une annonce host-only à 15 % vous laissent donc environ 42,50 $ face à une femme de ménage qui peut coûter 45 $ — vous êtes déjà sous l'eau avant même les charges. Cette fuite est une raison pour laquelle cet article raisonne plutôt en prix tout compris, où le tarif par nuit porte le coût entier et le plancher est un seul chiffre honnête au lieu d'un frais qui, discrètement, ne se couvre pas lui-même.

**Comment la commission change-t-elle mon plancher de rentabilité ?**
Elle divise vos coûts bruts par `(1 − commission)`, donc une commission plus élevée signifie un plancher plus élevé. Une nuit qui vous coûte 25 $ exige un tarif de 25 $ à 0 % de commission, 25,77 $ à 3 % (commission partagée d'Airbnb) et 29,41 $ à 15 % (host-only ou Booking.com). La plateforme peut déplacer votre plancher de 4–5 $ par nuit avant que vous n'ayez dépensé un centime de plus — voilà pourquoi le même tarif affiché vous vaut davantage sur une réservation directe que sur un canal à forte commission.

**Mon tarif de rentabilité est-il plus haut en hiver ?**
En général oui, et c'est le piège saisonnier où tombe la plupart des hôtes. Le chauffage pousse votre coût par nuit vers le haut — souvent d'environ 13 $ à 22 $ pour un deux-pièces — ce qui relève le plancher d'environ 10 $ par nuit sur chaque durée de séjour. L'hiver est aussi le moment où la demande chute et où l'envie de remiser est la plus forte, alors les hôtes baissent les tarifs sous un plancher qui vient de monter, remplissent le calendrier de petites pertes et décident que l'hiver ne rapporte pas. Recalculez le plancher à chaque saison ; ne traînez pas votre chiffre d'été en janvier.

**Comment arrêter d'accepter automatiquement des réservations à perte ?**
Mettez le champ de prix minimum de votre plateforme à votre plancher d'une nuit — le plus élevé de tous — pour que le calendrier ne puisse physiquement pas vendre une nuit en dessous. Ajoutez ensuite des remises longue durée, pour que les réservations plus longues tarifent d'elles-mêmes vers leurs planchers plus bas. Cette combinaison refuse les perdantes et accepte les gagnantes sans que vous fassiez de math au moment où la demande arrive — précisément le moment où vous y êtes le moins préparé.

## Un avis tranché

La plupart des hôtes pensent que leur problème de tarif, c'est que leurs prix sont trop bas. En général, ce n'est pas ça. Le problème, c'est qu'ils n'ont jamais séparé les deux sortes de vide : la nuit que personne ne réserve, qui ne leur coûte rien, et la nuit qu'ils remplissent sous leur plancher, qui leur coûte de l'argent réel qu'ils ne voient plus ensuite parce que « au moins, c'était réservé ». La seconde se cache dans un calendrier plein et un taux d'occupation respectable — et c'est pourquoi beaucoup d'annonces occupées à 85 % dégagent moins que des annonces à 65 % tenues par quelqu'un qui connaît son plancher. Calculez le chiffre, posez-le en minimum, et laissez les nuits vides rester vides — c'était l'option la moins chère depuis le début.
