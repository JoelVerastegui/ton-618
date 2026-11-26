# Navegación

Este documento detalla la navegación del proyecto: rutas por sección, carga bajo demanda, menú lateral, transición y salto entre secciones. La estructura general está en [architecture.md](architecture.md). Las decisiones y su verificación están en la [SPEC 09](../specs/09-navigation.md).

## Principios

- El salto de una sección a otra ocurre **únicamente** al seleccionar un enlace del menú lateral.
- El salto es **instantáneo**, sin animación de scroll. La transición es la que da el efecto de navegación.
- Las demás animaciones y desplazamientos por scroll de las secciones se mantienen (incluidos el botón del Hero y la navegación de niveles de Exploración).
- No se usan librerías de terceros para la navegación.

## Rutas por sección

La web se publica bajo el prefijo `/ton-618/` (`base` de Vite, también en desarrollo). Las rutas de la tabla son relativas a ese prefijo.

| Orden | Sección     | `id`          | Ruta           | Nombre en el menú |
| ----- | ----------- | ------------- | -------------- | ----------------- |
| 1     | Hero        | `hero`        | `/`            | Inicio            |
| 2     | Exploration | `exploration` | `/exploration` | Exploración       |
| 3     | Science     | `science`     | `/science`     | Ciencia           |
| 4     | Scale       | `scale`       | `/scale`       | Escala            |
| 5     | Time        | `time`        | `/time`        | Tiempo            |
| 6     | Experiment  | `experiment`  | `/experiment`  | Experimento       |
| 7     | Evidence    | `evidence`    | `/evidence`    | Evidencia         |
| 8     | Epilogue    | `epilogue`    | `/epilogue`    | Epílogo           |

Las rutas y los textos del menú viven en `src/data/navigation.json`.

### URL y sección activa

- Está activa la última sección, en orden de página, cuyo punto de llegada ha quedado por encima del centro del viewport. Sin ninguna, el Hero.
- Se detecta con `IntersectionObserver`, sin listeners de scroll.
- La URL se actualiza con `window.history.replaceState`, solo cuando cambia la sección activa. No se usa `pushState`: Atrás y Adelante no recorren las secciones.
- Durante una navegación por menú la detección se ignora y la URL se escribe una sola vez, con el destino.
- Los parámetros de la URL (`?…`) se conservan.

### Acceso directo y recarga

- La restauración de scroll del navegador está desactivada: manda la ruta.
- Al abrir o recargar la ruta de una sección se cargan ella y sus vecinas, la página se coloca en su punto de llegada, sin animación de scroll ni transición, y sus animaciones de entrada aparecen completas. Si la persona toma el control durante la carga, la página no se vuelve a mover.
- Recargar no conserva la posición dentro de la sección: vuelve a su punto de llegada.
- La ruta de inicio no se toca: el Hero conserva su animación de carga.
- Se aceptan rutas con y sin barra final. Una ruta desconocida se reemplaza por la de inicio.

## Carga bajo demanda

- El Hero se carga con la página. Las otras siete secciones se importan con `React.lazy`.
- Cada una se carga cuando su marcador de posición está a menos de dos alturas de viewport, o cuando una navegación la pide. Una navegación carga el destino y sus vecinas antes de medir.
- Una sección cargada queda montada: conserva su estado.
- El marcador de posición tiene el `id` de la sección, su altura, su margen de solape y su punto de llegada: la carga no desplaza el contenido ni hace que un salto caiga en otra posición. Las medidas se comparten en `src/styles/_sectionTracks.scss`. Evidencia y Epílogo miden según su contenido, así que su marcador reserva su altura mínima.
- Si falla la descarga del destino de una navegación, se carga la página completa en su ruta. En los demás casos queda el marcador de posición, sin reintentos.

## Punto de llegada

Tras el salto se debe ver **el inicio de la sección al 100%**, desde cualquier sección y en cualquier dirección:

- La sección ocupa el viewport desde su inicio, sin restos de la anterior ni de la siguiente.
- Su contenido inicial se ve completo: sin fundidos a medias ni elementos a medio animar.

| Sección     | Punto de llegada                        | Qué se ve                                     |
| ----------- | --------------------------------------- | --------------------------------------------- |
| Hero        | Inicio de la página                     | Escena inicial                                |
| Exploración | Borde superior de su track              | Nivel 1 con su mapa y su tarjeta              |
| Ciencia     | Escena lista                            | Visor, título y marcadores, sin punto elegido |
| Escala      | Fin de la intro                         | Zoom en 0 con su tarjeta                      |
| Tiempo      | Fin de la intro                         | Título, línea y partícula al inicio           |
| Experimento | Borde superior de su track              | Agujero negro dibujado y controles            |
| Evidencia   | Borde superior de su envoltorio `.tail` | Título, comparador y preguntas                |
| Epílogo     | Borde superior de la sección            | Gran Atractor, marcador y texto completos     |

- Cada sección marca su punto con un elemento `[data-arrival="<id>"]`, no pegajoso, cuya posición fija su SCSS con los mismos tokens que la animan. La posición se mide en el DOM.
- Con `prefers-reduced-motion: reduce` o sin `animation-timeline`, es el punto equivalente en el layout de ese modo.
- Una sección que aún no puede mostrarse completa lleva `data-arrival-pending` hasta estar lista.
- El estado interno de una sección ya usada (pregunta abierta, comparador, zoom del Experimento) se conserva; lo que depende del scroll toma el valor del punto de llegada.

## Menú lateral

- Se abre con un botón fijo arriba a la derecha, visible en todas las secciones, de al menos 44×44 px y dentro de las áreas seguras.
- Es un `<dialog>` modal con un botón de cierre y un enlace por sección. La sección activa lleva `aria-current`.
- Desde el breakpoint `md` de Bootstrap es un panel lateral y el resto de la pantalla se ve desenfocado (`backdrop-filter` de radio fijo; sin soporte, se oscurece). Por debajo ocupa toda la pantalla.
- Se cierra al elegir un enlace, con el botón de cierre, con `Escape` o con un clic fuera del panel. El foco vuelve al ícono.
- `Tab` desde el ícono sigue en el primer control de la sección activa, no al principio de la página.
- Mientras está abierto, la página de fondo no hace scroll. Con barra de scroll clásica, la barra se oculta y su ancho se compensa para que nada se mueva.
- Los enlaces son `<a>` con su ruta real: el clic con modificadores o con el botón central conserva el comportamiento del navegador.
- La entrada y salida animan solo `transform` y `opacity`; con movimiento reducido no hay animación.

## Transición

Salto hiperespacial en CSS: un fondo oscuro con estelas de estrellas estiradas en la dirección del viaje. Es un único componente (`Hyperspace`) con dos orientaciones, según dónde esté el destino respecto a la posición actual:

| Destino     | Orientación de la animación |
| ----------- | --------------------------- |
| Está abajo  | De abajo hacia arriba       |
| Está arriba | De arriba hacia abajo       |

Ambas son la misma transición (forma, duración y curva); una es el espejo de la otra.

| Fase     | Duración | Qué ocurre                                                                                    |
| -------- | -------- | --------------------------------------------------------------------------------------------- |
| Entrada  | 500 ms   | Se cierra el menú, se cancela cualquier scroll animado y la transición cubre la pantalla       |
| Cubierta | ≥ 300 ms | Carga del destino y vecinas, salto instantáneo, URL, y destino listo con sus entradas completas |
| Salida   | 600 ms   | La transición sale en la misma orientación                                                    |

- La pantalla sigue cubierta hasta que el destino está cargado, sin `data-arrival-pending` y con sus imágenes visibles decodificadas. Tope de 8 s desde que está cubierta; pasado, se descubre igualmente.
- Mientras dura no se admite otra navegación ni entradas de la persona (rueda, táctil, teclado y clic). Los atajos del navegador siguen funcionando.
- Las secciones intermedias no cambian la URL ni se muestran.
- Si la sección elegida es la actual y la página está en su punto de llegada, solo se cierra el menú. Si la página está más abajo dentro de ella, el destino se considera arriba.
- Es decorativa (`aria-hidden`) y no existe en pantalla fuera de una navegación.
- Con `prefers-reduced-motion: reduce` no hay transición: se carga el destino y se salta.

## Validaciones

### Ícono del menú

El ícono no se solapa con texto, controles, tarjetas ni marcadores **en reposo**. Se admite que el contenido en movimiento cruce por debajo al hacer scroll. Se valida:

- En las 8 secciones.
- Con el stage pegado, en los elementos fijos, en el punto de llegada y con los estados interactivos abiertos (nivel, punto, parada, tarjeta, pregunta).
- En 320×568, 360×640, 390×844, 640×360, 568×320, 768×1024, 1024×600, 1440×900 y 1920×1080.

### Navegación

- Cada enlace del menú llega al punto de llegada de su sección, desde arriba y desde abajo, también en la primera visita.
- La orientación de la transición corresponde a la posición del destino.
- La URL coincide con la sección visible, tanto al hacer scroll como al navegar por el menú, y el historial no crece.
- Las animaciones por scroll de las secciones funcionan igual.
