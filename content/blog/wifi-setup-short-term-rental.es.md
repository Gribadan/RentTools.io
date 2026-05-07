---
slug: wifi-setup-short-term-rental
locale: es
title: "WiFi en alquiler corto: velocidad, mesh y red de Huéspedes"
excerpt: Cuánta velocidad WiFi necesita un alquiler corto, cuándo un router solo bate al mesh y por qué la red de Huéspedes no es opcional en 2026 — con cuentas y picks de hardware.
status: published
tags:
  - host-tips:Consejos para anfitriones
  - tools:Herramientas
  - guest-comms:Comunicación con huéspedes
ogImageUrl: /blog-covers/wifi-setup-short-term-rental.webp
ogImageWidth: 1600
ogImageHeight: 900
---

La primera reseña de 1 estrella que me gané fue por WiFi. Una familia de cuatro entró en mi piso de 65 m² en Tashkent un viernes de marzo, y al sábado al mediodía el padre me mandó un mensaje de cuatro líneas: *«El WiFi se corta en el dormitorio. No puedo trabajar. Nos vamos el domingo.»* El router era el combo de plástico blanco que me había dado mi ISP cuatro años antes, en la cocina detrás de un radiador metálico, emitiendo en un piso de pared de ladrillo en el mismo canal de 2,4 GHz que otros 14 pisos. Arreglarlo costó 120 $ de hardware nuevo y una hora de tirar cable. La reseña la dejé.

Este es el artículo que ojalá hubiera leído ese febrero. Qué velocidad necesita el anuncio de verdad —medida en Mbps, no en márketing del ISP—, cuándo un solo router deja de bastar, por qué una red de Huéspedes no es opcional en 2026 y tres niveles honestos de hardware con los modos de fallo que nadie reseña en Amazon.

## TL;DR

- Una familia de 4 trae **10 a 14 dispositivos conectados**, no 4. Planifica para 12 clientes simultáneos como mínimo.
- Para hogar de streaming 4K más una llamada de trabajo, el suelo es **75 Mbps de bajada / 15 Mbps de subida**, medido en la esquina más lenta del piso, no en el router.
- Un router cubre hasta ~**55 m² de piso de ladrillo**. Pasado eso, mesh; el cruce es nítido.
- **Usa siempre SSID dedicada para Huéspedes.** No por educación —por RGPD, por no exponer tu NAS / impresora / cámaras y por aislamiento cuando un Android lleno de malware empieza a hacer ARP-storm en la LAN—.
- Coste total de propiedad del stack en un piso es **80 a 400 $ una vez**, más 35–60 $/mes del ISP. La opción cara se paga el momento en que una reseña por WiFi te cuesta 300 $ en reservas perdidas.

## Qué significa «suficientemente rápido»

La mayoría pregunta «¿100 Mbps basta?». La respuesta honesta: depende de qué hay conectado y dónde.

Un grupo típico de cuatro Huéspedes llega con: 4 móviles, 1 o 2 portátiles, 1 smart TV (suya o tuya, a menudo ambas), 1 tablet, 1 Kindle, 1 smartwatch cada uno, ocasionalmente Switch o Steam Deck, ocasionalmente vigilabebés. Son 11 a 14 clientes en el AP. No transmiten todos a la vez, pero todos mantienen conexión abierta.

Mbps realistas por tarea, en **bajada**:

| Tarea | Bajada | Subida | Notas |
|---|---|---|---|
| Netflix HD | 5 Mbps | 0,1 | Un stream. |
| Netflix 4K | 25 Mbps | 0,1 | El grande. |
| YouTube 4K | 20 Mbps | 0,1 | |
| Llamada Zoom HD | 3,5 Mbps | 3,5 | Simétrica. |
| Google Meet HD | 3,5 Mbps | 3,5 | |
| Spotify | 0,3 Mbps | 0 | Insignificante. |
| Sync iCloud / Google Photos | 5 Mbps | 25 Mbps | La dirección importa. |
| Descarga juego Steam | 80–200 Mbps | 0 | Satura cualquier cosa bajo fibra. |

Carga realista del peor rato un viernes noche: Netflix 4K en TV (25), un padre en Zoom (3,5/3,5), un adolescente en YouTube 4K (20), Spotify de fondo (0,3) y un móvil subiendo silenciosamente 800 fotos a 25 Mbps de subida.

Total: ~**50 Mbps bajada, 30 Mbps subida**, sostenidos 90 minutos. Suma 30 % de margen para retransmisiones y el suelo es **75 bajada / 40 subida**. La mayoría de ISPs venden «100 Mbps» como 100 bajada / 10 subida —ese 10 de subida es lo que falla al Huésped trabajando desde casa—. Paga simétrica 100/100 de fibra si existe en tu zona; la diferencia mensual rara vez supera 5 $.

El número que anuncias en tu listing es el **menor de dos**: lo que el ISP prometió y lo que tu peor esquina entrega de verdad. Corre [fast.com](https://fast.com) desde el dormitorio más alejado del router. Ese número, menos 20 %, es lo que dice una descripción honesta.

## Router solo vs mesh: dónde está la línea

La respuesta barata es: «el piso es pequeño, un router basta». La respuesta barata acierta la mitad de las veces.

Lo que limita cobertura son **paredes, no metros cuadrados**. La placa de yeso pierde ~3 dB en la banda 5 GHz por pared. El ladrillo, 8 dB. El hormigón armado, 12 dB+. Cruzadas dos paredes de ladrillo, una señal 5 GHz pierde el 75 % de su potencia y tu móvil cae a 2,4 GHz, que en cualquier edificio está atascada de 30 dispositivos vecinos y microondas.

Rango aproximado de un router en construcción real:

- **Yeso + montantes (piso típico US):** un router cubre hasta ~85 m².
- **Piso de ladrillo / construcción europea:** un router cubre hasta ~55 m².
- **Hormigón armado / construcción soviética:** un router cubre hasta ~35 m².

Pasados esos números, el mesh bate siempre. El suelo del mesh son dos nodos; el segundo a medio camino entre el primero y la esquina muerta. Backhaul cableado (cable Ethernet entre los dos, escondido bajo zócalo) vale los 15 minutos de instalación —el backhaul inalámbrico te cuesta sobre la mitad del throughput en el segundo nodo—.

El cruce es más nítido de lo que las hojas de spec sugieren. Bajo el umbral, un router de 90 $ machaca a un mesh de 200 $ en throughput crudo en su propia ubicación. Sobre el umbral, un mesh de 200 $ machaca a un router de 400 $ en la esquina muerta. **Specea el piso, no tu gusto.**

## La red de Huéspedes no es opcional

Tres razones por las que una SSID separada deja de ser «nice-to-have» y pasa a ser requisito duro, en orden de cuánto duele faltar:

1. **Privacidad y RGPD.** Cuando un Huésped se une a tu WiFi principal, escanea la LAN. Ve el hostname de tu impresora (`HP-LaserJet-2055-OFFICE`), tu NAS (`SYNOLOGY-FAMILY`), el nombre de tu portátil, a veces el hostname de tu cámara. Nada es ilegal de revelar, pero en jurisdicciones UE es exactamente la fuga incidental de datos que el artículo 32 («medidas técnicas apropiadas») del RGPD espera que diseñes para evitar. Una SSID dedicada con **AP isolation** activado —cada dispositivo Huésped ve solo el gateway, ningún otro cliente— resuelve esto en una casilla. La mayoría de routers modernos lo expone bajo «Red de invitados → Aislamiento de cliente». Para el cuadro completo, mira [RGPD para Anfitriones](/blog/gdpr-for-vacation-rental-hosts).
2. **Aislamiento de throughput.** El Android de un Huésped con app malintencionada empieza ARP-spoofing en la LAN, o descarga un juego de 60 GB en background. En red plana, tu cámara IP tartamudea. En VLAN aislada de Huéspedes, la cámara no se entera.
3. **Rotación de credenciales.** Cuando cambias la contraseña de Huéspedes (deberías, cada 4 a 8 semanas), no rompes tus dispositivos en la SSID principal. Dos SSIDs, dos contraseñas, dos vidas.

El setup correcto es una SSID principal para tus dispositivos (cámaras, cerraduras, NAS) y una de Huéspedes con aislamiento. Ambas en el mismo hardware; el router emite dos redes. Cualquier router de 60 $ en adelante lo soporta en 2026. Si el tuyo no, cámbialo.

Una nota sobre nombres: no nombres la SSID de Huéspedes con el número de piso («APT-12-Guest»). Le dice a los transeúntes qué unidad es de alquiler corto, una señal baja que marca tu piso en edificios con comunidades anti-Airbnb. Pon nombre genérico. «WiFi-2.4» va bien.

## Tres niveles honestos de hardware

Elige el nivel que case con tu tamaño de piso y tu tolerancia para perseguir problemas.

### 60–120 $: TP-Link Archer AX55 o equivalente

Un router WiFi 6 único. Clase AX3000 es el suelo. Cubre hasta 55 m² de ladrillo o 85 m² de yeso de forma fiable. Dos SSIDs (principal + Huésped) con aislamiento. QoS decente para que el torrent de un Huésped no estrangule la videollamada de otro. Setup de cinco minutos por la app, luego desconecta la app y deja correr.

Es el nivel correcto para estudio o 1D hasta ~55 m². Es el nivel equivocado para un 2D con paredes de ladrillo entre habitaciones —el WiFi del dormitorio medirá 12 Mbps y la reseña dirá «inutilizable»—.

### 180–280 $: Asus ZenWiFi XD4 / Eero 6+ / TP-Link Deco X55 — mesh de 2

Mesh de dos nodos. Ambos hacen WiFi 6. Un nodo en el gateway, uno en el punto medio del piso. Con backhaul Ethernet (cable bajo zócalo, terminado en jack de 4 $ en cada extremo), el segundo nodo entrega ~85 % del throughput del primero. Sin backhaul, ~50 %.

Nivel correcto para 60 a 100 m². El Eero es el más fácil de configurar pero también el más ruidoso pidiendo cuenta de Amazon; si evitas cuentas Amazon por principio, elige Asus o TP-Link.

### 320–420 $: Asus ZenWiFi XT9 / Ubiquiti UniFi Express + AP — mesh de 3 o nivel pro

Mesh de tres nodos o hardware prosumer. Vale la pena pasados los 100 m², o en cualquier piso con hormigón armado, o si la planta es L incómoda que un solo mesh no puede puentear.

La opción Ubiquiti dobla como mejor jugada a largo: deja separar la SSID de Huéspedes en VLAN real con caps de ancho de banda, programar la red de Huéspedes para despertarse a las 14:00 (check-in) y dormir a las 11:30 (check-out), y sacar logs de tráfico por estancia si un Huésped impugna algo. La curva de setup es más empinada —planifica una hora, no diez minutos—, pero solo lo configuras una vez.

### Qué saltar

- El combo modem-router de tu ISP. Son fiables como módems y débiles como routers. Pon el combo en bridge mode, enchufa el router nuevo en su puerto WAN y olvida el WiFi del combo a partir de ahí.
- Cualquier cosa que diga «AC1200» o «N300» en 2026. Es hardware 802.11ac y 802.11n vendido bajo coste. El suelo de WiFi 6 (AX1500 / AX3000) cuesta 20 $ más y te ahorra el cambio en menos de dos años.
- Extensores WiFi (los enchufables monobanda). Cortan throughput 50 % y doblan la latencia. Mesh es la respuesta correcta si un router solo no llega.

## Los modos de fallo de los que nadie avisa

Tres fallos específicos se comen el 30 % de tus dolores de cabeza WiFi del primer año:

**Caída del ISP un sábado por la mañana.** Tu fibra cae, no te enteras en 90 minutos, la reseña del Huésped dice «sin internet». Dos arreglos. (1) Un dongle 4G/5G failover en USB o WAN-2 del router, configurado para asumir cuando el primario muere. Hardware 40 $, SIM con 50 GB/mes 10 $. (2) Una página de estado para Huéspedes —incluso una tarjeta impresa en la nevera que diga «¿Internet caído? Escribe al Anfitrión a +X. Tenemos respaldo 4G»—. Ambas opciones limitan el peor caso.

**El abarrotamiento de 2,4 GHz del que nadie habla.** En cualquier edificio urbano, la banda 2,4 GHz es inutilizable por encima del piso 4 —cada vecino, cada microondas, cada altavoz Bluetooth está ahí—. Fuerza dispositivos IoT que *solo* hablan 2,4 GHz (bombillas, cerradura, vigilabebés barato) a una SSID «IoT» separada emitiendo solo en 2,4 GHz. Tu móvil y portátil se unen a la principal 5 GHz / 6 GHz y nunca ven el atasco.

**El router que no se reinicia en 9 meses.** Los routers de consumo tienen fugas de memoria. Al sexto mes están al 30 % del rendimiento del día 1 y un Huésped escribe reseña de WiFi que no entiendes porque tu speedtest del mes 7 desde tu casa muestra 200 Mbps. Programa auto-reboot semanal en el panel del router —cada martes a las 04:00—. La mayoría lo expone; algunos requieren timer de 4 $. El arreglo aburrido que te recupera el 90 % de las reseñas «el WiFi se ralentizó».

## FAQ

**¿Qué velocidad de bajada/subida pongo en mi listing de Airbnb?**
Lista el **menor de dos**: la velocidad publicada por tu ISP y el resultado de [fast.com](https://fast.com) desde el dormitorio más alejado. Resta 20 % por el caso noche mala. Si tienes 200/100 fibra y el dormitorio mide 65 Mbps a las 22:00, lista «60 Mbps». Listings inflados son el driver más grande de reseñas WiFi de 1 estrella.

**¿De verdad necesito red de Huéspedes para un Huésped a la vez?**
Sí. La razón no es throughput —es que el móvil del Huésped escaneará tu LAN quieras o no, y ver el hostname de tu NAS es el detalle «me sentí vigilado» que viaja por Reddit—. Configura la SSID de Huéspedes una vez, vete, no pienses más en ello.

**¿Vale el mesh para un estudio de 45 m²?**
No. Un router WiFi 6 cubre 45 m² en cualquier construcción salvo bunker. Ahorra los 100 $ y mételos en [matemáticas cerradura vs caja](/blog/smart-lock-vs-lockbox-cost-math).

**¿Puedo cobrar el WiFi como tarifa aparte?**
Técnicamente sí en la mayoría de plataformas; en la práctica no —los Huéspedes 2026 esperan WiFi incluido como esperan electricidad—. Cobrarlo aparte tira tu conversión 8–12 % en los pocos estudios sobre esto. Mételo en la tarifa por noche y sigue.

**El módem de mi ISP es también router. ¿Necesito comprar otro?**
Para estudio, a veces sales con el combo. Para algo mayor, el WiFi del combo es muy débil. Pon el combo en **bridge mode** (su panel admin tiene el ajuste; el ISP también lo hace por teléfono en 2 minutos) y enchufa tu router real en el puerto WAN. Trata el combo como conversor de fibra a Ethernet y olvídalo.

**¿Cómo roto la contraseña de Huéspedes sin romper acceso a mitad de estancia?**
Pre-imprime la contraseña en la tarjeta de bienvenida y rota entre estancias, no durante una. La limpiadora puede rotarla el día de salida en 90 segundos en la app. El Anfitrión que rota a diario crea más trabajo de mensajes que el que evita.

**¿Y puertos Ethernet para Huéspedes que quieran cable?**
Un cable Ethernet de 5 $ visible en el escritorio cerca de la TV vale dos estrellas en el subset «vine a trabajar». Tira desde el router (o un switch no gestionado de 15 $) al escritorio. Nadie se queja de que se proporcionara puerto. Muchos sí de que no.

**¿Pongo la contraseña WiFi en la guidebook antes del check-in?**
Sí, y en la tarjeta de bienvenida, y en post-it junto al router. La razón más común de reseña Airbnb de 4 estrellas es «tardé 20 minutos en encontrar la contraseña». Ponla en tres sitios. Mándala también en el mensaje de confirmación del [formulario previo](/blog/pre-arrival-guest-forms).

**¿El router barato «AX1800» de Amazon a 50 $ va bien?**
A veces. El riesgo es que sea chip de generación previa, sin updates de firmware tras año 2 y CPU que se rinde a 8 clientes simultáneos. Gasta 30 $ más en marca conocida (TP-Link, Asus, Netgear) con fecha 2024 o 2025. Los ahorros del primer año no compensan el reemplazo del tercero.

## Una opinión sin filtros

El WiFi es la única pieza de infraestructura en alquiler corto donde los Huéspedes escriben reseña basándose en la peor hora individual de su estancia. Tu cama puede ser 4 sobre 5 en comodidad, tu cocina 4 sobre 5 en equipamiento, tu check-in 4 sobre 5 en amabilidad, y aun sacas 4,7. Un sábado lento de WiFi y la reseña son 3 estrellas y lo menciona explícitamente. La asimetría es lo que hace cara la opción barata.

Gasta los 200 $ en hardware correcto y los 30 minutos configurando la SSID de Huéspedes. Corre auto-reboot semanal, conecta failover 4G, publica la contraseña en tres sitios. Todo el stack son dos noches de trabajo y diez años de no pensar en ello. Los Anfitriones que lo saltan tienen una mala reseña por WiFi en sus primeras ocho estancias. Las cuentas no son sutiles.
