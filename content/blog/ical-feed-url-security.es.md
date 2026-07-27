---
slug: ical-feed-url-security
locale: es
title: "Seguridad del enlace iCal: qué revela su calendario exportado"
excerpt: "Las URL de exportación iCal de Airbnb y Booking.com son contraseñas sin caducidad. Qué contiene de verdad el feed, cómo leer el suyo y cuándo cambiarlo."
status: published
tags:
  - ical:iCal
  - calendar-sync:Sincronización de calendarios
  - data-protection:Protección de datos
  - host-tips:Consejos para anfitriones
ogImageUrl: /blog-covers/ical-feed-url-security.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Once meses. Ese es el tiempo que mi URL de exportación del calendario de Airbnb estuvo colgada en un hilo público de un foro, indexada por Google, legible por cualquiera que bajara lo suficiente. La había pegado entera para preguntar por qué Booking.com no recogía el feed. Me contestaron en veinte minutos: la ranura de importación estaba bien, al copiar se había colado un espacio en la URL. Cerré la pestaña. La URL se quedó. Es un token sin caducidad y sin una sola línea de registro de accesos: durante once meses entregó todas las fechas reservadas de uno de mis apartamentos a quien se las pidiera.

Esto es lo que hay realmente dentro de esos feeds, cómo leer el suyo en minuto y medio, los cinco sitios por donde se escapa la URL y cómo regenerarla en cada plataforma.

## TL;DR

- Una URL de exportación iCal es una contraseña: sin caducidad ni registro.
- El feed de Airbnb puede llevar más que fechas: lea el suyo antes de fiarse.
- Booking.com solo exporta fechas. Es el caso bueno, no la norma.
- El ID del anuncio va en la URL: el feed se identifica de un vistazo.
- Regenerar la URL de Airbnb es un clic y rompe a todos los suscriptores.
- Feed filtrado con nombres de huéspedes: brecha y 72 horas para notificar.

## La URL es una contraseña, y nadie la trata así

Todas las plataformas que ofrecen exportación de calendario resuelven la autenticación con la misma pereza: el secreto es la propia URL. Airbnb le entrega algo con esta forma: `https://www.airbnb.com/calendar/ical/12345678.ics?s=<token de 32 caracteres>`. Booking.com entrega `https://admin.booking.com/hotel/hoteladmin/ical.html?t=<token>`. Sin inicio de sesión, sin cabecera, sin firma, sin lista de direcciones permitidas. Se pide la URL, se recibe el archivo.

No es un descuido, es el único diseño que funciona aquí: al otro extremo está el importador de Booking.com, y no puede iniciar sesión por usted. Todo el [montaje gratuito con iCal](/blog/airbnb-booking-calendar-sync-free) depende de que una máquina anónima consulte la URL según su propio horario. El protocolo que hay debajo, el [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545), no contempla siquiera la idea de un suscriptor autenticado.

Tres propiedades hacen que este token sea peor que una contraseña:

1. **No caduca nunca.** Una contraseña de 2023 al menos le pide que la cambie en algún momento. Una URL de feed de 2023 hoy sigue devolviendo un calendario vivo y actualizado.
2. **No hay registro de accesos.** Airbnb no le va a contar que el mes pasado el feed se descargó 400 veces desde direcciones que no tienen nada que ver con Booking.com. La filtración no se detecta. Solo se supone.
3. **Se identifica de un vistazo.** Ese `12345678` de la ruta es el ID de su anuncio. Péguelo detrás de `airbnb.com/rooms/` y aparece el anuncio público: fotos, barrio, dirección aproximada. El feed no necesita nombrarle. Ya lo hace la URL.

El tercer punto es el que convierte una lista aburrida de fechas en algo que merece preocuparle. Fechas ocupadas en el vacío son ruido. Fechas ocupadas atadas a una calle concreta de una ciudad concreta son el calendario de ocupación de una vivienda, incluidas las noches en que no hay nadie dentro.

## Abra su propio feed y léalo

Deje de adivinar qué contiene su feed. Es un archivo de texto plano y se abre en el navegador.

Pegue la URL de exportación en la barra de direcciones y pulse Enter. Pasará una de dos cosas: el navegador descarga un archivo `.ics`, o muestra un muro de texto que empieza por `BEGIN:VCALENDAR`. Si lo descarga, ábralo con cualquier editor de texto: es texto, no un binario. Bloc de notas, VS Code, lo que tenga más cerca.

Delante tiene una sucesión de bloques `VEVENT`, uno por cada periodo bloqueado. Uno se ve más o menos así:

```
BEGIN:VEVENT
DTSTART;VALUE=DATE:20260803
DTEND;VALUE=DATE:20260809
UID:1a2b3c4d5e6f@airbnb.com
SUMMARY:Reserved
DESCRIPTION:Reservation URL: https://www.airbnb.com/hosting/reservations/details/HMXXXXXXXX
END:VEVENT
```

Recorra el archivo entero y hágase tres preguntas:

- **¿Aparece algún nombre en `SUMMARY`?** En unas exportaciones es un escueto `Reserved` o `Not available`. En otras es el nombre del huésped, a veces con la inicial del apellido.
- **¿Existe el bloque `DESCRIPTION` y qué lleva dentro?** Airbnb ha servido exportaciones en las que ese campo incluía un enlace a la reserva, un código de confirmación y los cuatro últimos dígitos del teléfono del huésped. Que el suyo lo haga depende de la plataforma, del tipo de alojamiento y del año, y por eso justamente se lee el archivo en vez de creerse un artículo de blog.
- **¿Hasta dónde llega?** La mayoría de exportaciones cubren unos doce meses hacia delante. Algunas arrastran también el pasado, y entonces el archivo deja de ser un calendario futuro para convertirse en un historial de ocupación.

Minuto y medio. Hágalo con cada feed que haya exportado alguna vez, en cada plataforma, antes de seguir leyendo.

## Qué pone cada plataforma en el archivo

Esto es lo que encontré en mis propias exportaciones en julio de 2026: dos apartamentos, tres plataformas. Tómelo como un mapa, no como una especificación; estos campos ya han cambiado y volverán a cambiar.

| Plataforma | Fechas | Nombre del huésped | Teléfono / contacto | Número de reserva |
| --- | --- | --- | --- | --- |
| Exportación de Airbnb | Sí | A veces, en `SUMMARY` | Los 4 últimos dígitos han aparecido en `DESCRIPTION` | Sí, como enlace |
| Exportación de Booking.com | Sí | No — `CLOSED - Not available` | No | No |
| Exportación de Vrbo | Sí | Con frecuencia, en `SUMMARY` | No | Sí |
| Feed intermedio propio | Sí | Solo si usted lo pone | Solo si usted lo pone | Solo si usted lo pone |

Booking.com es el bien educado: marca los periodos como ocupados y calla el resto. Por eso un feed de Booking importado no puede meter datos del huésped en Airbnb ni queriendo. Los que hay que revisar son Airbnb y Vrbo.

Esa asimetría importa por un motivo muy práctico. El anfitrión piensa en el feed que **importa**, que es el que le llena el calendario. El riesgo vive en el feed que **exporta**: configurado una vez, pegado en algún sitio y nunca vuelto a abrir.

## Los cinco sitios por donde se escapa la URL

Todas las filtraciones que he visto o provocado yo mismo caben en esta lista.

**1. Depurar en público.** Es mi caso, y con diferencia el más frecuente. La sincronización se rompe, usted escribe en un grupo de anfitriones, en un foro o en una incidencia de GitHub, y la URL va dentro porque de qué otra forma van a ayudarle. El hilo sobrevive años a su problema y Google lo indexa. Si la página es pública y el archivo es texto plano, también el **contenido** acaba siendo localizable, no solo el enlace.

**2. Capturas de pantalla.** Fotografía el panel «Sincronizar calendarios» para enseñarle a la persona de la limpieza o a un coanfitrión dónde pulsar. El campo de exportación está en pantalla, desplegado y en el centro. Los nombres de huéspedes se difuminan constantemente en las capturas; los campos de URL, casi nunca.

**3. Herramientas abandonadas.** En dos años ha probado cuatro channel managers. A cada uno le pegó la URL. Tres de esas cuentas están muertas, una de las empresas la compró otra por el camino, y todas conservan un token que sigue funcionando. Nadie borra una cuenta de prueba, y borrarla tampoco equivale a revocar el token. Eso solo lo hace regenerarlo.

**4. Calendarios compartidos.** Suscribir Google Calendar al feed no tiene problema. Poner ese calendario de Google en «hacer público» sí lo tiene, y está a dos clics en la misma pantalla de ajustes. El calendario público republica entonces su feed bajo una URL nueva que usted no ha creado.

**5. Traspasar el alojamiento.** Se va el coanfitrión, cambia la persona de la limpieza, vende el piso. Todas las URL que repartió siguen funcionando. Ninguna lista de tareas de salida incluye una línea para una cadena de texto que alguien pegó un día en su propia herramienta.

## Cómo regenerar la URL en cada plataforma

Regenerar es el único remedio. Revocar el acceso de un solo suscriptor no existe en ningún punto de este ecosistema: el token es todo o nada, así que cambiarlo rompe a todos los destinatarios legítimos en el mismo instante en que rompe al indeseado. Cuéntelo antes de pulsar.

**Airbnb.** Calendario → elegir el anuncio → Disponibilidad → **Sincronizar calendarios** → localizar su exportación y pulsar **Restablecer URL**. La anterior deja de responder de inmediato. En todas las plataformas y herramientas que la importaban el feed queda muerto, y la mayoría fallará en silencio en vez de avisar. Calcule quince minutos para pegar la URL nueva en todas partes y compruebe al día siguiente la marca de tiempo de la última importación en cada destino.

**Booking.com.** Extranet → Calendario y precios → **Sincronizar calendarios**. No todas las versiones del extranet muestran un botón de restablecer en la exportación. Si falta, borrar la exportación y crearla de nuevo le da un token nuevo; si tampoco existe esa vía, el soporte para socios la regenera por ticket, y ese ticket vale más que encogerse de hombros. Las exportaciones de Booking son las que menos llevan, pero esa misma URL sigue revelando su ocupación completa.

**Vrbo.** Calendario → Configuración → Importar/Exportar. Mismo patrón: regenerar y después repegar aguas abajo.

Regenere lo que regenere, apunte adónde ha ido la URL nueva. Lo que frena a los anfitriones no es el clic, es no saber cuáles de sus cuatro herramientas dejarán de sincronizar calladamente el jueves. Tres líneas en el mismo sitio donde guarda los ID de sus anuncios resuelven eso para siempre.

Después de cualquier regeneración, mantenga a mano durante cuarenta y ocho horas los [controles contra reservas duplicadas](/blog/avoiding-double-bookings). Una ranura de importación muerta se ve exactamente igual que una que funciona, hasta que dos huéspedes reservan la misma semana: Airbnb consulta los calendarios importados cada 2 a 4 horas, Booking.com cada 2 a 6, y ninguno de los dos dice nada cuando en lugar de un calendario recibe un 404.

## Cuándo una filtración del feed es una brecha notificable

Si aloja a huéspedes de la UE o del Reino Unido, esto deja de ser una cuestión de orden y pasa a ser jurídica, con plazo.

El artículo 4.12 del RGPD incluye dentro de «violación de la seguridad de los datos personales» la *comunicación* no autorizada de datos y el *acceso* no autorizado a ellos, no solo el robo ni solo el ataque. Una URL de feed que acaba en un hilo público es una comunicación. La pregunta siguiente es si eso son datos personales, y la respuesta depende por completo de lo que encontrara al abrir el archivo.

- **Solo fechas, sin nombres** (la exportación típica de Booking.com): la ocupación de un inmueble identificable. Débil por sí sola, pero unida a la dirección pública del anuncio son datos personales más sobre usted que sobre sus huéspedes. Documente, regenere y siga.
- **Nombres de huéspedes, o nombres junto a un código de reserva**: datos personales sin discusión. El artículo 33 abre un plazo de 72 horas desde que usted tiene constancia para notificar a la autoridad de control, salvo que sea improbable que la brecha suponga un riesgo para los derechos y libertades de las personas.
- **Nombres más fragmentos de contacto más fechas exactas de estancia**: esta es la combinación que tuerce el análisis de riesgo, porque le cuenta a un desconocido quién duerme dónde y qué noches.

Dos apuntes prácticos. El artículo 33.5 obliga a documentar toda brecha y su razonamiento, incluidas las que decida no notificar; basta un párrafo fechado, lo importante es que exista antes de que alguien pregunte. Y el responsable del tratamiento aquí es usted, no Airbnb: la plataforma le dio una función de exportación, dónde poner la URL lo decidió usted. [Lo básico del RGPD para anfitriones](/blog/gdpr-for-vacation-rental-hosts) cubre la base jurídica y los plazos de conservación sobre los que se apoya todo esto.

## El feed que exporta debería ser suyo

El arreglo estructural consiste en dejar de repartir tokens generados por las plataformas.

Ponga en medio una capa que sea suya. Las dos plataformas importan de su feed, y la única URL que sale hacia fuera —a una herramienta, a una captura, a un foro— es esa. Regenerar pasa a ser una acción en lugar de cuatro, y por eso acaba haciéndolo de verdad. El archivo exportado contiene exactamente los campos que usted decide emitir: para sincronizar disponibilidad bastan `DTSTART`, `DTEND`, `UID` y un `SUMMARY` con el valor `Busy`, nada que convierta un calendario en un expediente. Y cuando se va un coanfitrión, cambia una cadena de texto.

Buena parte de por qué [RentTools](/onboard) tiene la forma que tiene es esta: consulta los feeds de origen cada 10 minutos, emite un feed saliente mínimo por alojamiento y regenera esa URL saliente cuando usted lo pida, sin tocar los ajustes de Airbnb ni de Booking.com. Autoalojado en un droplet de 4 $ o en la instancia hospedada; en ambos casos, el token que pega en el software de otros es un token que puede matar usted.

Esto no arregla el lado entrante. La URL de exportación de Airbnb existe la use o no, y si alguna vez generó una, ahora mismo está viva. Regenere esa hoy y decida mañana qué exporta.

## FAQ

**¿Es privado mi enlace iCal de Airbnb?**
Es no listado, que no es lo mismo que privado. No hay contraseña ni comprobación de sesión: quien tiene la URL obtiene el archivo. Airbnb genera un token aleatorio largo para que nadie lo adivine, pero esa protección termina en el momento en que la URL queda escrita en un sitio público. Trátela como una contraseña cuyo historial de accesos no va a poder consultar jamás.

**¿Puede alguien ver los nombres de mis huéspedes desde el enlace del calendario?**
Es posible, y solo leyendo su propio archivo lo sabrá. La exportación de Booking.com marca fechas como ocupadas y no entrega ningún dato del huésped. Las exportaciones de Airbnb y de Vrbo han llevado el nombre del huésped en el campo del evento, y Airbnb ha servido exportaciones cuya descripción incluía un enlace a la reserva y los cuatro últimos dígitos de un teléfono. Abra el archivo en un editor de texto en vez de suponerlo.

**¿Cómo restablezco la URL de exportación de mi calendario de Airbnb?**
Entre en Calendario, seleccione el anuncio, vaya a Disponibilidad y luego a Sincronizar calendarios. Localice la entrada de exportación y elija Restablecer URL. El enlace antiguo muere al instante y sin periodo de gracia, así que tenga a mano la lista de destinos y actualícelos en la misma sesión.

**¿Restablecer la URL rompe mis calendarios sincronizados?**
Sí, todos a la vez y casi siempre en silencio. La plataforma que importa sigue mostrando el feed como conectado mientras deja de recoger nada. Tras regenerar, pegue la URL nueva en cada destino y compruebe al día siguiente la marca de la última importación de cada uno, en lugar de fiarse del estado en verde.

**¿Una URL iCal filtrada es una brecha que deba notificar?**
Depende de lo que contenga el archivo. Un feed sin datos de huéspedes, solo con fechas, es un caso débil que suele quedarse en una nota interna. Un feed con nombres de huéspedes, o con nombres, códigos de reserva y fechas exactas de estancia, es una violación de datos personales, y el artículo 33 le da 72 horas desde que tiene constancia para notificar a la autoridad de control, salvo que pueda justificar que no hay riesgo real. En cualquier caso, escriba qué pasó y qué concluyó: documentar es obligatorio incluso para las brechas que no se notifican.

**¿Puede Google indexar mi feed iCal?**
El feed en sí se rastrea poco, porque nada enlaza a él. El mensaje del foro donde pegó la URL sí se rastrea con seguridad, y ahí está el agujero real. Una vez indexada la página, el enlace se encuentra desde el buscador, y el calendario en texto plano que hay detrás puede acabar en cachés que ya no podrá vaciar.

**¿Cada cuánto debo cambiar la URL de exportación?**
No por calendario, sino por sucesos. Cámbiela cuando un coanfitrión o una persona de la limpieza deje de trabajar con usted, cuando cancele un channel manager u otra herramienta de reservas, cuando haya publicado la URL en algún sitio pidiendo ayuda y cuando traspase o venda un alojamiento. Rotarla por fechas solo rompe sincronizaciones a intervalos fijos sin corresponderse con ningún riesgo real.

**¿Y el feed que me da mi channel manager?**
Mismas reglas, mismos fallos y uno extra: el feed saliente de un channel manager suele agrupar varios alojamientos, así que una sola URL filtrada expone toda su cartera en lugar de un apartamento. Compruebe si la herramienta le deja regenerar esa URL usted mismo. Si hace falta un ticket de soporte para regenerarla, mejor saberlo antes que un viernes a las 23:00.

## Una opinión con filo

Dé por supuesto que todas las URL de exportación que haya generado alguna vez están ya comprometidas: no puede demostrar lo contrario y las plataformas no le dan forma alguna de comprobarlo. Regenérelas todas esta semana y luego monte su sistema de modo que la única URL de feed que salga de sus manos sea una que usted regenera en diez segundos.

Y cuando la sincronización se rompa y necesite ayuda: no pegue nunca la URL. Pegue las veinte primeras líneas del archivo, con los tokens y los `UID` recortados. Cualquiera capaz de diagnosticar su problema lo hará con el archivo delante. Quien le exija la URL viva está depurando otra cosa.
