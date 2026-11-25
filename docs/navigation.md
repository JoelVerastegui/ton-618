# Navegación

Este documento detalla la navegación del proyecto: rutas por sección, menú lateral, transición y salto entre secciones. La estructura general está en [architecture.md](architecture.md).

## Principios

- El salto de una sección a otra ocurre **únicamente** al seleccionar un enlace del menú lateral.
- El salto es **instantáneo**, sin animación de scroll. La transición es la que da el efecto de navegación.
- Las demás animaciones y desplazamientos por scroll de las secciones se mantienen tal cual (incluidos el botón del Hero y la navegación de niveles de Exploración).
- No se usan librerías de terceros para la navegación.

## Rutas por sección

La URL cambia de manera dinámica según la sección visible al hacer scroll.

| Orden | Sección     | Ruta           |
| ----- | ----------- | -------------- |
| 1     | Hero        | `/`            |
| 2     | Exploration | `/exploration` |
| 3     | Science     | `/science`     |
| 4     | Scale       | `/scale`       |
| 5     | Time        | `/time`        |
| 6     | Experiment  | `/experiment`  |
| 7     | Evidence    | `/evidence`    |
| 8     | Epilogue    | `/epilogue`    |

- La URL se actualiza con `window.history.replaceState`, para evitar re-renders innecesarios en React. No se usa `pushState`: los botones Atrás y Adelante del navegador no recorren las secciones.
- La sección activa se detecta con `IntersectionObserver`.
- Al entrar directamente a la ruta de una sección, la página se posiciona en su inicio sin animación de scroll ni transición.
- Una ruta desconocida se reemplaza por `/`.
- El hosting debe redirigir todas las rutas a `index.html`.

## Carga bajo demanda

- Las secciones se cargan con `React.lazy` junto con `IntersectionObserver` para ahorrar memoria.
- Cada sección debe reservar su altura mientras no esté cargada. La carga no puede desplazar el contenido ni hacer que un salto caiga en una posición incorrecta.

## Menú lateral

- Se abre con un ícono fijo, visible en todas las secciones.
- Contiene un enlace por cada sección y señala la sección activa.
- El fondo detrás del menú se ve con desenfoque (blur).
- En desktop es un panel lateral; en móvil (menor al breakpoint `md` de Bootstrap) ocupa toda la pantalla.
- Se cierra al seleccionar un enlace, con el botón de cierre, con la tecla `Escape` o al hacer clic fuera del panel.
- Mientras está abierto, la página de fondo no hace scroll.
- Es accesible por teclado: el foco queda dentro del menú mientras está abierto y vuelve al ícono al cerrarlo.

## Transición

Al seleccionar un enlace existe una única transición con dos orientaciones, según dónde esté el destino respecto a la posición actual:

| Destino                  | Orientación de la animación |
| ------------------------ | --------------------------- |
| Está abajo               | De abajo hacia arriba       |
| Está arriba              | De arriba hacia abajo       |

Ambas son la misma transición (forma, duración y curva); solo cambia la orientación.

Secuencia:

1. Se selecciona el enlace y se cierra el menú.
2. La transición entra y cubre toda la pantalla.
3. Con la pantalla cubierta, se hace el salto instantáneo y se actualiza la URL. La sección destino se carga si aún no lo estaba.
4. La transición sale en la misma orientación y deja ver la sección destino.

- No se puede iniciar otra navegación mientras la transición está en curso.
- Las secciones intermedias no cambian la URL ni se muestran durante el salto.
- Si la sección seleccionada es la actual y la página ya está en su inicio, solo se cierra el menú. Si la página está más abajo dentro de esa sección, el destino se considera arriba.
- Con `prefers-reduced-motion: reduce` no hay transición: el salto es directo.

## Punto de llegada

Tras el salto se debe ver **el inicio de la sección al 100%**:

- La sección ocupa el viewport desde su inicio, sin restos de la sección anterior ni de la siguiente.
- Su contenido inicial es completamente visible: sin fundidos a medias ni elementos a medio animar.
- Si la sección tiene una animación de entrada ligada al scroll, el punto de llegada es aquel en el que su estado inicial se ve completo.
- Se cumple sin importar desde qué sección ni en qué dirección se navegue.

## Validaciones

### Ícono del menú

El ícono no puede solaparse con ningún contenido (texto, controles, tarjetas o marcadores) de ninguna sección. Se valida:

- En las 8 secciones.
- Al inicio, en puntos intermedios y al final del scroll de cada una.
- En los estados interactivos que muestren contenido nuevo (tarjetas, paneles, niveles).
- En anchos de móvil, tablet y desktop (p. ej. 360, 768, 1024 y 1440 px), en vertical y horizontal en móvil.

### Navegación

- Cada enlace del menú llega al inicio de su sección, viniendo desde arriba y desde abajo.
- La orientación de la transición corresponde a la posición del destino.
- La URL coincide con la sección visible, tanto al hacer scroll como al navegar por el menú.
- Las animaciones por scroll de las secciones funcionan igual que antes.
