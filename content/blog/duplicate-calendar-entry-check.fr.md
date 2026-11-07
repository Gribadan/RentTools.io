---
slug: duplicate-calendar-entry-check
locale: fr
title: "Doublon de calendrier ou vraie double réservation ?"
excerpt: "Deux barres superposées ne prouvent pas deux réservations. Retrouvez leurs sources, comparez les séjours confirmés et protégez les nuits occupées."
status: published
tags:
  - calendar-sync:Synchronisation des calendriers
  - host-tips:Conseils aux hôtes
ogImageUrl: /blog-covers/duplicate-calendar-entry-check.webp
ogImageWidth: 1600
ogImageHeight: 900
tldr: |
  - Reliez chaque entrée superposée à la bonne annonce et à la réservation d’origine avant toute modification.
  - Distinguez double affichage, réservation avec blocage manuel et deux véritables réservations confirmées.
  - Corrigez la cause identifiée puis vérifiez disponibilité et ménage ; ne supprimez pas un flux pour nettoyer l’écran.
---

Deux barres couvrent les mêmes dates dans le calendrier d’un logement. Il est tentant d’en retirer une pour retrouver un écran clair. Déterminez d’abord ce qu’elles représentent : un séjour affiché par deux chemins, une restriction de disponibilité ou deux réservations réelles impossibles à honorer simultanément dans le même logement.

Cette distinction détermine l’action. Un problème d’affichage ou d’import demande de retracer les données et les connexions ; un conflit réel exige de traiter les réservations. Aucun des deux ne se résout sûrement en supprimant la première entrée qui semble superflue.

## Remonter aux enregistrements d’origine

Commencez par la bonne unité louable, pas seulement par un nom d’annonce proche. Ouvrez, lorsque c’est possible, la source de chaque entrée et comparez plateforme, arrivée, départ et statut actuel avec le compte de réservation d’origine. Conservez les références dans vos notes privées. Une couleur ou un titre d’événement donne un indice, pas la preuve d’un voyageur supplémentaire.

Le [guide de synchronisation Airbnb](https://www.airbnb.com/help/article/99) décrit la transmission de nuits réservées et de certains blocages de disponibilité. Examinez donc une période fermée dans un calendrier destinataire avant de la compter comme une réservation supplémentaire.

Notez le sens de chaque connexion susceptible de transmettre la période. Vérifiez si une réservation locale et un événement importé décrivent la même réservation d’origine, ou si deux flux sont pris pour deux ventes indépendantes. Des dates identiques ne suffisent pas : des voyageurs différents peuvent réserver les mêmes nuits, et une réservation modifiée peut rester ancienne chez un destinataire.

Pour une recherche technique, la [section UID de la spécification iCalendar](https://www.rfc-editor.org/rfc/rfc5545#section-3.8.4.7) définit un identifiant de composant de calendrier. Il sert à retracer un événement, sans remplacer la vérification de la réservation. Ne modifiez pas les identifiants pour une réparation rapide et ne publiez pas les adresses complètes des flux dans une demande d’aide.

**Comparaison fictive :** le compte d’origine confirme un séjour du mardi au vendredi. Deux représentations de calendrier concernent ce même séjour. Les nuits occupées restent mardi, mercredi et jeudi : trois nuits, pas six. Cette conclusion suppose d’avoir confirmé une seule vraie réservation ; elle ne découle pas de barres semblables. Vérifiez la [limite du jour de départ](/fr/blog/ical-checkout-day-blocked) si une vue paraît prolonger le séjour.

## Classer la situation selon les preuves

Choisissez la suite à partir des enregistrements d’origine. Une réservation désigne ici un séjour actuellement confirmé et non annulé. Un conflit exige deux réservations de la même unité partageant au moins une nuit occupée. Un doublon suppose que les deux entrées ont été reliées au même séjour d’origine.

| Preuve | Type | Suite |
| --- | --- | --- |
| Une réservation | Double affichage | Vérifier la source |
| Deux réservations | Conflit réel | Contacter la plateforme |
| Séjour + blocage | Restriction | Vérifier le motif |

Si une source ne peut pas encore être vérifiée, laissez la situation non résolue. Ne rouvrez pas une nuit réellement occupée parce que la seconde entrée porte un libellé flou. Le [guide des dates bloquées](/fr/blog/blocked-calendar-dates-not-reservations) aide à distinguer réservations et autres restrictions.

## Corriger au bon endroit, puis vérifier la prochaine arrivée

RentTools importe les événements par logement et plateforme et utilise l’identifiant d’événement pour les rapprocher. Cela ne signifie pas que des entrées similaires de sources différentes sont des réservations distinctes, ni que tout chevauchement peut être fusionné automatiquement. Établissez d’abord le lien avec la réservation d’origine.

Ne retirez pas une connexion uniquement pour simplifier l’affichage. Supprimer un lien RentTools supprime aussi les événements importés de cette plateforme pour le logement. L’écran peut paraître plus calme alors que des informations utiles sur la disponibilité ont disparu. Si la connexion est incorrecte, suivez la [méthode de remplacement d’un flux](/fr/blog/replace-calendar-feed-checklist) et protégez les nuits concernées pendant la correction.

Après une modification de la réservation d’origine, comparez ses dates actuelles avec chaque destinataire après l’import suivant. Si une vue reste ancienne, examinez ce chemin d’actualisation au lieu de créer une autre réservation pour compenser. Ne corrigez que l’enregistrement ou le réglage dont le rôle est établi. Notez le changement pour éviter qu’un membre de l’équipe recommence la même opération.

Pour deux véritables réservations, gardez les deux enregistrements d’origine visibles pour la personne qui traite le conflit. Contactez les assistances concernées et informez les voyageurs avec des éléments exacts selon la situation. Ce guide ne promet ni exonération de frais, ni montant de remboursement, ni résultat de relogement.

Terminez par les calendriers de vente et la préparation : les nuits occupées restent indisponibles, les autres restrictions sont préservées et le départ réel dispose d’un plan de ménage convenu avec un responsable. Deux barres ne justifient pas deux intervenants. Un calendrier plus net ne prouve pas que la prochaine arrivée est prête.
