---
slug: direct-booking-website-math
locale: es
title: "Web de reserva directa: cuándo compensa esquivar la comisión de las OTA"
excerpt: Un P&L trabajado: la comisión de Airbnb que paga el anfitrión frente al 3 % de Stripe en directo — y la tasa de huéspedes recurrentes que decide si su web compensa.
status: published
tags:
  - host-tips:Consejos para anfitriones
  - pricing:Precios
  - tools:Herramientas
  - booking-com:Booking.com
ogImageUrl: /blog-covers/direct-booking-website-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Monté mi primera página de reserva directa para «esquivar el 15 % de comisión de Airbnb». Tres meses y cuarenta reservas después hice el P&L de verdad y descubrí algo que ningún foro de anfitriones me había contado: con el modelo de tarifas por defecto de Airbnb, la comisión que esquivaba era sobre todo la del *huésped*, no la mía. En una reserva de 600 $ me quedaban casi los mismos 582 $ — tanto por Airbnb como por mi propio enlace de Stripe. El huésped ahorraba 85 $. Yo, treinta centavos.

Ahí empezó a entenderse dónde una web de reserva directa gana dinero de verdad — y dónde solo traslada un descuento del bolsillo de la plataforma al del huésped. La respuesta depende de dos cifras que la mayoría de anfitriones nunca separa: con qué modelo de tarifas opera su plataforma, y qué parte de sus reservas viene de huéspedes recurrentes y recomendaciones. Aquí está todo el cálculo.

## TL;DR

- Con el modelo de **tarifa compartida** de Airbnb, pasarse al directo no le aporta casi nada al *anfitrión*: el ~14 % de tarifa de servicio lo paga el huésped, no usted. El ahorro va al bolsillo del huésped.
- Con la **tarifa solo del anfitrión** (Airbnb) y el **15 % de Booking.com**, la comisión la asume el anfitrión — ahí el directo ahorra dinero de verdad: unos **72 $ en una reserva de 600 $**.
- Una reserva directa por Stripe cuesta **2,9 % + 0,30 $** (unos **18 $ en 600 $**); las tarjetas del EEE salen más baratas, ~1,5 %.
- Todo lo decide su **tasa de recurrentes y recomendaciones**. Captar a un desconocido con publicidad cuesta **50–150 $ por reserva** — a menudo más que la comisión ahorrada.
- Una herramienta de web de pago (~**480 $/año**) se amortiza en torno a **7 reservas/año con comisión del anfitrión**. Por debajo: use una página gratuita.
- Al pasar al directo pierde **AirCover, la protección frente a contracargos y la confianza de la plataforma** — inclúyalos antes de celebrar la comisión ahorrada.

## Qué le cuesta de verdad la comisión de las OTA

Cada anfitrión cita la comisión como una sola cifra. En realidad son dos cifras completamente distintas según el modelo de tarifas, y esa diferencia es toda la cuestión.

Pasemos una sola reserva por cada modelo: un alojamiento a 150 $/noche, 4 noches, **600 $ sin tarifas**.

| Canal | Modelo de tarifa | El anfitrión recibe | El huésped paga |
|---|---|---|---|
| Airbnb (tarifa compartida) | 3 % anfitrión + ~14 % huésped | 582 $ | ~685 $ |
| Airbnb (tarifa solo del anfitrión) | 15 % anfitrión, 0 % huésped | 510 $ | 600 $ |
| Booking.com | 15 % anfitrión (+ ~1,1 % pagos) | 504–510 $ | 600 $ |
| Vrbo (pago por reserva) | 5 % + 3 % procesamiento | 552 $ | 600 $ |
| Directo (Stripe, tarjeta de EE. UU.) | 2,9 % + 0,30 $ | 582 $ | 600 $ |

Mire la primera fila y la última. Con el modelo de **tarifa compartida** de Airbnb — todavía el predeterminado para la mayoría de anfitriones independientes no conectados por software — el anfitrión recibe **582 $**. Una reserva directa por Stripe deja **582,30 $**. Para el anfitrión es la misma cifra. Lo que «esquivaría» al pasarse al directo son los **85 $ que pagó el huésped** por encima, no un coste que usted soportara.

Ahora las filas de tarifa solo del anfitrión y Booking.com. Ahí el anfitrión recibe **510 $**, y la reserva directa deja **582 $** — un ahorro real de **72 $ por reserva**. Ese es el hueco que vale la pena perseguir.

Así que la primera pregunta no es «¿debo aceptar reservas directas?». Es «¿en qué modelo de tarifas estoy?». Compruébelo en el desglose de su pago de Airbnb: si el huésped ve una línea de «tarifa de servicio», está en tarifa compartida, y la comisión del lado del anfitrión que recuperaría es mínima. Si no hay tarifa de servicio del huésped y su pago queda ~15 % por debajo del total de noches, está en tarifa solo del anfitrión — y ahí el directo tiene margen real. La mayoría de alojamientos conectados por software y la mayoría de anuncios en la UE están en tarifa solo del anfitrión, lo haya notado el anfitrión o no.

## El lado de Stripe: lo que de verdad deja una reserva directa

La tarifa estándar de Stripe es **2,9 % + 0,30 $** por cobro con éxito en EE. UU. En 600 $ son **17,70 $**. En el EEE, las tarjetas de la misma región cuestan en torno a **1,5 % + 0,25 €**, así que un anfitrión europeo con huéspedes europeos paga más bien **9–10 $** en la misma reserva. Las tarjetas extranjeras suman alrededor de **1,5 %**, y la conversión de divisa otro **1–2 %** — conviene saberlo si su huésped paga en una moneda distinta a su pago.

Dos costes que el consejo de «usa Stripe y ya» se calla:

- **Fianzas y preautorizaciones.** Si sustituye la protección de la plataforma por una fianza reembolsable, Stripe cobra la comisión al capturarla, sobre el importe realmente cargado. Una preautorización que luego libera no cuesta nada — es el patrón correcto para la mayoría de estancias.
- **Los reembolsos no devuelven la comisión.** Stripe se queda los 0,30 $ (antes también el porcentaje; ahora lo devuelve en reembolsos totales). Una reserva que se cancela y se rehace dos veces ha pagado a Stripe tres veces.

En neto: en directo por Stripe el anfitrión recibe **~582 $ de 600 $** con tarjetas de EE. UU. y **~590 $** con tarjetas internas del EEE. El procesamiento es realmente barato. La parte cara de la reserva directa nunca es el carril de pago — es llevar al huésped a su página.

## La cifra que lo decide todo: su tasa de recurrentes y recomendaciones

Aquí está la trampa. Un anfitrión lee «ahorra el 15 %», monta una web, lanza anuncios de Google sobre «alquiler vacacional [ciudad]» y espera. El clic cuesta **0,80–2,50 $**, la página de destino convierte al **1–3 %**, así que el **coste total de captar una reserva directa de un desconocido frío es de 50–150 $** — acaba de gastar la comisión que quería ahorrar. Y lo hizo *sin* el muro de reseñas de la plataforma, su mediación en disputas ni la verificación del huésped.

Captar desconocidos fuera de la plataforma es, para casi cualquier anfitrión pequeño, un mal negocio. La OTA hace muy bien algo que usted no sabe hacer: poner su alojamiento delante de un viajero que jamás ha oído hablar de usted, justo en el momento en que está listo para pagar. Esa presentación es lo que compra la comisión.

Las reservas directas que de verdad ganan dinero son las de **coste de captación cero**:

- **Huéspedes recurrentes.** Alguien que ya se alojó y lo adoró. Recaptarlo en Airbnb es pagar la comisión por segunda vez por un huésped que ya tenía.
- **Recomendaciones.** Su amigo, que llega confiando de antemano porque una persona real respondió por usted.
- **Su propia audiencia.** Un alojamiento con Instagram, una lista de correo de huéspedes, una tarjeta de «la próxima vez reserve directo» en la encimera.

Para esos huéspedes, el canal directo es margen puro: 72 $ ahorrados (tarifas solo del anfitrión/Booking) en reservas que de otro modo pagaría a precio completo para volver a ganar. Su tasa de recurrentes y recomendaciones *es* su potencial de reserva directa. Todo lo demás es gasto publicitario disfrazado de ahorro.

Tasas típicas por tipo de alojamiento, según lo que veo en los anfitriones con quienes trabajo: un **estudio urbano de paso ronda el 5–10 % de recurrentes** (sobre todo viajeros de trabajo), un **2 dormitorios en la playa el 15–25 %** (familias de vacaciones anuales), una **cabaña en destino el 30–40 %** (los mismos esquiadores cada febrero). La cabaña es donde el directo imprime dinero. El estudio urbano es donde un embudo directo lo pierde en silencio.

## Una amortización trabajada: gratis vs herramienta de web de pago

Una web de reserva directa integrada — Lodgify, Hostfully, Uplisting — cuesta en torno a **40 $/mes, ~480 $/año**, a veces más un 1–2 % por reserva directa. La vía gratuita (un feed iCal público para que el calendario no mienta, más un enlace de pago de Stripe o un formulario de reserva de una página) cuesta **0–50 $/año**.

Amortización de la herramienta de pago, a 72 $ ahorrados por reserva con comisión del anfitrión:

| Alojamiento | Reservas/año | Directo (recur.+reco) | Ahorro/año | Veredicto de pago |
|---|---|---|---|---|
| Estudio urbano (compartida, 7 % recur.) | 90 | ~6 | ~0 $* | No — el ahorro es del huésped |
| 2 dorm. playa (mucho Booking, 20 %) | 60 | ~12 | ~864 $ | Al límite — la vía gratuita deja más |
| Cabaña (tarifa anfitrión, 35 %) | 40 | ~14 | ~1008 $ | Sí — se amortiza ~2×, la vía gratuita es beneficio puro |

*El matiz del estudio es el hallazgo de la tarifa compartida de arriba: incluso con 6 reservas directas, si la alternativa era Airbnb en tarifa compartida, el ahorro del anfitrión es casi cero. El movimiento correcto ahí no es una web propia — es dejar el anuncio en Airbnb y aprovechar que la tarifa la paga el huésped, no usted.

El patrón: una herramienta de web **de pago** necesita unas **7 reservas con comisión del anfitrión al año** solo para cubrir su propio coste. La mayoría de anfitriones por debajo de 5 alojamientos nunca lo alcanzan solo con volumen directo — por eso la **vía gratuita gana** para casi todos salvo un alojamiento de destino con fuerte recurrencia. No necesita una web de 480 $ para mandarle un enlace de Stripe a un huésped anterior. El cálculo de amortización paralelo de la herramienta que sincroniza todo esto está en [la amortización de un channel manager](/blog/channel-manager-break-even-math) — misma forma, otra cifra.

## Los costes ocultos que nadie incluye

La comisión ahorrada es la cifra visible. Estos son los invisibles, y al menos dos me han costado dinero de verdad.

- **Sin AirCover.** La garantía de hasta 3 M$ de Airbnb no acompaña al huésped a su reserva directa. La sustituye por una fianza reembolsable (limita su riesgo a la fianza) o un seguro de alquiler vacacional (**500–1500 $/año**). En una reserva directa, el televisor roto es enteramente su problema. La comparación completa de lo que paga de verdad cada esquema de protección está en [AirCover frente a la fianza de Booking.com](/blog/airbnb-aircover-vs-booking-damage-deposit).
- **Contracargos.** Este es el que muerde. Un huésped que disputa el cobro con su banco le pone a *usted* contra una red de tarjetas con pruebas endebles y una **comisión de contracargo de 15 $** — gane o pierda. Airbnb absorbe ese riesgo en la plataforma; Stripe no. Una tarifa no reembolsable más un contrato de reserva claro y firmado es su única defensa.
- **Confianza y reseñas.** Un desconocido no pondrá 600 $ en una página de reserva sin nombre y sin muro de reseñas. Por eso mismo los anuncios fríos convierten al 1–3 %: la confianza que le alquila la OTA es real. El directo solo convierte tráfico *templado* — gente que ya confía en usted.
- **Cumplimiento y administración.** Ahora usted es el vendedor a efectos legales. Facturas con impuestos, gestión de reembolsos, [registro de huéspedes](/blog/guest-registration-laws-short-term-rental) y cobro del impuesto turístico que antes hacía la plataforma — todo suyo. Calcule una hora por reserva directa hasta que tenga plantillas.

Súmelo y el ahorro honesto por reserva directa es **72 $ menos** una parte para seguro, riesgo de contracargo y tiempo de administración — llámelo un real **40–55 $** en tarifas solo del anfitrión/Booking, y todavía en esencia **cero** en la tarifa compartida de Airbnb.

## Cómo lo gestiono yo en la práctica (el híbrido)

No llevo una operación solo de directo, y no creo que la mayoría de anfitriones deba. El montaje que funciona:

1. **Mantener cada anuncio en las OTA activo.** Son mi canal de captación. Todo desconocido me descubre ahí, y pago con gusto el peaje por conocerlo una vez.
2. **Convertir la relación, no la reserva.** A un huésped claramente contento le llega durante la estancia un discreto «a los huéspedes recurrentes los tomamos directo, así se hace» — una tarjeta, un correo, una línea en el mensaje de salida. Nada de guerra de descuentos en la plataforma, que además incumple las normas.
3. **Hacer la vía directa gratis y sin fricción.** Un feed iCal público mantiene el calendario directo sincronizado con las OTA, así nunca me reservo doble a mí mismo. Un enlace de pago de Stripe más un contrato de una página cierran la reserva. Coste total de herramientas: cercano a cero.
4. **Repartir el ahorro en tarifas solo del anfitrión/Booking.** Ofrézcale al huésped recurrente un **5 % de descuento** sobre la tarifa directa. Aun así le gana a la tarifa de servicio de la OTA, y yo aun así recibo más de lo que habría pagado la plataforma. Ganan ambas partes; solo la plataforma se queda sin comisión.
5. **Nunca anuncios para perseguir desconocidos en directo.** Esa es la línea. La captación en frío es el trabajo de la plataforma, y lo hace mejor de lo que jamás lo hará mi presupuesto de publicidad.

La sincronización de calendario que hay debajo de todo esto — feeds de las OTA más reservas directas más días buffer de limpieza, todo en un sitio para que el canal directo no provoque una reserva doble — es exactamente lo que hace [RentTools](/onboard), gratis y de código abierto. La web de reserva directa es opcional; el calendario que evita que reviente, no.

## FAQ

**¿Compensa una web de reserva directa a un anfitrión pequeño?**
Solo con una base real de recurrentes o recomendaciones. Para un alojamiento con un 30 %+ de retorno (cabañas de destino, estancias largas de trabajo), un canal directo para precisamente esos huéspedes es muy rentable, porque el coste de captación es cero. Para un estudio urbano de paso al 5–10 % de recurrentes, un embudo directo suele costar más en herramientas y administración de lo que ahorra. Lo que decide es su tasa de recurrentes, no su volumen de reservas.

**¿Cuánta comisión le cobra Airbnb realmente al anfitrión?**
Depende del modelo de tarifas. En el modelo compartido, el anfitrión paga en torno al 3 % y el huésped una tarifa de servicio de ~14 % por encima. En el modelo de tarifa solo del anfitrión, el anfitrión paga alrededor del 15 % y el huésped ninguna tarifa de servicio. Mire su desglose de pago: una «tarifa de servicio» visible para el huésped significa modelo compartido, y su coste real como anfitrión es pequeño.

**¿Ahorro pasándome al directo si estoy en la tarifa compartida de Airbnb?**
Apenas. En tarifa compartida, el anfitrión recibe en una reserva directa por Stripe más o menos lo mismo que en Airbnb, porque la tarifa grande la pagaba el huésped, no usted. Pasarse al directo regala ese ahorro sobre todo al huésped. Solo tiene sentido si sube su tarifa directa para capturar parte de lo que el huésped ahorra, o si construye una relación con el huésped en lugar de recortar un coste.

**¿Qué procesador de pagos debo usar para las reservas directas?**
Stripe es la opción por defecto para la mayoría de anfitriones: 2,9 % + 0,30 $ por cobro en EE. UU., más barato con tarjetas internas del EEE. Gestiona el cumplimiento PCI, las preautorizaciones para fianzas y los reembolsos. PayPal y Square son alternativas con tarifas parecidas. Elija lo que elija, use preautorizaciones en vez de cobrar fianzas por adelantado, y nunca guarde números de tarjeta usted mismo.

**¿Cómo me protejo sin AirCover en una reserva directa?**
Dos capas. Primero, una fianza reembolsable como preautorización de Stripe, dimensionada al peor caso realista (150–500 € para un apartamento). Segundo, un seguro de alquiler vacacional (500–1500 $/año) para daños por encima de la fianza. Un contrato de reserva firmado con una cláusula de daños clara es lo que hace exigible cualquiera de las dos. Cambia la garantía de la plataforma por sus propios papeles.

**¿No perderé las reseñas y la confianza de Airbnb sobre las que se sostienen las reservas?**
Para desconocidos, sí — y por eso precisamente no debe perseguir desconocidos en directo. La confianza que aporta el muro de reseñas de la OTA convierte al visitante frío. El directo funciona para huéspedes que ya confían en usted: clientes anteriores y sus recomendaciones. Mantenga sus anuncios en las OTA para el descubrimiento y la reputación; use el directo solo para las relaciones templadas que ya se ha ganado.

**¿Puedo tener problemas con Airbnb por llevarme huéspedes en directo?**
No puede promocionar su web ni solicitar reservas fuera de la plataforma *dentro de la mensajería de Airbnb* antes de una estancia — incumple las normas y puede hacer que marquen sus mensajes o penalicen su cuenta. Lo que sí vale: un huésped que ya se alojó y le contacta después, o una tarjeta dejada en el alojamiento. Mantenga la conversión fuera de los canales de la plataforma y después de la reserva, no dentro del hilo de Airbnb.

**¿Cuál es la forma más barata de empezar a aceptar reservas directas?**
Un feed iCal público para mantener el calendario sincronizado entre canales, más un enlace de pago de Stripe y un contrato de reserva de una página que envía por correo. Total: menos de 50 $/año, a menudo 0 $. No necesita una web alojada de 480 $/año hasta que su volumen directo cubra su coste — lo que, para la mayoría de anfitriones por debajo de 5 alojamientos, no ocurre nunca. Empiece gratis y mejore solo cuando los números lo digan.

## Una opinión sin rodeos

La OTA no es su enemiga y la comisión no es un robo. Es el precio de una presentación a un desconocido que de otro modo nunca le habría encontrado — y un precio justo, porque captar a ese mismo desconocido usted mismo saldría más caro y con peor conversión. El error no es pagar la comisión. El error es pagarla *dos veces* por el mismo huésped.

Así que construya la vía directa más barata posible para los huéspedes que ya ganó, mantenga cada anuncio activo para los que aún no tiene, y no gaste un dólar en publicidad para arrancar a un viajero frío de la plataforma y ahorrar una comisión que, la mitad de las veces, ni siquiera pagaba. La reserva directa es una herramienta de fidelización, no un canal de captación. Los anfitriones que lo entienden se quedan en silencio unos miles de más al año. Los que no, montan una web, lanzan anuncios y se preguntan por qué «esquivar el 15 %» los dejó más pobres.
