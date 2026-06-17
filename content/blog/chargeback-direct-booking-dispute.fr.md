---
slug: chargeback-direct-booking-dispute
locale: fr
title: "Chargeback sur réservation directe : comment l'hôte gagne le litige"
excerpt: Un voyageur a contesté votre réservation directe auprès de sa banque. Les codes motifs, les preuves qui gagnent et les 15 € que vous payez dans tous les cas.
status: published
tags:
  - host-tips:Conseils hôtes
  - pricing:Tarification
  - booking-com:Booking.com
ogImageUrl: /blog-covers/chargeback-direct-booking-dispute.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Une voyageuse a quitté mon appartement, laissé un avis cinq étoiles, puis contesté 38 jours plus tard l'intégralité du paiement de 1 180 € auprès de sa banque, motif « service non rendu ». Stripe a débité ces 1 180 € de mon compte l'après-midi même, plus 15 € de frais de litige, avant qu'un seul humain n'ait lu une ligne de ma version. C'est précisément là qu'on apprend la dure vérité du direct : le jour où vous cessez de facturer les voyageurs via Airbnb, vous devenez le commerçant déclaré, et un chargeback n'est plus le problème de la plateforme. Il est le vôtre, et les dés sont pipés dès le départ.

Voici le manuel du litige que vous n'aviez pas vu venir. Ce qu'est vraiment une rétrofacturation, les quatre codes motifs qu'un hôte de courte durée rencontre réellement, les preuves qui gagnent chacun d'eux, et la prévention qui désamorce les cas ingagnables avant qu'ils ne démarrent.

## TL;DR

- Sur Airbnb, la plateforme absorbe les chargebacks. En réservation directe, **le commerçant déclaré, c'est vous** — sans filet.
- Stripe retire la somme contestée **plus 15 € de frais** dès l'ouverture du litige. Les 15 € sont perdus même si vous gagnez.
- Le porteur de carte a environ **120 jours** pour contester. Vous avez en général **7 à 21 jours** pour riposter.
- La **fraude amicale** (le voyageur a séjourné, puis contesté) se gagne avec les logs d'entrée. La **vraie fraude**, presque jamais.
- Contrat de réservation signé, correspondance d'identité et logs de serrure connectée : les trois preuves qui gagnent.
- **3-D Secure** transfère la responsabilité de la fraude à la banque — activez-le et le chargeback à la carte volée cesse d'être le vôtre.

## Pourquoi le direct vous expose et la plateforme non

Quand un voyageur réserve via Airbnb, c'est Airbnb le commerçant déclaré. Sur son relevé bancaire figure « Airbnb ». S'il conteste, la bataille oppose sa banque à Airbnb — et Airbnb dispose d'une équipe antifraude, d'un service juridique et d'un contrat avec les réseaux de cartes qui encaisse le coup. Vous l'apprenez, au pire, sous forme de réservation annulée. Le chargeback ne touche jamais votre compte.

Passez en direct — votre propre site, un lien de paiement Stripe, un terminal à la porte — et ce tampon disparaît. Sur le relevé du voyageur figure désormais *votre* libellé. Le commerçant déclaré, c'est vous. Quand le voyageur conteste, sa banque tire l'argent directement de votre solde Stripe, et c'est à vous de prouver la légitimité du paiement. C'est le plus gros coût caché du direct, et c'est exactement pour cela que le [calcul de rentabilité de la réservation directe](/blog/direct-booking-website-math) vous dit d'intégrer le risque de chargeback au prix avant de fêter la commission économisée.

Voici l'asymétrie qui fait mal. Lorsqu'un chargeback est déposé, Stripe débite immédiatement la totalité de la somme contestée de votre compte **plus 15 € de frais de litige**. Pas de délai de grâce pour répondre d'abord : l'argent part dès le premier jour. Si vous gagnez le litige des semaines plus tard, Stripe rend la somme contestée. Mais **pas** les 15 €. Ces frais sont le coût de traitement de la banque, et ils sont à vous, que vous gagniez ou perdiez. Même une victoire imparable sur une réservation de 1 180 € vous coûte donc 15 € et près d'une heure de collecte de preuves. Une défaite coûte 1 195 € et la nuitée.

## Les quatre codes motifs qu'un hôte voit réellement

Chaque chargeback porte un code motif — l'étiquette du réseau de cartes expliquant pourquoi le porteur conteste. En tant qu'hôte, vous n'en verrez jamais que quatre, et ils ne se gagnent pas tous aussi bien.

| Code motif (Visa) | Ce que le voyageur affirme | Chances réelles de gagner |
|---|---|---|
| 13.1 — Service non fourni | « Je n'ai jamais eu le séjour payé » | Élevées, avec preuves d'entrée |
| 13.3 — Non conforme à la description | « Le logement n'était pas celui de l'annonce » | Moyennes — tout dépend de l'annonce et des photos |
| 13.6 — Avoir non traité | « J'ai annulé et n'ai jamais été remboursé » | Élevées, si la politique a été signée |
| 10.4 — Fraude carte absente | « Je n'ai jamais fait ce paiement » (carte volée) | Quasi nulles |

Les trois premiers relèvent de la **fraude amicale** : un vrai voyageur qui a vraiment réservé, et qui conteste quand même. Peut-être a-t-il oublié le paiement, peut-être un conjoint a-t-il vu le relevé, peut-être tente-t-il de récupérer un argent que la politique de remboursement ne lui doit pas. Ces cas se gagnent parce que vous avez une trace écrite : une réservation, un contrat, un séjour qui a démontrablement eu lieu.

Le quatrième, 10.4, c'est la **vraie fraude** : votre logement réservé avec le numéro d'une carte volée. Le porteur légitime n'a réellement jamais réservé, et lorsqu'il conteste, les règles du réseau de cartes lui donnent raison presque automatiquement. Aucune preuve ne bat le « ce n'était pas moi » sur une transaction carte absente, parce que la responsabilité des paiements carte-absente non autorisés revient au commerçant par défaut. La seule chose qui déplace cette responsabilité, c'est 3-D Secure — j'y reviens plus bas.

## Trois litiges réels, et ce que chacun coûte

Les chiffres rendent l'asymétrie concrète. Voici trois litiges qu'un hôte peut réalistement attraper en un an, avec l'argent réellement en jeu.

| Scénario | Code motif | Vos preuves | Issue probable | Coût net |
|---|---|---|---|---|
| Le voyageur séjourne 4 nuits, conteste 38 jours après en niant le séjour | 13.1 | Contrat signé, logs de serrure connectée, fil de messages, log de connexion Wi-Fi | **Victoire** | 15 € de frais |
| Carte volée pour réserver un week-end à 800 €, le vrai porteur conteste | 10.4 | Aucune qui compte — paiement non autorisé | **Défaite** | 815 € |
| Le voyageur annule dans la fenêtre gratuite, vous remboursez 50 % selon votre politique plus stricte | 13.6 | Politique d'annulation signée, justificatif de remboursement, horodatage | **Victoire** | 15 € de frais |

Le scénario un, c'est le litige que j'ai perdu la première fois et gagné la seconde — non parce que les faits avaient changé, mais parce que la seconde fois j'avais les logs d'entrée. Le scénario deux ne se gagne pas sur preuves ; il se gagne en n'acceptant jamais la réservation d'une manière qui vous laisse la responsabilité. Le scénario trois se décide entièrement selon que le voyageur a signé votre politique d'annulation avant de payer. S'il l'a fait, la banque voit un contrat accepté et tranche en votre faveur. Si votre politique dormait dans un PDF que personne n'a cliqué, vous perdez un combat que vous auriez dû gagner.

Le schéma : deux des trois se gagnent ou se perdent **avant même le dépôt du litige** — au moment de la réservation, dans les preuves dont vous avez organisé la capture. La contestation n'est que le moment où vous encaissez la préparation.

## Les preuves qui gagnent vraiment une contestation

Quand vous contestez un chargeback (le terme technique est *representment* : vous « représentez » le paiement à la banque émettrice, preuves à l'appui), vous ne discutez pas avec le voyageur. Vous soumettez un dossier à un analyste bancaire qui dispose de 90 secondes et d'une checklist. La protestation vague perd. La preuve précise, datée, vérifiable par un tiers gagne. Les quatre pièces qui font la différence :

- **Un contrat de réservation signé.** Pas un e-mail de confirmation — un document que le voyageur a activement accepté, avec dates, total, logement et conditions d'annulation. Une signature électronique horodatée avec l'IP du voyageur, c'est de l'or. C'est la pièce la plus déterminante que vous puissiez réunir, et vous la réunissez à la réservation, pas après le litige. Tout cela vit dans le flux des [formulaires voyageur avant l'arrivée](/blog/pre-arrival-guest-forms).
- **La preuve que le séjour a eu lieu.** Logs de serrure connectée montrant l'ouverture de la porte avec le code que vous avez envoyé. Logs du routeur montrant un appareil connecté. Un relevé d'accès au clavier. Ils sont datés, difficiles à falsifier, et réfutent directement « service non rendu ». Un voyageur qui conteste un séjour où il est physiquement entré est contredit par son propre téléphone qui s'est connecté à votre réseau.
- **Le fil de messages.** L'historique complet — confirmation de réservation, instructions d'arrivée, le « merci, c'était parfait » du départ. Un voyageur qui vous remercie le jour quatre et conteste le jour quarante vous a livré la contradiction lui-même.
- **Les données d'autorisation d'origine.** Le résultat AVS (vérification d'adresse) et la correspondance CVC au moment du débit. Une adresse de facturation et un CVC qui concordent disent à la banque que le porteur était présent à l'achat — ce qui sape une accusation de fraude dans l'œuf.

Soumettez le tout en un dossier clair avec un résumé en deux phrases : *le voyageur a réservé le X, accepté les conditions (jointes), est physiquement entré dans le logement le Y (logs joints) et nous a écrit le Z. Le paiement est valide.* Les banques récompensent la concision étayée par des documents. Elles ignorent les dissertations.

## Comment réagir : la procédure de contestation et le chronomètre

Le chronomètre est ce que les hôtes ratent. Deux délais comptent, et ils appartiennent à des parties différentes.

D'abord, la fenêtre du voyageur : selon les règles Visa et Mastercard, le porteur a en général jusqu'à **120 jours** à compter de la transaction (ou de la date de service attendue) pour déposer le litige. C'est pourquoi un chargeback peut arriver plus d'un mois après le départ et sembler sorti de nulle part — il tient largement dans la fenêtre.

Ensuite, *votre* fenêtre : une fois le litige déposé, Stripe affiche un **délai de réponse, en général 7 à 21 jours**, pour soumettre vos preuves. Manquez-le et vous perdez automatiquement — pas de preuves, défaite immédiate. Après votre dépôt, la banque émettrice prend son temps : une décision peut prendre **60 à 75 jours**. Un seul litige peut donc rester ouvert deux à trois mois pendant que votre argent dort à la banque.

La procédure, dans l'ordre :

1. **Ne remboursez pas dans la panique.** Si vous remboursez alors qu'un chargeback est déjà déposé, vous pouvez payer deux fois — le chargeback *et* le remboursement — car ils empruntent des circuits séparés. Réglez sur une seule voie, jamais les deux.
2. **Lisez d'abord le code motif.** Il vous dit quelles preuves comptent. Un 13.1 réclame les logs d'entrée, un 13.6 réclame votre politique d'annulation. Soumettre le mauvais dossier au mauvais code, c'est un tir à blanc.
3. **Assemblez le dossier** — contrat, preuve de séjour, fil de messages, données d'autorisation — et rédigez le résumé en deux phrases.
4. **Soumettez avant le délai Stripe**, puis attendez les 60 à 75 jours de la décision bancaire.

Une nuance à connaître : les règles **Compelling Evidence 3.0** de Visa permettent à un commerçant de désamorcer à l'avance un litige pour fraude en montrant deux transactions antérieures non contestées du même porteur, reliées par des données concordantes comme l'IP ou l'appareil. Pour un hôte qui voit la plupart de ses voyageurs une seule fois, cela s'applique rarement — mais si un voyageur fidèle conteste, c'est une option réelle.

## Prévention : les litiges que vous étouffez avant qu'ils ne naissent

Le taux honnête de contestations gagnées dans le tourisme tourne autour de **20 à 40 %**, et la vraie fraude tire la moyenne vers le bas car elle est, de fait, ingagnable. Le calcul est clair : la prévention bat le procès à chaque fois. Quatre leviers font l'essentiel du travail :

- **Activez 3-D Secure.** Quand un voyageur authentifie un paiement carte-absente via 3DS (l'étape « confirmez cet achat » de la banque), **la responsabilité des chargebacks pour fraude passe de vous à la banque émettrice**. Le scénario de la carte volée que vous ne pouvez pas gagner sur preuves ? Avec 3DS, c'est la banque qui l'absorbe, pas vous. Pour les réservations directes, c'est le réglage le plus précieux que vous puissiez activer, et Stripe peut imposer 3DS automatiquement sur les paiements à risque.
- **Exigez la correspondance AVS et CVC.** Refusez les paiements où l'adresse de facturation ou le CVC ne concorde pas. Un fraudeur muni d'un numéro de carte volée n'a souvent pas le code postal de facturation. Cela filtre une part de la vraie fraude dès la porte.
- **Faites signer vos conditions au voyageur.** Un accord d'annulation et de règlement intérieur, activement accepté avant le paiement, transforme un « parole contre parole » en 13.6 en un contrat que la banque peut lire. Pas de signature, pas de défense.
- **Prenez une caution ou une pré-autorisation, ne refacturez pas après coup.** Les frais ajoutés par surprise sur une carte sont des appâts à chargeback. Capturez une caution claire d'emblée ; s'il faut couvrir un dégât, c'est une conversation, pas un re-débit silencieux. C'est aussi là que la protection côté plateforme prend sa valeur — [AirCover face à la caution Booking.com](/blog/airbnb-aircover-vs-booking-damage-deposit) : qui passe en direct porte ce risque lui-même.

Le fil conducteur : un chargeback se décide par ce que vous avez mis en place à la réservation, pas par la véhémence de votre argumentaire ensuite. Capturez le contrat, capturez les logs d'accès, authentifiez la carte — et les seuls litiges que vous perdez sont les rares vraies fraudes, que 3-D Secure confie de toute façon à la banque. Garder chaque réservation, chaque contrat et chaque relevé d'entrée au même endroit pour assembler le dossier en dix minutes plutôt qu'en une soirée, c'est exactement le rôle d'un tableau de bord opérationnel unique : [réunissez réservations et données voyageurs dans une seule vue](/onboard) avant d'en avoir besoin pour un litige.

## FAQ

**Un voyageur peut-il faire un chargeback sur une location de vacances ou une réservation directe ?**
Oui. Dès qu'un voyageur vous paie directement — votre site, un lien Stripe ou un terminal — il peut contester ce paiement auprès de sa banque, et c'est à vous, commerçant déclaré, de le défendre. Sur Airbnb ou Vrbo, la plateforme est le commerçant et absorbe le litige ; c'est l'une des choses que votre commission paie. Le direct échange cette protection contre la commission économisée.

**L'argent est-il retiré immédiatement quand un chargeback est déposé ?**
Oui. Chez Stripe, la somme contestée plus 15 € de frais de litige sont débitées du solde dès l'ouverture du litige, avant même votre réponse. Si vous gagnez la contestation, Stripe rend la somme contestée — mais jamais les 15 €. Une victoire vous coûte donc quand même 15 € et votre temps, une défaite le montant total de la nuitée plus ces 15 €.

**Comment gagner un chargeback en tant qu'hôte ?**
Soumettez à la banque émettrice un dossier de preuves serré : un contrat signé par le voyageur, la preuve que le séjour a eu lieu (logs de serrure connectée, connexions Wi-Fi, relevés d'accès), le fil de messages avec le remerciement du départ, et la correspondance AVS/CVC du paiement. Accordez les preuves au code motif, rédigez un résumé en deux phrases et soumettez avant le délai Stripe. Les documents précis et datés gagnent ; les dissertations émotionnelles perdent.

**Combien de temps un voyageur a-t-il pour contester un paiement ?**
En général jusqu'à 120 jours à compter de la transaction ou de la date de service attendue, selon les règles Visa et Mastercard. C'est pourquoi un chargeback peut arriver plus d'un mois après le départ. Une fois déposé, votre fenêtre est bien plus courte — 7 à 21 jours pour soumettre les preuves — et la décision finale de la banque peut prendre encore 60 à 75 jours.

**3-D Secure vaut-il le coup pour les réservations directes ?**
Pour la plupart des hôtes, oui. Quand un voyageur authentifie le paiement via 3-D Secure, la responsabilité des chargebacks liés à la fraude passe de vous à la banque émettrice. Cela neutralise le seul type de litige que vous ne pouvez pas gagner sur preuves — le « je n'ai jamais fait ce paiement » de la carte volée. Le prix : un peu plus de friction au paiement, mais sur les réservations à forte valeur cette protection en vaut la peine.

**Une simple caution protège-t-elle des chargebacks ?**
Une caution aide pour les dégâts, pas directement pour les chargebacks — le voyageur peut aussi contester le débit de caution. Ce qui prévient vraiment les litiges, c'est l'authentification de la carte (3DS, AVS, CVC) et un accord signé. Prenez la caution sous forme de pré-autorisation claire et acceptée d'emblée plutôt qu'un débit-surprise plus tard, car les débits-surprise sont eux-mêmes un déclencheur fréquent de chargeback.

**Que se passe-t-il si je rembourse un voyageur après le dépôt d'un chargeback ?**
Vous pouvez payer deux fois. Remboursement et chargeback empruntent des circuits séparés, si bien qu'un remboursement sur un paiement déjà en litige peut faire sortir l'argent de votre compte par les deux voies. Choisissez une seule voie : laissez le processus de litige trancher, ou — si vous donnez raison au voyageur — réglez via le litige, pas par un remboursement parallèle.

## Un avis tranché

Le premier chargeback perdu apprend que le direct n'est pas qu'une économie de commission — c'est un transfert de risque de la plateforme vers vous, et la plupart des hôtes n'intègrent jamais ce transfert au prix. La solution n'est pas de craindre les réservations directes ; c'est de traiter chaque paiement direct comme une transaction que vous devrez peut-être défendre par écrit deux mois plus tard. Authentifiez la carte, faites signer quelque chose au voyageur, capturez les logs de porte et gardez le tout au même endroit. Faites-le, et les seuls chargebacks que vous perdrez jamais seront les vraies fraudes — dont 3-D Secure confie discrètement la plupart à la banque. L'hôte qui traite le contrat de réservation comme une paperasse facultative est l'hôte qui finance le week-end gratuit d'un inconnu et paie 15 € pour le plaisir.
