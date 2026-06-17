---
slug: chargeback-direct-booking-dispute
locale: es
title: "Contracargo en reserva directa: cómo el anfitrión gana la disputa"
excerpt: Un huésped disputó su reserva directa ante su banco. Los códigos de motivo, las pruebas que realmente ganan y los 15 € que usted paga gane o pierda.
status: published
tags:
  - host-tips:Consejos para anfitriones
  - pricing:Precios
  - booking-com:Booking.com
ogImageUrl: /blog-covers/chargeback-direct-booking-dispute.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Una huésped se marchó de mi apartamento, dejó una reseña de cinco estrellas y, 38 días después, disputó el cargo completo de 1.180 € ante su banco con el motivo «servicio no prestado». Stripe me retiró esos 1.180 € de la cuenta esa misma tarde, más 15 € de comisión por disputa, antes de que un solo humano leyera una línea de mi versión. Ese es el momento en que se aprende la dura verdad del directo: el día que deja de cobrar a los huéspedes a través de Airbnb, usted pasa a ser el comercio que cobra, y un contracargo deja de ser problema de la plataforma. Es suyo, y la baraja viene marcada.

Este es el manual para la disputa que no vio venir. Qué es de verdad un contracargo, los cuatro códigos de motivo que un anfitrión de alquiler de corta estancia realmente encuentra, qué pruebas ganan cada uno y la prevención que desactiva los casos imposibles de ganar antes de que arranquen.

## TL;DR

- En Airbnb la plataforma absorbe los contracargos. En reservas directas, **el comercio que cobra es usted** — sin red.
- Stripe retira el importe disputado **más 15 € de comisión** al abrirse la disputa. Los 15 € se pierden aunque gane.
- El titular de la tarjeta tiene unos **120 días** para disputar. Usted suele tener **7 a 21 días** para responder.
- El **fraude amistoso** (el huésped se alojó y luego disputó) se gana con los registros de entrada. El **fraude real**, casi nunca.
- Contrato de reserva firmado, coincidencia de identidad y registros de cerradura inteligente: las tres pruebas que ganan.
- **3-D Secure** traslada la responsabilidad del fraude al banco — actívelo y el contracargo por tarjeta robada deja de ser suyo.

## Por qué una reserva directa lo expone y una de plataforma no

Cuando un huésped reserva por Airbnb, el comercio que cobra es Airbnb. En el extracto del huésped aparece «Airbnb». Si lo disputa, la pelea es entre su banco y Airbnb — y Airbnb tiene un equipo antifraude, un departamento legal y una relación con las redes de tarjetas que absorbe el golpe. Usted se entera, como mucho, como una reserva cancelada. El contracargo nunca toca su cuenta.

Vaya por libre — su propia web, un enlace de pago de Stripe, un datáfono en la puerta — y ese colchón desaparece. En el extracto del huésped figura ahora *su* nombre comercial. El comercio que cobra es usted. Cuando el huésped disputa, su banco saca el dinero directamente de su saldo de Stripe, y es usted quien debe probar que el cargo era legítimo. Es el mayor coste oculto del directo, y por eso justamente el [cálculo de rentabilidad de la reserva directa](/blog/direct-booking-website-math) le dice que meta el riesgo de contracargo en el precio antes de celebrar la comisión ahorrada.

Aquí está la asimetría que escuece. Cuando se presenta un contracargo, Stripe carga de inmediato el importe disputado completo de su cuenta **más 15 € de comisión por disputa**. No hay periodo de gracia para responder primero: el dinero se va el primer día. Si gana la disputa semanas después, Stripe devuelve el importe disputado. Los 15 €, **no**. Esa comisión es el coste de tramitación del banco, y es suya gane o pierda. Así que incluso una victoria de manual en una reserva de 1.180 € le cuesta 15 € y cerca de una hora reuniendo pruebas. Una derrota cuesta 1.195 € y la estancia.

## Los cuatro códigos de motivo que un anfitrión ve de verdad

Cada contracargo lleva un código de motivo — la etiqueta de la red de tarjetas que explica por qué el titular disputa. Como anfitrión solo verá cuatro, y no se ganan todos igual de bien.

| Código de motivo (Visa) | Lo que afirma el huésped | Opciones reales de ganar |
|---|---|---|
| 13.1 — Servicio no prestado | «Nunca recibí la estancia que pagué» | Altas, con pruebas de entrada |
| 13.3 — No conforme a lo descrito | «El alojamiento no era el del anuncio» | Medias — dependen del anuncio y las fotos |
| 13.6 — Abono no procesado | «Cancelé y nunca me reembolsaron» | Altas, si la política se firmó |
| 10.4 — Fraude sin tarjeta presente | «Yo nunca hice este cargo» (tarjeta robada) | Casi nulas |

Los tres primeros son **fraude amistoso**: un huésped real que reservó de verdad y aun así disputa. Quizá olvidó el cargo, quizá su pareja vio el extracto, quizá intenta recuperar un dinero que la política de reembolso no le debe. Estos casos se ganan porque hay rastro escrito: una reserva, un contrato, una estancia que demostrablemente ocurrió.

El cuarto, 10.4, es **fraude real**: su alojamiento reservado con el número de una tarjeta robada. El titular legítimo de verdad nunca reservó, y cuando disputa, las reglas de la red de tarjetas le dan la razón casi en automático. No hay prueba que venza al «no fui yo» en una transacción sin tarjeta presente, porque la responsabilidad de los cargos no autorizados sin tarjeta recae en el comercio por defecto. Lo único que mueve esa responsabilidad es 3-D Secure — más sobre esto abajo.

## Tres disputas reales y lo que cuesta cada una

Los números hacen tangible la asimetría. Aquí van tres disputas que un anfitrión puede pillar de forma realista en un año, con el dinero que de verdad está en juego.

| Escenario | Código | Sus pruebas | Resultado probable | Coste neto |
|---|---|---|---|---|
| El huésped se aloja 4 noches y disputa 38 días después negando la estancia | 13.1 | Contrato firmado, registros de cerradura inteligente, hilo de mensajes, registro de conexión Wi-Fi | **Victoria** | 15 € de comisión |
| Tarjeta robada para reservar un fin de semana de 800 €; el titular real disputa | 10.4 | Ninguna que cuente — el cargo no fue autorizado | **Derrota** | 815 € |
| El huésped cancela dentro de la ventana gratuita y usted reembolsa el 50 % según su política más estricta | 13.6 | Política de cancelación firmada, justificante de reembolso, marca de tiempo | **Victoria** | 15 € de comisión |

El escenario uno es la disputa que perdí la primera vez y gané la segunda — no porque cambiaran los hechos, sino porque la segunda vez tenía los registros de entrada. El escenario dos no se gana con pruebas; se gana no aceptando nunca la reserva de un modo que le deje a usted la responsabilidad. El escenario tres se decide por completo según si el huésped firmó su política de cancelación antes de pagar. Si lo hizo, el banco ve un contrato aceptado y falla a su favor. Si su política dormía en un PDF que nadie pulsó, pierde una pelea que debería haber ganado.

El patrón: dos de las tres se ganan o se pierden **antes de que la disputa siquiera se presente** — en el momento de la reserva, en las pruebas cuya captura dejó preparada. La disputa formal es solo el momento de cobrar la preparación.

## Las pruebas que de verdad ganan una disputa

Cuando disputa un contracargo (el término técnico es *representment*: «vuelve a presentar» el cargo al banco emisor con pruebas), no discute con el huésped. Entrega un expediente a un analista del banco que tiene 90 segundos y una lista de control. La protesta vaga pierde. La prueba concreta, fechada y verificable por un tercero gana. Las cuatro piezas que mueven la aguja:

- **Un contrato de reserva firmado.** No un correo de confirmación — un documento que el huésped aceptó activamente, con fechas, total, alojamiento y condiciones de cancelación. Una firma electrónica con marca de tiempo e IP del huésped vale oro. Es lo de mayor peso que puede reunir, y se reúne en la reserva, no después de la disputa. Todo esto vive en el flujo de los [formularios del huésped antes de la llegada](/blog/pre-arrival-guest-forms).
- **La prueba de que la estancia ocurrió.** Registros de cerradura inteligente que muestran la puerta abierta con el código que usted envió. Registros del router con un dispositivo conectado. Un registro de acceso por teclado. Están fechados, son difíciles de falsificar y refutan directamente el «servicio no prestado». Un huésped que disputa una estancia en la que entró físicamente queda contradicho por su propio teléfono al conectarse a su red.
- **El hilo de mensajes.** El historial completo — confirmación de reserva, instrucciones de entrada, el «gracias, todo genial» de la salida. Un huésped que le da las gracias el día cuatro y disputa el día cuarenta le ha servido la contradicción él mismo.
- **Los datos de autorización originales.** El resultado AVS (verificación de dirección) y la coincidencia del CVC del momento del cobro. Una dirección de facturación y un CVC que coinciden le dicen al banco que el titular estaba presente en la compra — lo que desmonta una acusación de fraude de raíz.

Entregue todo como un expediente claro con un resumen de dos frases: *el huésped reservó el X, aceptó las condiciones (adjuntas), entró físicamente en el alojamiento el Y (registros adjuntos) y nos escribió el Z. El cargo es válido.* Los bancos premian la concisión respaldada por documentos. Ignoran las redacciones.

## Cómo responder: el procedimiento de disputa y el reloj

El reloj es lo que los anfitriones hacen mal. Importan dos plazos, y pertenecen a partes distintas.

Primero, la ventana del huésped: por las reglas de Visa y Mastercard, el titular suele tener hasta **120 días** desde la transacción (o desde la fecha de servicio prevista) para presentar la disputa. Por eso un contracargo puede llegar más de un mes después de la salida y parecer salido de la nada — cabe de sobra en la ventana.

Segundo, *su* ventana: una vez presentada la disputa, Stripe muestra un **plazo de respuesta, normalmente de 7 a 21 días**, para entregar sus pruebas. Si lo pierde, pierde en automático — sin pruebas, derrota inmediata. Tras su entrega, el banco emisor se toma su tiempo: un fallo puede tardar **60 a 75 días**. Una sola disputa puede quedar abierta dos o tres meses mientras su dinero duerme en el banco.

El procedimiento, por orden:

1. **No reembolse en caliente.** Si reembolsa cuando ya hay un contracargo presentado, puede pagar dos veces — el contracargo *y* el reembolso — porque circulan por vías separadas. Resuélvalo por una sola vía, nunca por ambas.
2. **Lea primero el código de motivo.** Le dice qué pruebas importan. Un 13.1 pide registros de entrada; un 13.6 pide su política de cancelación. Entregar el expediente equivocado para el código es un disparo al aire.
3. **Monte el expediente** — contrato, prueba de estancia, hilo de mensajes, datos de autorización — y redacte el resumen de dos frases.
4. **Entregue antes del plazo de Stripe** y luego espere los 60 a 75 días del fallo bancario.

Un matiz que conviene conocer: las reglas **Compelling Evidence 3.0** de Visa permiten a un comercio desactivar por adelantado una disputa por fraude mostrando dos transacciones anteriores no disputadas del mismo titular, enlazadas por datos coincidentes como la IP o el dispositivo. Para un anfitrión que ve a la mayoría de sus huéspedes una sola vez, eso rara vez aplica — pero si un huésped recurrente disputa, es una opción real.

## Prevención: las disputas que ahoga antes de que nazcan

La tasa honesta de disputas ganadas en el turismo ronda el **20 a 40 %**, y el fraude real tira del promedio hacia abajo porque, de hecho, no se puede ganar. Las cuentas lo dicen: la prevención le gana al pleito siempre. Cuatro palancas hacen casi todo el trabajo:

- **Active 3-D Secure.** Cuando un huésped autentica un pago sin tarjeta presente vía 3DS (el paso «confirme esta compra» del banco), **la responsabilidad de los contracargos por fraude pasa de usted al banco emisor**. ¿Ese escenario de tarjeta robada que no puede ganar con pruebas? Con 3DS lo absorbe el banco, no usted. Para reservas directas es el ajuste más valioso que puede activar, y Stripe puede exigir 3DS automáticamente en pagos de riesgo.
- **Exija coincidencia de AVS y CVC.** Rechace los pagos donde la dirección de facturación o el CVC no coincidan. Un defraudador con un número de tarjeta robada a menudo no tiene el código postal de facturación. Eso filtra parte del fraude real en la puerta.
- **Haga que el huésped firme sus condiciones.** Un acuerdo de cancelación y normas de la casa, aceptado activamente antes del pago, convierte un «su palabra contra la mía» del 13.6 en un contrato que el banco puede leer. Sin firma, no hay defensa.
- **Tome una fianza o preautorización, no recargue después.** Los cargos sorpresa sobre una tarjeta son cebo de contracargo. Capture una fianza clara por adelantado; si hay que cubrir un daño, eso es una conversación, no un recobro silencioso. Aquí también demuestra su valor la protección del lado de la plataforma — [AirCover frente a la fianza de Booking.com](/blog/airbnb-aircover-vs-booking-damage-deposit): quien va por libre carga ese riesgo solo.

El hilo conductor: un contracargo se decide por lo que dejó montado en la reserva, no por la vehemencia con que argumente después. Capture el contrato, capture los registros de acceso, autentique la tarjeta — y las únicas disputas que pierde son los raros fraudes reales, que 3-D Secure le entrega al banco de todos modos. Tener cada reserva, cada contrato y cada registro de entrada en un solo lugar para montar el expediente en diez minutos en vez de una tarde es justo para lo que sirve un panel operativo único: [reúna reservas y datos de huéspedes en una sola vista](/onboard) antes de necesitarlos para una pelea.

## FAQ

**¿Puede un huésped hacer un contracargo de un alquiler vacacional o una reserva directa?**
Sí. En cuanto un huésped le paga directamente — su web, un enlace de Stripe o un datáfono — puede disputar ese cargo ante su banco, y es usted, el comercio que cobra, quien debe defenderlo. En Airbnb o Vrbo la plataforma es el comercio y absorbe la disputa; es una de las cosas que paga su comisión. El directo cambia esa protección por la comisión ahorrada.

**¿Se retira el dinero de inmediato cuando se presenta un contracargo?**
Sí. Con Stripe, el importe disputado más 15 € de comisión por disputa se cargan del saldo en el momento de abrir la disputa, antes incluso de que responda. Si gana la disputa, Stripe devuelve el importe disputado — pero los 15 € nunca. Una victoria le cuesta igualmente 15 € y su tiempo; una derrota, el total de la estancia más esos 15 €.

**¿Cómo gano un contracargo como anfitrión?**
Entregue al banco emisor un expediente de pruebas compacto: un contrato firmado por el huésped, la prueba de que la estancia ocurrió (registros de cerradura inteligente, conexiones Wi-Fi, registros de acceso), el hilo de mensajes con el agradecimiento de la salida y la coincidencia AVS/CVC del pago. Ajuste las pruebas al código de motivo, escriba un resumen de dos frases y entregue antes del plazo de Stripe. Los documentos concretos y fechados ganan; las redacciones emocionales pierden.

**¿Cuánto tiempo tiene un huésped para disputar un cargo?**
Por lo general hasta 120 días desde la transacción o la fecha de servicio prevista, según las reglas de Visa y Mastercard. Por eso un contracargo puede llegar más de un mes después de la salida. Una vez presentado, su ventana es mucho más corta — 7 a 21 días para entregar las pruebas — y el fallo final del banco puede tardar otros 60 a 75 días.

**¿Merece la pena 3-D Secure para reservas directas?**
Para la mayoría de anfitriones, sí. Cuando un huésped autentica el pago vía 3-D Secure, la responsabilidad de los contracargos por fraude pasa de usted al banco emisor. Eso neutraliza el único tipo de disputa que no puede ganar con pruebas — el «yo nunca hice este cargo» de la tarjeta robada. El precio es algo más de fricción al pagar, pero en reservas de mayor valor esa protección compensa.

**¿Basta con tomar una fianza para evitar contracargos?**
Una fianza ayuda con los daños, no con los contracargos directamente — el huésped también puede disputar el cargo de la fianza. Lo que de verdad previene disputas es autenticar la tarjeta (3DS, AVS, CVC) y tener un acuerdo firmado. Tome la fianza como una preautorización clara y aceptada por adelantado, no como un cargo sorpresa posterior, porque los cargos sorpresa son en sí un desencadenante frecuente de contracargo.

**¿Qué pasa si reembolso a un huésped después de que presente un contracargo?**
Puede pagar dos veces. Reembolso y contracargo circulan por vías separadas, así que reembolsar un cargo que ya está en disputa puede hacer que el dinero salga de su cuenta por ambas. Elija una vía: deje que el proceso de disputa lo resuelva, o — si le da la razón al huésped — resuélvalo a través de la disputa, no con un reembolso paralelo.

## Una opinión sin rodeos

El primer contracargo perdido enseña que el directo no es solo un ahorro de comisión — es un traspaso de riesgo de la plataforma a usted, y la mayoría de anfitriones nunca meten ese traspaso en el precio. La solución no es temer las reservas directas; es tratar cada cobro directo como una transacción que quizá tenga que defender por escrito dos meses después. Autentique la tarjeta, haga que el huésped firme algo, capture los registros de la puerta y guárdelo todo en un mismo sitio. Hágalo y los únicos contracargos que pierda serán los fraudes reales — y de la mayoría se encarga el banco gracias a 3-D Secure. El anfitrión que trata el contrato de reserva como papeleo opcional es el anfitrión que financia el fin de semana gratis de un desconocido y paga 15 € por el gusto.
