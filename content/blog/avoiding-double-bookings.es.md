---
slug: avoiding-double-bookings
locale: es
title: "Cómo evitar dobles reservas: el único cheat sheet que necesitas"
excerpt: Una chuleta para Anfitriones de alquiler corto: intervalos de sincronización, días buffer, reglas de bloqueo manual y la auditoría 24 h previa a la llegada.
status: draft
tags:
  - double-bookings:Reservas duplicadas
  - calendar-sync:Sincronización de calendarios
  - host-tips:Consejos para anfitriones
ogImageUrl: /blog-covers/avoiding-double-bookings.webp
ogImageWidth: 1600
ogImageHeight: 900
---

# Cómo evitar dobles reservas: el único cheat sheet que necesitas

La primera doble reserva real que monté no fue por retraso de sincronización. Fue por bloquear un viernes en Booking.com para un amigo que dijo que vendría a verme, olvidarme de espejar el bloqueo en Airbnb y comerme un *instant book* en Airbnb el mismo viernes dos horas después. El retraso fue cero. Tenía dos calendarios diciendo cosas distintas porque edité uno y me olvidé del otro.

Esa anécdota importa porque la mayoría de los artículos de «cómo prevenir dobles reservas» se obsesionan con las ventanas de iCal y se olvidan de la causa más común: el Anfitrión que edita una plataforma y se olvida del resto. Esta es la chuleta que ojalá hubiera tenido entonces.

## TL;DR

- Pon cada calendario importado al sondeo más rápido en cada plataforma y, aun así, da por hecho **2 a 6 horas** de retraso.
- Añade **1 día de buffer** en propiedades con limpieza el mismo día; sáltatelo en estudios pequeños que limpias tú.
- Para bloqueos manuales (uso propio, mantenimiento), **edita un solo calendario canónico y deja que se propague**. Nunca edites dos plataformas a mano.
- Haz una **auditoría 24 horas antes de cada llegada**: abre las dos plataformas y confirma que las fechas siguen coincidiendo.
- Una doble reserva entre cientos es un hecho matemático, no un fallo moral. Ten preparada una plantilla de disculpa.

## La chuleta

Cinco reglas. En orden de cuántas veces te van a salvar.

1. **Un único calendario canónico.** Elige una sola fuente de verdad para los bloqueos manuales (los tuyos, familia, mantenimiento). El resto de plataformas importan de ella. Nunca escribas un bloqueo manual en dos plataformas.
2. **Sondeo más rápido en cada feed importado.** Airbnb, Booking, Vrbo: en cada una, fija el refresco al menor disponible. Ninguna baja de 2 horas; está bien.
3. **Un día de buffer, a veces.** En propiedades con limpieza externa el mismo día, añade 1 día tras la salida. En estudios pequeños que tú limpias en dos horas, sáltalo: el ingreso perdido supera al riesgo.
4. **Auditoría 24 h antes de cada llegada.** La víspera, abre ambas plataformas y confirma que las fechas siguen bloqueadas. 30 segundos. Caza el fallo silencioso de 1 entre 300.
5. **Plantilla de disculpa lista para enviar.** Cuando la rara doble reserva ocurra, estarás en el metro / dormido / conduciendo. Ten una plantilla educada y serena que explique la situación, reembolse al perdedor y le señale un Alojamiento alternativo cercano.

Si haces las cinco, tu tasa de doble reserva baja por debajo de la de fallos de tarjeta, no-shows y bloqueos en la caja de llaves. No es cero. Es más o menos la probabilidad de que te atropelle un coche que no viste.

## Intervalo de sincronización: pon bien el dial

La mayoría de Anfitriones sabe que iCal refresca «cada pocas horas» sin haber mirado el ajuste. El ajuste importa.

Cada plataforma tiene el suyo. Lo configurable a día de hoy:

1. **Airbnb** — los calendarios importados refrescan según el calendario de Airbnb (entre 2 y 4 horas, no configurable). Las exportaciones salientes se actualizan cada ~2 horas.
2. **Booking.com** — la extranet permite refresco manual por feed; el automático corre cada 2 a 6 horas. No hay UI para acelerarlo.
3. **Vrbo** — el más lento de los tres. Hasta 12 horas observadas en casos extremos. Rota la URL si un feed parece atascado más de 24 horas.

Lo que tú puedes cambiar es tu propio sondeo saliente. Si usas una capa intermedia como [RentTools open-source](/onboard), pon su sondeo entrante al menor intervalo posible —10 minutos es razonable; por debajo desperdicias ancho de banda de Airbnb sin ganar nada porque la plataforma de destino sigue sondeando lento—.

Para entender por qué iCal no puede ir más rápido que su ciclo de sondeo y por qué no hay push, mira [nuestro paseo por cómo sincronizan Airbnb y Booking.com](/blog/airbnb-booking-calendar-sync-free).

## Días buffer: cuándo poner uno (y cuándo no)

La mayoría elige «1 día de buffer» por defecto y nunca lo revisa. Es un trade-off y la respuesta correcta es por propiedad.

La cuenta: 1 día de buffer por rotación pierde una noche de ingreso. A 90 $/noche y 30 rotaciones al año, son 2.700 $/año, antes de impuestos. El beneficio es lo que habrías perdido por (a) problemas de calidad de limpieza y (b) la rara doble reserva con salida-y-entrada el mismo día.

Reglas de decisión que uso:

1. **Estudio / 1 dormitorio que limpio yo en menos de 90 minutos**: cero buffer. La entrada el mismo día funciona. El ahorro pesa más que el riesgo marginal de calidad.
2. **Villa familiar con limpieza externa con 4 horas de cambio**: 1 día de buffer. Que coincidan salida-a-las-11 y entrada-desde-las-15 es demasiado justo; 1 día compra margen real.
3. **Propiedad con Huéspedes raros de 7+ noches**: 1 día. El ingreso perdido es pequeño (estancias largas = pocas rotaciones) y los Huéspedes largos son más exigentes con la limpieza.
4. **La misma propiedad sincronizada solo por iCal (sin API de Channel Manager)**: pon el buffer en la plataforma líder y deja que se propague vía iCal. Nunca lo pongas en la rezagada: el buffer tiene que aterrizar antes del sondeo de la rezagada, no después.

Sáltate el buffer si tus rotaciones van solas y tu equipo de limpieza es fiel. Vuelve a meterlo en cuanto tengas un mal incidente de limpieza.

## Reglas de entrada manual: la trampa del calendario offline

Esta es la que me mordió con el viernes. La regla es simple e innegociable: **nunca escribas un bloqueo manual en dos plataformas a mano**. Elige una canónica y deja que iCal haga el resto.

Tres formas de hacerlo:

1. **Booking.com como canónica.** Bloquea la fecha en la extranet. Airbnb importa el iCal de Booking, así que el bloqueo se propaga en la ventana de sondeo (2 a 4 h). Funciona porque la extranet de Booking tiene la UI más densa de las tres grandes.
2. **Airbnb como canónica.** Bloqueas en Airbnb. Booking importa el iCal de Airbnb. Misma lógica, dirección opuesta.
3. **Un calendario externo como canónico.** Usa un Google Calendar (o tu instancia de [RentTools](/onboard)) para bloqueos personales. Tanto Airbnb como Booking importan de él. Útil cuando tienes muchos bloqueos personales (reformas, temporada baja, uso familiar).

Sea cual sea, ponte un fondo de pantalla, una nota adhesiva, tatúatelo. La próxima vez que un amigo te escriba para preguntar si tu piso está libre el fin de semana, la respuesta es «lo bloqueo ahora en $CANONICAL». No «espera, lo bloqueo en las dos».

Si llevas varias propiedades con varios dueños (un setup de cohost), pónganse de acuerdo en la regla y déjenla por escrito. La mitad de las malas historias de doble reserva que he oído de otros Anfitriones en Tashkent venían de un copropietario bloqueando en una plataforma a la que el principal no tenía acceso para espejar.

## La auditoría 24 h previa a la llegada

La salvación aburrida. Toda reserva pasa una revisión 24 horas antes.

La auditoría dura 30 segundos:

1. Abre la reserva en la plataforma que la recibió.
2. Apunta las fechas exactas.
3. Abre el calendario de la otra plataforma para esa propiedad.
4. Confirma que las fechas aparecen bloqueadas.
5. Si no aparecen bloqueadas, márcalas a mano en la segunda plataforma (tienes un fallo raro de sincronización o tu setup está roto). Investiga después de que entre el Huésped.

Encontrarás un problema cada 200 a 400 reservas. Casi siempre es un problema transitorio que no habrías cazado de otro modo: una URL de feed que la plataforma origen rotó en silencio, un cron que murió en el servidor, un cambio de horario que confundió a un cron de medianoche.

No te lo saltes en estancias largas; ahí un choque duele más porque no puedes recolocar trivialmente a un Huésped de 3 semanas.

Puedes automatizar parte. RentTools manda un correo «sin conflictos detectados, nos vemos en 24 h» antes de la llegada. Muchos Channel Managers hacen lo mismo. Manual va bien con menos de 20 reservas al mes: el coste en tiempo es de minutos a la semana.

## FAQ

**¿Qué cuenta como doble reserva?**
Dos reservas confirmadas de Huéspedes distintos solapando al menos una noche en la misma propiedad. Una reserva y un bloqueo personal no cuentan, aunque la disculpa que debes es similar.

**¿Cuántas veces ocurre de verdad con sincronización iCal?**
Anecdóticamente, dígitos bajos al año para Anfitriones con menos de 5 propiedades en Airbnb más Booking. Más si listas en más de tres plataformas (más pares de sondeo, más huecos). Más todavía con Vrbo, que sondea más despacio de las tres grandes.

**¿Debería capar mi tasa de aceptación para evitar dobles reservas?**
No. La tasa de aceptación afecta a tu posicionamiento en Airbnb. Las herramientas correctas (sincronización, buffers, auditoría) bajan la tasa por debajo del ruido sin tener que rechazar reservas.

**¿Qué hago si pasa una doble reserva?**
Reembolsa la segunda inmediatamente, manda tu plantilla de disculpa y ofrece buscarles una alternativa. La mayoría son comprensivos si la respuesta es rápida y el reembolso limpio. Un Huésped doble-reservado que espera 36 horas pondrá una estrella; uno que recibe respuesta en 30 minutos suele no dejar nada.

**¿Cambiar a un Channel Manager de pago lo arregla?**
En su mayoría, sí. Los Channel Managers que usan la API de partner de Airbnb más la connectivity API de Booking obtienen actualizaciones casi en tiempo real en ambos sentidos, y eso cierra la ventana iCal. Empiezan en 25–50 $ por propiedad y mes y asumen contratos largos. Los números cuadran a partir de ~20 propiedades o 90 % de ocupación.

**¿La lógica del día buffer cambia en invierno / temporada baja?**
Ligeramente. En baja puedes encogerlos porque el riesgo de rotación cae con el volumen; en alta haces lo contrario. Yo mantengo el mismo ajuste todo el año y asumo la imperfección. El coste cognitivo de retunear cada temporada supera la mejora.

## Una opinión sin filtros

Si eres Anfitrión con 1 a 3 propiedades preocupado por las dobles reservas, lo más útil que puedes hacer esta semana es **la regla del calendario canónico más la auditoría de 24 h**. Las dos son gratis. Las dos se montan en cinco minutos. Juntas pillan el 90 % de los fallos que las herramientas más sofisticadas dicen arreglar.

Las herramientas más sofisticadas (Channel Managers, suites PMS de pago) son reales y son lo correcto para grandes volúmenes. También son un impuesto que pagan los Anfitriones pequeños por un problema que podrían haber arreglado gratis con una nota adhesiva. Empieza por la nota.
