---
slug: self-hosting-property-manager-droplet
locale: fr
title: "Self-hoster son property manager sur un droplet à 4 $"
excerpt: Comment self-hoster un property manager pour location courte durée sur un droplet DigitalOcean bon marché. Vrais chiffres RAM, vrais plafonds de build, vrai coût mensuel.
status: draft
tags:
  - self-hosting:Auto-hébergement
  - host-tips:Conseils hôtes
  - infrastructure:Infrastructure
ogImageUrl: /blog-covers/self-hosting-property-manager-droplet.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Self-hoster son property manager sur un droplet à 4 $

La première facture cloud que j’ai payée comme hôte était de 73 $. J’avais cliqué dans la console AWS, choisi des défauts qui paraissaient sensés, et fini avec un t3.medium qui tournait à vide 24/7 plus une Postgres managée que je n’interrogeais jamais. Après l’avoir annulée, j’ai déplacé tout le setup sur un droplet DigitalOcean à 4 $/mois avec SQLite. Ça tourne là depuis plus d’un an. Ça sert une base d’utilisateurs petite mais réelle. Ça n’a pas pris feu.

Voici comment faire ça, ce qui casse au bas de gamme, et l’arbitrage honnête entre la machine à 4 $ et un service hébergé.

## TL;DR

- Un droplet DigitalOcean de 512 Mo à 1 Go fait tourner un petit Next.js + SQLite sans souci au runtime. Le build, c’est une autre histoire.
- Construisez l’artefact sur un runner CI (GitHub Actions, GitLab CI), envoyez-le au droplet via SSH. Le droplet ne compile rien.
- SQLite gère sans effort la charge d’un seul hôte. Des dizaines de milliers de réservations, lectures à un chiffre en ms, sauvegardes par fichier.
- Cloudflare devant le droplet vous donne TLS gratuit, protection DDoS gratuite, et cache statique gratuit. Utilisez-le.
- Coût mensuel total pour un hôte de 1 à 50 biens : 4 à 6 $ de droplet, 0 $ Cloudflare, 0 $ palier gratuit GitHub Actions. 4 à 10 $/mois est le plancher réaliste.

## Le pour et le contre du self-hosting

Le self-hosting d’un property manager n’est pas pour tout le monde. Soyez honnête sur votre côté avant de continuer.

Envisagez le self-hosting si :

1. Vous faites déjà tourner une machine Linux pour autre chose (un site perso, un home lab, un VPN). L’effort marginal d’ajouter une appli est faible.
2. Vous avez 1 à 50 biens et voulez éviter 25 à 200 $/mois de frais PMS.
3. Vous voulez posséder vos données — les scans de passeport voyageur ne devraient pas vivre sur la base partagée d’un SaaS qui peut être racheté dans trois ans.
4. Vous aimez réparer à 23 h parce que la joie dépasse le sommeil perdu.

Ne self-hostez **pas** si :

1. Vous avez 100+ biens. Les vraies API Channel Manager (Hostaway, Lodgify) valent leur prix à cette échelle ; le monde tout-iCal est trop perdant.
2. Vous avez un emploi de bureau qui ne vous permet pas de répondre à une alerte à 3 h. Le self-hosting fait de vous l’équipe d’astreinte d’un.
3. Vous attendez du five-nines. Un droplet unique = point de défaillance unique. Un reboot, un blip réseau, un disque plein — la reprise est sur vous.
4. « Regarder les logs » vous semble une punition. Le self-hosting, c’est essentiellement regarder les logs.

Le juste milieu honnête : essayez d’abord une instance hébergée gratuite ([RentTools](/onboard) en est un exemple ; il y en a d’autres). Si ça colle, restez. Pour plus de contrôle, le droplet à 4 $ est l’étape suivante. Si vous le dépassez, un PMS managé est la suivante.

## La question du dimensionnement

Les droplets les moins chers de DigitalOcean tournent entre 4 et 6 $/mois selon la région et la grille du moment. Une machine 512 Mo à 1 Go avec 1 vCPU et 10 à 25 Go de SSD. Leur [page tarifs](https://www.digitalocean.com/pricing/droplets) fait référence ; les chiffres bougent tous les quelques trimestres.

Pour un seul Next.js + SQLite, la [doc de déploiement Next.js](https://nextjs.org/docs/app/building-your-application/deploying) décrit le serveur `node` standard que vous tournerez. Usage réel observé sur ma machine, sur des mois :

1. **RAM au runtime** : 250 à 400 Mo résidents pour le process Node sous trafic normal (1 à 5 requêtes simultanées).
2. **CPU au runtime** : moins de 5 % d’un vCPU en moyenne. Pics à 30 % pendant les cycles de synchro iCal toutes les 10 minutes.
3. **Disque utilisé par SQLite** : moins de 100 Mo pour une base de 50 biens, 8 000 réservations, 12 000 voyageurs. SQLite est dense.
4. **Disque utilisé par Node + node_modules** : 600 Mo à 1 Go. C’est la partie qui veut le droplet plus gros.

Le palier 1 Go gère tout confortablement. Le palier 512 Mo gère le runtime mais vous toucherez l’OOM pendant des opérations comme migrations en masse ou restauration de sauvegarde. Si le budget permet, prenez 1 Go. Sinon, structurez les opérations pour faire le gros boulot ailleurs (CI, votre laptop) et envoyez les résultats à la petite machine.

Ce que vous ne voulez **pas** faire : tourner le build sur le droplet. Sujet suivant.

## Construire ailleurs, exécuter sur la machine

C’est l’astuce la plus utile au bas de gamme.

Un build Next.js sur une petite machine se passe mal. Le process spawne plusieurs workers, garde tout le graphe de dépendances en mémoire, fait la compil TypeScript, optimise les bundles, génère les pages pré-rendues, et produit un `.next/` 10 fois plus gros que la source. Sur un 1 Go, ce combo va :

1. Manger toute la RAM en 30 à 60 secondes.
2. Déclencher l’OOM killer, qui tue d’habitude le build mais parfois l’appli en cours.
3. Vous laisser avec un déploiement à moitié construit incohérent et une brève coupure.

Le correctif : construisez l’artefact sur une machine costaud et envoyez le résultat. Deux motifs marchent :

1. **Runner GitHub Actions.** 16 Go de RAM. Build en 2 à 4 minutes. Le runner produit un tarball de `.next/`, le copie au droplet via `scp`, le droplet décompresse et redémarre le service systemd. Coût : 0 $ sur le palier gratuit GitHub Actions pour les repos publics et la plupart des petits privés.
2. **Votre laptop.** Même idée, manuel. `npm run build` chez vous, `rsync` la sortie, redémarrez. Moins reproductible que la CI mais OK pour un opérateur d’une personne qui déploie une fois par semaine.

Le motif marche parce que les exigences runtime (`node server.js` contre un `.next/` pré-construit) sont nettement plus légères que celles du build (compiler, bundler, optimiser). Le droplet ne fait que la moitié facile.

Si vous prenez la voie CI, la [doc GitHub Actions](https://docs.github.com/en/actions) couvre le YAML ; le [tuto DigitalOcean sur les apps Node managées par systemd](https://www.digitalocean.com/community/tutorials) est la référence côté droplet. Câblez `systemd` pour gérer le process Node afin que reboots et crashs récupèrent automatiquement.

## SQLite suffit

L’autre surprise, c’est jusqu’où SQLite vous emmène.

Pour un property manager mono-tenant ou mono-hôte, SQLite gère des charges qui suggéreraient conventionnellement Postgres. Quelques points qui marchent contre les attentes :

1. **Lectures concurrentes** : le mode WAL permet plusieurs lecteurs en parallèle. Même un tableau de bord à 100 biens chargeant des dizaines de réservations lit proprement.
2. **Débit en écriture** : les écritures d’un seul hôte font quelques unités par seconde au pire. Bien sous le plafond SQLite de milliers d’écritures/sec sur disque commodity.
3. **Sauvegardes** : une base SQLite est un seul fichier. Sauvegarde quotidienne en `cp data/prod.db data/backups/$(date +%F).db`, rapide même à l’échelle Go grâce au cache de pages OS qui rend la lecture séquentielle.
4. **Migrations** : les migrations Prisma standard fonctionnent. La contrainte « pas d’écrivains concurrents » mord pendant les changements de schéma, mais une pause de 30 secondes est acceptable pour un outil mono-hôte non temps-critique.

Cas où SQLite casse : multi-région (pas de réplication), écriture multi-tenant lourde en fan-out (mieux servi par Postgres ou un setup sharded), et recherche plein texte sur des millions de lignes (faisable avec FTS5 mais Postgres est plus idiomatique). Aucun de ces cas ne s’applique à un petit property manager.

Le chemin de migration est OK si vous le dépassez. Le motif d’adaptateur de base Prisma (on utilise `@prisma/adapter-libsql`) signifie que basculer de SQLite à Turso, libSQL répliqué ou Postgres complet est essentiellement un changement de variable d’env. Construisez en SQLite d’abord, basculez plus tard si besoin.

Pour creuser pourquoi nous avons choisi SQLite, voir [l’article sur l’automatisation du planning de ménage](/blog/cleaning-schedule-automation) qui vit sur la même base et montre la forme réelle des données.

## Cloudflare, TLS et l’infra ennuyeuse

Devant le droplet, je tourne Cloudflare. Palier gratuit. Mode TLS Full (strict). Les bénéfices sont gros pour le coût (zéro) :

1. **Certificat TLS gratuit.** Provisionné automatiquement. Pas de cron Let’s Encrypt, pas de certbot.
2. **Bouclier DDoS.** Un petit hôte est peu probablement DDoSé exprès, mais un bot mal élevé a frappé mon CPU une ou deux fois. Cloudflare absorbe.
3. **Cache statique.** Images, polices et chemins statiques `_next/static/` cachent à l’edge. Ça baisse la bande passante et le CPU du droplet assez pour que le palier 1 Go paraisse confortable.
4. **DNS au même endroit que le proxy.** Un seul tableau de bord pour tout.

Setup complet : le registrar pointe les NS vers Cloudflare, Cloudflare proxy le domaine apex et www vers l’IP du droplet, le droplet tourne nginx terminant le trafic Cloudflare en TLS strict, nginx renvoie au process Next.js local. Toute la chaîne DNS-vers-app prend peut-être une heure si vous l’avez déjà fait, deux à trois la première fois.

L’étape pas glamour : `systemd`. Câblez votre Next.js comme une unit systemd (`rent-tool.service` chez nous) et vous arrêtez de vous inquiéter du démarrage au boot, du redémarrage au crash, de la rotation des logs et des limites de ressources. systemd, c’est l’OS qui vous dit qu’il est OK de laisser la machine seule.

*Figure 1 : Le pipeline de déploiement. Push sur master → GitHub Actions construit → scp tarball au droplet → reload systemd. Capture à venir, hébergée sur /blog/self-hosting-property-manager-droplet/figure-1.png.*

## Ce qui casse en bas de gamme

Ce qui a vraiment cassé sur ma machine à 6 $, par fréquence :

1. **Disque plein.** Les logs s’accumulent. Les vieilles sauvegardes s’accumulent. Un `npm install` à moitié foiré laisse des résidus dans `~/.npm`. Mettez en place `logrotate`, une politique de rétention (gardez les 14 derniers quotidiens + 12 derniers mensuels), et tournez `du -sh /var/log /home/app/.npm /tmp` une fois par mois. Deux fois en un an j’ai pris ENOSPC, et j’ai remarqué seulement parce que le déploiement avait échoué.
2. **Pression mémoire pendant une opération manuelle.** Un dump SQL ponctuel, un push de schéma Prisma, un script qui charge toutes les réservations en mémoire. Le motif build-CI règle le cas routinier ; les manuels demandent de la discipline (streamez, ne chargez pas ; pipez, n’accumulez pas). Ajoutez `--max-old-space-size=512` aux invocations `tsx` ponctuelles en filet de sécurité.
3. **Dérive de config domaine.** Cloudflare change un défaut, ou le DNS TTL cache plus longtemps que prévu. Une fenêtre de fix de 24 h est normale. Mettez vos TTLs à 60 secondes pendant les changements actifs ; remontez après.
4. **Une mineure de Next.js qui casse une dépendance.** Deux fois en 18 mois. Le fix est rapide (rollback du package, push du correctif) ; la leçon : faites tourner le build en CI avant le déploiement, pour que la version cassée n’atteigne jamais le droplet.

Ce qui n’a **pas** cassé : corruption SQLite, instabilité systemd, le droplet lui-même qui reboote sans prévenir. Les petits droplets DigitalOcean sont étonnamment stables. L’infra ennuyeuse reste ennuyeuse.

## FAQ

**SQLite est-il vraiment safe en prod ?**
Oui pour des charges single-writer à l’échelle d’un property manager d’un seul hôte. Non pour du multi-région ou du SaaS multi-tenant à écriture lourde. La page [Appropriate Uses](https://www.sqlite.org/whentouse.html) de l’équipe SQLite est la référence canonique ; on rentre dans le motif « base pour l’application ».

**Pourquoi DigitalOcean et pas AWS / GCP / Hetzner ?**
Préférence personnelle. L’UI de DO est la plus simple, la grille petite-droplet est juste, la doc est bonne. Hetzner est moins cher au même palier RAM et tout aussi bon. AWS est exagéré pour des ambitions à 4 $. GCP va bien mais les règles du palier gratuit sont confuses.

**Et un Raspberry Pi à la maison ?**
Marche. Ajoute deux modes d’échec : FAI résidentiel (IP dynamiques, port 443 bloqué) et coupures de courant. Si vous pouvez papier-mâcher les deux, le Pi est moins cher que toute option cloud. Je ne ferais pas tourner un service dont mon revenu dépend comme ça, mais en setup hobby c’est bien.

**Comment surveiller l’uptime ?**
Un moniteur uptime gratuit (BetterStack, UptimeRobot, palier gratuit Pingdom) ping un endpoint `/api/health` chaque minute et alerte en cas d’échec. L’endpoint doit être pas cher (pas de requête DB) pour que le moniteur ne charge pas la machine.

**Et les sauvegardes ?**
Un `cp` nocturne du fichier SQLite dans un dossier de sauvegarde, plus offsite (stockage S3-compatible comme Backblaze B2 à 6 $/To) une fois par semaine. Testez la restauration trimestriellement — les sauvegardes que vous n’avez pas restaurées ne sont pas de vraies sauvegardes.

**Mon droplet tient-il 1 000 biens ?**
Probablement, mais pas sur le palier le moins cher. Passez à 2 Go RAM et 2 vCPU (~12 $/mois) et la machine a de la place. Au-delà, le goulot, c’est généralement le cycle de polling iCal, pas le droplet.

## Une opinion tranchée

Ce que l’approche petit-droplet vous achète vraiment, c’est **l’absence de fournisseur**. Pas l’économie (un service hébergé fait 25 à 200 $/mois pour des fonctions similaires ; l’économie est réelle mais secondaire). L’absence.

Quand mon registrar change son UI, quand DigitalOcean a un blip réseau de 30 minutes dans ma région, quand Cloudflare déprécie un réglage — ce sont des choses que je remarque et que j’ajuste. Aucune ne me coupe parce qu’aucune ne possède mes données ou mon code. Si DO faisait faillite demain, je `scp` le SQLite vers Hetzner sur un week-end et je tournerais lundi.

Comparez à un PMS hébergé. L’éditeur change son tarif, est racheté par un gros qui veut consolider, ferme le palier gratuit, ou a une panne de plusieurs jours. Vous attendez. Les données sont les leurs en pratique même si elles sont les vôtres sur le papier. Le droplet à 4 $, c’est le prix de la sortie de cette relation.

C’est l’opinion. L’économie, c’est le bonus.
