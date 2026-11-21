# SPEC 04 — Escala / Una escala inimaginable

**Estado:** Approved
**Depende de:** SPEC 03 (y, por ella, SPEC 02 y SPEC 01)
**Fecha:** 2026-11-21
**Objetivo:** Implementar la sección Escala como cuarta escena de la web: una escena a escala real con un control deslizante que hace zoom-out continuo desde la Tierra, pasando por el Sol y el Sistema solar, hasta el tamaño de TON 618.

Origen del contenido: `docs/ideas/04-scale.md`. Datos y textos verificados por el agente `cosmic-data-researcher`; diseño y animación por el agente `web-motion-designer`; verificación final por el agente `section-verifier`.

Recursos aportados por el autor: imagen de la Tierra (ya la tiene), GIF del Sol, imagen del agujero negro del Hero (`ton618-blackhole-1024.webp`, ya en el proyecto) y 8 sprites de planetas generados con IA. **Pendiente antes de publicar:** confirmar autoría y licencia del GIF del Sol y de la imagen de la Tierra, y añadir el crédito si lo exigen.

---

## Alcance

### Incluido

- Componente de sección `Scale` (`<section id="scale">`) montado en `App.tsx` tras `Science`.
- **Escena a escala real:** un visor circular (misma geometría que Exploración y Ciencia) con cuatro elementos cuyo tamaño relativo es el real: la Tierra, el Sol, las órbitas de los 8 planetas y el círculo de TON 618.
- **Control deslizante** (`<input type="range">`) que hace zoom-out continuo, con **cuatro paradas** (Tierra → Sol → Sistema solar → TON 618) y cuatro botones que llevan a cada parada con una animación corta.
- **Una tarjeta por parada** (kicker, título, tamaño y respuesta ≤ 40 palabras), una sola visible.
- Estado inicial: parada de la Tierra, con una invitación breve para mover el control.
- Accesibilidad: control y botones con teclado, `aria-valuetext` con el nombre de la parada, región `aria-live` para el cambio de parada.
- Comportamiento completo con `prefers-reduced-motion: reduce` (sin animación del Sol, saltos instantáneos entre paradas).
- Datos mínimos en `src/data/scale.json` con interfaces en `src/interfaces/scale.ts`; constantes físicas y de geometría en `src/utils/scaleGeometry.ts`.
- Recursos: sprites de los 8 planetas, Tierra, Sol en vídeo corto (WebM + MP4 de respaldo) y la imagen del Hero reutilizada.
- Unión con Ciencia: la sección empieza donde termina el track de Ciencia, sobre el mismo fondo negro, sin efecto de transición.

### Excluido (otros specs)

- Comparación de masas (Sol, Sagitario A\*, TON 618) y datos numéricos destacados fuera de la tarjeta de cada parada.
- Escala logarítmica o escenas con saltos de zoom entre paradas.
- Zoom libre (rueda, pellizco, arrastre) y scroll guiado: el único control de escala es el deslizante y los botones.
- Cambios en Hero, Exploración o Ciencia.
- Navegación completa (rutas, `history.replaceState`, `React.lazy`), Navbar y Footer.
- Audio.
- Rótulos de «representación artística» o de «no a escala» en pantalla (criterio de contenido mínimo del proyecto).
- Nombres de planetas en pantalla (los sprites son decorativos).
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
  order: number;
  kicker: string; // p. ej. «Nuestro hogar»
  title: string; // «La Tierra», «El Sol», «El Sistema solar», «TON 618»
  size: string; // medida mostrada: «12 742 km de diámetro», etc. (verificada)
  answer: string; // ≤ 40 palabras y ≤ 220 caracteres
}

export interface ScaleData {
  title: string; // «Una escala inimaginable» (h2 visible)
  hint: string; // invitación del estado inicial («Desliza para alejarte»)
  summary: string; // equivalente textual de la escena para lectores de pantalla
  stops: ScaleStop[];
}
```

Textos fijos del TSX: `aria-label` del deslizante («Escala») y de los botones de parada. Las magnitudes físicas **no** van en el JSON (son presentación y no se muestran como números sueltos): viven en `src/utils/scaleGeometry.ts`.

```ts
// src/utils/scaleGeometry.ts (forma orientativa; los valores los verifica el investigador)
export const SCALE_KM = { earth: 12742, sun: 1392700, neptuneOrbit: 9.0e9, ton618: /* diámetro del círculo, km */ 0 };
export const PLANET_ORBITS_AU = [/* 8 radios medios en UA, de Mercurio a Neptuno */];
export const STOP_ZOOM = { earth: 1, sun: /* … */ 0, 'solar-system': 0, ton618: 0 }; // factor de zoom de cada parada
```

Convenciones:

- Posición del deslizante: `0…1000`, entero. La parada `i` está en `i / 3 × 1000` (0, 333, 667, 1000). Entre paradas el zoom se interpola de forma **exponencial** (lineal en el logaritmo del zoom), para que el movimiento se sienta uniforme.
- «Escala lineal real» significa que los tamaños relativos son los reales en cada instante; la interpolación del zoom es lo único logarítmico.

### Datos físicos verificados

- **Magnitud de TON 618:** el círculo representa el **horizonte de sucesos** (no la sombra, que es ≈ 2,6× mayor y sería 2 · 2,598 · R_s = 1,01·10¹² km). Es la definición física del «tamaño» del agujero negro y la coherente con Ciencia («El límite»).
- **Masa:** 6,6·10¹⁰ M☉ (Shemmer et al. 2004, línea Hβ; coherente con «más de 60 mil millones» del Hero y el rango 40–66 mil millones de Exploración).
- **Fórmula:** R_s = 2GM/c² = 2,95325 km · (M/M☉) → R_s = 1,949·10¹¹ km; diámetro = **3,898·10¹¹ km** (≈ 2 606 UA ≈ 0,0412 años luz). Cociente con la órbita de Neptuno (8,99·10⁹ km): ≈ 43,4. Con 4·10¹⁰ M☉ (Ge et al. 2019) serían 2,36·10¹¹ km de diámetro (cociente ≈ 26).
- **Radios orbitales medios (UA):** Mercurio 0,387; Venus 0,723; Tierra 1,000; Marte 1,524; Júpiter 5,205; Saturno 9,582; Urano 19,20; Neptuno 30,05 (NASA/NSSDC Planetary Fact Sheet, semiejes mayores). 1 UA = 149 597 870,7 km (IAU 2012).
- **Tierra:** 12 742 km (diámetro medio, NASA). **Sol:** 1 392 700 km (la constante nominal IAU 2015 da 1 391 400 km; diferencia 0,1 %, irrelevante en pantalla).
- **Zoom de las paradas** (`STOP_ZOOM` = píxeles por km relativos a la parada de la Tierra): con V = diámetro del visor, Tierra 0,6·V, Sol 1,0·V, órbita de Neptuno 0,9·V y horizonte de TON 618 0,22·V. **Ambigüedad resuelta:** «el círculo llena el visor» y «el Sistema solar < 6 px» son incompatibles con un círculo = horizonte (Neptuno mide 1/43,4 del horizonte: <6 px en V = 1080 exige horizonte ≤ 0,24·V). Se interpreta que la **imagen** de TON 618 (disco incluido) llena el visor y su zona oscura central es el horizonte a 0,22·V; el Paso 9 calibra el recorte de la imagen para que así sea.

---

## Recursos visuales

El realismo lo aportan las imágenes; la escala, el SVG y el CSS. Elementos de la escena (dentro del visor, de atrás hacia delante):

| Elemento             | Recurso                                                                                                   | Tamaño real representado                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Círculo de TON 618   | `ton618-blackhole-1024.webp` del Hero (sin descarga nueva), con recorte circular                          | Diámetro verificado por el investigador (ver Paso 2)         |
| Órbitas              | SVG: 8 circunferencias finas, una por planeta, a su radio medio                                           | Radio orbital real en UA                                    |
| Planetas             | 8 sprites WebP con alfa en `src/assets/images/scale/planets/`, de tamaño fijo en px (no escalan con el zoom) | Solo la **posición** orbital es a escala; el sprite es un marcador legible |
| Sol                  | `sun.webm` + `sun.mp4` (de respaldo) en `src/assets/videos/scale/`, recorte circular, mismo patrón que `useVideoPlayback` | 1 392 700 km                                                |
| Tierra               | `earth.webp` con alfa en `src/assets/images/scale/`                                                       | 12 742 km                                                   |

- Los sprites se generan con IA con **fondo negro puro** y se convierten a alfa (negro → transparencia) con `sharp` desde un directorio temporal, sin dependencia nueva, como en la SPEC 02. Los prompts se dejan como apoyo en el Paso 3.
- El Sol se convierte del GIF a vídeo con `ffmpeg` (sin audio, bucle, recorte circular) y se reproduce solo en vista, como el cuásar de la SPEC 03 (`preload='none'`, pausado fuera de vista, póster con `prefers-reduced-motion`).
- Cada elemento solo es visible (`opacity`/`visibility`) en el rango de zoom donde importa; fuera de él se oculta para no mantener capas compuestas innecesarias ni escalas extremas (≈ 10⁻⁸) en pantalla.
- El fondo del stage es negro puro (`$scienceBg`, `#000`), el mismo de Ciencia, para que la unión entre secciones no tenga costura.

**Reglas heredadas:** solo `transform`/`translate`/`scale` y `opacity` animados; sin `filter` ni `backdrop-filter`; `will-change` solo en el contenedor que escala mientras se mueve; animaciones pausadas con `data-inview="false"`.

---

## Comportamiento

### Layout (misma geometría que Exploración y Ciencia)

- **Desktop (`$sideBySide`):** visor circular `$mapSizeDesktop` centrado en (34vw, 50svh); a la derecha, tarjeta y debajo el control (deslizante + 4 botones de parada), con los mismos márgenes y estilo de tarjeta que la SPEC 02. Título y hint arriba a la izquierda, fuera del visor.
- **Móvil y tablet:** visor `$mapSizeMobile` con centro a 34svh del borde superior; tarjeta y control abajo; `--viewportExtra` como en Exploración.
- Altura de la sección: `100dvh` (con `vh` de respaldo), `position: relative`. **No hay track de scroll**: el avance lo da el control, no el scroll.
- El control y los botones miden ≥ 44 px de área táctil y no tapan el visor en ningún viewport de referencia.

### Interacción

- **Estado:** `Scale` guarda solo la parada activa (`useState<ScaleStopId>`). El valor continuo del deslizante **no** es estado de React: un `ref` + `requestAnimationFrame` escribe la variable CSS `--zoom` en el contenedor del visor; React solo se renderiza al cruzar el umbral entre paradas (cambio de tarjeta). El visor va en `memo`.
- **Deslizante:** `<input type="range" min="0" max="1000" step="1">`, con `aria-label` «Escala» y `aria-valuetext` = título de la parada más cercana. Flechas: ±10 (paso nativo ampliado a 10); `Home`/`End`: primera/última parada; `PageUp`/`PageDown`: parada anterior/siguiente.
- **Botones de parada:** 4 botones (Tierra, Sol, Sistema solar, TON 618) con `aria-current="step"` en el activo; al pulsarlos el valor se anima hasta la parada con una interpolación `ease-in-out` de ~1,2 s (`requestAnimationFrame` desde un hook propio; en reduced-motion el salto es instantáneo). Mover el deslizante a mano cancela la animación.
- **Parada activa:** la parada cuyo centro (0, 333, 667, 1000) está más cerca del valor; se refleja en `data-stop` de la sección (el CSS decide qué tarjeta se muestra) y en la región `aria-live="polite"`.
- **Tarjeta:** una sola visible, con el estilo de las tarjetas de la SPEC 02 (kicker, título, tamaño, respuesta); entra con `opacity` + `translate` ($cardShift); el cambio de parada intercambia sin que haya dos a la vez.
- **Teclado y foco:** Tab recorre deslizante → botones de parada; no hay atajos propios fuera del deslizante. `Esc` no hace nada.
- **Lectores de pantalla:** el visor y sus capas son `aria-hidden`; `summary` es texto solo para lectores; el cambio de parada se anuncia en la región `aria-live`.

### Reduced-motion

El Sol no se reproduce (póster); los saltos entre paradas y la animación de los botones son instantáneos; `document.getAnimations()` de la sección devuelve 0. El deslizante sigue funcionando (es una acción de la persona).

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional. Agentes: `cosmic-data-researcher` (paso 2), `web-motion-designer` (pasos 3, 5, 6 y 7), `section-verifier` (paso 10).

1. **Tokens y base.** En `_variables.scss`: `$scaleBg` (alias de `$scienceBg`), `$scaleStopMs: 1200ms`, variables de tamaño del visor reutilizando las de Exploración. Esqueleto de `src/utils/scaleGeometry.ts` (formas sin valores finales).
2. **Datos.** `src/interfaces/scale.ts` y `src/data/scale.json` con textos verificados (`cosmic-data-researcher`): 4 paradas, `title`, `hint`, `summary`. El investigador también fija y documenta en el spec: qué magnitud de TON 618 representa el círculo (diámetro del horizonte de sucesos o de la sombra, y con qué masa y fórmula) y los 8 radios orbitales; rellena `scaleGeometry.ts` con esos valores.
3. **Recursos.** (a) El autor entrega la imagen de la Tierra, el GIF del Sol y los 8 planetas generados; (b) `web-motion-designer` redacta los prompts de apoyo para los planetas; (c) conversión con `sharp`/`ffmpeg` desde un directorio temporal a `earth.webp`, `planets/*.webp`, `sun.webm`, `sun.mp4` y `sun-poster.webp`; se confirma que el borde alfa no deja halos negros.
4. **Sección estática.** `Scale.tsx` y `Scale.module.scss`: `<section id="scale" aria-labelledby>`, `h2` visible, hint, `summary` solo para lectores, stage de 100dvh con visor circular y la imagen de TON 618; montada en `App.tsx` tras `Science`. Fondo `$scaleBg`.
5. **Escena y zoom.** Capas del visor (Tierra, Sol en vídeo, órbitas con sprites, círculo de TON 618) a escala real con `--zoom`; hook `useScaleZoom` (valor → `--zoom` por `ref` + rAF, interpolación exponencial, parada activa); visibilidad por rangos de zoom.
6. **Control y tarjetas.** `ScaleSlider` (deslizante + 4 botones de parada con animación), `StopCard` (una a la vez), `data-stop`, `aria-live`, teclado completo.
7. **Vídeo del Sol y reduced-motion.** `useVideoPlayback` para el Sol; `data-inview` pausa; reglas de reduced-motion.
8. **Estilo y limpieza.** Prettier, lint, sin `!important`, sin `style={{}}` salvo valores dinámicos (la variable `--zoom` por `ref`, no por `style`); revisar `scale.json` e interfaces (ningún campo sin uso); eliminar lo que dejó de usarse.
9. **Revisión visual y calibración.** Capturas en los 8 viewports de referencia (320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900, 1920×1080); calibrar tamaño del círculo de TON 618 sobre la imagen del Hero, posición de sprites y tarjeta frente al visor.
10. **Verificación con `section-verifier`.** Rendimiento (capas, Layout/Paint durante el arrastre del deslizante), accesibilidad, responsive, robustez con medición en navegador; registrar resultados y pendientes en este documento. Se ejecuta cuando el autor lo indique.

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
| Capas compuestas grandes a la vez     | ≤ 6 (> 20 000 px²) en cada parada                               |
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
- [ ] La autoría y la licencia del GIF del Sol y de la imagen de la Tierra están confirmadas y, si se exige, el crédito aparece.

**Escala y zoom**

- [ ] En la parada de la Tierra (valor 0) la Tierra ocupa el visor como elemento principal y no se ven el Sol, las órbitas ni TON 618.
- [ ] En las 4 paradas el cociente entre el diámetro dibujado de dos elementos visibles cualesquiera coincide con el cociente real de `scaleGeometry.ts` con una tolerancia del 2 %, medido con `getBoundingClientRect` (los sprites de planetas son marcadores y se excluyen).
- [ ] Las 8 órbitas se dibujan a su radio relativo real (tolerancia 2 %) en la parada del Sistema solar.
- [ ] En la parada de TON 618 el círculo de TON 618 llena el visor y el Sistema solar queda reducido a menos de 6 px de diámetro en el centro (o no se dibuja).
- [ ] Mover el deslizante de 0 a 1000 hace un zoom-out continuo sin saltos visibles ni elementos que desaparezcan de golpe (comprobado por barrido paso a paso: la variación de zoom entre pasos consecutivos es constante en el logaritmo).
- [ ] Los botones de parada llevan al valor 0, 333, 667 y 1000 con una animación de ~1,2 s, y mover el deslizante a mano la cancela.

**Interacción**

- [ ] Cada parada muestra solo su tarjeta (`data-stop` cambia y nunca hay dos tarjetas a la vez); el cambio de parada ocurre al pasar por 167, 500 y 833 (±10).
- [ ] Con el foco en el deslizante: flechas ±10, `Home` va a 0, `End` a 1000, `PageUp`/`PageDown` a la parada anterior/siguiente.
- [ ] `aria-valuetext` del deslizante es el título de la parada activa y la región `aria-live` anuncia el cambio sin ruido durante el arrastre.
- [ ] Arrastrar el deslizante provoca 0 renders de `Scale` mientras no se cruza el umbral entre paradas (máx. 3 en un barrido completo) y 0 renders del visor (`memo`).

**Vídeo y recursos**

- [ ] El Sol se reproduce solo con la sección en pantalla y se pausa fuera de vista; no emite audio ni muestra controles; con `prefers-reduced-motion: reduce` se ve el póster.
- [ ] El navegador descarga un solo formato del Sol y pesa ≤ 0,3 MB.
- [ ] Los sprites y la Tierra no tienen halos negros en el borde sobre el fondo `#000` ni sobre las órbitas.
- [ ] Planetas, Tierra y Sol se ven nítidos en su parada en 1440×900 y en pantallas 2×.

**Accesibilidad**

- [ ] axe/Lighthouse: 0 violaciones; todo texto ≥ 4,5:1.
- [ ] Visor, imágenes y vídeo `aria-hidden`; `summary` accesible; deslizante y botones con nombre accesible, `:focus-visible` visible y áreas ≥ 44 px.
- [ ] Con `prefers-reduced-motion: reduce`: `document.getAnimations()` de la sección devuelve 0 y los saltos entre paradas son instantáneos.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [ ] Lighthouse móvil: Performance ≥ 90, CLS = 0.
- [ ] Durante el arrastre del deslizante: 0 Layout y 0 Paint tras calentar, y capas compuestas grandes ≤ 6 en cada parada.
- [ ] ≥ 95 % de los frames por debajo de 20 ms durante el arrastre y la animación de los botones (en dispositivo real si el entorno no tiene GPU).
- [ ] Con `data-inview="false"`, `document.getAnimations()` filtrado por la sección devuelve 0 animaciones en ejecución y el vídeo está en pausa.
- [ ] El JS de la sección ≤ 8 KB gz y el CSS ≤ 5 KB gz; los recursos nuevos cumplen el presupuesto.

**Verificación final**

- [ ] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz, arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Deslizante en lugar de scroll guiado.** Es el control que propone la idea original, es accesible con teclado y evita sumar scroll tras 500 y 300 unidades de Exploración y Ciencia. Por ello la sección no tiene track.
- **Cuatro paradas con la Tierra como origen.** Lo pidió el autor: da una referencia humana desde la que alejarse; Tierra → Sol → Sistema solar → TON 618 mantiene el contenido mínimo.
- **Escala real con interpolación exponencial del zoom.** Los tamaños relativos son honestos; el factor de zoom total (~10⁷) es inmanejable de forma lineal, así que el parámetro del deslizante es logarítmico.
- **Planetas como marcadores de tamaño fijo sobre órbitas a escala.** A escala real medirían menos de un píxel; la posición orbital sigue siendo real.
- **Sol en vídeo, no en WebP animado.** Reutiliza `useVideoPlayback`, que ya pausa fuera de vista y respeta reduced-motion; el recorte circular y el fondo negro hacen innecesario el canal alfa.
- **Sin rayo de luz.** El viaje de la luz y el tiempo que tarda se tratan con más detalle en la sección 05 — Tiempo (`docs/ideas/05-time.md`), que sigue a esta; aquí solo se compara el tamaño.
- **Imagen del Hero para TON 618.** Cero peso nuevo y coherencia visual con la web.
- **Corte simple con Ciencia.** Mismo fondo negro (`$scienceBg`); no se toca Ciencia ni se repite la metáfora del parpadeo.
- **Estado de React mínimo.** El valor continuo del deslizante va por `ref` + variable CSS; React solo conoce la parada activa.
- **Agentes por paso.** `cosmic-data-researcher` para datos, `web-motion-designer` para diseño, animación y prompts, `section-verifier` al final.

**Descartadas**

- **Scroll guiado.** Más cinematográfico, pero añade scroll y no tiene alternativa de teclado.
- **Escala logarítmica o saltos de zoom.** Restan impacto y distorsionan la comparación.
- **Comparación de masas (Sol, Sagitario A\*, TON 618) y datos destacados fuera de la tarjeta.** Contenido adicional a verificar; mejor en su propia sección.
- **Zoom-out desde el vídeo de Ciencia.** Es el patrón que ya se descartó en la SPEC 03 y acopla ambas secciones.
- **Parpadeo de párpados como transición.** Repetiría la metáfora de Ciencia y obligaría a tocarla.
- **Nombres de planetas en pantalla.** Más texto sin aporte a la comparación.

---

## Riesgos identificados

- **Rango extremo de escalas.** De la Tierra a TON 618 hay unos 10⁷ de factor; escalas ≈ 10⁻⁸ en elementos ocultos pueden dar imprecisión o capas enormes. Mitigar con visibilidad por rangos y elementos ocultos fuera de su zona; medir en el Paso 10.
- **Definición del tamaño de TON 618.** El círculo puede ser el horizonte de sucesos o la sombra (≈ 2,6× mayor); la imagen del Hero incluye el disco, así que hay que calibrar qué parte de la imagen es el círculo. El investigador fija la magnitud y el método en el Paso 2, y el cambio de masa (40–66 mil millones de M☉) puede alterar la cifra.
- **Licencia y autoría del GIF del Sol y de la imagen de la Tierra.** No se han comprobado; no publicar sin confirmarlo.
- **Sprites de planetas.** El tamaño fijo en px no es a escala; si se percibe como error, reducirlos a puntos o mostrarlos solo en la parada del Sistema solar.
- **Rendimiento en móviles de gama media.** Escena con muchos elementos en capas distintas y un vídeo; medir en dispositivo real.
- **Peso de los recursos.** 8 sprites + Sol + Tierra; el presupuesto es ajustado y se mide en el Paso 3.
- **Sin track de scroll.** La sección ocupa 100dvh; si la persona no mueve el control no ve la escala. El hint y el estado inicial deben invitar al gesto desde el primer instante.
- **Acoplamiento futuro con la navegación.** La sección ocupa 100dvh pegada al final de Ciencia; el `rootMargin` del `IntersectionObserver` del spec de navegación debe tenerlo en cuenta.

---

## Qué **no** está en este spec

- Comparación de masas (Sol, Sagitario A\*, TON 618) y datos numéricos destacados fuera de la tarjeta.
- Escala logarítmica, zoom libre y scroll guiado.
- Cambios en Hero, Exploración o Ciencia.
- Nombres de planetas, rótulos de «no a escala» y audio.
- Navegación completa, Navbar y Footer.
- El rayo de luz y el tiempo de viaje (sección 05 — Tiempo) y el experimento de gravedad (sección 06).
- Las secciones 5 y 6 en adelante, salvo lo indicado.

Cada una de estas cosas, si se hace, va en su propio spec.
