---
slug: self-check-in-failure-playbook
locale: es
title: "El check-in autónomo falló: el manual del anfitrión para la emergencia de las 23:00"
excerpt: "La caja de llaves se atascó, la cerradura inteligente está fuera de línea, el huésped no acierta el código. Un procedimiento probado para los primeros 15 minutos, la hora siguiente y el análisis posterior que mantiene viva tu publicación."
status: published
tags:
  - host-tips:Consejos para anfitriones
  - automation:Automatización
  - guest-comms:Comunicación con huéspedes
ogImageUrl: /blog-covers/self-check-in-failure-playbook.webp
ogImageWidth: 1600
ogImageHeight: 900
---

La primera vez que un huésped mío se quedó fuera del piso, la cerradura inteligente llevaba tres días caída del Wi-Fi sin que yo lo supiera. No me había dado cuenta porque la cerradura seguía aceptando los códigos que yo tecleaba en su panel físico: simplemente había dejado de recibir el nuevo código que yo enviaba desde la aplicación del anfitrión. El huésped llegó a las 22:47, caminó bajo la lluvia desde el metro, marcó los seis dígitos que tenía en el móvil y vio una luz roja. Su segundo mensaje empezaba con «¿ESTÁ BROMEANDO?». Yo estaba a 1.200 kilómetros de allí.

Este es el manual que construí después de aquella noche, lo he usado una docena de veces y se lo he enseñado a dos co-anfitriones que gestionan mis pisos cuando estoy de viaje. El procedimiento de los primeros 15 minutos cuando falla un check-in autónomo. El esquema redundante que previene la mayoría de incidentes antes de que ocurran. Y el análisis posterior que decide si la publicación se queda en Instant Book o sale.

## Lo esencial

- **Tres modos de fallo independientes concentran cerca del 95 % de los incidentes**: pila agotada de la cerradura inteligente, cerradura fuera de línea (deriva de Wi-Fi), huésped que teclea mal el código.
- **El reloj de los 15 minutos empieza en el momento en que llega el mensaje «no puedo entrar»**: pasados los 15, la reseña se hunde y la plataforma lo registra.
- **Tiene que haber siempre dos caminos independientes hacia la puerta**: la cerradura inteligente como sistema principal, una caja de llaves manual con copia física como respaldo. El respaldo existe para el día en que el principal falla, no «por si acaso».
- **Verifique el estado de la cerradura en las 24 horas previas a cada llegada**, no en la última limpieza. Las cerraduras inteligentes se caen del Wi-Fi en silencio y la aplicación del anfitrión no siempre avisa.
- **Regla de compensación**: 30+ minutos bloqueado de noche → reembolso de una noche más 30–50 € de detalle comercial. 2+ horas → hotel a cargo del anfitrión.
- **Airbnb saca la publicación de Instant Book tras unos 3 incidentes de check-in documentados en 90 días**; Booking y Vrbo aplican sanciones más suaves pero reales sobre el ranking.
- **La mayoría de los fallos se evita con un chequeo de 90 segundos antes de la llegada**: estado en línea, nivel de pila, código ya enviado y visible en el registro de la cerradura.

## Los tres modos de fallo que concentran casi todos los incidentes

Sobre unos 400 check-ins autónomos que he registrado en mis pisos y en dos operaciones de co-anfitrión que ayudo a llevar, la distribución es esta:

| Modo de fallo | Cuota | Mediana de tiempo de resolución |
| --- | --- | --- |
| Pila agotada de la cerradura | 38 % | 22 min (con respaldo), 95 min (sin) |
| Cerradura fuera de línea / código no sincronizado | 31 % | 8 min (con código de caja de llaves), 50 min sin |
| Huésped teclea mal el código | 18 % | 4 min |
| Caja de llaves atascada / arco bloqueado | 8 % | 35 min |
| El anfitrión envió el código equivocado | 3 % | 6 min |
| Puerta o edificio físicamente averiados | 2 % | 90+ min |

Hay dos patrones claros. Primero, **tres modos —pila, deriva, error de tecleo— producen alrededor del 87 % de los incidentes**. El resto es cola larga. Construya el manual alrededor de los tres y la cola se cierra sola. Segundo, **tener un respaldo operativo —caja de llaves con copia, o un vecino— es el factor más determinante del tiempo de resolución**. La misma pila agotada se resuelve en 22 minutos con respaldo y en 95 sin él. El respaldo no es opcional.

## El esquema redundante que evita el 90 % de los incidentes

El esquema que mantengo hoy y que recomiendo a cada anfitrión al que ayudo en su onboarding:

1. **Cerradura inteligente como sistema principal** con la sincronización de códigos de la plataforma activada. El modelo importa menos que tener Wi-Fi y que la aplicación del anfitrión verifique realmente la sincronización. Yo uso Aqara U200 en dos pisos y Yale Linus en el tercero; los dos funcionan, los dos han fallado al menos una vez.
2. **Una caja de llaves clásica con una copia física**, atornillada a la pared en un sitio discreto: bajo una escalera, detrás de una jardinera, dentro de un armario técnico del edificio si tiene autorización del administrador. El código de la caja **no se entrega al huésped por defecto**; es el respaldo que el anfitrión reparte durante un incidente.
3. **Un vecino o conserje con una segunda copia**, con quien haya acordado de antemano ese papel. No es obligatorio, pero una llamada de 30 segundos al vecino ahorra una carrera de taxi de 40 minutos para llevar la llave.
4. **Un ping 24 horas antes de la llegada** que vuelva a enviar el código a la cerradura, confirme el estado en línea y lea el nivel de pila del registro. En mi caso lo hace un cron que pulsa la API de la cerradura; manualmente, en la aplicación del anfitrión, son 90 segundos.
5. **El mensaje al huésped 6 horas antes de la llegada** con: el código, el tipo de puerta, su ubicación en el edificio y una frase: *«Si la cerradura no funciona, el código de la caja de llaves del rellano trasero es 4172, coja la llave que hay dentro».* Esa frase resuelve aproximadamente la mitad de los incidentes antes de que el huésped llegue siquiera a escribir.

Coste del esquema: 190 € por la cerradura inteligente, 25 € por la caja de llaves, 0 € por la relación con el vecino, 0 € por el chequeo de 90 segundos. Coste de no tenerlo: vea la columna «tiempo de resolución» de arriba.

## Los primeros 15 minutos después de «no puedo entrar»

El reloj arranca en el momento en que llega el mensaje, no cuando usted lo lee. Las notificaciones se pierden. La aplicación de la plataforma a veces las agrupa. Trate todo «no puedo entrar» como una emergencia desde el minuto cero.

**Minutos 0–2.** Abra la aplicación de la cerradura. Compruebe en este orden: (a) está la cerradura en línea; (b) cuál es el nivel de pila; (c) cuál fue la última actividad en el registro («código 4172 introducido, abierto» o «código 4172 introducido, rechazado»). El registro le dice de inmediato si el huésped teclea un código equivocado o si la cerradura no acepta el correcto. Los dos fallos tienen soluciones totalmente distintas.

**Minutos 2–5.** Llame al huésped. No escriba: llame. El huésped está delante de una puerta, con equipaje y bajo la lluvia, y el pánico crece; una voz ahorra tres rondas de mensajes. Pídale que le lea el código en voz alta y luego pruebe con él al teléfono. Alrededor del 18 % de los mensajes «no puedo entrar» son un error de tecleo; se resuelve en 90 segundos.

**Minutos 5–10.** Si el código es correcto y la cerradura está en línea, tiene un problema de sincronización. Envíe un código nuevo desde la aplicación del anfitrión. Espere 30 segundos. Pida al huésped que pruebe el nuevo código. Si la cerradura está fuera de línea (sin internet, Wi-Fi caído, cerradura desconectada), salte este paso y vaya directamente al respaldo en el minuto 10.

**Minutos 10–15.** Envíe el código de la caja de llaves. Redáctelo de forma que suene a respaldo documentado, no a disculpa: *«Hay una pequeña caja de llaves junto a la escalera trasera; el código es 4172, coja la llave que hay dentro, la cerradura inteligente está rara esta noche»*. La formulación importa: «la cerradura está rara» se lee como una pequeña molestia, no como un fallo del anfitrión. Una foto de la ubicación de la caja, enviada de inmediato, ahorra otros 4 o 5 minutos.

Si en el minuto 15 el huésped sigue fuera, las soluciones in-app se han agotado y usted escala al vecino o se desplaza personalmente con la copia.

## A qué se parece de verdad una «compensación»

El error que comete la mayoría de anfitriones es ofrecer un descuento sobre la **estancia en curso**. Al huésped le da igual un 10 % de descuento sobre una estancia que termina en 60 horas; lo que le importa es la noche que ya empezó mal. La matriz que ha resistido a unos veinte incidentes reales:

| Minutos fuera | Hora | Compensación |
| --- | --- | --- |
| <15 | Cualquiera | Ninguna. Disculpa y a seguir. |
| 15–30 | Día | Crédito de 20–30 € para café o restaurante, como nota escrita. |
| 15–30 | Noche (después de las 22:00) | Una noche reembolsada + disculpa. |
| 30–60 | Día | Una noche reembolsada + disculpa. |
| 30–60 | Noche | Una noche + detalle comercial de 30–50 € por la molestia. |
| 60–120 | Cualquiera | Una noche + una comida (~40 €) + disculpa sincera. |
| 120+ | Noche | Hotel a cargo del anfitrión + ofrecer reembolso íntegro de la estancia. Reubicar al día siguiente si procede. |

La matriz sale de un único principio: **el algoritmo de la plataforma lee su volumen de reembolsos como señal de calidad, no como fuga**. Un anfitrión que reembolsa de forma proactiva cuando algo falla obtiene mejores puntuaciones y mejor posicionamiento que un anfitrión que no devuelve nada pero acumula reseñas de 3 estrellas «tuve problemas al entrar». El reembolso es la parte barata.

Para un análisis más profundo de cómo los reembolsos por cancelación y los reembolsos por check-in interactúan con la economía de la plataforma, vea [la matemática del reembolso por cancelación tardía](/es/blog/airbnb-cancellation-policy-math): el marco es el mismo, solo cambia el disparador.

## Cómo tratan las plataformas los fallos de check-in por dentro

Las plataformas no publican sus algoritmos exactos, pero los patrones de las cuentas monitorizadas son consistentes.

**Airbnb.** Un incidente de check-in que el huésped mencione en la mensajería o en la reseña se registra contra la publicación. Tres incidentes documentados en 90 días disparan el aviso «Check-in needs attention» en el panel del anfitrión. Cinco en 90 días sacan la publicación de Instant Book; seis en 90 días han provocado, en dos casos que he observado personalmente, una suspensión de 30 días. Aircover cubre parte de la compensación por fallos de check-in, pero la reclamación debe presentarse en 72 horas y el anfitrión tiene que documentar la causa.

**Booking.com.** Booking no publica una métrica de check-in, pero la posición en el ranking baja cuando la publicación recibe varias notas de 6/10 o menos en «Confort», y los fallos de check-in aterrizan justo ahí. Un piso que de media tiene 9,0 o más y acumula tres 6/10 por incidentes de check-in pierde posición de forma medible en 60 días. El estatus Genius se retira si la media cae por debajo de 8,0 en la ventana móvil. Para los umbrales por nivel Genius, vea [la matemática de los niveles Genius de Booking.com](/es/blog/booking-com-genius-levels-math).

**Vrbo.** La métrica Premier Host de Vrbo sigue el «tiempo medio de respuesta» y la «puntuación de las reseñas». Los fallos de check-in tocan ambas: los huéspedes puntúan más bajo y el tiempo de respuesta del anfitrión se ralentiza durante el incidente. El umbral en Vrbo es más estrecho que en las otras: incluso un único incidente documentado en 30 días puede sacarle temporalmente de Premier Host.

La asimetría importa: **las plataformas penalizan los check-ins inestables más de lo que premian los check-ins consistentemente buenos**. El salto del 95 % al 99 % de check-ins limpios vale mucho más que el salto del 80 % al 85 %, porque el algoritmo lee los mismos tres incidentes documentados de forma distinta según el volumen total.

## El análisis posterior: qué hacer al día siguiente del incidente

En las 24 horas siguientes a cualquier incidente, un análisis en cinco pasos:

1. **Identificar la causa real**, no el síntoma. «La pila estaba muerta» es el síntoma; «no había revisado la pila en 7 semanas» es la causa. «La cerradura estaba fuera de línea» es el síntoma; «el router se reinició solo y la cerradura no volvió a conectarse» es la causa.
2. **Corregir la causa de forma permanente**. Cambiar la pila; añadir la cerradura al monitoreo de Wi-Fi; documentar el incidente en el registro de operaciones para que un co-anfitrión no lo repita.
3. **Enviar al huésped un mensaje de seguimiento** a la mañana siguiente al incidente, preguntando cómo va el resto de la estancia. Ese único mensaje cambia alrededor del 30 % de las reseñas de 4 a 5 estrellas. El huésped al que se trata como persona y no como queja perdona el fallo.
4. **Actualizar el mensaje pre-llegada** si el incidente podía haberse evitado con instrucciones más claras. Si tres huéspedes se han perdido con «la puerta del fondo del patio», hay que reescribir el mensaje pre-llegada, no culpar a los huéspedes.
5. **Registrar el incidente** con fecha, causa, tiempo de resolución, importe de la compensación e impacto sobre la reseña. Tras 10 incidentes surgen patrones que un caso aislado oculta.

Para anfitriones con 3 o más pisos, el registro de operaciones es la herramienta más infravalorada del stack. También es aburrido, por eso la mayoría lo salta; precisamente por eso quienes lo mantienen superan a los demás. La misma lógica se aplica a la limpieza, al mantenimiento y a la conciliación de plataformas: un patrón paralelo está descrito en [el artículo sobre inventario de ropa de cama](/es/blog/linen-inventory-short-term-rental).

## Lo que dice la matemática sobre la redundancia de hardware

Esta es la matemática que justifica el dúo caja de llaves + cerradura inteligente. Un piso con 10 estancias al mes, una tarifa media de 120 € la noche y una tasa de fallo de check-in del 3 % (cifra típica de un esquema de método único: solo cerradura o solo caja).

Sin redundancia: 10 × 12 × 0,03 = **3,6 fallos al año**. A 80 € de compensación media por incidente (reembolso + detalle, con sesgo nocturno), son 288 € al año. El coste mayor es el efecto sobre las reseñas: 3,6 incidentes documentados al año es el umbral por encima del cual Instant Book de Airbnb y el ranking de Booking empiezan a doblarse. La pérdida de Instant Book cuesta normalmente 10–15 % de las reservas; sobre un piso que factura 14.400 € al año, son 1.800 € de bruto perdido.

Con redundancia (cerradura inteligente + caja de llaves + vecino), la tasa de fallo **tal como la vive el huésped** baja a alrededor del 0,5 %, porque el respaldo resuelve el incidente en 8–22 minutos antes de que el huésped esté lo bastante molesto para volcarlo en la reseña. La caja cuesta 25 € una vez. El vecino cuesta cero. El chequeo de 90 segundos previo a la llegada cuesta unas 4 horas al año (90 s × 10 estancias × 12 meses / 3600 ≈ 6 horas). Con cualquier tarifa horaria del anfitrión superior a 5 €/h, la redundancia se amortiza el primer año y compone los siguientes.

La matemática es contundente y aun así la mayoría de anfitriones la salta, porque el beneficio es invisible —no se puede señalar el incidente que no ocurrió— y el daño también es invisible hasta que cae la primera reseña de 1 estrella. Para la visión operativa más amplia, en el momento en que empiece a gestionar varios check-ins con fiabilidad, [RentTools](/onboard) registra los incidentes de check-in junto con el resto del registro de operaciones y hace aparecer los patrones a partir del segundo o tercer caso.

## Preguntas frecuentes

**¿Qué hago si un huésped se queda fuera a las 23:00 y yo estoy en otra zona horaria?**
El manual funciona estés donde estés; lo único que cambia es que no puede llegar físicamente con la llave. Por eso la combinación caja de llaves + copia es obligatoria si gestiona el piso desde otra ciudad. El código de la caja sale en el primer mensaje. Si la propia caja ha fallado, llame al vecino con el que pactó este papel. Si no hay vecino, el siguiente escalón es un cerrajero 24/7 (unos 150 € en la mayoría de ciudades) más la reserva inmediata de un hotel cercano con su tarjeta. Gestionar desde otra ciudad sin dos respaldos independientes es el patrón de mayor riesgo en alquiler de corta estancia.

**¿Con qué frecuencia fallan realmente las cerraduras inteligentes?**
Según mis registros: una cerradura inteligente con pilas falla aproximadamente cada 14 meses en uso normal, sobre todo por descarga de la pila o caída del Wi-Fi. Una cerradura inteligente cableada falla con menos frecuencia (cada 30–40 meses), pero es más cara de instalar y más complicada de cambiar. La tasa es baja **por cerradura** y alta en agregado: en un parque de tres pisos verá dos o tres incidentes al año y no podrá predecir en qué semana. Trate la tasa como inevitable, no como excepción.

**¿Debería desactivar Instant Book para evitar problemas de check-in?**
No, casi nunca. Desactivar Instant Book cuesta entre el 25 % y el 40 % de las reservas en Airbnb y una parte medible aunque menor en Booking. La respuesta correcta es mantener Instant Book activo y bajar la tasa de fallo. La matemática está en [el artículo Instant Book vs solicitud](/es/blog/airbnb-instant-book-vs-request-to-book); en corto: la pérdida de ingresos por desactivar Instant Book es mucho mayor que la pérdida por el 3 % de incidentes de check-in que se evitarían así.

**¿Qué pila debe llevar una cerradura inteligente?**
Pilas AA de litio, no alcalinas. La diferencia de precio es de unos 0,40 € por unidad; la diferencia de vida útil es de unas 4 veces en frío. La mayoría de fabricantes de cerraduras inteligentes envían el producto con pilas alcalinas de fábrica; reemplácelas por litio el primer día. Si el piso está en un clima que cae por debajo de 0 °C en invierno, la diferencia entre alcalina y litio equivale a la diferencia entre dos cambios de pila al año y uno cada 18 meses. El anfitrión que combina alerta 24/7 de batería con AA de litio presenta, en mis datos, la tasa de fallo más baja.

**¿Va Aircover a cubrir el coste de un incidente de bloqueo?**
A veces. Aircover para anfitriones cubre parte de los incidentes del lado del huésped (objetos rotos, limpieza posterior) e incluye un componente de «asistencia al huésped» que, en la práctica, ya ha pagado noches de hotel para huéspedes bloqueados cuando el anfitrión presentó la reclamación en 72 horas. La tasa de aprobación ronda el 60–70 % según los informes de la comunidad de anfitriones; el rechazo suele deberse a una documentación insuficiente de la causa. Para la visión aseguradora más amplia, vea [Aircover frente a fianza de Booking](/es/blog/airbnb-aircover-vs-booking-damage-deposit).

**¿Debería dar el código de la caja de llaves a cada huésped por defecto?**
No. La caja de llaves es el respaldo; dar el código a todos los huéspedes hace que cualquiera que encuentre confusa la cerradura inteligente acuda primero a la llave física, anulando el sentido de la cerradura inteligente y desgastando la copia. El código de la caja lo transmite el anfitrión **durante** un incidente, con encuadre de uso único. Si se ve enviando el código de la caja más de una vez cada diez estancias, el problema está en la configuración de la cerradura inteligente, no en la estrategia de respaldo.

**¿Cómo sé si mi cerradura inteligente está realmente en línea antes de cada check-in?**
La aplicación del anfitrión de las principales marcas (August, Yale, Aqara, TTLock) muestra un indicador de conexión. El estado se actualiza cada 5 a 60 minutos según el modelo. El chequeo de 90 segundos previo a la llegada es: abrir la aplicación, confirmar el estado «en línea», comprobar que la pila está por encima del 30 %, comprobar que el último código emitido figura en la lista de códigos activos de la cerradura. Si alguno de los tres puntos falla, arréglelo antes de que llegue el huésped. Hacer el chequeo a la salida del equipo de limpieza (3 horas antes del siguiente check-in) atrapa casi todo; a 30 segundos del check-in atrapa los últimos casos.

**¿La peor historia de bloqueo que he visto en directo?**
A un anfitrión con varios pisos su operadora le cambió el router de Wi-Fi sin previo aviso. El nuevo router tenía otro SSID. Las dos cerraduras inteligentes que dependían de él se quedaron sin línea durante la noche. A la mañana siguiente, tres huéspedes consecutivos en dos pisos no pudieron entrar. Balance: dos noches reembolsadas, una noche de hotel a cargo del anfitrión y una reseña de 3 estrellas que bajó la nota del piso de 4,92 a 4,88, una diferencia que cuesta entre el 4 % y el 6 % de visibilidad en la búsqueda de Airbnb. La solución fue un dongle LTE de respaldo de 25 € que mete la cerradura en la red móvil cuando cae el Wi-Fi doméstico. Vale cada céntimo.

## Una opinión contundente

Los anfitriones que tratan el check-in autónomo como una optimización continua superan a los que lo tratan como una instalación de una sola vez. La cerradura que compró hace dos años no es la cerradura que tiene hoy: las pilas se degradan, los firmwares se actualizan, los routers se reinician y los fallos se acumulan en silencio hasta la noche en que un huésped queda bajo la lluvia tecleando seis dígitos que ya no significan nada. El chequeo de 90 segundos antes de la llegada es el hábito de anfitrión más rentable que conozco: 6 horas al año de inversión que evitan justo la clase de incidente que los algoritmos de plataforma castigan con más dureza. La mayoría lo salta porque es aburrido y porque el beneficio es invisible. Los pocos que lo aplican con disciplina tienen las páginas de reseñas más limpias y las posiciones de búsqueda más estables, y casi nunca reciben el mensaje de las 23:00 que empieza con «¿ESTÁ BROMEANDO?». Para la imagen operativa más amplia, en el momento en que empiece a seguir el estado de las cerraduras junto con la limpieza, el calendario y la conciliación de pagos, vea [el artículo sobre cómo autoalojar el gestor de pisos](/es/blog/self-hosting-property-manager-droplet); la misma disciplina de registro de operaciones se aplica a todo el stack.
