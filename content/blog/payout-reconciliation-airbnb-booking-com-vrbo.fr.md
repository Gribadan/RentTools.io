---
slug: payout-reconciliation-airbnb-booking-com-vrbo
locale: fr
title: "Rapprochement des versements : chaque réservation a-t-elle été payée ?"
excerpt: Airbnb, Booking.com et Vrbo versent en net, par lots et avec compensations. Un rapprochement mensuel de 30 minutes, et les cinq trous qu'il révèle.
status: published
tags:
  - host-tips:Conseils hôtes
  - airbnb:Airbnb
  - booking-com:Booking.com
  - taxes:Fiscalité
ogImageUrl: /blog-covers/payout-reconciliation-airbnb-booking-com-vrbo.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Ma première année d'hôte, j'ai retrouvé une carte virtuelle Booking.com 41 jours après le départ du voyageur. Trois nuits, 290 €, jamais débitées. Entre-temps, la carte avait expiré, le support partenaires n'a pas pu la réactiver, et le séjour pour lequel j'avais fait le ménage, lavé le linge et laissé un commentaire m'a rapporté exactement zéro. Pendant tout ce temps, mon solde bancaire avait l'air normal : douze autres versements étaient arrivés autour.

C'est tout le problème du « j'ai regardé le compte, ça va ». Les plateformes versent en net, par lots, parfois avec des semaines de retard, et compensent discrètement le remboursement de ce mois-ci sur un séjour du mois suivant. La seule façon de savoir que chaque nuit louée a été payée, c'est de rapprocher chaque réservation de l'argent qu'elle a produit. Pour deux appartements, cela me prend 30 minutes par mois, et mon pire mois, le rapprochement a retrouvé environ 570 $.

## TL;DR

- Le solde bancaire ne dit pas si chaque séjour a été payé. Le rapprochement, si.
- Trois colonnes par séjour : réservé (brut), attendu (net), reçu (banque).
- La clé de rapprochement est le numéro de confirmation, présent partout.
- Chaque semaine, 10 min pour les délais : cartes virtuelles, dégâts, no-shows.
- Chaque mois, 30 minutes pour les montants, avant clôture du relevé Booking.com.
- La plupart des mois, rien. Un mauvais mois rentabilise des années d'habitude.

## Pourquoi le solde bancaire ne dit pas si vous avez été payé

Un relevé bancaire est une liste de virements. Un calendrier de réservations est une liste de séjours. Les deux ne correspondent presque jamais ligne à ligne, pour quatre raisons.

**Du net, pas du brut.** Airbnb vire le sous-total hôte moins ses frais : 3 % en frais partagés, environ 15 % quand l'hôte paie seul. Payments by Booking.com vire le séjour moins une commission de 15 % (davantage avec Genius ou Preferred Partner) et des frais de paiement de 1,1 à 3,1 %. Vrbo prend 12 % tout compris à partir du 29 octobre. Personne ne vous vire le montant affiché sur la réservation.

**Par lots.** Booking.com paie en général tous les mois ou toutes les deux semaines, en un seul virement pour tous les séjours de la période. Cinq réservations deviennent une seule ligne sur le relevé. S'il en manque une dans le lot, le total reste vraisemblable.

**Avec compensation.** Si vous acceptez un remboursement sur Airbnb après le versement, Airbnb ne vous envoie pas de facture. Il prélève la somme sur le versement suivant, qui peut concerner un autre voyageur, un autre logement ou un autre mois. Ce séjour-là semble alors amputé de 45 $, et celui qui a tout déclenché a l'air parfaitement en règle.

**En retard, ou jamais.** Avec la carte virtuelle Booking.com, rien ne bouge tant que vous ne débitez pas la carte vous-même. Personne ne vous le rappelle. L'[article sur les délais de versement](/blog/airbnb-booking-com-payout-timing) détaille quand chaque plateforme libère l'argent ; le rapprochement sert à remarquer que ce calendrier n'a pas été tenu.

Ajoutez la conversion de devises, et l'écart entre « réservé » et « reçu » n'est jamais nul, même un mois où rien n'a déraillé.

## Les trois colonnes : réservé, attendu, reçu

Chaque séjour a une ligne et trois chiffres.

1. **Réservé** — le montant brut de la réservation : prix par nuit × nombre de nuits, plus les frais de ménage, avant tout frais de plateforme. Ce que le voyageur a vu.
2. **Attendu** — ce qui devrait vous parvenir après la part de la plateforme. Vous le calculez à partir de la grille de frais, pas à partir du versement.
3. **Reçu** — ce qui est réellement arrivé, rapproché par numéro de confirmation, pas par date ni par montant.

La clé compte plus que tout le reste. Les dates glissent à cause des lots, les montants à cause des compensations, mais le numéro de confirmation figure sur chaque rapport et chaque ligne de versement. Rapprochez d'abord par numéro, comparez ensuite les montants.

Comment calculer la colonne « attendu » par canal :

| Canal | Versement attendu | Où apparaissent les frais |
| --- | --- | --- |
| Airbnb, frais partagés | Sous-total hôte × 0,97 | Colonne frais de service du CSV des transactions |
| Airbnb, frais hôte uniquement | Sous-total hôte × 0,85 (vérifiez votre taux) | Même colonne, montant plus élevé |
| Payments by Booking.com | Séjour × (1 − commission − frais de paiement) | Déduits sur le relevé de versement |
| Booking.com, carte virtuelle | Montant total, débité par vous | Commission facturée à part, chaque mois |
| Vrbo, paiement à la réservation | Séjour × 0,88 à partir du 29 octobre | Déduits avant le versement |
| Réservation directe via Stripe | Séjour × 0,971 − 0,30 $ (cartes US) | Transactions du solde Stripe |

Avec la carte virtuelle, la commission n'est pas une déduction mais une facture mensuelle distincte. Elle a sa propre ligne dans le rapprochement : commission attendue contre commission facturée. C'est aussi là que se cachent la plupart des erreurs Booking.com, comme le montre le [calcul de la commission et de la TVA](/blog/booking-com-commission-vat-math).

Fixez une tolérance avant de commencer. J'accepte ±1 unité de devise d'arrondi sur les versements dans la même devise, et jusqu'à 3 % sur ceux avec conversion, parce que c'est là que se loge l'écart de change. Si ces 3 % vous agacent, c'est normal : l'[article sur la conversion des versements](/blog/airbnb-payout-currency-conversion-fee) explique comment arrêter de les payer.

## Où trouver chaque chiffre

Il vous faut un rapport par canal et un export bancaire. Aucun outil payant n'est nécessaire.

**Airbnb.** Menu → Revenus ouvre l'historique des transactions, exportable en CSV. Filtrez par date de versement sur le mois. Les lignes utiles : les lignes *Reservation* contiennent le numéro de confirmation, les nuits, les revenus bruts et les frais de service ; les lignes *Payout* indiquent quelles réservations sont parties dans quel virement ; les lignes *Adjustment* et *Resolution Payout* sont les remboursements et les indemnisations de dégâts. Lisez d'abord les ajustements. Ils expliquent la plupart des séjours Airbnb « incomplets » avant même que vous commenciez à chercher.

**Booking.com.** L'onglet Finances de l'extranet contient trois choses : le **relevé des réservations** mensuel (ce que Booking.com considère comme séjourné et sur quoi il prendra sa commission), les **factures** (la facture de commission elle-même) et, avec Payments by Booking.com, l'**aperçu des versements**, qui liste les réservations de chaque virement. Téléchargez les trois.

**Vrbo.** Le rapport des paiements du tableau de bord Vrbo indique, pour chaque réservation, le brut, les frais et le versement. Comme c'est la première saison avec la nouvelle structure à 12 %, vérifiez la colonne des frais ligne par ligne sur le premier relevé de novembre. L'[article sur la commission Vrbo](/blog/vrbo-12-percent-commission-math) explique pourquoi ce sont les réservations faites avant le 29 octobre qu'il faut surveiller.

**Réservations directes.** L'historique du solde Stripe montre chaque paiement, ses frais et le virement dans lequel il est arrivé. Les litiges et remboursements apparaissent en lignes négatives séparées.

**La liste des réservations elle-même.** C'est la colonne que la plupart des hôtes sautent, et c'est elle qui détecte l'argent manquant. Les rapports des plateformes ne montrent que ce que la plateforme sait payé ou facturé. Seule une liste de tous les séjours réellement accueillis, toutes sources confondues, vous dit qu'une ligne manque complètement. Si vos calendriers passent déjà par [RentTools](/onboard), le calendrier fusionné est cette liste : toutes les réservations Airbnb, Booking.com, Vrbo et directes, avec dates et source. Les flux iCal ne contiennent pas de prix, donc les montants viennent toujours des rapports des plateformes. Le calendrier vous dit quoi chercher.

## Un mois décortiqué : deux logements, seize séjours

Mon mois d'octobre : deux appartements, environ 7 600 $ de réservations. Le logement A tourne sur Airbnb et Payments by Booking.com. Le logement B ajoute un tarif Booking.com en carte virtuelle, Vrbo et quelques réservations directes.

| Source | Séjours | Attendu | Reçu | Écart | Explication |
| --- | --- | --- | --- | --- | --- |
| Airbnb | 7 | 3 259 $ | 3 214 $ | −45 $ | Remboursement accepté, compensé sur un versement ultérieur |
| Payments by Booking.com | 3 | 1 149 € | 1 149 € | 0 | Rapproché |
| Booking.com, carte virtuelle | 3 | 1 060 € | 676 € | −384 € | Une carte jamais débitée |
| Facture de commission Booking.com | — | 159,00 € | 194,40 € | −35,40 € | Séjour écourté facturé sur cinq nuits |
| Vrbo | 2 | 851 $ | 851 $ | 0 | Rapproché, ancien taux, réservé avant le 29/10 |
| Directe, Stripe | 1 | 466 $ | 466 $ | 0 | Rapproché |
| Réclamation dégâts | — | 120 $ | 0 $ | −120 $ | Plan de travail brûlé, pas encore déclaré |

Les écarts, un par un :

**Les 45 $ sur Airbnb** n'étaient pas perdus. La bouilloire d'un voyageur avait rendu l'âme, j'avais accepté un remboursement de 45 $ via le Centre de résolution, et Airbnb l'a prélevé sur le versement suivant, qui concernait un autre séjour. La ligne Adjustment du CSV l'a expliqué en dix secondes. Statut : expliqué, clos.

**Les 384 € de carte virtuelle** étaient de l'argent bien réel. Trois nuits sur le logement B, départ 19 jours plus tôt, carte jamais débitée : le séjour s'était terminé un dimanche, je regroupe les débits le lundi, et j'ai oublié. Selon le paramétrage, les cartes virtuelles Booking.com restent débitables environ 14 à 30 jours après le départ ; je l'ai donc débitée l'après-midi même, avec de la marge. Que faire si le débit est refusé : voir le [guide des cartes virtuelles](/blog/booking-com-virtual-card-declined). Statut : récupéré.

**Les 35,40 € de commission** venaient d'une voyageuse qui avait réservé cinq nuits à 118 € et était partie au bout de trois pour une urgence familiale. J'ai débité 354 € sur la carte virtuelle pour trois nuits, sans toucher au relevé des réservations. Booking.com a calculé la commission sur les 590 € d'origine : 88,50 € au lieu de 53,10 €. Un séjour écourté se corrige dans le relevé des réservations avant l'émission de la facture ; la date limite figure dans l'extranet, et elle est courte. Statut : corrigé à temps.

**Les 120 $ de dégâts** n'apparaissaient dans aucun rapport, et c'est justement le sujet. Sur les photos de départ de ma femme de ménage, on voyait une brûlure sur le plan de travail. Aucune ligne *Resolution Payout* correspondante, puisque je n'avais rien déclaré. AirCover exige une réclamation dans les 14 jours suivant le départ, et on était au neuvième. L'[article sur AirCover](/blog/airbnb-aircover-vs-booking-damage-deposit) explique pourquoi les photos datées tranchent ces dossiers. Statut : déclaré, payé trois semaines plus tard.

Au total, environ **570 $** récupérés ou évités, soit 7,5 % du mois. C'était mon pire mois. Un mois ordinaire, le rapprochement trouve une erreur d'arrondi et rien d'autre, et c'est très bien ainsi. On ne rapproche pas pour trouver de l'argent tous les mois. On rapproche pour repérer le mauvais mois pendant que les délais courent encore.

## Les cinq trous qui reviennent sans cesse

En deux ans, presque tous les écarts sont tombés dans l'une de ces cinq catégories :

1. **Les cartes virtuelles non débitées.** Le trou le plus cher et le plus fréquent sur Booking.com. La carte expire, l'argent part avec.
2. **Les relevés de réservations non corrigés.** Séjours écourtés, no-shows oubliés, annulation passée par un message du voyageur plutôt que par l'extranet. Booking.com facture la commission sur le relevé tel qu'il est. La fenêtre de 48 heures pour signaler un no-show est détaillée dans l'[article sur les frais de no-show](/blog/booking-com-no-show-fee).
3. **Les compensations qui ressemblent à des pertes.** Remboursements et ajustements Airbnb prélevés sur un versement sans rapport. Ce n'est pas de l'argent manquant, c'est de l'argent déjà comptabilisé. Lisez-les en premier pour ne pas perdre 20 minutes sur une fausse alerte.
4. **Les dégâts jamais réclamés.** Le rapprochement est le seul moment où vous comparez les notes de ménage avec ce qui a été payé. S'il y a un dégât et aucune ligne d'indemnisation, la réclamation n'a jamais été faite.
5. **Le mauvais taux.** Une commission qui a changé (Vrbo ce mois-ci), une remise Genius que vous pensiez désactivée, des frais hôte uniquement sur un logement et partagés sur l'autre. La colonne « attendu » les repère ; la colonne « reçu » seule ne les verra jamais.

Et un dernier, plus rare mais désagréable : un versement arrivé deux fois. Cela arrive quand une réservation est modifiée après le premier versement. Le rendre tout de suite coûte moins cher que de le voir repris sur un mois chargé.

## Le rythme : dix minutes par semaine, trente par mois

Les délais et les montants n'obéissent pas à la même horloge, alors je coupe le travail en deux.

**Chaque semaine, une dizaine de minutes, le lundi.** Uniquement ce qui a une échéance :

- Chaque carte virtuelle Booking.com d'un séjour déjà commencé : débitée ? (Validité : environ 14 à 30 jours.)
- Chaque départ des 14 derniers jours avec un dégât noté par la femme de ménage : réclamation déposée ?
- Chaque arrivée Booking.com des 48 dernières heures où personne n'est venu : no-show signalé ?

**Chaque mois, une trentaine de minutes.** Le rapprochement complet sur les trois colonnes. Je le fais en deux temps : le relevé des réservations Booking.com dans les premiers jours ouvrés du mois, avant la date limite de correction, puis les montants une fois le versement Booking.com arrivé, vers le milieu du mois. Tout le reste — Airbnb, Vrbo, Stripe — se rapproche au second passage.

Gardez le résultat. Un onglet de tableur par mois, une ligne par séjour, une colonne statut à quatre valeurs : *rapproché*, *expliqué*, *récupéré*, *passé en perte*. En fin d'année, cet onglet constitue votre dossier fiscal. Dans l'UE, les plateformes transmettent déjà vos revenus à l'administration fiscale au titre de [DAC7](/blog/dac7-airbnb-booking-tax-reporting) ; un hôte avec douze onglets rapprochés répond en quelques minutes à toute question sur un chiffre de cette déclaration. Sans eux, il faut reconstituer l'année à partir des lignes bancaires.

## FAQ

**Comment rapprocher les versements Airbnb de mon relevé bancaire ?**
Exportez l'historique des transactions depuis Menu → Revenus au format CSV et filtrez par date de versement. Chaque ligne Payout liste les réservations qu'elle contient, avec leur numéro de confirmation. Associez ces versements aux virements bancaires par montant et par date, puis comparez les revenus bruts et les frais de service de chaque réservation à ce que vous attendiez. Lisez d'abord les lignes Adjustment : elles expliquent la plupart des séjours qui semblent incomplets.

**Pourquoi mon versement Booking.com est-il inférieur au montant de la réservation ?**
Payments by Booking.com déduit la commission, en général 15 % et davantage avec Genius ou Preferred Partner, ainsi que des frais de paiement de 1,1 % à 3,1 %. Selon votre pays, la commission peut aussi être soumise à la TVA. Si l'écart dépasse ces trois postes, vérifiez le relevé des réservations : un séjour y figure peut-être pour un mauvais montant.

**Que se passe-t-il si j'oublie de débiter une carte virtuelle Booking.com ?**
La carte n'est débitable que pendant une période limitée après le départ, généralement 14 à 30 jours selon le paramétrage. Une fois expirée, il faut demander au support partenaires de la réactiver, et passé un certain délai, l'argent n'est plus récupérable. Vérifier chaque semaine les cartes virtuelles des séjours commencés est la solution la moins coûteuse.

**Peut-on corriger le relevé Booking.com quand un voyageur part plus tôt ?**
Oui, pendant la période de correction qui précède la facture mensuelle de commission. Modifiez la date de départ ou le montant dans le relevé des réservations, rubrique Finances de l'extranet. Si vous laissez passer la date limite, Booking.com facture la commission sur la réservation initiale et il faut passer par le support partenaires.

**À quelle fréquence un loueur en courte durée doit-il rapprocher ses versements ?**
Deux fois, sur deux horloges. Chaque semaine, une dizaine de minutes pour tout ce qui a une échéance : cartes virtuelles, réclamations de dégâts sous 14 jours, no-shows sous 48 heures. Chaque mois, une trentaine de minutes pour les montants, calées sur le relevé et le versement Booking.com. Deux logements et seize séjours me prennent environ une demi-heure au total.

**Faut-il un logiciel de comptabilité pour suivre ses revenus locatifs ?**
Non. Jusqu'à une vingtaine de logements, un tableur avec une ligne par séjour et trois colonnes de montants — réservé, attendu, reçu — suffit. L'essentiel est la clé de rapprochement : le numéro de confirmation, présent dans chaque rapport de plateforme. Un logiciel de comptabilité aide en fin d'année, mais il importera sans broncher un versement auquel il manque un séjour.

**Combien de temps conserver les relevés de versements ?**
Aussi longtemps que l'administration fiscale peut contrôler l'année : dans l'UE, en général de cinq à dix ans selon le pays, et en France six ans pour les documents fiscaux. Les plateformes transmettent vos revenus au fisc au titre de DAC7, et ce sont vos propres relevés rapprochés qui vous permettront d'expliquer n'importe quel chiffre déclaré.

## Un avis tranché

Les hôtes débattent pendant des semaines d'un écart de 3 % de frais entre plateformes, puis ne vérifient jamais si la plateforme a payé tout court. Une carte virtuelle oubliée, ce sont des frais de 100 % sur ce séjour. Le rapprochement n'est pas de la comptabilité pour le plaisir : c'est le seul contrôle que vous ayez sur un argent que quelqu'un d'autre encaisse pour vous. Si vous refusez d'y consacrer trente minutes par mois, vous n'avez pas choisi le canal le moins cher. Vous avez choisi de ne pas savoir.
