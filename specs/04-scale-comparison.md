# SPEC 04 — Escala / Una escala inimaginable

**Estado:** Approved
**Depende de:** SPEC 03 (y, por ella, SPEC 02 y SPEC 01)
**Fecha:** 2026-11-21 (revisado el 2026-11-22: scroll, fila de planetas y transición con Ciencia; ver «Cambios posteriores»)
**Objetivo:** Implementar la sección Escala como cuarta escena de la web: una escena a escala real cuyo zoom-out continuo (movido por el scroll de un tramo pegajoso y por un control deslizante) va desde la Tierra, pasando por el Sol y el Sistema solar, hasta el tamaño de TON 618.

Origen del contenido: `docs/ideas/04-scale.md`. Datos y textos verificados por el agente `cosmic-data-researcher`; diseño y animación por el agente `web-motion-designer`; verificación final por el agente `section-verifier`.

Recursos aportados por el autor: imagen de la Tierra (ya la tiene), GIF del Sol, imagen del agujero negro del Hero (`ton618-blackhole-1024.webp`, ya en el proyecto) y 8 sprites de planetas generados con IA. **Pendiente antes de publicar:** la Tierra es de NASA (confirmar la nota de crédito); el GIF del Sol y la imagen de los planetas vienen de Pinterest sin licencia verificable y son provisionales (ver Paso 3).

---

## Alcance

### Incluido

- Componente de sección `Scale` (`<section id="scale">`) montado en `App.tsx` tras `Science`.
- **Escena a escala real:** un visor circular (misma geometría que Exploración y Ciencia) con cuatro elementos cuyo tamaño relativo es el real: la Tierra, el Sol, los 8 planetas (en fila junto al Sol) y el círculo de TON 618.
- **Zoom por scroll:** la sección tiene un tramo de scroll pegajoso (`sticky`); el scroll nativo mueve el zoom de 0 a 1000 mientras el escenario queda fijo. El **control deslizante** horizontal (`<input type="range">`) se mantiene y está sincronizado con el scroll. **Cuatro paradas** (Tierra → Sol → Sistema solar → TON 618) y cuatro botones («Tierra», «Sol», «Sistema solar», «TON 618») que llevan a cada una con una animación corta del scroll.
- **Una tarjeta por parada** (kicker, título, tamaño y respuesta ≤ 40 palabras), una sola visible.
- Estado inicial: parada de la Tierra, con una invitación breve para alejarse.
- Accesibilidad: control y botones con teclado, `aria-valuetext` con el nombre de la parada, región `aria-live` para el cambio de parada.
- Comportamiento completo con `prefers-reduced-motion: reduce` (sin animación del Sol, saltos instantáneos entre paradas).
- Datos mínimos en `src/data/scale.json` con interfaces en `src/interfaces/scale.ts`; constantes físicas y de geometría en `src/utils/scaleGeometry.ts`.
- Recursos: sprites de los 8 planetas, Tierra, Sol en vídeo corto (WebM + MP4 de respaldo) y la imagen del Hero reutilizada.
- **Transición desde Ciencia:** ver «Transición con Ciencia». Ciencia se desvanece en su centro con el escenario pegado (sin deslizarse hacia arriba) mientras la intro de Escala muestra estrellas y la nebulosa del Hero, y la Tierra emerge desde un punto.

### Excluido (otros specs)

- Comparación de masas (Sol, Sagitario A\*, TON 618) y datos numéricos destacados fuera de la tarjeta de cada parada.
- Escala logarítmica o escenas con saltos de zoom entre paradas.
- Zoom libre (pellizco o arrastre sobre el visor): el zoom se controla solo con el scroll del tramo, el deslizante y los botones. No se secuestra la rueda ni se bloquea el scroll de la página.
- Cambios en Hero o Exploración. En Ciencia solo el fundido final de la transición (ver «Transición con Ciencia»).
- Navegación completa (rutas, `history.replaceState`, `React.lazy`), Navbar y Footer.
- Audio.
- Rótulos de «representación artística» o de «no a escala» en pantalla (criterio de contenido mínimo del proyecto).
- Nombres de planetas en pantalla (los sprites son decorativos).
- Órbitas de los planetas y escala de distancias entre ellos (la fila de planetas solo respeta sus tamaños relativos).
- El rayo de luz que cruza TON 618 y el tiempo de viaje de la luz (sección 05 — Tiempo, `docs/ideas/05-time.md`).
- Las secciones 5 (Tiempo), 6 (Experimento) y siguientes.

---

## Modelo de datos

Archivos: `src/interfaces/scale.ts` y `src/data/scale.json`. Solo contienen lo que se muestra en pantalla o se lee en lectores de pantalla (regla de limpieza al cerrar una sección).

```ts
// src/interfaces/scale.ts
export type ScaleStopId = 'earth' | 'sun' | 'solar-system' | 'ton618';

export interface ScaleStop {
  id: ScaleStopId;
  label: string; // texto del botón de parada: «Tierra», «Sol», «Sistema solar», «TON 618»
  kicker: string; // p. ej. «Nuestro hogar»
  title: string; // «La Tierra», «El Sol», «El Sistema solar», «TON 618»
  size: string; // medida mostrada: «12 742 km de diámetro», etc. (verificada)
  answer: string; // ≤ 40 palabras y ≤ 220 caracteres
}

export interface ScaleData {
  title: string; // «Una escala inimaginable» (h2 visible)
  hint: string; // invitación del estado inicial («Desliza para alejarte»; el scroll es el gesto principal)
  summary: string; // equivalente textual de la escena para lectores de pantalla
  stops: ScaleStop[];
}
```

Textos fijos del TSX: `aria-label` del deslizante («Escala»). Los botones usan `label`. Las magnitudes físicas **no** van en el JSON (son presentación y no se muestran como números sueltos): viven en `src/utils/scaleGeometry.ts`.

```ts
// src/utils/scaleGeometry.ts (forma orientativa; los valores reales están en el archivo)
export const SCALE_KM = { earth: 12742, sun: 1392700, ton618: 3.898e11 }; // diámetros, km
export const PLANET_DIAMETERS_KM = [/* 8 diámetros reales, de Mercurio a Neptuno */];
export const STOP_ZOOM = { earth: 1, sun: 0.015249, 'solar-system': 5.14e-3, ton618: 1.1985e-8 }; // zoom de cada parada
// + LAYER_K, sunVisible(), stopIndexAt(), zoomAt(), stopValue() y las constantes de la fila de planetas
```

Convenciones:

- Posición del zoom: `0…1000`, entero. La parada `i` está en `i / 3 × 1000` (0, 333, 667, 1000). Entre paradas el zoom se interpola de forma **exponencial** (lineal en el logaritmo del zoom), para que el movimiento se sienta uniforme.
- La fuente de verdad del valor es la **posición de scroll** dentro del track: `valor = clamp((scroll − intro) / recorrido) × 1000`; el deslizante la refleja y, al moverlo, hace `scrollTo` a la posición equivalente.
- «Escala lineal real» significa que los tamaños relativos son los reales en cada instante; la interpolación del zoom es lo único logarítmico.

### Datos físicos verificados

- **Magnitud de TON 618:** el círculo representa el **horizonte de sucesos** (no la sombra, que es ≈ 2,6× mayor y sería 2 · 2,598 · R_s = 1,01·10¹² km). Es la definición física del «tamaño» del agujero negro y la coherente con Ciencia («El límite»).
- **Masa:** 6,6·10¹⁰ M☉ (Shemmer et al. 2004, línea Hβ; coherente con «más de 60 mil millones» del Hero y el rango 40–66 mil millones de Exploración).
- **Fórmula:** R_s = 2GM/c² = 2,95325 km · (M/M☉) → R_s = 1,949·10¹¹ km; diámetro = **3,898·10¹¹ km** (≈ 2 606 UA ≈ 0,0412 años luz). Cociente con la órbita de Neptuno (8,99·10⁹ km): ≈ 43,4. Con 4·10¹⁰ M☉ (Ge et al. 2019) serían 2,36·10¹¹ km de diámetro (cociente ≈ 26).
- **Radios orbitales medios (UA)** (histórico: ya no se dibujan las órbitas; se conservan como dato verificado): Mercurio 0,387; Venus 0,723; Tierra 1,000; Marte 1,524; Júpiter 5,205; Saturno 9,582; Urano 19,20; Neptuno 30,05 (NASA/NSSDC Planetary Fact Sheet, semiejes mayores). 1 UA = 149 597 870,7 km (IAU 2012).
- **Tierra:** 12 742 km (diámetro medio, NASA). **Sol:** 1 392 700 km (la constante nominal IAU 2015 da 1 391 400 km; diferencia 0,1 %, irrelevante en pantalla).
- **Diámetros de los planetas (km, NASA/NSSDC):** Mercurio 4 879; Venus 12 104; Tierra 12 742; Marte 6 779; Júpiter 139 820; Saturno 116 460; Urano 50 724; Neptuno 49 244.
- **Zoom de las paradas** (`STOP_ZOOM` = píxeles por km relativos a la parada de la Tierra): con V = diámetro del visor, Tierra 0,6·V, disco del Sol 1,0·V, Sistema solar con el Sol a ≈ 0,34·V y la fila de planetas a 0,88·V, y horizonte de TON 618 0,22·V. **Ambigüedad resuelta:** «el círculo llena el visor» y «el Sistema solar < 6 px» son incompatibles con un círculo = horizonte (Neptuno mide 1/43,4 del horizonte: <6 px en V = 1080 exige horizonte ≤ 0,24·V). Se interpreta que la **imagen** de TON 618 (disco incluido) llena el visor y su zona oscura central es el horizonte a 0,22·V; el Paso 9 midió la zona oscura de la imagen (0,209 de su ancho, no 0,22), de modo que la imagen completa mide ≈ 1,05·V y el horizonte 0,22·V. Con la órbita de Neptuno ya fuera de la escena, el criterio de «Sistema solar < 6 px» se cumple porque el Sistema solar no se dibuja en esa parada.

---

## Recursos visuales

El realismo lo aportan las imágenes; la escala, el SVG y el CSS. Elementos de la escena (dentro del visor, de atrás hacia delante):

| Elemento             | Recurso                                                                                                   | Tamaño real representado                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Círculo de TON 618   | `ton618-blackhole-1024.webp` del Hero (sin descarga nueva), con recorte circular                          | Horizonte de sucesos (≈ 3,9·10¹¹ km), a 0,22·V en su parada |
| Planetas             | 8 sprites WebP con alfa en `src/assets/images/scale/planets/`, en fila a izquierda y derecha del Sol, que **escalan con el zoom** como una capa más | Diámetros relativos reales entre sí y respecto al Sol; las distancias entre ellos **no** son a escala (hueco fijo) |
| Sol                  | `sun.webm` + `sun.mp4` (de respaldo) en `src/assets/videos/scale/`, con máscara radial suave (sin recorte circular duro, que cortaba las llamaradas del GIF), mismo patrón que `useVideoPlayback` | 1 392 700 km                                                |
| Cielo de la intro    | Tres capas de estrellas en código (SVG, PRNG con semilla) y la nebulosa del Hero (`nebula.webp`, `nebula-mobile.webp`), sin recursos nuevos | Decorativo (ver «Transición con Ciencia»)                    |
| Tierra               | `earth.webp` con alfa en `src/assets/images/scale/`                                                       | 12 742 km                                                   |

- Los sprites se generan con IA con **fondo negro puro** y se convierten a alfa (negro → transparencia) con `sharp` desde un directorio temporal, sin dependencia nueva, como en la SPEC 02. Los prompts se dejan como apoyo en el Paso 3.
- El Sol se convierte del GIF a vídeo con `ffmpeg` (sin audio, bucle) y se reproduce solo con la sección en vista **y** la capa del Sol visible (`data-sun`), como el cuásar de la SPEC 03 (`preload='none'`, pausado fuera de vista, póster con `prefers-reduced-motion`).
- Cada elemento solo es visible (`opacity`/`visibility`) en el rango de zoom donde importa; fuera de él se oculta para no mantener capas compuestas innecesarias ni escalas extremas (≈ 10⁻⁸) en pantalla.
- El fondo del stage es negro puro (`$scienceBg`, `#000`), el mismo de Ciencia, para que la unión entre secciones no tenga costura. Los elementos se funden con rampas continuas de `opacity` sobre `--zoom` (sin saltos); la fila de planetas y el Sol comparten fundido de salida (cotas 0,003 V y 0,01 V, duplicadas en `sunVisible` y en el SCSS).

**Reglas heredadas:** solo `transform`/`translate`/`scale` y `opacity` animados; sin `filter` ni `backdrop-filter`; `will-change` solo en el contenedor que escala mientras se mueve; animaciones pausadas con `data-inview="false"`.

---

## Comportamiento

### Layout (misma geometría que Exploración y Ciencia)

- **Desktop (`$sideBySide`):** visor circular `$mapSizeDesktop` centrado en (34vw, 50svh); a la derecha, tarjeta y debajo el control (deslizante + 4 botones de parada), con los mismos márgenes y estilo de tarjeta que la SPEC 02. Título y hint arriba a la izquierda, fuera del visor.
- **Móvil y tablet:** visor `$mapSizeMobile` con centro a 34svh del borde superior; tarjeta y control abajo; `--viewportExtra` como en Exploración. En pantallas bajas el visor se reduce según la reserva del panel (≈ 216 px a 320×568); en apaisado bajo sube a la esquina superior izquierda con el título debajo y la tarjeta y el control a la derecha, con texto de ≥ 14 px.
- La sección es un **track de scroll** (`$scaleTravel` = 400 svh de recorrido del zoom + `$scaleIntro` = 120 svh de intro) con el stage `position: sticky` de `100dvh`. Título y hint viven en el panel, sobre la tarjeta; el hint solo se ve en la parada de la Tierra y reserva su altura para que la tarjeta no salte.
- El control y los botones miden ≥ 44 px de área táctil y no tapan el visor en ningún viewport de referencia.

### Interacción

- **Estado:** `Scale` guarda solo la parada activa (`useState<ScaleStopId>`). El valor continuo **no** es estado de React: `useScaleZoom` lee la posición de scroll (listener coalescido con `requestAnimationFrame`, solo mientras el track está en vista) y escribe `--zoom`, `data-sun`, `data-moving` y el `value` del deslizante por `ref`; React solo se renderiza al cruzar el umbral entre paradas (cambio de tarjeta). El visor va en `memo`.
- **Deslizante:** `<input type="range" min="0" max="1000" step="1">`, con `aria-label` «Escala» y `aria-valuetext` = título de la parada más cercana. Al moverlo hace `window.scrollTo` instantáneo a la posición equivalente (contando la intro). Flechas: ±10; `Home`/`End`: 0/1000; `PageUp`/`PageDown`: parada anterior/siguiente.
- **Botones de parada:** 4 botones con el `label` del JSON («Tierra», «Sol», «Sistema solar», «TON 618») y `aria-current="step"` en el activo; al pulsarlos **el scroll** se anima hasta la parada con una interpolación `ease-in-out` de ~1,2 s (`requestAnimationFrame`; en reduced-motion el salto es instantáneo). Mover el deslizante, la rueda, el gesto táctil o el teclado cancela la animación.
- **Parada activa:** la parada cuyo centro (0, 333, 667, 1000) está más cerca del valor; se refleja en `data-stop` de la sección (el CSS decide qué tarjeta se muestra) y en la región `aria-live="polite"`.
- **Tarjeta:** una sola visible, con el estilo de las tarjetas de la SPEC 02 (kicker, título, tamaño, respuesta); entra con `opacity` + `translate` ($cardShift); el cambio de parada intercambia sin que haya dos a la vez.
- **Teclado y foco:** Tab recorre deslizante → botones de parada; no hay atajos propios fuera del deslizante. `Esc` no hace nada.
- **Lectores de pantalla:** el visor y sus capas son `aria-hidden`; `summary` es texto solo para lectores; el cambio de parada se anuncia en la región `aria-live`.

### Transición con Ciencia

La transición ocurre con el escenario pegado; Ciencia no se desliza hacia arriba.

- **Fundido de Ciencia** (`$scienceFade` = 50 svh tras su último estado): el visor del cuásar se encoge hacia su centro (×1 → ×0,02, `$quasarOutScale`) y el stage entero pasa de opacidad 1 a 0, quedando `visibility: hidden`. Los marcadores se desvanecen en el primer 40 % del fundido y terminan en `visibility: hidden`. `data-ready` pasa a false al empezar, de modo que el punto abierto se cierra y los marcadores quedan inertes; se revierte solo al volver. Ciencia queda por encima (`z-index: 1`) y su track suma esos 50 svh.
- **Intro de Escala** (`$scaleIntro` = 120 svh, antes del valor 0, solapada con el fundido de Ciencia mediante margen negativo): tres capas de estrellas (70, 44 y 26 puntos) se abren desde el centro con distinta velocidad y quedan fijas; la nebulosa del Hero sube, crece de ×1,0 a ×1,7 y se desvanece con una máscara radial; la Tierra emerge desde un punto hasta su tamaño de parada; título y panel aparecen con fundido. El valor del zoom es 0 durante toda la intro.
- **Vídeo del cuásar:** se pausa cuando el fundido termina (`data-faded`, un `IntersectionObserver` sobre un centinela, sin listeners de scroll) y se reanuda al volver, sin recarga.
- Al volver hacia arriba todo se revierte sin saltos ni costuras.

### Reduced-motion

El Sol no se reproduce (póster); los saltos entre paradas y la animación de los botones son instantáneos; `document.getAnimations()` de la sección devuelve 0. No hay intro ni fundido: `$scaleIntro` vale 0, no hay solape, y el corte a Escala muestra el cielo estático (estrellas y nebulosa tenues) con la Tierra ya a su tamaño. El deslizante sigue funcionando (es una acción de la persona).

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional. Agentes: `cosmic-data-researcher` (paso 2), `web-motion-designer` (pasos 3, 5, 6, 7, 9 y 11), `section-verifier` (paso 10). Los pasos 1 a 9 están implementados; el paso 11 recoge los cambios posteriores del autor, también implementados; el paso 10 está pendiente.

1. **Tokens y base.** En `_variables.scss`: `$scaleBg` (alias de `$scienceBg`), `$scaleStopMs: 1200ms`, variables de tamaño del visor reutilizando las de Exploración. Esqueleto de `src/utils/scaleGeometry.ts` (formas sin valores finales).
2. **Datos.** `src/interfaces/scale.ts` y `src/data/scale.json` con textos verificados (`cosmic-data-researcher`): 4 paradas, `title`, `hint`, `summary`. El investigador también fija y documenta en el spec: qué magnitud de TON 618 representa el círculo (diámetro del horizonte de sucesos o de la sombra, y con qué masa y fórmula) y los 8 radios orbitales; rellena `scaleGeometry.ts` con esos valores.
3. **Recursos.** (a) El autor entrega la imagen de la Tierra, el GIF del Sol y los 8 planetas generados; (b) `web-motion-designer` redacta los prompts de apoyo para los planetas; (c) conversión con `sharp`/`ffmpeg` desde un directorio temporal a `earth.webp`, `planets/*.webp`, `sun.webm`, `sun.mp4` y `sun-poster.webp`; se confirma que el borde alfa no deja halos negros.

   **Estado (hecho):** recursos convertidos en `src/assets/images/scale/` (`earth.webp`, `planets/*.webp`) y `src/assets/videos/scale/` (`sun.webm`, `sun.mp4`, `sun-poster.webp`). Fuentes y licencia:

   - **Tierra:** NASA Science, «As the World Turns» (cámara EPIC de DSCOVR); 560 px con alfa circular. Confirmar la nota de crédito de la página antes de publicar.
   - **Planetas (provisional):** una sola imagen sobre gris claro tomada de Pinterest, sin autor ni licencia verificables; recortada con `sharp` (círculo para los redondos; círculo en el cuerpo más recorte por color en los anillos de Saturno). **Sustituir por sprites con licencia clara (generados con los prompts de abajo o de NASA) antes de publicar**; mantener los nombres para no tocar código. Se nombran `mercury.webp` … `neptune.webp` (tamaño nativo ≈ 180–270 px, sin reescalar; no `-256`).
   - **Sol (provisional):** GIF de Pinterest sin autor ni licencia verificables; recortado a 400×400 (elimina su marca de agua), WebM VP9 y MP4 H.264 sin audio, 1,8 s en bucle. **Sustituir o licenciar antes de publicar.**
   - **Presupuesto:** WebM 215 KB y MP4 90 KB (≤ 0,3 MB); póster del Sol 8,8 KB (300 px) + Tierra 29 KB = 38 KB (≤ 40 KB); 8 planetas 50 KB (≤ 120 KB). La Tierra a 560 px es el límite del presupuesto: a 2× la parada de la Tierra puede verse algo suave (revisar en el Paso 9).

#### Prompts de apoyo para los planetas

Apoyo al Paso 3(b); el autor puede ajustarlos al generador que use. Generar a 1024×1024 (1:1) y reducir a **256×256 px** al convertir: 8 sprites × ~10–15 KB en WebP con alfa (calidad 80, `alphaQuality` 90) caben en ≤ 120 KB. Se muestran como marcadores de ≤ ~64 px CSS, así que 256 px cubre pantallas 2×–3× con margen.

**Bloque común** (se antepone a cada prompt):

```
Photorealistic astronomical render of a single planet, perfectly centered, full disk seen head-on (frontal view), occupying about 80% of a square 1:1 frame. Lighting from the upper-left, one fixed direction, soft terminator fading into shade on the lower-right, same exposure and contrast for every planet in the series. Sharp limb, fine surface detail, natural colors. Background: pure solid black (#000000), completely empty and flat. Edges of the frame stay pure black.
```

**Restricciones comunes** (prompt negativo): no stars, no background glow, no halo, no atmosphere haze outside the limb, no lens flare, no diffraction spikes, no moons, no text, no labels, no orbit lines, no border, no vignette, no gradient or gray background, no cartoon style, no tilt or perspective.

**Sufijo por planeta** (se añade tras el bloque común):

1. Mercurio: `Mercury, gray-brown cratered surface, heavily pitted with small impact craters, subtle bright ray streaks, no atmosphere.`
2. Venus: `Venus, thick unbroken pale yellow-cream cloud deck, faint soft swirling cloud bands, featureless smooth surface, no continents visible.`
3. Marte: `Mars, rusty orange-red surface, darker basalt regions, small white polar cap at the top, faint canyon system, thin dusty look.`
4. Júpiter: `Jupiter, horizontal cream, tan and rust-brown cloud bands with turbulent swirls, the Great Red Spot visible in the lower-right area, slightly flattened disk.`
5. Saturno: `Saturn with its ring system, rings seen almost edge-open at a gentle 25 degree tilt, thin and elegant, pale gold globe with subtle bands, fine ring divisions, the planet's shadow on the rings. IMPORTANT: planet body only about 40% of the frame width, the full ring ellipse spans about 92% of the frame width, whole system centered with generous pure black margin on all sides.`
6. Urano: `Uranus, smooth featureless pale cyan-aquamarine globe, very faint lighter polar haze, no visible bands, no rings.`
7. Neptuno: `Neptune, deep azure-blue globe, faint darker storm oval and a few thin bright white high-altitude cloud streaks, subtle banding, no rings.`
8. (Opcional, variante si salen con fondo gris o halo) Repetir el prompt añadiendo `pure black #000000 void, nothing outside the planet`.

**Anillos de Saturno:** lienzo cuadrado igual que el resto (256 px) para que todos compartan caja y centrado. El cuerpo ocupa ~40 % del ancho (~100 px) y el anillo exterior ~92 % (~235 px), con margen negro de ≥ 4 % por lado; el eje del sistema es el centro del lienzo (el planeta, no el anillo, queda en el centro). Si el generador descentra los anillos, recentrar en `sharp` sobre el cuerpo y no recortar el borde. En CSS el sprite de Saturno se puede mostrar más grande (~×1,8 de ancho) para que su cuerpo iguale visualmente al de los demás; el resto de planetas rellenan ~80 % del lienzo.

**Conversión negro→alfa con `sharp`** (script en el directorio temporal, sin dependencia nueva): leer RGBA crudo con `.raw()`; para cada píxel `a = max(R, G, B)`; aplicar umbral suave (`a' = clamp((a − 6) / (40 − 6), 0, 1)` para eliminar el ruido cercano a negro); y **des-premultiplicar** el color (`C = C / a'` con `a' > 0`, limitado a 255) para evitar el borde oscuro. Después `.resize(256, 256, { kernel: 'lanczos3' })` (redimensionar *después* de calcular alfa, o con alfa premultiplicado, para no mezclar negro en el borde), `.webp({ quality: 80, alphaQuality: 90 })`. Revisar cada sprite **sobre `#000` y sobre un gris medio (`#444`)**: si hay aro oscuro, subir el umbral inferior (6 → 10) o erosionar el alfa 1 px; si el limbo se ve duro, bajar el umbral superior. Nombrar `mercury-256.webp`, `venus-256.webp`, …, `neptune-256.webp` en `src/assets/images/scale/planets/`.

**Lista de verificación al recibir las imágenes:** fondo realmente negro (#000, sin gris ni neblina); sin estrellas ni halo; planeta centrado y nítido; luz desde la misma dirección en los 8; sin texto; Saturno con margen negro suficiente; ningún planeta con lunas.
4. **Sección estática.** `Scale.tsx` y `Scale.module.scss`: `<section id="scale" aria-labelledby>`, `h2` visible, hint, `summary` solo para lectores, stage de 100dvh con visor circular y la imagen de TON 618; montada en `App.tsx` tras `Science`. Fondo `$scaleBg`.
5. **Escena y zoom.** Capas del visor (Tierra, Sol en vídeo, planetas, círculo de TON 618) a escala real con `--zoom` (en el origen incluía órbitas con sprites de tamaño fijo; ver Paso 11); hook `useScaleZoom` (valor → `--zoom` por `ref` + rAF, interpolación exponencial, parada activa); visibilidad por rangos de zoom.
6. **Control y tarjetas.** `ScaleSlider` (deslizante + 4 botones de parada con animación), `StopCard` (una a la vez), `data-stop`, `aria-live`, teclado completo.
7. **Vídeo del Sol y reduced-motion.** `useVideoPlayback` para el Sol; `data-inview` pausa; reglas de reduced-motion.
8. **Estilo y limpieza.** Prettier, lint, sin `!important`, sin `style={{}}` salvo valores dinámicos (la variable `--zoom` por `ref`, no por `style`); revisar `scale.json` e interfaces (ningún campo sin uso); eliminar lo que dejó de usarse.
9. **Revisión visual y calibración.** Capturas en los 8 viewports de referencia (320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900, 1920×1080); calibrar tamaño del círculo de TON 618 sobre la imagen del Hero, posición de sprites y tarjeta frente al visor.
10. **Verificación con `section-verifier`.** Rendimiento (capas, Layout/Paint durante el arrastre del deslizante y el scroll), accesibilidad, responsive, robustez con medición en navegador; registrar resultados y pendientes en este documento. Se ejecuta cuando el autor lo indique. **Pendiente.**
11. **Cambios posteriores (implementados).** Pedidos por el autor tras la revisión del Paso 9, ver «Cambios posteriores».

### Cambios posteriores

Cambios sobre el diseño original, hechos después del Paso 9 y reflejados en las secciones de arriba:

- **Zoom por scroll** con un tramo pegajoso (`$scaleTravel`), manteniendo el deslizante sincronizado y los botones animando el scroll. Sustituye a «sin track de scroll».
- **Sol sin recorte circular duro:** máscara radial suave que conserva las llamaradas; el disco del vídeo (94 % del lado) mide 1,0·V en su parada.
- **Parada del Sistema solar rediseñada:** el Sol queda en el centro (≈ 0,34·V) y los 8 planetas van en fila a sus lados con tamaños relativos reales y distancias no reales (hueco fijo). Orden por distancia al Sol alternando lados: a la derecha Mercurio, Tierra, Júpiter, Urano; a la izquierda Venus, Marte, Saturno, Neptuno. Se eliminan las órbitas SVG y todo lo que dependía de ellas. Los planetas interiores miden 1–3 px (menos de 1 px en 568×320): es lo real, y se decidió no fijar un tamaño mínimo.
- **Botones** con los textos «Tierra», «Sol», «Sistema solar» y «TON 618» (campo `label`).
- **Textos reescritos** para comparar tamaños: la tarjeta del Sistema solar compara Júpiter y la suma de los planetas con el Sol; la de TON 618 compara su horizonte con el Sol (≈ 280 000 veces) y con el Sistema solar (más de 40 veces a lo ancho).
- **Hueco antes de TON 618:** el Sol y los planetas se mantienen visibles algo más (cotas 0,003 V y 0,01 V). Sigue habiendo un tramo de unos 680 px de scroll casi negro (entre el 31 % y el 88 % del último tramo), porque el horizonte llena el visor hasta que su borde entra en pantalla; viene de la escala real y se decidió dejarlo.
- **Transición con Ciencia** (intro de Escala y fundido de Ciencia) y pausa del vídeo del cuásar, ver «Transición con Ciencia».

---

## Presupuesto

| Concepto                              | Límite                                                          |
| ------------------------------------- | --------------------------------------------------------------- |
| Vídeo del Sol (por formato descargado) | ≤ 0,3 MB                                                        |
| Póster del Sol y Tierra               | ≤ 40 KB en total                                                |
| Sprites de planetas                   | ≤ 120 KB en total (8)                                           |
| Imagen de TON 618                     | 0 KB nuevos (reutiliza la del Hero)                             |
| JS de la sección                      | ≤ 8 KB gz                                                       |
| CSS de los módulos de Escala          | ≤ 5 KB gz                                                       |
| `scale.json`                          | ≤ 2 KB                                                          |
| Capas compuestas grandes a la vez     | ≤ 6 (> 20 000 px²) en cada parada (en el solape con Ciencia se miden 7 durante ≈ 450 px de scroll; aceptado) |
| Trabajo por frame al mover el control | solo composite (0 Layout, 0 Paint) tras calentar                |
| Renders de React al arrastrar         | solo al cruzar el umbral de una parada                          |
| Lighthouse móvil                      | Performance ≥ 90, CLS 0                                         |

---

## Criterios de aceptación

**Contenido y estructura**

- [ ] `<section id="scale">` existe, se monta tras `Science` en `App.tsx`, tiene `aria-labelledby`, un `<h2>` visible y un `<h3>` por tarjeta; no hay ningún `<h1>` nuevo.
- [ ] Todos los textos visibles salen de `scale.json` (salvo los fijos de los controles); ninguno está escrito en el TSX.
- [ ] Hay 4 paradas en el orden Tierra → Sol → Sistema solar → TON 618; cada respuesta tiene ≤ 40 palabras y ≤ 220 caracteres.
- [ ] No aparece ningún rótulo de «representación artística», «ilustrativo» ni «no a escala», ni en pantalla ni en `summary`; la `size` de cada parada tiene fuente verificada.
- [ ] Los JSON e interfaces no contienen campos que ningún componente use.
- [ ] No hay scroll horizontal entre 320 y 2560 px de ancho.
- [ ] Ni el control, ni la tarjeta ni el texto tapan el visor en los 8 viewports de referencia.
- [ ] No hay archivos `.scss` sueltos (solo `.module.scss`, salvo los parciales de `src/styles/`), ni `!important`, ni `style={{}}` salvo valores dinámicos; clases en camelCase; el código pasa `prettier --check`.
- [ ] `npm run build` termina sin errores de TypeScript ni de lint.
- [ ] La autoría y la licencia de la Tierra, del Sol y de los 8 planetas están confirmadas (el Sol y los planetas provisionales están sustituidos o licenciados) y, si se exige, el crédito aparece.

**Escala y zoom**

- [ ] En la parada de la Tierra (valor 0, terminada la intro) la Tierra ocupa el visor como elemento principal y no se ven el Sol, los planetas ni TON 618.
- [ ] En las 4 paradas el cociente entre el diámetro dibujado de dos elementos visibles cualesquiera coincide con el cociente real de `scaleGeometry.ts` con una tolerancia del 2 %, medido con `getBoundingClientRect` (en la parada del Sistema solar, los diámetros de los planetas y del Sol son los reales; sus distancias no).
- [ ] En la parada del Sistema solar se ven el Sol y los 8 planetas en fila, con diámetros relativos reales (tolerancia 2 %) y ninguno fuera del visor circular.
- [ ] En la parada de TON 618 la imagen de TON 618 llena el visor con su horizonte a 0,22·V y el Sistema solar mide menos de 6 px o no se dibuja.
- [ ] Desplazar el scroll del track (o mover el deslizante) de 0 a 1000 hace un zoom-out continuo sin saltos visibles ni elementos que desaparezcan de golpe (comprobado por barrido paso a paso: la variación de zoom entre pasos consecutivos es constante en el logaritmo).
- [ ] Los botones («Tierra», «Sol», «Sistema solar», «TON 618») llevan al valor 0, 333, 667 y 1000 con una animación del scroll de ~1,2 s, y mover el deslizante, la rueda o el teclado la cancela.
- [ ] El deslizante y el scroll están sincronizados en ambos sentidos y al salir del track por cualquier extremo el valor queda exactamente en 0 o 1000, sin saltos.

**Transición con Ciencia**

- [ ] Durante la transición el stage de Ciencia no se desplaza verticalmente (`getBoundingClientRect().top` constante) y no hay costuras ni tramos vacíos; al volver hacia arriba se revierte sin saltos.
- [ ] El visor del cuásar se encoge hacia su centro y el stage llega a opacidad 0; mientras tanto la intro muestra estrellas, nebulosa y la Tierra emergiendo, y la Tierra queda centrada a 0,6·V.
- [ ] Ciencia sigue funcionando: abrir un punto, `Esc` y `Enter`; al entrar en el fundido el punto se cierra y los marcadores quedan inertes.
- [ ] El vídeo del cuásar avanza mientras el stage se ve, se pausa al llegar a opacidad 0 y se reanuda al volver, sin nueva petición de red.
- [ ] Con reduced-motion no hay intro ni solape y `document.getAnimations()` devuelve 0.

**Interacción**

- [ ] Cada parada muestra solo su tarjeta (`data-stop` cambia y nunca hay dos tarjetas a la vez); el cambio de parada ocurre al pasar por 167, 500 y 833 (±10).
- [ ] Con el foco en el deslizante: flechas ±10, `Home` va a 0, `End` a 1000, `PageUp`/`PageDown` a la parada anterior/siguiente.
- [ ] `aria-valuetext` del deslizante es el título de la parada activa y la región `aria-live` anuncia el cambio sin ruido durante el arrastre.
- [ ] Arrastrar el deslizante o desplazar el scroll provoca 0 renders de `Scale` mientras no se cruza el umbral entre paradas (máx. 3 en un barrido completo) y 0 renders del visor (`memo`). Los 4 botones, al animar el scroll, cruzan paradas intermedias y pueden sumar más renders.

**Vídeo y recursos**

- [ ] El Sol se reproduce solo con la sección en pantalla y se pausa fuera de vista; no emite audio ni muestra controles; con `prefers-reduced-motion: reduce` se ve el póster.
- [ ] El navegador descarga un solo formato del Sol y pesa ≤ 0,3 MB.
- [ ] Los sprites y la Tierra no tienen halos negros en el borde sobre el fondo `#000`, y el Sol no muestra un rectángulo ni costura contra el fondo.
- [ ] Planetas, Tierra y Sol se ven nítidos en su parada en 1440×900 y en pantallas 2×.

**Accesibilidad**

- [ ] axe/Lighthouse: 0 violaciones; todo texto ≥ 4,5:1.
- [ ] Visor, imágenes y vídeo `aria-hidden`; `summary` accesible; deslizante y botones con nombre accesible, `:focus-visible` visible y áreas ≥ 44 px.
- [ ] Con `prefers-reduced-motion: reduce`: `document.getAnimations()` de la sección devuelve 0 y los saltos entre paradas son instantáneos.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [ ] Lighthouse móvil: Performance ≥ 90, CLS = 0.
- [ ] Durante el arrastre del deslizante y el scroll: 0 Layout y 0 Paint tras calentar, y capas compuestas grandes ≤ 6 en cada parada. **Conocido:** el agente midió Paint distinto de 0 al desplazar (≈ 43 eventos en el zoom y ≈ 46 en la intro, ya presentes antes de la intro; solo desaparecen al ocultar el visor entero) y 1 Layout por cada escritura de `input.value` al sincronizar el deslizante; la causa no está identificada. Es el primer punto para el Paso 10.
- [ ] ≥ 95 % de los frames por debajo de 20 ms durante el arrastre y la animación de los botones (en dispositivo real si el entorno no tiene GPU).
- [ ] Con `data-inview="false"`, `document.getAnimations()` filtrado por la sección devuelve 0 animaciones en ejecución y el vídeo está en pausa.
- [ ] El JS de la sección ≤ 8 KB gz y el CSS ≤ 5 KB gz; los recursos nuevos cumplen el presupuesto.

**Verificación final**

- [ ] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz, arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Zoom por scroll con tramo pegajoso, manteniendo el deslizante.** (Revisión del autor; sustituye a «deslizante en lugar de scroll guiado».) El scroll nativo mueve el zoom sin secuestrar la rueda, funciona con teclado y táctil, y al llegar a los extremos sigue el scroll normal. El deslizante y los botones siguen disponibles y accesibles.
- **Cuatro paradas con la Tierra como origen.** Lo pidió el autor: da una referencia humana desde la que alejarse; Tierra → Sol → Sistema solar → TON 618 mantiene el contenido mínimo.
- **Escala real con interpolación exponencial del zoom.** Los tamaños relativos son honestos; el factor de zoom total (~10⁷) es inmanejable de forma lineal, así que el parámetro del deslizante es logarítmico.
- **Planetas en fila a tamaño relativo real junto al Sol** (revisión del autor; sustituye a los marcadores de tamaño fijo sobre órbitas). El Sol es el punto principal reutilizado; las distancias entre planetas no son a escala, solo los tamaños. Se descartó la fila de marcadores de tamaño fijo y mantener las órbitas junto a la fila.
- **Sol en vídeo, no en WebP animado.** Reutiliza `useVideoPlayback`, que ya pausa fuera de vista y respeta reduced-motion; el recorte circular y el fondo negro hacen innecesario el canal alfa.
- **Sin rayo de luz.** El viaje de la luz y el tiempo que tarda se tratan con más detalle en la sección 05 — Tiempo (`docs/ideas/05-time.md`), que sigue a esta; aquí solo se compara el tamaño.
- **Imagen del Hero para TON 618.** Cero peso nuevo y coherencia visual con la web.
- **Transición «el viaje de vuelta».** (Revisión del autor; sustituye al corte simple.) Estrellas en código y la nebulosa del Hero (cero peso nuevo) sobre el mismo fondo negro; Ciencia se desvanece en su centro con el escenario pegado (opacidad, no un stage de Escala transparente encima, porque el fondo del `body` no es negro) y la Tierra emerge desde un punto. Se tocó Ciencia de forma mínima y localizada.
- **Ver «Cambios posteriores»:** botones con `label`, textos reescritos, Sol con máscara radial y hueco negro antes de TON 618 aceptado.
- **Estado de React mínimo.** El valor continuo del deslizante va por `ref` + variable CSS; React solo conoce la parada activa.
- **Agentes por paso.** `cosmic-data-researcher` para datos, `web-motion-designer` para diseño, animación y prompts, `section-verifier` al final.

**Descartadas**

- **Secuestro de la rueda (bloqueo real del scroll).** Intrusivo, puede sentirse atrapado, sobre todo en móvil. Se eligió el tramo pegajoso.
- **Escala logarítmica o saltos de zoom.** Restan impacto y distorsionan la comparación.
- **Comparación de masas (Sol, Sagitario A\*, TON 618) y datos destacados fuera de la tarjeta.** Contenido adicional a verificar; mejor en su propia sección.
- **Zoom-out desde el vídeo de Ciencia.** Es el patrón que ya se descartó en la SPEC 03 y acopla ambas secciones.
- **Parpadeo de párpados como transición.** Repetiría la metáfora de Ciencia.
- **Velo de nebulosa solo y estrellas sin nebulosa** como transición: menos significativos que «el viaje de vuelta».
- **Tamaño mínimo en px para los planetas pequeños:** rompería la proporción real.
- **Nombres de planetas en pantalla.** Más texto sin aporte a la comparación.

---

## Riesgos identificados

- **Rango extremo de escalas.** De la Tierra a TON 618 hay unos 10⁷ de factor; escalas ≈ 10⁻⁸ en elementos ocultos pueden dar imprecisión o capas enormes. Mitigar con visibilidad por rangos y elementos ocultos fuera de su zona; medir en el Paso 10.
- **Definición del tamaño de TON 618.** El círculo puede ser el horizonte de sucesos o la sombra (≈ 2,6× mayor); la imagen del Hero incluye el disco, así que hay que calibrar qué parte de la imagen es el círculo. El investigador fija la magnitud y el método en el Paso 2, y el cambio de masa (40–66 mil millones de M☉) puede alterar la cifra.
- **Licencia y autoría.** La Tierra es de NASA (confirmar crédito); el GIF del Sol y la imagen de los planetas vienen de Pinterest, sin autor ni licencia verificables, y son provisionales: no publicar sin sustituirlos o licenciarlos.
- **Planetas interiores casi invisibles.** Mercurio, Venus, Tierra y Marte miden 1–3 px en la parada del Sistema solar (menos de 1 px en 568×320). Es lo real; aceptado.
- **Rendimiento en móviles de gama media.** Escena con muchos elementos en capas distintas y un vídeo; medir en dispositivo real.
- **Peso de los recursos.** 8 sprites + Sol + Tierra; el presupuesto es ajustado y se mide en el Paso 3.
- **Tramo negro antes de TON 618.** Unos 680 px de scroll con la escena casi negra (el horizonte llena el visor); aceptado. Reducirlo exigiría acortar `$scaleTravel` o repartir el scroll de forma desigual entre tramos.
- **Paint no es 0 al desplazar** y 1 Layout por escritura de `input.value` (ver criterios); sin causa identificada, a investigar en el Paso 10.
- **Capas del solape con Ciencia.** 7 capas grandes durante ≈ 450 px de scroll (límite 6); aceptado, a medir en el Paso 10.
- **Fallback sin `animation-timeline`** de los fundidos de Ciencia: lógica CSS no probada en un navegador real (solo la rama nativa en Chrome).
- **Acoplamiento con Ciencia.** El solape y el fundido dependen de `$scienceFade` y del margen negativo de Escala; cambiar uno obliga a revisar el otro.
- **Acoplamiento futuro con la navegación.** La sección es un track pegado al final de Ciencia, con solape; el `rootMargin` del `IntersectionObserver` del spec de navegación debe tenerlo en cuenta.

---

## Qué **no** está en este spec

- Comparación de masas (Sol, Sagitario A\*, TON 618) y datos numéricos destacados fuera de la tarjeta.
- Escala logarítmica y zoom libre (pellizco o arrastre).
- Cambios en Hero o Exploración; en Ciencia solo el fundido final de la transición.
- Nombres de planetas, rótulos de «no a escala» y audio.
- Navegación completa, Navbar y Footer.
- El rayo de luz y el tiempo de viaje (sección 05 — Tiempo) y el experimento de gravedad (sección 06).
- Las secciones 5 y 6 en adelante, salvo lo indicado.

Cada una de estas cosas, si se hace, va en su propio spec.
