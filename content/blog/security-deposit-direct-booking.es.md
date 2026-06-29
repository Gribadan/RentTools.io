---
slug: security-deposit-direct-booking
locale: es
title: "Fianza para una reserva directa: bloqueo, no cobro"
excerpt: Una fianza en una reserva directa no es un cobro, sino un bloqueo en Stripe. La ventana de 7 días que se la come, el importe correcto y la trampa del chargeback.
status: published
tags:
  - host-tips:Consejos para anfitriones
  - pricing:Precios
  - tools:Herramientas
ogImageUrl: /blog-covers/security-deposit-direct-booking.webp
ogImageWidth: 1600
ogImageHeight: 900
---

La primavera pasada un huésped rompió la placa de cocina de vidrio en una reserva directa: una pieza de 190 $ más una hora de instalador. Fui a capturar la fianza que estaba seguro de haber tomado al reservar, tres semanas antes. No había nada que capturar. La preautorización había expirado en silencio a los siete días, dos semanas antes de que el huésped girara siquiera la llave, y no lo vi porque el panel seguía marcando «autorizado» hasta que entré y leí la letra pequeña. Los 190 $ los pagué de mi bolsillo. La mecánica de la fianza había funcionado exactamente como estaba diseñada. Yo era quien no había entendido cómo estaba diseñada.

Esta es la entrada que me hizo falta aquella semana: qué es de verdad una fianza en una reserva directa, por qué es un bloqueo y no un cobro, qué única ventana decide si está ahí en el momento que la necesita, y cómo una fianza mal tomada acaba en un chargeback que cuesta más que el daño.

## TL;DR

- Una fianza en una reserva directa es un **bloqueo (autorización)**, no un cobro: solo la captura si algo se rompe.
- Un bloqueo de Stripe con captura manual **expira a los 7 días**. Colóquelo 1 o 2 días antes de la entrada, nunca al reservar.
- Puede capturar una **parte** (la reparación real) y liberar el resto, pero nunca *más* de lo que bloqueó.
- No bloquee nada y no tendrá palanca; capture de forma agresiva y se gana un [chargeback](/blog/chargeback-direct-booking-dispute).
- Dimensiónela según su *peor incidente aislado realista*: **200–300 $** para un estudio estándar, más con mascotas o inmuebles de alto valor.
- Para la mayoría de anfitriones pequeños, la **tarjeta guardada** (cobrar solo si hay daño) o una **tarifa de daños no reembolsable** ganan al bloqueo.

## Por qué una plataforma nunca le hizo pensar en esto

Airbnb retiró la fianza de cara al huésped en 2019 y metió la protección en AirCover: un reembolso contractual, no un bloqueo que usted controle. Booking.com le deja fijar una «fianza por daños», pero la autorización corre por los raíles de la plataforma y se libera automáticamente en 7–14 días, salvo que marque el daño en la extranet. En ambos casos, la mecánica de pago no es suya. [Esto es lo que paga de verdad cada esquema de plataforma](/blog/airbnb-aircover-vs-booking-damage-deposit), con descuentos por desgaste incluidos.

El día que acepta una [reserva directa](/blog/direct-booking-website-math), todo eso desaparece. Sin AirCover, sin botón en la extranet, sin equipo de disputas. «Tomar una fianza» deja de ser una casilla y se convierte en algo que usted construye, normalmente sobre Stripe. Y lo primero que aprende es que la palabra «fianza» despista. No está recaudando dinero. Está poniendo un bloqueo.

## Un bloqueo no es un cobro, y su huésped tiene que saberlo

Esta es la mecánica peor entendida de la reserva directa, por anfitriones y por huéspedes.

Cuando pone una fianza de 400 $ a través de un procesador de pagos, lanza una **autorización** de 400 $. El banco comprueba que la tarjeta es válida y tiene fondos, y reduce el límite disponible del huésped en 400 $. No se mueve dinero. A su cuenta no llega nada. Es una reserva sobre su saldo, como la retención que pone un hotel o una gasolinera.

El dinero solo se mueve cuando usted **captura** la autorización, y eso solo lo hace si hay daño. Si no hay daño, deja que el bloqueo expire o lo cancela, y los 400 $ de margen vuelven a la tarjeta del huésped. No paga comisión, porque nunca se produjo un cobro. El porcentaje de Stripe se aplica solo a los importes capturados.

Aquí muerden dos cosas si se salta la comunicación con el huésped:

- **Un bloqueo igual se ve.** En la mayoría de tarjetas, una autorización de 400 $ aparece como una línea *pendiente* en el extracto, y el saldo disponible del huésped baja 400 $ mientras dura. Para un huésped no avisado, eso se lee como «me ha cobrado 400 $». El mensaje de pánico a las nueve de la noche está garantizado. Dígalo por escrito, antes de poner el bloqueo, que es una reserva reembolsable y desaparecerá sola.
- **Con tarjetas de débito es peor.** Muchos bancos tratan una autorización de débito como un cargo inmediato: retiran los 400 $ de la cuenta de verdad y los devuelven días después al liberar. Para un huésped que vive ajustado a su saldo, eso es un problema real. Tome las fianzas en tarjetas de crédito cuando pueda; para débito, valore un bloqueo más pequeño o una tarifa.

## La ventana de siete días que se comió mi fianza

Esta es la trampa que me costó la placa de cocina.

Un PaymentIntent de Stripe con captura manual —la forma estándar de poner un bloqueo— **sigue siendo capturable siete días**. Capture dentro de esa ventana y funciona. Deje que la ventana se cierre y Stripe cancela la autorización automáticamente; el bloqueo desaparece y no queda nada que capturar.

Mire ahora la línea de tiempo de una reserva normal. Un huésped reserva el día 1 para una estancia que empieza el 22. Si pone el bloqueo al reservar —que parece lo responsable— expira el día 8. Dos semanas enteras antes de la llegada, su fianza se evaporó en silencio. Un daño el día 23 no tiene nada detrás. Es exactamente lo que me pasó.

El arreglo es disciplina de calendario, no una fianza mayor:

- **Ponga el bloqueo 1 o 2 días antes de la entrada.** Lo bastante tarde para cubrir la estancia, lo bastante pronto para pillar una tarjeta rechazada antes de que el huésped esté en la puerta.
- **Capture (o libere) dentro de las 48 horas tras la salida.** Inspeccione, decida, actúe. No deje que el bloqueo corra hasta el séptimo día confiando en que llegará a tiempo.
- **Automatice el recordatorio.** Lo que lleve su calendario debería avisarle de poner el bloqueo la víspera de la llegada. Hacerlo de memoria es la forma segura de pagar la placa usted mismo.

Si sus estancias superan con regularidad las siete noches, un solo bloqueo no cubrirá toda la estancia de todos modos: la ventana expira a mitad. Ese es el caso en que la tarjeta guardada (más abajo) deja de ser opcional.

## Cuánto bloquear de verdad

El instinto es anclar la fianza al valor de todo lo que hay en la vivienda. Es el ancla equivocada. Nunca repondrá la vivienda entera con una sola fianza, y un bloqueo lo bastante grande para intentarlo espanta a los buenos huéspedes y choca con los límites de la tarjeta. Dimensiónelo según su **peor incidente aislado realista**: lo que de verdad sale mal, no la catástrofe para la que está el seguro.

| Tipo de inmueble | Daño aislado típico | Importe a bloquear |
| --- | --- | --- |
| Estudio estándar, sin mascotas | Mancha en el sofá, vidrio roto, llaves perdidas | 200–300 $ |
| 2–3 habitaciones, familiar | Lo anterior más electrodoméstico, reparación menor de pared | 300–500 $ |
| Admite mascotas | Alfombra, suelos rayados, limpieza a fondo | +150–250 $ adicionales |
| Alto valor / de diseño | Mobiliario llamativo, electrónica, arte | 500–1.000 $ |
| Riesgo de fiesta (grupo grande, festivo) | Sobreocupación, multas por ruido, limpieza tras fiesta | 1.000–2.000 $ |

Dos reglas de calibración. Primera: la fianza debe cubrir con holgura los eventos **del tamaño de una franquicia** —la mancha de 150 $, la placa de 190 $—, porque son los que pasan de verdad y de los que ningún seguro se va a ocupar. Segunda: mantenga la fianza por debajo de aproximadamente el **50 % del valor de la reserva** en una estancia normal; por encima, los huéspedes la leen como una señal de alarma y reservan el piso de al lado que no la pide.

## Capture exactamente lo que se rompió, y ni un céntimo más

Cuando hay daño, no captura todo el bloqueo. Captura la reparación.

Stripe permite una **captura parcial** de la autorización: 400 $ bloqueados, 190 $ capturados por la placa, y los 210 $ restantes se liberan automáticamente al huésped. Puede capturar menos de lo bloqueado, pero **nunca más**, y esa es la razón real de dimensionar el bloqueo según el peor caso, no según la media. Una sola captura; no hay segundo mordisco a la misma autorización.

Antes de capturar un solo dólar:

- **Fotografíe el daño con marca de tiempo**, a ser posible contra las fotos fechadas de la salida. Sin prueba fechada, una captura discutida se convierte en cara o cruz.
- **Indique el coste real**: la pieza, la mano de obra, el justificante. Una fianza es el reembolso de una pérdida real, no una multa. Capturar 400 $ por una reparación de 190 $ es la vía más rápida de convertir a un huésped en reclamante.
- **Escriba primero al huésped**, con las fotos y el importe, antes de capturar. La mayoría de huéspedes razonables aceptan 190 $ documentados. Casi ninguno acepta 400 $ silenciosos que descubre en el extracto.

La comisión (≈2,9 % + 0,30 $ en EE. UU., menor en tarjetas europeas) se aplica solo a lo capturado, así que capturar 190 $ le cuesta unos 5,80 $: un error de redondeo frente a la reparación.

## La trampa del chargeback

Aquí una fianza puede costar más que el daño. En el momento en que captura una autorización que el huésped disputa, entra en territorio de chargeback, y en una reserva directa **usted es el comercio (merchant of record)**, plenamente expuesto. El procesador retira el importe capturado más una comisión en el instante en que se abre la disputa, antes de que nadie lea su versión. La [guía completa de chargebacks para reservas directas](/blog/chargeback-direct-booking-dispute) la escribí aparte, pero dos puntos importan en especial para las fianzas:

- Una fianza capturada que un huésped disputa como «yo no autoricé esto» es **fraude amistoso**, y solo la gana con un contrato de reserva firmado que detalle la fianza, fotos fechadas del daño y prueba de la estancia. Reúna los tres antes de capturar, o no capture.
- Active **3-D Secure** en el pago original. Traslada la responsabilidad del fraude al banco emisor y hace que la disputa «yo nunca reservé esto» sea mucho más difícil de ganar contra usted.

La asimetría es toda la lección: una captura de 190 $ que no puede defender se convierte en una devolución de 190 $ más una comisión de disputa de 15 $ más el tiempo, y un ratio de disputas dañado con su procesador. Capture solo lo que pueda probar.

## Las dos alternativas más limpias

Para muchos anfitriones pequeños, un bloqueo reembolsable es más fricción y más riesgo del que justifica el daño esporádico. Dos alternativas que hoy uso más que el propio bloqueo:

**Tarjeta guardada, cobrar solo si hace falta.** En vez de autorizar un bloqueo, guarda la tarjeta del huésped al reservar (Stripe SetupIntent) con su consentimiento explícito, y cobra *fuera de sesión* solo si aparece un daño tras la salida. Sin ventana de siete días, sin bloqueo inquietante en el extracto, sirve para estancias largas. La pega: un cobro fuera de sesión con el huésped ya ido es la forma *más* expuesta al chargeback de recaudar, así que su contrato de reserva debe autorizarlo en lenguaje claro y necesita las mismas pruebas fotográficas. Menos fricción al entrar, más riesgo al salir.

**Una tarifa de daños no reembolsable.** Un importe fijo —normalmente 39–75 $— que el huésped paga al reservar en lugar de una fianza y que cubre daños accidentales hasta un tope. Es el modelo de la Property Damage Protection de Vrbo. Los huéspedes lo prefieren (sin bloqueo, sin golpe al saldo), es ingreso y no un pasivo, y aseguradoras externas (Superhog, Waivo y similares) administran la tarifa y pagan las reclamaciones a cambio de una parte por reserva. Pierde el efecto disuasorio de una fianza real, pero también pierde los tickets de soporte y la exposición al chargeback. Para una vivienda estándar por debajo de 250 $ la noche, la cuenta suele inclinarse hacia la tarifa.

## Un ejemplo resuelto, de principio a fin

Un huésped directo reserva 4 noches a 180 $: 720 $ más 60 $ de limpieza, 780 $ en total. Usted fija una fianza por daños de 300 $, declarada en el contrato de reserva firmado.

1. **Al reservar:** cobra los 780 $ de la estancia (con 3-D Secure activo) y guarda la tarjeta. El bloqueo **todavía no** lo pone.
2. **La víspera de la entrada:** pone una autorización de 300 $ con captura manual. Pasa; el huésped ve un bloqueo pendiente de 300 $ y su mensaje explicando que es reembolsable.
3. **Salida:** inspecciona ese mismo día. Una mancha de vino en la alfombra necesita una limpieza de 40 $.
4. **Captura 40 $**, envía al huésped la foto del justificante, y los 260 $ restantes se liberan. Comisión de la captura: unos 1,46 $.
5. **Resultado:** queda a la par con la alfombra, el huésped pierde 40 $ que acepta porque vio la prueba, y el bloqueo expiró como debía: capturado, documentado, sin disputa.

La versión en que sale mal es idéntica, salvo que puso el bloqueo al reservar el día 1, expiró el día 8, y el día de salida no había 300 $ que tocar. La misma fianza, el mismo huésped, la misma mancha, y los 40 $ los paga usted. Lo que decide no es el importe. Es el calendario.

## FAQ

**¿Puedo tomar una fianza en una reserva directa a través de Stripe?**
Sí. Pone un PaymentIntent con captura manual (un bloqueo-autorización) por el importe de la fianza y solo lo captura si hay daño. Es la forma estándar en que los anfitriones de reserva directa gestionan fianzas sin plataforma. La fianza va separada del pago de la estancia en sí.

**¿Cuánto dura un bloqueo de Stripe?**
Siete días en pagos con tarjeta. Después Stripe cancela la autorización automáticamente y el bloqueo desaparece. Por eso se pone uno o dos días antes de la entrada, no al reservar: un bloqueo puesto con semanas de antelación expira antes de que el huésped llegue.

**¿Un bloqueo cobra de la tarjeta del huésped?**
En una autorización no se mueve dinero. El límite disponible del huésped baja por el importe bloqueado y puede aparecer una línea pendiente en el extracto, pero a su cuenta no llega nada y no hay comisión hasta que captura. Si no hay daño, libera el bloqueo y el saldo vuelve.

**¿De cuánto debería ser la fianza de un alquiler vacacional?**
Dimensiónela según el peor incidente aislado realista, no según el valor de todo lo que hay en la vivienda. Un estudio estándar va de 200 a 300 $; las que admiten mascotas y las de alto valor justifican más. Manténgala por debajo de aproximadamente la mitad del valor de la reserva en una estancia normal, o los huéspedes la leen como una advertencia.

**¿Qué pasa si no capturo el bloqueo a tiempo?**
La autorización expira a los siete días y no queda nada que capturar: la fianza simplemente desaparece, sin cobro al huésped y sin dinero para usted. Si perdió la ventana y hay daño, su único recurso es un nuevo cobro fuera de sesión sobre una tarjeta guardada, que el huésped disputa con más facilidad.

**¿Puede el huésped disputar una fianza capturada?**
Sí, y en una reserva directa usted es el comercio, así que la disputa es suya. Una fianza capturada que el huésped impugna es fraude amistoso; la gana con un contrato de reserva firmado, fotos fechadas del daño y prueba de la estancia. Capture solo lo que pueda documentar, y solo el coste real de la reparación.

**¿Es mejor una tarifa de daños que una fianza?**
Para la mayoría de anfitriones pequeños, sí. Una tarifa no reembolsable (39–75 $) que el huésped paga al reservar elimina el bloqueo, la ventana de siete días y la mayor parte del riesgo de chargeback, y es ingreso en lugar de pasivo. Pierde el efecto disuasorio de una fianza real, pero gana muchos menos quebraderos de cabeza de soporte.

**¿Puedo bloquear una fianza en una tarjeta de débito?**
Puede, pero muchos bancos tratan una autorización de débito como una retirada inmediata y la devuelven días después, lo que aprieta de verdad a un huésped que vive ajustado a su saldo. Prefiera las tarjetas de crédito para los bloqueos; para huéspedes con débito, use un bloqueo menor, una tarifa o la tarjeta guardada.

## Una opinión con filo

Para un inmueble estándar por debajo de unos 250 $ la noche, renuncie por completo al bloqueo reembolsable. La ventana de siete días, los mensajes de pánico de los huéspedes, la exposición al chargeback y el día que olvida ponerlo cuestan, en conjunto, más que el daño esporádico que una fianza recupera de verdad. Reserve los bloqueos de verdad para mascotas, grupos grandes e inmuebles de alto valor, donde el riesgo es genuinamente grande, y para todo lo demás guarde la tarjeta, escriba una cláusula de daños clara en el contrato de reserva, y cobre solo cuando algo se rompe. Si está montando las reservas directas desde cero, [construya primero el resto del sistema](/onboard); la fianza es lo último que se atornilla, no lo primero.
