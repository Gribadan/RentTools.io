---
slug: self-hosting-property-manager-droplet
locale: es
title: "Autoalojar tu gestor de propiedades en un droplet de 4 $"
excerpt: Cómo autoalojar un gestor de propiedades de alquiler corto en un droplet barato. Números de RAM reales, límites de build reales, coste mensual real.
status: draft
tags:
  - self-hosting:Auto-alojamiento
  - host-tips:Consejos para anfitriones
  - infrastructure:Infraestructura
ogImageUrl: /blog-covers/self-hosting-property-manager-droplet.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Autoalojar tu gestor de propiedades en un droplet de 4 $

La primera factura cloud que pagué como Anfitrión fue de 73 $. Había clicado por la consola de AWS, elegido los defaults sensatos y acabado con un t3.medium en idle 24/7 más un Postgres gestionado al que nunca le hice consulta. Tras cancelar eso, moví todo a un droplet de DigitalOcean de 4 $/mes con SQLite. Lleva ahí más de un año. Sirve a una base de usuarios pequeña pero real. No se ha incendiado.

Este artículo va de cómo hacerlo, qué se rompe en el extremo barato y el trade-off honesto entre la caja de 4 $ y un servicio gestionado.

## TL;DR

- Un droplet de 512 MB a 1 GB en DigitalOcean corre bien un gestor de propiedades pequeño Next.js + SQLite en runtime. Los builds son otra historia.
- Construye el artefacto en un runner CI (GitHub Actions, GitLab CI), envíalo al droplet por SSH. El droplet nunca compila nada.
- SQLite maneja sin esfuerzo la carga de un solo Anfitrión. Decenas de miles de reservas, lecturas en milisegundos de un dígito, backups por archivo.
- Cloudflare delante del droplet te da TLS gratis, protección DDoS gratis y caché estático gratis. Úsalo.
- Coste mensual total para un Anfitrión de 1 a 50 propiedades: 4–6 $ de droplet, 0 $ Cloudflare, 0 $ tier gratis de GitHub Actions. 4–10 $/mes es el suelo realista.

## El caso a favor (y en contra)

Autoalojar un gestor de propiedades no es para todos. Sé honesto sobre qué lado estás antes de seguir.

Considéralo si:

1. Ya corres una caja Linux para algo más (web personal, home lab, VPN). El esfuerzo marginal es pequeño.
2. Tienes 1 a 50 propiedades y quieres evitar 25–200 $/mes en tarifas PMS.
3. Quieres ser dueño de tus datos —los escaneos de pasaporte de Huéspedes no deberían vivir en una base de datos compartida de una empresa que igual venden en tres años—.
4. Disfrutas arreglando cosas a las 23:00 porque la alegría supera el sueño perdido.

NO autoalojes si:

1. Tienes 100+ propiedades. Las APIs reales (Hostaway, Lodgify) valen el dinero a esa escala; el mundo solo-iCal pierde demasiado.
2. Tienes trabajo de día que no te deja responder a una alerta a las 03:00. Autoalojar significa que eres el equipo on-call de uno.
3. Esperas 99,999 % de uptime. Un único droplet es un único punto de fallo. Un reboot, un blip de red, un disco lleno —tú llevas la recuperación—.
4. Consideras «mirar logs» un castigo. Autoalojar es mayoritariamente mirar logs.

El término medio honesto: prueba primero una instancia gestionada gratis ([RentTools](/onboard) es un ejemplo; hay otros). Si encaja, quédate. Si quieres más control, el droplet de 4 $ es el siguiente paso. Si te quedas pequeño, un PMS gestionado es el siguiente.

## La pregunta del tamaño del droplet

Los droplets más baratos de DigitalOcean están en el rango 4–6 $/mes según región y precio. Una caja de 512 MB a 1 GB con 1 vCPU y 10 a 25 GB de SSD. Su [página de precios](https://www.digitalocean.com/pricing/droplets) es la referencia autoritativa; los números se mueven.

Para una sola app Next.js más SQLite, los [docs de despliegue de Next.js](https://nextjs.org/docs/app/building-your-application/deploying) describen el server `node` estándar. Uso real de recursos en mi caja, observado durante meses:

1. **RAM en runtime**: 250–400 MB residentes para el proceso Node bajo tráfico normal (1–5 requests concurrentes).
2. **CPU en runtime**: bajo el 5 % de un vCPU en media. Picos al 30 % durante ciclos de sincronización iCal cada 10 minutos.
3. **Disco usado por SQLite**: bajo 100 MB para una base de 50 propiedades, 8.000 reservas, 12.000 Huéspedes. SQLite es densa.
4. **Disco usado por Node + node_modules**: 600 MB a 1 GB. Esta es la parte que quiere el droplet más grande.

El tier de 1 GB lleva todo cómodamente. El de 512 MB lleva runtime pero pegarás OOM en operaciones como migraciones bulk o restaurar backup. Si el presupuesto da, elige 1 GB. Si no, estructura las operaciones para hacer el levantamiento pesado en otro sitio (CI, tu portátil) y manda el resultado a la caja pequeña.

Lo que NO quieres hacer es correr el build en el droplet. Más sobre esto.

## Construir en otro sitio, correr en la caja

El truco más útil del extremo barato.

Los builds de Next.js en cajas pequeñas van mal. El proceso de build genera múltiples workers, mantiene el grafo de dependencias en memoria, corre compilación TypeScript, optimiza bundles, genera páginas pre-renderizadas y produce un directorio `.next/` 10x más grande que el código. En un droplet de 1 GB, esta combinación:

1. Se come toda la RAM disponible en 30–60 segundos.
2. Dispara el OOM killer, que normalmente mata el build pero a veces mata la app que corre.
3. Te deja con un despliegue inconsistente a medio construir y un breve outage.

La solución es construir el artefacto en una máquina más potente y mandar el resultado. Funcionan dos patrones:

1. **Runner de GitHub Actions.** Los runners tienen 16 GB de RAM. El build termina en 2–4 minutos. El runner produce un tarball de `.next/`, lo copia al droplet vía `scp`, y el droplet solo desempaqueta y reinicia el servicio systemd. Coste: 0 $ en tier gratis para repos públicos y la mayoría de privados pequeños.
2. **Tu portátil.** Misma idea, manual. `npm run build` en tu máquina, `rsync` al output, restart. Menos repetible que CI pero bien para operación de una persona que despliega una vez por semana.

El patrón funciona porque los requisitos de runtime (`node server.js` contra un `.next/` pre-construido) son dramáticamente más ligeros que los de build (compilar, bundlear, optimizar). El droplet solo hace la mitad fácil.

Si vas por CI, los [docs de GitHub Actions](https://docs.github.com/en/actions) cubren el YAML; el [tutorial de DigitalOcean sobre apps Node gestionadas con systemd](https://www.digitalocean.com/community/tutorials) es la referencia estándar para el lado del droplet. Cablea `systemd` para gestionar el proceso Node y los reinicios y crashes recuperan automáticamente.

## SQLite es suficiente

La otra sorpresa es lo lejos que te lleva SQLite.

Para un gestor single-tenant o single-host, SQLite maneja workloads que convencionalmente sugerirían Postgres. Cosas que funcionan, contra expectativas:

1. **Lecturas concurrentes**: el modo WAL permite muchos lectores en paralelo. Incluso un panel de 100 propiedades sacando docenas de reservas lee limpio.
2. **Throughput de escritura**: las escrituras de un Anfitrión son uno por segundo en el peor caso. Muy por debajo del techo de SQLite de miles/segundo en disco commodity.
3. **Backups**: una base SQLite es un solo archivo. Backups diarios son `cp data/prod.db data/backups/$(date +%F).db`, rápido incluso a escala de gigabytes porque la caché del SO hace la lectura secuencial.
4. **Migraciones**: las migraciones estándar de Prisma funcionan. La restricción de «sin escritores concurrentes» pega durante cambios de esquema, pero una pausa de 30 segundos es aceptable para herramienta single-host no 100 % time-sensitive.

Escenarios donde SQLite se rompe: multi-región (sin replicación), fan-out de escritura multi-tenant pesado (mejor Postgres o setup write-sharded) y full-text search en millones de filas (manejable con FTS5 pero Postgres es más idiomático). Ninguno aplica a un gestor pequeño.

La ruta de migración va bien si te quedas pequeño. El patrón de adaptador de base de datos de Prisma (usamos `@prisma/adapter-libsql`) significa que cambiar SQLite por Turso, libSQL replicado o Postgres completo es mayoritariamente cambio de variable de entorno. Construye para SQLite primero, cambia luego si hace falta.

Para un análisis más profundo de por qué elegimos SQLite, mira el writeup en nuestro [post de automatización del calendario de limpieza](/blog/cleaning-schedule-automation), que vive en la misma base y enseña qué forma tienen los datos.

## Cloudflare, TLS y la infra aburrida

Delante del droplet corro Cloudflare. Tier gratis. Modo TLS Full (strict). Los beneficios son grandes para el coste (cero):

1. **Certificado TLS gratis.** Se aprovisiona automáticamente. Sin cron Let's Encrypt, sin certbot.
2. **Escudo DDoS.** Es improbable que un Anfitrión pequeño sea DDoSeado deliberadamente, pero un bot mal portado ha pegado a mi CPU una o dos veces. Cloudflare lo absorbe.
3. **Caché estático.** Imágenes, fuentes y los paths estáticos `_next/static/` de Next.js cachean en el edge. Eso baja el ancho de banda y carga CPU del droplet lo bastante como para que el tier de 1 GB se sienta más holgado.
4. **DNS en el mismo sitio que el proxy.** Un panel para todo.

El setup completo: registrador apunta NS a Cloudflare, Cloudflare proxea apex y www al IP del droplet, el droplet corre nginx terminando el tráfico de Cloudflare con TLS estricto, nginx reenvía al proceso Next.js local. Toda la cadena DNS-a-app tarda quizá una hora si lo has hecho antes, dos o tres la primera vez.

El paso poco sexy es `systemd`. Cablea tu app Next.js como unidad systemd (`rent-tool.service` en nuestro caso) y dejas de preocuparte por start-on-boot, restart-on-crash, rotación de logs y límites de recursos. systemd es el sistema operativo diciéndote que está bien dejar la caja en paz.

*Figura 1: el pipeline de despliegue. Push a master → GitHub Actions construye → scp tarball al droplet → reload systemd. Captura pendiente; vivirá en /blog/self-hosting-property-manager-droplet/figure-1.png.*

## Qué se rompe en el extremo barato

Cosas que se han roto en mi caja de 6 $, en orden de frecuencia:

1. **Disco lleno.** Los logs se acumulan. Los backups viejos se acumulan. Un `npm install` que falla a mitad deja basura en `~/.npm`. Configura `logrotate`, configura una política de retención de backups (últimos 14 diarios + últimos 12 mensuales) y corre `du -sh /var/log /home/app/.npm /tmp` una vez al mes. Dos veces al año he pegado ENOSPC y solo lo noté porque falló el deploy.
2. **Presión de memoria durante una operación manual.** Un dump SQL puntual, un schema push de Prisma, un script que carga todas las reservas en memoria. El patrón CI-build arregla el caso rutinario; los manuales requieren disciplina (stream don't load, pipe don't accumulate). Añade `--max-old-space-size=512` a invocaciones puntuales `tsx` como red de seguridad.
3. **Drift de configuración de dominio.** Cloudflare cambia un default, o el TTL DNS cachea más de lo esperado. Una ventana de arreglo de 24 horas es normal. Pon TTLs a 60 segundos durante cambios activos; vuelve al default después.
4. **Una versión menor de Next.js que rompió una dependencia.** Dos veces en 18 meses. Arreglo rápido (rollback del paquete, push del fix); la lección es tener el CI corriendo el build antes de que aterrice el deploy, para que la versión rota nunca llegue al droplet.

Lo que NO se ha roto: corrupción de SQLite, problemas systemd, el droplet rebooteándose inesperadamente. Los droplets pequeños de DO son sorprendentemente estables. La infra aburrida sigue aburrida.

## FAQ

**¿SQLite es seguro para producción?**
Sí para workloads single-writer a la escala del gestor de propiedades de un Anfitrión. No para multi-región o multi-tenant SaaS pesado en escritura. La página [Appropriate Uses](https://www.sqlite.org/whentouse.html) del equipo SQLite es la referencia canónica; encajamos en el patrón «base de datos para la aplicación».

**¿Por qué DigitalOcean y no AWS / GCP / Hetzner?**
Preferencia personal. La UI de DO es la más simple, el precio del droplet pequeño es justo y la documentación es buena. Hetzner es más barato al mismo tier y igual de bueno. AWS es exceso para ambiciones de tier 4 $. GCP va bien pero las reglas del tier gratis confunden.

**¿Y una Raspberry Pi en casa?**
Funciona. Añade dos modos de fallo nuevos: ISP residencial (IPs dinámicas, puerto 443 bloqueado por ISP) y cortes de luz domésticos. Si puedes papar ambos, la Pi es más barata que cualquier opción cloud. No correría un servicio del que dependen mis ingresos así, pero como hobby va bien.

**¿Cómo monitorizo uptime?**
Un monitor gratis (BetterStack, UptimeRobot, tier gratis Pingdom) golpea un endpoint `/api/health` cada minuto y alerta al fallo. El endpoint debería ser barato (sin query a BD) para que el monitor no cargue la caja.

**¿Y los backups?**
Un `cp` nocturno del archivo SQLite a directorio de backups, más offsite (almacenamiento S3-compatible como Backblaze B2 a 6 $/TB) una vez por semana. Testa el restore trimestralmente —backups que no has restaurado no son backups reales—.

**¿Mi droplet llevará 1.000 propiedades?**
Probablemente, pero no en el tier más barato. Sube a 2 GB de RAM y 2 vCPUs (~12 $/mes) y la caja tiene espacio. Pasado eso, el cuello de botella suele ser el ciclo de sondeo iCal, no el droplet.

## Una opinión sin filtros

Lo que el enfoque del droplet pequeño te compra de verdad es **la ausencia de un proveedor**. No el ahorro (un servicio gestionado son 25–200 $/mes para funciones similares; el ahorro es real pero secundario). La ausencia.

Cuando mi registrador cambia su UI, cuando DigitalOcean tiene un blip de red de 30 minutos en mi región, cuando Cloudflare deprecata un ajuste —son cosas que noto y ajusto—. Ninguno me apaga porque ninguno posee mis datos ni mi código. Si DO quebrara mañana, haría `scp` del archivo SQLite a Hetzner durante un finde y el lunes estaría corriendo de nuevo.

Compáralo con un PMS gestionado. El proveedor cambia su precio, lo adquieren, sunsetan el tier gratis o tienen un outage de varios días. Esperas. Los datos son suyos en la práctica aunque sean tuyos en papel. El droplet de 4 $ es el precio de salir de esa relación.

Esa es la opinión. El ahorro es el bonus.
