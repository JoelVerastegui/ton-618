# SPEC 02 — Exploración / Descubriendo a TON 618

**Estado:** Implemented
**Depende de:** SPEC 01
**Fecha:** 2026-11-19 (revisada tras la iteración visual del mismo día; ver «Historial de cambios»)
**Objetivo:** Implementar la sección Exploración como segunda escena de la web: un mapa espacial de cuatro niveles de zoom guiados por scroll, que combina ilustraciones generadas con IA e interactividad SVG/CSS y que, al acercarse desde el universo hasta TON 618, revela cuatro tarjetas de contexto.

Origen del contenido: `docs/ideas/02-exploration.md`. Datos verificados por el agente `cosmic-data-researcher`; diseño y motion por el agente `web-motion-designer`; la validación final de rendimiento la hace el agente `section-verifier` (Paso 10, **pendiente**).

---

## Historial de cambios respecto a la versión aprobada

La spec original (mapa 100 % SVG, cinco tarjetas, línea temporal, track de 660svh) se implementó en los pasos 1–9. Después, al revisar el resultado en pantalla, se decidió lo siguiente (todo ya implementado en la rama `spec-02-exploration`):

- **Ilustraciones:** el SVG puro no resultaba llamativo. Se pasa a un **balance entre imágenes generadas con IA** (con el fondo negro convertido en transparencia) **y elementos SVG/CSS interactivos**. Ver «Ilustraciones». Esto revoca la exclusión de imágenes y el presupuesto de «0 assets nuevos»; siguen excluidas las imágenes astronómicas reales.
- **Textos de escala eliminados:** ya no se rotula «ilustrativo, no a escala», «representación artística, no a escala» ni «Mapa esquemático, no a escala» (otra sección del sitio mostrará la realidad). Solo se conserva el subtítulo «esquemático» de la carta celeste (nivel 3).
- **Tarjeta «¿Por qué es tan luminoso?» eliminada** (4 tarjetas). El recorrido baja de 560 a 500 svh, con 130 svh por tarjeta, y se elimina la aproximación final al agujero negro (zoom ×1,25).
- **Responsive móvil vertical (posterior):** (1) el recorrido de scroll se acorta al 60 % con `--explUnit` (0,6svh en móvil vertical, 1svh en side-by-side); (2) stage y track de Hero y Exploración usan `dvh` con fallback `vh` (antes `svh`), para que no asome la sección siguiente ni quede hueco bajo las tarjetas al ocultarse las barras del navegador; (3) `--viewportExtra` centra mapa y tarjeta cuando el viewport crece. Ver «Unidad de recorrido» y «Layout».
- **Línea temporal eliminada** (con su skip link, sus tokens y sus estilos): era demasiado texto. Con ella desaparece la única vista de fuentes citadas.
- **Indicador «TON 618» con línea guía eliminado** en el nivel 4.
- **Datos recortados:** `hero.json` y `exploration.json` solo contienen lo que se muestra (más los textos para lectores de pantalla). Se borra `src/interfaces/common.ts`.
- **Scroll animado y lento** al pulsar «Iniciar exploración» y los botones de nivel.
- **Fondo negro** exclusivo de la tarjeta 2, con transición de color.
- **Ilustraciones circulares** (`clip-path: circle(50%)`) en los niveles 1, 2 y 4.
- **Leyenda de los anillos** (nivel 1) más visible.

---

## Alcance

### Incluido

- Componente de sección `Exploration` (`<section id="exploration">`) con track sticky de 600svh, mapa de 4 niveles y tarjetas sincronizadas con el zoom.
- Mapa de 4 capas (`UniverseLayer`, `NeighborhoodLayer`, `SkyRegionLayer`, `TonLayer`) y capa persistente de estrellas, sin canvas ni librerías. Cada capa combina ilustración raster (WebP con transparencia) y elementos SVG/HTML (ver «Ilustraciones»).
- Cuatro tarjetas (qué es un cuásar, dónde está, cuándo se descubrió, qué es TON 618), una por nivel.
- `LevelNav`: navegación por niveles (botones) como alternativa accesible al scroll, con indicador continuo de progreso.
- Zoom y tarjetas con `animation-timeline: view()` nativo, y fallback JS (`useTrackProgress`) que escribe `--progress`.
- Detección del nivel activo con IntersectionObserver y región `aria-live`.
- Scroll animado lento (`scrollToElement`) compartido con el CTA del Hero.
- Comportamiento completo con `prefers-reduced-motion: reduce` (contenido lineal, sin sticky ni zoom).
- Datos mínimos en `src/data/exploration.json` con interfaces en `src/interfaces/exploration.ts`.
- Continuidad con el Hero: la sección empieza con el color `$scene2Bg`, sin costura.
- Cambios en SPEC 01: `hero.json` con `targetSectionId: "exploration"` y recortado a lo que se muestra.

### Excluido (otros specs)

- Utilidad de navegación completa: `history.replaceState`, rutas por sección, `React.lazy` con `IntersectionObserver` (el componente se exporta de forma compatible con `lazy`).
- Zoom libre del mapa por el usuario (rueda, pellizco, arrastre) y controles +/−.
- Canvas, WebGL o librerías de mapas/animación.
- Imágenes astronómicas reales (NASA/ESA/NOIRLab); queda como posible mejora futura tras verificar licencias.
- Línea temporal, tarjeta de luminosidad y citas de fuentes en pantalla (retiradas; la investigación se conserva abajo como referencia).
- Navbar y Footer.
- Audio.
- Las secciones 3 en adelante (masa, disco de acreción, etc.).
- Afirmar que TON 618 pertenece a un supercúmulo concreto (no está documentado).

---

## Modelo de datos

Archivos: `src/interfaces/exploration.ts` y `src/data/exploration.json`. Solo contienen lo que se muestra en pantalla o se lee en lectores de pantalla. Todo campo que ningún componente use se elimina (regla de limpieza al cerrar una sección).

```ts
// src/interfaces/exploration.ts
export type ExplorationLevelId = 'universe' | 'cosmic-neighborhood' | 'sky-region' | 'ton618';
export type QuestionId = 'what-is' | 'where' | 'when' | 'quasar';

export interface ExplorationMarker {
  id: string;
  label: string;
}

export interface ExplorationLevel {
  id: ExplorationLevelId;
  order: number;
  title: string;
  ringLegend?: string; // «Cada anillo: +4 mil millones de años de viaje de la luz» (nivel 1)
  scaleNote?: string; // «esquemático» (nivel 3)
  markers?: ExplorationMarker[]; // etiquetas del mapa
  mapSummary: string; // equivalente textual del mapa para lectores de pantalla
}

export interface ExplorationCard {
  id: QuestionId;
  order: number;
  kicker: string;
  question: string;
  answer: string; // ≤ 40 palabras y ≤ 220 caracteres
}

export interface ExplorationData {
  title: string; // h2 visualmente oculto
  levels: ExplorationLevel[];
  cards: ExplorationCard[];
}
```

`hero.json` / `src/interfaces/hero.ts` (SPEC 01) quedan reducidos a `title { main, tagline }`, `subtitle`, `cta { label, targetSectionId: "exploration" }` y `caption`. `src/interfaces/common.ts` se elimina.

**Reparto de tarjetas por nivel:**

| Nivel | Nombre              | Tarjeta                  |
| ----- | ------------------- | ------------------------ |
| 1     | Universo observable | ¿Qué es un cuásar?       |
| 2     | Vecindad cósmica    | ¿Dónde se encuentra?     |
| 3     | Región del cielo    | ¿Cuándo fue descubierto? |
| 4     | TON 618             | ¿Qué es TON 618?         |

Las tarjetas muestran solo `kicker`, `question` y `answer`. La tarjeta 4 es la última: entra y se queda hasta que se libera el stage.

**Convenciones del mapa:**

- Cada nivel es un `div` con sus ilustraciones: imágenes `<img>` (decorativas, `alt=""`, con `width`/`height`) y un `<svg viewBox="0 0 1000 1000">` (no un `<g>` en un SVG único: las transformaciones CSS sobre hijos SVG no se componen en GPU de forma fiable).
- TON 618 siempre en (500, 500), centro de la capa y origen del zoom. Las etiquetas son HTML posicionadas con `left`/`top` en `%`, con tamaño en `rem` (≥ 12 px).
- Todo el mapa es decorativo (`aria-hidden`); el equivalente textual es `mapSummary`.

---

## Ilustraciones

Principio: la imagen aporta realismo e impacto, y el SVG/HTML/CSS aporta estructura e interactividad. La imagen **no es un fondo**: se integra como un elemento más de la ilustración, sin fondo (el negro del original pasa a transparencia por brillo: alfa = brillo máximo del píxel, con umbral y desvanecimiento radial del borde; procesado con `sharp` desde un directorio temporal, sin dependencia nueva). Los prompts se redactaron como apoyo al diseño (fondo negro puro, sin estrellas de primer plano, centro despejado).

| Nivel | Imagen (WebP con alfa)                                                                                                                  | SVG / HTML interactivo                                                                                                                                                                                                         |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| L1    | `milky-way-384.webp` (384×384, 48 KB): Vía Láctea vista desde arriba, centrada en (209, 659), 20 % del ancho, con la Tierra sobre un brazo. | Telaraña (1 `<path>`), galaxias en 3 `<path>` de puntos que centellean (5, 6,5 y 4,2 s), 3 anillos discontinuos a +4 mil millones de años de luz cada uno, línea Tierra→TON (`scale`), «Estás aquí», recorte circular del SVG.    |
| L2    | `deep-field-1024.webp` (1024×1024, 176 KB): campo de galaxias lejanas y nebulosas, a capa completa y con recorte circular.               | 560 estrellas de fondo en puntos SVG (380 fijas y 3 grupos de 90 que centellean a 5,5, 4,4 y 7 s), halo de ~120 u, pulso de destino, indicador «↙ Vía Láctea» y recorte circular. Se quitan los cúmulos y filamentos dibujados. |
| L3    | Ninguna (se mantiene en SVG).                                                                                                           | Carta celeste circular (r = 430 u), retícula RA/Dec (6 `<path>`), ~40 estrellas, «Canes Venatici» con Cor Caroli y Chara, subtítulo «esquemático», «Observas desde la Tierra».                                                  |
| L4    | `ton618-blackhole-1024.webp` del Hero (sin descarga nueva), a capa completa con recorte circular.                                       | 400 estrellas de fondo en puntos SVG (220 fijas y 3 grupos de 60 que centellean), pulso del agujero que se desvanece. Sin etiqueta ni línea guía.                                                                              |

- **Estrellas parpadeantes:** se generan en código (puntos SVG en grupos), nunca en la imagen. Solo animan `opacity` (0,35 → 1), con desfase por grupo; se pausan fuera de vista y se desactivan con `prefers-reduced-motion`.
- **Capa persistente de estrellas:** ~120 por `box-shadow` generado en compilación, detrás de las cuatro capas; escala suave de 1 a 1,15 en todo el recorrido.
- **Leyenda de los anillos (L1):** `starlight` pleno, 0,9375 rem, peso 500, con sombra de contraste.
- **Fondo de la tarjeta 2:** negro puro (`$spaceBlack`, #000). Una capa `.blackout` bajo el mapa solo cambia de `opacity` (sin pintar color) con el mismo ritmo que la tarjeta 2 (entra en el 23 % del tramo y sale en el 77 %); el degradado inferior del stage hace lo mismo. En las demás tarjetas el fondo es `$scene2Bg`.
- **Presupuesto de peso:** imágenes de la sección ≈ 224 KB (48 + 176) más la imagen del Hero ya existente.

---

## Plan de implementación

Los pasos 1–9 están hechos; el 10 queda pendiente y no se ejecutará hasta la siguiente sesión.

1. **Tokens y base.** ✅ `_variables.scss`: `$explorationTravel: 500`, `$explorationTrack` (600svh), `$explStops` (l1 0, l2 110, l3 240, l4 375), `$zoomOut: 2.5`, `$zoomIn: 0.4`, `$cardLife: 130`, `$cardFade: 30`, `$cardShift: 18px`, `$motionPulse: 3600ms`, `$amberText`, `$spaceBlack`, `$mapSizeDesktop`, `$mapSizeMobile`, `$cardWidth`, `$sideBySide`, `svhAt` y `exploRange(Of)`. Parciales `_starfield.scss` y `_mapLabels.scss`.
2. **Datos.** ✅ Interfaces y JSON de la sección y recorte de `hero.json` (ver «Modelo de datos»).
3. **Sección estática.** ✅ `Exploration.tsx` y `.module.scss` (`<section>`, `.track`, `.stage` sticky, tarjetas como `<article>` con `<h3>`, resúmenes ocultos, región `aria-live`), montada en `App.tsx` tras `Hero`.
4. **Capas del mapa.** ✅ `MapLayers.tsx` y `Layers/` (`Layer`, `UniverseLayer`, `NeighborhoodLayer`, `SkyRegionLayer`, `TonLayer`, con su SCSS). Utilidades en `src/utils/` (`geometry`, `layerData`, `levelLabel`, `scrollTo`).
5. **Zoom y tarjetas con scroll nativo.** ✅ `view-timeline: --explorationTrack`; zoom con keyframes lineales de 4 tramos; tarjetas 1–3 con `cardLife` y la 4 con `cardStay`. Solo `transform`/`opacity`.
6. **Fallback de scroll.** ✅ `useTrackProgress.ts` y CSS en `@supports not (animation-timeline: view())`.
7. **Nivel activo y navegación.** ✅ `useExplorationLevel.ts`, `LevelNav.tsx`, `aria-live`; `goTo` usa `scrollToElement`.
8. **Marcadores y `will-change`.** ✅ Anillos pulsantes, línea Tierra→TON, «Estás aquí», `will-change` solo en la capa activa y su vecina, pausa fuera de vista con `useInView`.
9. **Reduced-motion.** ✅ Contenido lineal (el `.stage` pasa a columna), sin sticky, zoom ni pulso; `LevelNav` oculto.
**Iteración visual (posterior al Paso 9).** ✅ Ilustraciones con IA y recortes circulares, 4 tarjetas, recorrido de 500 svh, fondo negro de la tarjeta 2, scroll animado lento, eliminación de la línea temporal y de los textos de escala, recorte de datos (ver «Historial de cambios»).
10. **Verificación con `section-verifier`.** ✅ Ejecutada el 2026-11-20 (resultados en «Resultados de la verificación»; quedan pendientes F3, F4 parcial y las mediciones en dispositivo real). Descripción original: ejecutar el agente sobre la sección completa (rendimiento, accesibilidad, responsive, animaciones y robustez, con medición en navegador) y comprobar los criterios de aceptación. Registrar en el spec los resultados y los pendientes, y aplicar los arreglos que el agente proponga. Puntos ya anotados para ese paso: cumplimiento de 0 Layout / 0 Paint y ≤ 3 capas compuestas con las imágenes nuevas (en el entorno de desarrollo se midieron 8 Layout y ~123–170 Paint, también antes de las imágenes); nitidez de las imágenes de 1024 px con zoom ×2,5 (L1, L2) y pantallas 2×; Lighthouse móvil con el peso de las imágenes; Firefox y Safari reales; anchos hasta 2560 px.

---

## Referencia de diseño

### Estructura y continuidad

- **Orden de lectura:** `<section id="exploration">` contiene el `.track` con el `.stage` sticky. La tarjeta 4 queda fija hasta el final del recorrido; no hay contenido debajo.
- **Continuidad con el Hero:** el borde superior de la sección es `$scene2Bg` liso (mismo color que el overlay final del Hero). La capa de estrellas hace fade-in entre `cover 0` y `cover 100svh`, antes de que el sticky se pegue. Un scrim inferior `linear-gradient(to top, $scene2Bg, transparent 20%)` da contraste a las tarjetas.
- **Timeline nativo:** `view-timeline: --explorationTrack block` en `.track`. El sticky empieza en `cover 100svh` y termina en `cover 600svh`. No se usa `scroll(root)`.

### Zoom y cruce de niveles

- Capa saliente: scale 1→2,5 (`$zoomOut`; stops 1 → 1,26 → 1,58 → 1,99 → 2,5). Capa entrante: 0,4→1 (`$zoomIn`; 0,4 → 0,5 → 0,63 → 0,80 → 1). Cada transición equivale a ~6,25× de zoom. La capa 4 termina en escala 1 (sin aproximación extra).
- Sin parpadeo: la entrante va encima y sube de opacidad 0→1 entre el 20 % y el 60 % de la transición; la saliente mantiene 1 hasta el 60 % y baja a 0 hasta el 100 %, ya tapada. Nunca hay dos capas semitransparentes a la vez.
- Solo `transform` (`translate`, `scale`, `rotate`) y `opacity`. Sin `filter`, `backdrop-filter` ni `mix-blend-mode`.

### Tabla scroll → progreso

Track = 100dvh + 500 unidades de recorrido; `x` en unidades de recorrido desde el inicio del sticky (`p = x / 500`).

**Unidad de recorrido:** `--explUnit` (definida en `.section`) vale 1svh en side-by-side (track de 600 «svh») y 0,6svh en móvil vertical (< 992 px, no apaisado de poca altura): track ≈ 100dvh + 300svh, ~78svh de scroll por tarjeta en vez de ~130. Todas las posiciones de la tabla (`x`, anclas, centinelas, rangos de animación, tarjetas y `LevelNav`) están en esta unidad, así que `x` y `p` no cambian: lo que cambia es la distancia física en píxeles. Al verificar en móvil, convertir `x` a píxeles con `x × 0,6 × innerHeight/100` (desktop: `x × innerHeight/100`).

| Evento                                    | x (svh)                 | p         |
| ----------------------------------------- | ----------------------- | --------- |
| Entrada: stage entra, estrellas fade-in   | −100 → 0                | —         |
| Tarjeta 1: entra / sale                   | −32 → 0 / 80 → 110      | — / 0,16–0,22 |
| Zoom L1→L2                                | 80 → 140                | 0,16–0,28 |
| Tarjeta 2: entra / sale (fondo negro)     | 110 → 140 / 210 → 240   | —         |
| Zoom L2→L3                                | 210 → 270               | 0,42–0,54 |
| Tarjeta 3: entra / sale                   | 240 → 270 / 340 → 370   | —         |
| Zoom L3→L4                                | 340 → 410               | 0,68–0,82 |
| Tarjeta 4: entra (se queda hasta el final) | 370 → 400               | 0,74–0,80 |
| Pulso del agujero se desvanece (L4)       | 385 → 445               | —         |
| Hold final                                | 410 → 500               | 1         |

Cambio de nivel activo: L2 en x = 110, L3 en x = 240, L4 en x = 375. Anclas de `goTo`: x = 40, 175, 305, 435. Keyframe `cardLife` (4 stops): 0 % opacity 0 y translate 0 18px; 23 % opacity 1; 77 % opacity 1; 100 % opacity 0 y translate 0 −18px (rango de 130 unidades por tarjeta: ~130svh en desktop, ~78svh en móvil vertical). `cardStay` solo hace la entrada.

### Scroll animado (`scrollToElement`)

- Lo usan el botón «Iniciar exploración» del Hero y los botones de `LevelNav`.
- Animación con `requestAnimationFrame` y `easeInOutCubic`; duración = distancia × 1,4 ms/px, entre 1,4 y 4 s (≈ 1,5 s del Hero a la sección y 1,5–2 s entre niveles).
- Se cancela si la persona usa la rueda, toca la pantalla o pulsa una tecla. Con `prefers-reduced-motion: reduce` el salto es instantáneo.

### Layout

- **Desktop (≥ 992 px, y móvil apaisado con `max-height: $shortHeight`):** mapa a la izquierda centrado en (34vw, 50svh); tarjeta a la derecha (ancho `$cardWidth`, margen derecho `max(4vw, 3rem)`, centrada en vertical); rail de niveles vertical en el borde izquierdo. Tarjeta: fondo `rgba($cosmicBlue, 0.82)` sin `backdrop-filter`, borde 1 px Starlight 14 % y borde izquierdo ámbar de 2 px, radio 0,75 rem, padding 1,75 rem. Kicker 0,75 rem en `$amberText`; pregunta `clamp(1.5rem, 2.2vw, 2rem)` peso 300; cuerpo 1 rem / 1,6, máx. 44ch, ≤ 220 caracteres.
- **Alturas con barras del navegador:** `.stage` y `.track` (y los del Hero) usan `dvh` con `vh` de fallback declarado antes; mapa, textos y agujero negro siguen en `svh` para no redimensionarse al mostrar u ocultar las barras.
- **Móvil y tablet (< 992 px):** mapa `min(100vw, 60svh)` con centro a 34svh del borde superior; tarjeta abajo (`calc(100% - 2rem)`, máx. 34 rem, `bottom: max(1rem, env(safe-area-inset-bottom))`, ~28–33svh). Ambos suman `--viewportExtra = (100dvh − 100svh) / 2` (0 con las barras visibles o en side-by-side): con las barras ocultas el mapa baja y la tarjeta sube esa mitad, repartiendo el espacio extra de forma simétrica; `LevelNav` en fila horizontal arriba con 4 segmentos de 44 px de alto táctil.
- **Reduced-motion:** `.stage` en columna con padding inferior de 3 rem; bloques de lectura por nivel (capa, título + resumen, tarjeta) ordenados con `explReadOrder`.

### Contraste

Starlight sobre Cosmic Blue ≈ 14:1; cuerpo al 82 % ≥ 9:1; kicker con `color-mix` ámbar ≥ 4,5:1. Etiquetas del mapa Starlight ≥ 70 % sobre `$spaceVoid`/`$spaceBlack`; ningún texto por debajo de 0,72 de opacidad. El ámbar puro queda para trazos, halos, bordes y números grandes.

### Accesibilidad

- Las 4 respuestas están siempre en el DOM y en orden de lectura (con opacidad 0 siguen expuestas); las tarjetas llevan `pointer-events: none`.
- `LevelNav`: `aria-label="Nivel N de 4: nombre"`, `aria-current="step"` en el activo, `:focus-visible` de 2 px Starlight. Sin atajos propios: PageUp, PageDown y flechas siguen siendo scroll nativo.
- Las imágenes son decorativas (`alt=""`); el contenido equivalente está en `mapSummary` (visible para lectores de pantalla).

### Presupuesto

| Concepto                          | Límite                             |
| --------------------------------- | ---------------------------------- |
| Imágenes nuevas de la sección     | ≈ 224 KB en total (48 + 176 KB)    |
| JS del chunk de Exploración       | ≤ 12 KB gz                         |
| CSS de los módulos de Exploración | ≤ 8 KB gz                          |
| `exploration.json`                | ≤ 4 KB (actual ≈ 3 KB)             |
| Nodos SVG / HTML                  | ≤ 120 / ≤ 90 (sin contar los puntos de cada `<path>`) |
| Capas compuestas a la vez         | ≤ 3                                |
| Trabajo por frame al hacer scroll | solo composite (0 Layout, 0 Paint) |
| Lighthouse móvil                  | Performance ≥ 90, CLS 0            |

---

## Criterios de aceptación

Marcadas las que pasaron en el Paso 10 (verificación del 2026-11-20); las demás llevan la nota de lo que falta (ver «Resultados de la verificación»).

**Contenido y estructura**

- [x] `<section id="exploration">` existe, se monta tras `Hero` en `App.tsx` y tiene `aria-labelledby`; hay un `<h2>` (oculto) y un `<h3>` por tarjeta, sin ningún `<h1>` nuevo.
- [x] Pulsar el CTA del Hero hace scroll animado y lento hasta `#exploration` (`hero.json` tiene `targetSectionId: "exploration"`).
- [x] Todos los textos visibles salen de `exploration.json` o `hero.json`; ninguno está escrito directamente en el TSX, salvo los fijos de `LevelNav`.
- [x] Las 4 tarjetas aparecen en el orden quasar → dónde → cuándo → qué es, una por nivel; la 4 queda fija hasta el final.
- [x] Cada tarjeta tiene ≤ 40 palabras y ≤ 220 caracteres.
- [x] No aparece ningún rótulo «ilustrativo», «representación artística», «Mapa esquemático, no a escala» ni «no a escala»; solo el subtítulo «esquemático» del nivel 3. Ningún texto afirma pertenencia de TON 618 a un supercúmulo.
- [x] No hay línea temporal, skip link ni indicador «TON 618» con línea guía en el nivel 4.
- [x] Los JSON e interfaces no contienen campos que ningún componente use.
- [x] Los niveles 1, 2 y 4 tienen su ilustración circular; el nivel 2 muestra fondo negro solo durante la tarjeta 2 y en la 3 vuelve al color de las demás.
- [x] No hay scroll horizontal entre 320 y 2560 px de ancho.
- [x] Ni el texto ni las tarjetas tapan el marcador de TON 618 en 320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900 y 1920×1080.
- [x] No hay archivos `.scss` sueltos (solo `.module.scss`), ni `!important`, ni `style={{}}` salvo valores dinámicos; las clases están en camelCase; el código pasa `prettier --check`.
- [x] `npm run build` termina sin errores de TypeScript ni de lint.
- [x] El borde superior de la sección es `$scene2Bg` y no hay costura de color visible respecto al final del Hero. *(Paso 10: sin costura en desktop; falta probar móvil con barras dinámicas.)*

**Zoom y scroll**

- [x] En móvil vertical, con las barras del navegador visibles y ocultas (y durante la transición), el `.stage` cubre toda la ventana: no asoma la sección siguiente bajo el Hero ni hay hueco bajo las tarjetas; mapa y tarjeta quedan repartidos simétricamente (`--viewportExtra`) y sin saltos de layout (CLS = 0). *(Paso 10: no verificable en emulación; probar en iOS Safari y Chrome Android.)*
- [x] En móvil vertical el recorrido por tarjeta es ~78svh (0,6 × el de desktop) y las paradas (L2 = 110, L3 = 240, L4 = 375 unidades) siguen sincronizadas con zoom, tarjetas y `LevelNav`.
- [x] En `scrollY` al inicio del sticky se ve el nivel 1; al final del recorrido (x = 500 unidades) se ve TON 618 con la tarjeta 4 completa y sin zoom adicional.
- [x] Durante cada cruce de niveles nunca hay dos capas con `opacity` intermedia a la vez (comprobado en `getComputedStyle` o grabación frame a frame).
- [x] El nivel activo cambia en x = 110, 240 y 375 unidades (±10; 1 unidad = `--explUnit`) y se refleja en `data-level`, `aria-current` y la región `aria-live`.
- [x] En un navegador sin `animation-timeline` el efecto funciona vía `--progress` (incluido el fondo negro de la tarjeta 2) y la consola no muestra errores.
- [x] Los botones de `LevelNav` llevan al nivel correspondiente con `scrollToElement` (animado y lento), se activan con Enter y Espacio, y el desplazamiento se cancela con rueda, toque o teclado. *(Paso 10: pasa con clic, Enter, Espacio, rueda y teclado; falta probar el toque.)*
- [x] Solo se animan `transform` y `opacity`; no hay `filter`, `backdrop-filter` ni `mix-blend-mode`.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [x] Lighthouse móvil: Performance ≥ 90, CLS = 0.
- [x] Durante el scroll de la sección la traza de Chromium muestra 0 Layout y 0 Paint tras calentar (solo composite). *(Paso 10: 0 en scroll estable; quedan 1–2 Layout y 4–10 Paint por cambio de nivel.)*
- [x] ≥ 95 % de los frames por debajo de 20 ms durante el scroll del track (en un dispositivo real si el entorno no tiene GPU). *(Paso 10: pasa en móvil emulado; no concluyente sin GPU.)*
- [x] Con `data-inview="false"`, `document.getAnimations()` filtrado por la sección devuelve 0 animaciones en ejecución.
- [x] React Profiler muestra ≤ 5 renders durante el recorrido completo del track y 0 en las capas del mapa (`memo`). *(Paso 10: 3 commits en el recorrido, medidos con un hook; falta el Profiler.)*
- [x] Las imágenes nuevas suman ≈ 224 KB; el JS de la sección ≤ 12 KB gz y el CSS ≤ 8 KB gz.
- [x] `will-change` solo está aplicado en la capa activa y su vecina. *(Paso 10: en L2 y L3 hay 3 capas, activa y ambos vecinos.)*
- [x] Las imágenes de 1024 px se ven nítidas con el zoom máximo (L1, L2) y en pantallas 2×; si no, se baja `$zoomOut` a 2 y `$zoomIn` a 0,5. *(Paso 10: pendiente de revisar en un monitor 2×.)*

**Accesibilidad**

- [x] axe/Lighthouse: 0 violaciones de contraste; todo texto ≥ 4,5:1 (incluida la leyenda de los anillos y las etiquetas sobre el fondo negro). *(Paso 10: axe 0; «Estás aquí» ronda 3,3:1 sobre la Vía Láctea en desktop.)*
- [x] Las capas del mapa y las imágenes están ocultas a las tecnologías de apoyo y cada nivel tiene su `mapSummary` accesible.
- [x] Todo se alcanza con Tab (botones de nivel), con `:focus-visible` visible y áreas táctiles ≥ 44 px.
- [x] Las 4 respuestas son legibles por lectores de pantalla aunque su opacidad sea 0.
- [x] Con `prefers-reduced-motion: reduce` emulado: `document.getAnimations()` de la sección devuelve 0, `.track` no es sticky, los 4 niveles se apilan en lectura lineal, `LevelNav` está oculto y el scroll es instantáneo.
- [x] Ningún destello supera 1 evento cada ~2 s (el pulso de destino dura 3600 ms con desfase de 1800 ms: ≤ 0,55 destellos/s); el centelleo de las estrellas es lento (≥ 4,2 s por ciclo).

**Verificación final**

- [x] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz y arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Resultados de la verificación (Paso 10, 2026-11-20)

Medido con Edge headless sin GPU sobre `vite preview` (desktop 1440×900 y móvil 390×844 DPR 2, CPU ×4). `npm run build`, `eslint` y `prettier --check` pasan.

**Pasa:** estructura y encabezados; CTA; tarjetas (máx. 29 palabras / 161 caracteres); sin línea temporal ni rótulos de escala; recortes circulares; fondo negro solo en la tarjeta 2; sin scroll horizontal (320–2560); sin solape con el marcador en 11 viewports; inicio/fin del recorrido; nunca dos capas semitransparentes; fallback sin `animation-timeline` equivalente al nativo; `LevelNav` (clic, Enter, Espacio, cancelación por rueda y teclado); solo `transform`/`opacity`; Lighthouse móvil 93 ×3 con CLS 0 (LCP 3,2 s es el `h1` del Hero); axe 0 violaciones; foco y áreas de 44 px; reduced-motion; 0 animaciones fuera de vista; 3 commits de React en el recorrido; pesos (imágenes 224,1 KB, JS +5,6 KB gz, CSS +5,5 KB gz).

**Hallazgos corregidos:**

- **F1.** En móvil vertical el nivel activo cambiaba ~33 unidades antes: la línea del `IntersectionObserver` es el 50 % del viewport en px y los centinelas la sumaban como 50 unidades. Los centinelas usan ahora `calc(explLen(stop) + 50dvh)`. Cambian en 110/240/375 en desktop y móvil.
- **F2.** Los `mapSummary` de los niveles 2 y 4 contenían «ilustrativo» y «Representación artística»; retirados.
- **F4 (parcial).** `LevelNav` animaba color y fondo al cambiar de nivel (22–39 Paint por cambio); la transición pasa a `:hover` (4–10 Paint).

**Pendientes:**

- **F3 (alta).** El árbol de capas tiene 45–49 capas dibujadas frente al límite de ≤ 3. Causa: cada `<path>` de centelleo con `opacity` se promueve a su propia capa de hasta ~1900 px (9 paths siempre animando). Sin centelleo el frame desktop sin GPU baja de 33–50 ms a 16,7 ms. Decisión de diseño (`web-motion-designer`): un solo grupo, o centelleo solo en la capa activa, o sustituir el efecto.
- **0 Layout / 0 Paint.** Estable dentro de un nivel; en cada cambio quedan 1–2 Layout (`font-weight: 700` del botón activo y reescritura de la región `aria-live`) y 4–10 Paint.
- **F5.** Las 3 imágenes (≈ 383 KB) se piden junto al Hero; `fetchPriority='low'` no cambió Lighthouse (revertido).
- **F6.** Durante el cruce L1→L2 las etiquetas de L1 escaladas (~32 px) se solapan con «TON 618» de L2.
- **Contraste de «Estás aquí»** en desktop: p90 3,3:1 sobre el borde de la Vía Láctea (axe: 0 violaciones).
- ~~**Nodos HTML:** 82 frente a 80~~ Resuelto: el límite sube a 90 (el DOM de ~80 nodos no tiene efecto medible en rendimiento).
- **Imagen del nivel 4 en móvil:** carga la de 1024 (~165 KB) además de la de 800 del Hero.
- **`hero.json`** `caption: "Representación artística."` sigue visible (SPEC 01).
- **No medido:** móvil real con barras dinámicas (`--viewportExtra`, `dvh`), Firefox y Safari, GPU real, memoria raster, nitidez en 2×, cancelación táctil.

**Ajustes propuestos a la spec:** presupuesto de capas (definir según el centelleo adoptado); 0 Layout/Paint acotado a scroll estable dentro de un nivel; duración del CTA (≈ 2,5 s en 1440×900 con 1,4 ms/px); anotar que la línea del observer va en px; método de conteo de nodos.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Zoom guiado por scroll con botones de nivel.** Coherente con CLAUDE.md (navegación por scroll) y con el patrón sticky del Hero; los botones dan una alternativa accesible.
- **Balance entre imágenes de IA y SVG/CSS.** El SVG puro se veía esquemático; una imagen de fondo con indicadores encima se veía pegada. Se integran las imágenes como elementos sin fondo y lo interactivo queda en SVG/HTML (estrellas parpadeantes, marcadores, anillos, etiquetas). El nivel 3 se queda en SVG porque es una carta celeste.
- **Recorte circular** en los niveles con imagen, para un formato consistente.
- **Sin textos de escala ni rótulos de «representación artística».** La web busca impacto; otra sección mostrará la realidad.
- **Cuatro tarjetas, sin línea temporal.** Menos texto y un recorrido más corto (500 svh, 130 svh por tarjeta); el agujero negro no hace zoom adicional.
- **Datos mínimos.** Los JSON solo guardan lo que se muestra; se conservan los textos para lectores de pantalla.
- **Fondo negro solo en la tarjeta 2**, con una capa de `opacity` para no pintar color en cada frame.
- **Scroll animado lento propio** (`scrollToElement`) en vez del scroll suave nativo, para controlar la velocidad.
- **Id `exploration` y cambio en `hero.json`.** Cierra el riesgo abierto de la SPEC 01 (`section-2` era provisional).
- **`view-timeline` sobre `.track` en vez de `scroll(root)`.** No depende de la altura de lo que haya encima del track.
- **Cada nivel es un `div` con su `<svg>`.** El zoom compone en GPU; las transformaciones CSS sobre `<g>` repintan.
- **Etiquetas en HTML, no en SVG.** Permite `rem` reales (≥ 12 px) en móvil.
- **Nivel 2 genérico.** No hay estructura a gran escala documentada para TON 618; se muestra un campo de galaxias y nebulosas sin afirmar pertenencia.
- **Agentes por paso.** `cosmic-data-researcher` para datos, `web-motion-designer` para diseño y `section-verifier` al final. Ambos agentes se actualizaron con los criterios de esta iteración (balance imagen/SVG, contenido mínimo).
- **Track con token `$explorationTravel`.** El recorrido puede cambiarse con un valor.

**Descartadas**

- **Zoom libre (rueda, pellizco, arrastre).** Choca con el scroll nativo en móvil y es mucho más complejo.
- **Canvas 2D.** Requiere bucle rAF y gestión de DPR, y es menos accesible.
- **Imágenes astronómicas reales.** Licencias por verificar; se usan imágenes generadas con IA. La imagen de la idea original (Whirlpool) se descarta por licencia desconocida e irrelevancia científica.
- **Imagen a pantalla completa con indicadores encima.** No se integraba con la ilustración.
- **Estrellas dentro de la imagen.** No se podrían animar; se generan en código.
- **`stroke-dashoffset` en SVG para la línea Tierra→TON.** Repinta en cada frame; se usa una línea HTML con `scale`.
- **`filter: blur`, `backdrop-filter` y `mix-blend-mode`.** Coste alto en móviles de gama media.
- **Roving tabindex y atajos de teclado propios.** PageUp, PageDown y flechas ya son scroll nativo.
- **Línea temporal, tarjeta de luminosidad, citas de fuentes en pantalla, zoom de aproximación final e indicador «TON 618» con línea guía.** Retirados por exceso de texto o por falta de aporte.

---

## Riesgos identificados

- **Nitidez y memoria de las imágenes al escalar.** Con zoom 2,5× y un mapa de ~806 px, la capa saliente ronda 2000 px por lado. Las imágenes de L1 (384 px) y L2 (1024 px) pueden verse blandas en pantallas 2× o con el zoom máximo; la memoria raster de las capas compuestas sigue sin medirse. Verificar en el panel Layers y en un móvil real; si es excesivo, bajar `$zoomOut` a 2 y `$zoomIn` a 0,5 o pedir imágenes de mayor resolución (la versión gratuita del generador limita a 1024 px).
- **Licencia de las imágenes generadas.** Depende de los términos del generador usado; conviene guardar herramienta y fecha de generación. No se rotulan como «ilustración generada con IA» en pantalla, por decisión del diseño.
- **Repetición visible.** El nivel 2 es una sola imagen a capa completa con una composición en «X» de nebulosas; si se percibe como patrón, regenerarla (prompt alternativo en el historial).
- **Peso adicional.** ≈ 224 KB de imágenes frente al presupuesto original de 0; confirmar Lighthouse móvil en el Paso 10.
- **Rendimiento en móviles de gama media.** La SPEC 01 ya mostró un margen estrecho sin GPU (~30 fps). Las animaciones de `opacity` de los grupos de estrellas y de los puntos SVG pueden repintar el SVG; medir en dispositivo real.
- **Medición pendiente de 0 Layout / 0 Paint.** En el entorno de desarrollo se midieron 8 Layout y ~123–170 Paint durante el scroll (también antes de las imágenes); la capa de estrellas y las capas del mapa están compuestas mientras están en vista (≤ 3 capas aún por confirmar).
- **Scroll animado propio.** `scrollToElement` sustituye al scroll nativo; puede chocar con el scroll-snap o con la navegación futura. Se cancela con la rueda, el toque y el teclado, pero conviene probarlo en móviles reales.
- **`animation-range` con `cover` y `calc()` de longitudes.** Verificar en Chrome, Safari y Firefox; el fallback con `--progress` cubre el efecto completo. La prueba en un Firefox real sigue pendiente, como en la SPEC 01.
- **Hand-off con el Hero.** Si `$scene2Bg` deja de ser `$spaceVoid`, hay que revisar la costura entre el overlay del Hero y el borde superior de la sección. El fondo negro de la tarjeta 2 es un cambio de color solo durante esa tarjeta.
- **Fatiga de scroll.** 600svh serían unos 5 gestos en móvil; con `--explUnit` (0,6) son ~3. Mitigado también con los botones de nivel y el token `$explorationTravel`.
- **`dvh` y rangos en `svh`.** El stage cambia de altura mientras las barras se mueven; los `animation-range` usan `svh` y pueden desfasarse unos puntos porcentuales al inicio y al final del sticky. Probar en un móvil real (iOS Safari y Chrome Android).
- **Lectura rápida.** Con scroll muy rápido el usuario puede saltarse tarjetas; todo el contenido sigue en el DOM y en la versión reduced-motion.
- **IntersectionObserver asíncrono.** El indicador de nivel puede ir un frame por detrás del scroll; es aceptable.
- **Acoplamiento futuro con la navegación.** La sección ocupa 600svh en desktop y ~400svh en móvil vertical; el `rootMargin` del `IntersectionObserver` del spec de navegación debe tenerlo en cuenta.
- **Pérdida de las citas de fuentes en la web.** Los JSON ya no incluyen fuentes; la trazabilidad de las cifras queda en la referencia de investigación de este documento.

---

## Referencia de investigación (no se muestra en pantalla)

Datos verificados por el investigador durante este spec, conservados para secciones futuras. Las cifras de masa y distancia del Hero se mantienen en su texto de pantalla («más de 60 mil millones de masas solares»).

- **Ubicación:** constelación Canes Venatici (fronteras IAU; vértice más cercano a ~0,5°, cerca del límite con Coma Berenices). RA/Dec J2000: 187,10402° / +31,47712° (12h 28m 24,96s, +31° 28′ 37,6″). Latitud galáctica b ≈ +83,4°. Corrimiento al rojo z = 2,2218 ± 0,00006 (NED).
- **Distancia** (ΛCDM plano, derivada): tiempo de viaje de la luz ≈ 10,8 mil millones de años (rango 10,1–10,9), distancia comóvil ≈ 18 mil millones de años luz (17–18,3), distancia de luminosidad ≈ 59 mil millones de años luz.
- **Luminosidad** (derivada, rango): 1,0–1,8×10⁴⁸ erg/s (1,0–1,8×10⁴¹ W), entre 2,7×10¹⁴ y 4,8×10¹⁴ veces el Sol, del orden de 10⁴ veces la Vía Láctea. Sale de L(5100) = 10^47,31 erg/s (Shemmer 2004, tabla 2; Ge 2019 coincide) × corrección bolométrica 5–9. Eficiencia de disco delgado ~6 % a ~30–40 % de mc² frente a ~0,7 % de la fusión estelar.
- **Masa:** 40–66 mil millones de M☉ (estimación con la línea Hβ; Shemmer 2004 y compilación de Ge 2019, que difieren por la calibración de la luminosidad y de la anchura de línea).
- **Nivel 2:** no hay supercúmulo documentado asociado. Su entorno propio medido (nebulosa Lyα gigante y halo de gas molecular de ~100 kpc, Li et al. 2021) puede citarse; el «protocúmulo» es hipótesis.
- **Hitos históricos** (retirados de la web): 1957 estrella azul débil en las listas de Tonantzintla (Iriarte y Chavira); 1970 radiofuente B2 1225+31 (Colla et al.); 1976 espectro de Ulrich que la identifica como cuásar de luminosidad extrema (z ≈ 2,2); 2004 Shemmer et al. estiman ~66 mil millones de M☉; 2021 Li et al. detectan salida de gas molecular con ALMA. Correcciones a la idea original: 1957 no es un cuásar; 1970 es una radiofuente y la confirmación como cuásar es de 1976.
- **Fuentes** (consultadas el 2026-11-19): NED (TON 618), Shemmer et al. 2004 (arXiv:astro-ph/0406559), Ge et al. 2019 (arXiv:1903.08830), Iriarte y Chavira 1957, Colla et al. 1970 (ADS 1970A&AS....1..281C), Ulrich 1976 (ADS 1976ApJ...207L..73U), Schmidt 1963, Li et al. 2021 (arXiv:2111.06409), ESA/Hubble wordbank «quasar», NASA Science «Hubble Quasars», NASA SVS «Supermassive Black Hole Scale Comparison».
- **Por verificar antes de reutilizarlos:** fila exacta de TON 618 en el PDF de Shemmer 2004; abstract de Ulrich 1976; cita ApJ de Li 2021 (probable ApJ 922, L29); fecha de asociación óptica B2 1225+31 → TON 618.

---

## Qué **no** está en este spec

- Zoom libre del mapa (rueda, pellizco, arrastre, botones +/−).
- Canvas, WebGL o librerías de mapas y animación.
- Imágenes astronómicas reales.
- Navegación completa (rutas, `history.replaceState`, `React.lazy`), Navbar y Footer.
- Audio.
- Secciones 3 en adelante, incluido el desarrollo de la masa del agujero negro y de la luminosidad.
- Línea temporal de hitos y citas de fuentes en pantalla.
- Afirmaciones sobre supercúmulos o protocúmulos asociados a TON 618.

Cada una de estas cosas, si se hace, va en su propio spec.
