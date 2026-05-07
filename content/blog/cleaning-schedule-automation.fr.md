---
slug: cleaning-schedule-automation
locale: fr
title: "Automatiser le planning de ménage en location courte durée"
excerpt: Comment automatiser le planning de ménage en location courte durée. Remplacer cahiers et Sheets partagés par un flux dédié à l’équipe qui passe à l’échelle.
status: draft
tags:
  - cleaning:Ménage
  - host-tips:Conseils hôtes
  - automation:Automatisation
ogImageUrl: /blog-covers/cleaning-schedule-automation.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Automatiser le planning de ménage en location courte durée

Pendant deux ans et demi, j’ai fait tourner le planning de ménage de mes appartements sur un seul Google Sheet partagé. Une colonne par bien, une ligne par jour, un emoji pour « à nettoyer ». Mon agente avait un raccourci sur son téléphone. On n’a jamais raté une rotation.

On n’a pas non plus passé l’échelle. Le Sheet tenait par mon rappel hebdo du mardi soir et sa patience à scroller sur un écran de 5 pouces. Le jour où j’ai ajouté un troisième appartement, le Sheet a eu besoin de couleurs, puis d’un onglet par agente, puis d’une formule de cellule que je ne sais plus relire trois mois après. C’est là que j’ai commencé à regarder les vraies solutions d’automatisation, pas parce que le Sheet avait échoué, mais parce que le troisième appartement a cassé le motif.

Cet article, c’est ce qu’il faut vraiment automatiser, ce qu’il faut laisser manuel, et le flux dédié à l’équipe que je conseille désormais à tout hôte d’adopter dès son deuxième bien.

## TL;DR

- Un tableur fonctionne pour un bien. Peut-être deux. Au-delà, chaque Sheet partagé pourrit en nœud de cellules fusionnées que personne n’ose plus toucher.
- Le planning de ménage doit dériver du calendrier, pas être maintenu en parallèle. Une seule source de vérité : le calendrier de réservations.
- Donnez à l’agente son propre login ou page magic-link. Montrez-lui les biens du jour, les fenêtres horaires, et un bouton Terminé. Rien d’autre.
- Suivez trois choses par rotation : statut (en attente / en cours / terminé), notes (problèmes), photos (preuve + mémoire).
- Arrêtez d’utiliser WhatsApp comme registre officiel. Servez-vous-en pour discuter, pas pour « est-ce que tu as nettoyé l’appart 3 ? ».

## Le vrai problème d’un tableur partagé

Un Sheet partagé marche parce que c’est une liste. Le souci, c’est que la liste n’a pas de mode « vue par agente » sans filtres, et les filtres dans Sheets, c’est ce qui casse à la première mauvaise tape.

Trois choses dérapent à mesure que vous grandissez :

1. **Les agentes ont besoin de vues différentes.** L’agente A gère les studios ; l’agente B gère les villas. Filtres et onglets ne marchent que si tout le monde s’interdit de casser la vue de l’autre. Personne ne s’interdit rien.
2. **Le statut est flou.** « Terminé » écrit en vert mardi soir peut vouloir dire fait à 9 h ou fait à 14 h. L’heure compte quand vous avez un check-in à 15 h.
3. **L’historique est invisible.** « L’évier de la cuisine a fui le mois dernier ? » exige de scroller dans des cellules réécrites chaque semaine. La note d’origine est partie.

Un module ménage dédié règle chacun de ces points en inversant le modèle de données. Au lieu d’une grille 2D qu’on lit en travers, l’agente voit la liste de *ses* tâches *aujourd’hui*, triées par heure d’arrivée. L’hôte voit un tableau de bord de toutes les rotations sur toutes les agentes. Mêmes données, deux vues.

Vous n’avez pas besoin d’un outil à 200 $/mois. Même notre instance gratuite [RentTools](/onboard) a un flux dédié, et l’idée n’est pas unique. Smoobu, Hostaway, Lodgify : chaque PMS payant a la même primitive. Le but est d’utiliser *quelque chose* de dédié plutôt qu’un Sheet.

## Ce qu’un planning de ménage doit suivre

Résistez à l’envie de tout suivre. Le schéma qui tient au dos d’une serviette gère 95 % des cas.

Pour chaque rotation :

1. **Bien** : quel appartement.
2. **Date** : le jour de ménage, dérivé du départ de la réservation précédente.
3. **Fenêtre horaire** : début au plus tôt (après départ), fin au plus tard (avant l’arrivée suivante).
4. **Agente assignée** : la personne responsable. Une seule ; si elle saute, on escalade.
5. **Statut** : en attente → en cours → terminé. En option : « problème détecté » qui ping l’hôte.
6. **Notes** : texte libre, écrit par l’agente. Court.
7. **Photos** : 0 à 3 jointes. Avant / après / dégât.

C’est tout. Résistez à ajouter « durée prévue », « checklist de 47 sous-tâches » ou « inventaire des fournitures ». Chacune de ces idées commence bien et pourrit en bruit que personne ne lit.

Le débat sur la checklist est réel. Mon avis : la checklist est un document distinct du planning. Le planning dit « ceci doit être nettoyé avant 14 h » ; la checklist dit « ce que ménage veut dire dans ce bien ». Gardez-les séparés. Imprimez la checklist, scotchez-la à l’intérieur du placard de fournitures. Mettez le planning dans votre outil.

Pour un exemple concret de raisonnement sur les rotations sous risque de synchro et de double réservation (ce qui détermine quand une rotation apparaît dans le planning), voir [notre fiche pratique sur les doubles réservations](/blog/avoiding-double-bookings).

## Le flux dédié à l’agente (sans login d’hôte)

L’agente n’a pas besoin d’un compte d’hôte. Lui en donner un est un léger risque de sécurité (elle voit chaque détail de chaque réservation) et un désastre UX (le tableau de bord n’est pas pensé pour son métier).

Le bon motif, c’est un **rôle ménage dédié**. Trois règles pour ce qu’il voit :

1. Tâches du jour en haut. Tâches de demain en dessous. Pas une grille calendrier ; une liste chronologique.
2. Uniquement les biens de l’agente. Si elle nettoie 3 de vos 6 biens, elle ne doit pas voir les 3 autres.
3. Une action par ligne : un bouton Terminé. Tap, confirmation, c’est fait. En option : un lien « signaler un problème » à côté.

L’authentification, c’est ce que les hôtes sur-pensent. L’agente n’a pas besoin de mot de passe. Un cookie magic-link persistant sur son téléphone suffit ; elle bookmark `https://votreoutil.example/agente/abc-token-xyz`, le cookie la garde connectée un an, et la rotation invalide le lien dès qu’elle quitte.

En self-hosting, c’est environ une après-midi de travail. En PMS hébergé (RentTools, Smoobu, Hostaway), le flux est livré clé en main.

## Photos et notes : quand demander, quoi capturer

L’upload de photos optionnel est la fonction qui rentabilise à elle seule un flux dédié. Deux photos par rotation vous donnent :

1. **Avant ménage.** Dix secondes que l’agente prend en arrivant : l’état laissé par le voyageur précédent. Règle 90 % des disputes « le précédent a cassé X » quand le suivant le signale.
2. **Après ménage.** L’état de l’appart quand l’agente termine. Règle les réclamations dégât quand un voyageur arrive et signale un meuble cassé qui était nickel quatre heures plus tôt.

Pas besoin d’une photo léchée. Une photo téléphone du lit et une de la salle de bain suffisent. Classez, oubliez, ressortez seulement en cas de litige.

Les notes ont deux saveurs. **Notes agente** (« plus de tablettes lave-vaisselle », « le voyageur a oublié un manteau ») sont des champs texte rapides. **Signalements de problème** (« la clim fuit, j’ai pingé maintenance ») c’est le même champ avec un drapeau qui mail ou ping l’hôte tout de suite. Un champ, deux sémantiques, réglées par une case à cocher.

Résistez à exiger une photo de chaque item de checklist. Le temps de l’agente est fini, et si chaque rotation demande 30 photos, elle photographiera des murs nus pour satisfaire la règle. Deux vraies photos battent trente bidons.

## WhatsApp est un outil de discussion, pas un registre officiel

Tous les hôtes que je connais à Tachkent ont un groupe WhatsApp avec leurs agentes. Moi aussi. L’erreur qu’on a tous faite trop longtemps, c’est de traiter ce groupe comme la source de vérité du statut ménage.

WhatsApp est bon pour :
- Les « j’ai 30 minutes de retard » rapides
- Les photos de dégâts inhabituels qui demandent un avis
- La coordination pendant un changement (autre agente aujourd’hui ; problème de fournitures)

Il est mauvais pour :
- « L’appart 3 est nettoyé ? » avec la réponse perdue deux jours plus haut
- Suivre les rotations sautées en février
- Onboarder une nouvelle agente sans transférer 600 messages

Utilisez WhatsApp pour discuter. Utilisez le module ménage pour le statut. Les deux ne doivent jamais se disputer le même boulot. Quand une agente demande sur WhatsApp « tu as marqué l’appart nettoyé ? », la bonne réponse est « je ne le suis pas. Ton bouton Terminé, oui. Tu l’as tapé ? »

C’est un changement culturel plus que technique. Il faut peut-être une semaine de discipline avant que l’agente arrête d’envoyer « terminé » et fasse confiance au flux du bouton.

## FAQ

**Ai-je besoin d’un outil dédié, ou puis-je étendre mon calendrier de réservations ?**
Vous pouvez étendre la plupart des calendriers. Google Calendar plus quelques macros vous emmènent loin. Au-delà de trois biens, un module dédié se rentabilise en temps de coordination économisé dès le premier mois.

**Mon agente est ma mère / mon conjoint / une seule personne de confiance. Faut-il vraiment un rôle ?**
Strictement non. Avec une seule agente qui est aussi de la famille, le motif WhatsApp + Sheet marche. L’article est pour le moment où vous embauchez une agente non-famille, ou que vous passez à deux, où l’accès par rôle devient rentable.

**Et le suivi de l’inventaire (papier toilette, savon) ?**
Préoccupation différente, outil différent. Une simple note partagée « liste de courses » suffit pour deux biens ; un vrai outil d’inventaire commence à valoir au-delà de cinq. Ne le greffez pas sur le planning ménage ; les fréquences de mise à jour ne sont pas les mêmes.

**Faut-il payer l’agente au forfait ou à l’heure ?**
Hors sujet ici, mais mon avis : forfait pour studios, horaire pour villas. Le forfait suit naturellement les réservations ; l’horaire colle à l’imprévisibilité des grands biens. Mélanger les deux dans le même bien finit en dispute de renégociation.

**Que se passe-t-il quand une agente ne vient pas ?**
Le statut reste en attente au-delà de la fenêtre ; l’hôte est pingé. Ensuite c’est un coup de fil. L’outil ne peut pas régler un no-show ; il peut seulement faire remonter qu’il a eu lieu, vite.

**Y a-t-il une option gratuite pour le flux dédié ?**
Oui. Les PMS open source self-hostés (RentTools, KalSync, etc.) incluent les vues dédiées. Les paliers gratuits de petits PMS commerciaux aussi. Ce n’est pas le gratuit qui freine ; c’est l’adoption par l’agente.

## Une opinion tranchée

La plus grosse erreur des hôtes sur le planning de ménage, c’est de **mettre l’agente sur le calendrier d’hôte**. Ils lui montrent le tableau de bord complet, tous les biens, tous les noms, toutes les heures de check-in. L’agente est noyée, l’hôte a partagé plus de données qu’il ne le voulait, et personne n’est plus heureux.

Donnez à l’agente une liste. Aujourd’hui. Bouton Terminé. C’est toute l’interface. Si votre outil actuel ne sait pas faire, changez d’outil, ou construisez le rôle vous-même en une après-midi. Les deux ans et demi sur le Sheet ont été de bonnes années ; elles auraient été meilleures si j’avais bâti la vue dédiée dès le quatrième mois.
