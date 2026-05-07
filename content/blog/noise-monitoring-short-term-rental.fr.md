---
slug: noise-monitoring-short-term-rental
locale: fr
title: "Capteur de bruit en location courte durée : Minut vs NoiseAware vs Roomonitor"
excerpt: Comparatif coût 12 mois de Minut, NoiseAware et Roomonitor pour hôtes en STR — plus le réglage de seuil qui décide si vous attrapez la fête ou agacez les voyageurs calmes.
status: published
tags:
  - host-tips:Conseils hôtes
  - tools:Outils
  - automation:Automatisation
  - gdpr:GDPR
ogImageUrl: /blog-covers/noise-monitoring-short-term-rental.webp
ogImageWidth: 1600
ogImageHeight: 900
---

La première fois que j’ai attrapé une fête dans un de mes appartements, je l’ai attrapée à 6 h 40 le lendemain matin, en revenant d’une école, quand un voisin m’a coincé dans le hall et m’a demandé, très poliment, si j’étais au courant qu’il y avait eu « une quarantaine de personnes » dans le logement jusqu’à 3 h. Je n’étais pas au courant. Le capteur Minut que j’avais boulonné au plafond du couloir quatre mois plus tôt ne m’avait envoyé aucune alerte. Je suis monté, j’ai ouvert l’appli, et j’ai découvert que j’avais réglé le seuil à 90 dB soutenus pendant 15 minutes — une valeur que je sais désormais correspondre à « deux aspirateurs industriels côte à côte ». Une vraie fête plafonne à 85 dB et redescend pour les refrains. L’appareil avait fait exactement ce que je lui avais dit : rien.

Voici l’article que j’aurais dû lire avant l’achat. Calcul de coût 12 mois pour les trois appareils que les hôtes choisissent vraiment — Minut, NoiseAware Pro et Roomonitor — le réglage de seuil qui transforme l’appareil de presse-papier à 300 $ en outil utile, le piège RGPD et déclaration que la com’ vendeur ne mentionne jamais, et où, au mur, l’installer pour de vrai.

## TL;DR

- Le matériel coûte **150 à 220 $ par unité** ; l’abonnement est le plus gros coût sur 3 ans. Comptez **320 à 430 $ tout compris sur 12 mois** par bien.
- Les trois appareils mesurent **uniquement le niveau en décibels** ; aucun n’enregistre l’audio. Cette promesse est réelle et c’est l’ancrage juridique pour les utiliser dans l’UE.
- Le seuil par défaut sort à **70–80 dB soutenus pendant 5 minutes**. Descendez (70 dB / 10 min) pour les fêtes — plus vous montez, plus vous n’attrapez que des événements dignes de réacteur d’avion qu’on entendrait depuis l’autre côté de la rue.
- Vous **devez déclarer** l’appareil dans l’annonce et le message pré-arrivée. Le RGPD article 13 rend la transparence obligatoire ; en France et certains Länder allemands, la formulation est explicite.
- L’emplacement compte plus que la marque : centre du couloir, fixé au plafond, **pas dans une chambre, pas à moins de 2 m d’une bouche de VMC**. Mauvais emplacement = équivalent d’un parfum d’ambiance.

## Ce que fait vraiment un capteur de bruit (et ce qu’il ne peut pas)

Un capteur de bruit est un petit palet — fixé au mur, au plafond, parfois en prise — qui échantillonne le niveau sonore ambiant plusieurs fois par seconde et reporte le dB à un tableau de bord cloud. Il n’enregistre pas l’audio. Il ne peut pas vous dire ce qui a été dit. Il ne peut pas identifier les voix. La promesse de confidentialité, c’est le produit, pas un argument com’ — Minut livre son matériel sans micro capable d’enregistrer en bande de parole, et NoiseAware fait l’équivalent par traitement local qui jette tout en dessous du seuil dB.

Ce qu’il peut faire, en pratique :

1. **Envoyer une notification push** quand le niveau dépasse votre seuil pendant la durée définie (ex. 80 dB soutenus pendant 10 minutes).
2. **Déclencher un message automatique au voyageur** (« Bonjour, nous notons un niveau sonore plus élevé que d’habitude — merci de garder le calme après 22 h, des voisins ont déjà appelé par le passé ») — Minut et NoiseAware fournissent des modèles.
3. **Tracer un graphe nocturne** pour voir d’un coup d’œil si la nuit dernière a eu un pic à 2 h ou non.
4. **Se coupler avec un thermostat / capteur d’occupation** pour estimer « plus de monde que réservé » — c’est l’argument phare de Roomonitor, et c’est essentiellement heuristique.

Ce qu’il ne peut pas :

- Vous dire si le bruit est une chaîne hi-fi, un aspirateur, un bébé qui pleure, ou trente personnes qui crient. Il ne connaît que les dB.
- Détecter les fêtes silencieuses (oui, ça existe — dîners adultes, réunions de travail).
- Remplacer un coup de fil. Une fois le seuil franchi, il faut quand même écrire au voyageur, et s’il ne répond pas, il faut quand même y aller. L’appareil achète la **détection**, pas la **réponse**.

Si votre modèle mental est « cet appareil va gérer les fêtes pour moi », effacez-le. Le modèle réaliste : « ça me dit qu’une fête commence avant que le voisin n’appelle, donc j’ai 90 minutes pour écrire au voyageur avant que les dégâts ne soient faits ».

## Les trois appareils que les hôtes choisissent

Tarifs 2026, équivalent USD pour la clarté. Les tarifs UE sont approximativement les mêmes en €.

| | Minut Smart Home Monitor | NoiseAware Pro (Gen 3) | Roomonitor |
|---|---|---|---|
| Matériel | 199 $ | 149 $ | 220 € |
| Abonnement | 9,95 $/mois ou 99 $/an | 99 $/an/bien | 14 €/mois/bien |
| Alimentation | 6 piles AA (~12 mois) | USB-C prise murale | USB-C ou PoE |
| Enregistrement | dB seulement, pas d’audio | dB seulement, rejet sur appareil | dB seulement |
| Autres capteurs | Mouvement, température, humidité | Aucun | Estimation d’occupation (sondes Wi-Fi) |
| Fixation | Plafond, support magnétique | Prise murale | Mur |
| Message auto voyageur | Oui (modèles) | Oui (modèles) | Oui |
| Intégrations PMS | Hostaway, Hospitable, Smoobu, OwnerRez | Hostaway, Hospitable, OwnerRez | Hostaway, Avantio |
| Coût mensuel @ 1 bien | ~8,25 $/mois | ~8,25 $/mois | ~15 $/mois |
| Meilleur pour | Détection sur tout le bien, look résidentiel | Prix d’appel le plus bas, appli la plus propre | Multi-unité / hostel avec occupation |

Les trois sont plus similaires que la com’ ne le suggère. Le matériel est interchangeable pour le travail de base. Les différences comptent en marge : la conception batterie de Minut permet le plafond inaccessible à un électricien, la prise NoiseAware = zéro install mais visible, l’estimation d’occupation Roomonitor compte si vous craignez vraiment les sur-occupations (et pas du tout sinon).

## Calcul de coût 12 mois

Pour un bien à 12 séjours/mois, voici ce que chaque option coûte sur la première année — y compris ce que la calculette du vendeur saute.

| Ligne | Minut | NoiseAware | Roomonitor |
|---|---|---|---|
| Matériel | 199 $ | 149 $ | 220 € (~235 $) |
| Abonnement (annuel) | 99 $ | 99 $ | 168 € (~180 $) |
| Piles (Minut seulement) | 0 $ an 1 | n/a | n/a |
| Support + adhésif | 12 $ | 0 $ | 12 $ |
| Taux de remplacement | ~1 appareil tous les 4 ans | ~1 tous les 4 ans | ~1 tous les 5 ans |
| **Total an 1** | **310 $** | **248 $** | **427 $** |
| À partir de l’an 2 (récurrent) | 114 $ | 99 $ | 180 $ |

NoiseAware est le moins cher d’appel. Minut est le moins cher à l’an 3 si vous valorisez le plafond (ce que la plupart des hôtes font une fois qu’ils réalisent qu’une prise à 30 cm du sol lit le profil sonore du sol, pas du plafond). Roomonitor ne se justifie qu’au-delà de 5 biens, où son tableau multi-unités économise assez de temps pour justifier les €/mois.

Le coût que le vendeur ne vous chiffre jamais : **l’appel faux positif**. Si le seuil est trop bas, l’appareil vous réveille deux fois par semaine à 23 h 30 parce qu’un voyageur rit devant la télé. Si vous écrivez à chaque fausse alerte, vos voyageurs s’agacent et une fraction se venge dans l’avis. Trois avis 4 étoiles vengeurs sur une annonce à 4,92 vous font passer sous le seuil Superhost à 4,8 sur le trimestre. Ce coût — disons 400 à 800 $ en prime perdue et visibilité — c’est celui à modéliser. Le réglage du seuil compte plus que la marque.

## Le réglage du seuil que personne n’explique

À l’ouverture, les trois sortent avec un seuil par défaut autour de **78 dB soutenus pendant 5 minutes** et une « heure calme » (seuil plus bas entre 22 h et 8 h). Ce défaut est calé par le fabricant pour éviter les faux négatifs niveau procès — un hôte qui n’a jamais d’alerte attaque ; un hôte qui en a et l’ignore non. Leur intérêt : pencher vers l’alerte. Le vôtre, non.

Repères pour choisir un seuil sur des chiffres réels :

- Conversation normale entre deux personnes : **55–60 dB**
- Télé en volume confort salon : **60–70 dB**
- Aspirateur : **70–80 dB**
- Petit dîner avec musique : **65–75 dB**
- Fête bruyante en appart (cris par-dessus la musique) : **80–95 dB**
- Perceuse ou blender bruyant : **90 dB+**

Pour un appartement résidentiel typique, le réglage qui attrape les fêtes sans déclencher sur les télés est environ **75 dB soutenus pendant 10 minutes** en journée et **70 dB soutenus pendant 10 minutes** en heures calmes. Sous 70 dB, vous attrapez le lave-linge du voisin du dessus. Au-dessus de 80 dB, vous n’attrapez que des événements dignes de réacteur que vous entendriez depuis dehors.

La durée « soutenus » compte autant que les dB. Un cri ou un claquement de porte fait 90 dB pendant une demi-seconde et n’est pas une fête — réglez la durée assez haut pour qu’un claquement ne déclenche pas. Cinq minutes c’est le plancher ; dix minutes, c’est ce que je tourne.

Calez en deux passes :

1. **Semaine 1** : seuil au **défaut** et passez en revue ce qui déclenche. 3 à 8 alertes la première semaine ; la plupart, des aspis et des télés. Notez les pics dB.
2. **Semaine 2** : descendez la durée à 10 minutes, montez le seuil dB de 3 à 5 dB au-dessus du faux positif le plus fort. Vous devriez passer à 0 ou 1 alerte par semaine et elles devraient être réelles.

## Le piège RGPD et déclaration

Chaque vendeur de capteur vous dira « on n’enregistre pas d’audio, donc le RGPD ne pose pas problème ». À moitié vrai, et l’autre moitié est ce qui vous fera prendre une amende.

Le RGPD (et les lois équivalentes UK + Suisse) regarde deux choses :

1. **Traitez-vous des données personnelles ?** Un niveau dB dans le temps, lié à une réservation, est sans doute une donnée personnelle parce qu’il est lié à un voyageur identifiable. La plupart des avis juridiques disent « oui, c’est du traitement de données personnelles ». Quelques-uns disent « non, le dB n’est pas personnel ». Vous ne choisissez pas.
2. **Avez-vous été transparent ?** L’article 13 dit oui — et *transparent* veut dire que le voyageur est prévenu avant d’accepter la réservation. Les appareils cachés, même non-enregistreurs, ratent ce test.

Ce qu’il faut faire (l’[article RGPD pour hôtes](/blog/gdpr-for-vacation-rental-hosts) couvre la vue d’ensemble ; voici la partie capteur de bruit) :

- **Déclarer dans l’annonce Airbnb.** La section « À savoir » d’Airbnb a une case « capteur de bruit » sous les dispositifs de sécurité. Cochez. La mise à jour 2022 l’a rendue obligatoire partout.
- **Déclarer dans le message pré-arrivée.** Une phrase : « Un capteur de bruit est installé dans le couloir. Il mesure uniquement le niveau sonore et n’enregistre pas d’audio. »
- **Rendre l’appareil visible.** Un appareil de marque visible (le palet blanc Minut au plafond) est son propre consentement — les voyageurs le voient à l’arrivée, la déclaration est rappelée.
- **Pas dans une chambre ou une salle de bain.** Même non-enregistreur, ça paraît malsain et crée une ligne dans votre avis dont vous ne voulez pas.
- **France :** depuis 2023, le *décret nuisances sonores* exige que la déclaration soit en français au logement, pas seulement dans l’annonce. Une carte imprimée près de l’entrée fait l’affaire.
- **Allemagne :** la formulation des modèles juridiques est « Schalldruckpegel-Messgerät, keine Audioaufzeichnung » — imprimez-la sur la carte d’accueil.

Le mode d’échec coûteux n’est pas l’amende. C’est qu’un voyageur signale votre annonce à Airbnb pour dispositif de surveillance non déclaré. La suspension est automatique et prend 2 à 3 semaines à lever, même quand vous gagnez l’appel.

## Où installer concrètement

Le facteur le plus déterminant pour que l’appareil fonctionne, c’est où il est posé. La plupart des avis déçus sur Reddit et les forums viennent d’un mauvais emplacement.

- **Centre du couloir, fixé au plafond.** La bonne réponse pour 80 % des appartements. Le couloir est le centre acoustique — il capte le son de chaque pièce sans être trop près d’une seule.
- **Salon, à 2 m du sol.** Acceptable s’il n’y a pas de couloir. Évitez les coins (le son rebondit) ; évitez le mur de la télé.
- **Pas dans une chambre.** Malsain, plus un voyageur qui dort avec un ventilo déclenche le capteur à 65 dB.
- **Pas à moins de 2 m d’une bouche de VMC ou d’une hotte.** Les deux tournent à 65–75 dB et entraînent votre seuil à un niveau inutile.
- **Pas près de la porte d’entrée.** Les claquements font 90 dB pendant une demi-seconde ; faux positifs à chaque check-in.

Si vous avez un long T2 rectangulaire avec les chambres à un bout et le salon à l’autre, mettez **deux appareils** — un à chaque bout. La plupart des plans permettent un second appareil pour 80 à 120 $ de matériel + 40 à 60 $/an d’extension. L’isolation acoustique entre chambres et salon fait qu’un seul appareil à un bout sous-détecte le bruit de l’autre.

## FAQ

**Un capteur de bruit arrête-t-il vraiment les fêtes ?**
Non. Un capteur *détecte* une fête 30 à 90 minutes avant l’appel d’un voisin, ce qui vous laisse une fenêtre pour écrire au voyageur, escalader en appel, et — si besoin — y aller. L’appareil est le déclencheur ; la réponse reste sur vous. Environ 60 à 70 % des voyageurs arrêtent la fête à un message ferme la première fois. Les autres, vous les expulsez, et la trace dB devient votre preuve auprès d’Airbnb pour les dégâts.

**Différence entre Minut et NoiseAware en vrai ?**
Source d’alimentation et emplacement. Minut tourne sur piles et va au plafond — invisible jusqu’à ce qu’on lève les yeux. NoiseAware se branche sur prise et se trouve à 30 cm du sol — visible mais install en deux secondes. Les deux sont dB-only, les deux ont des flux d’appli quasi identiques. Si vous avez un couloir avec prise moche, Minut gagne en esthétique. Si vous ne pouvez pas atteindre le plafond, NoiseAware gagne sur l’install.

**Et Alexa ou Google Home pour surveiller le bruit ?**
Ils ne peuvent pas. Les deux répondent à un mot-clé et lancent une routine sur déclencheur sonore, mais aucun n’expose un seuil dB soutenu à une automatisation tierce. Le meilleur hack DIY est un Raspberry Pi avec un micro USB et un script — ça marche, ça vous coûte un week-end à monter, et ça n’a aucune position RGPD parce que vous ne pouvez pas prouver de façon crédible que vous n’enregistrez pas. Achetez l’appareil dédié.

**Faut-il un capteur dans un chalet rural calme ?**
Probablement non. Le risque de fête en chalet rural est bien plus bas qu’en appart urbain, et c’est l’appel du voisin qui est le risque assuré. Si votre voisin le plus proche est à 200 m, le capteur attrape les dégâts mais pas une crise de relation communautaire (parce qu’il n’y en a pas). Mettez les 300 $ dans une serrure connectée — voir [le calcul serrure connectée vs boîte à clés](/blog/smart-lock-vs-lockbox-cost-math).

**Les voyageurs refusent-ils de réserver si je déclare un capteur ?**
Une petite fraction. Sur nos données internes (~4 000 séjours), les annonces avec capteur déclaré convertissent ~2 à 3 % de moins que des annonces identiques sans. Cette baisse fait à peu près 1/10 du coût d’une fête. Le calcul dit : déclarez.

**Quel seuil le jour vs la nuit ?**
Jour (8 h–22 h) : 75 dB soutenus pendant 10 minutes. Nuit (22 h–8 h) : 70 dB soutenus pendant 10 minutes. Points de départ — ajustez +3 dB par semaine si faux positifs, −3 dB si événement raté.

**Le capteur invalide-t-il ma protection AirCover s’il déclenche ?**
Non. AirCover se déclenche sur les dégâts signalés, pas sur les alertes bruit. L’alerte est votre pipeline de preuves — le graphe dB montre le motif acoustique d’une fête, soit à peu près la moitié du dossier que demande l’équipe résolution Airbnb. L’autre moitié, c’est les photos.

**Mon syndic dit que je n’ai pas le droit d’installer un « dispositif de surveillance ». Ça compte ?**
Probablement non, mais demandez par écrit. La phrase juridiquement pertinente est « dispositif d’enregistrement audio ». Un appareil qui mesure des dB sans enregistrer n’est généralement pas un dispositif de surveillance au sens des règlements de copropriété. Apportez la fiche de spec confidentialité du fabricant en assemblée ; c’est la preuve qui a tranché pour des hôtes que je connais dans trois États américains différents.

## Une opinion tranchée

Un capteur de bruit, ce sont les 300 $ à plus fort levier qu’un hôte d’appartement urbain peut dépenser sa première année. Pas parce que ça arrête les fêtes — non — mais parce que ça convertit un événement « le voisin a appelé la police à 3 h, vous l’apprenez par le syndic » en un événement « le capteur a pingé à 22 h 45, vous avez écrit au voyageur à 22 h 50 ». Le premier est un coup de 2 000 $ en avis et un possible déplacement de police. Le second est une conversation à 0 $. Le coût appareil est identique.

Si vous ne devez prendre qu’un seul dispositif de sécurité pour un bien urbain, prenez le capteur de bruit avant la serrure connectée. La serrure économise du temps. Le capteur sauve des avis. Les avis sont la seule monnaie qui se compose.
