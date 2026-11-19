# SPEC 02 — Exploración / Descubriendo a TON 618

**Estado:** Approved
**Depende de:** SPEC 01
**Fecha:** 2026-11-19
**Objetivo:** Implementar la sección Exploración como segunda escena de la web: un mapa espacial SVG con cuatro niveles de zoom guiados por scroll que, al acercarse desde el universo hasta TON 618, revela cinco tarjetas de contexto y una línea temporal de hitos.

Origen del contenido: `docs/ideas/02-exploration.md`. Datos verificados por el agente `cosmic-data-researcher`; diseño y motion por el agente `web-motion-designer`; la validación final de rendimiento la hace el agente `section-verifier` (Paso 10).

---

## Alcance

### Incluido

- Componente de sección `Exploration` (`<section id="exploration">`) con track sticky de 660svh, mapa de 4 niveles y tarjetas sincronizadas con el zoom.
- Mapa 100 % SVG + CSS (sin canvas, sin librerías, sin imágenes): capa persistente de estrellas y cuatro capas de nivel (`UniverseLayer`, `NeighborhoodLayer`, `SkyRegionLayer`, `TonLayer`).
- Cinco tarjetas (qué es un cuásar, dónde está, cuándo se descubrió, qué es TON 618, por qué es tan luminoso) repartidas en los cuatro niveles.
- Línea temporal de hitos en flujo normal, después del track y dentro de la misma sección.
- `LevelNav`: navegación por niveles (botones) como alternativa accesible al scroll, con indicador continuo de progreso.
- Zoom y tarjetas con `animation-timeline: view()` nativo, y fallback JS (`useTrackProgress`) que escribe `--progress`.
- Detección del nivel activo con IntersectionObserver, región `aria-live` y skip link a la línea temporal.
- Comportamiento completo con `prefers-reduced-motion: reduce` (contenido lineal, sin sticky ni zoom).
- Datos en `src/data/exploration.json` con interfaces en `src/interfaces/exploration.ts` y fuentes citadas.
- Continuidad con el Hero: la sección empieza con el color `$scene2Bg`, sin costura.
- Cambios mínimos en SPEC 01: `cta.targetSectionId` de `hero.json` pasa a `"exploration"` y se corrige la `note` del dato `mass` (ver «Modelo de datos»).
- Leyendas «Mapa esquemático, no a escala» y «ilustrativo» donde el dato no es real.

### Excluido (otros specs)

- Utilidad de navegación completa: `history.replaceState`, rutas por sección, `React.lazy` con `IntersectionObserver` (el componente se exporta de forma compatible con `lazy`).
- Zoom libre del mapa por el usuario (rueda, pellizco, arrastre) y controles +/−.
- Canvas, WebGL o librerías de mapas/animación.
- Imágenes astronómicas reales (NASA/ESA/NOIRLab); queda como posible mejora futura tras verificar licencias.
- Las secciones 3 en adelante (masa, disco de acreción, etc.). La tarjeta de luminosidad no repite la masa, que se desarrolla en una sección posterior.
- Navbar y Footer.
- Audio.
- Afirmar que TON 618 pertenece a un supercúmulo concreto (no está documentado).

---

## Modelo de datos

Archivos nuevos: `src/interfaces/exploration.ts` y `src/data/exploration.json`. Se reutilizan `Certainty`, `Source`, `Quantity` de `src/interfaces/common.ts`.

```ts
// src/interfaces/exploration.ts
import type { Certainty, Quantity, Source } from './common';

export type ExplorationLevelId = 'universe' | 'cosmic-neighborhood' | 'sky-region' | 'ton618';
export type QuestionId = 'what-is' | 'where' | 'when' | 'quasar' | 'luminosity';

export interface ExplorationScale {
  label: string; // «~93 mil millones de años luz (universo observable)»
  quantity?: Quantity;
  scaleNote?: string; // «ilustrativo, no a escala»
}

export interface ExplorationMarker {
  id: string;
  label: string;
  kind: 'self' | 'reference' | 'foreground';
  description: string; // texto alternativo
  illustrative: boolean; // true → rotular «ilustrativo»
}

export interface ExplorationLevel {
  id: ExplorationLevelId;
  order: number;
  title: string;
  scale: ExplorationScale;
  markers: ExplorationMarker[];
  mapSummary: string; // equivalente textual del SVG para lectores de pantalla
}

export interface ExplorationCard {
  id: QuestionId;
  levelId: ExplorationLevelId;
  order: number; // 4a y 4b comparten nivel
  kicker: string;
  question: string;
  answer: string; // ≤ 40 palabras y ≤ 220 caracteres
  facts: Quantity[];
  certainty: Certainty; // certeza dominante
  sources: string[]; // ids de Source
}

export interface TimelineEvent {
  id: string;
  order: number;
  date: string; // «1957»
  year: number;
  title: string;
  description: string;
  certainty: Certainty;
  sources: string[];
}

export interface ExplorationData {
  kicker: string;
  title: string; // h2 visualmente oculto
  mapLegend: string; // «Mapa esquemático, no a escala»
  skipLinkLabel: string;
  levels: ExplorationLevel[];
  cards: ExplorationCard[];
  timeline: TimelineEvent[];
  sources: Source[];
}
```

**Reparto de tarjetas por nivel** (el nivel 4 lleva dos tarjetas consecutivas):

| Nivel | Nombre              | Tarjeta                   |
| ----- | ------------------- | ------------------------- |
| 1     | Universo observable | ¿Qué es un cuásar?        |
| 2     | Vecindad cósmica    | ¿Dónde se encuentra?      |
| 3     | Región del cielo    | ¿Cuándo fue descubierto?  |
| 4a    | TON 618             | ¿Qué es TON 618?          |
| 4b    | TON 618             | ¿Por qué es tan luminoso? |

**Contenido verificado** (cifras y textos del investigador; la redacción final cabe en ≤ 40 palabras por tarjeta):

- **Ubicación:** constelación Canes Venatici (verificado con fronteras IAU; vértice más cercano a ~0,5°, cerca del límite con Coma Berenices). RA/Dec J2000: 187,10402° / +31,47712° (12h 28m 24,96s, +31° 28′ 37,6″). Latitud galáctica b ≈ +83,4°. Se muestra «z ≈ 2,22» (NED: 2,2218 ± 0,00006) sin cambiar el «z = 2,219» del kicker del Hero.
- **Distancia** (ΛCDM plano, derivada): tiempo de viaje de la luz ≈ 10,8 mil millones de años (rango 10,1–10,9), distancia comóvil ≈ 18 mil millones de años luz (17–18,3), distancia de luminosidad ≈ 59 mil millones de años luz. Se rotula que el universo se expandió mientras viajaba la luz.
- **Luminosidad** (`derived`, rango): del orden de 10⁴⁷–10⁴⁸ erg/s (10⁴⁰–10⁴¹ W), entre 6×10¹³ y 5×10¹⁴ veces el Sol, de ~10³ a ~10⁴ veces la Vía Láctea. Nunca un número único. Eficiencia de disco delgado ~6 % a ~30–40 % de mc² frente a ~0,7 % de la fusión estelar. Se dice «más que miles de galaxias como la nuestra», no «mil galaxias en un punto».
- **Masa:** se reutiliza `mass` de `hero.json` (40–66 mil M☉, `estimate`), con las mismas fuentes.
- **Nivel 2:** no hay supercúmulo documentado asociado. Se dibuja un entorno **ilustrativo** (cúmulos y filamentos genéricos), rotulado «ilustrativo, no a escala», sin afirmar pertenencia. Su entorno propio medido (nebulosa Lyα gigante y halo de gas molecular de ~100 kpc, Li et al. 2021) puede citarse; el «protocúmulo» es hipótesis y no se afirma.

**Línea temporal** (5 hitos, con cuatro correcciones respecto a la idea original):

| Fecha | Título                           | Hecho                                                                                                                           | Certeza    |
| ----- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1957  | Una débil estrella azul          | Iriarte y Chavira incluyen «Ton 618» en las listas de Tonantzintla como estrella azul débil. Aún no se la reconoce como cuásar. | `measured` |
| 1970  | Una radiofuente                  | Aparece como radiofuente B2 1225+31 en el catálogo de Bolonia (Colla et al.).                                                   | `measured` |
| 1976  | Un cuásar de luminosidad extrema | El espectro de Ulrich revela z ≈ 2,2 y confirma un cuásar de luminosidad intrínseca extrema.                                    | `measured` |
| 2004  | Un agujero negro colosal         | Shemmer et al. estiman ~66 mil millones de M☉ con la línea Hβ.                                                                  | `estimate` |
| 2021  | Gas molecular con ALMA           | Li et al. detectan una salida de gas molecular y un halo de ~100 kpc en la nebulosa Lyα gigante.                                | `measured` |

Correcciones a la idea original: 1957 no es un cuásar (es una estrella azul); 1970 es una radiofuente y la confirmación como cuásar es de 1976; se descarta la imagen de la Galaxia Remolino (licencia desconocida y, además, científicamente irrelevante: M51 está a ~23 millones de años luz); se añaden 2004 y 2021 como hitos modernos.

**Fuentes nuevas** (todas con `accessed: "2026-11-19"`; reutilizan `src-ned`, `src-shemmer-2004` y `src-ge-2019` de `hero.json`): `src-iriarte-1957`, `src-colla-1970` (ADS 1970A&AS....1..281C), `src-ulrich-1976` (ADS 1976ApJ...207L..73U), `src-schmidt-1963`, `src-li-2021` (arXiv:2111.06409), `src-esahubble-quasar` (https://esahubble.org/wordbank/quasar/), `src-nasa-hubble-quasars`.

**Cambios en `hero.json` (SPEC 01):**

- `cta.targetSectionId`: de `"section-2"` a `"exploration"`.
- `facts[mass].note`: se reescribe. La nota actual interpreta «2761 km/s» como anchura de línea; en la Tabla 2 de Ge et al. 2019 esa cifra es el desplazamiento al azul de C IV. Texto propuesto: «Dos estimaciones de la línea Hβ en la literatura (Shemmer 2004 y la compilación de Ge 2019) difieren por la calibración de la luminosidad y de la anchura de línea».

**Convenciones del mapa:**

- Cada nivel es un `div` con un `<svg viewBox="0 0 1000 1000">` dentro (no un `<g>` en un SVG único): las transformaciones CSS sobre hijos SVG no se componen en GPU de forma fiable.
- TON 618 siempre en (500, 500), centro de la capa y origen del zoom. Las etiquetas son HTML posicionadas con `left`/`top` en `%`, con tamaño en `rem` (≥ 12 px).
- Todo el SVG es decorativo (`aria-hidden`); el equivalente textual es `mapSummary`.

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional. Los pasos 2 (datos) y 3 en adelante (visual y motion) se ejecutan con los agentes indicados.

1. **Tokens y base.** Añadir en `_variables.scss`: `$explorationTravel: 560`, `$explorationTrack`, mapa de paradas `$explStops` (l1 0, l2 110, l3 240, l4 375, l4b 490), `$zoomOut: 2.5`, `$zoomIn: 0.4`, `$cardLife: 130`, `$cardFade: 30`, `$cardShift: 18px`, `$motionPulse: 3600ms`, `$amberText` (extraer el `color-mix` del kicker del Hero), `$mapSizeDesktop: min(100svh, 56vw)`, `$mapSizeMobile: min(100vw, 60svh)`, `$cardWidth: clamp(22rem, 28vw, 27rem)`, función `svhAt($x)` y mixin `exploRange($from, $to)` (solo helpers, sin salida CSS). Si la función de estrellas está dentro de `HeroScene.module.scss`, extraerla a un parcial sin salida CSS reutilizable.
2. **Datos (`cosmic-data-researcher`).** Crear `src/interfaces/exploration.ts` y `src/data/exploration.json` con el contenido de la sección anterior; aplicar los dos cambios de `hero.json`. Cerrar los datos marcados como «por verificar» (ver Riesgos) o dejarlos con su `certainty` real.
3. **Sección estática (`web-motion-designer`).** Crear `Exploration.tsx` y `Exploration.module.scss`: `<section id="exploration" aria-labelledby>` con `<h2>` oculto, `.track` (660svh), `.stage` sticky de 100svh, las 5 tarjetas como `<article>` con `<h3>`, párrafo oculto con `mapSummary`, leyenda del mapa y skip link. Montarla en `App.tsx` tras `Hero`. Todo el texto sale de `exploration.json`. Comprobar si `visually-hidden` de Bootstrap está importado en `_bootstrap-custom.scss` y añadirlo si falta.
4. **Capas del mapa.** Crear `MapLayers.tsx` y `MapLayers.module.scss` con las cuatro capas SVG (`memo`) y la capa persistente de estrellas (~120 por `box-shadow` generado en SCSS), según «Referencia de diseño». Presupuesto: ≤ 120 nodos SVG y ≤ 80 de HTML. Capas apiladas en el stage con `position: absolute`.
5. **Zoom y tarjetas con scroll nativo.** Aplicar `view-timeline: --explorationTrack block` en `.track` y `animation-timeline: --explorationTrack` en los descendientes, según la tabla de la sección «Referencia de diseño». Zoom con keyframes lineales de 4 tramos (`$zoomOut`, `$zoomIn`), tarjetas con un único keyframe `cardLife`. Solo `transform`/`opacity`.
6. **Fallback de scroll.** Crear `useTrackProgress.ts`: escribe `--progress` (0–1 sobre el recorrido de 560svh) en la sección, solo si `CSS.supports('animation-timeline', 'view()')` es falso, cacheando top y altura del track en `resize` e IntersectionObserver y escuchando `scroll` solo con `data-inview`. El CSS dentro de `@supports not (animation-timeline: view())` recalcula zoom y tarjetas con `pow()`, `clamp()` y `calc()`.
7. **Nivel activo y navegación.** Crear `useExplorationLevel.ts` (IntersectionObserver sobre 4 sentinelas del track, `rootMargin: '-50% 0px -50% 0px'`; expone `level` y `goTo(level)`; escribe `data-level` en la sección y `data-active`/`data-near` en cada nivel) y `LevelNav.tsx` con su `.module.scss`: `<nav aria-label="Niveles de zoom del mapa">` con 4 botones, `aria-current="step"`, área táctil ≥ 44 px e indicador continuo de progreso. Región `role="status"` con `aria-live="polite"` (retardo de 400 ms). `goTo` hace `scrollIntoView` sobre anclas ocultas (x = 40, 175, 305, 435 svh). Si conviene, extraer a `src/utils/scrollTo.ts` el scroll suave o instantáneo según reduced-motion y reutilizarlo en el CTA del Hero.
8. **Marcadores y `will-change`.** Marcadores animados (anillos pulsantes de destino, línea Tierra→TON con `scale`, «Estás aquí»), `will-change` solo en la capa activa y su vecina (`data-near`), y pausa de animaciones fuera de vista con `useInView` (añadir el parámetro opcional `once`).
9. **Línea temporal y reduced-motion.** Crear `ExplorationTimeline.tsx` y su `.module.scss`: `<ol>` con `<time datetime>`, horizontal desde 40 rem de contenedor y vertical por debajo, entrada con `useInView` (`once`), `content-visibility: auto`. Con `prefers-reduced-motion: reduce`: `.track` con `height: auto`, sin sticky, zoom ni pulso; los 4 niveles se apilan como bloques de lectura; `LevelNav` oculto.
10. **Verificación con `section-verifier`.** Ejecutar el agente `section-verifier` sobre la sección completa (rendimiento, accesibilidad, responsive, animaciones y robustez, con la medición en navegador que corresponda) y comprobar los criterios de aceptación. Registrar en el spec los resultados y los pendientes, como en la SPEC 01, y aplicar los arreglos que el agente proponga.

---

## Referencia de diseño

### Estructura y continuidad

- **Orden de lectura:** `<section id="exploration">` contiene el `.track` (con el `.stage` sticky) y, a continuación, la línea temporal en flujo normal.
- **Continuidad con el Hero:** el borde superior de la sección es `$scene2Bg` liso (mismo color que el overlay final del Hero). La capa de estrellas hace fade-in de 0 a 1 entre `cover 0` y `cover 100svh`, antes de que el sticky se pegue. Un scrim inferior `linear-gradient(to top, $scene2Bg, transparent 20%)` enlaza con la línea temporal.
- **Timeline nativo:** `view-timeline: --explorationTrack block` en `.track`. El sticky empieza en `cover 100svh` y termina en `cover 660svh`. No se usa `scroll(root)` para no depender de la altura de lo que haya encima.

### Capas del mapa por nivel

| Nivel | Se dibuja                                                                                                                                                                                                                                                                | Marcadores                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| L1    | Telaraña cósmica (1 `<path>`, ~6 filamentos, Starlight 10 %), galaxias en 3 `<path>` de puntos (140/60/20), 3 anillos discontinuos centrados en la Tierra a +4 mil millones de años de luz cada uno. Leyenda: «Cada anillo: +4 mil millones de años de viaje de la luz». | «Estás aquí» en (250, 690); línea Tierra→TON (HTML, `--len: 314`, −37°) que se dibuja con `scale` 0→1.       |
| L2    | 5 cúmulos con `radialGradient` estático (sin blur), filamentos convergentes y ~80 galaxias en 2 `<path>`. Rotulado «ilustrativo».                                                                                                                                        | «Estás aquí» pasa a indicador en el borde inferior izquierdo (↙ «Vía Láctea»); halo de ~120 u en el destino. |
| L3    | Carta celeste circular (r = 430 u), retícula RA/Dec (6 `<path>`), ~40 estrellas, texto «Canes Venatici» con Cor Caroli y Chara, subtítulo «Esquemático». El círculo entrante crece de 0,4 a 1.                                                                           | «Observas desde la Tierra» abajo.                                                                            |
| L4    | Halo ámbar (#B96F37), disco elíptico (rx 300, ry 80, −12°) con degradado, círculo negro r = 92 y anillo de fotones. Placeholder SVG hasta tener los assets del Hero (puede reutilizar `ton618-blackhole-1024` sin archivos nuevos).                                      | Etiqueta «TON 618» con línea guía; el anillo pulsante se desvanece.                                          |

**Capa persistente de estrellas:** ~120 por `box-shadow` generado en compilación, detrás de las cuatro capas; escala suave de 1 a 1,15 en todo el recorrido.

### Zoom y cruce de niveles

- Capa saliente: scale 1→2,5 (`$zoomOut`; stops 1 → 1,26 → 1,58 → 1,99 → 2,5). Capa entrante: 0,4→1 (`$zoomIn`; 0,4 → 0,5 → 0,63 → 0,80 → 1). Cada transición equivale a ~6,25× de zoom.
- Sin parpadeo: la entrante va encima y sube de opacidad 0→1 entre el 20 % y el 60 % de la transición; la saliente mantiene 1 hasta el 60 % y baja a 0 hasta el 100 %, ya tapada. Nunca hay dos capas semitransparentes a la vez.
- Solo `transform` (`translate`, `scale`) y `opacity`. Sin `filter`, `backdrop-filter` ni `mix-blend-mode`.

### Tabla scroll → progreso

Track = 660svh (100 de viewport + 560 de recorrido); `x` en svh de recorrido desde el inicio del sticky (`p = x / 560`).

| Evento                                  | x (svh)               | p                     |
| --------------------------------------- | --------------------- | --------------------- |
| Entrada: stage entra, estrellas fade-in | −100 → 0              | —                     |
| Tarjeta 1: entra / sale                 | −30 → 0 / 80 → 110    | — / 0,14–0,20         |
| Zoom L1→L2                              | 80 → 140              | 0,14–0,25             |
| Tarjeta 2: entra / sale                 | 110 → 140 / 210 → 240 | —                     |
| Zoom L2→L3                              | 210 → 270             | 0,38–0,48             |
| Tarjeta 3: entra / sale                 | 240 → 270 / 340 → 370 | —                     |
| Zoom L3→L4                              | 340 → 410             | 0,61–0,73             |
| Tarjeta 4a: entra / sale                | 370 → 400 / 470 → 500 | —                     |
| Tarjeta 4b: entra                       | 490 → 520             | 0,88–0,93             |
| Aproximación al agujero negro (L4)      | 400 → 560             | scale 1→1,25 `linear` |
| Hold final y liberación del stage       | 520 → 560             | 1                     |

Cambio de nivel activo: L2 en x = 110, L3 en x = 240, L4 en x = 375. Keyframe `cardLife` (4 stops): 0 % opacity 0 y translate 0 18px; 23 % opacity 1; 77 % opacity 1; 100 % opacity 0 y translate 0 −18px (rango ~130svh por tarjeta).

### Layout

- **Desktop (≥ 992 px, y móvil apaisado con `max-height: $shortHeight`):** mapa a la izquierda centrado en (34vw, 50svh); tarjeta a la derecha (ancho `$cardWidth`, margen derecho `max(4vw, 3rem)`, centrada en vertical); rail de niveles vertical en el borde izquierdo. Tarjeta: fondo `rgba($cosmicBlue, 0.82)` sin `backdrop-filter`, borde 1 px Starlight 14 % y borde izquierdo ámbar de 2 px, radio 0,75 rem, padding 1,75 rem. Kicker 0,75 rem en `$amberText`; pregunta `clamp(1.5rem, 2.2vw, 2rem)` peso 300; cuerpo 1 rem / 1,6, máx. 44ch, ≤ 220 caracteres.
- **Móvil y tablet (< 992 px):** mapa `min(100vw, 60svh)` con centro a 34svh del borde superior; tarjeta abajo (`calc(100% - 2rem)`, máx. 34 rem, `bottom: max(1rem, env(safe-area-inset-bottom))`, ~28–33svh); `LevelNav` en fila horizontal arriba con 4 segmentos de 44 px de alto táctil. Leyenda «Mapa esquemático, no a escala» al pie (0,75 rem, Starlight 70 %).
- **Línea temporal:** contenedor con `container-type: inline-size`; horizontal desde 40 rem con línea de 1 px y nodos ámbar de 14 px; vertical por debajo. Año `clamp(2.5rem, 5vw, 4.5rem)` peso 300, `tabular-nums`, `$amberText`. La línea hace `scale` 0→1 en 1200 ms (`$easeOutExpo`) y los ítems hacen fade-up con 150 ms de desfase.

### Contraste

Starlight sobre Cosmic Blue ≈ 14:1; cuerpo al 82 % ≥ 9:1; kicker con `color-mix` ámbar ≥ 4,5:1. Etiquetas del mapa Starlight ≥ 70 % sobre `$spaceVoid`; ningún texto por debajo de 0,72 de opacidad. El ámbar puro queda para trazos, halos, bordes y números grandes.

### Accesibilidad

- Las 5 respuestas están siempre en el DOM y en orden de lectura (con opacidad 0 siguen expuestas); las tarjetas llevan `pointer-events: none`.
- `LevelNav`: `aria-label="Nivel N de 4: nombre"`, `aria-current="step"` en el activo, `:focus-visible` de 2 px Starlight. Sin atajos propios: PageUp, PageDown y flechas siguen siendo scroll nativo.
- Skip link «Ir a la línea de tiempo», visible al recibir foco.

### Presupuesto

| Concepto                          | Límite                             |
| --------------------------------- | ---------------------------------- |
| Assets nuevos (imágenes, fuentes) | 0                                  |
| JS del chunk de Exploración       | ≤ 12 KB gz                         |
| CSS de los módulos de Exploración | ≤ 8 KB gz                          |
| `exploration.json`                | ≤ 4 KB                             |
| Nodos SVG / HTML                  | ≤ 120 / ≤ 80                       |
| Capas compuestas a la vez         | ≤ 3                                |
| Trabajo por frame al hacer scroll | solo composite (0 Layout, 0 Paint) |
| Lighthouse móvil                  | Performance ≥ 90, CLS 0            |

---

## Criterios de aceptación

**Contenido y estructura**

- [ ] `<section id="exploration">` existe, se monta tras `Hero` en `App.tsx` y tiene `aria-labelledby`; hay un `<h2>` (oculto) y un `<h3>` por tarjeta, sin ningún `<h1>` nuevo.
- [ ] Pulsar el CTA del Hero hace scroll hasta `#exploration` (`hero.json` tiene `targetSectionId: "exploration"`).
- [ ] Todos los textos visibles salen de `exploration.json`; ninguno está escrito directamente en el TSX.
- [ ] Las 5 tarjetas aparecen en el orden quasar → dónde → cuándo → qué es → luminosidad, una por nivel salvo el nivel 4 (dos).
- [ ] Cada tarjeta tiene ≤ 40 palabras y ≤ 220 caracteres, certeza y al menos una fuente existente en `sources`.
- [ ] La línea temporal muestra 1957, 1970, 1976, 2004 y 2021; 1957 se describe como estrella azul débil y 1970 como radiofuente (no como cuásar).
- [ ] El mapa muestra «Mapa esquemático, no a escala»; los niveles 2 y 3 llevan «ilustrativo»/«esquemático»; ningún texto afirma pertenencia de TON 618 a un supercúmulo.
- [ ] La `note` de `mass` en `hero.json` ya no menciona «2761 km/s» como anchura de línea.
- [ ] No hay scroll horizontal entre 320 y 2560 px de ancho.
- [ ] Ni el texto ni las tarjetas tapan el marcador de TON 618 en 320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900 y 1920×1080.
- [ ] No hay archivos `.scss` sueltos (solo `.module.scss`), ni `!important`, ni `style={{}}` salvo valores dinámicos; las clases están en camelCase.
- [ ] `npm run build` termina sin errores de TypeScript ni de lint.
- [ ] El borde superior de la sección es `$scene2Bg` y no hay costura de color visible respecto al final del Hero.

**Zoom y scroll**

- [ ] En `scrollY` al inicio del sticky se ve el nivel 1; al final del recorrido (x = 560svh) se ve TON 618 con la tarjeta 4b completa.
- [ ] Durante cada cruce de niveles nunca hay dos capas con `opacity` intermedia a la vez (comprobado en `getComputedStyle` o grabación frame a frame).
- [ ] El nivel activo cambia en x = 110, 240 y 375 svh (±10 svh) y se refleja en `data-level`, `aria-current` y la región `aria-live`.
- [ ] En un navegador sin `animation-timeline` el efecto funciona vía `--progress` y la consola no muestra errores.
- [ ] Los botones de `LevelNav` llevan al nivel correspondiente con `scrollIntoView` y se activan con Enter y Espacio.
- [ ] Solo se animan `transform` y `opacity`; no hay `filter`, `backdrop-filter` ni `mix-blend-mode`.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [ ] Lighthouse móvil: Performance ≥ 90, CLS = 0.
- [ ] Durante el scroll de la sección la traza de Chromium muestra 0 Layout y 0 Paint tras calentar (solo composite).
- [ ] ≥ 95 % de los frames por debajo de 20 ms durante el scroll del track (en un dispositivo real si el entorno no tiene GPU).
- [ ] Con `data-inview="false"`, `document.getAnimations()` filtrado por la sección devuelve 0 animaciones en ejecución.
- [ ] React Profiler muestra ≤ 5 renders durante el recorrido completo del track y 0 en las capas del mapa (`memo`).
- [ ] No hay assets nuevos; el JS de la sección ≤ 12 KB gz y el CSS ≤ 8 KB gz.
- [ ] `will-change` solo está aplicado en la capa activa y su vecina.

**Accesibilidad**

- [ ] axe/Lighthouse: 0 violaciones de contraste; todo texto ≥ 4,5:1.
- [ ] Las capas del mapa están `aria-hidden` y cada nivel tiene su `mapSummary` accesible.
- [ ] Todo se alcanza con Tab (botones de nivel, skip link), con `:focus-visible` visible y áreas táctiles ≥ 44 px.
- [ ] Las 5 respuestas son legibles por lectores de pantalla aunque su opacidad sea 0.
- [ ] Con `prefers-reduced-motion: reduce` emulado: `document.getAnimations()` de la sección devuelve 0, `.track` no es sticky, los 4 niveles se apilan en lectura lineal y `LevelNav` está oculto.
- [ ] Ningún destello supera 1 evento cada ~2 s (el pulso de destino dura 3600 ms con desfase de 1800 ms: ≤ 0,55 destellos/s).

**Verificación final**

- [ ] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz y arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Zoom guiado por scroll con botones de nivel.** Coherente con CLAUDE.md (navegación por scroll) y con el patrón sticky del Hero; los botones dan una alternativa accesible.
- **SVG + CSS puro.** Sin canvas ni librerías, solo `transform`/`opacity`, con fallback JS como en el Hero. Suficiente para 4 niveles esquemáticos.
- **Preguntas sincronizadas con el zoom.** Cada nivel revela su tarjeta; la línea temporal va al final. Se reordenaron las 5 preguntas respecto a la lista de la idea (qué es → dónde → cuándo → cuásar → luminosidad) para seguir la lógica del zoom: el concepto de cuásar cabe en el universo, la ubicación en la vecindad, el descubrimiento en el cielo y las dos últimas ya con TON 618 al frente.
- **Id `exploration` y cambio en `hero.json`.** Cierra el riesgo abierto de la SPEC 01 (`section-2` era provisional).
- **Línea temporal fuera del sticky.** Evita alargar el scroll fijado y funciona mejor en móvil.
- **`view-timeline` sobre `.track` en vez de `scroll(root)`.** No depende de la altura de lo que haya encima del track.
- **Cada nivel es un `div` con su `<svg>`.** El zoom compone en GPU; las transformaciones CSS sobre `<g>` repintan.
- **Etiquetas en HTML, no en SVG.** Permite `rem` reales (≥ 12 px) en móvil, donde las unidades de `viewBox` darían ~4 px.
- **Nivel 2 ilustrativo.** No hay estructura a gran escala documentada para TON 618; inventarla sería una afirmación falsa. Se rotula como ilustrativo.
- **Línea temporal de 5 hitos corregida.** Se separan 1970 (radiofuente) y 1976 (cuásar) y se añaden 2004 y 2021 para que la línea no quede escasa con solo dos entradas. 2019 (Ge et al.) queda cubierto por el rango de masa de la tarjeta.
- **Pasos 2 y 3–9 con los agentes pedidos.** `cosmic-data-researcher` para datos, `web-motion-designer` para diseño y `section-verifier` al final.
- **Track de 660svh con token `$explorationTravel`.** El recorrido puede acortarse cambiando un valor.

**Descartadas**

- **Zoom libre (rueda, pellizco, arrastre).** Choca con el scroll nativo en móvil y es mucho más complejo.
- **Canvas 2D.** Requiere bucle rAF y gestión de DPR, y es menos accesible.
- **Imágenes astronómicas reales.** Licencias por verificar y peso adicional; la imagen de la idea original (Whirlpool) se descarta por licencia desconocida y por irrelevancia científica.
- **`stroke-dashoffset` en SVG para la línea Tierra→TON.** Repinta en cada frame; se usa una línea HTML con `scale`.
- **`filter: blur`, `backdrop-filter` y `mix-blend-mode`.** Coste alto en móviles de gama media.
- **Roving tabindex y atajos de teclado propios.** PageUp, PageDown y flechas ya son scroll nativo.

---

## Riesgos identificados

- **Exactitud científica.** Quedan por verificar antes de publicar: fila exacta de TON 618 en el PDF de Shemmer 2004 (la cifra de 66 mil M☉ es consistente con la tabla pero no se aisló sin duda); abstract de Ulrich 1976; cita ApJ de Li 2021 (probable ApJ 922, L29); fecha de asociación óptica B2 1225+31 → TON 618; volumen/número del Boletín de Tonantzintla; cita de la línea de visión hacia el Gran Muro CfA2 (no se muestra en este spec). La luminosidad se muestra siempre como rango.
- **Mapa esquemático.** Los niveles 1–3 no son a escala ni astrométricos (posición de TON en L1 por tiempo de viaje de la luz; Cor Caroli y Chara «esquemático»). Las leyendas lo dicen explícitamente; revisar que no induzcan a error.
- **Borrosidad y memoria raster al escalar capas.** Con zoom 2,5× y un mapa de ~806 px, la capa saliente ronda 2000 px por lado (~16 MB; ~32 MB con dos capas). Verificar en el panel Layers y en un móvil real; si es excesivo, bajar `$zoomOut` a 2 y `$zoomIn` a 0,5.
- **`animation-range` con `cover` y `calc()` de longitudes.** Verificar en Chrome, Safari y Firefox; el fallback con `--progress` cubre el efecto completo. La prueba en un Firefox real sigue pendiente, como en la SPEC 01.
- **Hand-off con el Hero.** Si `$scene2Bg` deja de ser `$spaceVoid`, hay que revisar la costura entre el overlay del Hero y el borde superior de la sección.
- **Fatiga de scroll.** 660svh son unos 5–6 gestos en móvil. Mitigado con los botones de nivel, el skip link y el token `$explorationTravel`.
- **Lectura rápida.** Con scroll muy rápido el usuario puede saltarse tarjetas; todo el contenido sigue en el DOM y en la versión reduced-motion.
- **IntersectionObserver asíncrono.** El indicador de nivel puede ir un frame por detrás del scroll; es aceptable.
- **Rendimiento en móviles de gama media.** La SPEC 01 ya mostró un margen estrecho sin GPU (~30 fps). Presupuesto de nodos y capas acotado; confirmar en dispositivo real con `section-verifier`.
- **Acoplamiento futuro con la navegación.** La sección ocupa 660svh + línea temporal; el `rootMargin` del `IntersectionObserver` del spec de navegación debe tenerlo en cuenta.

---

## Qué **no** está en este spec

- Zoom libre del mapa (rueda, pellizco, arrastre, botones +/−).
- Canvas, WebGL o librerías de mapas y animación.
- Imágenes astronómicas reales o assets multimedia nuevos.
- Navegación completa (rutas, `history.replaceState`, `React.lazy`), Navbar y Footer.
- Audio.
- Secciones 3 en adelante, incluido el desarrollo de la masa del agujero negro.
- Afirmaciones sobre supercúmulos o protocúmulos asociados a TON 618.

Cada una de estas cosas, si se hace, va en su propio spec.
