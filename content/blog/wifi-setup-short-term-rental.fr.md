---
slug: wifi-setup-short-term-rental
locale: fr
title: "Wi-Fi en location courte durée : débit, mesh et réseau invité"
excerpt: Quel débit Wi-Fi un meublé de tourisme demande vraiment, quand un seul routeur bat le mesh, et pourquoi le réseau invité n’est plus optionnel en 2026 — chiffres et matériel concrets.
status: published
tags:
  - host-tips:Conseils hôtes
  - tools:Outils
  - guest-comms:Communication voyageurs
ogImageUrl: /blog-covers/wifi-setup-short-term-rental.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Le premier avis 1 étoile que j’ai pris portait sur le Wi-Fi. Une famille de quatre est arrivée dans mon 65 m² à Tachkent un vendredi de mars, et samedi midi le père m’écrivait quatre lignes : *« Le Wi-Fi coupe dans la chambre. Impossible de travailler. Nous partons dimanche. »* Le routeur, c’était la box plastique blanche que mon FAI m’avait donnée quatre ans plus tôt, posée dans la cuisine derrière un radiateur en métal, qui émettait dans un appart aux murs en brique sur le même canal 2,4 GHz que 14 autres appartements. Le correctif : 120 $ de matériel neuf et une heure de tirage de câble. L’avis, je l’ai laissé.

Voici l’article que j’aurais aimé lire ce février-là. Quel débit l’annonce demande réellement — en Mbps, pas en com’ FAI — quand un seul routeur ne suffit plus, pourquoi un réseau invité séparé n’est plus optionnel en 2026, et trois paliers matériels honnêtes avec les modes de défaillance que les avis Amazon ratent.

## TL;DR

- Une famille de 4 amène **10 à 14 appareils connectés**, pas 4. Prévoyez 12 clients simultanés minimum.
- Pour un foyer streaming 4K plus un appel pro, le plancher est de **75 Mbps en down / 15 Mbps en up**, mesurés au coin le plus lent du logement, pas au routeur.
- Un seul routeur couvre jusqu’à environ **55 m² d’appart en briques**. Au-delà, mesh ; le seuil est net.
- **Toujours utiliser un SSID invité dédié.** Pas par politesse — pour le RGPD, pour ne pas exposer votre NAS / imprimante / caméras, et pour l’isolation quand l’Android infesté d’un voyageur se met à inonder le LAN.
- Coût total de possession sur un appart : **80 à 400 $ une fois**, plus 35 à 60 $/mois de FAI. L’option chère se rentabilise dès qu’un avis Wi-Fi vous coûte 300 $ de réservations.

## Ce que veut dire « assez rapide »

La plupart des hôtes demandent « 100 Mbps, c’est bon ? ». La réponse honnête : ça dépend de ce qui est connecté, et où.

Un groupe typique de quatre arrive avec : 4 téléphones, 1 ou 2 laptops, 1 smart TV (la leur ou la vôtre, souvent les deux qui tournent), 1 tablette, 1 Kindle, 1 montre connectée chacun, parfois une Switch ou un Steam Deck, parfois un babyphone. Soit 11 à 14 clients sur le point d’accès. Ils n’émettent pas tous en même temps, mais maintiennent une connexion ouverte.

Mbps réalistes par tâche courante, côté **téléchargement** :

| Tâche | Down | Up | Notes |
|---|---|---|---|
| Netflix HD | 5 Mbps | 0,1 | Un flux. |
| Netflix 4K | 25 Mbps | 0,1 | Le gros morceau. |
| YouTube 4K | 20 Mbps | 0,1 | |
| Visio Zoom HD | 3,5 Mbps | 3,5 | Symétrique. |
| Google Meet HD | 3,5 Mbps | 3,5 | |
| Spotify | 0,3 Mbps | 0 | Négligeable. |
| Synchro iCloud / Google Photos | 5 Mbps | 25 Mbps | Direction compte. |
| Téléchargement Steam | 80–200 Mbps | 0 | Sature tout sous fibre. |

Charge réaliste d’un vendredi soir : Netflix 4K sur la TV (25), un parent en Zoom (3,5/3,5), un ado en YouTube 4K (20), Spotify en fond (0,3) et un téléphone qui sauvegarde silencieusement 800 photos à 25 Mbps en up.

Total : **~50 Mbps down, ~30 Mbps up**, soutenus pendant 90 minutes. Ajoutez 30 % de marge pour retransmissions et overhead, le plancher devient **75 down / 40 up**. La plupart des FAI vendent du « 100 Mbps » comme 100 down / 10 up — ces 10 en up sont la partie qui plante le voyageur en télétravail. Payez la fibre symétrique 100/100 si elle existe ; le delta mensuel dépasse rarement 5 $.

Le chiffre à mettre dans l’annonce, c’est **le plus bas des deux** : ce que le FAI a promis, et ce que votre coin le plus faible délivre vraiment. Lancez [fast.com](https://fast.com) depuis la chambre la plus loin du routeur. Ce chiffre, moins 20 %, c’est ce qu’une description honnête mentionne.

## Routeur unique vs mesh : où passe la ligne

La réponse facile : « l’appart est petit, un routeur suffit ». Elle est fausse environ une fois sur deux.

Ce qui limite la couverture, ce sont **les murs, pas les mètres carrés**. Une cloison en placo coûte ~3 dB sur le 5 GHz par mur. La brique coûte 8 dB. Le béton armé coûte 12 dB ou plus. Quand un signal 5 GHz a traversé deux murs en brique, il a perdu 75 % de sa puissance et votre téléphone retombe sur le 2,4 GHz, qui dans tout immeuble est saturé par 30 voisins et des micro-ondes.

Portée approximative d’un seul routeur :

- **Cloison sèche + montants (appart US typique) :** un routeur couvre jusqu’à ~85 m².
- **Brique / construction européenne :** un routeur couvre jusqu’à ~55 m².
- **Béton armé / construction soviétique :** un routeur couvre jusqu’à ~35 m².

Au-delà, le mesh bat le routeur unique à chaque fois. Le plancher du mesh, c’est deux nœuds ; le second se place à mi-chemin entre le premier et le coin mort. Le backhaul filaire (un Ethernet entre les deux nœuds, planqué sous une plinthe) vaut les 15 minutes d’install — le backhaul sans fil vous fait perdre la moitié du débit au second nœud.

Le seuil est plus net que ce que suggèrent les fiches. En dessous, un routeur à 90 $ écrase un mesh à 200 $ en débit brut au routeur. Au-dessus, un mesh à 200 $ écrase un routeur à 400 $ au coin mort. **Spécifiez l’appart, pas votre goût.**

## Le réseau invité n’est pas optionnel

Trois raisons pour lesquelles un SSID invité séparé cesse d’être un « plus » et devient une exigence dure, par ordre d’importance :

1. **Confidentialité et RGPD.** Quand un voyageur rejoint votre Wi-Fi principal, il peut scanner le LAN. Il voit le hostname de votre imprimante (`HP-LaserJet-2055-OFFICE`), votre NAS (`SYNOLOGY-FAMILY`), le nom de votre laptop, parfois le hostname de votre caméra. Rien d’illégal à révéler, mais en juridiction UE c’est le genre de fuite incidente que l’article 32 du RGPD (« mesures techniques appropriées ») attend que vous évitiez par design. Un SSID invité dédié avec **isolation des clients** activée — chaque appareil voyageur ne voit que la passerelle, aucun autre client — règle ça en une case. La plupart des routeurs modernes l’exposent sous « Réseau invité → Isolation des clients ». Pour la vue d’ensemble conformité, voir [RGPD pour hôtes](/blog/gdpr-for-vacation-rental-hosts).
2. **Isolation de débit.** L’Android d’un voyageur avec une appli sideload malveillante se met à ARP-spoofer le LAN, ou télécharge un jeu de 60 Go en arrière-plan. Sur un réseau plat, votre caméra IP sautille. Sur un VLAN invité isolé, votre caméra ne remarque rien.
3. **Rotation des identifiants.** Quand vous changez le mot de passe invité (à faire, toutes les 4 à 8 semaines), vous ne cassez pas vos propres appareils sur le SSID principal. Deux SSID, deux mots de passe, deux durées de vie.

Le bon setup : un SSID principal pour les appareils de l’hôte (caméras, serrure connectée, NAS) et un SSID invité avec isolation. Les deux sur le même matériel ; le routeur émet juste deux réseaux. Tout routeur à partir de 60 $ supporte ça en 2026. Si pas le vôtre, remplacez.

Note de naming : ne nommez pas le SSID invité d’après le numéro de l’appart (« APT-12-Guest »). Ça dit aux passants quel logement est en STR, ce qui est le genre de signal bas niveau qui fait flagger votre appart dans des immeubles à syndic anti-Airbnb. Choisissez un nom générique. « Wi-Fi-2.4 », ça va.

## Trois paliers matériels honnêtes

Choisissez le palier qui colle à la taille de l’appart et à votre tolérance à courir après les problèmes.

### 60–120 $ : TP-Link Archer AX55 ou équivalent

Un seul routeur Wi-Fi 6. Classe AX3000 minimum. Couvre jusqu’à 55 m² de brique ou 85 m² de placo de manière fiable. Deux SSID (principal + invité) avec isolation. QoS correct pour qu’un torrent invité n’étrangle pas la visio d’un autre. Cinq minutes de setup via l’appli, puis vous débranchez l’appli et l’appareil tourne seul.

Bon palier pour un studio ou un T1 jusqu’à ~55 m². Mauvais palier pour un T2 avec briques entre pièces — le Wi-Fi de la chambre mesurera 12 Mbps et l’avis dira « inutilisable ».

### 180–280 $ : Asus ZenWiFi XD4 / Eero 6+ / TP-Link Deco X55 — pack de 2 mesh

Deux nœuds. Les deux en Wi-Fi 6. Un nœud à la passerelle, un à mi-chemin de l’appart. Avec backhaul Ethernet (un câble le long de la plinthe, terminaison sur prise keystone à 4 $ aux deux bouts), le second nœud délivre ~85 % du débit du premier. Sans backhaul, ~50 %.

Bon palier pour 60 à 100 m². L’Eero est le plus simple à monter mais il est aussi le plus insistant pour un compte Amazon ; si vous évitez les comptes Amazon par principe, prenez l’Asus ou le TP-Link.

### 320–420 $ : Asus ZenWiFi XT9 / Ubiquiti UniFi Express + AP — pack de 3 ou prosumer

Trois nœuds ou matériel prosumer. Justifié au-delà de 100 m², ou tout appart en béton armé, ou pour le plan en L bizarre que les nœuds mesh n’arrivent pas à couvrir.

L’option Ubiquiti est aussi le meilleur pari long terme : elle permet de séparer le SSID invité dans un vrai VLAN avec plafonds de bande, programmer le réseau invité pour s’ouvrir à 14 h (check-in) et s’éteindre à 11 h 30 (check-out), et tirer des logs de trafic par séjour si un voyageur conteste. Courbe de setup plus raide — comptez une heure, pas dix minutes — mais un seul setup.

### Ce qu’il faut sauter

- La box modem-routeur de votre FAI. Fiable comme modem et faible comme routeur. Mettez-la en mode bridge, branchez le nouveau routeur sur son port WAN, et ignorez son Wi-Fi.
- Tout ce qui dit « AC1200 » ou « N300 » en 2026. C’est du 802.11ac et 802.11n vendu sous coût. Le plancher Wi-Fi 6 (AX1500 / AX3000) coûte 20 $ de plus et vous évite un swap matériel sous deux ans.
- Les répéteurs Wi-Fi (la prise murale mono-bande). Ils coupent le débit de 50 % et doublent la latence. Le mesh est la bonne réponse si un seul routeur ne suffit pas.

## Les modes de défaillance dont personne ne parle

Trois défaillances précises mangeront 30 % de vos maux de tête Wi-Fi de l’année 1 :

**Coupure FAI un samedi matin.** La fibre tombe, vous l’apprenez 90 minutes plus tard, l’avis du voyageur dit « pas d’internet ». Deux correctifs. (1) Une clé 4G/5G en bascule branchée sur le port USB ou WAN-2 du routeur, qui prend le relais quand le lien primaire meurt. Matériel 40 $, SIM 50 Go/mois 10 $. (2) Une page d’état côté voyageur — même une carte imprimée sur le frigo qui dit « Internet en panne ? Texto à l’hôte au +X. On a une 4G en secours. » Les deux options plafonnent les dégâts d’avis au pire cas.

**Le encombrement 2,4 GHz dont personne ne parle.** Dans tout immeuble urbain, la bande 2,4 GHz est inutilisable au-delà du 4ᵉ étage — chaque voisin, chaque micro-ondes, chaque enceinte Bluetooth y est. Forcez les objets connectés qui ne parlent *que* 2,4 GHz (ampoules, serrure connectée, babyphone bon marché) sur un SSID « IoT » dédié n’émettant qu’en 2,4 GHz. Téléphone et laptop rejoignent le SSID principal en 5 GHz / 6 GHz et ne voient jamais l’encombrement.

**Le routeur qui ne reboote pas pendant 9 mois.** Les routeurs grand public fuient en mémoire. Au mois 6, ils tournent à 30 % du jour 1 et un voyageur écrit un avis Wi-Fi que vous ne comprenez pas parce que votre speedtest au mois 7 chez vous montre 200 Mbps. Programmez un reboot auto hebdo dans le panneau admin — chaque mardi 4 h. La plupart des routeurs l’exposent ; certains demandent une minuterie murale à 4 $. Le correctif ennuyeux qui rachète 90 % des avis « le Wi-Fi a ralenti pendant le séjour ».

## FAQ

**Quel débit down/up annoncer dans l’annonce ?**
Le **plus bas** entre la promesse FAI et le résultat [fast.com](https://fast.com) depuis la chambre la plus loin du routeur. Retirez 20 % pour le pire soir. Si vous avez 200/100 fibre et que la chambre mesure 65 Mbps down à 22 h, annoncez « 60 Mbps ». Les annonces gonflées sont le plus gros driver d’avis 1 étoile Wi-Fi.

**Faut-il un réseau invité pour un seul voyageur à la fois ?**
Oui. Pas pour le débit — parce que son téléphone scannera le LAN, voulu ou non, et voir le hostname de votre NAS, c’est le genre de détail « je me suis senti surveillé » qui voyage sur Reddit. Configurez l’invité une fois, oubliez-le.

**Mesh utile pour un studio de 45 m² ?**
Non. Un seul routeur Wi-Fi 6 couvre 45 m² dans toute construction d’appart sauf un bunker. Économisez les 100 $ et mettez-les dans le [calcul serrure connectée vs boîte à clés](/blog/smart-lock-vs-lockbox-cost-math) à la place.

**Puis-je facturer le Wi-Fi en option ?**
Techniquement oui sur la plupart des plateformes ; en pratique non — les voyageurs en 2026 attendent le Wi-Fi inclus comme l’électricité. Le facturer fait chuter la conversion de 8 à 12 % selon les rares études. Intégrez-le au tarif nuitée et passez à autre chose.

**Le modem-routeur de mon FAI suffit ?**
Pour un studio, ça peut passer. Au-delà, la partie Wi-Fi est trop faible. Mettez la box en **mode bridge** (réglage du panneau admin ; le FAI peut le faire en 2 min par téléphone), puis branchez votre vrai routeur sur le port WAN. Traitez la box comme un convertisseur fibre-Ethernet et oubliez-la.

**Comment faire tourner le mot de passe invité sans casser l’accès en plein séjour ?**
Pré-imprimez le mot de passe sur la carte d’accueil et faites tourner entre séjours, pas pendant. L’agente peut faire la rotation le jour du départ en 90 secondes dans l’appli routeur. L’hôte qui fait tourner quotidiennement crée plus de messages voyageurs que la rotation n’en évite.

**Et un port Ethernet pour ceux qui veulent câbler ?**
Un câble Ethernet à 5 $ visible sur le bureau près de la TV vaut deux étoiles sur la sous-population « venu pour bosser ». Tirez du routeur (ou d’un switch non managé à 15 $) au bureau. Personne ne se plaint qu’un port câblé soit fourni. Beaucoup de voyageurs se plaignent qu’il manque.

**Faut-il poster le mot de passe Wi-Fi dans le guide avant l’arrivée ?**
Oui, et sur la carte d’accueil sur la table, et sur un Post-it près du routeur. La raison numéro un d’un avis 4 étoiles Airbnb : « 20 minutes pour trouver le mot de passe ». Postez-le à trois endroits. Envoyez-le aussi dans le message de confirmation du [formulaire pré-arrivée](/blog/pre-arrival-guest-forms).

**Le routeur « AX1800 » à 50 $ sur Amazon, ça va ?**
Parfois. Le risque : chipset de génération précédente, pas de MAJ firmware après l’an 2, et un CPU qui plie au-delà de 8 clients simultanés. Dépensez 30 $ de plus pour une marque connue (TP-Link, Asus, Netgear) avec date de sortie 2024 ou 2025. Les économies de l’an 1 ne valent pas le remplacement de l’an 3.

## Une opinion tranchée

Le Wi-Fi est la seule pièce d’infrastructure d’une location courte durée où les voyageurs écriront un avis sur la pire heure unique de leur séjour. Votre lit peut être noté 4/5 en confort, votre cuisine 4/5 en équipement, votre check-in 4/5 en amabilité, et vous garderez 4,7 étoiles. Un samedi lent en Wi-Fi et l’avis tombe à 3 étoiles en mentionnant explicitement le Wi-Fi. C’est cette asymétrie qui rend l’option pas chère coûteuse.

Mettez les 200 $ dans le bon matériel et les 30 minutes pour configurer le SSID invité. Programmez un reboot auto hebdo, branchez une 4G en bascule, postez le mot de passe à trois endroits. Toute la stack, c’est deux soirées et dix ans à ne plus y penser. Les hôtes qui sautent ça prennent un mauvais avis Wi-Fi dans leurs huit premiers séjours. Le calcul n’est pas subtil.
