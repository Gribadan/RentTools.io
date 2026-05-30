---
slug: wifi-short-term-rental-setup
locale: fr
title: "Wi-Fi pour location courte durée : débit, routeur et secours 4G"
excerpt: "Le débit en Mbit/s dont vos voyageurs ont vraiment besoin, le routeur qui ne lâche pas au bout de quatre mois, et le secours 4G qui transforme trois nuits de panne en non-événement."
status: published
tags:
  - host-tips:Conseils hôte
  - tools:Outils
  - automation:Automatisation
ogImageUrl: /blog-covers/wifi-short-term-rental-setup.webp
ogImageWidth: 1600
ogImageHeight: 900
---

La première note d'une étoile à cause du Wi-Fi, je l'ai eue pour un routeur qui a tourné impeccablement 47 semaines sur 52. La semaine où il a flanché, une voyageuse en télétravail a vu son appel vidéo couper trois fois en douze minutes. Elle a renoncé, n'a pas pu ouvrir de ticket support depuis le partage de connexion de son téléphone, et m'a laissé une évaluation intitulée «&nbsp;Wi-Fi inutilisable&nbsp;», sans aucun texte. Le routeur s'est redémarré tout seul environ une heure après son départ et a fonctionné sans encombre pendant les neuf mois suivants. Je n'aurais jamais su qu'il avait planté si elle ne me l'avait pas dit publiquement, au pire moment, à l'endroit le plus lu de l'annonce.

Cet article décrit l'installation Wi-Fi qui empêche cette évaluation. Le débit que vos voyageurs utilisent réellement (ce n'est pas le chiffre du speedtest mis en avant), le routeur qui tient au-delà du quatrième mois dans un appartement réel, et le secours 4G à 10&nbsp;€ par mois qui transforme la pire catégorie de plainte en non-événement avant même que le voyageur ne s'en aperçoive.

## TL;DR

- La plupart des voyageurs ont besoin de 25&nbsp;Mbit/s en descente, pas 100. Achetez de la marge, pas le chiffre affiché sur la page commerciale.
- Un routeur à 40&nbsp;€ suffit pour un logement. À partir de quatre, le taux de panne rend le kit mesh à 180&nbsp;€ moins cher que les remboursements.
- Un secours 4G avec eSIM data à 10&nbsp;€/mois coûte moins par an que le remboursement d'une seule nuit de coupure.
- Le coût caché principal, c'est la panne silencieuse&nbsp;: le routeur tombe au premier jour d'un séjour de cinq nuits et vous l'apprenez par l'évaluation au septième.
- SSID et mot de passe en trois endroits&nbsp;: carte plastifiée sur le plan de travail, livret numérique, autocollant sur la serrure connectée. Le voyageur trouvera l'endroit où il regarde en premier.
- Un ping toutes les 5&nbsp;minutes, alerte après trois échecs consécutifs. Vingt minutes d'installation une fois, et plus jamais d'évaluation «&nbsp;le Wi-Fi ne marchait pas&nbsp;».

## Le débit réellement nécessaire

Les hôtes payent trop cher pour la vitesse parce que la page du fournisseur fait passer l'offre à 100&nbsp;Mbit/s pour dix fois plus performante que celle à 25&nbsp;Mbit/s, alors qu'il n'y a que 15&nbsp;€ d'écart. Et un voyageur écrit ensuite «&nbsp;Wi-Fi lent&nbsp;» dans l'évaluation d'un appartement équipé d'une fibre 1&nbsp;Gbit/s qui sortait 480&nbsp;Mbit/s le matin du départ.

Ce que «&nbsp;lent&nbsp;» veut presque toujours dire dans ces évaluations&nbsp;:

- Le signal tombait à une barre dans la chambre. Le routeur était dans l'entrée derrière un radiateur en métal.
- Le routeur a planté pendant 40&nbsp;minutes en journée et s'est redémarré seul avant que le voyageur ne vous écrive.
- Le DNS était mal configuré et Netflix mettait 14&nbsp;secondes à charger une miniature.
- Le voyageur s'est connecté au 2,4&nbsp;GHz parce que le 5&nbsp;GHz portait le même nom et le téléphone a choisi le signal le plus fort, donc le plus lent.

Aucun de ces problèmes ne se règle en achetant plus de Mbit/s. Ils se règlent en plaçant correctement le routeur, en activant une seconde bande qui fonctionne et en utilisant un DNS qui n'est pas celui par défaut du fournisseur. Le budget réel de bande passante selon les usages courants&nbsp;:

| Usage | Par flux | Marge confortable |
| --- | --- | --- |
| Netflix 1080p | 5&nbsp;Mbit/s | 8&nbsp;Mbit/s |
| Netflix 4K | 25&nbsp;Mbit/s | 35&nbsp;Mbit/s |
| Zoom / Google Meet HD | 3,5&nbsp;Mbit/s up, 3,5&nbsp;Mbit/s down | 6&nbsp;Mbit/s |
| Spotify | <1&nbsp;Mbit/s | 1&nbsp;Mbit/s |
| Sauvegarde cloud en arrière-plan | 5–10&nbsp;Mbit/s up | 15&nbsp;Mbit/s up |

Deux adultes qui regardent du 4K Netflix sur deux téléviseurs pendant qu'une troisième personne fait un appel Zoom demandent environ 80&nbsp;Mbit/s en descente et 8&nbsp;Mbit/s en montée. C'est le pire cas raisonnable pour un T3, et une fibre symétrique 100/100 le couvre deux fois.

Le chiffre qui compte vraiment dans les villes à forte densité de télétravailleurs — Lisbonne, Mexico, Bali, Tbilissi — c'est le **débit montant**. Un voyageur qui fait quatre appels Zoom par jour sur une offre câble 100/10 avec trois autres personnes sur le réseau saturera la montée une fois par semaine et appellera ça «&nbsp;votre Wi-Fi&nbsp;». Quand vous avez le choix&nbsp;: fibre 50/50 ou 100/100. Dix euros de plus, cette évaluation disparaît.

## Le routeur qui tient au-delà du quatrième mois

J'ai changé suffisamment de routeurs grand public dans suffisamment d'appartements pour avoir une règle&nbsp;: le taux de panne d'une boîte plastique à 40&nbsp;€ en location courte durée réelle est tellement élevé qu'à partir du quatrième logement, un système mesh est déjà rentable.

Ce qui a réellement cassé chez moi&nbsp;:

- Routeurs double bande bon marché (TP-Link Archer C6, classe AC1750)&nbsp;: un sur trois tombe en 18&nbsp;mois de fonctionnement 24/7. Surtout les condensateurs, dans les cuisines humides.
- Milieu de gamme une seule unité (ASUS RT-AX55, Netgear Nighthawk AX1800)&nbsp;: un sur huit tombe sur la même période. Souvent un problème de firmware — l'appareil fonctionne mais la bande 5&nbsp;GHz disparaît silencieusement, et seul un redémarrage la ramène.
- Systèmes mesh (TP-Link Deco, Google Nest, eero)&nbsp;: un sur vingt tombe en 24&nbsp;mois. La redondance fait partie du système&nbsp;: si un nœud meurt, les autres continuent de servir le Wi-Fi pendant que vous expédiez un remplacement.

La comparaison de coûts sur quatre logements et 24&nbsp;mois&nbsp;:

| Solution | Matériel | Remplacements | Nuits remboursées | Total 24&nbsp;mois |
| --- | --- | --- | --- | --- |
| Routeur 40&nbsp;€ × 4 | 160&nbsp;€ | 160&nbsp;€ (3 remplacements) | 400&nbsp;€ (4 nuits × 100&nbsp;€) | **720&nbsp;€** |
| Milieu de gamme 90&nbsp;€ × 4 | 360&nbsp;€ | 180&nbsp;€ (2 remplacements) | 200&nbsp;€ (2 nuits × 100&nbsp;€) | **740&nbsp;€** |
| Mesh 180&nbsp;€ × 4 logements (2 nœuds chacun) | 720&nbsp;€ | 90&nbsp;€ (1 remplacement) | 100&nbsp;€ (1 nuit × 100&nbsp;€) | **910&nbsp;€** |

Le mesh paraît le pire sur la colonne matériel. Il est le meilleur sur la colonne expérience voyageur&nbsp;: la zone morte de la chambre du fond disparaît, l'évaluation «&nbsp;signal qui coupe&nbsp;» n'arrive jamais, et l'unique remboursement total que vous évitez vaut six mois de surcoût. À partir du cinquième ou sixième logement, le mesh devient la ligne la moins chère.

Pour un seul petit appartement, un routeur milieu de gamme bien placé suffit. Le seuil à partir duquel le mesh commence à se rentabiliser, c'est environ **80&nbsp;m² ou trois pièces avec portes fermées entre le routeur et le lit**. En dessous, un seul AX1800 en position centrale l'emporte.

## Le secours 4G que presque personne n'installe

Voici le chiffre qui change la conversation&nbsp;: un routeur de secours 4G (ou un modem USB branché sur le routeur principal) avec une carte data à 8–12&nbsp;€/mois revient à environ **140&nbsp;€ par an**. Une nuit remboursée sur un logement à 90&nbsp;€, c'est **90&nbsp;€ plus l'évaluation perdue**. Le calcul du secours 4G cesse d'avoir un sens dès la première panne évitée.

Les configurations habituelles&nbsp;:

- Un routeur grand public avec port USB acceptant un modem 4G USB (TP-Link Archer C7, Netgear Nighthawk, la plupart des firmwares AsusWRT). On branche le modem, on configure le failover dans l'admin, terminé. ~40&nbsp;€ le modem, 8&nbsp;€/mois la carte.
- Un boîtier de secours 4G dédié (TP-Link MR600, Teltonika RUT240, Cradlepoint en entreprise). Il se place entre le modem et le switch&nbsp;; quand le WAN tombe, le trafic bascule sur 4G sans rupture. ~100&nbsp;€ le boîtier, 10&nbsp;€/mois la carte.
- Un système mesh avec backhaul 4G natif (TP-Link Deco X20-4G, Nest WiFi Pro avec téléphone associé). Plus cher en matériel, mais tout le réseau — zones mortes comprises — continue de fonctionner.

Le marché de l'eSIM rend tout cela bon marché en 2026. **Airalo** et **Holafly** vendent des eSIM data uniquement à 5–10&nbsp;€/mois dans la plupart des pays, sans contrat, sans changement de carte physique&nbsp;; de nombreux boîtiers de secours acceptent désormais l'eSIM directement. Il y a trois ans, cette option n'existait pas pour un hôte occasionnel&nbsp;; aujourd'hui, c'est les 150&nbsp;€ les plus rentables qu'un hôte puisse mettre dans un logement.

Une nuance&nbsp;: la vitesse de secours, c'est de la 4G, pas de la fibre. Un voyageur en plein appel Zoom au moment où la fibre tombe verra une à deux secondes de baisse de qualité pendant la bascule, et si le logement ne capte que deux barres de 4G, le reste de la journée sera «&nbsp;Wi-Fi lent&nbsp;» au lieu de «&nbsp;Wi-Fi mort&nbsp;». Le premier, c'est une évaluation à quatre étoiles. Le second, c'est un remboursement et une étoile.

## La surveillance qui attrape la panne silencieuse

Le routeur peut fonctionner et Internet peut être mort. Le câble de l'immeuble a été coupé, le fournisseur a une panne régionale, le modem s'est figé sans que le routeur le remarque. Rien de tout cela n'apparaît comme une faute du routeur dans son interface admin. La seule manière de le savoir, c'est de tester depuis l'extérieur du réseau.

L'installation que j'utilise gratuitement sur chaque logement&nbsp;:

1. Un petit script heartbeat sur un Raspberry Pi à 35&nbsp;€ ou, plus souvent aujourd'hui, sur un VPS&nbsp;: il pingue l'IP publique du logement toutes les 5&nbsp;minutes.
2. Après trois échecs consécutifs (15&nbsp;minutes sans réponse), il envoie un message Telegram ou Slack.
3. Après 30&nbsp;minutes d'échecs, il envoie aussi un message à l'agent d'entretien avec l'instruction standard «&nbsp;merci de redémarrer le boîtier avec l'étiquette verte&nbsp;».

Temps total&nbsp;: 20&nbsp;minutes par logement la première fois, 5&nbsp;minutes les fois suivantes. La première alerte arrive environ une heure avant que le voyageur ne s'en aperçoive, et dans 80&nbsp;% des cas, le routeur peut être redémarré à distance (ou l'agent d'entretien envoyé) avant que le voyageur ne voie quoi que ce soit.

Pour ceux qui ne veulent pas écrire de script, les équivalents hébergés bon marché&nbsp;:

- **UptimeRobot** gratuit&nbsp;: 50 moniteurs, intervalle de 5&nbsp;minutes, alertes email et push. 0&nbsp;€/mois.
- **BetterStack** (anciennement Better Uptime) Starter&nbsp;: intervalle 30&nbsp;secondes, rotations d'astreinte. 20&nbsp;€/mois pour les opérateurs sérieux.
- Un routeur grand public avec ping-watchdog intégré (la plupart des builds AsusWRT et OpenWRT)&nbsp;: aucun service externe nécessaire.

C'est l'heure de Wi-Fi la plus rentable qu'un hôte ne fera jamais. La panne qui aurait sinon coûté une étoile est attrapée, et vous l'apprenez à 11h30 du matin quand vous avez le temps, pas à 23h45 quand le voyageur est déjà en train de taper.

## Où les voyageurs cherchent vraiment le mot de passe

Trois endroits. Le voyageur regarde à un seul des trois et jamais aux deux autres&nbsp;:

1. **Une carte plastifiée sur le plan de travail ou la table d'entrée.** Plastique, A6. SSID et mot de passe en 24 points gras, pour qu'un téléphone à écran fissuré les lise à un mètre. Coût&nbsp;: 2&nbsp;€ d'impression, 1&nbsp;€ de plastification, 4&nbsp;minutes de travail.
2. **Le livret numérique.** Mêmes SSID et mot de passe en première ligne de la section Wi-Fi. Si vous utilisez [un outil de livret numérique](/fr/blog/digital-guidebook-short-term-rental), le champ existe déjà. Sinon, envoyez les infos Wi-Fi en message séparé 30&nbsp;minutes après l'arrivée, pas dans le paragraphe de bienvenue.
3. **Un petit autocollant sur le clavier de la serrure connectée ou sur le boîtier à clés.** Trois lignes&nbsp;: SSID, mot de passe, «&nbsp;si le Wi-Fi ne marche pas, écrivez-moi d'abord&nbsp;». C'est l'endroit que trouvent les voyageurs qui arrivent à minuit et ne voient pas la carte sur la cuisine parce que la lumière est éteinte.

J'ai arrêté de mettre les infos Wi-Fi dans le message de bienvenue. Les voyageurs scrollent au-delà et redemandent l'info plus tard dans un séjour sur trois. La carte sur le plan de travail et l'autocollant sur la serrure se lisent une fois, par chaque voyageur, dans la première minute.

## Que faire quand le Wi-Fi tombe en plein séjour

La procédure ressemble à [celle d'un échec d'arrivée autonome](/fr/blog/self-check-in-failure-playbook)&nbsp;: la première minute, c'est un message&nbsp;; la première heure, c'est la réparation&nbsp;; après l'incident, c'est l'évaluation.

Première minute&nbsp;: accuser réception en moins de 5&nbsp;minutes. «&nbsp;Je vois l'alerte, le secours 4G devrait être actif sous 30&nbsp;secondes — patientez 60&nbsp;secondes et reconnectez-vous&nbsp;; si ça ne marche pas, écrivez-moi.&nbsp;» Si votre surveillance a alerté avant le voyageur, ce message part avant le sien, et tout l'incident bascule de la plainte au moment de service client.

Première heure&nbsp;: si le secours 4G est actif, le réseau est revenu. Sinon, deux options&nbsp;:

- Redémarrage à distance (prise connectée sur le routeur/modem, 15&nbsp;€ en ligne, pilotée depuis le téléphone de l'hôte)&nbsp;: 90&nbsp;% des problèmes côté routeur se résolvent.
- Visite de l'agent d'entretien ou du co-hôte&nbsp;: 30&nbsp;minutes de délai dans la plupart des villes, 5&nbsp;minutes sur place, problème réglé.

La compensation&nbsp;: si la panne fait moins de 90&nbsp;minutes, la bonne offre est «&nbsp;je prolonge votre départ d'une heure et je vous envoie un bon café au bistrot en bas&nbsp;». Si elle dure 6&nbsp;heures et plus, la bonne offre est le remboursement d'une nuit avec un «&nbsp;cela ne se reproduira pas, voici ce que nous avons changé&nbsp;» explicite. Ne proposez pas de remboursement partiel avant que le voyageur ne le demande — vous l'entraînez à en demander davantage la prochaine fois. Dès qu'il l'a mentionné une fois, remboursez vite et visiblement, avant qu'il ne poste l'évaluation.

## FAQ

**Quel débit Wi-Fi faut-il pour un Airbnb ?**

Pour la plupart des logements, 50–100&nbsp;Mbit/s en descente avec au moins 10&nbsp;Mbit/s en montée sont confortables&nbsp;: deux flux 4K simultanés plus un appel Zoom passent sans souci. Les offres moins chères (25/5) couvrent un flux et de la navigation légère — bien pour un studio, insuffisant pour une famille dans un T4. La fibre symétrique (100/100) est l'amélioration qui compte le plus pour les voyageurs en télétravail, car la montée est l'endroit où les offres câble étouffent les appels.

**Le mesh Wi-Fi en vaut-il la peine pour une seule location courte durée ?**

Pour un petit studio ou un T2 de moins de 60&nbsp;m², non — un routeur milieu de gamme bien placé suffit et coûte moins. Pour un logement T3+, une configuration en L ou une pièce avec porte fermée entre le routeur et le lit, oui — le kit mesh à 180&nbsp;€ supprime la zone morte de la chambre du fond, à l'origine de la plupart des évaluations «&nbsp;Wi-Fi lent&nbsp;». À trois ou quatre logements, la statistique des pannes penche aussi vers le mesh.

**Quel est le secours 4G le moins cher pour une location ?**

Un modem 4G USB (30–40&nbsp;€, Huawei E3372 ou équivalent) branché sur un routeur qui accepte un WAN USB, plus une eSIM data uniquement à 5–10&nbsp;€/mois chez Airalo ou un opérateur local&nbsp;: 100–150&nbsp;€ la première année. Un boîtier de failover dédié (TP-Link MR600, Teltonika RUT240) coûte plus cher en matériel mais s'installe en une minute. Les deux se rentabilisent à la première panne évitée sur un logement à 70&nbsp;€ ou plus la nuit.

**Faut-il séparer le Wi-Fi des voyageurs de son réseau administrateur ?**

Oui. La plupart des routeurs grand public et prosumer supportent un réseau invité — activez-le, donnez-y le SSID et le mot de passe publics, et laissez le réseau admin sur un autre SSID avec accès admin réservé à vous et à la domotique. Cela empêche un voyageur de redémarrer le routeur par erreur, de le reflasher, ou d'atteindre l'interface web d'une serrure connectée. Cela vous permet aussi de redémarrer le réseau invité sans couper la serrure.

**Comment prouver que le Wi-Fi fonctionnait quand un voyageur affirme le contraire ?**

Faites tourner une surveillance externe (UptimeRobot, BetterStack, script de ping auto-hébergé). Elle produit une page de statut publique ou un journal téléchargeable avec des pings toutes les 5&nbsp;minutes. Si un voyageur écrit «&nbsp;Wi-Fi coupé tout le séjour&nbsp;» et que le journal indique 100&nbsp;% de disponibilité, vous avez la preuve à présenter au support Airbnb, qui parfois retire ou modère l'évaluation sur la base d'affirmations vérifiables. La surveillance se paie au premier recours réussi.

**Un voyageur peut-il modifier les réglages de mon routeur ?**

S'il est sur le réseau admin et connaît le mot de passe administrateur (parfois imprimé sur l'appareil), oui — il peut tout faire, renommer le réseau, changer le mot de passe et vous bloquer. Sur un réseau invité bien configuré, non — pas d'accès à l'interface d'administration. Changez le mot de passe admin par défaut le jour de l'installation&nbsp;; les valeurs par défaut sont publiques, et certains voyageurs de mauvaise foi les essaient.

**Faut-il un portail captif ou une charte d'utilisation ?**

Dans la plupart des pays, non — le voyageur n'est pas un utilisateur de Wi-Fi public, c'est un locataire payant qui utilise un équipement inclus. Dans certaines juridictions (Italie, parties de l'Espagne), une identification a historiquement été exigée pour tout Wi-Fi commercial&nbsp;; en pratique, c'est rarement appliqué aux locations courte durée. Pour une protection ceinture-et-bretelles, un portail captif d'une page «&nbsp;en vous connectant, vous vous engagez à ne pas utiliser le réseau à des fins illégales&nbsp;; le trafic est journalisé&nbsp;» s'installe en 20&nbsp;minutes sur la plupart des routeurs prosumer et transfère proprement la responsabilité au voyageur.

**Quelle marque de routeur tient en climat chaud ou humide ?**

Dans mes logements, ASUS et TP-Link milieu de gamme ont dépassé Netgear grand public d'environ 50&nbsp;% dans des appartements côtiers humides. Les systèmes mesh à refroidissement passif (sans ventilateur) vivent plus longtemps que ceux à refroidissement actif, parce que les ventilateurs se bloquent. L'action qui prolonge vraiment la durée de vie et bat n'importe quel choix de marque&nbsp;: placer le routeur dans le coin le plus frais de la pièce, à au moins 30&nbsp;cm du sol, avec 10&nbsp;cm de dégagement de chaque côté. Un routeur sur une étagère haute dans un couloir aéré vit deux fois plus longtemps que le même routeur sur le meuble TV à côté du radiateur.

## Une conviction tranchée

La plupart des hôtes payent trop pour la vitesse et pas assez pour la disponibilité. Un voyageur oubliera les 100&nbsp;Mbit/s au troisième jour de son séjour. Il ne pardonnera jamais zéro Mbit/s au premier. Si vous ne devez retenir qu'une seule chose de cet article&nbsp;: installez [une surveillance](/fr/onboard) avant d'acheter un nouveau routeur — le routeur que vous avez déjà va sans doute bien, et la panne silencieuse dont vous ignorez l'existence est l'auteur de l'évaluation à venir.
