---
slug: airbnb-rating-recovery-math
locale: es
title: "Valoración de Airbnb: cuántas cinco estrellas borran una mala reseña"
excerpt: Una mala reseña hunde su valoración de Airbnb en segundos; remontar es matemática fija: cuántas cinco estrellas borran una, según su número de reseñas.
status: published
tags:
  - airbnb:Airbnb
  - host-tips:Consejos para anfitriones
  - guest-comms:Comunicación con huéspedes
ogImageUrl: /blog-covers/airbnb-rating-recovery-math.webp
ogImageWidth: 1600
ogImageHeight: 900
---

En marzo un huésped me puso una estrella. El anuncio se sostenía en 4,90 tras 20 estancias — un estudio limpio y sin historias que nunca había bajado de cinco estrellas salvo por un hervidor roto. Una reseña, una noche, un huésped furioso porque el edificio no tenía ascensor, y a la mañana siguiente la página del anuncio marcaba 4,71. Después hice lo que hace todo anfitrión: abrí una hoja de cálculo y me pregunté cuántas estancias perfectas hacían falta para volver a 4,90. La respuesta no era la que esperaba, y es la misma tenga usted 20 reseñas o 2000.

Este artículo es esa hoja de cálculo. La aritmética exacta de cuánto lo hunde una mala reseña, de cuántas estancias impecables cuesta remontar y de por qué los anuncios mejor valorados son los que se recuperan más despacio.

## TL;DR

- Una reseña mueve la media en `(P − k) / (N + 1)`: la caída se encoge rápido cuanto mayor es el número de reseñas `N`.
- La línea de Superanfitrión de 4,80 solo peligra en **anuncios pequeños**. Pasadas ~50 reseñas, una estrella ya no la rompe.
- Recuperar su media **anterior** es fijo: `(P − k) / (5 − P)` estancias de cinco estrellas, y no depende de `N`.
- En 4,90, una estrella cuesta **39 estancias impecables**. En 4,95 son **79**. Más valoración, recuperación más lenta.
- A ~5 reseñas al mes, 39 estancias limpias son **unos ocho meses** de cinco estrellas sin cortes.
- Una retirada concedida borra toda la deuda en cinco minutos. Busque la retirada primero; la recuperación después.

## La única fórmula que importa

La valoración global de Airbnb es una media aritmética sin más: sume las valoraciones globales de todos los huéspedes y divida por el número de valoraciones. Eso es todo. Sin decaimiento en el tiempo, sin peso por lo reciente, sin fórmula secreta. Lo que hace que todo sea predecible con matemáticas de sexto de primaria.

Digamos que su anuncio está en una media `P` sobre `N` reseñas. Llega una reseña nueva de `k` estrellas. Su nueva media es:

```
nueva media = (P × N + k) / (N + 1)
```

De ahí salen dos cosas al instante. Primera: una mala reseña duele en proporción a lo que baja de su media — una estrella en un anuncio de 4,90 es un golpe de 3,90 puntos; cuatro estrellas, solo de 0,90. Segunda: el daño se divide entre su número de reseñas más uno. Un anuncio con 20 reseñas siente la misma estrella diecinueve veces más fuerte que uno con 400.

Ahora la pregunta de la recuperación. Ha encajado un golpe de `k` estrellas y quiere volver a su `P` original. ¿Cuántas estancias de cinco estrellas más cuesta? Iguale la media de nuevo a `P` y despeje:

```
cinco estrellas para restaurar P  =  (P − k) / (5 − P)
```

La `N` se cancela. **El número de estancias impecables para borrar una mala reseña no depende de cuántas reseñas tenga.** Un anuncio con 20 reseñas y uno con 2000, a la misma valoración de 4,90, piden exactamente las mismas estancias limpias para borrar la misma reseña. El anuncio grande apenas se inmuta el día de la caída, y tarda justo lo mismo en cicatrizar del todo.

La intuición: cada cinco estrellas solo le compra `(5 − P)` de margen — en un anuncio de 4,90, una estancia perfecta vale apenas 0,10 por encima de su línea. La mala reseña lo metió en un hoyo de `(P − k)`. Pagar una deuda fija con cuotas fijas exige un número fijo de cuotas, por grande que ya sea su saldo.

## Tres anuncios, una estrella

Aquí cae la misma estrella sobre tres anuncios, todos en 4,90 antes del golpe. La única diferencia es cuántas reseñas había acumulado cada uno.

| Reseñas antes de la estrella | Nueva media | Caída | Línea de Superanfitrión 4,80 |
| --- | --- | --- | --- |
| 20 | 4,71 | −0,19 | Perdida |
| 50 | 4,82 | −0,08 | A salvo |
| 100 | 4,86 | −0,04 | A salvo |
| 200 | 4,88 | −0,02 | A salvo |

El anuncio de 20 reseñas cae bajo el umbral de Superanfitrión y pierde el distintivo en el siguiente recálculo trimestral. Los de 50, 100 y 200 no: llevan suficiente lastre de cinco estrellas para que una sola estrella no pueda empujar la media bruta por debajo de 4,80. (Airbnb guarda la media bruta con dos decimales y la muestra redondeada a uno, así que 4,82 aparece como «4,8» pero se mantiene con holgura sobre el límite de 4,80. Toda la mecánica de ese precipicio está en [«Superanfitrión de Airbnb: los cuatro umbrales»](/blog/airbnb-superhost-requirements-math).)

Primer mito que derribar: **una mala reseña no le «cuesta el Superanfitrión» en un anuncio maduro.** Le cuesta el Superanfitrión en un anuncio *joven*. Si tiene más de unas 50 reseñas en 4,90, una estrella suelta es una abolladura cosmética en la cifra, no un evento para el distintivo. El pánico es real; el riesgo para el distintivo, casi nunca.

El caso de las 20 reseñas es el que quema. Para arrastrarse de vuelta a la línea de 4,80 — no a sus antiguos 4,90, solo a la línea del distintivo — ese anuncio necesita **9 estancias de cinco estrellas seguidas** (99 ÷ 21 sube a 144 ÷ 30 = 4,80, justo en la novena). Para volver del todo a 4,90 son 39. Son dos metas distintas, y confundirlas es precisamente donde los anfitriones o entran en pánico de más o reaccionan de menos.

## La tabla de la deuda de valoración

Como la recuperación hacia la media anterior no depende del número de reseñas, cabe en una tarjeta de visita. Esto es lo que cuesta una mala reseña, en estancias impecables, según la media de partida:

| Su media antes | Cinco estrellas para restaurarla del todo tras una estrella |
| --- | --- |
| 4,95 | 79 |
| 4,90 | 39 |
| 4,85 | 26 |
| 4,80 | 19 |
| 4,70 | 13 |

Vuelva a leer la primera fila. Un anuncio en **4,95** necesita **79 estancias perfectas** para absorber una sola estrella, frente a 13 de un anuncio en 4,70. Cuanto más alta la valoración, más cara es de borrar una mala reseña, porque queda menos margen por cada cinco estrellas. Un anuncio en 4,95 gana solo 0,05 por estancia perfecta; uno en 4,70 gana 0,30. Esta es la parte contraintuitiva que los anfitriones nunca ven venir: **limar su valoración hacia el 5,0 lo hace más frágil, no más seguro.** Cuanto más cerca del techo, más larga es la recuperación tras la caída.

Y depende mucho de qué valoración baja le haya tocado. El mismo anuncio en 4,90, reseñas distintas:

| La reseña que recibió | Cinco estrellas para borrarla (desde 4,90) |
| --- | --- |
| 1 estrella | 39 |
| 2 estrellas | 29 |
| 3 estrellas | 19 |
| 4 estrellas | 9 |

Cuatro estrellas — que la mayoría de anfitriones ni siquiera clasifica como reseña «mala» — cuestan aun así nueve estancias perfectas para borrarlas de un anuncio en 4,90. Por eso los anfitriones que persiguen un 4,9+ en pantalla tratan las cuatro estrellas como fallos: a esa altura, cuatro estrellas es un retroceso real, no un cumplido con error de redondeo.

## Convertir estancias en meses

Nueve o treinta y nueve estancias perfectas suena abstracto hasta que se convierte en tiempo de calendario. No todos los huéspedes reseñan — la tasa de reseñas en Airbnb ronda el 50–70 % según su disciplina al pedirlas. Tome un anuncio con 9 reservas al mes en el que reseña aproximadamente la mitad de los huéspedes: son ~4–5 reseñas frescas al mes.

A cinco reseñas al mes, la deuda de 39 estancias del anuncio en 4,90 son **unos ocho meses** de nada más que cinco estrellas. Ocho meses en los que una sola de cuatro estrellas reinicia parte del contador, porque la cuenta de recuperación de arriba supone una racha *ininterrumpida*. Cuele una de cuatro estrellas en la carrera y habrá añadido su propia deuda encima: la racha hace doble trabajo, y cualquier grieta estira el plazo.

Esta es la cifra que debería cambiar su comportamiento. La mala reseña ya ocurrió; es un golpe hundido de 3,90 puntos. Lo que usted controla es la *velocidad* de reseñas — lo rápido que llegan estancias limpias para diluirla. Un anuncio con 4 reseñas al mes se recupera en la mitad de tiempo de calendario que uno con 2, desde el mismo punto de partida. La palanca más potente tras una mala reseña no es la respuesta pública. Es una solicitud de reseña posestancia activada, para que los siguientes quince huéspedes contentos dejen de verdad las cinco estrellas que lo curan. La táctica de la respuesta en sí está en [«Cómo responder a una reseña de tres estrellas»](/blog/responding-to-bad-airbnb-review); lo que mueve la cifra es la velocidad.

## Guest Favorite sube la apuesta

La línea de Superanfitrión de 4,80 tiene margen de verdad. El distintivo más nuevo de Airbnb, **Favorito de los huéspedes (Guest Favorite)**, lanzado a finales de 2023 para marcar los anuncios más queridos, no tiene un umbral numérico duro — pero en la práctica los anuncios que lo llevan se apiñan en torno a 4,9. Airbnb lo describe como una mezcla de valoración, número de reseñas y señales de fiabilidad más que como un umbral único, así que desconfíe de cualquier cifra exacta que circule por internet.

La consecuencia práctica es el meollo. Un distintivo cuya barra efectiva se sitúa cerca de 4,9 no deja casi colchón. En la tabla de la deuda de valoración, un anuncio que vive en 4,90 para mantener Guest Favorite es justo el que paga 39 estancias por borrar una estrella, y una sola de cuatro estrellas en la carrera de recuperación puede bastar para dejarlo fuera de la cohorte. El distintivo que premia una valoración casi perfecta es el mismo que castiga con más dureza una sola mala noche. Si persigue Guest Favorite, la matemática de la recuperación no es una curiosidad: es su modelo de riesgo.

## Qué mueve de verdad la cifra

Tres palancas, de mayor a menor efecto.

**La retirada gana a la recuperación en valor esperado.** Una retirada concedida elimina la reseña, la valoración cae con ella y su media se recalcula en minutos: toda la deuda de 39 estancias se evapora por cinco minutos de trabajo. El éxito de las retiradas ronda el 15–30 % por motivos de política (contenido irrelevante, represalia, extorsión). Incluso con un 20 % de acierto, el borrado instantáneo de una deuda de ocho meses aplasta cualquier remonte a base de estancias. Presente la solicitud de retirada *primero*, antes de la respuesta pública, porque una respuesta hace que el caso parezca resuelto. Los motivos y las tasas de éxito están en [la guía de respuesta a las tres estrellas](/blog/responding-to-bad-airbnb-review).

**La velocidad diluye lo que no se puede retirar.** Para las reseñas que no logre retirar — las justas — la única herramienta es más reseñas limpias, más rápido. Un mensaje de cuatro líneas tras la estancia, al cuarto día, convierte al 35–50 % de los huéspedes que si no callarían. Duplique su tasa de reseñas y reducirá a la mitad su tiempo de recuperación. Ningún otro mando hace eso.

**Deje de optimizar por encima de su techo.** Si su anuncio tiene un límite estructural — calle ruidosa, sin ascensor, tabiques finos — no sostendrá 4,95, y perseguirlo solo convierte cada cuatro estrellas en una crisis. Elija la valoración que sostiene con un trato normal, acumule el lastre del número de reseñas y deje que la media haga su trabajo. Un panel que muestre la valoración media, la velocidad de reseñas y la distancia al Superanfitrión de todos sus anuncios en una sola pantalla — en vez de ir pestaña por pestaña de Airbnb anuncio a anuncio — es exactamente lo que [RentTools](/onboard) reúne en una misma superficie.

## FAQ

**¿Cómo se calcula la valoración global de Airbnb?**
Es la simple media aritmética de las valoraciones globales de todos los huéspedes a lo largo de la vida del anuncio — la suma de todas las valoraciones dividida por su número. No hay decaimiento por el tiempo ni peso por lo reciente en la cifra global, así que una vieja de cinco estrellas pesa igual que la de la semana pasada. Lo que se muestra es esa media bruta, redondeada a un decimal.

**¿Cuántas cinco estrellas cancelan una estrella?**
Para volver a su media anterior exacta, la cuenta es `(P − 1) / (5 − P)`, donde `P` es la media que tenía. En 4,90 son 39 estancias de cinco estrellas; en 4,85 son 26; en 4,80 son 19. La cifra no depende de cuántas reseñas ya tenga, solo de la media que quiera restaurar.

**¿Duele más una mala reseña cuando tengo menos reseñas?**
El mismo día, sí: la caída inmediata es `(P − k) / (N + 1)`, así que un número de reseñas `N` menor da una caída visible mayor. Una estrella lleva un anuncio de 20 reseñas de 4,90 a 4,71, pero uno de 200 reseñas solo a 4,88. El tiempo para borrarla del todo, en cambio, es idéntico en ambos.

**¿Una estrella me costará el Superanfitrión?**
Solo si su anuncio es pequeño. Por debajo de unas 50 reseñas en una media de 4,90, una estrella puede empujar la media bruta bajo el umbral de 4,80 y costarle el distintivo en el siguiente recálculo trimestral. Por encima, tiene suficiente historial de cinco estrellas para que una sola reseña baja se mantenga con holgura sobre la línea.

**¿Una reseña de cuatro estrellas es mala para mi valoración?**
Con media alta, sí. Cuatro estrellas en un anuncio de 4,90 tiran de la media hacia abajo y cuestan nueve estancias impecables de borrar. Solo se lee como «buena» frente a anuncios en 4,5. Si defiende un 4,9 en pantalla o persigue Guest Favorite, trate las cuatro estrellas como fallos.

**¿Cuánto tarda en recuperarse una valoración de Airbnb en tiempo real?**
Convierta estancias en meses según su tasa de reseñas. Un anuncio en 4,90 necesita 39 estancias limpias; a unas cinco reseñas al mes, eso son alrededor de ocho meses de cinco estrellas sin cortes. Una velocidad de reseñas mayor lo acorta en la misma proporción: un anuncio que suma reseñas el doble de rápido se recupera en la mitad del tiempo de calendario.

**¿Debo pedir a un huésped que retire o cambie su reseña?**
No puede obligarlo, y insistir suele salir mal. Su mejor opción es una solicitud formal de retirada a Airbnb por motivos de política — contenido irrelevante, represalia o extorsión documentada — que, si se concede, elimina la reseña y su efecto sobre la valoración al instante. Busque eso antes de pasar ocho meses sobrealojando la cifra.

## Una opinión con filo

Los anfitriones tratan una mala reseña como una herida que cicatriza sola si uno sigue alojando bien. La matemática dice lo contrario: una sola estrella en un anuncio de 4,90 es una deuda de 39 estancias perfectas, y el tiempo solo la paga tan rápido como llegan reseñas limpias. Las dos cosas que de verdad saldan esa deuda son una solicitud de retirada presentada en la primera hora y un mensaje de petición de reseña que duplica la rapidez con que los siguientes quince huéspedes dejan cinco estrellas. Todo lo demás — la sufrida respuesta pública, la bajada de precio, la semana de dudas — mueve la cifra en nada. Si va a obsesionarse con una reseña, obsesiónese con las dos palancas que son aritmética, no con la que solo se siente productiva.
