---
slug: duplicate-calendar-entry-check
locale: es
title: "¿Entrada duplicada o doble reserva? Comprueba el origen"
excerpt: "Dos barras superpuestas no prueban dos reservas. Identifica sus fuentes, compara las estancias confirmadas y mantén protegidas las noches ocupadas."
status: published
tags:
  - calendar-sync:Sincronización de calendarios
  - host-tips:Consejos para anfitriones
ogImageUrl: /blog-covers/duplicate-calendar-entry-check.webp
ogImageWidth: 1600
ogImageHeight: 900
tldr: |
  - Relaciona cada entrada superpuesta con el anuncio correcto y su reserva original antes de modificar nada.
  - Distingue una estancia mostrada dos veces, una reserva con cierre manual y dos reservas confirmadas reales.
  - Corrige la causa identificada y revisa disponibilidad y limpieza; no borres un calendario solo para ordenar la pantalla.
---

Dos barras cubren las mismas fechas en el calendario del alojamiento. Resulta tentador quitar una para que la pantalla parezca correcta. Antes, aclara qué representa cada una: la misma estancia recibida por dos vías, una restricción de disponibilidad o dos reservas reales que no pueden alojarse a la vez en la misma vivienda.

Esa diferencia determina la acción. Un problema de visualización o importación exige rastrear registros y conexiones; un conflicto real requiere gestionar las reservas. Ninguno se resuelve de forma segura borrando la primera entrada que parezca sobrante.

## Rastrea ambas entradas hasta sus registros originales

Empieza por la unidad alquilable correcta, no solo por un nombre de anuncio parecido. Abre la fuente de cada entrada cuando sea posible y compara plataforma, llegada, salida y estado actual con la cuenta donde se hizo la reserva. Conserva las referencias en notas privadas. Un color o título de evento es una pista, no la confirmación de otro huésped.

La [guía de sincronización de Airbnb](https://www.airbnb.com/help/article/99) describe cómo se transmiten noches reservadas y algunos bloqueos de disponibilidad. Por eso, investiga un intervalo cerrado en otro calendario antes de contarlo como una reserva adicional.

Anota la dirección de cada conexión que pueda aportar ese intervalo. Comprueba si un registro local y un evento importado describen la misma reserva de origen o si dos calendarios se están tomando por dos ventas independientes. Las fechas iguales no bastan: distintos huéspedes pueden reservar las mismas noches y una reserva modificada puede conservar fechas antiguas en un receptor.

Para una investigación técnica, la [sección UID de la especificación iCalendar](https://www.rfc-editor.org/rfc/rfc5545#section-3.8.4.7) define un identificador del componente de calendario. Úsalo para rastrear un evento, no para sustituir la comprobación de la reserva. No edites identificadores como arreglo rápido ni publiques direcciones completas de exportación al pedir ayuda.

**Comparación ilustrativa:** la cuenta original confirma una estancia de martes a viernes. Dos representaciones del calendario corresponden a esa misma estancia. Las noches ocupadas siguen siendo martes, miércoles y jueves: tres, no seis. Solo puedes concluirlo después de confirmar una única reserva real; las barras iguales no lo demuestran por sí solas. Revisa el [límite del día de salida](/es/blog/ical-checkout-day-blocked) si una vista parece alargarla.

## Clasifica la situación según lo confirmado

Elige el siguiente paso a partir de los registros originales, no de la explicación que permita limpiar la pantalla más fácilmente.

| Evidencia confirmada | Qué significa | Siguiente acción |
| --- | --- | --- |
| Una reserva activa aparece dos veces | Representación duplicada de una estancia | Rastrear los registros o la conexión; mantener protegidas las noches ocupadas. |
| Dos reservas activas de la misma unidad comparten una noche ocupada | Conflicto real de reservas | Avisar pronto al responsable y a las plataformas; no borrar una reserva para ocultarlo. |
| Una reserva y un cierre manual independiente | Estancia más restricción de disponibilidad | Averiguar el motivo del cierre antes de cambiarlo. |

Si todavía no puedes comprobar una fuente, deja la clasificación abierta. No habilites una noche que sabes ocupada solo porque la segunda entrada tenga una etiqueta confusa. La [revisión de fechas bloqueadas](/es/blog/blocked-calendar-dates-not-reservations) ayuda a distinguir reservas de otras restricciones.

## Corrige la capa adecuada y revisa la próxima estancia

RentTools importa eventos por alojamiento y plataforma y utiliza el identificador del evento al conciliarlos. Eso no implica que las entradas parecidas de distintas fuentes sean reservas diferentes ni que cualquier solapamiento pueda fusionarse automáticamente. Establece primero su relación con la reserva original.

No elimines una conexión solo para despejar la vista. Borrar un enlace de RentTools también elimina los eventos importados de esa plataforma para el alojamiento. La pantalla puede parecer más tranquila mientras desaparece información útil sobre disponibilidad. Si la conexión es incorrecta, utiliza la [lista para sustituir un enlace de calendario](/es/blog/replace-calendar-feed-checklist) y protege las noches afectadas mientras la corriges.

Cuando cambie la reserva original, compara sus fechas actuales con cada receptor después de la siguiente importación. Si una vista sigue anticuada, investiga esa ruta de actualización en vez de crear otra reserva para compensar. Corrige solo el registro o ajuste cuya función hayas establecido. Anota el cambio para que otra persona del equipo no repita la misma limpieza.

Ante dos reservas reales, conserva ambos registros originales visibles para quien gestione el conflicto. Contacta con el soporte de las plataformas correspondientes e informa a los huéspedes con datos exactos según proceda. Esta guía no promete exenciones de cargos, importes de devolución ni resultados de realojamiento.

Termina revisando los calendarios de venta y la preparación: las noches ocupadas siguen cerradas, las restricciones ajenas se conservan y la salida real tiene un plan de limpieza acordado con una persona responsable. Dos barras no justifican enviar dos equipos de limpieza. Una vista más ordenada tampoco demuestra que todo esté listo para la próxima llegada.
