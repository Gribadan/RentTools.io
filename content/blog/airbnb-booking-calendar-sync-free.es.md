---
slug: airbnb-booking-calendar-sync-free
locale: es
title: Cómo sincronizar gratis los calendarios de Airbnb y Booking.com en 2026
excerpt: Sincroniza gratis los calendarios de Airbnb y Booking.com con iCal. Guía paso a paso, intervalos de refresco reales y cuándo merece la pena pagar un Channel Manager.
status: draft
tags:
  - airbnb:Airbnb
  - booking-com:Booking.com
  - calendar-sync:Sincronización de calendarios
  - ical:iCal
ogImageUrl: /blog-covers/airbnb-booking-calendar-sync-free.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Cómo sincronizar gratis los calendarios de Airbnb y Booking.com en 2026

El junio pasado casi duplico una reserva con un Huésped de Stuttgart. Airbnb bloqueó las fechas en cuanto pagó; Booking.com seguía mostrándolas como disponibles cuatro horas después. Para cuando el feed iCal se puso al día, una Huésped de Tashkent ya había solicitado las mismas fechas. Reembolsé una reserva, mantuve la otra y dediqué la tarde a leer cada artículo del centro de ayuda sobre cómo sincronizar Airbnb y Booking.com sin pagar 200 $ al mes por ello.

Esta guía es el resultado. Herramientas gratis, intervalos de refresco reales y una respuesta honesta sobre qué funciona y qué no.

## TL;DR

- Tanto Airbnb como Booking.com exponen **URLs de exportación iCal privadas** gratis. Sin contrato de partner.
- iCal es unidireccional por URL. Dos anuncios significa **dos URLs en cada dirección**: la de A en B y la de B en A.
- Airbnb refresca los calendarios importados cada **2 a 4 horas**. Booking.com cada **2 a 6 horas**. Ese hueco es de donde salen las raras reservas duplicadas.
- Una capa intermedia gratuita (la versión open-source de [RentTools](/onboard) o un cron casero) refresca más rápido, pero no acelera el sondeo de la plataforma de destino.
- Para 1 a 3 anuncios, iCal cubre el 99 % de los casos. Para 20+ anuncios o 90 %+ de ocupación, mira un Channel Manager de pago.

## El problema real

Dos sitios de anuncios. Un piso físico. En cuanto alguien reserva en Airbnb, los demás sitios tienen que enterarse en minutos, no en horas.

Si solo anuncias en Airbnb, no necesitas nada de esto. El calendario de Airbnb es su propia fuente de verdad.

El lío empieza con el segundo anuncio. Tienes dos calendarios fuente que tienen que coincidir. La pega: ninguna plataforma le da a la otra una API privada. Solo te dan una URL iCal pública que el otro lado consulta a su propio ritmo.

Esto es lo que la mayoría de las guías gratuitas se saltan. La sincronización iCal **no** es en tiempo real. Es «lo bastante rápido casi siempre», y los momentos en que no lo es son justo los que duelen: dos Huéspedes reservando las mismas fechas dentro de la ventana de sondeo.

Hay tres cosas que hacer. Sacar la URL iCal de Airbnb, sacar otra de Booking.com y decidir qué apunta a qué. No hay una cuarta.

## Paso 1: conseguir la URL iCal de Airbnb

Abre tu panel de Anfitrión en Airbnb. La ruta:

1. Pulsa **Calendario** arriba.
2. Elige el anuncio que quieras sincronizar.
3. Pulsa **Disponibilidad** en la barra lateral derecha y luego **Sincronizar calendarios**.
4. Pulsa **Exportar calendario**.
5. Copia la URL larga. Tiene esta pinta: `https://www.airbnb.com/calendar/ical/12345678.ics?s=AAA...`.

*Figura 1: panel «Sincronizar calendarios» de Airbnb. Captura pendiente; vivirá en /blog/airbnb-booking-calendar-sync-free/figure-1.png.*

Dos cosas antes de seguir. Primera, esa URL es privada. Quien la tenga puede leer todas tus fechas reservadas en Airbnb. Trátala como una contraseña. Segunda, la URL de Airbnb se mantiene estable salvo que pulses **Restablecer URL**, que es lo que haces si alguna vez se filtra.

Si te saltaste **Sincronizar calendarios** la primera vez, Airbnb aún no habrá generado URL. Pulsa **Sincronizar calendarios** al menos una vez para activar la función. Lee el [artículo oficial de ayuda de Airbnb](https://www.airbnb.com/help/article/99) para la versión canónica de los pasos.

## Paso 2: conseguir la URL iCal de Booking.com

La ruta de Booking está dos clics más profunda y es donde la mayoría se rinde antes de tener las dos:

1. Entra en tu extranet de Booking.com.
2. Elige la propiedad.
3. Pulsa **Tarifas y disponibilidad** en la barra lateral.
4. Pulsa **Sincronizar calendarios**. (Si no lo ves, tu tipo de propiedad puede no tener iCal expuesto. Los Alojamientos vacacionales lo tienen; los hoteles tradicionales casi nunca.)
5. En **Exportar tu calendario**, pulsa **Exportar**.
6. Copia la URL. Formato aproximado: `https://admin.booking.com/hotel/hoteladmin/ical.html?t=AAA...`.

*Figura 2: exportación de calendario en la extranet de Booking.com. Captura pendiente; vivirá en /blog/airbnb-booking-calendar-sync-free/figure-2.png.*

Una trampa: Booking.com oculta el panel iCal en cuentas con ciertos contratos de partner. Si tienes un acuerdo de API de Channel Manager (que la mayoría de Anfitriones pequeños no), iCal se desactiva por diseño. Si iCal no aparece en absoluto y no has firmado ningún acuerdo, contacta con soporte de partners. Lo reactivan.

La propia [guía de Partner Hub de Booking](https://partner.booking.com/es-es/ayuda/calendario-y-precios/establecer-disponibilidad/sincronizar-calendarios-airbnb-booking) tiene capturas que coinciden con la UI actual de 2026.

## Paso 3: cablear los calendarios de Airbnb y Booking.com

Tres opciones. Ninguna es errónea; la correcta depende de cuántos anuncios tengas.

1. **Importación cruzada directa.** Pega la URL de Airbnb en el campo de importación de Booking, y la de Booking en el de Airbnb. Hecho. Cada lado consulta al otro a su ritmo. Gratis. Sin tercera herramienta. Funciona para dos plataformas. Deja de escalar en cuanto añades una tercera (Vrbo, Expedia, revendedores Hostaway): tendrías que añadir cada URL en cada plataforma, y la mayoría limita los espacios de importación a cinco.
2. **Una capa intermedia gratuita.** Una herramienta open-source pequeña se sienta entre las plataformas. Tanto Airbnb como Booking importan de ella; ella importa de las dos. La sincronización pasa a ser una URL por plataforma, y añadir una tercera plataforma solo cuesta dos URLs nuevas, no cuatro. El refresco en la capa intermedia puede ser mucho más rápido que el de las plataformas: la instancia de [RentTools](/onboard) sondea cada 10 minutos. Sigue siendo gratis; lo puedes correr en un droplet de 4 $ si lo autoalojas o usar la versión gestionada.
3. **Un Channel Manager de pago.** Hostaway, Lodgify, Smoobu. APIs reales (cuando la cuenta del Anfitrión califica) en vez de iCal, lo que significa sincronización casi en tiempo real en ambos sentidos. Empiezan en 25–50 $ por propiedad y mes y asumen un contrato más largo. Compensan a partir de 20 anuncios o por encima del 90 % de ocupación. Por debajo es casi siempre paño caliente.

Yo uso la opción 2 para mis dos pisos en Tashkent. La cuenta: con dos anuncios, la capa intermedia me deja añadir una nueva plataforma con **dos** URLs en total, no las cuatro que la opción 1 forzaría. Cinco minutos de configuración; se amortizan la próxima vez que anuncie en Vrbo.

## El truco del intervalo de refresco que nadie cuenta claro

Aquí va lo que ningún artículo de centro de ayuda te dice de frente.

Cuando Airbnb dice «los calendarios se sincronizan automáticamente», quiere decir que Airbnb tira de los iCal importados cada 2–4 horas. Booking tira cada 2–6 horas. Vrbo puede ser más lento.

Imagina que cableaste la opción 1. Esto pasa cuando un Huésped reserva tu piso en Airbnb a las 14:00:

1. Airbnb bloquea las fechas inmediatamente en su lado.
2. Booking.com tira del feed iCal de Airbnb entre las 16:00 y las 20:00.
3. Durante hasta seis horas, tu anuncio de Booking sigue diciendo «disponible».
4. Si un segundo Huésped encuentra tu anuncio de Booking en esa ventana y reserva las mismas fechas, tienes una doble reserva.

Es raro. Hace falta que coincidan compradores en ambas plataformas dentro del hueco, lo que para un Anfitrión pequeño con poco volumen casi nunca pasa. Pero pasa, y cuando pasa te cuesta un reembolso, una reseña posiblemente negativa y 90 minutos de correo a dos desconocidos explicando por qué.

La opción de capa intermedia (la 2) ayuda a la mitad. Nuestra instancia gestionada tira de los feeds origen cada 10 minutos, así que RentTools se entera de la nueva reserva de Airbnb en 10 minutos. Lo que **no** acelera es el sondeo de Booking.com *de RentTools*. Booking sigue tardando sus 2–6 horas.

Lo único que arregla el lado destino es la conectividad por API, lo que implica la opción 3.

Esa es la razón real por la que existen los Channel Managers. No las funciones. No los paneles bonitos. Las actualizaciones en tiempo real en la otra dirección. Para entender por qué iCal nunca puede ir más rápido que su ciclo de sondeo, el protocolo está descrito en [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545); no hay extensión «push» que las grandes plataformas implementen.

## FAQ

**¿La URL iCal de Airbnb cambia si la roto?**
Sí. Pulsa **Restablecer URL** en el panel de sincronización de Airbnb y la antigua deja de funcionar al instante. Úsalo en cuanto sospeches una filtración: un Slack público, una captura, una respuesta en un foro. RentTools rota la URL saliente bajo demanda por la misma razón.

**¿Cómo sé si la sincronización iCal está funcionando?**
Cruza la marca de última actualización del calendario importado en ambas plataformas. Airbnb lo enseña en **Sincronizar calendarios → Calendarios importados → Última importación**. Booking enseña el equivalente en cada feed importado. Si una marca pasa de las 12 horas, algo va mal en el origen: URL cambiada, plataforma origen limitando o URL rotada.

**¿Puedo hacerlo sin una tercera herramienta?**
Sí. La opción 1, importación cruzada directa, va bien para dos plataformas. En cuanto añades una tercera te arrepentirás.

**¿iCal es de verdad gratis?**
Sí. Tanto Airbnb como Booking.com lo exponen como autoservicio en cualquier cuenta de Anfitrión. Si una herramienta te cobra una mensualidad solo por sincronización iCal, estás pagando la capa de comodidad, no el protocolo.

**¿Cuánto cuesta RentTools?**
La instancia gestionada es gratis a día de hoy. El autoalojamiento también es gratis si tienes una caja Linux. Pagamos nuestro propio hosting y los costes de la API de Gemini. Para más sobre los riesgos de doble reserva que la sincronización pretende mitigar, lee [evitar dobles reservas](/blog/avoiding-double-bookings).

**¿Vale la pena si solo anuncio en Airbnb?**
No. Quien anuncia en una sola plataforma no necesita iCal. Guarda este artículo para el día que listes en una segunda.

**¿Qué hago si el espacio de importación de Airbnb dice «Última sincronización: nunca»?**
Tres causas habituales. (1) La URL origen está mal: pégala en un navegador; deberías obtener una descarga `.ics` o un bloque de texto que empieza por `BEGIN:VCALENDAR`. Si te aparece una página HTML de error, la URL es mala. (2) La plataforma origen regeneró su URL y la antigua ya no vale: rótala, actualiza la importación. (3) Airbnb a veces frena los feeds nuevos durante la primera hora. Espera una hora antes de asumir que está roto.

**¿Booking.com usa de verdad el iCal que importo o tiene su propia lógica?**
Booking trata los eventos importados como bloques opacos: las fechas marcadas como ocupadas en tu feed importado se marcan como no disponibles en Booking. No mira nombres, precios ni nada más. Es una virtud, no un fallo: significa que un iCal de Booking filtrado solo expone tus fechas reservadas, nunca datos del Huésped.

## Una opinión sin filtros

Si tienes una o dos propiedades anunciadas en Airbnb más Booking.com, **no pagues todavía un Channel Manager**. Cablea la opción 1 o 2. El riesgo del intervalo de refresco es real pero raro a bajo volumen, y a dos anuncios la mensualidad de pago supera el coste esperado de un reembolso anual por doble reserva.

Si tienes diez o más propiedades cerca del 90 % de ocupación, mira Smoobu antes que Hostaway. El precio de Smoobu es honesto a volúmenes pequeños y expone APIs de Channel Manager que los demás esconden detrás de llamadas de ventas.

Esto no es un argumento de venta de la herramienta que llevo. Es la cuenta.
