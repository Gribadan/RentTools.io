---
slug: gdpr-for-vacation-rental-hosts
locale: fr
title: "RGPD pour hôtes en location courte durée : ce qu’il faut vraiment faire"
excerpt: Le RGPD en pratique pour les hôtes en location courte durée. Cinq actions concrètes cette semaine : information, base légale, durée, sous-traitants, suppression.
status: draft
tags:
  - gdpr:GDPR
  - host-tips:Conseils hôtes
  - data-protection:Protection des données
ogImageUrl: /blog-covers/gdpr-for-vacation-rental-hosts.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# RGPD pour hôtes en location courte durée : ce qu’il faut vraiment faire

La première fois que j’ai lu le texte du RGPD, je publiais sur Airbnb depuis deux mois. J’ai fermé l’onglet après vingt pages et je suis retourné collecter des scans de passeport de voyageurs UE dans un dossier Telegram. Trois ans plus tard, ce dossier Telegram est la partie de mon setup qui me gêne le plus.

Voici un guide pratique pour les hôtes qui ne sont pas juristes et n’ont pas envie de le devenir. Cinq actions concrètes à mener cette semaine, plus ce que chacune signifie réellement.

## TL;DR

- Le RGPD s’applique dès qu’un voyageur situé dans l’UE réserve, même si votre logement est hors UE. La portée extraterritoriale est réelle.
- Vous avez besoin d’une information claire que le voyageur peut lire avant de transmettre son passeport. Une phrase au moment de la réservation, un texte complet sur une page /privacy.
- Votre base légale est presque toujours **l’exécution du contrat** plus **l’obligation légale** pour la déclaration des voyageurs. Pas le consentement.
- Choisissez une durée de conservation. Notez-la. Tenez-la. « Jusqu’à ce que je supprime » n’est pas une durée.
- Un voyageur peut demander la suppression de ses données. Il vous faut un flux pour ça. Pas un outil parfait, un flux.

## Le RGPD me concerne-t-il vraiment ?

Si votre logement est dans l’UE et que vous le louez : oui.

Si votre logement est hors UE mais que vous acceptez des voyageurs de l’UE : oui aussi, à cause de la portée extraterritoriale du RGPD. L’article 3(2) étend le règlement à tout responsable « traitant des données à caractère personnel de personnes situées dans l’Union » lorsqu’il leur propose des biens ou services. Une annonce Airbnb à Tachkent qui prend une réservation d’un voyageur berlinois traite, sur le papier, des données de personnes UE et tombe donc sous le règlement. La page de la Commission européenne sur [l’application du règlement](https://commission.europa.eu/law/law-topic/data-protection/reform/rules-business-and-organisations/application-regulation/who-does-data-protection-law-apply_en) est claire ; le [Comité européen de la protection des données](https://www.edpb.europa.eu/edpb_en) publie des lignes directrices destinées aux responsables hors UE.

En pratique, presque aucun hôte de Tachkent n’a été sanctionné par une autorité UE. Le risque n’est pas une sanction contre un petit opérateur hors zone. Le risque, c’est qu’un seul voyageur dépose une plainte, que la plateforme escalade, que votre compte récolte un avertissement, et que vos réservations futures baissent. C’est le modèle de menace réaliste. Traitez le RGPD comme de l’hygiène plateforme plus que comme une exposition juridique.

Une exception : les hôtes basés dans l’UE avec une SARL ou un statut indépendant. Pour vous, l’exposition juridique est réelle et une vraie amende peut tomber. Lisez la suite avec la même intensité.

## L’information préalable (une phrase, puis une page)

La plupart des hôtes sautent cette étape ou copient un modèle bourré de « personne concernée » et « responsable de traitement », illisible.

Le motif minimal conforme tient sur deux niveaux :

1. **Une phrase de résumé au moment de la collecte.** Quand vous demandez une photo de passeport, envoyez un message court : « Je conserve ce document jusqu’à 30 jours après votre départ, puis je le supprime. Détails complets : lien. » Envoyez avant qu’il téléverse.
2. **Une page complète sur /privacy.** Liste des catégories de données, finalité, base légale, durée de conservation, contact pour les demandes de suppression. Pas de jargon. Le langage clair l’emporte parce que les autorités le [préfèrent désormais explicitement](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en).

Notre [page /privacy](/privacy) est l’exemple que les petits hôtes peuvent presque copier mot pour mot. Environ 600 mots. Les sections clés :

- Quelles données : scan de passeport, dates de séjour, historique de communication.
- Pourquoi : déclaration légale des voyageurs, résolution de litiges, logistique du séjour.
- Combien de temps : un nombre de jours précis, pas « selon les besoins ».
- Qui d’autre : les plateformes (Airbnb, Booking) et tout outil utilisé ([RentTools](/onboard), si vous l’utilisez).
- Comment supprimer : une adresse e-mail que vous consultez réellement.

Sautez les paragraphes de disclaimer. Sautez le « votre vie privée nous tient à cœur ». Les autorités appellent ça performatif. Énoncez les faits.

Erreur courante : les hôtes recyclent un modèle conçu pour une boutique e-commerce. Ces modèles supposent des cookies, des analytics marketing, des trackers tiers. La plupart des petits hôtes n’ont rien de tout cela. Plus la page est simple, plus elle paraît crédible.

*Figure 1 : Le motif d’information à deux niveaux. Message court à la collecte ; page /privacy complète en dessous. Capture à venir, hébergée sur /blog/gdpr-for-vacation-rental-hosts/figure-1.png.*

## Base légale : contrat, obligation légale, presque jamais le consentement

L’article 6 du RGPD liste six bases légales. Pour les hôtes en location courte durée, exactement deux couvrent presque tous les cas.

1. **Exécution du contrat.** Quand un voyageur réserve, traiter son nom, ses dates et ses coordonnées est nécessaire à l’exécution du contrat. Pas besoin de consentement supplémentaire. Couvre les données prises au moment de la réservation.
2. **Obligation légale.** Quand le droit local exige la déclaration des voyageurs (parte de viajero en Espagne, alloggiati web en Italie, fiche d’hôtel en France, formulaire FMS en Russie, OVIR en Ouzbékistan), la collecte du passeport relève de « l’obligation légale ». Pas besoin de consentement non plus.

Et le consentement ? C’est la bonne base pour un mailing marketing, l’usage de photos sur les réseaux sociaux, un programme de fidélité volontaire. Quasi rien dans la routine d’un hôte n’est consentement-based, et le traiter comme tel pose un problème : sous RGPD, le consentement doit être libre. Le voyageur peut le retirer. Si vous mettez la collecte de passeport en consentement, le voyageur peut refuser et vous ne pouvez plus louer légalement, ce qui prouve que le consentement n’était pas libre. C’est un anti-motif connu et les [lignes directrices CEPD sur le consentement](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-052020-consent-under-regulation-2016679_en) le pointent.

Règle pratique : si un voyageur ne peut pas dire non sans perdre la location, la base est le contrat ou l’obligation légale, pas le consentement. Choisissez la bonne dans votre information et toute la question disparaît.

## Durée de conservation : choisissez un nombre

La plupart des informations disent « aussi longtemps que nécessaire ». Techniquement permis par l’article 5(1)(e) et pratiquement inutile. Une autorité demandera : nécessaire pour quoi, et pour combien de temps ? Il vous faut un nombre.

Trois nombres que j’ai retenus, et le raisonnement derrière :

1. **Communications de réservation : 90 jours après le départ.** Assez pour gérer un litige tardif, assez court pour ne pas archiver des chats indéfiniment.
2. **Scans de passeport : 30 jours après le départ, sauf si le droit local impose plus.** Dans les pays qui exigent une conservation de plusieurs années (Russie, plusieurs membres UE), suivez l’obligation légale. Au-delà, supprimez. Le scan de passeport est la donnée la plus sensible que vous gardez ; plus la conservation est courte, plus l’impact d’une fuite est petit si votre téléphone est volé.
3. **Historique agrégé des réservations : indéfini.** Noms, dates, revenu total. Vous en avez besoin pour le fisc, et le fisc peut revenir cinq ans plus tard. Ne gardez pas les coordonnées dans cette archive. Retirez e-mail et téléphone avant archivage.

Les règles de conservation passeport pays par pays sont éclatées et incohérentes. J’écris un article séparé sur le tableau pays par pays incluant Espagne, Portugal, Italie, France, Grèce, Croatie, Russie, Ouzbékistan. En attendant, prenez par défaut « la durée la plus courte que la loi locale autorise » et vérifiez avec l’office du tourisme de votre commune.

La plus grosse erreur RGPD que je vois chez les hôtes, c’est le dossier WhatsApp de scans de passeport qui remonte à quatre ans parce que personne ne scrolle pour supprimer les anciens. Le dossier est la fuite. Téléphone volé, le document d’identité du voyageur entre les mains d’un acteur malveillant, et l’hôte n’avait aucune raison de le garder aussi longtemps.

## Sous-traitants : qui d’autre voit les données

Un sous-traitant est toute personne autre que vous qui manipule les données voyageurs parce qu’elle vous aide à faire le travail. Exemples :

- Les **plateformes** (Airbnb, Booking, Vrbo). Ce sont des co-responsables, pas des sous-traitants. Leurs politiques couvrent leur côté.
- Votre **PMS ou outil de synchro**. Hostaway, Lodgify, Smoobu, RentTools : sous-traitant. Listez.
- Votre **hébergeur cloud**. Si vous self-hostez sur un droplet, le fournisseur cloud est techniquement sous-traitant. Listez.
- Votre **fournisseur e-mail**. La boîte où les voyageurs envoient les scans. Gmail, Outlook, Fastmail. Listez.
- Un **processeur de paiement**. Stripe, Wise, le portail bancaire. Listez.

Vous n’avez pas besoin d’un contrat de sous-traitance signé pour la plupart des scénarios de petit hôte parce que les grandes plateformes publient des conditions standard qui s’appliquent automatiquement. Vous devez les lister sur votre page /privacy pour que le voyageur sache où vont ses données.

Mauvais motif : l’information dit « nous pourrons partager vos données avec des partenaires de confiance ». Cette phrase échoue à l’examen. Listez les partenaires réels par leur nom. Si vous ne pouvez pas les nommer, vous ne comprenez pas votre propre flux de données assez pour opérer.

Petit point connexe : le [module ménage sur un petit bien](/blog/cleaning-schedule-automation) tire souvent un autre sous-traitant (l’appli de l’agente, si vous en utilisez une). Les agentes voient les noms et heures d’arrivée, ce qui compte comme donnée personnelle. Mentionnez-les aussi.

## Le flux de demande de suppression

L’article 17 du RGPD donne à toute personne le droit de demander la suppression de ses données. En tant que petit hôte, vous en aurez peut-être une par an. Il vous faut un flux.

Le flux n’a pas besoin d’être un outil. Il doit faire trois choses :

1. **Recevoir la demande.** Une adresse e-mail (host@votredomaine ou ce que vous publiez sur /privacy). Pas un formulaire qui finit en spam.
2. **Vérifier la demande.** Faites correspondre l’e-mail à la réservation. Si un inconnu écrit pour supprimer « les données de Jean Dupont » sans précision, demandez quelle réservation et depuis quelle adresse. La vérification est imposée par le RGPD ; vous ne pouvez pas supprimer pour un usurpateur.
3. **Supprimer pour de vrai.** Nettoyage du dossier mail, suppression du scan, expurgation du calendrier. Parcourez chaque sous-traitant et confirmez. Si la donnée vit dans un outil que vous ne contrôlez pas (les systèmes Airbnb), pointez le demandeur vers eux. Vous ne pouvez supprimer que ce qui est à vous.

Vous avez 30 jours pour répondre selon l’article 12(3), prolongeables à 90 pour les demandes complexes. Une demande de petit hôte n’est jamais complexe ; répondez sous une semaine, ça suffit.

Tenez un petit registre : date reçue, demandeur, ce que vous avez supprimé, date d’achèvement. Une ligne par demande. Si une autorité demande, le registre est votre preuve que le flux existe.

## FAQ

**Je suis hors UE. Faut-il vraiment ?**
Strictement, oui, dès qu’un voyageur UE réserve. En pratique, le risque d’exécution sur un petit hôte hors UE est proche de zéro. Le risque réputation et relation plateforme est réel. Hygiène plateforme, pas exposition juridique.

**Puis-je simplement utiliser la politique d’Airbnb ?**
Non. Airbnb est responsable pour les données qu’il détient ; vous êtes responsable pour les données que vous détenez à part (copies de passeport, messages directs, notes hors-ligne). Chaque responsable a besoin de sa propre information.

**Ai-je besoin d’un Délégué à la Protection des Données ?**
Pour un hôte 1–10 biens, presque jamais. L’article 37 liste les cas : traitement à grande échelle de catégories particulières, autorités publiques, surveillance systématique à grande échelle. Rien ne s’applique à un petit hôte.

**Et les cookies sur mon site ?**
Si vous avez une page perso ou un petit site, vous n’avez besoin d’une bannière que si vous posez des cookies pour analytics, pub, ou embarques tiers. Une page statique sans cela n’a pas besoin de bannière. Une page statique avec Google Analytics oui, avec consentement granulaire.

**Puis-je stocker des données voyageur dans Google Drive ?**
Techniquement oui en listant Google comme sous-traitant et en appliquant les mêmes durées. En pratique non. Drive partage trop facilement. Utilisez un dossier chiffré au repos qui auto-supprime les vieux fichiers.

**Que se passe-t-il en cas de plainte ?**
La plupart des autorités vous laissent corriger avant de sanctionner. Elles ne cherchent pas à faire des exemples sur les petits hôtes. Réponse polie dans les 30 jours, preuve d’information et de durée de conservation, l’amende n’arrive pas. Ceux qui se prennent une amende sont ceux qui ignorent le courrier.

## Une opinion tranchée

L’action RGPD la plus utile qu’un petit hôte peut faire cette semaine, c’est **écrire la durée de conservation et la tenir**. Pas l’information (vous pouvez copier la nôtre). Pas la décision sur la base légale (presque toujours contrat ou obligation légale). La durée.

La plupart des petits hôtes que je connais sont OK sur tous les autres axes et noyés sur la durée parce qu’ils n’ont jamais choisi un nombre. Choisissez-en un. Écrivez-le sur /privacy. Mettez un rappel calendrier pour le balayage de suppression le 1er de chaque mois. Supprimez ce qui dépasse la durée. Le reste du RGPD découle de cette habitude.
