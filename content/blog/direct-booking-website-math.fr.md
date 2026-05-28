---
slug: direct-booking-website-math
locale: fr
title: "Site de réservation directe : quand contourner la commission OTA paie"
excerpt: Un P&L chiffré : la commission Airbnb côté hôte face aux 3 % de Stripe en direct — et le taux de clients fidèles qui décide si votre propre site est rentable.
status: published
tags:
  - host-tips:Conseils aux hôtes
  - pricing:Tarification
  - tools:Outils
  - booking-com:Booking.com
ogImageUrl: /blog-covers/direct-booking-website-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

J'ai créé ma première page de réservation directe pour « échapper aux 15 % de commission d'Airbnb ». Trois mois et quarante réservations plus tard, j'ai fait le vrai P&L et découvert ce qu'aucun forum d'hôtes ne m'avait dit : avec le modèle de frais par défaut d'Airbnb, la commission que je contournais était surtout celle du *voyageur*, pas la mienne. Sur une réservation à 600 $, je touchais presque les mêmes 582 $ — via Airbnb comme via mon propre lien Stripe. Le voyageur économisait 85 $. Moi, trente cents.

C'est là qu'a commencé la compréhension de l'endroit où un site de réservation directe rapporte vraiment — et de l'endroit où il ne fait que déplacer une remise de la poche de la plateforme vers celle du voyageur. La réponse tient à deux chiffres que la plupart des hôtes ne séparent jamais : le modèle de frais de votre plateforme, et la part de vos réservations qui vient de clients fidèles et de recommandations. Voici tout le calcul.

## TL;DR

- Avec le modèle de **frais partagés** d'Airbnb, passer au direct ne rapporte presque rien à l'*hôte* — les ~14 % de frais de service sont payés par le voyageur, pas par vous. L'économie va dans la poche du voyageur.
- Avec les **frais côté hôte uniquement** (Airbnb) et les **15 % de Booking.com**, c'est l'hôte qui supporte la commission — là, le direct économise vraiment : environ **72 $ sur une réservation de 600 $**.
- Une réservation directe via Stripe coûte **2,9 % + 0,30 $** (environ **18 $ sur 600 $**) ; les cartes de l'EEE reviennent moins cher, ~1,5 %.
- Tout se joue sur votre **taux de clients fidèles et de recommandations**. Acquérir un inconnu via la pub coûte **50 à 150 $ par réservation** — souvent plus que la commission économisée.
- Un outil de site payant (~**480 $/an**) devient rentable vers **7 réservations/an à commission côté hôte**. En dessous : une page gratuite.
- En passant au direct, vous perdez **AirCover, la protection contre les rejets de débit et la confiance de la plateforme** — intégrez-les avant de fêter la commission économisée.

## Ce que la commission OTA vous coûte vraiment

Chaque hôte cite la commission comme un seul chiffre. En réalité, ce sont deux chiffres totalement différents selon le modèle de frais, et c'est toute la différence qui fait l'article.

Passons une seule réservation dans chaque modèle : un logement à 150 $/nuit, 4 nuits, **600 $ hors frais**.

| Canal | Modèle de frais | L'hôte reçoit | Le voyageur paie |
|---|---|---|---|
| Airbnb (frais partagés) | 3 % hôte + ~14 % voyageur | 582 $ | ~685 $ |
| Airbnb (frais côté hôte) | 15 % hôte, 0 % voyageur | 510 $ | 600 $ |
| Booking.com | 15 % hôte (+ ~1,1 % paiements) | 504–510 $ | 600 $ |
| Vrbo (au-coup-par-réservation) | 5 % + 3 % traitement | 552 $ | 600 $ |
| Direct (Stripe, carte US) | 2,9 % + 0,30 $ | 582 $ | 600 $ |

Regardez la première et la dernière ligne. Avec le modèle à **frais partagés** d'Airbnb — toujours par défaut pour la plupart des hôtes indépendants non connectés via un logiciel — l'hôte touche **582 $**. Une réservation directe via Stripe rapporte **582,30 $**. Pour l'hôte, c'est le même chiffre. Ce que vous « contourneriez » en passant au direct, ce sont les **85 $ que le voyageur** a payés en plus, pas un coût que vous portiez.

Maintenant, les lignes frais côté hôte et Booking.com. Là, l'hôte touche **510 $**, et la réservation directe rapporte **582 $** — un vrai gain de **72 $ par réservation**. Voilà l'écart qui vaut la peine d'être visé.

La première question n'est donc pas « dois-je accepter des réservations directes ». C'est « sur quel modèle de frais suis-je ». Vérifiez-le dans le détail de votre versement Airbnb : si le voyageur voit une ligne « frais de service », vous êtes en frais partagés, et la commission côté hôte que vous pourriez récupérer est minime. S'il n'y a pas de frais de service voyageur et que votre versement est ~15 % sous le total des nuits, vous êtes en frais côté hôte — et là, le direct a une vraie marge. La plupart des logements connectés via un logiciel et la plupart des annonces en Europe sont en frais côté hôte, que l'hôte s'en soit rendu compte ou non.

## Côté Stripe : ce qu'une réservation directe rapporte vraiment

Le tarif standard de Stripe est de **2,9 % + 0,30 $** par paiement réussi aux États-Unis. Sur 600 $, cela fait **17,70 $**. Dans l'EEE, les cartes de la même région coûtent environ **1,5 % + 0,25 €**, donc un hôte européen avec des voyageurs européens paie plutôt **9 à 10 $** sur la même réservation. Les cartes étrangères ajoutent environ **1,5 %**, et la conversion de devise **1 à 2 %** de plus — bon à savoir si votre voyageur paie dans une autre devise que votre versement.

Deux coûts que le conseil « utilise juste Stripe » passe sous silence :

- **Cautions et préautorisations.** Si vous remplacez la protection de la plateforme par une caution remboursable, Stripe prélève des frais au moment de la capture, sur le montant réellement débité. Une préautorisation que vous relâchez ne coûte rien — c'est le bon schéma pour la plupart des séjours.
- **Les remboursements ne rendent pas les frais.** Stripe garde les 0,30 $ (autrefois aussi le pourcentage ; il est désormais rendu sur remboursement total). Une réservation annulée et reprise deux fois a payé Stripe trois fois.

Au final : en direct via Stripe, l'hôte touche **~582 $ sur 600 $** pour les cartes US, **~590 $** pour les cartes internes à l'EEE. Le traitement est vraiment bon marché. La partie chère de la réservation directe n'est jamais le rail de paiement — c'est d'amener le voyageur sur votre page.

## Le chiffre qui décide de tout : votre taux de clients fidèles et de recommandations

Voici le piège. Un hôte lit « économisez 15 % », monte un site, lance des pubs Google sur « location vacances [ville] » et attend. Le clic coûte **0,80 à 2,50 $**, la page de destination convertit à **1–3 %**, donc le **coût total pour acquérir une réservation directe d'un inconnu froid est de 50 à 150 $** — vous venez de dépenser la commission que vous vouliez économiser. Et vous l'avez fait *sans* le mur d'avis de la plateforme, sa médiation des litiges ou la vérification du voyageur.

Acquérir des inconnus hors plateforme est, pour presque tout petit hôte, une opération perdante. L'OTA excelle dans une chose que vous ne savez pas faire : mettre votre logement sous les yeux d'un voyageur qui n'a jamais entendu parler de vous, au moment précis où il est prêt à payer. C'est cette présentation que la commission achète.

Les réservations directes qui rapportent vraiment sont celles à **coût d'acquisition nul** :

- **Clients fidèles.** Quelqu'un qui est déjà venu et a adoré. Le réacquérir sur Airbnb, c'est payer la commission une deuxième fois pour un client déjà gagné.
- **Recommandations.** Leur ami, qui arrive en confiance parce qu'une vraie personne s'est portée garante de vous.
- **Votre propre audience.** Un logement avec un Instagram, une liste d'e-mails de voyageurs, une carte « réservez en direct la prochaine fois » sur le plan de travail.

Pour ces voyageurs, le canal direct est de la marge pure : 72 $ économisés (tarifs côté hôte/Booking) sur des réservations que vous paieriez sinon plein tarif pour regagner. Votre taux de fidèles et de recommandations *est* votre potentiel de réservation directe. Tout le reste, ce sont des dépenses pub déguisées en économies.

Taux typiques par type de logement, d'après ce que je vois chez les hôtes avec qui je travaille : un **studio urbain de passage tourne à 5–10 % de fidèles** (surtout des voyageurs d'affaires), un **2-pièces en bord de mer à 15–25 %** (familles en vacances annuelles), un **chalet en station à 30–40 %** (les mêmes skieurs chaque février). Le chalet, c'est là où le direct imprime de l'argent. Le studio urbain, c'est là où un tunnel direct en perd discrètement.

## Une rentabilité chiffrée : gratuit vs outil de site payant

Un site de réservation directe intégré — Lodgify, Hostfully, Uplisting — coûte environ **40 $/mois, ~480 $/an**, parfois plus 1–2 % par réservation directe. La voie gratuite (un flux iCal public pour garder le calendrier honnête, plus un lien de paiement Stripe ou un formulaire de réservation d'une page) coûte **0 à 50 $/an**.

Rentabilité de l'outil payant, à 72 $ économisés par réservation à commission côté hôte :

| Logement | Réserv./an | Direct (fidèles+reco) | Économie/an | Verdict payant |
|---|---|---|---|---|
| Studio urbain (partagé, 7 % fidèles) | 90 | ~6 | ~0 $* | Non — l'économie est celle du voyageur |
| 2-pièces mer (très Booking, 20 %) | 60 | ~12 | ~864 $ | Limite — la voie gratuite rapporte plus |
| Chalet (frais côté hôte, 35 %) | 40 | ~14 | ~1 008 $ | Oui — rentable ~2×, la voie gratuite est du profit pur |

*La nuance du studio est le constat des frais partagés ci-dessus : même sur 6 réservations directes, si l'alternative était Airbnb en frais partagés, l'économie de l'hôte est proche de zéro. Le bon choix là n'est pas du tout un site — c'est de laisser l'annonce sur Airbnb et d'encaisser le fait que c'est le voyageur, pas vous, qui paie les frais.

Le schéma : un outil de site **payant** a besoin d'environ **7 réservations à commission côté hôte par an** rien que pour couvrir son coût. La plupart des hôtes sous 5 logements n'y arrivent jamais avec le volume direct seul — d'où la victoire de la **voie gratuite** pour presque tout le monde sous un logement de destination à forte fidélité. Pas besoin d'un site à 480 $ pour envoyer un lien Stripe à un ancien voyageur. Le calcul de rentabilité parallèle pour l'outil qui synchronise tout ça est dans [le calcul de rentabilité d'un channel manager](/blog/channel-manager-break-even-math) — même forme, autre chiffre.

## Les coûts cachés que personne n'intègre

La commission économisée est le chiffre visible. Voici les invisibles, et au moins deux d'entre eux m'ont coûté de l'argent réel.

- **Pas d'AirCover.** La garantie jusqu'à 3 M$ d'Airbnb ne suit pas le voyageur sur votre réservation directe. Vous la remplacez par une caution remboursable (plafonne votre risque à la caution) ou une assurance location courte durée (**500 à 1 500 $/an**). Sur une réservation directe, le téléviseur cassé est entièrement votre problème. La comparaison complète de ce que chaque dispositif de protection paie réellement est dans [AirCover vs caution Booking.com](/blog/airbnb-aircover-vs-booking-damage-deposit).
- **Rejets de débit.** C'est celui qui mord. Un voyageur qui conteste le paiement auprès de sa banque vous met, *vous*, face à un réseau de cartes avec de maigres preuves et des **frais de rejet de 15 $** — que vous gagniez ou perdiez. Airbnb absorbe ce risque sur la plateforme ; Stripe non. Un tarif non remboursable plus un contrat de réservation signé et clair est votre seule défense.
- **Confiance et avis.** Un inconnu ne mettra pas 600 $ sur une page de réservation sans nom et sans mur d'avis. C'est la même raison pour laquelle les pubs froides convertissent à 1–3 % : la confiance que l'OTA vous loue est réelle. Le direct ne convertit que le trafic *chaud* — des gens qui vous font déjà confiance.
- **Conformité et administratif.** Vous êtes désormais le vendeur au sens légal. Factures fiscales, gestion des remboursements, [enregistrement des voyageurs](/blog/guest-registration-laws-short-term-rental) et collecte de la taxe de séjour que la plateforme faisait avant — tout pour vous. Comptez une heure par réservation directe le temps d'avoir des modèles.

Au total, l'économie honnête par réservation directe vaut **72 $ moins** une part pour l'assurance, le risque de rejet et le temps administratif — disons un réel **40 à 55 $** aux tarifs côté hôte/Booking, et toujours essentiellement **zéro** en frais partagés Airbnb.

## Comment je le gère vraiment (l'hybride)

Je ne fais pas du tout-direct et je ne pense pas que la plupart des hôtes devraient. Le montage qui marche :

1. **Garder chaque annonce OTA active.** Ce sont mes canaux d'acquisition. Tout inconnu me découvre là, et je paie volontiers le péage pour le rencontrer une fois.
2. **Convertir la relation, pas la réservation.** Un voyageur manifestement content reçoit pendant le séjour un discret « les clients fidèles, on les prend en direct, voici comment » — une carte, un e-mail, une ligne dans le message de départ. Pas de guerre de remises sur la plateforme, ce qui enfreint d'ailleurs les règles.
3. **Rendre la voie directe gratuite et sans friction.** Un flux iCal public garde le calendrier direct synchro avec les OTA, donc je ne me double-réserve jamais. Un lien de paiement Stripe plus un contrat d'une page closent la réservation. Coût total des outils : proche de zéro.
4. **Partager l'économie aux tarifs côté hôte/Booking.** Offrez au client fidèle **5 % de remise** sur le tarif direct. Il bat quand même les frais de service de l'OTA, et je touche quand même plus que ce que la plateforme aurait versé. Les deux côtés gagnent ; seule la plateforme perd la commission.
5. **Jamais de pub pour chasser des inconnus en direct.** C'est la ligne rouge. L'acquisition à froid est le travail de la plateforme, et elle y est meilleure que mon budget pub ne le sera jamais.

La synchro de calendrier sous tout ça — flux OTA plus réservations directes plus jours tampons de ménage, le tout au même endroit pour que le canal direct ne provoque pas de double réservation — c'est exactement ce que fait [RentTools](/onboard), gratuit et open source. Le site de réservation directe est optionnel ; le calendrier qui l'empêche d'exploser ne l'est pas.

## FAQ

**Un site de réservation directe vaut-il le coup pour un petit hôte ?**
Seulement avec une vraie base de fidèles ou de recommandations. Pour un logement à 30 %+ de retours (chalets de destination, longs séjours d'affaires), un canal direct pour précisément ces voyageurs est très rentable, car le coût d'acquisition est nul. Pour un studio urbain de passage à 5–10 % de fidèles, un tunnel direct coûte souvent plus en outils et en administratif qu'il n'économise. Ce qui décide, c'est votre taux de fidèles, pas votre volume de réservations.

**Quelle commission Airbnb prélève-t-elle réellement à l'hôte ?**
Cela dépend du modèle de frais. En frais partagés, l'hôte paie environ 3 % et le voyageur des frais de service de ~14 % en plus. En frais côté hôte uniquement, l'hôte paie environ 15 % et le voyageur aucun frais de service. Vérifiez votre détail de versement : des « frais de service » visibles côté voyageur signifient un modèle partagé, et votre coût réel côté hôte est faible.

**Vais-je économiser en passant au direct si je suis en frais partagés Airbnb ?**
À peine. En frais partagés, l'hôte touche sur une réservation directe Stripe à peu près autant que sur Airbnb, parce que les gros frais étaient payés par le voyageur, pas par vous. Passer au direct offre surtout cette économie au voyageur. Cela n'a de sens que si vous relevez votre tarif direct pour capter une partie de ce que le voyageur économise, ou si vous bâtissez une relation client plutôt que de réduire un coût.

**Quel prestataire de paiement utiliser pour les réservations directes ?**
Stripe est le choix par défaut pour la plupart des hôtes : 2,9 % + 0,30 $ par paiement aux États-Unis, moins cher pour les cartes internes à l'EEE. Il gère la conformité PCI, les préautorisations pour les cautions et les remboursements. PayPal et Square sont des alternatives à tarifs similaires. Quel que soit votre choix, utilisez des préautorisations plutôt que de débiter les cautions d'avance, et ne stockez jamais les numéros de carte vous-même.

**Comment me protéger sans AirCover sur une réservation directe ?**
Deux couches. D'abord une caution remboursable en préautorisation Stripe, dimensionnée au pire cas réaliste (150 à 500 € pour un appartement). Ensuite une assurance location courte durée (500 à 1 500 $/an) pour les dommages au-delà de la caution. Un contrat de réservation signé avec une clause de dommages claire est ce qui rend l'un et l'autre opposables. Vous échangez la garantie de la plateforme contre vos propres papiers.

**Ne vais-je pas perdre les avis et la confiance Airbnb sur lesquels reposent les réservations ?**
Pour les inconnus, oui — et c'est précisément pourquoi il ne faut pas chasser les inconnus en direct. La confiance qu'apporte le mur d'avis de l'OTA convertit le visiteur froid. Le direct marche pour les voyageurs qui vous font déjà confiance : anciens clients et leurs recommandations. Gardez vos annonces OTA pour la découverte et la réputation ; n'utilisez le direct que pour les relations chaudes déjà méritées.

**Puis-je avoir des ennuis avec Airbnb si je prends des voyageurs en direct ?**
Vous ne pouvez pas faire la promotion de votre site ni solliciter des réservations hors plateforme *dans la messagerie Airbnb* avant un séjour — c'est contraire aux règles et peut faire signaler vos messages ou pénaliser votre compte. Ce qui est permis : un voyageur déjà venu qui vous recontacte ensuite, ou une carte laissée dans le logement. Gardez la conversion hors des canaux de la plateforme et après la réservation, pas dans le fil Airbnb.

**Quel est le moyen le moins cher de commencer les réservations directes ?**
Un flux iCal public pour garder le calendrier synchro entre canaux, plus un lien de paiement Stripe et un contrat de réservation d'une page envoyé par e-mail. Total : moins de 50 $/an, souvent 0 $. Vous n'avez pas besoin d'un site hébergé à 480 $/an tant que votre volume direct ne couvre pas son coût — ce qui, pour la plupart des hôtes sous 5 logements, n'arrive jamais. Commencez gratuit, montez en gamme seulement quand les chiffres le disent.

## Un avis tranché

L'OTA n'est pas votre ennemie et la commission n'est pas un vol. C'est le prix d'une présentation à un inconnu qui ne vous aurait jamais trouvé — un prix juste, car acquérir ce même inconnu vous-même coûterait plus cher avec une moins bonne conversion. L'erreur n'est pas de payer la commission. L'erreur, c'est de la payer *deux fois* pour le même voyageur.

Alors construisez la voie directe la moins chère possible pour les voyageurs déjà gagnés, gardez chaque annonce active pour ceux que vous n'avez pas encore, et ne dépensez pas un dollar en pub pour arracher un voyageur froid à la plateforme afin d'économiser des frais que, la moitié du temps, vous ne payiez même pas. La réservation directe est un outil de fidélisation, pas un canal d'acquisition. Les hôtes qui le comprennent gardent discrètement quelques milliers de plus par an. Ceux qui ne le comprennent pas montent un site, lancent des pubs et se demandent pourquoi « échapper aux 15 % » les a appauvris.
