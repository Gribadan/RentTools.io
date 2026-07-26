---
slug: seasonal-pricing-short-term-rental-math
locale: es
title: "Precios por temporada: convierta su historial en escalera de tarifas"
excerpt: "La mayoría de los anfitriones mantienen una sola tarifa todo el año. Construya un índice de estacionalidad con su ocupación, conviértalo en coeficientes mensuales y deje de perder margen."
status: published
tags:
  - pricing:Precios
  - host-tips:Consejos para anfitriones
  - airbnb:Airbnb
  - booking-com:Booking.com
ogImageUrl: /blog-covers/seasonal-pricing-short-term-rental-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

Mi primer año completo como anfitrión cobré 110 $ por noche por un estudio en la ciudad y no toqué esa cifra ni una sola vez. Me parecía disciplina. En julio el calendario se llenó a finales de abril: cada noche vendida, a 110 $, noventa días antes de la primera llegada. Me decía que era un buen problema. No lo era. Un alojamiento que se llena tres meses antes no es popular: está mal tarifado. El idéntico dos puertas más allá estaba a 155 $ aquel julio, y también lleno. Son unos 1.300 $ que regalé a viajeros de verano dispuestos a pagar más, en un solo mes, porque estaba orgulloso de una tarifa que elegí en enero.

## TL;DR

- Una tarifa fija todo el año es el error de precio más caro de un anfitrión.
- **Índice de estacionalidad** = ocupación del mes ÷ su ocupación media anual.
- La demanda se mide con ocupación a tarifa constante, no con ADR — el ADR es circular.
- Llenarse 60+ días antes no es una victoria: significa que la temporada alta va barata.
- Tarifa = ancla × índice, corregida con la prueba del lleno; reconstruir cada año.
- El descuento de temporada baja no mueve nada; el dinero está en el recargo del pico.

## Por qué una tarifa fija es el hábito más caro del alquiler

Una sola tarifa mantenida todo el año pierde por los dos extremos del calendario, y las dos fugas no son del mismo tamaño.

La fuga de temporada baja es la evidente: en febrero sus 110 $ se quedan en un 48 % de ocupación donde 85 $ quizá habrían llenado el 65 % del mes. Parece el error caro porque las noches vacías se ven.

La fuga del pico es invisible, y justo por eso es mayor. En julio sus 110 $ se agotaron —96 % de ocupación, un calendario que le hacía feliz— mientras el mercado habría soportado 150 $ casi sin mella en la ocupación. Nada parece fallar. No hay noches vacías que mirar. Pero cada una de esas 29 noches se vendió 40 $ por debajo de lo que un huésped estaba dispuesto a pagar, y nunca verá el contrafactual: un calendario lleno no le muestra la demanda que rechazó.

Aquí está la regla que replantea todo el problema: **si sus meses de pico se llenan mucho antes de su ventana de reserva habitual, los está tarifando por debajo.** Un estudio urbano con una [antelación de reserva mediana](/blog/booking-lead-time-short-term-rental) de unas dos semanas no debería tener julio lleno ya en abril. Cuando lo tiene, el calendario le dice, en el único idioma que tiene, que el precio es demasiado bajo.

## Qué mide de verdad «la estacionalidad» — y qué métrica usar

La estacionalidad es la demanda que se mueve con el calendario: el mismo piso vale más en julio que en febrero porque en julio lo quiere más gente, y punto. El truco está en medir esa demanda sin dejar que el precio contamine la medición.

El instinto dice: coja el ADR —la tarifa media diaria— por mes. No lo haga. El ADR es circular: depende en parte del precio que fijó *usted*, así que si en julio cobró más, el ADR de julio es alto porque usted lo hizo alto, no porque la demanda lo fuera. Está releyendo su propia decisión como si fuera un dato.

Use en cambio la **ocupación a una tarifa más o menos constante**. Si mantuvo algo cercano a 110 $ todo el año, la ocupación de cada mes es una lectura limpia de cuánto quería el mercado su alojamiento ese mes, con el precio constante. Esa es la señal. El ritmo de reserva —cuántos días antes se llena un mes— es una segunda lectura útil, y cuenta más justo donde la ocupación le falla. Esa es la trampa siguiente.

**La trampa del techo.** La ocupación topa en el 100 %. Un mes agotado se lee como «100 % de demanda», tanto si la demanda real fue del 101 % como del 180 %. Así que la ocupación *subestima* sus meses más fuertes: los que se agotaron no pueden mostrar hasta dónde por encima del lleno habrían llegado. Por eso existe la prueba del lleno: para cualquier mes que supere el ~90 % o se llene mucho antes de su antelación mediana, trate el coeficiente salido de la ocupación como un suelo, no como una respuesta, y suba la tarifa hasta que el mes deje de agotarse 60+ días antes.

## Construya su índice de estacionalidad en una tabla

El índice es una división. Tome la ocupación del mes (a una tarifa mantenida cerca de un valor constante), divídala entre su ocupación media anual y obtiene un coeficiente en torno a 1,00. Aquí un estudio urbano de forma realista, con un 70 % de ocupación media al año:

| Mes | Ocupación a tarifa constante | Índice de estacionalidad |
|---|---|---|
| Enero | 45 % | 0,64 |
| Febrero | 48 % | 0,69 |
| Marzo | 58 % | 0,83 |
| Abril | 68 % | 0,97 |
| Mayo | 78 % | 1,11 |
| Junio | 88 % | 1,26 |
| Julio | 96 % | 1,37 |
| Agosto | 95 % | 1,36 |
| Septiembre | 82 % | 1,17 |
| Octubre | 70 % | 1,00 |
| Noviembre | 55 % | 0,79 |
| Diciembre | 62 % | 0,89 |

Lea julio y agosto con la trampa del techo en mente. Indexan a 1,37 y 1,36, pero ambos estaban por encima del 95 % de ocupación: tocaron el techo. Su índice real es más alto de lo que la tabla puede mostrar; la cifra es un suelo. Octubre indexa a exactamente 1,00, lo que lo convierte en un mes ancla limpio: la tarifa que mantiene octubre en una ocupación sana es su referencia ×1,00.

Para construir el suyo, saque doce meses de reservas y cuente las noches ocupadas por mes. La única condición es que todas las reservas estén en un mismo sitio: si sus noches están repartidas entre un panel de Airbnb, un extranet de Booking.com y un acceso de Vrbo, no puede contarlas con limpieza. [Reunir todas las reservas en un solo calendario](/onboard) convierte esto en un recuento de cinco minutos en lugar de un cuadre entre tres pestañas.

## Convierta el índice en una escalera de tarifas

Elija una **tarifa ancla**: la única cifra que cobraría si tuviera que quedarse con una, o su tarifa fija actual. Multiplíquela por el índice de cada mes. Eso da una escalera en bruto. Luego dos correcciones: el empujón del lleno arriba y un suelo de coste abajo.

Anclado en 110 $, la escalera en bruto y la corregida:

| Mes | Índice | Bruto (ancla × índice) | Tarifa corregida |
|---|---|---|---|
| Enero | 0,64 | 70 $ | 75 $ |
| Febrero | 0,69 | 76 $ | 80 $ |
| Marzo | 0,83 | 91 $ | 91 $ |
| Abril | 0,97 | 107 $ | 107 $ |
| Mayo | 1,11 | 122 $ | 122 $ |
| Junio | 1,26 | 139 $ | 139 $ |
| Julio | 1,37 | 151 $ | 160 $ |
| Agosto | 1,36 | 150 $ | 158 $ |
| Septiembre | 1,17 | 129 $ | 129 $ |
| Octubre | 1,00 | 110 $ | 110 $ |
| Noviembre | 0,79 | 87 $ | 87 $ |
| Diciembre | 0,89 | 98 $ | 98 $ |

Julio y agosto se empujaron por encima de la cifra bruta porque estaban topados: los 151 $ brutos venían de una ocupación topada, así que los moví a 160 $ y 158 $, y seguiré moviéndolos el año que viene si vuelven a agotarse pronto. Enero y febrero recibieron suelo: el cálculo bruto quería 70 $ y 76 $, y puse 75 $ y 80 $ —más o menos donde un descuento deja de comprar suficiente ocupación extra como para importar.

**El suelo de coste.** Nunca deje que una tarifa de temporada baja caiga por debajo del coste marginal de una noche ocupada: la parte de limpieza, los [consumibles](/blog/consumables-cost-per-stay-math) y el [sobrecoste de suministros](/blog/utility-cost-short-term-rental-math) que un huésped añade de verdad, normalmente 30–60 $. Por debajo de esa línea, una noche ocupada pierde dinero y le conviene más vacía. En un mercado normal el suelo casi nunca actúa, pero es la barandilla que impide que un índice ingenuo le tarife a pérdidas en un enero muerto.

Esta tarifa es la capa *estacional*. Su recargo de fin de semana se posa encima, mes a mes: el [recargo de viernes/sábado](/blog/weekend-pricing-premium-math) se calcula contra la base de julio de 160 $, no contra una cifra anual congelada. Apile las dos; no las promedie.

## Las noches de compresión que el índice no ve

El índice es una base mensual. Es liso por construcción, y la demanda real no lo es: un solo congreso, un festival de música, un fin de semana de graduación o un festivo puede disparar una fecha suelta al doble de la tarifa mientras el resto del mes se comporta con normalidad.

Esas son **noches de compresión**, y necesitan un ajuste diario por encima de la base estacional, no un cambio en el índice del mes. Si su ciudad acoge un congreso de 40.000 personas la segunda semana de septiembre, esa semana puede soportar 2× o 2,5× su base de septiembre de 129 $ —digamos 260 a 320 $— mientras el resto de septiembre sigue en 129 $. Meta ese pico en el índice mensual y sobretarifa las otras tres semanas y aun así subtarifa el evento.

La separación práctica: el índice de estacionalidad fija su tarifa para una semana normal de cada mes; una lista corta de eventos locales conocidos fija ajustes diarios. Lleve un calendario de las diez o quince fechas del año que comprimen su mercado —la mayoría de los anfitriones pueden nombrarlas de memoria en cuanto lo piensan— y tarífelas una a una. Todo lo demás rueda por la escalera.

## Dónde más pierden los anfitriones de tarifa fija

Ponga las dos fugas lado a lado, y la sorpresa es cuál importa.

**Pico, subtarifado.** Julio, 30 noches alquilables, 29 vendidas a 110 $ = 3.190 $, y agotado en abril, 90 días antes de que un mercado con mediana de dos semanas deba llenarse. Suba la base a 150 $. Aunque la ocupación baje del 96 % al 90 % —27 noches— eso son 4.050 $. Ganó **860 $ más en un mes** y dejó de agotarse un trimestre antes. En un verano de tres meses son unos 2.400 $ que dejaba cada año sobre la mesa, invisiblemente, mientras celebraba un calendario lleno.

**Valle, sobretarifado.** Febrero, 28 noches, 48 % de ocupación a 110 $ = unos 1.540 $ (13 noches). Baje a 85 $ y suba la ocupación al 65 % —18 noches— y obtiene 1.530 $. En esencia, tablas en ingresos. El descuento no dio dinero; movió cinco noches vacías a ocupadas a una tarifa menor, y los dos efectos se cancelaron.

Entonces, ¿por qué descontar el valle siquiera? Porque esas cinco noches ocupadas de más valen algo que la línea de ingresos no muestra: más [reseñas al año](/blog/airbnb-rating-recovery-math), mejores estadísticas de Superhost, una señal de actividad más fresca para el algoritmo de posicionamiento, y cada noche sigue cubriendo los ~45 $ de coste marginal. Pero no se engañe sobre dónde está el dinero. **El descuento de temporada baja son tablas que acepta por las reseñas. El recargo de temporada alta es el ingreso de verdad.** Los anfitriones gastan su energía atormentándose con el descuento de febrero y nunca tocan la tarifa de julio que deberían subir.

## No tome prestada la estacionalidad de otro

El Smart Pricing de Airbnb y herramientas de terceros como PriceLabs o Wheelhouse aplican todas estacionalidad, pero es estacionalidad *de mercado*, agregada sobre toda su ciudad o región. El primer año, cuando no tiene historial propio, es un buen punto de partida. Y es erróneo en el instante en que su micromercado se aparta de la media de la ciudad, y los micromercados siempre se apartan.

Un alojamiento cerca de una universidad hace pico en agosto y septiembre —por la entrada de curso y las visitas familiares— y otra vez en la graduación: una curva que nada tiene que ver con el pico veraniego de playa que supone el modelo de ciudad. Un piso junto a una estación de esquí lo invierte todo: febrero es su julio. Un alojamiento cerca de un hospital o de un gran empleador puede casi no tener temporada, quedándose plano en el 75 %, porque su demanda son estancias médicas y viajes de trabajo, no turismo. Un modelo de ciudad promedia todo eso en una papilla que no encaja con ninguno.

Las [herramientas de precios dinámicos](/blog/dynamic-pricing-short-term-rental) merecen la pena, para los ajustes diarios de última hora y la detección de noches de compresión, que de verdad hacen bien. Pero la base mensual debe ser *su* índice, construido con *sus* doce meses, imponiéndose a cualquier curva de mercado de la herramienta. Fije el perfil estacional de la herramienta a mano desde su tabla; no la deje adivinar. El primer año, tome prestada la curva del mercado. El segundo, tiene los únicos datos que describen de verdad su alojamiento, y sobre esos debería tarifar.

## FAQ

**¿Cómo fijo precios por temporada en Airbnb?**
Airbnb permite poner tarifas por noche personalizadas para rangos de fechas directamente en el calendario: seleccione un bloque de fechas, fije el precio y repita mes a mes según su escalera de tarifas. Si usa Smart Pricing, ponga un precio mínimo por mes para que el algoritmo no le baje del suelo estacional; a su aire, subcotizará encantado su temporada alta. Lo más limpio es dejar sus doce tarifas base una vez a principio de año y luego tocar fechas sueltas solo para eventos.

**¿Qué meses son temporada alta en el alquiler de corta estancia?**
No hay respuesta universal: es del todo local. Los mercados de playa y lago hacen pico en verano; los de esquí, en invierno; las ciudades suelen tener un pico de primavera y otro de otoño en temporada media, más picos por eventos; los alojamientos junto a universidades hacen pico en la entrada de curso y la graduación. La única forma de conocer la suya es mantener su tarifa más o menos constante un año y leer la ocupación mensual. No dé por hecho que su curva coincide con la media de la ciudad.

**¿Mido la estacionalidad con ocupación o con ADR?**
Con ocupación, a una tarifa más o menos mantenida. El ADR es circular porque refleja en parte los precios que eligió; un mes con ADR alto puede significar solo que tarifó alto, no que la demanda fuera alta. La ocupación a precio constante aísla la demanda. La única excepción: en los meses agotados la ocupación topa en el 100 % y los subestima, así que la señal pasa a ser lo pronto que se llenaron.

**¿Cuánto más debe costar la temporada alta que la baja?**
Lo bastante para que los extremos dejen de portarse mal; no hay ratio fijo. El margen del valle al pico suele caer entre 1,5× y 2,5×, pero eso es un resultado, no un objetivo. La temporada alta está bien tarifada cuando ya no se agota mucho antes de su ventana de reserva habitual; la baja, cuando está cerca del punto donde otro descuento deja de comprar ocupación apreciable. Deje que esas dos pruebas fijen el margen.

**¿El Smart Pricing de Airbnb gestiona la estacionalidad?**
En parte. Aplica estacionalidad a nivel de mercado y reacciona a la demanda, pero toma la curva de toda su ciudad, no de su micromercado, y no conoce su suelo de coste. Sin supervisión tiende a subtarifar su pico real y puede bajar del umbral de rentabilidad en su valle. Úselo si quiere, pero fije precios mínimo y máximo mensuales desde su propio índice para que opere dentro de su escalera en lugar de sustituirla.

**¿Cada cuánto debo actualizar los precios por temporada?**
Reconstruya el índice de doce meses una vez al año con los últimos doce meses de reservas. Dentro del año no toque las tarifas base salvo que un mes se porte claramente mal frente a la prueba del lleno; déjelas en paz. Las noches de compresión y los huecos de última hora se tratan aparte, como ajustes diarios, no moviendo el mes entero.

**¿Merece la pena la tarificación por temporada para un solo alojamiento?**
Sí, y seguramente importa más con uno solo, porque no tiene una cartera con la que promediar un pico mal tarifado. La estacionalidad es la mayor palanca de precio que tienen la mayoría de los anfitriones pequeños, y la que más ignoran, precisamente porque una tarifa fija no exige decisiones. Una tarde construyendo el índice suele amortizarse ya en el primer mes de pico.

**¿Cómo tarifo la temporada media?**
El índice lo resuelve solo: los meses intermedios como abril y septiembre caen cerca de 1,00 y toman más o menos su tarifa ancla. El error de temporada media no es la tarifa base, es la estancia mínima: la demanda intermedia es más irregular, así que un mínimo rígido de tres noches abandona más noches sueltas que en pico. Afloje el mínimo en los meses intermedios y deje que la escalera cargue el precio.

## Una opinión con filo

El recargo de fin de semana acapara toda la atención en los foros de anfitriones, y vale quizá un par de puntos porcentuales al año. La estacionalidad vale varias veces eso, y los anfitriones la ignoran porque una escalera de tarifas no da la dopamina diaria de ver a una herramienta ajustar la cifra de esta noche. Es aburrida. Fija doce tarifas en una tarde, ajusta una docena de fechas de eventos y no la vuelve a tocar hasta el enero siguiente. Ese es todo el sistema. La hora más rentable que dedicará a los precios este año es aquella en la que construya el índice y por fin suba el pico que llevaba vendiendo, en silencio, tres meses antes de tiempo.
