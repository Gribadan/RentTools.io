---
slug: airbnb-booking-calendar-sync-free
locale: fr
title: "Synchroniser ses calendriers Airbnb et Booking.com gratuitement (2026)"
excerpt: Synchroniser Airbnb et Booking.com en iCal sans payer. Pas-à-pas, vrais intervalles de rafraîchissement, et le moment où un Channel Manager payant devient utile.
status: draft
tags:
  - airbnb:Airbnb
  - booking-com:Booking.com
  - calendar-sync:Synchro calendrier
  - ical:iCal
ogImageUrl: /blog-covers/airbnb-booking-calendar-sync-free.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Synchroniser ses calendriers Airbnb et Booking.com gratuitement (2026)

En juin dernier, j’ai failli double-réserver un voyageur de Stuttgart. Airbnb a bloqué les dates dès qu’il a payé ; Booking.com affichait encore la même semaine comme disponible quatre heures plus tard. Le temps que le flux iCal rattrape, un voyageur de Tachkent avait déjà demandé ces dates. J’ai remboursé une réservation, gardé l’autre, et passé la soirée à éplucher chaque article du centre d’aide pour comprendre comment synchroniser Airbnb et Booking.com sans cracher 200 $ par mois.

Voici le résultat. Outils gratuits, vrais intervalles de rafraîchissement, réponses honnêtes sur ce qui marche et ce qui ne marche pas.

## TL;DR

- Airbnb et Booking.com exposent tous les deux des **URL d’export iCal** privées, gratuitement. Pas besoin de contrat partenaire.
- iCal est unidirectionnel par URL. Deux annonces, c’est **deux URL dans chaque sens** : l’export d’A vers B, l’export de B vers A.
- Airbnb rafraîchit les calendriers importés toutes les **2 à 4 heures**. Booking.com toutes les **2 à 6 heures**. C’est dans cet écart que naissent les rares doubles réservations.
- Une couche intermédiaire gratuite ([RentTools](/onboard) en open source, ou un cron maison) rafraîchit plus vite, mais elle ne peut pas accélérer le polling de la plateforme de destination.
- Pour 1 à 3 annonces, iCal couvre 99 % des cas. Pour 20+ annonces ou un taux d’occupation au-delà de 90 %, regardez du côté d’un Channel Manager payant.

## Le vrai problème

Deux sites de location. Un seul appartement physique. Dès qu’une personne réserve sur Airbnb, tous les autres sites doivent l’apprendre en quelques minutes, pas en quelques heures.

Si vous ne diffusez que sur Airbnb, rien de tout cela ne vous concerne. Le calendrier Airbnb se suffit à lui-même.

Les ennuis commencent à la deuxième annonce. Vous avez deux calendriers sources qui doivent être d’accord. Hic : aucune des deux plateformes ne donnera à l’autre une API privée. Elles n’exposent qu’une URL iCal publiquement lisible que l’autre interroge à son propre rythme.

C’est ce que les guides gratuits oublient. La synchro iCal n’est **pas** temps réel. C’est « assez rapide la plupart du temps », et les moments où ce n’est pas le cas sont précisément ceux qui font mal : deux voyageurs qui réservent les mêmes dates dans la fenêtre de polling.

Trois choses à faire ci-dessous. Récupérer l’URL iCal d’Airbnb, récupérer celle de Booking.com, décider quoi pointer vers quoi. Il n’y a pas de quatrième étape.

## Étape 1 : récupérer l’URL iCal d’Airbnb

Ouvrez votre tableau de bord d’hôte Airbnb. Le chemin :

1. Cliquez sur **Calendrier** en haut.
2. Choisissez l’annonce à synchroniser.
3. Cliquez sur **Disponibilités** dans la barre latérale droite, puis **Synchroniser les calendriers**.
4. Cliquez sur **Exporter le calendrier**.
5. Copiez la longue URL. Elle ressemble à `https://www.airbnb.com/calendar/ical/12345678.ics?s=AAA...`.

*Figure 1 : panneau de synchronisation des calendriers Airbnb. Capture à venir, hébergée sur /blog/airbnb-booking-calendar-sync-free/figure-1.png.*

Deux choses à vérifier avant de continuer. D’abord, cette URL est privée. Quiconque l’obtient peut lire toutes vos dates de réservation Airbnb. Traitez-la comme un mot de passe. Ensuite, l’URL Airbnb reste stable tant que vous ne cliquez pas sur **Réinitialiser l’URL** — ce que vous faites uniquement si elle a fuité.

Si vous n’aviez jamais cliqué sur **Synchroniser les calendriers**, Airbnb n’a pas encore généré d’URL. Cliquez au moins une fois pour activer la fonction. L’[article officiel du centre d’aide Airbnb](https://www.airbnb.com/help/article/99) donne la version canonique.

## Étape 2 : récupérer l’URL iCal de Booking.com

Le chemin Booking est deux clics plus profond, et c’est la raison pour laquelle la plupart des hôtes abandonnent avant d’avoir les deux :

1. Connectez-vous à votre extranet Booking.com.
2. Choisissez l’établissement.
3. Cliquez sur **Calendrier et tarifs** dans la barre latérale.
4. Cliquez sur **Synchroniser les calendriers**. (Si vous ne le voyez pas, votre type de bien n’a peut-être pas iCal exposé. Les locations de vacances oui ; les hôtels traditionnels rarement.)
5. Sous **Exporter votre calendrier**, cliquez sur **Exporter**.
6. Copiez l’URL. Format approximatif : `https://admin.booking.com/hotel/hoteladmin/ical.html?t=AAA...`.

*Figure 2 : export du calendrier dans l’extranet Booking.com. Capture à venir, hébergée sur /blog/airbnb-booking-calendar-sync-free/figure-2.png.*

Un piège : Booking.com masque le panneau iCal sur certains contrats partenaires. Si vous avez un accord d’API Channel Manager (la plupart des petits hôtes n’en ont pas), iCal est désactivé par design. Si iCal est totalement absent de votre extranet sans aucun deal partenaire signé, contactez le support partenaire. Ils le réactivent.

Le [guide Partner Hub de Booking](https://partner.booking.com/en-us/help/calendar-and-pricing/setting-availability/syncing-your-airbnb-and-bookingcom-calendars) reprend la procédure avec des captures conformes à l’UI 2026.

## Étape 3 : connecter Airbnb et Booking.com ensemble

Trois options. Aucune n’est fausse ; le bon choix dépend du nombre d’annonces.

1. **Import croisé direct.** Collez l’URL Airbnb dans le champ d’import de Booking, et l’URL Booking dans le champ d’import d’Airbnb. Terminé. Chacun interroge l’autre à son rythme. Gratuit. Sans tiers. Marche pour deux plateformes. Cesse de bien tenir dès qu’on en ajoute une troisième (Vrbo, Expedia, revendeurs Hostaway) : il faudrait ajouter chaque URL sur chaque autre plateforme, et la plupart plafonnent à cinq imports.
2. **Une couche intermédiaire gratuite.** Un petit outil open source s’intercale entre les plateformes. Airbnb et Booking importent depuis lui ; lui importe depuis chacun. La synchro devient une URL par plateforme, et ajouter un troisième canal ne demande que deux nouvelles URL, pas quatre. Le rafraîchissement de la couche intermédiaire peut être bien plus rapide que celui des plateformes : l’instance [RentTools](/onboard) interroge toutes les 10 minutes. Toujours gratuit ; vous pouvez la tourner sur un droplet à 4 $ en self-hosting, ou utiliser la version hébergée.
3. **Un Channel Manager payant.** Hostaway, Lodgify, Smoobu. Vraies API (quand le compte de l’hôte est éligible) au lieu d’iCal, donc synchro quasi temps réel dans les deux sens. À partir de 25 à 50 $ par bien et par mois, avec contrat long. Justifié au-delà de 20 annonces ou 90 % d’occupation. En dessous, c’est surtout du soulagement psychologique.

Je tourne sous l’option 2 pour mes deux appartements à Tachkent. Le calcul : à deux annonces, la couche intermédiaire me permet d’ajouter une nouvelle plateforme avec **deux** URL au total, pas les quatre que demande l’option 1. Cinq minutes de réglage ; rentabilisé dès que je publie sur Vrbo.

## Le piège du rafraîchissement dont personne ne parle

Voici le détail qu’aucun centre d’aide ne dira franchement.

Quand Airbnb dit « les calendriers se synchronisent automatiquement », ils veulent dire qu’Airbnb tire vos iCals importés toutes les 2 à 4 heures. Booking tire toutes les 2 à 6 heures. Vrbo peut être encore plus lent.

Imaginez l’option 1. Voici ce qui se passe quand un voyageur réserve votre appartement sur Airbnb à 14 h :

1. Airbnb bloque les dates immédiatement de son côté.
2. Booking.com tire le flux Airbnb entre 16 h et 20 h.
3. Pendant jusqu’à six heures, votre annonce Booking dit encore « disponible ».
4. Si un second voyageur trouve votre annonce Booking dans cet intervalle et réserve les mêmes dates, vous avez une double réservation.

C’est rare. Il faut deux acheteurs simultanés sur les deux plateformes dans la fenêtre de polling, ce qui, pour un petit hôte à faible volume, n’arrive quasiment jamais. Mais ça arrive, et quand ça arrive, ça vous coûte un remboursement, peut-être un avis négatif, et 90 minutes d’e-mails à deux inconnus pour expliquer.

L’option 2 (couche intermédiaire) en règle la moitié. Notre instance hébergée tire les flux sources toutes les 10 minutes : RentTools connaît la nouvelle réservation Airbnb dans les 10 minutes. Elle n’accélère **pas** le polling de Booking.com *vers RentTools*. Booking met toujours ses 2 à 6 heures.

Le seul correctif côté destination, c’est la connectivité par API — donc l’option 3.

C’est la vraie raison d’être des Channel Managers. Pas les fonctionnalités. Pas les beaux tableaux de bord. La mise à jour temps réel dans l’autre sens. Pour le fond technique sur pourquoi iCal ne peut jamais être plus rapide que son cycle de polling, le protocole est décrit dans la [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) ; aucune extension « push » n’est implémentée par les grandes plateformes.

## FAQ

**L’URL iCal Airbnb change-t-elle si je la réinitialise ?**
Oui. Cliquez sur **Réinitialiser l’URL** dans le panneau Synchroniser les calendriers et l’ancienne URL cesse immédiatement de fonctionner. Faites-le dès que vous suspectez une fuite : un Slack public, une capture d’écran, un message de forum. RentTools fait pivoter son URL sortante à la demande pour la même raison.

**Comment vérifier que la synchro iCal fonctionne vraiment ?**
Croisez les horodatages de dernière récupération sur les deux plateformes. Airbnb les affiche dans **Synchroniser les calendriers → Calendriers importés → Dernière importation**. Booking affiche l’équivalent sous chaque flux importé. Au-delà de 12 heures, quelque chose cloche côté source : URL changée, plateforme source qui throttle, ou URL réinitialisée.

**Peut-on s’en sortir sans outil tiers ?**
Oui. L’option 1, l’import croisé direct, suffit pour deux plateformes. Vous le regretterez dès la troisième.

**iCal est-il vraiment gratuit ?**
Oui. Airbnb et Booking.com l’exposent en self-service sur chaque compte hôte. Si un outil vous facture un abonnement mensuel rien que pour la synchro iCal, vous payez la couche de confort, pas le protocole.

**Combien coûte RentTools ?**
L’instance hébergée est gratuite, à ce jour. Le self-hosting est gratuit aussi si vous avez une machine Linux. Nous payons notre propre hébergement et nos coûts d’API Gemini. Pour le contexte sur les risques de double réservation que la synchro vise à désamorcer, lisez [éviter les doubles réservations](/blog/avoiding-double-bookings).

**Faut-il s’embêter si je ne suis que sur Airbnb ?**
Non. Les hôtes monoplateforme n’ont pas besoin de synchro iCal. Gardez cet article pour le jour où vous publierez sur une seconde plateforme.

**Que faire si le slot d’import Airbnb dit « Dernière synchro : jamais » ?**
Trois causes habituelles. (1) URL source incorrecte : collez-la dans un navigateur ; vous devriez obtenir un téléchargement de fichier `.ics` ou un bloc de texte commençant par `BEGIN:VCALENDAR`. Si c’est une page d’erreur HTML, l’URL est cassée. (2) La plateforme source a régénéré son URL et l’ancienne ne vaut plus rien : faites-la pivoter, mettez à jour côté Airbnb. (3) Airbnb throttle silencieusement les nouveaux flux pendant la première heure. Attendez une heure avant de conclure que c’est cassé.

**Booking.com utilise-t-il vraiment l’iCal que j’importe, ou a-t-il sa propre logique ?**
Booking traite les événements importés comme des blocs opaques : les dates marquées occupées dans votre flux deviennent des dates indisponibles sur Booking. Il ne regarde ni les noms de voyageurs, ni les prix, ni autre chose. C’est une fonctionnalité, pas un bug : un export iCal Booking qui fuite ne révèle que vos dates, jamais les détails voyageurs.

## Une opinion tranchée

Si vous avez un ou deux logements et que vous publiez sur Airbnb plus Booking.com, **ne payez pas encore de Channel Manager**. Câblez l’option 1 ou 2 ci-dessus. Le risque d’écart de rafraîchissement est réel mais rare à faible volume, et l’abonnement mensuel d’un outil payant va, à deux annonces, dépasser le coût attendu d’un remboursement annuel pour double réservation.

Si vous avez dix biens ou plus et tournez près de 90 % d’occupation, regardez Smoobu avant Hostaway. La grille tarifaire de Smoobu est honnête à petit volume, et il expose des API Channel Manager que les autres planquent derrière un rendez-vous commercial.

Ce n’est pas un argumentaire de vente pour l’outil que je gère. C’est juste le calcul.
