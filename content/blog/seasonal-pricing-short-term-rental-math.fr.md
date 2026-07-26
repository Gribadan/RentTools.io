---
slug: seasonal-pricing-short-term-rental-math
locale: fr
title: "Tarification saisonnière : votre historique en échelle tarifaire"
excerpt: "La plupart des hôtes gardent un seul tarif toute l'année. Construisez un indice de saisonnalité à partir de votre occupation, transformez-le en coefficients mensuels — et cessez de perdre de la marge."
status: published
tags:
  - pricing:Tarification
  - host-tips:Conseils hôtes
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/seasonal-pricing-short-term-rental-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Ma première année complète comme hôte, je facturais 110 $ la nuit pour un studio en ville et je n'ai jamais touché à ce chiffre. Ça me semblait rigoureux. En juillet, le calendrier était complet dès la fin avril — chaque nuit partie, à 110 $, quatre-vingt-dix jours avant la moindre arrivée. Je me disais que c'était un bon problème. Ce n'en était pas un. Un logement qui se remplit trois mois à l'avance n'est pas populaire : il est mal tarifé. Le logement identique deux portes plus loin était à 155 $ ce juillet-là, et complet lui aussi. Cela fait environ 1 300 $ que j'ai offerts à des voyageurs d'été prêts à payer davantage, en un seul mois, parce que j'étais fier d'un tarif choisi en janvier.

## TL;DR

- Un tarif figé toute l'année est l'erreur de prix la plus coûteuse d'un hôte.
- **Indice de saisonnalité** = occupation du mois ÷ votre occupation annuelle moyenne.
- On mesure la demande par l'occupation à tarif constant, pas par l'ADR — l'ADR est circulaire.
- Complet 60+ jours à l'avance n'est pas une victoire : c'est que la haute saison est sous-tarifée.
- Tarif = ancrage × indice, corrigé par le test du complet ; à reconstruire chaque année.
- La remise de basse saison ne change rien ; l'argent est dans la majoration de pic.

## Pourquoi un tarif figé est l'habitude la plus coûteuse en location

Un tarif unique tenu toute l'année fuit aux deux bouts du calendrier — et les deux fuites ne sont pas de la même taille.

La fuite de basse saison est la plus visible : en février, vos 110 $ tiennent à 48 % d'occupation là où 85 $ auraient peut-être rempli 65 % du mois. Elle passe pour l'erreur coûteuse parce qu'on voit les nuits vides.

La fuite de pic est invisible, et c'est précisément pour ça qu'elle est plus grande. En juillet, vos 110 $ étaient complets — 96 % d'occupation, un calendrier qui vous rendait heureux — alors que le marché aurait porté 150 $ sans presque entamer l'occupation. Rien ne cloche à l'œil. Aucune nuit vide à contempler. Mais chacune de ces 29 nuits est partie 40 $ sous ce qu'un voyageur était prêt à payer, et vous ne verrez jamais le contrefactuel : un calendrier complet ne vous montre pas la demande que vous avez refusée.

Voici la règle qui recadre tout le problème : **si vos mois de pointe se remplissent bien avant votre fenêtre de réservation habituelle, vous les sous-tarifez.** Un studio en ville avec un [délai de réservation médian](/blog/booking-lead-time-short-term-rental) d'environ deux semaines ne devrait pas avoir juillet plein dès avril. Quand c'est le cas, le calendrier vous dit, dans la seule langue qu'il ait, que le prix est trop bas.

## Ce que « la saisonnalité » mesure vraiment — et quelle métrique prendre

La saisonnalité, c'est la demande qui bouge avec le calendrier : le même appartement vaut plus en juillet qu'en février parce qu'en juillet plus de gens le veulent, point. L'astuce est de mesurer cette demande sans laisser le prix contaminer la mesure.

L'instinct dit : prends l'ADR — le tarif journalier moyen — par mois. Ne le faites pas. L'ADR est circulaire : il dépend en partie du prix que *vous* avez fixé, donc si vous avez facturé plus en juillet, l'ADR de juillet est élevé parce que vous l'avez rendu élevé, pas parce que la demande l'était. Vous relisez votre propre décision comme si c'était une donnée.

Prenez plutôt l'**occupation à tarif à peu près constant**. Si vous avez tenu quelque chose autour de 110 $ toute l'année, l'occupation de chaque mois est une lecture propre de combien le marché voulait votre logement ce mois-là, à prix constant. C'est le signal. Le rythme de réservation — combien de jours à l'avance un mois se remplit — est une seconde lecture utile, et elle compte le plus là où l'occupation vous lâche. C'est le piège suivant.

**Le piège du plafond.** L'occupation plafonne à 100 %. Un mois complet se lit comme « 100 % de demande », que la vraie demande ait été 101 % ou 180 %. Donc l'occupation *sous-estime* vos mois les plus forts — ceux qui étaient complets ne peuvent pas montrer jusqu'où au-delà du plein ils seraient allés. C'est pour ça qu'existe le test du complet : pour tout mois qui franchit ~90 % ou se remplit bien avant votre délai médian, traitez le coefficient issu de l'occupation comme un plancher, pas comme une réponse, et montez le tarif jusqu'à ce que le mois cesse d'être complet 60+ jours à l'avance.

## Construisez votre indice de saisonnalité en un tableau

L'indice, c'est une division. Prenez l'occupation du mois (à un tarif tenu près d'une valeur constante), divisez-la par votre occupation annuelle moyenne, et vous obtenez un coefficient autour de 1,00. Voici un studio en ville de forme réaliste, avec 70 % d'occupation moyenne sur l'année :

| Mois | Occupation à tarif constant | Indice de saisonnalité |
|---|---|---|
| Janvier | 45 % | 0,64 |
| Février | 48 % | 0,69 |
| Mars | 58 % | 0,83 |
| Avril | 68 % | 0,97 |
| Mai | 78 % | 1,11 |
| Juin | 88 % | 1,26 |
| Juillet | 96 % | 1,37 |
| Août | 95 % | 1,36 |
| Septembre | 82 % | 1,17 |
| Octobre | 70 % | 1,00 |
| Novembre | 55 % | 0,79 |
| Décembre | 62 % | 0,89 |

Lisez juillet et août avec le piège du plafond en tête. Ils indexent à 1,37 et 1,36, mais tous deux dépassaient 95 % d'occupation — ils ont touché le plafond. Leur vrai indice est plus haut que ce que le tableau peut montrer ; le chiffre est un plancher. Octobre indexe à exactement 1,00, ce qui en fait un mois d'ancrage propre : le tarif qui tient octobre à une occupation saine est votre référence ×1,00.

Pour construire le vôtre, sortez douze mois de réservations et comptez les nuits occupées par mois. La seule condition, c'est que toutes les réservations soient au même endroit : si vos nuits sont éparpillées entre un tableau de bord Airbnb, un extranet Booking.com et un identifiant Vrbo, vous ne pouvez pas les compter proprement. [Réunir toutes les réservations dans un seul calendrier](/onboard) transforme ça en un décompte de cinq minutes au lieu d'un rapprochement sur trois onglets.

## Transformez l'indice en échelle tarifaire

Choisissez un **tarif d'ancrage** — le chiffre unique que vous factureriez s'il fallait n'en garder qu'un, ou votre tarif fixe actuel. Multipliez-le par l'indice de chaque mois. Ça donne une échelle brute. Puis deux corrections : la poussée du complet en haut, et un plancher de coût en bas.

Ancré à 110 $, l'échelle brute et la corrigée :

| Mois | Indice | Brut (ancrage × indice) | Tarif corrigé |
|---|---|---|---|
| Janvier | 0,64 | 70 $ | 75 $ |
| Février | 0,69 | 76 $ | 80 $ |
| Mars | 0,83 | 91 $ | 91 $ |
| Avril | 0,97 | 107 $ | 107 $ |
| Mai | 1,11 | 122 $ | 122 $ |
| Juin | 1,26 | 139 $ | 139 $ |
| Juillet | 1,37 | 151 $ | 160 $ |
| Août | 1,36 | 150 $ | 158 $ |
| Septembre | 1,17 | 129 $ | 129 $ |
| Octobre | 1,00 | 110 $ | 110 $ |
| Novembre | 0,79 | 87 $ | 87 $ |
| Décembre | 0,89 | 98 $ | 98 $ |

Juillet et août ont été poussés au-dessus du chiffre brut parce qu'ils étaient plafonnés : les 151 $ bruts venaient d'une occupation plafonnée, alors je les ai décalés à 160 $ et 158 $, et je continuerai l'an prochain s'ils se remplissent encore tôt. Janvier et février ont reçu un plancher : le calcul brut voulait 70 $ et 76 $, j'ai mis 75 $ et 80 $ — à peu près là où une remise cesse d'acheter assez d'occupation supplémentaire pour compter.

**Le plancher de coût.** Ne laissez jamais un tarif de basse saison descendre sous le coût marginal d'une nuit occupée — la part de ménage, les [consommables](/blog/consumables-cost-per-stay-math) et le [surcoût de charges](/blog/utility-cost-short-term-rental-math) qu'un voyageur ajoute réellement, en général 30–60 $. Sous cette ligne, une nuit occupée perd de l'argent, et vous êtes mieux à vide. En marché normal, le plancher ne joue presque jamais, mais c'est le garde-fou qui empêche un indice naïf de vous tarifer à perte dans un janvier mort.

Ce tarif est la couche *saisonnière*. Votre majoration de week-end se pose dessus, mois par mois : la [majoration vendredi/samedi](/blog/weekend-pricing-premium-math) se calcule contre la base de juillet à 160 $, pas contre un chiffre annuel figé. Empilez les deux ; ne les moyennez pas.

## Les nuits de compression que l'indice rate

L'indice est une base mensuelle. Il est lisse par construction, et la vraie demande ne l'est pas — une seule conférence, un festival de musique, un week-end de remise de diplômes ou un jour férié peut hisser une date isolée au double du tarif pendant que le reste du mois se comporte normalement.

Ce sont des **nuits de compression**, et elles réclament une surcharge quotidienne au-dessus de la base saisonnière, pas une modification de l'indice du mois. Si votre ville accueille une conférence de 40 000 personnes la deuxième semaine de septembre, cette semaine peut porter 2× à 2,5× votre base de septembre de 129 $ — disons 260 à 320 $ — pendant que le reste de septembre reste à 129 $. Repliez ce pic dans l'indice mensuel et vous surtarifez les trois autres semaines tout en sous-tarifant l'événement.

La séparation pratique : l'indice de saisonnalité fixe votre tarif pour une semaine normale de chaque mois ; une courte liste d'événements locaux connus fixe des surcharges quotidiennes. Tenez un calendrier des dix ou quinze dates de l'année qui compriment votre marché — la plupart des hôtes peuvent les citer de mémoire dès qu'ils y pensent — et tarifez-les une par une. Tout le reste roule sur l'échelle.

## Où les hôtes à tarif fixe perdent le plus

Mettez les deux fuites côte à côte, et la surprise, c'est laquelle compte.

**Pic, sous-tarifé.** Juillet, 30 nuits louables, 29 vendues à 110 $ = 3 190 $ — et complet dès avril, 90 jours avant qu'un marché à médiane de deux semaines ne devrait se remplir. Montez la base à 150 $. Même si l'occupation glisse de 96 % à 90 % — 27 nuits — ça fait 4 050 $. Vous avez gagné **860 $ de plus sur un mois** et cessé d'être complet un trimestre à l'avance. Sur un été de trois mois, c'est environ 2 400 $ que vous laissiez chaque année sur la table — invisiblement, tout en vous réjouissant d'un calendrier complet.

**Creux, surtarifé.** Février, 28 nuits, 48 % d'occupation à 110 $ = environ 1 540 $ (13 nuits). Descendez à 85 $ et montez l'occupation à 65 % — 18 nuits — et vous obtenez 1 530 $. En gros, une opération blanche côté chiffre d'affaires. La remise n'a pas rapporté ; elle a déplacé cinq nuits vides vers des nuits occupées à tarif plus bas, et les deux effets se sont annulés.

Alors pourquoi remiser le creux tout court ? Parce que ces cinq nuits occupées de plus valent quelque chose que la ligne de revenu ne montre pas : plus d'[avis par an](/blog/airbnb-rating-recovery-math), de meilleures stats Superhost, un signal d'activité plus frais pour l'algorithme de classement — et chaque nuit couvre encore les ~45 $ de coût marginal. Mais ne vous trompez pas sur où est l'argent. **La remise de basse saison est une opération blanche que vous prenez pour les avis. La majoration de haute saison, c'est le vrai revenu.** Les hôtes mettent leur énergie à se torturer sur la remise de février et ne touchent jamais au tarif de juillet qu'ils devraient monter.

## N'empruntez pas la saisonnalité d'un autre

Le Smart Pricing d'Airbnb et les outils tiers comme PriceLabs ou Wheelhouse appliquent tous une saisonnalité — mais c'est une saisonnalité *de marché*, agrégée sur toute votre ville ou région. La première année, quand vous n'avez pas d'historique à vous, c'est un bon point de départ. Et c'est faux à l'instant où votre micro-marché s'écarte de la moyenne de la ville, et les micro-marchés s'écartent toujours.

Un logement près d'une université culmine en août et septembre — à la rentrée et aux visites familiales — puis de nouveau à la remise des diplômes : une courbe qui n'a rien de la pointe estivale balnéaire que suppose le modèle de la ville. Un appartement près d'un domaine skiable inverse tout : février est votre juillet. Un logement près d'un hôpital ou d'un gros employeur peut n'avoir presque pas de saison, restant plat à 75 %, parce que sa demande, ce sont des séjours médicaux et des voyages d'affaires, pas du tourisme. Un modèle à l'échelle de la ville moyenne tout ça en une bouillie qui ne convient à aucun.

Les [outils de tarification dynamique](/blog/dynamic-pricing-short-term-rental) valent leur prix — pour les ajustements quotidiens de dernière minute et la détection des nuits de compression, qu'ils font vraiment bien. Mais la base mensuelle doit être *votre* indice, bâti sur *vos* douze mois, et prendre le dessus sur toute courbe de marché de l'outil. Réglez le profil saisonnier de l'outil à la main depuis votre tableau ; ne le laissez pas deviner. La première année, empruntez la courbe du marché. La deuxième, vous avez les seules données qui décrivent vraiment votre logement — et c'est là-dessus que vous devriez tarifer.

## FAQ

**Comment fixer des prix saisonniers sur Airbnb ?**
Airbnb permet de définir des tarifs de nuit personnalisés par plages de dates directement dans le calendrier : sélectionnez un bloc de dates, fixez le prix, répétez mois par mois selon votre échelle tarifaire. Si vous utilisez le Smart Pricing, fixez un prix minimum par mois pour que l'algorithme ne vous descende pas sous votre plancher saisonnier — laissé seul, il sous-cotera volontiers votre haute saison. Le plus propre est de poser vos douze tarifs de base une fois en début d'année, puis de ne toucher les dates individuelles que pour les événements.

**Quels mois sont la haute saison en location courte durée ?**
Il n'y a pas de réponse universelle — c'est entièrement local. Les marchés de plage et de lac culminent l'été ; les marchés de ski, l'hiver ; les villes ont souvent une pointe de printemps et d'automne en intersaison, plus des pics d'événements ; les logements près des universités culminent à la rentrée et à la remise des diplômes. Le seul moyen de connaître la vôtre est de tenir votre tarif à peu près constant un an et de lire l'occupation mensuelle. Ne supposez pas que votre courbe colle à la moyenne de la ville.

**Faut-il mesurer la saisonnalité par l'occupation ou l'ADR ?**
Par l'occupation, à tarif à peu près tenu. L'ADR est circulaire parce qu'il reflète en partie les prix que vous avez choisis ; un mois à ADR élevé peut donc seulement signifier que vous avez tarifé haut, pas que la demande était haute. L'occupation à prix constant isole la demande. La seule exception : pour les mois complets, l'occupation plafonne à 100 % et les sous-estime — le signal devient alors la précocité avec laquelle ils se sont remplis.

**Combien la haute saison devrait-elle coûter de plus que la basse ?**
Assez pour que les extrêmes cessent de mal se comporter — il n'y a pas de ratio fixe. L'écart du creux au pic tombe souvent entre 1,5× et 2,5×, mais c'est un résultat, pas une cible. La haute saison est bien tarifée quand elle n'est plus complète bien avant votre fenêtre de réservation habituelle ; la basse, quand elle est près du point où une remise de plus n'achète plus d'occupation notable. Laissez ces deux tests fixer l'écart.

**Le Smart Pricing d'Airbnb gère-t-il la saisonnalité ?**
En partie. Il applique une saisonnalité de marché et réagit à la demande, mais il prend la courbe de toute votre ville, pas de votre micro-marché, et il ignore votre plancher de coût. Laissé sans surveillance, il tend à sous-tarifer votre vrai pic et peut descendre sous le seuil de rentabilité dans votre creux. Utilisez-le si vous voulez, mais fixez des prix minimum et maximum mensuels depuis votre propre indice pour qu'il opère à l'intérieur de votre échelle plutôt que de la remplacer.

**À quelle fréquence mettre à jour les prix saisonniers ?**
Reconstruisez l'indice sur douze mois une fois par an, à partir des douze derniers mois de réservations. En cours d'année, ne touchez pas aux tarifs de base sauf si un mois se comporte clairement mal face au test du complet — laissez-les tranquilles. Les nuits de compression et les trous de dernière minute se traitent à part, en surcharges quotidiennes, pas en déplaçant tout le mois.

**La tarification saisonnière vaut-elle le coup pour un seul logement ?**
Oui — sans doute même plus avec un seul logement, car vous n'avez pas de portefeuille pour moyenner un pic mal tarifé. La saisonnalité est le plus grand levier de prix de la plupart des petits hôtes, et celui qu'ils ignorent le plus, précisément parce qu'un tarif fixe ne demande aucune décision. Une soirée à bâtir l'indice se rembourse en général dès le premier mois de pointe.

**Comment tarifer l'intersaison ?**
L'indice s'en charge tout seul — les mois intermédiaires comme avril et septembre tombent près de 1,00 et prennent à peu près votre tarif d'ancrage. L'erreur d'intersaison n'est pas le tarif de base, c'est la durée minimale : la demande d'intersaison est plus irrégulière, donc un minimum rigide de trois nuits abandonne plus de nuits isolées qu'en pic. Assouplissez le minimum aux mois intermédiaires et laissez l'échelle porter le prix.

## Une opinion tranchée

La majoration de week-end capte toute l'attention sur les forums d'hôtes, et elle vaut peut-être quelques pour cent par an. La saisonnalité en vaut plusieurs fois plus, et les hôtes l'ignorent parce qu'une échelle tarifaire ne donne pas la dopamine quotidienne de voir un outil ajuster le chiffre du soir. C'est ennuyeux. Vous posez douze tarifs en une soirée, surchargez une douzaine de dates d'événements, et n'y touchez plus jusqu'au janvier suivant. C'est tout le système. L'heure la plus rentable que vous passerez sur les prix cette année, c'est celle où vous bâtirez l'indice et monterez enfin le pic que vous vendiez, en silence, trois mois trop tôt.
