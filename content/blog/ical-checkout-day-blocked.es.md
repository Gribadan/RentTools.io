---
slug: ical-checkout-day-blocked
locale: es
title: "¿iCal bloquea el día de salida? El desfase de un día que devora sus noches"
excerpt: Su calendario sincroniza bien, pero el día de salida figura como reservado en la otra plataforma. Por qué el DTEND exclusivo de iCal y los husos horarios bloquean en silencio una noche vendible.
status: published
tags:
  - calendar-sync:Sincronización de calendarios
  - ical:iCal
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/ical-checkout-day-blocked.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Un huésped salió de mi piso de Taskent un sábado a las 11 de la mañana. A la una estaba limpio y listo para entrar. Alguien intentó reservar justo ese sábado en Booking.com — y le salió «no disponible». Perdí la noche y no entendía por qué: los calendarios sincronizaban perfectamente. Las fechas solo estaban desplazadas exactamente un día.

Nadie le avisa de este fallo. El feed iCal está fresco, las marcas de tiempo al día, cada descarga funciona — y la plataforma bloquea igualmente el día equivocado. Aquí tiene por qué pasa, cómo comprobarlo en su cuenta en dos minutos y el arreglo exacto de cada causa.

## TL;DR

- Un calendario puede sincronizar perfectamente y aun así bloquear la noche equivocada — el fallo no es la caducidad.
- El `DTEND` de iCal es **exclusivo**: el día de salida debe seguir reservable, no bloqueado.
- Dos causas: un feed que bloquea la salida *de forma inclusiva*, o un **desfase de huso horario**.
- Los eventos `VALUE=DATE` son seguros; un `DATE-TIME` que acaba en `Z` es el riesgo.
- Abra el `.ics` y lea `DTSTART` / `DTEND`: ocho cifras, sin `T`, significa día completo.
- Cada día de salida bloqueado por error es una noche vendible que nunca llega a ver.

## El fallo que se esconde tras una sincronización que funciona

La mayoría de los problemas de calendario giran en torno a un feed que caduca: una URL reseteada, un feed que la plataforma desconectó en silencio tras fallos repetidos, un import que dice «Última sincronización: nunca». Si ese es su síntoma, le toca el artículo hermano, sobre [por qué un calendario de Airbnb deja de sincronizar](/blog/airbnb-calendar-not-syncing): siete causas, y todas sobre un feed que no se actualiza.

Aquí es al revés. El feed se actualiza con normalidad. La marca «Último import» es de hace veinte minutos. Cualquier reserva en Airbnb aparece en Booking.com dentro de la ventana de sondeo. Y aun así una noche concreta — casi siempre un día de salida, a veces la noche antes de una entrada — figura como no disponible cuando el piso está demostradamente vacío.

No recibe ningún error. Recibe un calendario que se equivoca, con aplomo y en silencio, exactamente un día. Solo se nota cuando un huésped le escribe «lo tiene ocupado» en una fecha que usted sabe libre — o cuando se pone a investigar por qué un sábado muy solicitado nunca se vendió.

## Por qué el día de salida debe estar libre

iCal no es un formato difuso, es un estándar — [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545) — y describe con precisión cómo funciona un rango de fechas. Para un evento de día completo, la reserva es el intervalo semiabierto `[DTSTART, DTEND)`. `DTSTART` se incluye. `DTEND` **no**. Es la mañana *después* de la última noche.

Tomemos una estancia de tres noches: entrada el 10 de julio, salida el 13. El huésped duerme del 10 al 12 — tres noches. El bloque iCal correcto se ve así:

```
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260710
DTEND;VALUE=DATE:20260713
SUMMARY:Reserved
END:VEVENT
```

Fíjese en `DTEND:20260713`, no `20260712`. El 13 es el día de salida y, según la regla exclusiva, está **libre**: un huésped nuevo puede entrar esa misma tarde. No es un resquicio, es como deben funcionar las reservas consecutivas. Las plataformas lo modelan bien: Airbnb y Booking.com tratan el día de salida como reservable para una entrada el mismo día — justo lo que le permite una rotación ajustada en un fin de semana de mucha demanda.

Así que, cuando el día de salida figura bloqueado, algo entre la plataforma de origen y la de destino ha dejado de respetar el `DTEND` exclusivo. Eso ocurre por dos vías.

## Causa 1: un feed que bloquea el día de salida

El primer fallo es un `DTEND` inclusivo. En algún punto de la cadena, una noche que debería estar libre se cuenta como ocupada.

Aparece de dos formas. O bien falla el **generador del feed** — un cron casero o un channel manager anticuado escribe `DTEND:20260714` (un día de más) o emite un bloque aparte para el día de salida —, o bien el **importador** trata `DTEND` como inclusivo y bloquea hasta el 13 incluido aunque el feed diga `20260713`.

En la práctica el culpable habitual es el generador, porque las grandes plataformas aplican bien la regla exclusiva. Si sincroniza Airbnb directamente con Booking.com sin capa intermedia, rara vez se topa con esto. Se topa cuando hay una tercera herramienta en la cadena — su script, un PMS pequeño, una exportación de hoja de cálculo a iCal — que se equivoca por uno. El clásico: alguien razona «la estancia va del 10 al 13» y escribe `DTEND:20260713` en sentido **inclusivo**, mientras que iCal lee ese mismo valor como **exclusivo** y libera el 13. Que sobre o falte bloqueo depende por completo del modelo mental del autor — y el formato no le avisa en ningún sentido.

El resultado es dinero real: cada día de salida bloqueado por error es una rotación el mismo día que no puede vender. En un alojamiento que encadena estancias en temporada alta, eso es una noche por semana — perdida, sin un solo mensaje de error.

## Causa 2: los husos horarios desplazan la noche

El segundo fallo es más sutil y, para anfitriones transfronterizos, mucho más frecuente. Viene de feeds que exportan las fechas como `DATE-TIME` en lugar de como `DATE` de día completo.

Un evento de día completo no tiene huso: `20260713` es el 13 en cualquier punto del planeta. Pero algunos feeds exportan la reserva con hora y huso — o, peor, normalizada a UTC:

```
DTSTART:20260713T000000Z
DTEND:20260716T000000Z
```

La `Z` significa UTC. Ahora la plataforma importadora tiene que convertir eso a *su* hora local antes de decidir en qué día natural cae el bloque. Un bloque que empieza en `20260713T000000Z` — medianoche UTC — se convierte, desde un huso cinco horas por detrás de UTC, en las 19:00 del **12** de julio. Recorte a la fecha y acaba de bloquear el 12, una noche que debería estar libre. El bloque se ha deslizado un día hacia atrás. Ahora figura como no disponible la noche *anterior* a la entrada de su huésped.

Ponga el alojamiento al este de UTC y se desliza al otro lado. Una salida que debía liberar una mañana deja en cambio la noche bloqueada, porque la hora convertida redondea al día siguiente. Misma causa, síntoma inverso.

Encima se suma el horario de verano con su desfase de una hora. Una reserva que en invierno encajaba perfecta en la frontera puede irse un día en las semanas en que el origen y el destino van con distinto calendario de cambio de hora: Europa y EE. UU. cambian la hora en fechas distintas, así que cada primavera y cada otoño hay una ventana de dos a tres semanas en la que un evento `DATE-TIME` cercano a medianoche salta. Si su desfase de un día solo aparece parte del año — por eso es.

La pista está en el propio feed: un valor `DATE-TIME` (lleva una `T`, a menudo una `Z` al final o un prefijo `TZID=`) depende del huso y es el sospechoso número uno. Un simple `VALUE=DATE` de ocho cifras y sin `T` es inmune.

## Cómo comprobarlo en su cuenta

No hace falta adivinar. Dos minutos con el feed en crudo lo zanjan.

1. Consiga la URL de **exportación** iCal de la plataforma de origen — la que copia desde Airbnb (Calendar → Sync calendars → Export) o Booking.com (Calendar & Pricing → Sync calendars → Export).
2. Péguela directamente en un navegador. Obtendrá un archivo `.ics` o un muro de texto que empieza por `BEGIN:VCALENDAR`. Si en su lugar le sale una página de error HTML, su problema es la caducidad, no las fechas — vuelva a la [lista de comprobación del feed atascado](/blog/airbnb-calendar-not-syncing).
3. Busque el `VEVENT` de una reserva cuyas fechas reales conozca de memoria. Lea su `DTSTART` y su `DTEND`.

Ahora interprete lo que ve:

| Cómo se ve la línea del feed | Qué significa | Riesgo de desfase |
| --- | --- | --- |
| `DTSTART;VALUE=DATE:20260710` | Día completo, sin huso | Ninguno — la forma segura |
| `DTEND;VALUE=DATE:20260713` | Día de salida, exclusivo (correcto) | Ninguno |
| `DTEND;VALUE=DATE:20260712` | Última noche, no el día de salida | Fallo inclusivo — bloquea la rotación |
| `DTSTART:20260710T140000Z` | Una hora en UTC | Alto — se convierte según el huso |
| `DTSTART;TZID=...:20260710T140000` | Una hora en un huso con nombre | Medio — depende del importador |

Después contraste con el destino: abra el día en cuestión en el calendario de la otra plataforma. Si el feed dice que el día de salida está libre (`DTEND` es la fecha de salida, día completo) pero el destino lo muestra bloqueado, el culpable es el importador. Si el día equivocado ya viene grabado en el propio feed, lo es el origen o una herramienta intermedia.

## Cómo arreglar cada causa

El arreglo depende de qué eslabón de la cadena está mal y, sobre todo, de si usted lo controla.

**Si controla el generador del feed** (su propio script, un exportador autoalojado): emita eventos de día completo con `VALUE=DATE` y fije `DTEND` en el **día de salida**, no en la última noche. No emita nunca una hora para un bloque de día completo. Este único cambio elimina ambas causas en el origen: ningún huso que convertir, ningún error de bordes.

**Si el origen emite `DATE-TIME` y no puede cambiarlo:** ponga una capa normalizadora entre las plataformas. Absorbe el feed sucio, reescribe cada reserva como evento de día completo (`VALUE=DATE`) en el huso del propio alojamiento y republica a las demás plataformas un feed limpio para importar. Es exactamente lo que hace una herramienta consciente de iCal como [RentTools](/onboard) en cada descarga: fija cada bloque al día natural local del alojamiento antes de que nadie, aguas abajo, pueda leerlo mal. Se acabó la ruleta de husos a través de fronteras.

**Si el importador trata `DTEND` como inclusivo** y no puede tocar el código de la plataforma (no puede), tiene dos opciones: añadir un día buffer de limpieza para que el día de salida quede bloqueado a propósito — vea [los días buffer](/blog/cleaning-buffer-days) — o pasar por una capa intermedia que lo compense. El buffer tapa el síntoma en vez de curarlo — bien está, hasta el día en que quiera vender esa rotación.

Tras cualquier arreglo, compruebe igual que diagnosticó: descargue el feed, confirme que `DTEND` es la fecha de salida en día completo y mire que el calendario de destino muestra el día de salida como reservable. No dé por hecho que funcionó — mire la celda.

## Lo que el desfase de un día cuesta de verdad

Por qué merece una sesión de diagnóstico: este fallo es invisible y recurrente. No le cuesta una noche una vez; le cuesta una noche por cada reserva afectada, cada vez, hasta que lo encuentra.

Aquí tiene un alojamiento de rotación ajustada a 120 $ de tarifa base, en el que el fallo bloquea dos rotaciones al mes:

| Escenario | Noches perdidas / mes | Pérdida / mes | Pérdida / año |
| --- | --- | --- | --- |
| 2 días de salida bloqueados, base 120 $ | 2 | 240 $ | 2.880 $ |
| Temporada alta, 1 noche bloqueada / semana | 4 | 480 $ | (según temporada) |
| Desfase a la noche antes de la entrada, 1 / mes | 1 | 120 $ | 1.440 $ |

No son reembolsos que vea en un informe — son reservas que nunca ocurrieron: demanda que chocó contra un muro de «no disponible» y se fue al alojamiento de al lado. El cálculo es blando porque depende de con qué frecuencia sus huecos son rotación el mismo día, pero la dirección está clara: una fuga recurrente de una noche, en un alojamiento con demanda real de rotación, es una cifra anual de cuatro dígitos — y no aparece en ningún sitio como un problema que pueda señalar con el dedo.

Además se suma con lo que tiene justo al lado. Un día de salida bloqueado por error es una rotación invendible; un día de salida *liberado* por error es como se cosecha una [reserva doble](/blog/avoiding-double-bookings). La misma regla del `DTEND` exclusivo, los dos sentidos del fallo — y la única forma de saber en cuál está es leer el feed.

## FAQ

**¿Por qué el día en que mi huésped se va figura como no disponible para una reserva nueva?**
Porque algo en su cadena de sincronización trata el día de salida como ocupado. Según las reglas de iCal, el día de salida es el `DTEND` exclusivo — la mañana después de la última noche, reservable para una entrada el mismo día. Si figura bloqueado, o un generador de feed escribió el rango de forma inclusiva o una conversión de huso desplazó el bloque un día.

**¿Qué significa que `DTEND` sea exclusivo?**
Significa que la fecha de fin no forma parte de la reserva. Una estancia con `DTSTART:20260710` y `DTEND:20260713` cubre las noches del 10, el 11 y el 12 — tres noches — y deja el 13 libre. Mucha gente lee `20260713` como «bloqueado hasta el 13 incluido», pero el formato dice lo contrario. Justo ese desajuste es la fuente más frecuente de fallos de desfase de un día en el calendario.

**Mi calendario sincroniza a tiempo pero bloquea las fechas equivocadas. ¿Es lo mismo que un feed caducado?**
No, y para el arreglo la distinción importa. Un feed caducado es un problema de frescura — el import dejó de actualizarse, y se arregla reparando la URL o volviendo a añadir el import. Un feed con fechas equivocadas se actualiza con normalidad; lo erróneo son las fechas de dentro. Mire primero la marca «Último import»: marca reciente más fechas equivocadas es un desfase de un día, no caducidad.

**¿Cómo sé si mi feed iCal usa fechas o fecha-horas?**
Pegue la URL de exportación en un navegador y mire un `VEVENT`. Si ve `DTSTART;VALUE=DATE:20260710` — ocho cifras, sin `T` —, es un evento de día completo, inmune a los husos. Si tras la fecha hay una `T` con una hora, y más aún una `Z` al final, es un `DATE-TIME`, y en algún punto aguas abajo se hace una conversión de huso.

**¿De verdad el horario de verano puede desplazar una reserva un día?**
Solo en feeds que usan `DATE-TIME` cerca de una frontera de medianoche, y solo en las semanas en que la región de origen y la de destino van con distinto calendario de cambio de hora. Europa y Norteamérica cambian la hora en fechas distintas, así que cada primavera y cada otoño hay una ventana corta en la que un evento cercano a medianoche cae en el día natural equivocado. Los eventos `VALUE=DATE` de día completo no se ven afectados nunca.

**¿Lo arregla un channel manager o una capa intermedia?**
Puede — si la capa normaliza los feeds a eventos de día completo en fecha local antes de republicarlos. Eso elimina la ambigüedad de huso para todo lo que va aguas abajo. No ayuda si la propia capa emite `DATE-TIME` o se equivoca por uno: el arreglo es un tratamiento correcto de fechas, no la mera presencia de una herramienta. Lea el feed republicado y confirme que emite `VALUE=DATE`.

**Un día buffer de limpieza, ¿es una solución o un parche?**
Un parche, pero útil. Un buffer de un día bloquea el día de salida a propósito, así que un desfase que también lo bloquea se vuelve invisible — esa noche no la vendía de todos modos. El problema vuelve en el momento en que quita el buffer para vender una rotación muy solicitada, así que trate el buffer como tapadera, no como cura, y arregle igualmente el tratamiento de fechas.

**¿Por qué a veces se bloquea la noche antes de la entrada en vez del día de salida?**
La dirección depende de hacia dónde empuja la fecha el desfase de huso. Un bloque normalizado a UTC se desliza hacia delante desde un huso por detrás de UTC y puede bloquear la noche antes de la entrada; desde un huso por delante de UTC se desliza hacia atrás y deja bloqueada una noche de salida. Misma causa, síntoma inverso — ambas se resuelven fijando el bloque a la fecha local del alojamiento.

## Una opinión con filo

Si gestiona más de una plataforma y no ha abierto nunca su feed `.ics` en crudo en un navegador, hágalo esta semana. No porque esté roto (quizá no lo esté), sino porque es el único fallo de calendario que le cuesta dinero con señal cero. Un feed caducado acaba avisando: un huésped se queja, una fecha no se actualiza, una marca de tiempo se enfría. Un desfase de un día simplemente convierte en silencio sus mejores noches de rotación en «no disponible» y manda la reserva a otro. Los quince segundos que cuesta confirmar que su feed emite `VALUE=DATE` y un `DTEND` de salida exclusivo son la auditoría de ingresos más barata que hará jamás.
