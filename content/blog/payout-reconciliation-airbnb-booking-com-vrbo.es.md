---
slug: payout-reconciliation-airbnb-booking-com-vrbo
locale: es
title: "Conciliación de pagos: ¿le han pagado de verdad cada reserva?"
excerpt: Airbnb, Booking.com y Vrbo pagan en neto, por lotes y con compensaciones. Una conciliación mensual de 30 minutos y los cinco agujeros que destapa.
status: published
tags:
  - host-tips:Consejos para anfitriones
  - airbnb:Airbnb
  - booking-com:Booking.com
  - taxes:Impuestos
ogImageUrl: /blog-covers/payout-reconciliation-airbnb-booking-com-vrbo.webp
ogImageWidth: 1600
ogImageHeight: 900
---

En mi primer año como anfitrión encontré una tarjeta virtual de Booking.com 41 días después de que el huésped se marchara. Tres noches, 290 €, sin cobrar. Para entonces la tarjeta había caducado, el soporte para partners no pudo reactivarla y la estancia por la que yo había limpiado, lavado la ropa de cama y escrito una reseña me dejó exactamente cero. Mientras tanto, el saldo de mi cuenta parecía normal: alrededor habían entrado otros doce pagos.

Ese es el problema de «he mirado el banco y todo cuadra». Las plataformas pagan en neto, por lotes, a veces con semanas de retraso, y descuentan sin avisar el reembolso de este mes de una estancia del mes siguiente. La única forma de saber que le han pagado cada noche que ha alojado es emparejar cada reserva con el dinero que generó. Con dos apartamentos me lleva 30 minutos al mes, y en mi peor mes la conciliación encontró unos 570 $.

## TL;DR

- El saldo del banco no dice si cada estancia se cobró. La conciliación, sí.
- Tres columnas por estancia: reservado (bruto), esperado (neto), recibido.
- La clave para emparejar es el número de confirmación. Está en todo informe.
- Cada semana, 10 minutos para plazos: tarjetas virtuales, daños, no-shows.
- Cada mes, 30 minutos para importes, antes de que cierre el extracto de Booking.
- Casi nunca aparece nada. Un mal mes paga años de costumbre.

## Por qué el saldo del banco no dice si le han pagado

Un extracto bancario es una lista de transferencias. Un calendario de reservas es una lista de estancias. Casi nunca coinciden una a una, por cuatro motivos.

**Neto, no bruto.** Airbnb transfiere el subtotal del anfitrión menos su comisión: un 3 % con la comisión dividida y en torno al 15 % cuando la paga solo el anfitrión. Payments by Booking.com transfiere la estancia menos una comisión del 15 % (más con Genius o Preferred Partner) y una tarifa de pago del 1,1–3,1 %. Vrbo cobra un 12 % todo incluido desde el 29 de octubre. Nadie le transfiere el importe que figura en la reserva.

**Por lotes.** Booking.com suele pagar una vez al mes o cada dos semanas, con una sola transferencia para todas las estancias del periodo. Cinco reservas se convierten en una línea del extracto. Si falta una de las cinco, el total sigue pareciendo razonable.

**Con compensaciones.** Si aprueba un reembolso en Airbnb después del pago, Airbnb no le envía una factura. Descuenta el dinero del siguiente pago, que puede corresponder a otro huésped, otro alojamiento u otro mes. Esa estancia parece ahora cobrada con 45 $ de menos, y la que lo provocó parece perfecta.

**Tarde, o nunca.** Con la tarjeta virtual de Booking.com, el dinero no se mueve hasta que usted la cobra. Nadie se lo recuerda. En el [artículo sobre los plazos de pago](/blog/airbnb-booking-com-payout-timing) está el calendario de cuándo libera el dinero cada plataforma; la conciliación es la forma de notar que ese calendario no se cumplió.

Súmele la conversión de divisas, y la diferencia entre «reservado» y «recibido» nunca es cero, ni siquiera en un mes en el que no falló nada.

## Las tres columnas: reservado, esperado, recibido

Cada estancia tiene una fila y tres cifras.

1. **Reservado**: el importe bruto de la reserva, precio por noche × noches más la tarifa de limpieza, antes de cualquier comisión. Lo que vio el huésped.
2. **Esperado**: lo que debería llegarle después de la parte de la plataforma. Lo calcula usted con la estructura de comisiones, no a partir del pago.
3. **Recibido**: lo que llegó de verdad, emparejado por número de confirmación, no por fecha ni por importe.

La clave importa más que todo lo demás. Las fechas se desplazan por los lotes y los importes por las compensaciones, pero el número de confirmación aparece en cada informe y en cada línea de pago. Primero se empareja por número y después se comparan importes.

Cómo calcular la columna «esperado» por canal:

| Canal | Pago esperado | Dónde aparece la comisión |
| --- | --- | --- |
| Airbnb, comisión dividida | Subtotal del anfitrión × 0,97 | Columna de tarifa de servicio en el CSV de transacciones |
| Airbnb, comisión solo anfitrión | Subtotal del anfitrión × 0,85 (compruebe su tasa) | La misma columna, con más importe |
| Payments by Booking.com | Estancia × (1 − comisión − tarifa de pago) | Descontada en el resumen del pago |
| Booking.com, tarjeta virtual | Importe completo, cobrado por usted | Comisión facturada aparte cada mes |
| Vrbo, pago por reserva | Estancia × 0,88 desde el 29 de octubre | Descontada antes del pago |
| Reserva directa con Stripe | Estancia × 0,971 − 0,30 $ (tarjetas de EE. UU.) | Movimientos del saldo de Stripe |

Con la tarjeta virtual, la comisión no es un descuento, sino una factura mensual aparte. En la conciliación tiene su propia fila: comisión esperada frente a comisión facturada. Ahí vive también la mayoría de los errores de Booking.com, como muestra el [cálculo de comisión e IVA](/blog/booking-com-commission-vat-math).

Fije una tolerancia antes de empezar. Yo acepto ±1 unidad de moneda por redondeo en los pagos en la misma divisa y hasta un 3 % en los que llevan conversión, porque ahí está el margen del cambio. Si ese 3 % le molesta, con razón: el [artículo sobre la conversión de divisas](/blog/airbnb-payout-currency-conversion-fee) explica cómo dejar de pagarlo.

## De dónde sale cada cifra

Necesita un informe por canal y una exportación del banco. Ninguna herramienta de pago.

**Airbnb.** Menú → Ingresos abre el historial de transacciones, que se exporta en CSV. Filtre por fecha de pago del mes. Las filas que importan: las filas *Reservation* llevan el número de confirmación, las noches, los ingresos brutos y la tarifa de servicio; las filas *Payout* indican qué reservas entraron en cada transferencia; las filas *Adjustment* y *Resolution Payout* son reembolsos e indemnizaciones por daños. Lea primero los ajustes. Explican la mayoría de las estancias de Airbnb que parecen cobradas de menos antes de que empiece a buscar.

**Booking.com.** La pestaña Finanzas de la extranet guarda tres cosas: el **extracto de reservas** mensual (lo que Booking.com considera alojado y sobre lo que cobrará comisión), las **facturas** (la factura de comisión en sí) y, con Payments by Booking.com, el **resumen de pagos**, con las reservas incluidas en cada transferencia. Descargue las tres.

**Vrbo.** El informe de pagos del panel de Vrbo muestra para cada reserva el bruto, las comisiones y el pago. Como es la primera temporada con la nueva estructura del 12 %, revise la columna de comisiones línea por línea en el primer extracto de noviembre. El [artículo sobre la comisión de Vrbo](/blog/vrbo-12-percent-commission-math) explica por qué hay que vigilar sobre todo las reservas hechas antes del 29 de octubre.

**Reservas directas.** El historial del saldo de Stripe muestra cada cobro, su comisión y el pago en el que entró. Las disputas y los reembolsos aparecen como filas negativas aparte.

**La propia lista de reservas.** Es la columna que casi todos los anfitriones se saltan, y es la que detecta el dinero que falta. Los informes de las plataformas solo muestran lo que la plataforma da por cobrado o facturado. Para saber que falta una fila entera necesita la lista de todas las estancias que de verdad alojó, de todas las fuentes. Si sus calendarios ya pasan por [RentTools](/onboard), el calendario unificado es esa lista: todas las reservas de Airbnb, Booking.com, Vrbo y directas, con fechas y origen. Los feeds iCal no incluyen precios, así que los importes siguen saliendo de los informes de cada plataforma. El calendario le dice qué buscar.

## Un mes desglosado: dos alojamientos, dieciséis estancias

Mi octubre: dos apartamentos, unos 7.600 $ en reservas. El alojamiento A funciona con Airbnb y Payments by Booking.com. El B añade una tarifa de Booking.com con tarjeta virtual, Vrbo y alguna reserva directa.

| Origen | Estancias | Esperado | Recibido | Diferencia | Qué era |
| --- | --- | --- | --- | --- | --- |
| Airbnb | 7 | 3.259 $ | 3.214 $ | −45 $ | Reembolso aprobado, descontado de un pago posterior |
| Payments by Booking.com | 3 | 1.149 € | 1.149 € | 0 | Cuadra |
| Booking.com, tarjeta virtual | 3 | 1.060 € | 676 € | −384 € | Una tarjeta sin cobrar |
| Factura de comisión de Booking.com | — | 159,00 € | 194,40 € | −35,40 € | Estancia acortada facturada como cinco noches |
| Vrbo | 2 | 851 $ | 851 $ | 0 | Cuadra, tasa antigua, reservada antes del 29/10 |
| Directa, Stripe | 1 | 466 $ | 466 $ | 0 | Cuadra |
| Reclamación por daños | — | 120 $ | 0 $ | −120 $ | Encimera quemada, aún sin reclamar |

Las diferencias, una a una:

**Los 45 $ de Airbnb** no se habían perdido. Al huésped se le estropeó el hervidor, acepté un reembolso de 45 $ a través del Centro de resoluciones y Airbnb lo descontó del siguiente pago, que correspondía a otra estancia. La fila Adjustment del CSV lo explicó en diez segundos. Estado: explicado, cerrado.

**Los 384 € de la tarjeta virtual** eran dinero de verdad. Tres noches en el alojamiento B, salida 19 días antes, tarjeta sin cobrar: la estancia terminó en domingo, yo agrupo los cobros el lunes, y se me olvidó. Según la configuración, las tarjetas virtuales de Booking.com se pueden cobrar entre unos 14 y 30 días después de la salida, así que la cobré esa misma tarde con margen. Qué hacer si el cobro se rechaza: está en la [guía de tarjetas virtuales](/blog/booking-com-virtual-card-declined). Estado: recuperado.

**Los 35,40 € de comisión** venían de una huésped que reservó cinco noches a 118 € y se fue a las tres por una urgencia familiar. Cobré 354 € de la tarjeta virtual por tres noches y no toqué el extracto de reservas. Booking.com calculó la comisión sobre los 590 € originales: 88,50 € en lugar de 53,10 €. Una estancia acortada se puede corregir en el extracto de reservas antes de que se emita la factura; el plazo aparece en la extranet y es corto. Estado: corregido a tiempo.

**Los 120 $ por daños** no aparecían en ningún informe, y de eso se trata. En las fotos de salida de mi limpiadora se veía una quemadura en la encimera. No había ninguna fila *Resolution Payout* que le correspondiera, porque yo no había reclamado nada. AirCover exige reclamar en los 14 días siguientes a la salida, e íbamos por el noveno. El [artículo sobre AirCover](/blog/airbnb-aircover-vs-booking-damage-deposit) explica por qué las fotos con fecha deciden estos casos. Estado: reclamado, pagado tres semanas después.

En total, unos **570 $** recuperados o evitados, un 7,5 % del mes. Fue mi peor mes. En un mes normal, la conciliación encuentra un error de redondeo y nada más, y está bien que así sea. No se concilia para encontrar dinero cada mes. Se concilia para detectar el mes malo mientras los plazos siguen abiertos.

## Los cinco agujeros que se repiten una y otra vez

En dos años, casi todas las diferencias han caído en uno de estos cinco grupos:

1. **Tarjetas virtuales sin cobrar.** El agujero más caro y más frecuente en Booking.com. La tarjeta caduca y el dinero se va con ella.
2. **Extractos de reservas sin corregir.** Estancias acortadas, no-shows que olvidó marcar, una cancelación que llegó por mensaje del huésped y no por la extranet. Booking.com cobra la comisión sobre el extracto tal como está. El plazo de 48 horas para marcar un no-show se explica en el [artículo sobre no-shows](/blog/booking-com-no-show-fee).
3. **Compensaciones que parecen pérdidas.** Reembolsos y ajustes de Airbnb descontados de un pago que no tiene nada que ver. No es dinero que falta, es dinero ya contabilizado. Léalos primero para no perder 20 minutos con una falsa alarma.
4. **Daños que nunca reclamó.** La conciliación es el único momento en que compara las notas de limpieza con lo que se ha pagado. Si hay un daño y ninguna fila de indemnización, nadie presentó la reclamación.
5. **La tasa equivocada.** Una comisión que cambió (Vrbo este mes), un descuento Genius que creía desactivado, la comisión solo anfitrión en un alojamiento y la dividida en el otro. La columna «esperado» los detecta; la columna «recibido» por sí sola no los verá nunca.

Y uno más, raro pero desagradable: un pago que llega dos veces. Ocurre cuando se modifica una reserva después del primer pago. Devolverlo enseguida sale más barato que esperar a que la plataforma lo retenga en un mes cargado.

## El ritmo: diez minutos a la semana, treinta al mes

Los plazos y los importes van con relojes distintos, así que divido el trabajo.

**Cada semana, unos diez minutos, los lunes.** Solo lo que tiene plazo:

- Cada tarjeta virtual de Booking.com de una estancia ya empezada: ¿cobrada? (Validez: unos 14–30 días.)
- Cada salida de los últimos 14 días con daños en las notas de limpieza: ¿reclamación presentada?
- Cada llegada de Booking.com de las últimas 48 horas en la que no apareció nadie: ¿marcada como no-show?

**Cada mes, unos treinta minutos.** La conciliación completa de las tres columnas. La hago en dos tandas: el extracto de reservas de Booking.com en los primeros días hábiles del mes, antes del plazo de corrección, y los importes cuando llega el pago de Booking.com, a mediados de mes. Todo lo demás —Airbnb, Vrbo, Stripe— se concilia en la segunda tanda.

Guarde el resultado. Una pestaña de hoja de cálculo por mes, una fila por estancia y una columna de estado con cuatro valores: *cuadra*, *explicado*, *recuperado*, *dado por perdido*. A final de año, esa pestaña es su carpeta fiscal. En la UE, las plataformas ya envían sus ingresos a Hacienda por [DAC7](/blog/dac7-airbnb-booking-tax-reporting); un anfitrión con doce pestañas conciliadas responde en minutos a cualquier pregunta sobre una cifra de esa declaración. Sin ellas, toca reconstruir el año a partir de las líneas del banco.

## FAQ

**¿Cómo concilio los pagos de Airbnb con mi cuenta bancaria?**
Exporte el historial de transacciones desde Menú → Ingresos en CSV y filtre por fecha de pago. Cada fila Payout enumera las reservas que incluye por número de confirmación. Empareje esos pagos con las transferencias del banco por importe y fecha, y luego compare los ingresos brutos y la tarifa de servicio de cada reserva con lo que esperaba. Lea primero las filas Adjustment: explican la mayoría de las estancias que parecen cobradas de menos.

**¿Por qué el pago de Booking.com es menor que el importe de la reserva?**
Payments by Booking.com descuenta la comisión, normalmente del 15 % y más con Genius o Preferred Partner, y una tarifa de pago de entre el 1,1 % y el 3,1 %. Según el país, la comisión puede llevar IVA. Si la diferencia supera esos tres conceptos, revise el extracto de reservas: puede que una estancia figure con un importe equivocado.

**¿Qué pasa si se me olvida cobrar una tarjeta virtual de Booking.com?**
La tarjeta solo se puede cobrar durante un tiempo limitado después de la salida, normalmente entre 14 y 30 días según la configuración. Cuando caduca hay que pedir al soporte para partners que la reactive, y pasado cierto plazo ya no se puede cobrar. Revisar cada semana las tarjetas virtuales de las estancias empezadas es la solución más barata.

**¿Se puede corregir el extracto de Booking.com si el huésped se va antes?**
Sí, dentro del plazo de corrección previo a la factura mensual de comisión. Cambie la fecha de salida o el importe en el extracto de reservas, en la sección Finanzas de la extranet. Si se le pasa el plazo, Booking.com cobra la comisión sobre la reserva original y tendrá que resolverlo con el soporte para partners.

**¿Cada cuánto debe un anfitrión de alquiler vacacional conciliar sus pagos?**
Dos veces, con dos relojes. Cada semana, unos diez minutos para todo lo que tiene plazo: tarjetas virtuales, reclamaciones por daños en 14 días, no-shows en 48 horas. Cada mes, una media hora para los importes, ajustada al extracto y al pago de Booking.com. Dos alojamientos y dieciséis estancias me llevan una media hora en total.

**¿Necesito un programa de contabilidad para controlar los ingresos del alquiler?**
No. Hasta unos 20 alojamientos basta una hoja de cálculo con una fila por estancia y tres columnas de importes: reservado, esperado y recibido. Lo importante es la clave para emparejar, el número de confirmación, que aparece en el informe de cualquier plataforma. Un programa de contabilidad ayuda a final de año, pero importará sin rechistar un pago al que le falta una estancia.

**¿Cuánto tiempo hay que guardar los informes de pagos?**
Mientras Hacienda pueda revisar el ejercicio: en la UE, normalmente entre cinco y diez años según el país; en España, cuatro años de prescripción fiscal, aunque la normativa mercantil pide conservar la documentación seis. Las plataformas envían sus ingresos a Hacienda por DAC7, y sus propios registros conciliados son lo que le permitirá explicar cualquier cifra declarada.

## Una opinión sin rodeos

Los anfitriones discuten durante semanas una diferencia del 3 % en comisiones entre plataformas y luego nunca comprueban si la plataforma ha pagado siquiera. Una tarjeta virtual olvidada es una comisión del 100 % sobre esa estancia. La conciliación no es contabilidad por gusto: es el único control que tiene sobre un dinero que otro cobra en su nombre. Si no está dispuesto a dedicarle treinta minutos al mes, no ha elegido el canal más barato. Ha elegido no saber.
