---
slug: airbnb-rating-recovery-math
locale: fr
title: "Note Airbnb : combien de cinq étoiles effacent un mauvais commentaire"
excerpt: Un mauvais commentaire fait chuter votre note Airbnb en quelques secondes ; remonter est un calcul fixe — combien de cinq étoiles pour en effacer un, selon la taille du logement.
status: published
tags:
  - airbnb:Airbnb
  - host-tips:Conseils aux hôtes
  - guest-comms:Communication avec les voyageurs
ogImageUrl: /blog-covers/airbnb-rating-recovery-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

En mars, un voyageur m'a mis une étoile. Le logement tenait à 4,90 sur 20 séjours — un studio propre et sans histoire qui n'était jamais descendu sous les cinq étoiles, sauf pour une bouilloire cassée. Un commentaire, une nuit, un voyageur furieux que l'immeuble n'ait pas d'ascenseur — et le lendemain matin la page du logement affichait 4,71. J'ai alors fait ce que fait chaque hôte : j'ai ouvert un tableur et je me suis demandé combien de séjours parfaits il fallait pour revenir à 4,90. La réponse n'était pas celle que j'attendais, et elle est la même que vous ayez 20 commentaires ou 2000.

Ce billet, c'est ce tableur. L'arithmétique exacte de la chute qu'un mauvais commentaire vous inflige, du nombre de séjours impeccables qu'il faut pour remonter, et de la raison pour laquelle les logements les mieux notés se rétablissent le plus lentement.

## TL;DR

- Un commentaire déplace la moyenne de `(P − k) / (N + 1)` — la chute rétrécit vite quand le nombre d'avis `N` grimpe.
- La ligne Superhôte de 4,80 n'est menacée que sur les **petits logements**. Passé ~50 avis, une étoile ne la casse plus.
- Restaurer votre **ancienne** moyenne est fixe : `(P − k) / (5 − P)` séjours cinq étoiles — indépendant de `N`.
- À 4,90, une étoile coûte **39 séjours impeccables**. À 4,95, c'est **79**. Note plus haute, rétablissement plus lent.
- À ~5 avis par mois, 39 séjours propres, c'est **environ huit mois** de cinq étoiles sans rupture.
- Une suppression accordée efface toute la dette en cinq minutes. Visez la suppression d'abord, le rétablissement ensuite.

## La seule formule qui compte

La note globale Airbnb est une moyenne arithmétique toute simple : additionnez les notes globales de tous les voyageurs, divisez par le nombre de notes. C'est tout. Aucune décote dans le temps, aucun poids selon la fraîcheur, aucune recette secrète. Ce qui rend le tout prévisible avec des maths de sixième.

Disons que votre logement est à une moyenne `P` sur `N` avis. Un nouveau commentaire de `k` étoiles arrive. Votre nouvelle moyenne est :

```
nouvelle moyenne = (P × N + k) / (N + 1)
```

Deux choses en découlent aussitôt. D'abord, un mauvais commentaire fait mal en proportion de son écart sous votre moyenne — une étoile sur un logement à 4,90 est un choc de 3,90 points, quatre étoiles seulement de 0,90. Ensuite, les dégâts sont divisés par votre nombre d'avis plus un. Un logement à 20 avis encaisse la même étoile dix-neuf fois plus fort qu'un logement à 400.

Passons au rétablissement. Vous avez encaissé un coup de `k` étoiles et vous voulez revenir à votre `P` d'origine. Combien de séjours cinq étoiles supplémentaires cela demande-t-il ? Remettez la moyenne à `P` et résolvez :

```
cinq étoiles pour restaurer P  =  (P − k) / (5 − P)
```

Le `N` disparaît. **Le nombre de séjours impeccables pour effacer un mauvais commentaire ne dépend pas du nombre d'avis que vous avez.** Un logement à 20 avis et un logement à 2000, à la même note de 4,90, réclament exactement le même nombre de séjours propres pour effacer le même commentaire. Le gros logement bronche à peine le jour de la chute — et il met tout aussi longtemps à cicatriser complètement.

L'intuition : chaque cinq étoiles ne vous achète que `(5 − P)` de marge — sur un logement à 4,90, un séjour parfait ne vaut que 0,10 au-dessus de votre ligne. Le mauvais commentaire vous a mis dans un trou de `(P − k)`. Rembourser une dette fixe par des versements fixes prend un nombre fixe de versements, quelle que soit la taille de votre solde.

## Trois logements, une étoile

Voici la même étoile qui tombe sur trois logements, tous à 4,90 avant le coup. La seule différence est le nombre d'avis que chacun avait mis de côté.

| Avis avant l'étoile | Nouvelle moyenne | Chute | Ligne Superhôte 4,80 |
| --- | --- | --- | --- |
| 20 | 4,71 | −0,19 | Perdue |
| 50 | 4,82 | −0,08 | Sauve |
| 100 | 4,86 | −0,04 | Sauve |
| 200 | 4,88 | −0,02 | Sauve |

Le logement à 20 avis passe sous le seuil Superhôte et perd le badge au prochain recalcul trimestriel. Ceux à 50, 100 et 200 non — ils portent assez de lest cinq étoiles pour qu'une seule étoile ne puisse pousser la moyenne brute sous 4,80. (Airbnb stocke la moyenne brute à deux décimales et l'affiche arrondie à une, donc 4,82 s'affiche « 4,8 » mais reste bien au-dessus du seuil de 4,80. Toute la mécanique de cette falaise est dans [« Superhôte Airbnb : les quatre seuils »](/blog/airbnb-superhost-requirements-math).)

Premier mythe à abattre : **un mauvais commentaire ne vous « coûte pas le Superhôte » sur un logement mûr.** Il coûte le Superhôte sur un logement *jeune*. Au-delà d'environ 50 avis à 4,90, une étoile isolée est une bosse cosmétique sur le chiffre, pas un événement pour le badge. La panique est réelle ; le risque pour le badge, en général, non.

Le cas des 20 avis, lui, brûle. Pour ramper jusqu'à la ligne des 4,80 — pas vos anciens 4,90, juste la ligne du badge — ce logement a besoin de **9 séjours cinq étoiles d'affilée** (99 ÷ 21 remonte à 144 ÷ 30 = 4,80, pile au neuvième). Pour revenir tout en haut à 4,90, il en faut 39. Ce sont deux lignes d'arrivée distinctes, et les confondre est exactement l'endroit où les hôtes soit surpaniquent, soit sous-réagissent.

## Le tableau de la dette de note

Comme le rétablissement vers l'ancienne moyenne est indépendant du nombre d'avis, il tient sur une carte de visite. Voici ce que coûte un mauvais commentaire, en séjours impeccables, selon la moyenne de départ :

| Votre moyenne avant | Cinq étoiles pour la restaurer entièrement après une étoile |
| --- | --- |
| 4,95 | 79 |
| 4,90 | 39 |
| 4,85 | 26 |
| 4,80 | 19 |
| 4,70 | 13 |

Relisez la première ligne. Un logement à **4,95** a besoin de **79 séjours parfaits** pour absorber une seule étoile, contre 13 pour un logement à 4,70. Plus la note est haute, plus un mauvais commentaire coûte cher à effacer — parce qu'il reste moins de marge par cinq étoiles. Un logement à 4,95 ne gagne que 0,05 par séjour parfait ; un logement à 4,70 en gagne 0,30. Voilà la part contre-intuitive que les hôtes ne voient jamais venir : **limer votre note vers 5,0 vous rend plus fragile, pas plus solide.** Plus vous êtes près du plafond, plus le rétablissement après la chute est long.

Et cela dépend beaucoup de la note basse que vous avez récoltée. Même logement à 4,90, commentaires différents :

| Le commentaire reçu | Cinq étoiles pour l'effacer (depuis 4,90) |
| --- | --- |
| 1 étoile | 39 |
| 2 étoiles | 29 |
| 3 étoiles | 19 |
| 4 étoiles | 9 |

Quatre étoiles — que la plupart des hôtes ne rangent même pas dans les « mauvais » commentaires — coûtent quand même neuf séjours parfaits à effacer d'un logement à 4,90. C'est pourquoi les hôtes qui courent après un affichage à 4,9+ traitent les quatre étoiles comme des échecs : à cette altitude, quatre étoiles est un vrai recul, pas un compliment à erreur d'arrondi.

## Convertir les séjours en mois

Neuf ou trente-neuf séjours parfaits, ça reste abstrait jusqu'à ce qu'on le convertisse en temps de calendrier. Tous les voyageurs ne laissent pas d'avis — le taux d'avis sur Airbnb tourne autour de 50–70 % selon votre discipline à les demander. Prenez un logement à 9 réservations par mois où environ la moitié des voyageurs laissent un avis : cela fait ~4–5 avis frais par mois.

À cinq avis par mois, la dette de 39 séjours d'un logement à 4,90 représente **environ huit mois** de rien d'autre que des cinq étoiles. Huit mois durant lesquels une seule note de quatre étoiles remet une partie du compteur à zéro, car le calcul de rétablissement ci-dessus suppose une série *ininterrompue*. Glissez une note de quatre étoiles dans la course et vous avez ajouté sa propre dette par-dessus : la série fait double emploi, et la moindre fissure allonge le délai.

Voilà le chiffre qui devrait changer votre comportement. Le mauvais commentaire a déjà eu lieu ; c'est un coup irrécupérable de 3,90 points. Ce que vous maîtrisez, c'est la *vitesse* des avis — la rapidité avec laquelle les séjours propres arrivent pour le diluer. Un logement à 4 avis par mois se rétablit en deux fois moins de temps de calendrier qu'un logement à 2, depuis le même point de départ. Le levier le plus puissant après un mauvais commentaire n'est pas la réponse publique. C'est une demande d'avis après le séjour, activée, pour que les quinze prochains voyageurs satisfaits laissent réellement les cinq étoiles qui vous soignent. La tactique de la réponse elle-même est dans [« Comment répondre à un commentaire trois étoiles »](/blog/responding-to-bad-airbnb-review) ; ce qui bouge le chiffre, c'est la vitesse.

## Guest Favorite relève la mise

La ligne Superhôte de 4,80 a une vraie marge. Le badge plus récent d'Airbnb **Guest Favorite** (« Coup de cœur voyageurs »), lancé fin 2023 pour signaler les logements les plus appréciés, n'a pas de seuil chiffré strict — mais en pratique, les logements qui le portent se serrent autour de 4,9. Airbnb le décrit comme un mélange de note, de nombre d'avis et de signaux de fiabilité plutôt qu'un seuil unique, alors traitez avec méfiance tout chiffre exact qui circule en ligne.

La conséquence pratique, c'est le point. Un badge dont la barre effective se situe près de 4,9 ne laisse presque aucun coussin. Sur le tableau de la dette de note, un logement qui vit à 4,90 pour tenir Guest Favorite est exactement celui qui paie 39 séjours pour effacer une étoile — et une seule note de quatre étoiles dans la course de rétablissement peut suffire à le faire sortir de la cohorte. Le badge qui récompense une note quasi parfaite est le même qui punit le plus durement une seule mauvaise nuit. Si vous chassez Guest Favorite, le calcul de rétablissement n'est pas une curiosité : c'est votre modèle de risque.

## Ce qui bouge vraiment le chiffre

Trois leviers, par ordre décroissant d'effet.

**La suppression bat le rétablissement en espérance.** Une suppression accordée retire le commentaire, la note tombe avec lui, et votre moyenne se recalcule en quelques minutes — toute la dette de 39 séjours s'évapore pour cinq minutes de travail. Le taux de succès des suppressions tourne autour de 15–30 % sur motifs de règlement (contenu hors sujet, représailles, extorsion). Même à 20 % de réussite, l'effacement instantané d'une dette de huit mois écrase n'importe quel meulage par les séjours. Déposez la demande de suppression *en premier*, avant la réponse publique, car une réponse fait paraître le dossier résolu. Motifs et taux de succès sont dans [le guide de réponse aux trois étoiles](/blog/responding-to-bad-airbnb-review).

**La vitesse dilue ce qu'on ne peut pas supprimer.** Pour les commentaires impossibles à faire retirer — les justes — le seul outil, c'est plus d'avis propres, plus vite. Un message de quatre lignes après le séjour, au quatrième jour, convertit 35–50 % des voyageurs qui seraient restés silencieux. Doublez votre taux d'avis, vous divisez par deux votre temps de rétablissement. Aucun autre bouton ne fait cela.

**Arrêtez d'optimiser au-delà de votre plafond.** Si votre logement a une limite structurelle — rue bruyante, pas d'ascenseur, cloisons fines — vous ne tiendrez pas 4,95, et courir après ne fait que transformer chaque quatre étoiles en crise. Choisissez la note que vous tenez avec un accueil normal, accumulez le lest du nombre d'avis, et laissez la moyenne faire son travail. Un tableau de bord qui montre la note moyenne, la vitesse des avis et l'écart au Superhôte sur tous vos logements sur un seul écran — au lieu de cliquer d'onglet en onglet Airbnb logement par logement — c'est exactement ce que [RentTools](/onboard) rassemble sur une même surface.

## FAQ

**Comment la note globale Airbnb est-elle calculée ?**
C'est la simple moyenne arithmétique des notes globales de tous les voyageurs sur la vie du logement — somme de toutes les notes divisée par leur nombre. Il n'y a ni décote dans le temps ni poids selon la fraîcheur sur le chiffre global, donc une vieille note cinq étoiles compte autant que celle de la semaine dernière. Le chiffre affiché est cette moyenne brute, arrondie à une décimale.

**Combien de cinq étoiles annulent une étoile ?**
Pour revenir à votre moyenne exacte d'avant, le compte est `(P − 1) / (5 − P)`, où `P` est la moyenne que vous aviez. À 4,90, cela fait 39 séjours cinq étoiles ; à 4,85, c'est 26 ; à 4,80, c'est 19. Le nombre ne dépend pas des avis déjà accumulés — seulement de la moyenne que vous cherchez à restaurer.

**Un mauvais commentaire fait-il plus mal quand j'ai moins d'avis ?**
Le jour même, oui : la chute immédiate vaut `(P − k) / (N + 1)`, donc un plus petit nombre d'avis `N` donne une chute visible plus grande. Une étoile fait passer un logement à 20 avis de 4,90 à 4,71, mais un logement à 200 avis seulement à 4,88. Le temps pour l'effacer entièrement, lui, est identique pour les deux.

**Une étoile va-t-elle me coûter le Superhôte ?**
Seulement si votre logement est petit. Sous environ 50 avis à une moyenne de 4,90, une étoile peut pousser la moyenne brute sous le seuil de 4,80 et vous coûter le badge au prochain recalcul trimestriel. Au-dessus, vous avez assez d'historique cinq étoiles pour qu'un seul avis bas reste confortablement au-dessus de la ligne.

**Quatre étoiles, est-ce mauvais pour ma note ?**
À moyenne élevée, oui. Quatre étoiles sur un logement à 4,90 tirent la moyenne vers le bas et coûtent neuf séjours impeccables à effacer. Cela ne se lit comme « bon » que face à des logements à 4,5. Si vous défendez un affichage à 4,9 ou chassez Guest Favorite, traitez les quatre étoiles comme des ratés.

**Combien de temps faut-il pour rétablir une note Airbnb en temps réel ?**
Convertissez les séjours en mois via votre taux d'avis. Un logement à 4,90 a besoin de 39 séjours propres ; à environ cinq avis par mois, cela fait à peu près huit mois de cinq étoiles sans rupture. Une vitesse d'avis plus élevée raccourcit d'autant — un logement qui récolte des avis deux fois plus vite se rétablit en deux fois moins de temps de calendrier.

**Dois-je demander à un voyageur de supprimer ou modifier son commentaire ?**
Vous ne pouvez pas l'y forcer, et insister se retourne en général contre vous. Votre meilleure chance est une demande formelle de suppression auprès d'Airbnb sur motifs de règlement — contenu hors sujet, représailles ou extorsion documentée — qui, accordée, retire le commentaire et son effet sur la note instantanément. Visez cela avant de passer huit mois à surhôter le chiffre.

## Un avis tranché

Les hôtes traitent un mauvais commentaire comme une plaie qui cicatrisera seule s'ils continuent simplement de bien accueillir. Le calcul dit le contraire : une seule étoile sur un logement à 4,90 est une dette de 39 séjours parfaits, et le temps ne la rembourse qu'à la vitesse où arrivent les avis propres. Les deux choses qui soldent vraiment cette dette sont une demande de suppression déposée dans la première heure et un message de demande d'avis qui double la vitesse à laquelle les quinze prochains voyageurs laissent cinq étoiles. Tout le reste — la réponse publique douloureuse, la baisse de prix, la semaine de doute — bouge le chiffre de zéro. Si vous devez vous obséder sur un commentaire, obsédez-vous sur les deux leviers qui relèvent de l'arithmétique, pas sur celui qui donne juste l'impression d'être productif.
