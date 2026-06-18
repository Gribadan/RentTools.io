---
slug: airbnb-calendar-not-syncing
locale: es
title: "¿El calendario de Airbnb no se sincroniza? 7 motivos de un feed iCal caducado"
excerpt: "¿El calendario de Airbnb no sincroniza con Booking.com? Los 7 motivos por los que un feed iCal caduca, la única marca de tiempo que delata cada uno y la solución."
status: published
tags:
  - calendar-sync:Sincronización de calendarios
  - ical:iCal
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/airbnb-calendar-not-syncing.webp
ogImageWidth: 1600
ogImageHeight: 900
---

El invierno pasado mi calendario de Booking.com dejó de tirar de mis bloqueos de Airbnb sin hacer ruido. Ningún error: ni correo, ni banner rojo. La importación se congeló un martes, y no lo noté hasta que un huésped de Lyon reservó una semana que yo ya tenía ocupada en Airbnb. El feed no estaba «roto» de ninguna forma que el panel admitiera. Estaba *caducado*, y la caducidad es el único fallo del que iCal nunca avisa.

Esta es la guía que me habría gustado tener aquella noche: el único número que dice si un feed está realmente roto, los siete motivos por los que enmudece y la solución exacta para cada uno.

## TL;DR

- iCal casi nunca lanza un error: el feed **caduca en silencio**. La señal es la marca de tiempo de la última importación, no un banner.
- La causa más común es una **URL de origen reiniciada**: la importación sigue apuntando a una URL que el origen retiró, así que cada petición falla.
- Airbnb tira de los feeds importados cada **2-4 horas**, Booking.com cada **2-6 horas**. «Aún sin sincronizar» tras tres horas es normal, no un fallo.
- Un feed con más de **24 horas** ya es un problema. Pegue la URL de origen en un navegador: quiere ver `BEGIN:VCALENDAR`, no una página de error.
- Las plataformas **descartan un feed** tras varias peticiones fallidas y no avisan. Recrear la importación lo despierta.
- Una capa intermedia que consulta cada **10 minutos** reduce la ventana de riesgo, pero no puede acelerar el propio sondeo de la plataforma de destino.

## Por qué iCal enmudece en vez de romperse

La sincronización iCal es un *tirón*, no un *empuje*. Cuando «conecta» Airbnb con Booking.com, ninguna de las dos plataformas abre una API en vivo a la otra. La plataforma de destino simplemente descarga una URL `.ics` pública a su propio ritmo —cada pocas horas— y sobrescribe sus bloqueos importados con lo que encuentre.

Ese diseño tiene un efecto secundario desagradable. Si la URL de origen deja de responder —URL incorrecta, origen caído un momento, origen que rotó su enlace—, el destino no muestra ningún fallo. Conserva los últimos datos que descargó con éxito y vuelve a intentarlo en el siguiente ciclo. Desde el panel, todo va bien. El calendario sigue mostrando bloqueos, solo que congelados en el tiempo.

Una conexión API real lanzaría un `401` o un `404` que usted vería. iCal no lanza nada. El protocolo ([RFC 5545](https://www.rfc-editor.org/rfc/rfc5545)) no tiene canal de empuje ni una señal estándar de «este feed está muerto» que las grandes plataformas trasladen al anfitrión. Así que el fallo es invisible hasta que un segundo huésped reserva fechas que su otra plataforma cree libres.

## El único diagnóstico que importa: la última importación

Antes de cambiar una sola URL, lea un número: ¿cuándo se importó este feed con éxito por última vez?

- **Airbnb:** Calendar → elija el alojamiento → **Availability** → **Sync calendars** → bajo **Imported calendars**, cada feed indica hace cuánto se importó.
- **Booking.com:** extranet → **Calendar & Pricing** → **Sync calendars** → la sección de importación lista cada feed conectado con su última hora de sincronización.

Ahora léalo así:

| Última importación | Veredicto |
| --- | --- |
| Hace minutos a pocas horas | Sano. Pare aquí. |
| Hace 4-12 horas | Probablemente bien en Booking.com (ciclo de 2-6 h); en el límite en Airbnb (2-4 h). Revise en una hora. |
| Hace más de 24 horas | Roto. Trabaje la lista de abajo. |
| «Nunca» / vacío | No se descargó con éxito ni una vez. URL incorrecta, o el origen estranguló la primera descarga. |

Esa marca de tiempo lo es todo. Nueve de cada diez pánicos de «mi calendario no se sincroniza» son, o bien un feed sano dentro de su ventana normal, o bien un feed muerto desde hace días al que nadie le miró la fecha.

## Los siete motivos por los que un feed caduca, y la solución de cada uno

### 1. La URL de origen se reinició (la causa número uno)

**Síntoma:** el feed funcionaba; la última importación es ahora de hace días o «nunca». **Causa:** alguien pulsó **Reset URL** en la plataforma de origen —usted, un co-anfitrión, o usted mismo tras un susto por un enlace filtrado—. El reinicio mata la URL antigua al instante, y el destino sigue sosteniendo la retirada. Cada petición desde entonces ha fallado en silencio con un 404.

**Solución:** copie la URL de exportación *actual* del origen, borre la importación muerta en el destino y vuelva a añadirla. Luego pruebe la URL (vea la comprobación del motivo 5). Trate la URL de exportación como una contraseña: reiniciarla tras una filtración es lo correcto, pero el mismo día debe actualizarla en todas partes donde se importe.

### 2. Está dentro de la ventana normal de refresco (falsa alarma)

**Síntoma:** bloqueó fechas en Airbnb hace 40 minutos y Booking.com las sigue mostrando libres. **Causa:** nada. Booking.com tira cada 2-6 horas; simplemente aún no ha lanzado su siguiente ciclo.

**Solución:** espere. Si han pasado más de 6 horas en Booking.com o más de 4 en Airbnb, *entonces* trátelo como real y baje por la lista. Es la falsa alarma más común: el anfitrión vigila el destino diez minutos y concluye que la sincronización está rota, cuando solo duerme hasta el siguiente sondeo.

### 3. La plataforma descartó el feed en silencio tras fallos repetidos

**Síntoma:** el feed funcionaba, luego el origen estuvo caído un día (mantenimiento, una URL rotada que ya corrigió) y ahora no se recupera, aunque la URL vuelve a estar viva. **Causa:** tras varias peticiones fallidas seguidas, algunas plataformas dejan de sondear un feed por completo y no lo reactivan solas. El contador de fallos se enganchó.

**Solución:** borre la importación y vuelva a añadir exactamente la misma URL. Eso reinicia el contador y la plataforma empieza de cero. Una URL viva que sigue sin sincronizar tras 24 horas es casi siempre este caso.

### 4. iCal está desactivado en la cuenta de origen

**Síntoma:** no hay ninguna URL de exportación que copiar, o el panel **Sync calendars** desapareció del origen. **Causa:** las cuentas con contrato de channel manager o socio de API tienen iCal apagado por diseño: la plataforma asume la API como fuente de verdad. Algunos tipos de propiedad de Booking.com (hoteles clásicos, frente a alquileres vacacionales) nunca exponen iCal.

**Solución:** si firmó un acuerdo de socio/API, es lo esperado: su sincronización va por la API, no por iCal. Si no firmó nada e iCal simplemente desapareció, contacte con el soporte de socios; para alquileres vacacionales lo reactivan.

### 5. El feed se importa, pero los bloqueos no aparecen

**Síntoma:** la última importación es reciente —de hace minutos—, pero las fechas siguen libres. **Causa:** la importación tuvo éxito, pero los eventos no llevan estado de ocupado, o el importador solo lee eventos `DATE` de día completo y el origen envió eventos con hora. Raro con Airbnb y Booking.com (envían bloqueos de día completo limpios) y común con feeds caseros u oscuros.

**Solución:** abra el `.ics` en un editor de texto y mire un `VEVENT`. Quiere bloqueos de día completo del estilo `DTSTART;VALUE=DATE:20260714` sobre las fechas esperadas. Esta es la prueba rápida de navegador para *cualquier* URL iCal:

1. Pegue la URL de exportación en la barra de direcciones del navegador.
2. Un feed vivo descarga un archivo `.ics` o muestra texto plano que empieza por `BEGIN:VCALENDAR`.
3. Una página de error HTML, una pantalla de inicio de sesión o una respuesta vacía significan que la URL está muerta: vuelva al motivo 1.

### 6. Un desfase de zona horaria corre cada bloqueo un día

**Síntoma:** los bloqueos se importan, pero caen un día desplazados —día de salida bloqueado, día de entrada libre, o al revés—. **Causa:** un feed que envía eventos *con hora* y con un `TZID` que el destino lee en UTC puede pasar un bloqueo de la medianoche. Un inicio a las 23:00 hora local se convierte en el día siguiente en UTC.

**Solución:** prefiera bloqueos de día completo (`VALUE=DATE`) a los que llevan hora. Las grandes plataformas ya lo hacen; si el feed es suyo (autoalojado, exportación a medida), envíe fechas, no fecha-hora. Si está obligado a consumir un feed con hora, el desfase de exactamente un día es la pista: no pierda una hora culpando a la URL.

### 7. Llegó al tope de huecos de importación

**Síntoma:** no puede añadir otro calendario importado, o el más nuevo se ignora en silencio. **Causa:** la mayoría de plataformas limitan los feeds importados a unos cinco por alojamiento. Publique en Airbnb, Booking.com, Vrbo, Expedia y una web directa, y los huecos se agotan rápido cuando cada plataforma debe importar todas las demás.

**Solución:** pliegue la malla en estrella. En vez de que N plataformas importen cada una a otras N−1, ponga a correr un feed intermedio por plataforma: cada plataforma importa el hub, el hub importa cada plataforma. Dos plataformas son cuatro URL directas; el hub las deja en dos. Es también la razón por la que la importación cruzada directa deja de escalar pasadas dos plataformas; más detalles en [evitar reservas duplicadas](/blog/avoiding-double-bookings).

## Cuando el hueco es de la plataforma, no suyo

Aquí va la parte honesta. Incluso con las siete causas descartadas y cada feed sano, el propio sondeo de la plataforma de destino es el suelo. Booking.com tira cada 2-6 horas, y eso no lo cambia usted.

Una capa intermedia resuelve la mitad del problema. Una herramienta de código abierto como [RentTools](/onboard) —o un cron que escriba usted mismo— consulta los feeds de *origen* cada 10 minutos, así que su hub se entera de una nueva reserva de Airbnb en diez minutos en vez de en horas. Lo que no puede hacer es obligar a Booking.com a tirar *del hub* más rápido de lo que Booking.com quiere. Lo único que bate el ciclo de sondeo por completo es la conexión por API en tiempo real, que Airbnb y Booking.com solo venden a PMS certificados por 100-300 $ al mes.

Para uno a tres alojamientos, no pierda el sueño por la ventana de refresco. Las causas de caducidad de arriba —una URL reiniciada que nadie actualizó, un feed que la plataforma descartó en silencio— provocan a pequeña escala muchas más reservas duplicadas que el sondeo de 2-6 horas. Si quiere la configuración completa en vez del diagnóstico, empiece por [sincronizar gratis los calendarios de Airbnb y Booking.com](/blog/airbnb-booking-calendar-sync-free).

## FAQ

**¿Por qué mi calendario de Airbnb dice «Last sync: never»?**
El feed no se ha descargado con éxito ni una sola vez. Tres causas habituales: la URL de importación es incorrecta (péguela en un navegador: debería obtener una descarga `.ics` o texto que empiece por `BEGIN:VCALENDAR`, no una página de error); la plataforma de origen rotó su URL después de que usted copiara una más antigua; o Airbnb estranguló brevemente la primerísima descarga de un feed nuevo. Espere una hora y vuelva a revisar antes de dar por roto.

**¿Cuánto debería tardar Airbnb en sincronizar un calendario importado?**
Airbnb tira de los feeds importados cada 2 a 4 horas. Booking.com es más lento, 2 a 6 horas, y Vrbo puede serlo aún más. Si bloqueó fechas hace unos minutos, la otra plataforma legítimamente todavía no lo sabe. Trátelo como problema solo cuando el feed haya pasado su ventana normal.

**Mi calendario de Booking.com no bloquea fechas que llené en Airbnb. ¿Qué falla?**
Mire primero la marca de tiempo de la última importación en el lado de Booking.com. Si es de hace unas horas y está fresca, la importación funciona y solo está en la ventana de refresco: espere. Si tiene más de 24 horas o dice «nunca», la URL está probablemente muerta: reiniciada en el lado de Airbnb, o descartada por Booking.com tras fallos. Vuelva a copiar la URL de exportación actual de Airbnb y recree la importación.

**¿Reiniciar mi URL iCal rompe mis sincronizaciones existentes?**
Sí, al instante. En el momento en que pulsa Reset URL, el enlace antiguo deja de funcionar, y toda plataforma que aún lo importe caduca en silencio. Reiniciar es la respuesta correcta a una URL filtrada, pero el mismo día debe pegar la nueva URL en todos los sitios donde se importaba la vieja.

**¿Cómo pruebo si una URL iCal está realmente viva?**
Péguela en la barra de direcciones del navegador. Un feed vivo descarga un archivo `.ics` o muestra texto plano que empieza por `BEGIN:VCALENDAR`. Si le sale una página de error HTML, una pantalla de inicio de sesión o nada, la URL está muerta: ese es su problema, no el de la plataforma de destino.

**¿Puede un feed iCal caducado provocar una reserva duplicada?**
Sí; es exactamente el mecanismo. Si su importación en Booking.com del calendario de Airbnb lleva dos días congelada, Booking.com sigue mostrando libres fechas que Airbnb ya vendió. Un segundo huésped las reserva, y usted le debe a uno de los dos una cancelación y una disculpa. Por eso importa la comprobación semanal de la marca de tiempo.

**¿Por qué no hay error cuando la sincronización iCal falla?**
Porque iCal es un protocolo de tirón sin canal de empuje ni señal de salud estándar. El destino tira de una URL a su ritmo; si la descarga falla, conserva los últimos datos buenos y reintenta más tarde. Nada en el estándar obliga al destino a avisarle, así que no lo hace.

**¿Cada cuánto refresca RentTools los feeds?**
Cada 10 minutos en el lado del origen. Eso significa que el hub se entera de una nueva reserva en diez minutos, frente a las horas que tarda una importación directa de plataforma a plataforma. Aun así no puede forzar a la plataforma de destino a tirar del hub más rápido que su propio ciclo de 2-6 horas; ninguna herramienta iCal puede.

## Una opinión con criterio

Deje de ver la ventana de refresco como el enemigo. El problema espectacular de «iCal no es en tiempo real» provoca a pequeña escala menos reservas duplicadas que lo aburrido: una URL que alguien reinició y olvidó actualizar, un feed que la plataforma dejó de sondear sin avisar. Ambos son invisibles mientras no mire la última importación, así que mírela. Una vez por semana, abra cada feed importado y lea una fecha. Un hábito de veinte segundos que atrapa los fallos silenciosos que el panel está encantado de ocultarle.
