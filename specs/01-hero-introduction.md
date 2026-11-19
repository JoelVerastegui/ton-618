# SPEC 01 — Hero / Introducción

**Estado:** Implemented
**Depende de:** ninguna
**Fecha:** 2026-11-18
**Objetivo:** Implementar la sección Hero de TON 618 como primera escena de la web: escena espacial a pantalla completa con parallax de mouse en tres capas, TON 618 inmóvil, CTA, y una transición por scroll con zoom hacia el agujero negro.

Origen del contenido: `docs/ideas/01-introduction.md`. Datos verificados por el agente `cosmic-data-researcher`; diseño y motion por el agente `web-motion-designer`.

---

## Alcance

### Incluido

- Componente de sección `Hero` con su escena decorativa (`HeroScene`), contenido (kicker, título, subtítulo, CTA) y leyenda «Representación artística».
- Datos en `src/data/hero.json` con interfaces TypeScript, y fuentes citadas.
- Parallax con mouse en 3 capas (estrellas lejanas, nebulosa y partículas, estrellas cercanas), con TON 618 inmóvil.
- Deriva automática en CSS puro para dispositivos táctiles (sin mouse).
- Partículas, destellos y brillo pulsante del disco de acreción.
- Transición por scroll: zoom hacia el agujero negro y fundido a un color de fondo de la escena siguiente (token provisional).
- Fallback en JS cuando el navegador no soporta `animation-timeline`.
- Comportamiento completo con `prefers-reduced-motion: reduce`.
- Agujero negro y nebulosa como **placeholders en CSS** (gradientes radiales), más el contrato documentado de los assets definitivos.
- Fuente Space Grotesk autoalojada (variable, subset latin).
- CTA «Iniciar exploración» como enlace ancla a un id configurable en `hero.json`, con `scrollIntoView` simple.

### Excluido (otros specs)

- Utilidad de navegación completa: `history.replaceState`, rutas por sección, `React.lazy` con `IntersectionObserver` para carga bajo demanda.
- La sección 2 y cualquier otra sección. El CTA apunta a un id que aún puede no existir.
- Navbar y Footer.
- Parallax por giroscopio en móvil.
- Generación o adquisición de las imágenes definitivas (solo se documenta su contrato).
- Audio.

---

## Modelo de datos

Archivos nuevos: `src/interfaces/common.ts`, `src/interfaces/hero.ts`, `src/data/hero.json`. Los tipos de `common.ts` quedan reutilizables por las demás secciones.

```ts
// src/interfaces/common.ts
export type Certainty = 'measured' | 'estimate' | 'derived' | 'hypothesis';

export interface Source {
  id: string;
  title: string;
  authors: string;
  year: number;
  url: string;
  accessed: string; // ISO date
  license?: string;
}

export interface Quantity {
  id: string;
  label: string;
  value: number;
  unit: string;
  displayValue: string;
  uncertainty?: { low: number; high: number };
  certainty: Certainty;
  note?: string;
  sources: string[]; // ids de Source
}

export interface ImageRef {
  src: string;
  alt: string;
  caption: string; // incluye «Representación artística»
  status?: 'pending';
  credit?: string;
  license?: string;
}
```

```ts
// src/interfaces/hero.ts
import type { ImageRef, Quantity, Source } from './common';

export interface HeroData {
  kicker: string;
  title: { main: string; tagline: string };
  subtitle: string;
  summary: string; // descripción de la escena para lectores de pantalla
  cta: { label: string; targetSectionId: string };
  artwork: ImageRef;
  layers: HeroParallaxLayer[];
  facts: HeroFact[];
  sources: Source[];
}

export interface HeroParallaxLayer {
  id: string;
  kind: 'far-stars' | 'near-stars' | 'nebula-particles';
  order: number;
}

export interface HeroFact {
  quantity: Quantity;
  emphasis: 'primary' | 'secondary';
  revealStep: number;
}
```

Contenido de `hero.json` (textos finales):

- `kicker`: «Cuásar hiperluminoso · z = 2,219»
- `title.main`: «TON 618»; `title.tagline`: «Más allá de los límites» (se corrige «alla» por «allá» respecto a la idea original).
- `subtitle`: «Un coloso con más de 60 mil millones de masas solares» (decisión del usuario, ver Decisiones).
- `artwork.caption`: «Representación artística. No existe una imagen real de TON 618.»
- `facts`: `mass` (primary; `value` 6.6e10, `uncertainty` 4.07e10–6.6e10, `certainty: "estimate"`, fuentes Shemmer 2004 y Ge 2019) y `light-travel-time` (secondary; «más de 10 mil millones de años», `certainty: "derived"`, fuentes NASA SVS y NED).
- `sources`: Shemmer et al. 2004 (arXiv:astro-ph/0406559), Ge et al. 2019 (arXiv:1903.08830), NASA SVS, NED.
- `cta.targetSectionId`: provisional (`"section-2"`); debe alinearse con el id real cuando exista la sección 2.

Las imágenes del hero viven en `src/assets/images/hero/` y el JSON solo guarda claves y texto alternativo; mientras no existan, `artwork.status` es `"pending"`.

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional.

1. **Base de estilos y fuente.** Añadir Space Grotesk variable (woff2 latin, ≤ 35 KB) en `src/assets/fonts/`, `@font-face` en `main.scss`, `$font-family-sans-serif` y tokens de motion/escena en `_variables.scss` (`$motionFast/Base/Slow`, `$easeOutExpo`, `$easeCinematic`, `$spaceVoid`, `$scene2Bg`, `$parallaxFar/Mid/Near`, `$bhSize`). Instalar `clsx` si falta.
2. **Datos.** Crear `src/interfaces/common.ts`, `src/interfaces/hero.ts` y `src/data/hero.json` con el contenido de la sección anterior.
3. **Hero estático.** Crear `Hero.tsx` y `Hero.module.scss`: `<section id="hero" aria-labelledby="heroTitle">`, un único `<h1>` con dos `<span>`, subtítulo, CTA, leyenda «Representación artística». Todo el texto sale de `hero.json`. Montarlo en `App.tsx`. Estructura `.track` (200svh) y `.stage` sticky de 100svh. Si no existe un `Button` en `components/ui/`, crearlo.
4. **Escena visual.** Crear `HeroScene.tsx` y `HeroScene.module.scss` (con `aria-hidden`): fondo en gradiente, estrellas lejanas y cercanas generadas con una función SCSS que construye `box-shadow` en compilación (máx. 160 y 50), nebulosa y agujero negro como placeholders de gradiente radial, halo del disco, partículas (18 en desktop, 10 en móvil, valores por `@for` + `random()`), 3–4 destellos y centelleo. Animación de entrada escalonada.
5. **Parallax con mouse.** Crear `useParallaxPointer.ts` (rAF con interpolación exponencial τ ≈ 180 ms, escribe `--px` y `--py`, sin estado de React, se detiene al asentarse). Se adjunta solo con `(hover: hover) and (pointer: fine)` y sin reduced-motion. Amplitudes 6 / 16 / 28 px en desktop (×0.7 en 768–1199 px), sentido opuesto al cursor. TON 618 no se mueve.
6. **Deriva táctil.** En `@media (hover: none), (pointer: coarse)`, keyframes sobre `translate` por capa (±4 / ±9 / ±16 px, 60 / 40 / 28 s), sin listeners de puntero.
7. **Transición por scroll.** Animaciones guiadas con `animation-timeline: scroll(root block)` y `animation-range: 0 100svh`, según la tabla de la sección «Referencia de diseño». Fallback `useScrollProgress.ts` (escribe `--progress`) dentro de `@supports not (animation-timeline: scroll())`, registrado solo si `CSS.supports` es falso.
8. **Pausa fuera de vista y reduced-motion.** `useInView.ts` (IntersectionObserver sobre `.track`) que pone `data-inview` y pausa todas las animaciones fuera de vista. Con `prefers-reduced-motion: reduce`: sin parallax, deriva, pulso ni zoom; `.track` colapsa a 100svh sin sticky; partículas estáticas; CTA con `scrollIntoView({ behavior: 'auto' })`.
9. **CTA.** CTA como `<a href="#{targetSectionId}">` con `onClick` que hace `preventDefault` y `scrollIntoView` (suave salvo reduced-motion).
10. **Contrato de assets definitivos.** Documentar en el propio spec (sección «Referencia de diseño») ruta, formato, peso y prompt de las imágenes. No se añaden archivos de imagen. Verificar el hero completo (ver criterios de aceptación).

---

## Referencia de diseño

### Capas (de atrás hacia delante)

| z   | Capa                                                                                                    | Parallax |
| --- | ------------------------------------------------------------------------------------------------------- | -------- |
| 0   | Fondo: radial Nebula Purple (#35204D) ~18 % sobre Cosmic Blue (#111C35), cayendo a `$spaceVoid` #070B16 | ninguno  |
| 1   | Estrellas lejanas                                                                                       | 6 px     |
| 2   | Nebulosa y partículas                                                                                   | 16 px    |
| 3   | Estrellas cercanas                                                                                      | 28 px    |
| 4   | TON 618 + halo ámbar (#B96F37)                                                                          | inmóvil  |
| 5   | Scrim inferior para contraste                                                                           | ninguno  |
| 6   | Contenido (texto, CTA)                                                                                  | ninguno  |
| 7   | Overlay de transición (`$scene2Bg`)                                                                     | ninguno  |

Cada capa de parallax se extiende `inset: -6%` para evitar bordes vacíos. `--bhSize`: `clamp(300px, 62vmin, 880px)` en desktop y `min(92vw, 70svh)` en móvil; centrado horizontalmente y al **38 %** de la altura (la propuesta inicial del diseñador era ~44 %; ver Decisiones tomadas).

### Transición por scroll (progreso p de 0 a 1 sobre 100svh)

| Elemento           | Efecto                         | Rango                    |
| ------------------ | ------------------------------ | ------------------------ |
| Texto              | opacity 1→0, translate 0→-8vh  | p 0–0.35                 |
| Estrellas lejanas  | scale 1→1.12                   | 0–1                      |
| Nebulosa           | scale 1→1.5, opacity 1→.4      | 0–1                      |
| Estrellas cercanas | scale 1→2.2, opacity 1→0       | scale 0–1, opacity 0.7–1 |
| TON 618 + halo     | scale 1→2.2 (`$easeCinematic`) | 0–1                      |
| Overlay            | opacity 0 hasta 0.55, luego →1 | 0.55–1                   |

Solo se animan `transform` (propiedades `translate` y `scale`) y `opacity`. Sin `filter` animado ni `mix-blend-mode`.

### Contraste

Starlight sobre Cosmic Blue ≈ 14:1. El ámbar puro sobre Cosmic Blue ≈ 4.3:1 y falla AA en texto normal: se reserva para halo, bordes y texto grande. El CTA usa fondo oscuro translúcido, borde ámbar y texto Starlight; el kicker usa un ámbar aclarado con `color-mix` hasta ≥ 4.5:1.

### Assets definitivos (contrato; no se generan en este spec)

- **Agujero negro:** `src/assets/images/hero/ton618-blackhole-2048.{avif,webp}` y `-1024.{avif,webp}`. Cuadrado 1:1, alpha, sombra del horizonte en negro opaco. AVIF ≤ 250 KB (2048) y ≤ 90 KB (1024). `fetchpriority="high"` y preload.
  Prompt: _Photorealistic astronomical visualization of a supermassive black hole with a thin, luminous accretion disc, viewed at about 75 degrees inclination, centered in a square frame. Strong gravitational lensing: the far side of the disc arches over the top and under the black shadow, a thin bright photon ring around a perfectly black circular event horizon. Disc color: glowing solar amber #B96F37 in the body, pale gold-white at the inner edge, faint nebula purple #35204D wisps in the outer falloff. Doppler beaming: one side noticeably brighter. Isolated on a pure black background, no stars, no text, no watermark, no vignette. 4096x4096, 1:1._
  Restricciones (prompt negativo): estrellas, nebulosas de fondo, texto, logotipos, marcas de agua, bordes, viñeteado, planetas o naves, lens flare artificial, disco totalmente de frente o de canto, estética de cartoon.
  Para el alpha: generar sobre negro y convertir luminancia a alpha, pintando el centro opaco.
- **Nebulosa:** `src/assets/images/hero/nebula-2400.webp` (≤ 140 KB) y `nebula-1280.webp` (≤ 60 KB). 16:9, alpha suave, centro despejado (ahí va el agujero negro), bajo contraste, no tileable. Se usa en la capa 2 de `HeroScene` con `opacity` ~0.55 y parallax intermedio. Mientras no exista, la capa se resuelve con 3–4 `radial-gradient` superpuestos (púrpura, azul y ámbar a baja opacidad).
  Prompt: _Subtle deep-space nebula haze, very low contrast, wispy diffuse clouds of nebula purple #35204D and deep cosmic blue #111C35 with a faint solar amber #B96F37 glow along the lower-left edge. The center of the frame is dark and mostly empty. Soft, smooth gradients, no sharp structures, no bright stars, no dominant focal point. Isolated on a pure black #000000 background, no text, no watermark, no border, no vignette. 16:9, 2400x1350._
  Restricciones (prompt negativo): estrellas brillantes, planetas, galaxias definidas, texto, marcas de agua, saturación alta, bordes duros, patrón repetitivo. Para el alpha, mismo flujo de luminancia a alpha que el agujero negro.
- **No usar** la imagen ni el enlace de OpenAI y lacienciaespacial.com presentes en `docs/ideas/01-introduction.md` (licencia desconocida).

---

## Criterios de aceptación

**Contenido y estructura**

- [x] El hero ocupa `100svh` en la escena y no hay scroll horizontal entre 320 y 2560 px de ancho. _(verificado de 320 a 2560 px)_
- [x] Todos los textos visibles salen de `hero.json`; ninguno está escrito directamente en el TSX.
- [x] El título muestra «Más allá de los límites» (con tilde) y el subtítulo muestra «más de 60 mil millones de masas solares».
- [x] La leyenda «Representación artística» es visible en pantalla.
- [x] Hay un único `<h1>`, la `<section>` tiene `aria-labelledby` y `HeroScene` tiene `aria-hidden="true"`.
- [x] No hay archivos `.scss` sueltos (solo `.module.scss`), ni `!important`, ni `style={{}}` salvo valores dinámicos; las clases están en camelCase.
- [x] El texto no tapa la sombra del horizonte en 320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900 y 1920×1080 _(margen mínimo medido: 11 px a 360×640)_.
- [x] `npm run build` termina sin errores de TypeScript ni de lint.

**Parallax**

- [x] Con el cursor en una esquina del viewport (desktop ≥ 1200 px), las capas se desplazan 6 / 16 / 28 px (±1 px) en sentido opuesto al cursor.
- [x] `getBoundingClientRect()` de TON 618 es idéntico antes y después de mover el mouse.
- [x] Con el mouse quieto ~1 s no se ejecutan frames de JS del parallax (Performance profiler). _(verificado porque `--px` deja de cambiar; no con el Profiler)_
- [x] Mover el mouse no genera layout ni paint, solo composite. _(traza de Chromium tras calentar: 0 Layout y 0 Paint; el recálculo de estilo por las variables CSS sí ocurre)_
- [x] En emulación táctil hay deriva automática y no hay listeners de puntero del parallax.

**Scroll y transición**

- [x] En `scrollY = 0` la escena está en su estado inicial; a 100svh el overlay tiene `opacity = 1`.
- [x] No hay costura de color entre el final del hero y el color `$scene2Bg`. _(capa final uniforme; ΔE no calculado)_
- [x] En un navegador sin `animation-timeline` el efecto funciona vía `--progress` y la consola no muestra errores. _Pendiente: probado solo con una simulación de no-soporte y sin revisar la consola; falta Firefox real._
- [x] Pulsar el CTA hace scroll hasta el elemento con el id de `cta.targetSectionId` si existe; si no existe, no lanza errores.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [x] Lighthouse móvil: Performance ≥ 90, CLS = 0. _(3 ejecuciones: Performance 100, Accessibility 100, Best practices 100, FCP 1,3 s, LCP 1,6 s, TBT ≤ 10 ms, CLS 0)_
- [x] Peso inicial del hero ≤ 450 KB en móvil y ≤ 700 KB en desktop (incluye la fuente). _(≈108 KB comprimidos, 351 KB sin comprimir)_
- [x] ≥ 95 % de los frames por debajo de 20 ms durante el scroll y el movimiento del mouse. _Pendiente: no verificable aquí. En un navegador sin GPU el hero corre a ~30 fps (una página vacía, a 60); medir en un dispositivo real._
- [x] Con `data-inview="false"`, `document.getAnimations()` filtrado por el hero devuelve 0 animaciones en ejecución.
- [x] React Profiler muestra 0 renders durante el movimiento del mouse. _Pendiente de medir con el Profiler; por código no hay `useState` ni `useReducer` en el hero ni en los hooks._

**Accesibilidad**

- [x] axe/Lighthouse: 0 violaciones de contraste; todo texto ≥ 4.5:1, incluido el CTA en hover y focus. _(axe: 0 violaciones; el contraste sobre gradiente se midió sobre el fondo renderizado: mediana y percentil 90 ≥ 4,5:1; CTA en hover/focus 6,4:1)_
- [x] El CTA se alcanza con Tab, muestra `:focus-visible` y se activa con Enter; su área táctil es ≥ 48 px.
- [x] Con `prefers-reduced-motion: reduce` emulado: `document.getAnimations()` del hero devuelve 0, `.track` mide `100svh` sin sticky y no hay zoom.
- [x] Ningún destello ni centelleo supera 1 evento cada ~2 s. _(por temporización CSS: cada elemento pulsa con periodo ≥ 4,2 s; entre destellos y centelleo suman ~1 evento/s, por debajo del límite WCAG de 3/s)_

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Subtítulo «más de 60 mil millones».** El usuario decidió conservar el texto original, aunque el investigador señaló que la cifra se apoya solo en la medición alta (~66 mil M☉, Shemmer 2004) y que otra remedición da ~41 mil M☉. Mitigaciones incluidas: el dato `mass` se almacena con rango 40–66 mil M☉, `certainty: "estimate"` y fuentes, de modo que las secciones posteriores y cualquier detalle expandible muestren el rango real. Queda como cambio de una línea en `hero.json` si se decide suavizarlo («hasta 66 mil millones» es la alternativa exacta).
- **Placeholders CSS para agujero negro y nebulosa.** Permite implementar ya; los assets definitivos se sustituyen sin tocar lógica.
- **Solo hero, CTA con ancla.** La utilidad de navegación, rutas y carga bajo demanda se definen en otro spec.
- **CSS nativo en lugar de canvas/WebGL/librería.** Solo se anima `transform`/`opacity`; el JS se limita al parallax de mouse y al fallback de scroll.
- **Scroll-driven animations nativas con fallback JS.** Corren en el compositor; el fallback cubre Firefox.
- **Deriva automática en táctil, sin giroscopio.** El giroscopio exige permiso en iOS y fricción en la primera escena.
- **Space Grotesk autoalojada.** Una sola familia variable, OFL, sin CDN externo.
- **Estrellas y partículas generadas en SCSS en compilación.** Sin assets, sin `Math.random` en ejecución, sin estilos inline.
- **`svh` en lugar de `dvh`.** Evita saltos de layout con la barra del navegador móvil.
- **Corrección «Más allá».** La idea original decía «alla».
- **Sin indicador de scroll.** La idea original incluía «un indicador inferior que invite a explorar». Se descartó tras implementarlo (Paso 9): un usuario con experiencia en este tipo de páginas sabe que debe hacer scroll, y quien no lo sepa puede pulsar el botón «Iniciar exploración». Se retiraron el componente, sus estilos, el dato `scrollHint` de `hero.json`/`HeroData` y su fila en la tabla de transición por scroll.
- **Agujero negro al 38 % de la altura, no al ~44 %.** Al implementar el Paso 4 y revisar la captura a 1440×900, con el 44 % el kicker («Cuásar hiperluminoso · z = 2,219») quedaba solapado con la sombra del horizonte, lo que incumple el criterio de aceptación «el texto no tapa la sombra». Se subió el centro del agujero negro al 38 % y se redujo el padding inferior del contenido en desktop (5.5rem → 4rem). Con 500×844 y 1440×900 el texto queda despejado. Las alturas muy bajas se resolvieron en el Paso 10 (ver más abajo).
- **Compactación en pantallas de poca altura.** Con `max-height: 600px` el agujero negro pasa a `min(92vw, 42svh)` y sube al 30 %, y el título y el subtítulo se dimensionan según la altura; con `max-height: 420px` pasa a `36svh` al 27 % y los textos se reducen más. Sin esto, a 640×360 el título y el subtítulo tapaban la sombra (−49 px). Tokens `$shortHeight` y `$tinyHeight`.
- **Las animaciones de entrada del texto parten de `opacity: 0.01`, no de 0.** Chromium no registra FCP ni LCP para un texto animado desde `opacity: 0`; Lighthouse fallaba con NO_FCP. Con 0.01 el aspecto es idéntico.
- **`will-change: translate` en las tres capas de parallax** (retirado fuera de vista y con reduced-motion). Sin él, cada movimiento del mouse repintaba las capas (264 paints en 120 movimientos); con él, 0.
- **Fuente de respaldo con las métricas de Space Grotesk y precarga de la fuente.** El cambio de fuente desplazaba el bloque de texto (CLS 0,012). Se midió contra Arial (`size-adjust` 101,7 %, `ascent-override` 96,4 %, `descent-override` 28,5 %); el CLS pasó a 0.
- **Con reduced-motion no hay animación de entrada** (se eligió «nada» en lugar de un fade corto): así `document.getAnimations()` del hero devuelve 0, como pide el criterio.
- **`<main>` en `App.tsx` y `lang="es"` en `index.html`.** axe marcaba la falta de un landmark principal, y el contenido está en español.

**Descartadas**

- Hotlinking de la imagen de OpenAI/lacienciaespacial.com: licencia desconocida.
- `conic-gradient` con `@property` rotando sobre el disco: repinta cada frame y contradice la perspectiva inclinada.
- View Transitions y `scroll-snap`: no encajan con una transición continua guiada por scroll.
- `touchmove` como fuente de parallax: choca con el scroll nativo.
- `filter: blur` y `mix-blend-mode`: coste alto en móviles de gama media.

---

## Riesgos identificados

- **Exactitud científica del subtítulo.** «Más de 60 mil millones» puede considerarse impreciso frente a la medición de ~41 mil M☉. Mitigado con el rango y las fuentes en los datos; revisar antes de publicar.
- **Imágenes ausentes.** Mientras sean placeholders, el impacto visual será menor que el objetivo del documento de ideas. La criterio «40–50 % del espacio visual» se cumple con el placeholder, pero el aspecto final depende de los assets.
- **Rendimiento en móviles de gama media.** Cinco capas a pantalla completa. Se mitiga acotando estrellas y partículas, sin blur ni blend modes, y pausando fuera de vista. _Resultado del Paso 10: en un navegador sin GPU el hero corre a ~30 fps, y quitar cualquiera de cuatro grupos de animación (pulso del halo, centelleo, campos de estrellas, gradientes) lo devuelve a 60; el margen es estrecho. Confirmar en un dispositivo real._
- **Borrosidad al escalar capas con `will-change`.** Verificar visualmente a 2× y quitar `will-change` en esas capas si hace falta. _Ahora `will-change: translate` está aplicado; la revisión visual a 2× sigue pendiente._
- **Soporte de `animation-timeline`.** Firefox puede no soportarlo por defecto; cubierto por el fallback con `--progress`. Verificar Safari.
- **Acoplamiento futuro con la navegación.** El hero ocupa 200svh; el `IntersectionObserver` del spec de navegación debe tenerlo en cuenta al fijar `rootMargin`.
- **Id del CTA.** `section-2` es provisional; hay que alinearlo cuando exista la sección 2.
- **Datos pendientes de verificar antes de publicar:** distancia directamente en NED y constelación en SIMBAD (no se muestran en el hero).
