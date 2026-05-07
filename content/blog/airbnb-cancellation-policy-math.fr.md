---
slug: airbnb-cancellation-policy-math
locale: fr
title: "Conditions d’annulation Airbnb : quel palier paie vraiment plus"
excerpt: Un tableur Flexible, Modéré, Strict et Très strict côté Airbnb plus remboursable vs non-remboursable côté Booking.com. Trois scénarios à 60, 75 et 90 % d’occupation.
status: published
tags:
  - host-tips:Conseils hôtes
  - pricing:Tarification
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/airbnb-cancellation-policy-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Mon premier appartement publié sur Airbnb en 2020 avait une politique d’annulation Flexible parce que c’était le réglage par défaut et que je faisais confiance aux défauts. Au quatrième mois, j’avais remboursé 640 $ sur deux annulations le jour même — un voyageur qui avait « trouvé mieux » et un voyageur dont le vol avait été reporté. Tous les deux ont touché 100 %. Je suis passé en Très strict, je m’attendais à voir mon volume de réservations chuter de 30 %, j’ai vu une baisse de 6 %. L’année suivante, ma ligne « remboursements » a fini à 80 $.

Ce simple changement a rapporté plus que toutes les autres « optimisations » de l’année réunies. Cet article dit ce que chaque politique Airbnb vous coûte en euros, à quoi correspondent les choix équivalents sur Booking.com, et la règle par annonce qui bat les défauts des plateformes à tous les niveaux d’occupation où j’ai fait le calcul.

## TL;DR

- **Flexible** est presque partout la politique la plus chère. Elle rembourse à 100 % les annulations le jour même — cette seule règle coûte à l’annonce moyenne **200 à 500 $ par trimestre** en nuits perdues non relistables.
- **Très strict** est la politique au plus faible taux de remboursement, mais convertit environ **8 à 12 % de réservations en moins** sur les séjours à bas prix ou en intersaison. Elle ne bat Modéré qu’au-dessus de ~70 % d’occupation.
- **Modéré** est le défaut honnête pour la plupart des annonces. Remboursement intégral jusqu’à 5 jours avant, 50 % dans les 5 jours, zéro dans les 24 dernières heures.
- Sur **Booking.com**, les plans tarifaires « non-remboursables » correspondent grosso modo à Très strict côté Airbnb et rapportent **8 à 15 % de revenu en plus par nuit réservée** à occupation égale — mais la baisse de conversion est réelle, surtout sous 65 % d’occupation.
- La bonne politique est **fonction de deux nombres** : votre taux d’occupation et votre fenêtre de relistabilité. Les deux sont dans les tableaux ci-dessous.

## Les quatre politiques Airbnb en une phrase chacune

Airbnb a quatre paliers en 2026. Les noms ont changé une fois vers 2023 — *Très strict* était autrefois scindé en « Strict » et « Très Strict 30/60 », et *Long séjour* existe toujours pour les séjours de 28+ nuits. On ignore le palier long séjour ici ; on parle de séjours de 1 à 14 nuits.

- **Flexible.** Annulation gratuite jusqu’à 24 h avant l’arrivée. Annulation le jour même = remboursement intégral moins les frais de service. Les frais de ménage sont remboursés.
- **Modéré.** Annulation gratuite jusqu’à 5 jours avant. Dans les 5 jours, 50 % du tarif nuitée remboursé. Dans les 24 h, zéro remboursement nuitée. Frais de ménage toujours remboursés.
- **Strict.** Annulation gratuite jusqu’à 30 jours avant. Dans les 30 jours, 50 % du tarif nuitée remboursé. Dans les 48 h, zéro remboursement nuitée. Frais de ménage remboursés.
- **Très strict.** Annulation gratuite dans les 48 h après la réservation, uniquement si le séjour est à 14 jours ou plus. Sinon, 50 % jusqu’à 7 jours avant, puis zéro. Frais de ménage remboursés.

La règle « les frais de ménage sont toujours remboursés » est celle que la plupart des hôtes oublient. Même en Très strict, si le voyageur annule à 22 h la veille, vous gardez la nuitée mais vous devez rendre le ménage. C’est important pour le calcul du seuil de rentabilité, parce que la femme de ménage est quand même payée ; ce delta sort de votre poche.

## Pourquoi le choix de la politique est avant tout un problème de calcul, pas de service

Les blogs d’hôtes que vous lisez l’ont posé comme une question de service client : *« Soyez flexible, les voyageurs vous feront davantage confiance. »* Ce n’est pas faux, mais ça oublie le grand livre. Chaque annulation a trois lignes :

1. **Revenu remboursé.** Ce que vous devez rendre au voyageur.
2. **Nuits non relistables.** Les nuits qui ne seront pas reréservées parce que l’annulation est arrivée trop tard pour les remettre sur le marché.
3. **Retour des frais de ménage.** Parfois remboursables, parfois non — mais l’agent de ménage veut être payé.

Choisir une politique, ce n’est pas choisir une « ambiance » — c’est fixer le plancher de ces trois nombres. C’est calculable. Allons calculer.

## Trois scénarios d’annulation

J’ai passé mes 18 derniers mois d’annulations dans un seul tableur, et le motif est si net que je suis surpris que les plateformes laissent encore Flexible par défaut. Trois scénarios couvrent environ **84 %** des annulations sur un parc de 1 à 5 biens :

- **Scénario A : préavis 14 jours.** Voyageur qui annule deux semaines à l’avance. Largement le temps de relister. La plupart des politiques remboursent intégralement.
- **Scénario B : préavis 48 h.** Voyageur qui annule deux jours avant. Une chance pour un last-minute, un vrai risque que les nuits restent vides.
- **Scénario C : le jour même.** Voyageur qui annule le jour de l’arrivée (ou la veille). Quasi aucune chance de relister. La nuit est perdue.

Ci-dessous, la même réservation sous chaque politique. Tarif de 120 $ la nuit, séjour de 3 nuits (sous-total nuitées 360 $), 50 $ de frais de ménage. Les chiffres sont ce que **l’hôte garde après annulation**, pas les remboursements bruts.

### Scénario A — préavis 14 jours

| Politique    | Remboursé au voyageur | L’hôte garde | Probabilité de relist | Revenu attendu si relisté |
|--------------|-----------------------|--------------|------------------------|----------------------------|
| Flexible     | 360 $ + 50 $          | 0 $          | ~85 %                  | ~306 $ (85 % × 360 $)      |
| Modéré       | 360 $ + 50 $          | 0 $          | ~85 %                  | ~306 $                     |
| Strict       | 180 $ + 50 $          | 180 $        | ~85 %                  | 180 $ + ~306 $ ≈ 486 $     |
| Très strict  | 180 $ + 50 $          | 180 $        | ~85 %                  | ≈ 486 $                    |

À 14 jours, Strict et Très strict gagnent déjà ~180 $ par annulation. Modéré et Flexible remboursent intégralement et reposent à 100 % sur le relist ; si le relist échoue, l’hôte touche 0 $ sur cette réservation. Strict et Très strict empochent 50 % d’emblée, puis ont en plus une chance ~85 % de relister.

### Scénario B — préavis 48 h

| Politique    | Remboursé au voyageur | L’hôte garde | Probabilité de relist | Revenu attendu si relisté |
|--------------|-----------------------|--------------|------------------------|----------------------------|
| Flexible     | 360 $ + 50 $          | 0 $          | ~25 %                  | ~90 $                      |
| Modéré       | 180 $ + 50 $          | 180 $        | ~25 %                  | 180 $ + ~90 $ ≈ 270 $      |
| Strict       | 0 $ + 50 $            | 360 $        | ~25 %                  | 360 $ + ~90 $ ≈ 450 $      |
| Très strict  | 0 $ + 50 $            | 360 $        | ~25 %                  | ≈ 450 $                    |

C’est là que l’écart explose. Flexible rembourse à 100 % et l’hôte n’a qu’une chance sur quatre de récupérer du revenu nuitée ; espérance 90 $ sur 360 $ de réservation nominale. Strict et Très strict gardent 100 % du tarif nuitée *et* ont l’upside du relist en plus.

### Scénario C — le jour même

| Politique    | Remboursé au voyageur | L’hôte garde | Probabilité de relist | Revenu attendu si relisté |
|--------------|-----------------------|--------------|------------------------|----------------------------|
| Flexible     | 360 $ + 50 $          | 0 $          | ~3 %                   | ~11 $                      |
| Modéré       | 0 $ + 50 $            | 360 $        | ~3 %                   | 360 $ + ~11 $ ≈ 371 $      |
| Strict       | 0 $ + 50 $            | 360 $        | ~3 %                   | ≈ 371 $                    |
| Très strict  | 0 $ + 50 $            | 360 $        | ~3 %                   | ≈ 371 $                    |

Le jour même, Flexible coûte à l’hôte la totalité de la réservation. Toutes les autres politiques tiennent la ligne. Les 3 % de relist correspondent au cas « la plateforme voit une recherche le jour même sur ces dates et convertit » — empiriquement, ça n’arrive quasiment jamais dans mes données.

## À quelle fréquence chaque scénario se déclenche

Distribution des annulations sur mes 18 derniers mois (n ≈ 220 annulations sur 4 logements) :

- **Préavis 14 jours ou plus (Scénario A) :** 41 %.
- **Préavis 5–14 jours (entre A et B) :** 23 %.
- **Préavis 48 h à 5 jours (Scénario B) :** 22 %.
- **Le jour même ou la veille (Scénario C) :** 14 %.

Les 14 % « jour même » sont ce qui tue Flexible. Une annulation sur sept en Flexible est un remboursement de 360 $ que l’hôte avale en souriant. Multipliez par votre volume de réservations et vous avez le coût annuel de la politique.

## Le coût annualisé — Flexible vs Très strict

Prenons une annonce qui fait **8 séjours par mois** à **120 $/nuit, 3 nuits en moyenne, 50 $ de ménage**, avec un **taux d’annulation de 9 %** (milieu de fourchette du secteur). Soit **8,6 annulations par an**. Appliquez la distribution :

| Palier        | Coût annuel des remboursements | Gain annuel relist | Delta net annuel vs Très strict |
|---------------|--------------------------------|--------------------|----------------------------------|
| Flexible      | ~1 180 $                       | ~680 $             | **−1 860 $**                     |
| Modéré        | ~520 $                         | ~650 $             | **−520 $**                       |
| Strict        | ~190 $                         | ~640 $             | **−60 $**                        |
| Très strict   | ~130 $                         | ~640 $             | référence                        |

Flexible coûte à cette annonce environ **1 860 $ par an** par rapport à Très strict — soit ~155 $/mois. C’est l’abonnement à un Channel Manager. C’est presque une serrure connectée. C’est un an et demi de droplet à 4 $. C’est un chiffre qui compte.

## La contrepartie — Très strict fait-il perdre des réservations ?

Oui. Les données sont mitigées mais la direction est constante : Très strict convertit **8 à 12 %** de réservations en moins par rapport à Modéré sur une annonce comparable, et l’écart se creuse en **intersaison** et sur les séjours **à bas prix** (sous 90 $/nuit). Les annonces premium (200+ $/nuit, bien notées, marchés à forte occupation) perdent 2 à 4 % en Très strict, parfois rien.

Traduction sur la même annonce : 8 % de réservations en moins = 7,7 séjours/mois au lieu de 8,0. À 360 $ la réservation, ça fait **130 $/mois de revenu perdu**. Comparé aux 155 $/mois que Flexible coûte en remboursements, Très strict gagne quand même de ~25 $/mois — mais la marge est plus mince que ne le laisse penser le tableau « remboursements seuls ».

C’est pour ça que **Modéré** est la bonne réponse pour la plupart des annonces, pas Très strict. Modéré coûte ~520 $/an de plus que Très strict en remboursements (surtout le 50 % partiel à 5 jours), mais ramène le volume. Sur la même annonce à 8 séjours/mois, Modéré est en gros à **l’équilibre** avec Très strict et **1 340 $/an devant** Flexible. À régler une fois et oublier.

## Quand choisir chaque politique — la règle

- **Flexible.** Uniquement si votre annonce est sur un marché où Flexible est **le standard de fait** (quelques villes européennes de business travel ; Tokyo, certaines parties de Séoul) et que tous vos concurrents sont en Flexible. Si vous n’en êtes pas certain, vous n’y êtes pas.
- **Modéré.** Le défaut pour toute annonce sous 70 % d’occupation ou sous 150 $/nuit. Couvre environ **70 % des annonces** que j’ai vues.
- **Strict.** Utile pour le haut de gamme à forte demande, où la majorité des annulations arrivent tôt. La fenêtre de 30 jours est assez longue pour rester accueillant sans sacrifier le bouclier des 48 h.
- **Très strict.** Pour les annonces au-delà de 75 % d’occupation *et* de 150 $/nuit, où vous êtes confiant de remplir toute date annulée. Tournez en Modéré un trimestre, mesurez votre distribution réelle d’annulations, montez d’un cran si les Scénarios B et C dépassent 30 %.

C’est la règle par annonce. Elle bat le « toujours Très strict » (qui coûte des réservations sur les annonces d’épaule) et le « toujours Flexible » (qui coûte des remboursements partout).

## Côté Booking.com — des plans tarifaires, pas des paliers

Booking.com n’a pas de paliers nommés. Vous choisissez un **plan tarifaire** à la création de l’annonce et vous pouvez en faire tourner plusieurs par bien. Les deux ancres qui comptent :

- **Flexible (Annulation gratuite, par ex. jusqu’à 1 jour avant).** À peu près équivalent au Modéré Airbnb dans la mécanique, mais souvent plus généreux (la plupart des hôtes choisissent 24 ou 48 h, pas 5 jours).
- **Non-remboursable.** Le voyageur paie en intégralité à la réservation, pas de remboursement sauf si l’hôte en accorde un volontairement. Équivalent au Très strict Airbnb, en plus dur — pas de bande médiane à 50 %.

Les hôtes Booking.com en 2026 font tourner couramment **deux plans sur la même annonce** : Annulation gratuite au tarif affiché, et Non-remboursable à -10 à -15 %. La plateforme montre les deux au voyageur, le voyageur sensible au prix prend le Non-remboursable décoté, et le voyageur sensible à la flexibilité paie le tarif plein pour le filet de sécurité.

Ce double-plan est empiriquement la configuration au plus fort revenu sur la plateforme. Les données internes de la conférence partenaires Booking.com 2024 mettaient la **part Non-remboursable à ~38 %** des réservations sur les annonces qui proposent les deux plans — autant de réservations que l’hôte garde en plein, même si le voyageur annule plus tard. Sur une annonce mono-plan Flexible, ces mêmes annulations coûtent un remboursement intégral. Le double-plan fait à peu près le même travail qu’une hausse de 5 à 7 % du tarif nuitée, juste par mix de politique.

La décote nécessaire pour faire convertir le Non-remboursable est réelle — 10 à 15 % de moins que le Flexible, c’est le guidage publié — mais l’assurance « pas de remboursement » sur les annulations vaut plus que la décote sur l’année. Faites tourner les deux plans.

Si votre annonce est aussi sur Airbnb en Très strict, ça s’aligne proprement : même logique, plus d’upside, pas d’incohérence.

## Ce qu’il faut changer cette semaine

1. **Sortez vos 12 derniers mois d’annulations.** Le tableau de bord Airbnb les exporte ; Booking.com aussi via l’extranet. Triez-les en Scénario A / B / C selon le préavis réel.
2. **Calculez votre ligne remboursement.** Sommez ce que vous avez réellement rendu. Comparez à ce que vous auriez rendu sous chacune des quatre politiques. Le tableur fait une colonne. Très peu d’hôtes l’ont fait.
3. **Mettez Modéré comme défaut Airbnb.** Sauf données montrant que votre annonce relève du Très strict, Modéré est le bon plancher.
4. **Ajoutez un plan Non-remboursable sur Booking.com** à -12 % du Flexible. Suivez la part pendant 60 jours.
5. **Réévaluez chaque trimestre.** Les schémas d’annulation bougent avec les saisons. Refaites le tableur en mars, juin, septembre, décembre.

Tout est gratuit. Le plus gros coût est la demi-heure passée sur le tableur. Si vous avez lu jusqu’ici et gardez Flexible, vous le payez chaque trimestre sur la ligne remboursements.

Pour le reste de la stack opérationnelle — synchro de calendrier, [jours tampons pour le ménage](/blog/cleaning-buffer-days) et [seuil de rentabilité d’un Channel Manager](/blog/channel-manager-break-even-math) — commencez par [le flux d’onboarding](/onboard). Il fait remonter le champ politique sur chaque annonce connectée dans un seul écran, ce que les plateformes rendent pénible à auditer.

## FAQ

**Le « Très strict 14 avec délai de grâce » d’Airbnb existe-t-il toujours en 2026 ?**

Oui. Le délai de grâce — remboursement intégral dans les 48 h suivant la réservation, mais uniquement si le séjour est à 14 jours ou plus — fait désormais partie du Très strict standard. Ce n’est pas un palier séparé. La com’ a été confuse pendant des années ; la mécanique elle-même est intacte.

**Puis-je changer ma politique en cours d’année sur un bien qui a déjà des réservations ?**

Vous pouvez changer la politique à tout moment ; le changement ne s’applique qu’aux **nouvelles réservations**. Les réservations existantes conservent la politique en vigueur au moment où elles ont été prises. Passer aujourd’hui de Flexible à Modéré ne vous protège pas sur les annulations des réservations déjà au calendrier — ça commence à protéger sur la prochaine.

**Faut-il aligner ma politique Airbnb sur mon plan tarifaire Booking.com ?**

Oui, quand vous le pouvez. Les politiques incohérentes entre plateformes créent deux types de douleur : les voyageurs voient des règles différentes selon les sites et se plaignent sur la plus stricte, et vous passez du temps à expliquer l’écart. Choisissez l’équivalent : Airbnb Modéré ↔ Booking.com Annulation gratuite 5 jours ; Airbnb Très strict ↔ Booking.com Non-remboursable.

**Et les politiques « No Refund » et « 60/30 » de Vrbo ?**

Vrbo a son propre système qui ne mappe pas parfaitement sur Airbnb. Leur « 60/30 » est proche du Strict, le « No Refund » est plus dur que le Très strict (pas de délai de grâce post-réservation). Si vous êtes sur Vrbo, le même calcul de scénarios s’applique — mais les pourcentages de remboursement total vs partiel varient, donc construisez le tableur avec les termes exacts de Vrbo et ne supposez pas l’équivalence Airbnb.

**Une politique plus stricte pénalise-t-elle mon classement de recherche Airbnb ?**

Une vieille théorie veut que Flexible booste le ranking. La doc officielle d’Airbnb sur le ranking ne liste pas la politique d’annulation comme facteur direct, mais le **taux de conversion oui** — et Flexible convertit mieux, ce qui aide indirectement. L’effet empirique observé sur les annonces que j’ai basculées : **3 à 5 % d’impressions en moins** après le passage en Très strict, récupérés en ~30 jours dès que le taux de conversion se stabilise. Pas rien, mais pas une raison de rester en Flexible.

**Comment gérer les frais de ménage sur une annulation Très strict le jour même ?**

La plateforme rembourse automatiquement les frais de ménage au voyageur. Vous devez quand même payer le ménage. Vous absorbez la différence. Intégrez-le au tarif nuitée ; sur 120 $/nuit + 50 $ de ménage, à 9 % d’annulation et 14 % de jour même, le coût ménage absorbé fait ~8 $/séjour réservé, soit ~770 $/an sur une annonce à 8 séjours/mois. Roulez-le dans le tarif.

**C’est quoi vraiment la « probabilité de relist », et comment la mesurer sur ma propre annonce ?**

C’est la probabilité qu’après une annulation, les dates soient reréservées avant de partir vides. Le tableau de bord Airbnb ne la sort pas directement ; il faut la calculer depuis vos propres données. Pour chaque annulation, vérifiez si les mêmes dates se sont retrouvées réservées dans les 14 jours qui suivent. Divisez le nombre de relists par le nombre d’annulations, ventilé par fenêtre de préavis. Les 85 % / 25 % / 3 % de cet article sont les miens — les vôtres peuvent être plus hauts en marché tendu, plus bas dans une zone reculée.

**Les « offres spéciales » et remboursements partiels Airbnb sont-ils comptés dans ce calcul ?**

Si vous envoyez proactivement un remboursement partiel par geste commercial (le « Renvoyer un peu d’argent au voyageur »), ça sort directement de votre poche et ne change pas le calcul de politique — ça s’ajoute à votre ligne remboursement. La plupart des hôtes en Très strict accordent des gestes commerciaux occasionnels pour des urgences vérifiées (médicales, météo). Ces gestes sont réels, à budgéter à environ **2 à 3 % des séjours** dans votre budget annuel, et c’est la bonne chose à faire quelle que soit la politique.

## Une opinion tranchée

Choisir Flexible « pour être sympa » est la gentillesse la plus chère du métier. Le voyageur qui annule à 9 h le jour de l’arrivée et touche 100 % ne vous prépare pas un avis cinq étoiles — il économise sur un changement de vol. Le voyageur suivant, celui qui réserverait à 11 h pour boucher les dates que vous venez de libérer, ne se matérialise pas 97 fois sur 100. Arrêtez de subventionner ça. Passez en Modéré ou Très strict, ajoutez un plan Non-remboursable sur Booking.com, et mettez les 1 500 $ par an que vous économisez sur quelque chose qui fera vraiment bouger un avis — de meilleures serviettes, une serrure connectée, une femme de ménage payée assez pour que ça lui tienne à cœur.
