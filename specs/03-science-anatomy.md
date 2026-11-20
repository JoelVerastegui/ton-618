# SPEC 03 — Ciencia / Anatomía de un monstruo

**Estado:** Approved
**Depende de:** SPEC 02 (y, por ella, SPEC 01)
**Fecha:** 2026-11-20
**Objetivo:** Implementar la sección Ciencia como tercera escena de la web: tras la última tarjeta de Exploración, un parpadeo guiado por scroll (los párpados se cierran al final de Exploración y se abren al empezar Ciencia) da paso a una simulación en vídeo de un cuásar, con tres puntos interactivos (horizonte de sucesos, disco de acreción y lente gravitacional) que acercan la cámara a esa parte del mismo vídeo y muestran su tarjeta.

Origen del contenido: `docs/ideas/03-science.md`. Datos y textos verificados por el agente `cosmic-data-researcher`; diseño y animación por el agente `web-motion-designer`; verificación final por el agente `section-verifier`.

Origen del vídeo: simulación de un disco de acreción en formato GIF (con aspecto de visualización científica de la NASA), tomada de una nota de prensa (`lopezdoriga.com`, «NASA muestra simulación de cómo un agujero negro deforma el espacio»). **Pendiente antes de publicar:** confirmar autoría y licencia en la fuente original y añadir el crédito si lo exige.

---

## Alcance

### Incluido

- Componente de sección `Science` (`<section id="science">`) montado en `App.tsx` tras `Exploration`.
- **Transición por parpadeo:** dos párpados (arriba y abajo, con borde curvo) se cierran al final del recorrido de Exploración, justo después de leer la última tarjeta, y se abren al empezar Ciencia sobre el vídeo. El cambio de escena ocurre con el ojo cerrado y no hay ningún tramo de scroll que repita el mismo gráfico.
- **Vídeo del cuásar:** una única simulación en bucle (WebM + MP4 de respaldo, sin audio) sobre fondo negro, con el campo de estrellas persistente visible a través del negro. Sin capas SVG por punto: el movimiento del disco lo aporta el propio vídeo.
- **Tres puntos interactivos** (marcadores `<button>`): horizonte de sucesos, disco de acreción, lente gravitacional. Al pulsar uno, la cámara (`transform`) amplía y recorta el mismo vídeo sobre esa parte y aparece su tarjeta; un control permite volver a la vista completa.
- Estado inicial: vista completa con los tres marcadores pulsantes, título y una invitación breve; sin tarjeta abierta.
- Una tarjeta a la vez, con el estilo de las tarjetas de la SPEC 02 (kicker, título, respuesta ≤ 40 palabras).
- Accesibilidad: marcadores y navegación entre puntos con teclado, `Esc` para volver, gestión del foco.
- Comportamiento completo con `prefers-reduced-motion: reduce` (sin párpados ni vídeo en movimiento: se muestra el póster).
- Datos mínimos en `src/data/science.json` con interfaces en `src/interfaces/science.ts`.
- Fallback sin `animation-timeline` (generalizando el hook `useTrackProgress`).
- Los **párpados de cierre** dentro de Exploración (dos elementos decorativos y sus keyframes), único cambio en esa sección.

### Excluido (otros specs)

- Cualquier otro cambio visual o de contenido en Hero y Exploración (más allá de los párpados de cierre; ver «Decisiones»).
- Zoom libre del usuario (rueda, pellizco, arrastre) y scroll guiado de punto en punto.
- Elementos adicionales del cuásar (chorros relativistas, toro de polvo, corona, regiones de líneas anchas) y datos numéricos destacados por punto.
- Las secciones 4 en adelante (masa, luminosidad, etc.).
- Navegación completa (rutas, `history.replaceState`, `React.lazy`), Navbar y Footer.
- Audio.
- Rótulos de «representación artística» o de escala en pantalla (criterio de contenido mínimo de las secciones anteriores). A cambio, los textos son generales («en un cuásar…») y no afirman rasgos de TON 618 que no estén verificados.
- Los pendientes de verificación de la SPEC 02 (ya corregidos según el autor; no se tocan aquí).

---

## Modelo de datos

Archivos: `src/interfaces/science.ts` y `src/data/science.json`. Solo contienen lo que se muestra en pantalla o se lee en lectores de pantalla (regla de limpieza al cerrar una sección).

```ts
// src/interfaces/science.ts
export type SciencePointId = 'horizon' | 'disk' | 'lens';

export interface SciencePoint {
  id: SciencePointId;
  order: number;
  kicker: string; // p. ej. «El límite»
  title: string; // nombre del punto: «Horizonte de sucesos», «Disco de acreción», «Lente gravitacional»
  answer: string; // ≤ 40 palabras y ≤ 220 caracteres
}

export interface ScienceData {
  title: string; // «Anatomía de un monstruo» (h2 visible)
  hint: string; // invitación breve del estado inicial («Toca un punto para explorar»)
  summary: string; // equivalente textual de la ilustración para lectores de pantalla
  points: SciencePoint[];
}
```

Textos fijos del TSX (como `LevelNav` en la SPEC 02): «Vista completa», `aria-label` de los controles de la navegación entre puntos. Las posiciones de los marcadores y los objetivos de cámara **no** van en el JSON (son presentación): viven en un mapa SCSS compartido (`$sciPoints`) para no duplicarlos.

Contenido orientativo de las respuestas (el investigador los verifica y los redacta):

| Punto                  | Idea                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- |
| Horizonte de sucesos   | El límite a partir del cual nada, ni siquiera la luz, puede escapar.                                           |
| Disco de acreción      | Gas y materia que orbitan y se calientan intensamente. El agujero negro no emite luz; el material que cae sí.  |
| Lente gravitacional    | La gravedad desvía la luz y deforma lo que se observa (el disco lejano se ve curvado sobre el agujero).        |

---

## Vídeo

El vídeo aporta realismo y movimiento; el CSS aporta la cámara y la interactividad. Los tres puntos **no** son tres vídeos: son el mismo vídeo con la cámara ampliada y recortada. Si el resultado no convence, el siguiente paso sería un vídeo distinto por punto (decisión del autor tras verlo).

**Archivos** en `src/assets/videos/science/` (generados con `ffmpeg` desde un directorio temporal, sin dependencia nueva en el proyecto):

| Archivo              | Contenido                                                                                  | Peso      |
| -------------------- | ------------------------------------------------------------------------------------------ | --------- |
| `quasar.webm`        | VP9, 986×986, 20 fps, ~4,65 s en bucle, sin audio                                          | ~450 KB   |
| `quasar.mp4`         | H.264, mismo contenido (respaldo; el navegador descarga solo uno)                          | ~360 KB   |
| `quasar-poster.webp` | Primer fotograma (también es la imagen con `prefers-reduced-motion`)                        | ~17 KB    |

El lienzo es cuadrado: el GIF original (985×568) se rellena con negro arriba y abajo para que el centro de la sombra quede en (50 %, 50 %) y el visor circular lo encuadre. La sombra mide ~18 % del lado.

**Capas** (de atrás hacia delante), dentro de un «visor» circular (`clip-path: circle(50%)` estático, igual que el nivel 4 de Exploración):

| Capa                | Contenido                                                                                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estrellas           | Capa persistente (`_starfield.scss`) fija en la escala final de Exploración (1,15), con la misma semilla (618) que el campo de Exploración.                             |
| Visor y cámara      | El visor lleva `mix-blend-mode: screen` (el negro del vídeo deja ver las estrellas). Dentro, un `div` único con `transform` (`translate` + `scale`) que contiene el `<video>`. Estado por `data-point` y CSS, sin estilos en línea. |
| Marcadores y UI     | Marcadores, `PointNav` y tarjeta fuera de la cámara (no escalan).                                                                                                     |
| Párpados            | Dos elementos decorativos sobre todo el stage (`z-index: 10`), del color del fondo; ver «Track e intro».                                                              |

**Reproducción:** `<video>` con `muted`, `loop`, `playsInline`, `preload='auto'`, `poster` y `aria-hidden` heredado del visor. `useVideoPlayback` lo reproduce solo mientras está en pantalla (IntersectionObserver) y lo pausa fuera de vista; con `prefers-reduced-motion: reduce` no lo reproduce nunca (queda el póster).

**Reglas heredadas de la SPEC 02:** solo `transform`/`translate`/`scale` y `opacity` animados (más `visibility` discreta en el stage); sin `filter` ni `backdrop-filter`; `will-change` solo en la cámara mientras se mueve; animaciones pausadas con `data-inview="false"`. **Excepción justificada:** un único `mix-blend-mode: screen` en el visor, para que las estrellas se vean a través del fondo negro del vídeo; su coste se mide en el Paso 11 (alternativa: WebM VP9 con canal alfa).

---

## Comportamiento

### Layout (misma geometría que Exploración)

- **Desktop (`$sideBySide`):** visor cuadrado `$mapSizeDesktop` centrado en (34vw, 50svh); tarjeta a la derecha (`$cardWidth`, mismos márgenes y estilo que la SPEC 02). Título y hint arriba a la izquierda, fuera de la sombra del horizonte.
- **Móvil y tablet:** visor `$mapSizeMobile` con centro a 34svh del borde superior; tarjeta abajo; `--viewportExtra` como en Exploración.
- **Ancho de la tarjeta en side-by-side:** `min($cardWidth, 66vw − margen − $mapSizeDesktop × sciClear() − 0,5rem)`. `sciClear()` es el mayor `extent × escala` de `$sciPoints`, de modo que la tarjeta empieza siempre después de la parte ampliada más ancha. En móvil apaisado estrecho (`$sciCompact`: `(max-width: 700px) and (orientation: landscape)`) se usa `sciClear(true)` y la tarjeta y `PointNav` se compactan.
- `PointNav` (visible solo con un punto activo): 3 botones numerados (uno por punto, `aria-label` = título, activo con `aria-pressed="true"`) y «Vista completa»; áreas ≥ 44 px.

### Track e intro (parpadeo)

Track = 100dvh + 200 unidades de recorrido (`$scienceTravel`), con la misma unidad `--explUnit` (1svh en side-by-side, 0,6svh en móvil vertical). La sección solapa los últimos 100dvh de Exploración (`margin-top: -100dvh`, solo con `animation-timeline`): **x = 0 de Ciencia coincide con x = 500 de Exploración**, el mismo scroll. El stage de Ciencia está `visibility: hidden` hasta ese instante (animación `stageShow`, x −1 → 0), y la sección y el track llevan `pointer-events: none` (solo el stage los recibe), así que no tapan ni bloquean a Exploración antes de pegarse.

| Evento                                                                              | Sección      | x          |
| ----------------------------------------------------------------------------------- | ------------ | ---------- |
| Tarjeta final: entra (`cardStay`) y se queda a leer                                  | Exploración  | 370 → 400  |
| **Los párpados bajan** (se cierran), `ease-in`                                       | Exploración  | 440 → 500  |
| El stage de Ciencia pasa a visible, con los párpados **cerrados**                    | Ciencia      | 0          |
| **Los párpados suben** (se abre el ojo), `ease-out`                                  | Ciencia      | 0 → 55     |
| Vídeo: escala `$quasarIntroScale` (1,12) → 1                                         | Ciencia      | 0 → 110    |
| Título y hint: opacidad + `translate` de entrada                                     | Ciencia      | 70 → 110   |
| Marcadores: aparecen y empiezan a pulsar; la sección pasa a `data-ready="true"`      | Ciencia      | 90 → 110   |
| Hold (la escena queda lista para explorar)                                          | Ciencia      | 110 → 200  |

Es reversible: si la persona sube, el ojo se cierra y se abre de nuevo sobre Exploración. Con `data-ready="false"` los marcadores no son interactivos; si la persona vuelve hacia atrás a `x < 110`, el punto activo se cierra.

**Párpados:** dos `<span aria-hidden>` por sección (`lidTop`, `lidBottom`), más anchos que el stage (140 %) y con 60 % de alto, borde curvo hacia el centro (elipse de 14 %) para que al cerrarse no queden rendijas, color `$scene2Bg`. La forma está en `src/styles/_eyelids.scss` (mixins `lid`, `lidTop`, `lidBottom`, `$lidOpen`); cada módulo pone sus keyframes y su timeline.

### Interacción

- **Estado:** un único `useState<SciencePointId | null>` en `Science`. Un clic = un render; el visor y los marcadores van en `memo`.
- **Cámara:** `data-point` en la sección; el CSS define `translate`/`scale` por punto desde `$sciPoints` y anima con `transition: transform 1100ms $easeCinematic`. Coordenadas en % del lienzo del vídeo (50, 50 = centro de la sombra). Valores calibrados: horizonte ×2,2 centrado en la sombra; disco ×1,5 (×1,15 en `$sciCompact`) centrado en (58, 50); lente ×2 centrada en (50, 38). El zoom máximo se limita por la resolución de la fuente (986 px): con más zoom se ve blando.
- **Marcadores:** `<button>` con nombre accesible = `title` del punto, ubicados sobre la sombra (50, 50), el ala derecha del disco (74, 51) y el arco superior de la lente (50, 34); se atenúan (`opacity`) mientras hay un punto activo; el cambio entre puntos se hace con `PointNav`.
- **Tarjeta:** entra con `opacity` + `translate` ($cardShift); una sola visible; con el cambio de punto se intercambian sin que haya dos a la vez.
- **Teclado y foco:** al abrir un punto con un marcador el foco pasa al título de su tarjeta (`tabindex="-1"`); al cambiar con `PointNav` el foco se queda en el botón de la navegación; `Esc` o «Vista completa» cierran el punto y devuelven el foco al marcador; Tab recorre marcadores → `PointNav`. Los marcadores son `inert` mientras la escena no está lista o hay un punto abierto.
- **Lectores de pantalla:** el visor y sus capas son `aria-hidden`; `summary` es texto solo para lectores; la tarjeta abierta es una región con `aria-labelledby` (el cambio de punto se anuncia con `aria-live="polite"` en el contenedor de la tarjeta).

### Reduced-motion

`.track` colapsa a 100dvh sin sticky y sin solape; no hay párpados (en Ciencia ni en Exploración); el vídeo no se reproduce y se muestra el póster a escala 1; sin pulso de marcadores; la cámara se mueve de forma **instantánea** al pulsar (acción de la persona, no animación automática); `document.getAnimations()` de la sección devuelve 0.

### Sin `animation-timeline`

`useTrackProgress` (generalizado: recibe las refs de la sección y del track y deja de mencionar Exploración en su documentación) escribe `--progress`; el CSS bajo `@supports not (animation-timeline: view())` reproduce las fases con `clamp` (sin curvas de aceleración en los párpados). Ahí **no hay solape** con Exploración: el tramo entre las dos secciones se recorre con los párpados cerrados (pantalla oscura) antes de que se abran.

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional. Agentes: `cosmic-data-researcher` (paso 2), `web-motion-designer` (pasos 5, 7 y 8), `section-verifier` (paso 11).

1. **Tokens y base.** En `_variables.scss`: `$scienceTravel: 200`, `$scienceReady: 110`, `$quasarIntroScale: 1.12`, `$motionCamera: 1100ms`, mapa `$sciPoints` (marcador, foco, escala, `extent` y `scaleCompact` por punto), `$sciCompact`, función `sciClear`, mixin/función de altura y rango del track de Ciencia (análogos a `explorationTrackHeight` y `exploRange`, con `--explUnit`). Generalizar el comentario y la firma de `useTrackProgress`.
2. **Datos.** `src/interfaces/science.ts` y `src/data/science.json` con textos verificados (agente `cosmic-data-researcher`): tres puntos, `title`, `hint` y `summary`.
3. **Vídeo.** Convertir la simulación a `quasar.webm`, `quasar.mp4` y `quasar-poster.webp` (cuadrado de 986 px, sombra centrada, bucle) con `ffmpeg` desde un directorio temporal.
4. **Sección estática.** `Science.tsx` y `Science.module.scss`: `<section id="science" aria-labelledby>`, `h2` visible, hint, `summary` solo lectores, track + stage sticky (`dvh` con `vh` de respaldo); montada en `App.tsx` tras `Exploration`. El stage usa `$scene2Bg` y la capa de estrellas a escala 1,15 con la misma semilla que Exploración (`starField` con parámetro `$seed`).
5. **Escena e intro.** Visor circular con el `<video>` dentro de la cámara; parpadeo: párpados de cierre en Exploración (x 440 → 500) y de apertura en Ciencia (x 0 → 55), solape de 100dvh y stage oculto hasta x = 0; forma de los párpados en `_eyelids.scss`.
6. **Puntos, cámara y tarjetas.** `PointMarkers`, `PointCard` y `PointNav`; estado, `data-point`, transiciones de la cámara, tarjeta única, `Esc`, foco, `inert` y `data-ready` (`useSceneReady`).
7. **Reproducción del vídeo.** `useVideoPlayback`: reproduce en vista, pausa fuera de vista, no reproduce con reduced-motion; animaciones pausadas con `data-inview`.
8. **Fallback y reduced-motion.** `useTrackProgress` para navegadores sin timeline nativo; reglas de reduced-motion en Ciencia y Exploración.
9. **Estilo y limpieza.** Prettier, lint, sin `!important`, sin `style={{}}` salvo valores dinámicos; revisar `science.json` e interfaces (ningún campo sin uso); eliminar lo que dejó de usarse.
10. **Revisión visual y calibración.** Capturas en los 8 viewports de referencia; comprobar solapes con la sombra del horizonte y con la tarjeta; calibrar objetivos de cámara y marcadores sobre el vídeo.
11. **Verificación con `section-verifier`.** Rendimiento, accesibilidad, responsive, animaciones y robustez, con medición en navegador; registrar resultados y pendientes en este documento. Se ejecuta cuando el autor lo indique.

### Cambios respecto al plan original

- **De imagen generada con IA a vídeo.** La imagen del cuásar (`quasar-1536.webp`), las superposiciones por punto (anillo del horizonte, partículas del disco, rayos de la lente) y los prompts se sustituyeron por una simulación en vídeo, cuyo movimiento aporta el efecto. Se eliminaron `Overlays`, `quasarOverlays.ts` y la imagen.
- **De zoom-out continuo a parpadeo.** El cruce de zoom con la capa de entrada (`TonLayer`) se sustituyó por el parpadeo, que oculta el cambio de escena y evita el tramo de scroll repetido; ya no hace falta la capa de entrada ni la continuidad exacta de diámetro en x = 0.
- **Solape con Exploración.** Lo que antes se había descartado (`margin-top` negativo) es ahora el mecanismo: el stage de Ciencia se pega en el mismo scroll en que se suelta el de Exploración, que a cambio recibe los párpados de cierre.

### Pendientes registrados (hasta el Paso 11)

- Confirmar autoría y licencia del vídeo y añadir crédito si procede.
- En `$sciCompact` (p. ej. 640×360), el hint del encabezado puede quedar sobre la parte naranja con el horizonte abierto.
- Medir los 8 viewports con el vídeo (solo se comprobaron 1440×900, 390×844 y 640×360), la nitidez con la cámara al máximo y en pantallas 2×, y la sensación del parpadeo con scroll real (tramos de 60 y 55 unidades).
- Fallback sin `animation-timeline` y reduced-motion: implementados, sin probar en navegador.
- Medir el coste de `mix-blend-mode: screen` y las capas compuestas durante la intro (cámara/vídeo, estrellas, tarjeta y 2 párpados).

---

## Presupuesto

| Concepto                          | Límite                                                              |
| --------------------------------- | ------------------------------------------------------------------- |
| Vídeo (por formato descargado)    | ≤ 0,5 MB (`quasar.webm` ~450 KB, `quasar.mp4` ~360 KB)               |
| Póster                            | ≤ 20 KB (`quasar-poster.webp`)                                      |
| JS del chunk de Ciencia           | ≤ 10 KB gz                                                          |
| CSS de los módulos de Ciencia     | ≤ 6 KB gz                                                           |
| `science.json`                    | ≤ 3 KB                                                              |
| Capas compuestas a la vez         | ≤ 4 en el hold (cámara con el vídeo, estrellas, tarjeta, párpados fuera de escena); se mide también la intro |
| Trabajo por frame al hacer scroll | solo composite (0 Layout, 0 Paint) con la intro en curso            |
| Lighthouse móvil                  | Performance ≥ 90, CLS 0                                             |

---

## Criterios de aceptación

**Contenido y estructura**

- [ ] `<section id="science">` existe, se monta tras `Exploration` en `App.tsx`, tiene `aria-labelledby`, un `<h2>` visible y un `<h3>` por tarjeta; no hay ningún `<h1>` nuevo.
- [ ] Todos los textos visibles salen de `science.json` (salvo los fijos de `PointNav`); ninguno está escrito en el TSX.
- [ ] Hay 3 puntos en el orden horizonte → disco → lente; cada respuesta tiene ≤ 40 palabras y ≤ 220 caracteres.
- [ ] No aparece ningún rótulo de «representación artística», «ilustrativo» ni «no a escala», ni en pantalla ni en `summary`; ningún texto afirma un rasgo de TON 618 sin fuente verificada.
- [ ] Los JSON e interfaces no contienen campos que ningún componente use.
- [ ] No hay scroll horizontal entre 320 y 2560 px de ancho.
- [ ] Ni el texto ni las tarjetas tapan la sombra del horizonte en 320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900 y 1920×1080.
- [ ] No hay archivos `.scss` sueltos (solo `.module.scss`, salvo los parciales de `src/styles/`), ni `!important`, ni `style={{}}` salvo valores dinámicos; clases en camelCase; el código pasa `prettier --check`.
- [ ] `npm run build` termina sin errores de TypeScript ni de lint.
- [ ] La autoría y la licencia del vídeo están confirmadas y, si se exige, el crédito aparece.

**Intro y transición**

- [ ] Tras la última tarjeta de Exploración, los párpados se cierran entre x = 440 y 500 sin que haya un tramo de scroll en el que se vea dos veces el mismo gráfico; en x = 500 (x = 0 de Ciencia) el stage de Ciencia es visible con los párpados cerrados, sin saltos de color ni de posición.
- [ ] Antes de x = 0 el stage de Ciencia está oculto y no intercepta clics: los botones de `LevelNav` de Exploración responden hasta el final de su recorrido.
- [ ] En x = 110 (±10) el vídeo se ve completo a escala 1, los párpados están fuera de escena y la sección tiene `data-ready="true"`; antes, los marcadores no son interactivos.
- [ ] La transición es reversible: al subir, los párpados se cierran y se abren sobre Exploración.
- [ ] En móvil vertical el recorrido usa la unidad 0,6svh y las paradas (0, 55, 90, 110, 200) siguen sincronizadas; con las barras del navegador visibles y ocultas no asoma la sección siguiente ni queda hueco, y CLS = 0.
- [ ] Sin `animation-timeline`, el efecto funciona vía `--progress` y la consola no muestra errores.
- [ ] Solo se animan `transform`/`translate`/`scale` y `opacity` (más la `visibility` discreta del stage).

**Interacción**

- [ ] Pulsar cada marcador (clic, toque, Enter o Espacio) activa su punto: `data-point` cambia, la cámara amplía la parte correcta del vídeo y se muestra solo su tarjeta.
- [ ] `Esc` y «Vista completa» devuelven a la vista completa y el foco regresa al marcador; `PointNav` permite pasar de un punto a otro sin volver.
- [ ] Con un punto activo, la parte ampliada no queda bajo la tarjeta ni sale del visor circular en los 8 viewports de referencia.
- [ ] Volver atrás a x < 110 cierra el punto activo y desactiva los marcadores.
- [ ] Un clic provoca como máximo 1 render de `Science` y 0 del visor (`memo`).

**Vídeo**

- [ ] El vídeo se reproduce solo mientras la sección está en pantalla y se pausa fuera de vista; no emite audio y no muestra controles.
- [ ] Con `prefers-reduced-motion: reduce` no se reproduce y se ve el póster.
- [ ] El navegador descarga un solo formato (WebM o MP4) y el que descarga pesa ≤ 0,5 MB.
- [ ] La imagen se ve aceptable (sin pixelado evidente) con la cámara al máximo en 1440×900 y en pantallas 2×; si no, se baja el máximo de la cámara o se usa una fuente de más resolución.

**Accesibilidad**

- [ ] axe/Lighthouse: 0 violaciones; todo texto ≥ 4,5:1 (incluidas las etiquetas de los marcadores sobre el vídeo).
- [ ] Visor y vídeo `aria-hidden`; `summary` accesible; los 3 marcadores tienen nombre accesible y se alcanzan con Tab con `:focus-visible` visible y áreas ≥ 44 px.
- [ ] El cambio de punto se anuncia (`aria-live`) sin ruido durante el scroll.
- [ ] Con `prefers-reduced-motion: reduce`: `document.getAnimations()` de la sección devuelve 0, `.track` no es sticky, no hay párpados y la cámara cambia sin transición.
- [ ] Ningún destello supera 1 evento cada ~2 s.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [ ] Lighthouse móvil: Performance ≥ 90, CLS = 0.
- [ ] Durante el scroll de la intro y estable en el hold: 0 Layout y 0 Paint tras calentar; capas compuestas ≤ 4 en el hold (se mide cuántas hay en cada estado, incluido el efecto de `mix-blend-mode`).
- [ ] ≥ 95 % de los frames por debajo de 20 ms durante la intro y el movimiento de cámara (en dispositivo real si el entorno no tiene GPU).
- [ ] Con `data-inview="false"`, `document.getAnimations()` filtrado por la sección devuelve 0 animaciones en ejecución y el vídeo está en pausa.
- [ ] El JS de la sección ≤ 10 KB gz y el CSS ≤ 6 KB gz.

**Verificación final**

- [ ] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz, arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Vídeo de simulación en lugar de imagen generada con IA.** El autor probó vídeo generado con IA (poca resolución y otra composición) y descartó la imagen generada; la simulación en GIF aporta movimiento real del disco, fondo negro limpio y sombra sin artefactos. Se convierte a WebM/MP4 y se encuadra en un lienzo cuadrado.
- **Un solo vídeo con la cámara como recorte.** Los tres puntos son el mismo vídeo ampliado y recortado, no tres vídeos. Se evaluará un vídeo por punto si el recorte no convence.
- **Tres puntos: horizonte, disco y lente.** Son los rasgos que se pueden explicar sin afirmar nada no verificado sobre TON 618; el contenido se mantiene mínimo.
- **Mecánica de clic con la cámara, no scroll guiado.** Es lo que describe la idea original, evita sumar más scroll tras 500svh de Exploración y es accesible con teclado. Los únicos tramos guiados por scroll son el parpadeo y la intro.
- **Parpadeo como transición.** Los párpados cierran Exploración al final de su recorrido y se abren en Ciencia. Tapa el cambio de escena (colores y estrellas distintos), sirve de metáfora («ver» el monstruo) y solo anima `translate`. Se descartó el bloom ámbar en el filo de los párpados.
- **Solape de Ciencia con Exploración.** `margin-top: -100dvh` hace que el sticky de Ciencia se pegue en el mismo scroll en que se suelta el de Exploración, y el stage de Ciencia permanece oculto y sin eventos hasta entonces. Elimina el tramo en que se veía dos veces el mismo gráfico. A cambio, Exploración recibe los párpados de cierre (único cambio en esa sección).
- **Mismo visor circular y misma geometría que el nivel 4.** Respeta la decisión de ilustraciones circulares de la SPEC 02 y la geometría de Exploración.
- **Cámara por `data-point` y CSS.** Sin estilos en línea ni estado de scroll; un solo render por clic.
- **Marcadores como `<button>` y `PointNav` solo con punto activo.** Evita recalcular la posición de los marcadores con la cámara ampliada y mantiene el cambio de punto accesible.
- **Una tarjeta a la vez junto a la ilustración.** Mismo patrón de las tarjetas de Exploración; un popover anclado taparía la ilustración en móvil.
- **Estado inicial con vista completa y hint.** Invita a explorar; no hay tarjeta abierta por defecto.
- **Solo texto ≤ 40 palabras por punto.** Contenido mínimo; las cifras de masa y luminosidad se dejan a secciones futuras.
- **Sin rótulos de «representación artística».** Criterio vigente del proyecto; los textos son generales para no afirmar lo no verificado.
- **`mix-blend-mode: screen` en el visor.** Única excepción a las reglas de la SPEC 02: deja ver las estrellas a través del negro del vídeo. Alternativa si resulta cara: VP9 con canal alfa.
- **Pendientes de la SPEC 02 fuera de alcance.** Ya resueltos según el autor; esta spec evita repetirlos.
- **Agentes por paso.** `cosmic-data-researcher` para datos, `web-motion-designer` para diseño y animación, `section-verifier` al final.

**Descartadas**

- **Imagen del cuásar generada con IA con superposiciones SVG por punto** (anillo del horizonte, partículas del disco, rayos de la lente). Sustituida por el vídeo, que ya trae el movimiento.
- **Vídeo generado con IA.** El resultado gratuito tenía 864×480 (16:9), otra composición (anillo blanco sobre la sombra, fondo con galaxia) y poca resolución para ampliar.
- **Zoom-out continuo desde la capa de entrada (`TonLayer`).** Obligaba a calibrar la continuidad exacta del agujero negro en x = 0 y dejaba un tramo de scroll con el mismo gráfico antes de que empezara la intro.
- **Bloom ámbar en el filo de los párpados.** Probado y retirado por decisión del autor.
- **Ampliar el track de Exploración con una quinta capa.** Modificaría la SPEC 02 (capas, tabla de scroll, `LevelNav`) y acoplaría ambas secciones.
- **Chorros relativistas como cuarto punto.** TON 618 es radiofuente, pero no hay evidencia verificada de chorros observados; la web trata de TON 618 y no debe mostrarlos.
- **Scroll guiado de punto en punto.** Más cinematográfico, pero suma scroll y complejidad.
- **Popover anclado al punto.** Problemas de colisión y de tapar la ilustración en móvil.
- **Animación explicativa del disco como intro automática o como botón aparte.** Fuerza a verla o añade un control extra; el movimiento del vídeo cubre la idea.
- **Animar `clip-path` para abrir el círculo.** Repinta; el parpadeo por `translate` logra una transición equivalente.
- **Dato numérico destacado por punto.** Más datos que verificar y adelanto de contenido de otras secciones.

---

## Riesgos identificados

- **Licencia y autoría del vídeo.** Procede de una nota de prensa y no se ha comprobado la fuente original; no publicar sin confirmarlo.
- **Nitidez al ampliar.** La fuente mide 986 px de lienzo (~330 px en el recorte del horizonte a ×3). Se limitó el zoom (horizonte ×2,2, disco ×1,5, lente ×2), pero en pantallas 2× puede verse blando. Mitigar con una fuente de más resolución o un reescalado.
- **Rigor científico del texto.** Los textos hablan de los cuásares en general y no afirman rasgos de TON 618 sin verificar; el investigador debe confirmar cada afirmación. La simulación no es específica de TON 618.
- **Acoplamiento con Exploración.** El parpadeo depende de que Ciencia empiece en x = 500 de Exploración y de la tarjeta final (370–400); si cambia el recorrido o la última tarjeta de Exploración hay que retocar los tramos de los párpados (440 → 500) y el solape de 100dvh.
- **Pantalla oscura sin `animation-timeline`.** Sin solape, el tramo entre las dos secciones se recorre con los párpados cerrados; aceptable como degradación en navegadores antiguos.
- **Peso y reproducción del vídeo.** ~0,4 MB por formato; en móvil la reproducción automática exige `muted` y `playsInline`, y puede no arrancar con ahorro de batería. Si no arranca, el póster actúa como respaldo.
- **WCAG 2.2.2 (pausar contenido en movimiento).** El vídeo se reproduce solo y en bucle más de 5 s; es decorativo y solo se mueve en vista y sin reduced-motion, pero conviene valorar un control de pausa si la auditoría lo exige.
- **Márgenes de la ilustración ampliada.** Con la cámara cerca, parte del vídeo puede quedar bajo la tarjeta en pantallas estrechas (resuelto con `sciClear` y `$sciCompact`; revisar en los 8 viewports).
- **Texto sobre el vídeo.** El visor llena casi todo el círculo, así que en viewports pequeños el título o el hint pueden coincidir con la parte naranja.
- **Rendimiento en móviles de gama media.** `mix-blend-mode`, el vídeo y los párpados a la vez; medir en dispositivo real con las barras del navegador dinámicas (`dvh`/`--viewportExtra`).
- **Scroll en móvil.** La intro y el hold suman 200 unidades (≈ 120svh en móvil vertical): si la persona pasa de largo, la sección se va sin haber explorado. El hint y los marcadores pulsantes deben estar visibles desde x = 110.
- **Acoplamiento futuro con la navegación.** La sección ocupa ~300svh en desktop (~220svh en móvil vertical) y solapa 100dvh de Exploración; el `rootMargin` del `IntersectionObserver` del spec de navegación debe tenerlo en cuenta.

---

## Qué **no** está en este spec

- Cambios en Hero o Exploración, salvo los párpados de cierre.
- Zoom libre y scroll guiado de punto en punto.
- Chorros relativistas, toro de polvo, corona y otros elementos del cuásar; datos numéricos destacados.
- Un vídeo distinto por punto (solo si el recorte no convence).
- Masa, luminosidad y secciones 4 en adelante.
- Navegación completa, Navbar y Footer, audio e imágenes astronómicas reales.

Cada una de estas cosas, si se hace, va en su propio spec.
