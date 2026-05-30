---
slug: wifi-short-term-rental-setup
locale: es
title: "Wi-Fi para alquiler vacacional: velocidad, router y respaldo 4G"
excerpt: "Los Mbps que de verdad necesitan los huéspedes, el router que no cae al cuarto mes y el respaldo 4G que convierte tres noches sin conexión en un no-evento."
status: published
tags:
  - host-tips:Consejos anfitrión
  - tools:Herramientas
  - automation:Automatización
ogImageUrl: /blog-covers/wifi-short-term-rental-setup.webp
ogImageWidth: 1600
ogImageHeight: 900
---

La primera valoración de una estrella por el Wi-Fi me la dejaron por un router que funcionó perfectamente 47 semanas al año. La semana en que falló, una huésped que teletrabajaba vio cómo se le caía la videollamada tres veces en doce minutos, se rindió, no consiguió abrir un ticket de soporte desde el punto de acceso del móvil y me dejó una reseña titulada «Wi-Fi inutilizable», sin texto. El router se reinició solo aproximadamente una hora después de su salida y siguió funcionando los nueve meses siguientes. Nunca habría sabido que falló si ella no me lo hubiese dicho en público, en el peor momento, en el sitio más leído del anuncio.

Este artículo trata sobre la instalación de Wi-Fi que evita esa valoración. La cifra de Mbps que los huéspedes realmente usan (no la que aparece en la pestaña del speedtest), el router que aguanta más allá del cuarto mes en un piso real y el respaldo 4G de 10 € al mes que convierte el peor tipo de queja en un no-evento antes de que el huésped se entere.

## TL;DR

- La mayoría de los huéspedes necesitan 25 Mbps de bajada, no 100. Compre margen, no la cifra de la página comercial.
- Un router de 40 € basta para un piso. A partir de cuatro pisos, la tasa de fallos hace que un kit mesh de 180 € salga más barato que los reembolsos.
- Un respaldo 4G con eSIM de datos a 10 € al mes cuesta menos al año que reembolsar una sola noche de corte.
- El coste oculto principal es el fallo silencioso: el router cae el primer día de una estancia de cinco noches y usted se entera por la reseña del séptimo.
- SSID y contraseña en tres sitios: tarjeta plastificada en la encimera, guía digital, pegatina en la cerradura inteligente. El huésped encuentra el sitio en el que mira primero.
- Un ping cada 5 minutos y alerta a los tres fallos seguidos. Veinte minutos de configuración una vez y nunca más una reseña «el Wi-Fi no iba».

## Cuántos Mbps hacen falta de verdad

Los anfitriones pagan de más por velocidad porque la página del proveedor hace parecer la tarifa de 100 Mbps diez veces más atractiva que la de 25 Mbps por 15 € de diferencia. Luego un huésped escribe «Wi-Fi lento» en la reseña de un piso con fibra de 1 Gbps que esa mañana medía 480 Mbps.

Lo que «lento» casi siempre significa en esas reseñas:

- La señal bajaba a una raya en el dormitorio. El router estaba en la entrada detrás de un radiador metálico.
- El router cayó 40 minutos durante el día y se reinició solo antes de que el huésped pudiera escribirle.
- El DNS estaba mal configurado y Netflix tardaba 14 segundos en cargar una miniatura.
- El huésped se conectó a la banda de 2,4 GHz porque la de 5 GHz tenía el mismo nombre y el móvil eligió la señal más fuerte, que era la más lenta.

Ninguno de esos problemas se arregla comprando más Mbps. Se arreglan colocando bien el router, con una segunda banda que funcione y con un DNS que no sea el del proveedor por defecto. El presupuesto real de ancho de banda según los usos típicos:

| Uso | Por flujo | Margen cómodo |
| --- | --- | --- |
| Netflix 1080p | 5 Mbps | 8 Mbps |
| Netflix 4K | 25 Mbps | 35 Mbps |
| Zoom / Google Meet HD | 3,5 Mbps subida, 3,5 Mbps bajada | 6 Mbps |
| Spotify | <1 Mbps | 1 Mbps |
| Copia de seguridad en la nube en segundo plano | 5–10 Mbps subida | 15 Mbps subida |

Dos adultos viendo Netflix en 4K en dos televisores distintos mientras una tercera persona hace una llamada de Zoom necesitan unos 80 Mbps de bajada y 8 Mbps de subida. Es el peor caso razonable para un piso de dos habitaciones, y una fibra simétrica 100/100 lo cubre por duplicado.

La cifra que de verdad decide en mercados con muchos trabajadores remotos —Lisboa, Ciudad de México, Bali, Tiflis— es la **velocidad de subida**. Un huésped con cuatro llamadas de Zoom al día, en una tarifa de cable 100/10 con otras tres personas en la red, se topará con el techo de subida una vez por semana y lo llamará «su Wi-Fi». Si puede elegir, vaya a fibra 50/50 o 100/100. Diez euros más, esa reseña ya no aparece.

## El router que aguanta más allá del cuarto mes

He cambiado bastantes routers de consumo en bastantes pisos como para tener una regla: la tasa de fallos de una caja de plástico de 40 € en alquiler vacacional real es lo bastante alta para que, al cuarto piso, el sistema mesh ya esté amortizado.

Lo que se me ha roto de verdad:

- Routers de doble banda baratos (TP-Link Archer C6, clase AC1750): uno de cada tres falla en 18 meses de funcionamiento 24/7. Sobre todo condensadores en cocinas húmedas.
- Gama media en un solo cuerpo (ASUS RT-AX55, Netgear Nighthawk AX1800): uno de cada ocho falla en ese mismo plazo. Suele ser firmware: el aparato funciona, pero la banda de 5 GHz se cae sin avisar y solo un reinicio la recupera.
- Sistemas mesh (TP-Link Deco, Google Nest, eero): uno de cada veinte falla en 24 meses. La redundancia es parte del sistema: si un nodo muere, los demás siguen sirviendo Wi-Fi mientras llega el repuesto.

El cálculo de coste en cuatro pisos a 24 meses vista:

| Configuración | Hardware | Reposiciones | Noches reembolsadas | Total 24 meses |
| --- | --- | --- | --- | --- |
| Router 40 € × 4 | 160 € | 160 € (3 reposiciones) | 400 € (4 noches × 100 €) | **720 €** |
| Gama media 90 € × 4 | 360 € | 180 € (2 reposiciones) | 200 € (2 noches × 100 €) | **740 €** |
| Mesh 180 € × 4 pisos (2 nodos cada uno) | 720 € | 90 € (1 reposición) | 100 € (1 noche × 100 €) | **910 €** |

El mesh es el peor en la columna de hardware. Es el mejor en la columna de experiencia del huésped: desaparece la zona muerta del dormitorio del fondo, la reseña «se cortaba la señal» no llega y el único reembolso completo que evita vale seis meses de la diferencia. Al quinto o sexto piso, mesh es la línea más barata.

Para un piso pequeño basta un router sólido de gama media. El umbral en el que el mesh empieza a pagar la inversión está en torno a **80 m² de superficie habitable o tres habitaciones con puertas cerradas entre el router y la cama**. Por debajo de eso, un único AX1800 bien colocado gana.

## El respaldo 4G que casi nadie instala

Aquí está la cifra que cambia la conversación: un router con respaldo 4G (o un módem USB conectado al router principal) con una tarjeta de datos a 8–12 € al mes sale alrededor de **140 € al año**. Una noche reembolsada en un anuncio de 90 € son **90 € más la reseña perdida**. La cuenta del respaldo 4G deja de tener sentido a partir del primer corte evitado.

Las configuraciones habituales:

- Un router doméstico con puerto USB que acepta un módem 4G USB (TP-Link Archer C7, Netgear Nighthawk, la mayoría de firmwares AsusWRT). Se enchufa el módem, se configura el failover en la administración, listo. ~40 € el módem, 8 € al mes la SIM.
- Un equipo dedicado de failover 4G (TP-Link MR600, Teltonika RUT240, Cradlepoint para el segmento corporativo). Se coloca entre módem y switch; cuando cae el WAN, el tráfico pasa a 4G sin corte. ~100 € el equipo, 10 € al mes la SIM.
- Un mesh con backhaul 4G nativo (TP-Link Deco X20-4G, Nest WiFi Pro con un móvil asociado). Más caro en hardware, pero toda la red —incluidas las zonas muertas— sigue funcionando.

El mercado de eSIM hace esto barato en 2026. **Airalo** y **Holafly** venden eSIM solo de datos por 5–10 € al mes en la mayoría de países, sin contrato y sin cambio de SIM física; muchos equipos de failover ya soportan eSIM directamente. Hace tres años esta opción no existía para anfitriones aficionados; hoy son los 150 € más rentables que un anfitrión puede invertir en un piso.

Un matiz: la velocidad del respaldo es 4G, no fibra. Un huésped a mitad de una llamada de Zoom cuando cae la fibra verá uno o dos segundos de bajón de calidad mientras entra el respaldo, y si el piso solo capta dos rayas de 4G, el resto del día será «el Wi-Fi va lento» en vez de «el Wi-Fi no va». El primero es una reseña de cuatro estrellas. El segundo, un reembolso y una estrella.

## La monitorización que detecta el fallo silencioso

El router puede estar funcionando y la conexión a internet, muerta. Cortaron el cable del edificio, el proveedor tiene una caída regional, el módem se ha colgado y el router no se ha dado cuenta. Nada de eso aparece como fallo del router en su panel de administración. La única manera de saberlo es probar desde fuera de la red.

La configuración que mantengo en cada piso, gratis:

1. Un pequeño script de heartbeat en una Raspberry Pi de 35 € o, más habitual hoy, en un VPS, que hace ping a la IP pública del piso cada 5 minutos.
2. Tras tres fallos seguidos (15 minutos sin respuesta), manda un mensaje a Telegram o Slack.
3. Tras 30 minutos de fallos, manda además un mensaje al equipo de limpieza con la plantilla «por favor, reinicie la caja con la pegatina verde».

Tiempo total: 20 minutos en el primer piso, 5 minutos en cada uno posterior. La primera alerta llega aproximadamente una hora antes de que el huésped lo note, y en el 80 % de los casos el router se puede reiniciar en remoto (o se manda al equipo de limpieza) antes de que el huésped vea nada.

Si no quiere mantener un script, las alternativas alojadas más baratas:

- **UptimeRobot** plan gratuito: 50 monitores, intervalo de 5 minutos, alertas por correo y push. 0 € al mes.
- **BetterStack** (antes Better Uptime) plan inicial: intervalo de 30 segundos, turnos de guardia. 20 € al mes para operadores serios.
- Un router doméstico con ping-watchdog integrado (la mayoría de builds de AsusWRT y OpenWRT): sin servicio externo.

Es la hora de trabajo de Wi-Fi más rentable que un anfitrión hará en su vida. El fallo que de otro modo habría sido una estrella se captura, y usted se entera a las 11:30 de la mañana, cuando hay tiempo para resolverlo, no a las 23:45 cuando el huésped ya está escribiendo.

## Dónde busca el huésped la contraseña de verdad

Tres sitios. El huésped mira a uno de ellos y jamás a los otros dos:

1. **Una tarjeta plastificada en la encimera o en la mesa de la entrada.** Plástico, A6. SSID y contraseña en 24 puntos en negrita, para que un móvil con la pantalla rota los lea a un metro. Coste: 2 € de impresión, 1 € de plastificado, 4 minutos.
2. **La guía digital.** El mismo SSID y la misma contraseña como primera línea del apartado de Wi-Fi. Si usa [una herramienta de guía digital](/es/blog/digital-guidebook-short-term-rental), el campo ya está ahí. Si no, mande la información del Wi-Fi en un mensaje independiente 30 minutos después del check-in, no dentro del párrafo de bienvenida.
3. **Una pegatina pequeña en el teclado de la cerradura inteligente o en la caja de llaves.** Tres líneas: SSID, contraseña, «si el Wi-Fi no va, escríbame primero». Es la que encuentran los huéspedes que llegan a medianoche y no ven la tarjeta de la cocina porque la luz está apagada.

He dejado de escribir el Wi-Fi en el mensaje de bienvenida. Los huéspedes hacen scroll y vuelven a pedirlo después en una de cada tres estancias. La tarjeta en la encimera y la pegatina en la cerradura se leen una vez por cada huésped en el primer minuto.

## Qué hacer cuando el Wi-Fi cae a mitad de estancia

El plan se parece al [procedimiento para fallo del autocheck-in](/es/blog/self-check-in-failure-playbook): el primer minuto, un mensaje; la primera hora, la solución; después del incidente, la reseña.

Primer minuto: confirme recepción en menos de 5 minutos. «Veo la alerta, el respaldo 4G debería estar activo en 30 segundos; espere 60 segundos y vuelva a conectarse; si no funciona, escríbame». Si su monitorización avisa antes que el huésped, este mensaje sale antes del suyo y todo el incidente pasa de queja a punto a favor de servicio.

Primera hora: si el respaldo 4G está activo, la red ha vuelto. Si no, dos opciones:

- Reinicio remoto (enchufe inteligente en el router/módem, 15 € en cualquier tienda online, manejable desde el móvil del anfitrión): se resuelven el 90 % de los problemas en el lado del router.
- Visita del equipo de limpieza o del co-anfitrión: 30 minutos de respuesta en la mayoría de ciudades, 5 minutos in situ, problema resuelto.

La compensación: si el corte ha durado menos de 90 minutos, la oferta correcta es «le amplío el check-out una hora y le envío un vale de café para la cafetería de abajo». Si han sido 6 horas o más, lo correcto es reembolsar una noche con un «esto no va a volver a pasar y esto es lo que hemos cambiado» explícito. No ofrezca reembolso parcial antes de que el huésped lo pida: lo entrena para pedir más la próxima vez. En cuanto él lo mencione una vez, reembolse rápido y de forma visible, antes de que publique la reseña.

## FAQ

**¿Cuántos Mbps necesito para un Airbnb?**

Para la mayoría de pisos, 50–100 Mbps de bajada con al menos 10 Mbps de subida es lo cómodo: dos flujos 4K simultáneos más una llamada de Zoom van sin problemas. Las tarifas más baratas (25/5) cubren un flujo y navegación ligera, bien para un estudio, insuficiente para una familia en un piso de tres habitaciones. La fibra simétrica (100/100) es la mejora que más nota un huésped en teletrabajo, porque la subida es donde las tarifas de cable estrangulan las llamadas.

**¿Merece la pena el Wi-Fi mesh para un solo alquiler vacacional?**

Para un estudio o un piso de un dormitorio de menos de 60 m², no: un router de gama media bien colocado basta y sale más barato. Para un piso de dos o más dormitorios, una planta en L o una habitación con puerta cerrada entre el router y la cama, sí: el kit mesh de 180 € elimina la zona muerta del dormitorio del fondo, que es la que provoca la mayoría de reseñas «Wi-Fi lento». Cuando tiene tres o cuatro pisos, las estadísticas de fallo también inclinan la balanza hacia mesh.

**¿Cuál es el respaldo 4G más barato para un alquiler vacacional?**

Un módem 4G USB (30–40 €, Huawei E3372 o similar) en un router con soporte USB-WAN más una eSIM solo de datos a 5–10 € al mes de Airalo o de un operador local, total 100–150 € el primer año. Un equipo dedicado de failover (TP-Link MR600, Teltonika RUT240) cuesta más por hardware pero se instala en un minuto. Ambos se amortizan con el primer corte evitado en un piso que cobra 70 € o más por noche.

**¿Debo separar el Wi-Fi de los huéspedes de mi red de administración?**

Sí. La mayoría de routers de consumo y prosumer permiten una red de invitados: actívela, ponga ahí el SSID y la contraseña públicos y deje la red de administración con otro SSID y acceso solo para usted y los dispositivos del hogar inteligente. Así el huésped no puede reiniciar el router por error, no puede reflashearlo y no puede acceder al panel web de una cerradura inteligente. Además le permite reiniciar la red de invitados sin tirar abajo la cerradura.

**¿Cómo demuestro que el Wi-Fi funcionaba cuando un huésped dice lo contrario?**

Use una monitorización externa (UptimeRobot, BetterStack, un script de ping autoalojado). La monitorización produce una página de estado pública o un registro descargable con pings cada 5 minutos. Si un huésped escribe «el Wi-Fi estuvo caído toda la estancia» y el registro dice 100 % de disponibilidad, tiene pruebas para reclamar al soporte de Airbnb, que a veces retira o modera reseñas basadas en afirmaciones verificables. La monitorización se paga con la primera reclamación que prospere.

**¿Puede un huésped cambiar la configuración del router?**

Si está en la red de administración y sabe la contraseña de administrador (a veces impresa en el router), sí: puede cambiar los ajustes, renombrar la red, cambiar la contraseña y dejarle sin acceso. En una red de invitados bien configurada, no: no hay acceso al panel de administración. Cambie la contraseña de administración por defecto el mismo día de la instalación; los valores por defecto son públicos y algunos huéspedes con mala fe sí los prueban.

**¿Necesito un portal cautivo o un acuerdo de uso aceptable?**

En la mayoría de países, no: el huésped no es un usuario de Wi-Fi público, es un inquilino que paga y usa una comodidad incluida. En algunas jurisdicciones (Italia, partes de España), históricamente se exigía identificación para cualquier Wi-Fi comercial; en la práctica, rara vez se aplica al alquiler vacacional. Si quiere doble protección, un portal cautivo de una pantalla con «al conectarse, acepta no usar la red para fines ilegales; el tráfico queda registrado» se configura en 20 minutos en la mayoría de routers prosumer y traslada limpiamente la responsabilidad al huésped.

**¿Qué marca de router aguanta de verdad en clima cálido o húmedo?**

En mis pisos, ASUS y TP-Link de gama media han durado un 50 % más que Netgear de consumo en apartamentos costeros húmedos. Los sistemas mesh con refrigeración pasiva (sin ventilador) viven más que los de refrigeración activa porque los ventiladores se atascan. La medida que de verdad alarga la vida y supera cualquier elección de marca: colocar el router en el rincón más fresco de la habitación, al menos 30 cm sobre el suelo y con 10 cm libres a cada lado. Un router en una balda alta de un pasillo ventilado vive el doble que el mismo router encima del mueble del televisor junto al radiador.

## Una opinión clara

La mayoría de anfitriones pagan de más por velocidad y pagan de menos por disponibilidad. Un huésped olvidará los 100 Mbps al tercer día de su estancia. Nunca perdonará cero Mbps el primero. Si solo se lleva una cosa de este artículo: configure [una alerta de monitorización](/es/onboard) antes de salir a comprar router. El router que ya tiene probablemente está bien, y el fallo silencioso del que no se ha enterado es el verdadero autor de la próxima reseña.
