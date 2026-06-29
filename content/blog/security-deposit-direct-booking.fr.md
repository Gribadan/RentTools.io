---
slug: security-deposit-direct-booking
locale: fr
title: "Caution pour une réservation directe : bloquer, pas débiter"
excerpt: Une caution sur une réservation directe n'est pas un débit, mais un blocage Stripe. La fenêtre de 7 jours qui la dévore, le bon montant et le piège du chargeback.
status: published
tags:
  - host-tips:Conseils aux hôtes
  - pricing:Tarification
  - tools:Outils
ogImageUrl: /blog-covers/security-deposit-direct-booking.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Au printemps dernier, un voyageur a fêlé la plaque de cuisson en verre lors d'une réservation directe — une pièce à 190 $ plus une heure d'installateur. Je suis allé capturer la caution que j'étais sûr d'avoir prise à la réservation, trois semaines plus tôt. Il n'y avait rien à capturer. La pré-autorisation avait expiré sans bruit au bout de sept jours, deux semaines avant que le voyageur ne tourne la clé, et je ne l'avais pas vu parce que le tableau de bord affichait encore « autorisé » — jusqu'à ce que je clique et lise la mention. J'ai payé les 190 $ de ma poche. La mécanique de la caution avait fonctionné exactement comme prévu. C'est moi qui n'avais pas compris comment elle était prévue.

Voici l'article dont j'aurais eu besoin cette semaine-là : ce qu'est réellement une caution sur une réservation directe, pourquoi c'est un blocage et non un débit, quelle unique fenêtre décide si elle est là au bon moment, et comment une caution mal prise mène à un chargeback qui coûte plus cher que le dégât.

## TL;DR

- Une caution sur réservation directe est un **blocage (autorisation)**, pas un débit — vous ne la capturez que s'il y a casse.
- Un blocage Stripe à capture manuelle **expire au bout de 7 jours**. Posez-le 1 à 2 jours avant l'arrivée, jamais à la réservation.
- Vous pouvez capturer une **partie** (la réparation réelle) et libérer le reste — mais jamais *plus* que ce que vous avez bloqué.
- Ne bloquez rien et vous n'avez aucun levier ; capturez trop et vous vous attirez un [chargeback](/blog/chargeback-direct-booking-dispute).
- Dimensionnez-la sur votre *pire incident isolé réaliste* — **200 à 300 $** pour un studio standard, davantage pour les animaux ou les biens haut de gamme.
- Pour la plupart des petits hôtes, la **carte enregistrée** (débiter seulement en cas de dégât) ou une **franchise de dégâts non remboursable** battent le blocage.

## Pourquoi une plateforme ne vous a jamais fait y penser

Airbnb a supprimé la caution côté voyageur en 2019 et intégré la protection à AirCover — un remboursement contractuel, pas un blocage que vous pilotez. Booking.com vous laisse fixer une « caution dégâts », mais l'autorisation passe par les rails de la plateforme et se libère automatiquement sous 7 à 14 jours, sauf si vous signalez le dégât dans l'extranet. Dans les deux cas, la mécanique de paiement n'est pas la vôtre. [Voici ce que chaque dispositif de plateforme verse réellement](/blog/airbnb-aircover-vs-booking-damage-deposit), abattements pour vétusté compris.

Le jour où vous acceptez une [réservation directe](/blog/direct-booking-website-math), tout cela disparaît. Pas d'AirCover, pas de bouton dans l'extranet, pas d'équipe de litiges. « Prendre une caution » cesse d'être une case à cocher et devient une chose que vous construisez vous-même — le plus souvent sur Stripe. Et la première chose que vous apprenez : le mot « caution » induit en erreur. Vous ne collectez pas d'argent. Vous posez un blocage.

## Un blocage n'est pas un débit — et votre voyageur doit le savoir

C'est la mécanique la plus mal comprise de la réservation directe, par les hôtes comme par les voyageurs.

Quand vous posez une caution de 400 $ via un prestataire de paiement, vous lancez une **autorisation** de 400 $. La banque vérifie que la carte est valide et provisionnée, puis réduit la limite disponible du voyageur de 400 $. Aucun argent ne bouge. Rien n'arrive sur votre compte. C'est une réserve sur son solde — comme l'empreinte qu'un hôtel ou une station-service pose.

L'argent ne bouge que lorsque vous **capturez** l'autorisation — et vous ne le faites que s'il y a dégât. Sans dégât, vous laissez le blocage expirer ou vous l'annulez, et les 400 $ de marge reviennent sur la carte du voyageur. Vous ne payez aucune commission, car aucun débit n'a eu lieu. Le pourcentage de Stripe ne s'applique qu'aux montants capturés.

Deux choses mordent ici si vous sautez la communication avec le voyageur :

- **Un blocage reste visible.** Sur la plupart des cartes, une autorisation de 400 $ apparaît comme une ligne *en attente* sur le relevé, et le solde disponible du voyageur chute de 400 $ le temps du séjour. Pour un voyageur non prévenu, cela se lit « vous m'avez débité 400 $ ». Le message paniqué à 21 h est garanti. Dites par écrit, avant de poser le blocage, que c'est une réserve remboursable qui disparaîtra d'elle-même.
- **Avec les cartes de débit, c'est pire.** Beaucoup de banques traitent une autorisation sur carte de débit comme un débit immédiat — elles retirent réellement les 400 $ du compte et les remboursent des jours plus tard à la libération. Pour un voyageur qui vit au plus près de son solde, c'est un vrai problème. Prenez les cautions sur cartes de crédit quand vous le pouvez ; pour le débit, envisagez un blocage plus petit ou une franchise.

## La fenêtre de sept jours qui a mangé ma caution

Voici le piège qui m'a coûté la plaque de cuisson.

Un PaymentIntent Stripe à capture manuelle — la façon standard de poser un blocage — **reste capturable sept jours**. Capturez dans cette fenêtre et tout marche. Laissez la fenêtre se fermer et Stripe annule l'autorisation automatiquement ; le blocage est parti, et il ne reste rien à capturer.

Regardez maintenant la chronologie d'une réservation normale. Un voyageur réserve le 1er pour un séjour démarrant le 22. Si vous posez le blocage à la réservation — ce qui semble responsable — il expire le 8. Deux semaines pleines avant l'arrivée, votre caution s'est évaporée sans bruit. Un dégât le 23 n'a rien derrière lui. C'est exactement ce qui m'est arrivé.

Le correctif est une discipline de calendrier, pas une caution plus grosse :

- **Posez le blocage 1 à 2 jours avant l'arrivée.** Assez tard pour couvrir le séjour, assez tôt pour attraper une carte refusée avant que le voyageur ne soit à la porte.
- **Capturez (ou libérez) dans les 48 heures après le départ.** Inspectez, décidez, agissez. Ne laissez pas le blocage filer jusqu'au septième jour en espérant vous en occuper.
- **Automatisez le rappel.** Ce qui gère votre calendrier doit vous pinger pour poser le blocage la veille de l'arrivée. Le faire de mémoire, c'est le moyen sûr de payer la plaque vous-même.

Si vos séjours dépassent régulièrement sept nuits, un seul blocage ne couvrira de toute façon pas tout le séjour — la fenêtre expire en plein milieu. C'est le cas où la carte enregistrée (ci-dessous) cesse d'être optionnelle.

## Combien bloquer réellement

L'instinct est d'arrimer la caution à la valeur de tout ce qu'il y a dans le logement. C'est le mauvais point d'ancrage. Vous ne remplacerez jamais tout le logement avec une seule caution, et un blocage assez gros pour l'essayer fait fuir les bons voyageurs et bute sur les plafonds de carte. Dimensionnez-le sur votre **pire incident isolé réaliste** — ce qui tourne vraiment mal, pas la catastrophe qui relève de l'assurance.

| Type de bien | Dégât isolé typique | Montant à bloquer |
| --- | --- | --- |
| Studio standard, sans animaux | Tache sur le canapé, verre cassé, clés perdues | 200 à 300 $ |
| 2–3 pièces familiales | Idem plus électroménager, petite reprise de mur | 300 à 500 $ |
| Accepte les animaux | Tapis, parquet rayé, ménage en profondeur | +150 à 250 $ en plus |
| Haut de gamme / design | Mobilier remarquable, électronique, art | 500 à 1 000 $ |
| Risque de fête (grand groupe, week-end férié) | Suroccupation, amendes de bruit, nettoyage post-fête | 1 000 à 2 000 $ |

Deux règles de calibrage. D'abord, la caution doit couvrir confortablement les événements **de la taille d'une franchise** — la tache à 150 $, la plaque à 190 $ — car ce sont eux qui arrivent et dont aucun assureur ne s'occupera. Ensuite, gardez la caution sous environ **50 % de la valeur de la réservation** pour un séjour normal ; au-delà, les voyageurs y lisent un signal d'alarme et réservent le logement d'à côté qui ne le demande pas.

## Capturez exactement ce qui a cassé — et pas un centime de plus

Quand un dégât survient, vous ne capturez pas tout le blocage. Vous capturez la réparation.

Stripe permet une **capture partielle** de l'autorisation : 400 $ bloqués, 190 $ capturés pour la plaque, et les 210 $ restants sont libérés automatiquement au voyageur. Vous pouvez capturer moins que le bloqué, mais **jamais plus** — et c'est la vraie raison de dimensionner le blocage sur le pire cas, pas sur la moyenne. Une seule capture ; pas de deuxième morsure sur la même autorisation.

Avant de capturer un seul dollar :

- **Photographiez le dégât avec horodatage**, idéalement face aux photos datées du départ. Sans preuve datée, une capture contestée devient un pile ou face.
- **Annoncez le coût réel** — la pièce, la main-d'œuvre, le justificatif. Une caution est le remboursement d'une perte réelle, pas une amende. Capturer 400 $ pour une réparation de 190 $ est le moyen le plus rapide de transformer un voyageur en contestataire.
- **Écrivez d'abord au voyageur** — avec les photos et le montant, avant la capture. La plupart des voyageurs raisonnables acceptent 190 $ documentés. Presque aucun n'accepte 400 $ silencieux découverts sur le relevé.

La commission (≈2,9 % + 0,30 $ aux États-Unis, plus basse sur les cartes européennes) ne s'applique qu'au capturé, donc capturer 190 $ vous coûte environ 5,80 $ — une erreur d'arrondi face à la réparation.

## Le piège du chargeback

Voici où une caution peut coûter plus cher que le dégât. Au moment où vous capturez une autorisation que le voyageur conteste, vous entrez en territoire de chargeback — et sur une réservation directe, **c'est vous le commerçant (merchant of record)**, pleinement exposé. Le prestataire retire le montant capturé plus des frais à la seconde où le litige s'ouvre, avant que quiconque ne lise votre version. J'ai écrit tout le [guide chargeback pour les réservations directes](/blog/chargeback-direct-booking-dispute) à part, mais deux points comptent spécialement pour les cautions :

- Une caution capturée qu'un voyageur conteste en « je n'ai pas autorisé ça » est une **fraude amicale**, et vous ne la gagnez qu'avec un contrat de réservation signé qui détaille la caution, des photos datées du dégât et la preuve du séjour. Réunissez les trois avant de capturer — ou ne capturez pas.
- Activez **3-D Secure** sur le paiement initial. Cela transfère la responsabilité de la fraude à la banque émettrice et rend le litige « je n'ai jamais réservé » bien plus dur à gagner contre vous.

L'asymétrie est toute la leçon : une capture de 190 $ que vous ne pouvez pas défendre devient un retrait de 190 $ plus des frais de litige de 15 $ plus du temps, et un taux de litiges écorné chez votre prestataire. Ne capturez que ce que vous pouvez prouver.

## Les deux alternatives plus propres

Pour beaucoup de petits hôtes, un blocage remboursable est plus de friction et de risque que ne le justifie le dégât rare. Deux alternatives que j'utilise désormais plus que le blocage lui-même :

**Carte enregistrée, débiter seulement au besoin.** Au lieu d'autoriser un blocage, vous enregistrez la carte du voyageur à la réservation (Stripe SetupIntent) avec son consentement explicite, et vous débitez *hors session* uniquement si un dégât apparaît après le départ. Pas de fenêtre de sept jours, pas de blocage inquiétant sur le relevé, fonctionne pour les longs séjours. Le revers : un débit hors session, voyageur parti, est la façon la *plus* exposée au chargeback de collecter, donc votre contrat de réservation doit l'autoriser en clair et il vous faut les mêmes preuves photo. Moins de friction à l'entrée, plus de risque à la sortie.

**Une franchise de dégâts non remboursable.** Un montant fixe — typiquement 39 à 75 $ — que le voyageur paie à la réservation à la place d'une caution, et qui couvre les dégâts accidentels jusqu'à un plafond. C'est le modèle de la Property Damage Protection de Vrbo. Les voyageurs le préfèrent (pas de blocage, pas de coup sur le solde), c'est du revenu et non un passif, et des assureurs tiers (Superhog, Waivo et similaires) administrent la franchise et règlent les sinistres contre une part par réservation. Vous abandonnez l'effet dissuasif d'une vraie caution, mais vous abandonnez aussi les tickets de support et l'exposition au chargeback. Pour un logement standard sous 250 $ la nuit, le calcul penche d'ordinaire vers la franchise.

## Un exemple chiffré, du début à la fin

Un voyageur direct réserve 4 nuits à 180 $ — 720 $ plus 60 $ de frais de ménage, 780 $ au total. Vous fixez une caution de dégâts de 300 $, indiquée dans le contrat de réservation signé.

1. **À la réservation :** vous débitez les 780 $ du séjour (3-D Secure activé) et enregistrez la carte. Vous ne posez **pas** encore le blocage.
2. **La veille de l'arrivée :** vous posez une autorisation de 300 $ à capture manuelle. Elle passe ; le voyageur voit un blocage en attente de 300 $ et votre message expliquant qu'il est remboursable.
3. **Départ :** vous inspectez le jour même. Une tache de vin sur le tapis nécessite un nettoyage à 40 $.
4. **Vous capturez 40 $**, envoyez au voyageur la photo du justificatif, et les 260 $ restants sont libérés. Commission sur la capture : environ 1,46 $.
5. **Au final :** vous êtes à l'équilibre sur le tapis, le voyageur a perdu 40 $ qu'il accepte parce qu'il a vu la preuve, et le blocage a expiré comme il devait — capturé, documenté, sans litige.

La version où ça tourne mal est identique, sauf que vous avez posé le blocage à la réservation le 1er, qu'il a expiré le 8, et que le jour du départ il n'y avait pas 300 $ à toucher. Même caution, même voyageur, même tache — et les 40 $, c'est vous qui les payez. Ce qui décide, ce n'est pas le montant. C'est le calendrier.

## FAQ

**Puis-je prendre une caution sur une réservation directe via Stripe ?**
Oui. Vous posez un PaymentIntent à capture manuelle (un blocage-autorisation) du montant de la caution, et vous ne le capturez qu'en cas de dégât. C'est la façon standard dont les hôtes en réservation directe gèrent les cautions sans plateforme. La caution est distincte du paiement du séjour lui-même.

**Combien de temps dure un blocage Stripe ?**
Sept jours pour les paiements par carte. Ensuite Stripe annule l'autorisation automatiquement et le blocage disparaît. C'est pourquoi on le pose un à deux jours avant l'arrivée, pas à la réservation : un blocage posé des semaines à l'avance expire avant même l'arrivée du voyageur.

**Un blocage débite-t-il la carte du voyageur ?**
Sur une autorisation, aucun argent ne bouge. La limite disponible du voyageur chute du montant bloqué et une ligne en attente peut apparaître sur le relevé, mais rien n'arrive sur votre compte et aucune commission n'est due avant la capture. S'il n'y a pas de dégât, vous libérez et le solde revient.

**Quel montant pour une caution de location saisonnière ?**
Dimensionnez-la sur le pire incident isolé réaliste, pas sur la valeur de tout ce qu'il y a dans le logement. Un studio standard est à 200–300 $ ; les biens acceptant les animaux et le haut de gamme justifient plus. Gardez-la sous environ la moitié de la valeur de la réservation pour un séjour normal, sinon les voyageurs y lisent un avertissement.

**Que se passe-t-il si je ne capture pas le blocage à temps ?**
L'autorisation expire au bout de sept jours et il ne reste rien à capturer — la caution disparaît simplement : pas de débit pour le voyageur, pas d'argent pour vous. Si la fenêtre est ratée et qu'il y a dégât, votre seul recours est un nouveau débit hors session sur une carte enregistrée, que le voyageur conteste plus facilement.

**Le voyageur peut-il contester une caution capturée ?**
Oui, et sur une réservation directe c'est vous le commerçant, donc le litige est le vôtre. Une caution capturée contestée est une fraude amicale ; vous la gagnez avec un contrat de réservation signé, des photos datées du dégât et la preuve du séjour. Ne capturez que ce que vous pouvez documenter, et seulement le coût réel de la réparation.

**Une franchise de dégâts vaut-elle mieux qu'une caution ?**
Pour la plupart des petits hôtes, oui. Une franchise non remboursable (39 à 75 $) que le voyageur paie à la réservation supprime le blocage, la fenêtre de sept jours et l'essentiel du risque de chargeback, et c'est du revenu plutôt qu'un passif. Vous perdez l'effet dissuasif d'une vraie caution mais gagnez bien moins de tracas de support.

**Puis-je bloquer une caution sur une carte de débit ?**
Vous pouvez, mais beaucoup de banques traitent une autorisation sur débit comme un retrait immédiat et la remboursent des jours plus tard, ce qui pince vraiment un voyageur qui vit au plus près de son solde. Préférez les cartes de crédit pour les blocages ; pour les voyageurs en débit, utilisez un blocage plus petit, une franchise ou la carte enregistrée.

## Un avis tranché

Pour un logement standard sous environ 250 $ la nuit, renoncez complètement au blocage remboursable. La fenêtre de sept jours, les messages paniqués des voyageurs, l'exposition au chargeback et le jour où vous oubliez de le poser coûtent, au total, plus cher que le dégât rare qu'une caution récupère vraiment. Réservez les vrais blocages aux animaux, aux grands groupes et aux biens haut de gamme, où le risque est réellement grand — et pour tout le reste, enregistrez la carte, inscrivez une clause de dégâts claire dans le contrat de réservation, et ne débitez que lorsque quelque chose casse. Si vous montez tout juste vos réservations directes, [construisez d'abord le reste de la pile](/onboard) ; la caution est la dernière chose à visser, pas la première.
