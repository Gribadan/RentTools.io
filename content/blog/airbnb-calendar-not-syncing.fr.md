---
slug: airbnb-calendar-not-syncing
locale: fr
title: "Calendrier Airbnb qui ne se synchronise pas ? 7 raisons d'un flux iCal figé"
excerpt: "Votre calendrier Airbnb ne se synchronise pas avec Booking.com ? Les 7 raisons d'un flux iCal périmé, l'unique horodatage qui les trahit, et le correctif de chacune."
status: published
tags:
  - calendar-sync:Synchro calendrier
  - ical:iCal
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/airbnb-calendar-not-syncing.webp
ogImageWidth: 1600
ogImageHeight: 900
---

L'hiver dernier, mon calendrier Booking.com a cessé sans bruit de récupérer mes blocages Airbnb. Aucune erreur — pas d'e-mail, pas de bannière rouge. L'import a simplement gelé un mardi, et je ne l'ai vu que lorsqu'un voyageur de Lyon a réservé une semaine que j'avais déjà remplie sur Airbnb. Le flux n'était « cassé » d'aucune manière que le tableau de bord aurait avouée. Il était *périmé* — et le périmé est le seul mode de défaillance dont iCal ne vous prévient jamais.

Voici le guide que j'aurais voulu avoir cette nuit-là : le seul chiffre qui dit si un flux est vraiment mort, les sept raisons pour lesquelles il se tait, et le correctif exact de chacune.

## TL;DR

- La synchro iCal ne renvoie presque jamais d'erreur — elle **se périme en silence**. L'indice, c'est l'horodatage du dernier import, pas une bannière.
- La cause la plus fréquente est une **URL source réinitialisée** : l'import pointe encore vers une URL que la source a retirée, donc chaque requête échoue.
- Airbnb récupère les flux importés toutes les **2 à 4 heures**, Booking.com toutes les **2 à 6 heures**. « Pas encore synchronisé » après trois heures, c'est normal, pas cassé.
- Un flux de plus de **24 heures** est un vrai problème. Collez l'URL source dans un navigateur : vous voulez voir `BEGIN:VCALENDAR`, pas une page d'erreur.
- Les plateformes **abandonnent un flux** après plusieurs échecs et ne disent rien. Recréer l'import le réveille.
- Une couche intermédiaire qui interroge toutes les **10 minutes** réduit la fenêtre de risque, mais ne peut pas accélérer le propre polling de la plateforme de destination.

## Pourquoi iCal se tait au lieu de casser

La synchro iCal est un *tirage*, pas un *envoi*. Quand vous « connectez » Airbnb à Booking.com, aucune des deux plateformes n'ouvre une API en direct vers l'autre. La plateforme de destination télécharge simplement une URL `.ics` publique à son propre rythme — toutes les quelques heures — et écrase ses blocages importés par ce qu'elle a trouvé.

Ce fonctionnement a un effet de bord pénible. Si l'URL source cesse de répondre — mauvaise URL, source brièvement hors ligne, source qui a fait tourner son lien —, la destination ne signale aucune panne. Elle conserve les dernières données récupérées avec succès et réessaie au cycle suivant. Du point de vue du tableau de bord, tout va bien. Le calendrier affiche encore des blocages — juste figés dans le temps.

Une vraie connexion API renverrait un `401` ou un `404` que vous verriez. iCal ne renvoie rien. Le protocole ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545)) n'a pas de canal d'envoi ni de signal standard « ce flux est mort » que les grandes plateformes transmettent à l'hôte. La panne reste donc invisible — jusqu'à ce qu'un second voyageur réserve des dates que votre autre plateforme croit libres.

## Le seul diagnostic qui compte : le dernier import

Avant de changer la moindre URL, lisez un chiffre : quand ce flux a-t-il été importé avec succès pour la dernière fois ?

- **Airbnb :** Calendar → choisissez le logement → **Availability** → **Sync calendars** → sous **Imported calendars**, chaque flux indique depuis combien de temps il a été importé.
- **Booking.com :** extranet → **Calendar & Pricing** → **Sync calendars** → la section d'import liste chaque flux connecté avec son dernier horodatage de synchro.

Maintenant, lisez-le ainsi :

| Dernier import | Verdict |
| --- | --- |
| Il y a quelques minutes à quelques heures | Sain. Arrêtez-vous là. |
| Il y a 4 à 12 heures | Sans doute correct sur Booking.com (cycle 2-6 h) ; limite sur Airbnb (2-4 h). Revérifiez dans une heure. |
| Il y a plus de 24 heures | Cassé. Déroulez la liste ci-dessous. |
| « Jamais » / vide | Jamais récupéré une seule fois. URL erronée, ou la source a bridé le premier tirage. |

Cet horodatage, c'est tout le jeu. Neuf paniques sur dix du type « mon calendrier ne se synchronise pas » sont soit un flux sain dans sa fenêtre normale, soit un flux mort depuis des jours dont personne n'a regardé la date.

## Les sept raisons pour lesquelles un flux se périme — et le correctif de chacune

### 1. L'URL source a été réinitialisée (la cause numéro un)

**Symptôme :** le flux marchait ; le dernier import remonte maintenant à plusieurs jours ou affiche « jamais ». **Cause :** quelqu'un a cliqué sur **Reset URL** côté source — vous, un co-hôte, ou vous-même après une frayeur de lien fuité. La réinitialisation tue l'ancienne URL sur-le-champ, et la destination tient encore celle qui a été retirée. Chaque requête depuis a échoué en silence avec un 404.

**Correctif :** copiez l'URL d'export *actuelle* depuis la source, supprimez l'import mort à destination et recréez-le. Puis testez l'URL (voir la vérif de la raison 5). Traitez l'URL d'export comme un mot de passe — la réinitialiser après une fuite est le bon réflexe, mais le jour même, vous devez la mettre à jour partout où elle est importée.

### 2. Vous êtes dans la fenêtre normale de rafraîchissement (fausse alerte)

**Symptôme :** vous avez bloqué des dates sur Airbnb il y a 40 minutes, et Booking.com les montre encore libres. **Cause :** rien. Booking.com tire toutes les 2 à 6 heures ; il n'a simplement pas encore lancé son prochain cycle.

**Correctif :** patientez. Si plus de 6 heures se sont écoulées pour Booking.com ou plus de 4 heures pour Airbnb, *alors* traitez ça comme réel et descendez la liste. C'est la fausse alerte la plus fréquente — l'hôte surveille la destination dix minutes et conclut que la synchro est cassée, alors qu'elle dort juste jusqu'au prochain tirage.

### 3. La plateforme a abandonné le flux en silence après des échecs répétés

**Symptôme :** le flux marchait, puis la source a été brièvement hors ligne un jour (maintenance, une URL tournée que vous avez corrigée depuis), et il ne récupère plus, même si l'URL est de nouveau vivante. **Cause :** après plusieurs requêtes échouées d'affilée, certaines plateformes cessent complètement d'interroger un flux et ne le réactivent pas d'elles-mêmes. Le compteur d'échecs s'est verrouillé.

**Correctif :** supprimez l'import et recréez exactement la même URL. Ça remet le compteur à zéro et la plateforme repart de zéro. Une URL vivante qui ne se synchronise toujours pas après 24 heures, c'est presque toujours ce cas.

### 4. iCal est désactivé sur le compte source

**Symptôme :** il n'y a aucune URL d'export à copier, ou le panneau **Sync calendars** a disparu côté source. **Cause :** les comptes sous contrat channel manager ou partenaire API ont iCal coupé par conception — la plateforme considère l'API comme source de vérité. Certains types de biens Booking.com (hôtels classiques, par opposition aux locations de vacances) n'exposent jamais iCal.

**Correctif :** si vous avez signé un accord partenaire/API, c'est attendu — votre synchro passe par l'API, pas par iCal. Si vous n'avez rien signé et qu'iCal a simplement disparu, contactez le support partenaire ; pour les biens en location de vacances, ils le réactivent.

### 5. Le flux s'importe, mais les blocages n'arrivent pas

**Symptôme :** le dernier import est récent — il y a quelques minutes —, mais les dates restent libres. **Cause :** l'import a réussi, mais les événements ne portent aucun statut occupé, ou l'importateur ne lit que les événements `DATE` sur la journée entière alors que la source a envoyé des événements horodatés. Rare avec Airbnb et Booking.com (ils envoient des blocages journée entière propres), fréquent avec des flux maison ou obscurs.

**Correctif :** ouvrez le `.ics` dans un éditeur de texte et regardez un `VEVENT`. Vous voulez des blocages journée entière du style `DTSTART;VALUE=DATE:20260714` sur les dates attendues. Voici le test navigateur rapide pour *n'importe quelle* URL iCal :

1. Collez l'URL d'export dans la barre d'adresse du navigateur.
2. Un flux vivant télécharge un fichier `.ics` ou affiche du texte commençant par `BEGIN:VCALENDAR`.
3. Une page d'erreur HTML, un écran de connexion ou une réponse vide veut dire que l'URL est morte — retour à la raison 1.

### 6. Un décalage de fuseau horaire décale chaque blocage d'un jour

**Symptôme :** les blocages s'importent, mais tombent un jour à côté — jour de départ bloqué, jour d'arrivée libre, ou l'inverse. **Cause :** un flux qui envoie des événements *horodatés* avec un `TZID` que la destination lit en UTC peut faire basculer un blocage après minuit. Un début à 23 h 00 heure locale devient le lendemain en UTC.

**Correctif :** préférez les blocages journée entière (`VALUE=DATE`) aux horodatés. Les grandes plateformes le font déjà ; si le flux est à vous (auto-hébergé, export sur mesure), envoyez des dates, pas des date-heures. Si vous devez consommer un flux horodaté, le décalage d'exactement un jour est l'indice — ne perdez pas une heure à accuser l'URL.

### 7. Vous avez atteint le plafond de créneaux d'import

**Symptôme :** vous ne pouvez plus ajouter un calendrier importé, ou le plus récent est ignoré en silence. **Cause :** la plupart des plateformes plafonnent les flux importés à environ cinq par logement. Listez sur Airbnb, Booking.com, Vrbo, Expedia et un site direct, et les créneaux s'épuisent vite quand chaque plateforme doit importer toutes les autres.

**Correctif :** repliez le maillage en étoile. Au lieu que N plateformes importent chacune N−1 autres, faites tourner un flux intermédiaire par plateforme : chaque plateforme importe le hub, le hub importe chaque plateforme. Deux plateformes, c'est quatre URL directes ; le hub en fait deux. C'est aussi la raison pour laquelle l'import croisé direct cesse de passer l'échelle au-delà de deux plateformes — plus de détails dans [éviter les doubles réservations](/blog/avoiding-double-bookings).

## Quand le trou est celui de la plateforme, pas le vôtre

Voici la partie honnête. Même avec les sept causes écartées et chaque flux sain, le propre tirage de la plateforme de destination reste le plancher. Booking.com tire toutes les 2 à 6 heures, et vous n'y changez rien.

Une couche intermédiaire règle la moitié du problème. Un outil open source comme [RentTools](/onboard) — ou un cron que vous écrivez vous-même — interroge les flux *sources* toutes les 10 minutes, si bien que votre hub apprend une nouvelle réservation Airbnb en dix minutes plutôt qu'en heures. Ce qu'il ne peut pas faire : obliger Booking.com à tirer *depuis le hub* plus vite que Booking.com ne le veut. La seule chose qui bat le cycle de polling, c'est la connexion API en temps réel, qu'Airbnb et Booking.com ne vendent qu'aux PMS certifiés, à 100-300 $ par mois.

Pour un à trois logements, ne perdez pas le sommeil à cause de la fenêtre de rafraîchissement. Les causes de péremption ci-dessus — une URL réinitialisée que personne n'a mise à jour, un flux que la plateforme a abandonné en silence — provoquent à petite échelle bien plus de doubles réservations que le tirage de 2 à 6 heures. Si vous voulez la mise en place complète plutôt que le dépannage, commencez par [synchroniser gratuitement les calendriers Airbnb et Booking.com](/blog/airbnb-booking-calendar-sync-free).

## FAQ

**Pourquoi mon calendrier Airbnb affiche-t-il « Last sync: never » ?**
Le flux n'a jamais été récupéré avec succès une seule fois. Trois causes habituelles : l'URL d'import est erronée (collez-la dans un navigateur — vous devriez obtenir un téléchargement `.ics` ou du texte commençant par `BEGIN:VCALENDAR`, pas une page d'erreur) ; la plateforme source a fait tourner son URL après que vous en avez copié une plus ancienne ; ou Airbnb a brièvement bridé le tout premier tirage d'un nouveau flux. Attendez une heure et revérifiez avant de conclure que c'est cassé.

**Combien de temps Airbnb met-il à synchroniser un calendrier importé ?**
Airbnb tire les flux importés toutes les 2 à 4 heures. Booking.com est plus lent, 2 à 6 heures, et Vrbo peut l'être encore plus. Si vous avez bloqué des dates il y a quelques minutes, l'autre plateforme ne le sait légitimement pas encore. N'y voyez un problème qu'une fois le flux sorti de sa fenêtre normale.

**Mon calendrier Booking.com ne bloque pas des dates que j'ai remplies sur Airbnb. Quel est le souci ?**
Vérifiez d'abord l'horodatage du dernier import côté Booking.com. S'il date de quelques heures et qu'il est frais, l'import marche et vous êtes juste dans la fenêtre de rafraîchissement — patientez. S'il a plus de 24 heures ou affiche « jamais », l'URL est sans doute morte : réinitialisée côté Airbnb, ou abandonnée par Booking.com après des échecs. Recopiez l'URL d'export Airbnb actuelle et recréez l'import.

**Réinitialiser mon URL iCal casse-t-il mes synchros existantes ?**
Oui, immédiatement. Dès que vous cliquez sur Reset URL, l'ancien lien cesse de marcher, et toute plateforme qui l'importe encore se périme en silence. Réinitialiser est la bonne réponse à une URL fuitée, mais le jour même, vous devez coller la nouvelle URL partout où l'ancienne était importée.

**Comment tester si une URL iCal est vraiment vivante ?**
Collez-la dans la barre d'adresse du navigateur. Un flux vivant télécharge un fichier `.ics` ou affiche du texte commençant par `BEGIN:VCALENDAR`. Si vous tombez sur une page d'erreur HTML, un écran de connexion ou rien, l'URL est morte — c'est votre problème, pas celui de la plateforme de destination.

**Un flux iCal périmé peut-il provoquer une double réservation ?**
Oui — c'est exactement le mécanisme. Si votre import Booking.com du calendrier Airbnb est gelé depuis deux jours, Booking.com montre encore libres des dates qu'Airbnb a déjà vendues. Un second voyageur les réserve, et vous devez à l'un des deux une annulation et des excuses. C'est pour ça que la vérif hebdomadaire de l'horodatage compte.

**Pourquoi n'y a-t-il pas d'erreur quand la synchro iCal échoue ?**
Parce qu'iCal est un protocole de tirage sans canal d'envoi ni signal de santé standard. La destination tire une URL au rythme ; si le tirage échoue, elle conserve les dernières bonnes données et réessaie plus tard. Rien dans le standard n'oblige la destination à vous alerter — donc elle ne le fait pas.

**À quelle fréquence RentTools rafraîchit-il les flux ?**
Toutes les 10 minutes côté source. Le hub apprend donc une nouvelle réservation en dix minutes, contre les heures qu'exige un import direct de plateforme à plateforme. Il ne peut pas pour autant forcer la plateforme de destination à tirer du hub plus vite que son propre cycle de 2 à 6 heures — aucun outil iCal ne le peut.

## Une opinion assumée

Cessez de voir la fenêtre de rafraîchissement comme l'ennemie. Le problème spectaculaire « iCal n'est pas en temps réel » provoque à petite échelle moins de doubles réservations que l'ennuyeux : une URL que quelqu'un a réinitialisée et oublié de mettre à jour, un flux que la plateforme a cessé d'interroger sans bruit. Les deux restent invisibles tant que vous ne regardez pas le dernier import — alors regardez-le. Une fois par semaine, ouvrez chaque flux importé et lisez une date. Une habitude de vingt secondes qui attrape les pannes silencieuses que le tableau de bord est trop content de vous cacher.
