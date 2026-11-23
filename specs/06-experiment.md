# SPEC 06 — Experimento / Dentro de su gravedad

**Estado:** Approved
**Depende de:** SPEC 05 (y, por ella, SPEC 04, SPEC 03, SPEC 02 y SPEC 01)
**Fecha:** 2026-11-23
**Objetivo:** Portar el demo «Black Hole» a un motor TypeScript propio y construir con él la sección Experimento como sexta escena de la web: un agujero negro interactivo con lente gravitacional real, con deslizante de distancia, cuadrícula lensada, comparación entre el rayo de luz recto y el curvado, y una tarjeta de espaguetización que se deforma al acercarse; y con una transición de distorsión que parte del centro, que se ve en la propia sección que se va y es la misma al entrar y al salir.

Origen del contenido: `docs/ideas/06-experiment.md` (idea inicial, no vinculante). Para el motor, `docs/black-hole/README.md` y `docs/black-hole/source/` mandan sobre la idea. Datos y textos verificados por `cosmic-data-researcher`; diseño y animación por `web-motion-designer`; verificación final por `section-verifier`.

Recursos: **ninguno nuevo en imágenes ni vídeo.** El disco, el cielo y las estrellas se generan en código (procedurales, como en el demo).

**Créditos:** todos los créditos de todos los recursos del proyecto se declaran en el `README.md` del proyecto, no en pantalla. Este spec añade ahí el del demo «Black Hole» de Emergent Mind (origen: https://www.emergentmind.com/visualizations/black-hole). Su licencia hay que confirmarla con el autor antes de publicar; se deja anotada como pendiente, no se resuelve aquí. La licencia de la Tierra (SPEC 04) se hereda y también se acredita en el README.

---

## Alcance

### Incluido

**Motor** (siguiendo `docs/black-hole/README.md`)

- Port a TypeScript estricto, legible y sin `any` del demo `docs/black-hole/source/demo.js` y de lo que usa de `runtime.js` (bucle con `MAX_DT = 1/30`, `ResizeObserver`, DPR con tope `min(dpr, 1.25)`, eventos de puntero y teclado, `idle` a los 4 s). No se importan ni modifican los archivos fuente.
- Equivalencia visual con el demo: disco, sombra, anillo de fotones, cielo y estrellas lensadas, gas animado, inclinación automática, bloom y render progresivo, con las mismas constantes, fórmulas y LUTs.
- API externa del motor: `distance` (7–60, lectura y escritura), inclinación y azimut, deriva automática activable, `captureWheel` (por defecto `false`), `destroy()` sin fugas y compatible con StrictMode.
- **Añadidos al motor** (no están en el demo; se aíslan para no alterar la equivalencia con ambos desactivados):
  - `gridAmount` (0…1): mezcla en el pase de sombreado una cuadrícula de meridianos y paralelos sobre la dirección de salida del rayo (`bgU`, `bgV`) en lugar del cielo, de modo que el mismo trazado de rayos la curva.
  - `rayPath(impactParameter)`: función pura que devuelve los puntos del rayo curvado en el plano del rayo (misma ecuación `u'' = -u + 1,5u²`, RK4), para el diagrama.

**Sección**

- Componente `Experiment` (`<section id="experiment">`) montado en `App.tsx` tras `Time`. Es una sección normal: el stage ocupa `100dvh` y pasa con el scroll de la página; solo al final tiene una **cola pegajosa** (`$experimentFade`) en la que el stage queda fijo mientras se aplica la transición de salida.
- **Canvas del agujero negro** con foco por teclado (`tabindex="0"`, `aria-label`), órbita por arrastre horizontal (acimut) y teclado (flechas y `+`/`-`), sin capturar la rueda. La inclinación sigue siendo automática (`AUTO_TILTS`); con `touch-action: pan-y` el gesto vertical es siempre scroll de página.
- **Deslizante de distancia** (`<input type="range">`, escala logarítmica, rango 7–60, inicial 30), sincronizado con el motor y con `+`/`-`. Es la única fuente de verdad de la distancia; el scroll de la página no la modifica.
- **Dos conmutadores:** «Cuadrícula» (muestra la cuadrícula lensada, `gridAmount` 0 → 1 suave) y «Rayo de luz» (diagrama 2D con el rayo recto en discontinua frente al curvado por la gravedad, con la cámara a la distancia actual).
- **Tarjeta de espaguetización**, siempre visible, con una explicación breve (≤ 40 palabras). Al acercarse mucho, su texto se **deforma** (estiramiento vertical y estrechamiento, solo `transform`) en proporción a la cercanía; sin deformación con `prefers-reduced-motion`.
- **Transición de entrada y de salida (la misma):** la sección que se va se desvanece en su sitio, con su escenario pegado, mediante una distorsión tipo espaguetización que parte del centro y deja ver la siguiente debajo. Experimento la **recibe** de Tiempo al entrar y la **aplica** sobre sí misma al salir; se implementa una vez como mixin compartido y solo se usa en Tiempo → Experimento y en Experimento → la siguiente sección; las transiciones anteriores no cambian (ver «Transiciones»).
- Layout adaptado a escritorio y móvil (vertical y apaisado), con render progresivo y preparación diferida del cálculo inicial.
- Accesibilidad básica: textos y estado de los controles en el DOM, `summary` para lectores, `prefers-reduced-motion` detiene deriva y rotación del gas y la transición.
- Datos mínimos en `src/data/experiment.json`; interfaces en `src/interfaces/experiment.ts` y `src/interfaces/blackHole.ts`.
- **Créditos en `README.md`** del proyecto (demo de Emergent Mind, licencia pendiente, y el resto de recursos que ya existen sin crédito escrito).

### Excluido (otros specs)

- Web Worker para el cálculo inicial (solo se deja diferido; moverlo requiere confirmación aparte).
- Cuadrícula 3D real (malla de espacio-tiempo en perspectiva con «pozo»): se usa la cuadrícula lensada sobre el cielo. Ver «Decisiones».
- Control de la distancia con el scroll de la página, intro o hold de scroll.
- Control manual de inclinación en pantalla, selector de masa o de agujero negro, comparar con otros agujeros negros.
- Paso del observador por el horizonte, interior del agujero negro o cualquier simulación de caída.
- Audio.
- Rótulos de «representación artística» o «no a escala» y créditos en pantalla.
- Cambios en Hero y Exploración. En Tiempo solo su cola de transición (`$timeFade`) y el apilamiento (`z-index`); en Ciencia y Escala nada, salvo que el apilamiento obligue a un ajuste mínimo (ver «Transiciones»).
- La sección 07 — Evidencia y siguientes; la unión real de la salida con ellas se mide al crearlas.
- Navegación completa (rutas, `history.replaceState`, `React.lazy`), Navbar y Footer.
- Resolver la licencia del demo (queda como pendiente de publicación).

---

## Modelo de datos

### Interfaces del motor (`src/interfaces/blackHole.ts`)

Los tipos concretos los fija el port; como mínimo:

```ts
export interface BlackHoleOptions {
  preview?: number;          // factor de resolución interna del demo (conservado)
  maxDpr?: number;           // por defecto 1.25
  captureWheel?: boolean;    // por defecto false
  distance?: number;         // 7…60, por defecto 30
  autoDrift?: boolean;       // deriva de la cámara, por defecto true
  gridAmount?: number;       // 0…1, por defecto 0
  reducedMotion?: boolean;   // detiene deriva y rotación del gas
  onError?: (error: unknown) => void;
}

export interface BlackHoleControls {
  distance: number;          // lectura y escritura (7…60)
  azimuth: number;
  tilt: number;
  autoDrift: boolean;
  gridAmount: number;
  destroy: () => void;
}

export interface RayPoint { x: number; y: number }       // coordenadas del plano del rayo, en radios de Schwarzschild
export interface GeodesicTable { /* u(ψ) por fila, end, escape, peak */ }
export interface CameraState  { /* acimut, inclinación, distancia, idle */ }
export interface FrameBuffer  { /* Uint32Array y dimensiones */ }
```

### Interfaces y datos de la sección

Archivos: `src/interfaces/experiment.ts` y `src/data/experiment.json`. Solo contienen lo que se muestra en pantalla o se lee en lectores de pantalla (regla de limpieza al cerrar una sección).

```ts
// src/interfaces/experiment.ts
export interface ExperimentToggle {
  label: string;        // «Cuadrícula», «Rayo de luz»
}

export interface ExperimentTidalCard {
  kicker: string;       // p. ej. «Fuerzas de marea»
  title: string;        // «Espaguetización»
  body: string;         // ≤ 40 palabras, verificado y correcto para TON 618
}

export interface ExperimentData {
  title: string;        // h2 visible (p. ej. «Dentro de su gravedad»)
  subtitle: string;     // frase de una línea
  hint: string;         // invitación del estado inicial («Acércate al agujero negro»)
  summary: string;      // equivalente textual de la escena para lectores
  slider: { label: string; valueText: string }; // «Distancia»; plantilla para aria-valuetext (p. ej. «{value} radios de Schwarzschild»)
  grid: ExperimentToggle;
  ray: ExperimentToggle;
  rayLegend: { straight: string; bent: string };  // «Sin gravedad», «Con gravedad»
  tidal: ExperimentTidalCard;
}
```

Las constantes de presentación **no** van en el JSON: viven en `src/utils/experimentScale.ts` (distancia inicial y mínima, umbral y curva de `--tidal`, parámetro de impacto del rayo del diagrama) y en tokens SCSS (`$experimentBg` y los de la transición).

Convenciones:

- Distancia: radios de Schwarzschild (rs = 1), igual que el motor. El deslizante usa una escala logarítmica; rango 7–60, inicial 30 (el del demo).
- `--tidal` (0…1): variable CSS escrita por el hook directamente en la tarjeta, sin pasar por estado de React.
- `--progress` (0…1) de la transición: solo en el fallback; con `animation-timeline` lo resuelve CSS.

### Datos físicos que debe verificar `cosmic-data-researcher`

- Radio de Schwarzschild de TON 618 (≈ 66 mil millones de masas solares) y su tamaño comparable (ej. en UA): referencia para que el texto de la tarjeta sea honesto.
- **Espaguetización:** para un agujero negro supermasivo como TON 618 las fuerzas de marea en el horizonte son pequeñas y la espaguetización ocurre **dentro** del horizonte; en uno estelar ocurre antes de cruzarlo. El texto de la tarjeta no puede afirmar que en TON 618 se sería destrozado al acercarse desde fuera. La deformación visual del texto es una metáfora de la intensidad de las mareas y no debe presentarse como un hecho de lo que ocurriría a esa distancia.
- El texto de `summary` y la tarjeta no inventan cifras que el demo no modele (el demo es un agujero negro de Schwarzschild genérico sin escala física propia).

#### Datos verificados (Paso 6, consulta 2026-11-23)

**Masa de TON 618.** Discutida: ≈ 6,6·10^10 M☉ (Shemmer et al. 2004, ApJ 614, 547, línea Hβ; https://arxiv.org/abs/astro-ph/0406559) frente a ≈ 4,07·10^10 M☉ (Ge et al. 2019, revisión con C IV de los mismos datos, citada en https://en.wikipedia.org/wiki/TON_618; la revista exacta queda por confirmar). Redshift 2,219, luz de hace ≈ 10 800 millones de años. La tarjeta no usa la masa; basta decir «enorme». Si otro texto la cita, usar «decenas de miles de millones de masas solares».

**Radio de Schwarzschild** (rs = 2GM/c², G = 6,674·10^-11, c = 2,998·10^8 m/s, 1 UA = 1,496·10^11 m; calculado con Node):

| Masa | rs | rs en UA | rs / órbita de Neptuno (30 UA) |
| --- | --- | --- | --- |
| 6,6·10^10 M☉ | 1,95·10^11 km (195 mil millones de km) | ≈ 1 300 UA | ≈ 43 |
| 4,07·10^10 M☉ | 1,20·10^11 km | ≈ 800 UA | ≈ 27 |
| 10 M☉ | 29,5 km | — | — |

Nota: la cifra «1,3·10^12 km» del encargo es incorrecta; 1 300 UA son 1,95·10^11 km. Referencia con 66 mil millones: el horizonte es ≈ 43 veces el radio de la órbita de Neptuno (diámetro ≈ 2 600 UA).

**Marea en el horizonte** (diferencia de aceleración sobre L = 2 m, Δa ≈ 2GM·L / r³ con r = rs, es decir Δa = L·c^6 / (4G²M²) ∝ 1/M²):

| Agujero negro | Δa en el horizonte (2 m) | En g |
| --- | --- | --- |
| TON 618 (6,6·10^10 M☉) | ≈ 5·10^-12 m/s² | ≈ 5·10^-13 g |
| TON 618 (4,07·10^10 M☉) | ≈ 1·10^-11 m/s² | ≈ 1·10^-12 g |
| Estelar (10 M☉) | ≈ 2·10^8 m/s² | ≈ 2·10^7 g |

Cociente ≈ 4·10^19 entre ambos. Es una estimación newtoniana de orden de magnitud; la relatividad general da el mismo escalado (tensor de marea radial ≈ 2GM/r³ con r = rs). Concuerda con la explicación de Astronomy (https://www.astronomy.com/science/ask-astro-why-are-small-black-holes-more-dangerous-than-big-ones/), que usa otra longitud de cuerpo pero el mismo escalado 1/M² (≈ 10^16 para 10^8 de cociente de masas).

**Espaguetización en TON 618.** Ocurre dentro del horizonte: Δa crece como (rs/r)³ y alcanza ≈ 10^3 m/s² (≈ 100 g, límite letal) a r ≈ rs/(6·10^4), aprox. Desde el horizonte, la caída hasta la singularidad dura como máximo πGM/c³ = π·rs/(2c) ≈ 10^6 s ≈ 12 días (tiempo propio, caída radial desde el horizonte) para 6,6·10^10 M☉.

**Formulación de la tarjeta.** «La gravedad tira más fuerte de tus pies que de tu cabeza, y te estira. En un agujero negro estelar te destrozaría antes del horizonte; en TON 618, enorme, lo cruzarías sin notarlo.» (33 palabras). No afirma destrozo fuera del horizonte y no da cifras que el demo no modele. Se descartó una frase final que avisaba de que el texto se estira «por metáfora»: sería un rótulo en pantalla de los que el spec excluye; la propia explicación (en TON 618 no se nota la marea en el horizonte) deja claro que la deformación del texto es una metáfora visual.

---

## Recursos visuales

Poca interfaz alrededor de un único elemento protagonista. De atrás hacia delante:

| Elemento | Recurso | Notas |
| --- | --- | --- |
| Fondo | Color de la paleta (`$experimentBg`) | Continúa el cielo oscuro de Tiempo; no es negro puro |
| Agujero negro | `<canvas>` del motor (disco, sombra, anillo, cielo lensado, bloom) | Procedural en código; 0 KB de imágenes |
| Cuadrícula lensada | Dibujada por el motor en el pase de sombreado | Se mezcla con `gridAmount` |
| Rayo de luz | Diagrama SVG con la trayectoria recta (discontinua) y la curvada | Panel pequeño; se alterna con `opacity` |
| Control de distancia | `<input type="range">` estilizado como en Escala | Mueve la cámara del motor |
| Conmutadores | Dos botones `aria-pressed` | «Cuadrícula» y «Rayo de luz» |
| Tarjeta | Texto HTML con `--tidal` | Deformación solo con `transform` |
| Distorsión de transición | Capa SVG/CSS con anillos concéntricos y estrías radiales que parten del centro, más un velo radial | Solo `transform` y `opacity`; independiente del motor; mixin compartido por Tiempo y Experimento |

**Reglas heredadas:** solo `transform`/`translate`/`scale` y `opacity` animados por CSS (más `visibility` discreta); sin `filter` ni `backdrop-filter`; `will-change` solo mientras se mueve; animaciones y bucle del motor pausados con `data-inview="false"`. Mismos tokens de duración y easing que Escala y Tiempo.

---

## Comportamiento

### Layout

- **Desktop (`$sideBySide`):** el canvas ocupa el stage entero (≥ 100dvh) con el agujero negro centrado; título y subtítulo arriba a la izquierda; el deslizante y los conmutadores abajo; la tarjeta a un lado (derecha) y el diagrama del rayo en un panel compacto junto a ella, sin tapar el disco.
- **Móvil vertical:** el canvas ocupa la parte superior; deslizante, conmutadores y tarjeta debajo; el diagrama del rayo se apila sin solaparse con la tarjeta (lo decide `web-motion-designer` en el Paso 8). Texto ≥ 14 px. Usa `--viewportExtra` como Escala.
- **Móvil apaisado bajo:** título y subtítulo se ocultan al mostrarse los controles; ningún elemento tapa el disco ni sale de pantalla.
- Altura: el stage mide `100dvh` y su contenido debe caber en los viewports de referencia; la sección suma al final la cola pegajosa `$experimentFade` (≈ 50 svh) y entra con un solape sobre el final de Tiempo (margen negativo). Cifras orientativas; se calibran en el Paso 12.

### Interacción y estados

- **Distancia:** el deslizante, `+`/`-` sobre el canvas y el motor comparten una sola distancia que no pasa por estado de React; el deslizante refleja siempre su valor. El scroll de la página no la cambia.
- **Estado de React mínimo:** solo los dos booleanos de los conmutadores; el valor del deslizante, `--tidal` y la distancia van por refs y CSS.
- **Estado inicial:** distancia 30, deriva automática activa, cuadrícula y rayo apagados, hint visible hasta la primera interacción con el deslizante.
- **Cuadrícula:** al activar, `gridAmount` sube de 0 a 1 de forma suave (≈ 600 ms) y baja al desactivar; con reduced-motion cambia sin animación. La cuadrícula se curva con la lente; al acercarse se deforma más.
- **Rayo de luz:** al activar aparece el diagrama; muestra la cámara a la distancia actual, el agujero negro como círculo de radio 1, y desde la cámara dos trazos con el mismo parámetro de impacto: el recto discontinuo y el curvado por la gravedad. La leyenda va en `rayLegend`.
- **Tarjeta de espaguetización:** siempre visible. `--tidal` = 0 a partir de `TIDAL_START` (≈ 14 rs) y sube hasta 1 en la distancia mínima (7). La deformación: estiramiento vertical hasta ≈ 1,5× y estrechamiento horizontal hasta ≈ 0,8×, sin que el texto deje de ser legible (contraste ≥ 4,5:1 y glifos reconocibles). Reduced-motion: sin deformación.
- **Órbita:** arrastre horizontal cambia el acimut; teclado: flechas giran, `+`/`-` cambian la distancia. La inclinación sigue en automático.
- **Cálculo inicial diferido:** la tabla de geodésicas, la textura del disco y el cielo se construyen cuando la sección está a ≤ 1 viewport de entrar (IntersectionObserver con `rootMargin`), en trozos o en tiempo ocioso, no en el montaje. Mientras tanto el canvas muestra el fondo y el título; al estar listo hace un fundido corto.
- **Lectores de pantalla:** el canvas es `role="img"` con `aria-label` descriptivo y es focalizable solo para las teclas; el deslizante, los conmutadores y la tarjeta están en el DOM; `summary` solo para lectores.

### Transiciones

Una sola transición, la misma en la entrada y en la salida, y siempre **visible en la sección que se va**, con su escenario pegado (la sección no se desliza hacia arriba), como Ciencia → Escala y Escala → Tiempo. «Entrada» y «salida» son las dos caras del mismo efecto: lo que Tiempo hace al salir es lo que Experimento recibe al entrar, y lo que Experimento hace al salir lo recibirá la sección siguiente. El efecto no se aplica a ninguna otra transición.

- **Efecto:** una distorsión tipo espaguetización que parte del centro del stage: el escenario se estira y se desvanece en un anillo que se expande desde el centro (estrías radiales y anillos concéntricos con `scale` y `opacity`, más un velo radial), hasta dejar el stage en opacidad 0 con `visibility: hidden`. El diseño final lo fija `web-motion-designer`; solo `transform` y `opacity`.
- **Cola pegajosa:** cada sección que se va añade a su track una cola de `$xFade` svh con el stage pegado (`$timeFade` en Tiempo, `$experimentFade` en Experimento). Es el mismo patrón que `$scaleFade`.
- **Entrada de Experimento:** su stage se solapa bajo el de Tiempo con margen negativo; mientras la distorsión de Tiempo se abre desde el centro, bajo ella se descubre el agujero negro. La persona no necesita interactuar hasta que Tiempo queda `visibility: hidden`.
- **Salida de Experimento:** al terminar su contenido, el stage queda pegado durante `$experimentFade` y aplica la misma distorsión sobre sí mismo; la sección 07 se solapará bajo él con el mismo patrón. Hoy, al ser la última, el efecto se completa y la escena queda vacía al final de la página.
- **Mixin compartido:** el efecto y sus duraciones se definen una sola vez en un parcial de `src/styles/` y lo usan Tiempo y Experimento; mismos tokens de duración y easing que Escala y Tiempo.
- **Apilamiento:** durante el solape, Tiempo debe pintarse sobre Experimento. Hoy Ciencia tiene `z-index: 2`, Escala `1` y Tiempo ninguno; se elige la forma menos invasiva (p. ej. `z-index` negativo en Experimento) para no tocar Ciencia ni Escala.
- **Motor independiente:** la distorsión es una capa CSS/SVG; no escribe `gridAmount` ni toca el motor por fotograma.
- **Pausa:** el bucle del motor se pausa cuando la sección está fuera de vista o con el stage oculto (`useInView` y el mecanismo `data-faded` de Escala). El cálculo inicial arranca con un `rootMargin` que cubre también el solape, para que el agujero negro esté listo cuando Tiempo empiece a abrirse.
- Al volver hacia arriba todo se revierte sin saltos ni costuras.

### Reduced-motion

Sin cola pegajosa, sin solape y sin transición; la escena aparece ya compuesta (el track colapsa a `100dvh`, como en Tiempo). El motor arranca con deriva y rotación del gas detenidas. El deslizante y los conmutadores siguen funcionando (efecto instantáneo, sin interpolar `gridAmount`); la tarjeta no se deforma. `document.getAnimations()` de la sección devuelve 0.

### Sin `animation-timeline`

`useTrackProgress` escribe `--progress` y el CSS bajo `@supports not (animation-timeline: view())` reproduce la cola de transición con `clamp`, igual que en Tiempo. El resto de la sección (motor, deslizante, conmutadores, tarjeta) no depende de `animation-timeline`.

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional. Agentes: `cosmic-data-researcher` (paso 6), `web-motion-designer` (pasos 1, 4, 7, 8, 9, 10 y 11), `section-verifier` (paso 12); el port (pasos 2 y 3) y el README (paso 10) los hace el agente principal.

1. **Tokens y base.** En `_variables.scss`: `$experimentBg`, `$experimentFade` y `$timeFade`, y el parcial con el mixin compartido de la transición. Esqueleto de `src/utils/experimentScale.ts`.
2. **Motor: núcleo.** `src/interfaces/blackHole.ts` y `src/utils/blackHole/`: `constants.ts`, `geodesicTable.ts`, `diskTexture.ts`, `sky.ts`, `tracePass.ts`, `shadePass.ts`, `camera.ts`, `createBlackHole.ts`, siguiendo la propuesta de `docs/black-hole/README.md` (ajustable con justificación). Sin `any`, sin asignaciones por píxel ni por fotograma, comentarios cortos de la física. Cálculo inicial expuesto como función diferible y medido.
3. **Motor: hook y ciclo de vida.** `src/hooks/useBlackHole.ts`: liga canvas, bucle (`MAX_DT = 1/30`), `ResizeObserver`, DPR ≤ 1.25, puntero y teclado, pausa por `useInView`, reducción por `useReducedMotion`, `destroy()` y StrictMode sin dobles bucles. Prueba en una página temporal (no se deja en el proyecto) lado a lado con el demo original: disco con el lado Doppler brillante, arco lejano, anillo fino y estrellas curvadas.
4. **Sección estática.** `Experiment.tsx` y `Experiment.module.scss`: `<section id="experiment" aria-labelledby>`, `h2`, subtítulo, hint, `summary` para lectores, canvas, deslizante, conmutadores y tarjeta con textos provisionales; montada en `App.tsx` tras `Time`. Cálculo diferido por proximidad.
5. **Distancia y órbita.** Deslizante logarítmico ↔ motor, `+`/`-`, flechas y arrastre horizontal sobre el canvas, `touch-action: pan-y`, `captureWheel: false`.
6. **Datos.** `src/interfaces/experiment.ts` y `src/data/experiment.json` con textos verificados (`cosmic-data-researcher`): `title`, `subtitle`, `hint`, `summary`, `slider`, `grid`, `ray`, `rayLegend` y `tidal`; documentar en este spec las cifras de TON 618 y la formulación correcta de la espaguetización.
7. **Cuadrícula lensada.** `gridAmount` en `shadePass.ts`, conmutador con transición suave; sin cambios de salida del motor con `gridAmount = 0`.
8. **Rayo de luz.** `rayPath` en `utils/blackHole/`, diagrama SVG (recto discontinuo, curvado, círculo del agujero negro, cámara a la distancia actual) y conmutador; sin recalcular la trayectoria por fotograma (se cachea por distancia redondeada o se calcula una vez y se transforma).
9. **Tarjeta y efecto de marea.** `--tidal` escrito desde el hook de distancia, deformación con `transform`, sin deformación con reduced-motion, contraste verificado.
10. **Transición y créditos.** Mixin compartido de la distorsión desde el centro (`web-motion-designer`), aplicado a la cola pegajosa de Experimento (`$experimentFade`) y a la de Tiempo (`$timeFade`, cambio mínimo y localizado en `Time.module.scss`/`Time.tsx`); solape de Experimento con margen negativo, apilamiento, pausa del motor con `data-faded`, fallback con `useTrackProgress`. Añadir en `README.md` la sección de créditos con el demo de Emergent Mind (licencia pendiente) y los recursos ya existentes de otras secciones.
11. **Reduced-motion y limpieza.** Estado compuesto con reduced-motion, `data-inview` pausa el bucle; Prettier, lint, sin `!important`, sin `style={{}}` salvo valores dinámicos; revisar `experiment.json` e interfaces (ningún campo sin uso); eliminar lo que dejó de usarse.
12. **Revisión visual, calibración y verificación.** Capturas en los 8 viewports de referencia (320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900, 1920×1080); calibrar `TIDAL_START`, la composición del diagrama y la tarjeta y los parámetros de la transición; registrar valores finales aquí. Después, `section-verifier`: rendimiento (fps del canvas, tiempo del cálculo inicial, capas, Layout/Paint), accesibilidad, responsive y robustez (montar/desmontar/montar, StrictMode); registrar resultados y pendientes en este documento.

---

## Presupuesto

| Concepto | Límite |
| --- | --- |
| Recursos nuevos (imágenes, vídeo) | 0 KB |
| JS del motor y de la sección | ≤ 14 KB gz |
| CSS de los módulos de Experimento | ≤ 4 KB gz |
| `experiment.json` | ≤ 2 KB |
| Cálculo inicial (tabla, textura, cielo) | ≤ 400 ms en escritorio; sin bloquear > 50 ms seguidos (en trozos) |
| Fotogramas del canvas | ≥ 30 fps en escritorio; en móvil con CPU 4× ≥ 20 fps con render progresivo |
| Capas compuestas grandes a la vez | ≤ 6 (> 100 000 px²) en cada fase |
| Renders de React al interactuar con el deslizante | 0 |
| Lighthouse móvil | Performance ≥ 90 (el cálculo diferido no debe penalizar el TBT), CLS 0 |

---

## Criterios de aceptación

**Motor**

- [ ] Con `gridAmount = 0` y las mismas constantes, el motor coincide visualmente con el demo original en disco, sombra, anillo de fotones, cielo y estrellas lensadas, gas, inclinación automática, bloom y render progresivo (comparación lado a lado en `http://127.0.0.1` con `docs/black-hole/source/` servido estático).
- [ ] Sin `any` en `src/utils/blackHole/`, `src/hooks/useBlackHole.ts` ni `src/interfaces/blackHole.ts`; sin asignación de objetos por píxel ni por fotograma en los bucles calientes.
- [ ] `distance` se lee y escribe entre 7 y 60; con `captureWheel: false` la rueda hace scroll de la página; `destroy()` quita todos los listeners y el bucle.
- [ ] Montar, desmontar y volver a montar (y StrictMode) no genera errores en consola, listeners colgados ni dobles bucles.
- [ ] El tiempo del cálculo inicial está medido y registrado en este spec; no bloquea el hilo más de 50 ms seguidos.

**Contenido y estructura**

- [ ] `<section id="experiment">` existe, se monta tras `Time` en `App.tsx`, mide ≥ `100dvh`, tiene `aria-labelledby`, un `<h2>` visible y ningún `<h1>` nuevo.
- [ ] Todos los textos visibles salen de `experiment.json`; ninguno está escrito en el TSX.
- [ ] La tarjeta de espaguetización tiene ≤ 40 palabras y no afirma que en TON 618 se sería destrozado fuera del horizonte; las cifras tienen fuente verificada.
- [ ] No aparece ningún rótulo de «representación artística», «ilustrativo» ni «no a escala», ni créditos en pantalla.
- [ ] Los JSON e interfaces no contienen campos que ningún componente use.
- [ ] No hay scroll horizontal entre 320 y 2560 px de ancho.
- [ ] Ni el título, ni los controles, ni la tarjeta ni el diagrama se solapan entre sí ni salen de la pantalla, en los 8 viewports de referencia y en las posiciones de la escena (distancia inicial, mínima y máxima, con cuadrícula y con rayo activos).
- [ ] No hay `.scss` sueltos (solo `.module.scss`), ni `!important`, ni `style={{}}` salvo valores dinámicos; clases en camelCase; `prettier --check` limpio.
- [ ] `npm run build` y `npm run lint` terminan sin errores ni avisos nuevos.
- [ ] El `README.md` del proyecto contiene los créditos del demo de Emergent Mind y de los recursos del proyecto; la licencia del demo está marcada como pendiente de confirmar (bloqueante de publicación hasta resolverse).

**Interacción**

- [ ] El deslizante mueve la cámara de 60 a 7 de forma continua; `+`/`-` actualizan el deslizante; el scroll de la página no cambia la distancia.
- [ ] Los conmutadores «Cuadrícula» y «Rayo de luz» usan `aria-pressed`, funcionan con teclado y no afectan al scroll.
- [ ] Con «Cuadrícula» activa la cuadrícula se ve curvada por la lente cerca del disco y recta lejos de él; con ambos apagados la imagen es la del demo.
- [ ] Con «Rayo de luz» activo el diagrama muestra el rayo recto discontinuo y el curvado con el mismo parámetro de impacto; el origen del rayo cambia con la distancia.
- [ ] La tarjeta se deforma con `--tidal` > 0 solo a partir de `TIDAL_START`, alcanza su máximo en la distancia mínima, sigue siendo legible (contraste ≥ 4,5:1) y no se deforma con reduced-motion.
- [ ] El arrastre horizontal en el canvas orbita; el gesto vertical hace scroll de página en móvil; las flechas y `+`/`-` funcionan con el canvas enfocado.
- [ ] Con deriva activa y 4 s sin interacción la cámara deriva sola; con reduced-motion no deriva ni rota el gas.

**Transición**

- [ ] La transición Tiempo → Experimento y la de salida de Experimento usan el mismo mixin, duración y easing; se ven en la sección que se va, que no se desplaza verticalmente (`getBoundingClientRect().top` del stage constante durante la cola) y no deja costuras ni tramos vacíos.
- [ ] La distorsión parte del centro del stage y deja el stage en opacidad 0 y `visibility: hidden` al terminar; al volver hacia arriba se revierte sin saltos.
- [ ] Durante el solape el agujero negro ya está calculado y visible bajo Tiempo; Tiempo se pinta sobre Experimento y Ciencia y Escala siguen funcionando.
- [ ] Tiempo sigue funcionando (viaje, hitos, mensaje, hold); solo se añadió su cola de transición.
- [ ] La salida de Experimento se completa por sí sola al final de la página (escena vacía) y no genera scroll horizontal ni espacio sobrante.
- [ ] Con reduced-motion no hay cola, solape ni transición y `document.getAnimations()` de la sección devuelve 0.
- [ ] Sin `animation-timeline` la transición funciona vía `--progress` y la consola no muestra errores.

**Accesibilidad**

- [ ] axe/Lighthouse: 0 violaciones; el canvas tiene `role="img"` y `aria-label`; deslizante con `aria-valuetext`; el orden de lectura sigue el del DOM.
- [ ] El orden de Tab es: canvas, deslizante, conmutador «Cuadrícula», conmutador «Rayo de luz»; todos con foco visible; el canvas recibe las teclas.
- [ ] Con `prefers-reduced-motion: reduce` la escena aparece compuesta y no hay animaciones.
- [ ] Ningún destello supera 1 evento cada ~2 s.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [ ] Lighthouse móvil: Performance ≥ 90, CLS = 0 (medido con la sección en la página).
- [ ] Durante el scroll de entrada y de salida: 0 Layout; ningún Paint por frame; ≤ 6 capas compuestas > 100 000 px² en cada fase; 0 renders de React.
- [ ] ≥ 30 fps del canvas en escritorio y ≥ 20 fps en móvil con CPU 4×; el render progresivo reduce la resolución sin parpadeos.
- [ ] Con `data-inview="false"` el bucle del motor está detenido y no hay animaciones en ejecución.
- [ ] JS ≤ 14 KB gz, CSS ≤ 4 KB gz y 0 KB de recursos nuevos.

**Verificación final**

- [ ] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz, arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Un solo spec: motor + sección (autor).** El motor no existe en `src/` y la sección depende de su API; un solo contrato evita specs a medias. El motor se implementa primero y se verifica solo contra el demo.
- **Sección normal, sin track de scroll (autor).** Es un experimento para manipular, no una escena contemplativa guiada por scroll; la persona controla la distancia con el deslizante y el scroll sigue siendo solo scroll. Menos mecánica (sin sincronía scroll ↔ control) y sin conflicto táctil con el canvas. Lo único pegajoso es la cola de la transición.
- **La transición se ve en la sección que se va, y es la misma al entrar y al salir (autor).** Una distorsión tipo espaguetización que parte del centro y desvanece el stage pegado, con el mismo patrón de escenario pegado que Ciencia → Escala y Escala → Tiempo, pero con este efecto propio, que solo se usa en Tiempo → Experimento y en Experimento → la siguiente sección.
- **Mixin compartido.** El efecto se define una vez (parcial de `src/styles/`) y lo usan Tiempo y Experimento; la sección siguiente lo reutilizará para recibirlo.
- **Transición independiente del motor.** Una capa CSS/SVG con `transform` y `opacity`; no hay trabajo extra en el bucle del motor durante el scroll.
- **Cambio mínimo en Tiempo.** Solo su cola `$timeFade` y el apilamiento; Ciencia y Escala no se tocan si el `z-index` de Experimento lo permite.
- **Créditos solo en el `README.md` (autor).** Todos los recursos del proyecto se acreditan allí y no en pantalla, coherente con el contenido mínimo de la web.
- **Port fiel al demo con añadidos aislados.** `gridAmount` y `rayPath` se añaden sin alterar la equivalencia con ambos desactivados (principio de `docs/black-hole/README.md`: no «mejorar» la física ni el aspecto).
- **Cuadrícula lensada sobre el cielo en vez de una malla 3D.** Reutiliza el trazado de rayos del motor: la curvatura que se ve es la real, sin mallas adicionales ni un segundo render. Se acepta que la «cuadrícula tridimensional» de la idea sea una cuadrícula esférica vista a través de la lente.
- **Rayo de luz como diagrama 2D (autor).** El plano del rayo se resuelve exactamente con la ecuación del motor y comparar recto/curvado es inmediato en 2D; superponerlo sobre el canvas complicaría la proyección y las capas.
- **Tarjeta de espaguetización fija con deformación por cercanía (autor).** Convierte la explicación en parte de la experiencia; el efecto es una metáfora visual y el texto es correcto para TON 618 (ver «Datos físicos»).
- **`captureWheel: false` y `touch-action: pan-y`.** El canvas no atrapa el scroll de la página en escritorio ni en móvil; el arrastre solo orbita en horizontal.
- **Cálculo inicial diferido por proximidad, sin Web Worker.** Evita bloquear el hilo al cargar la página; el Worker queda fuera hasta confirmarlo (README del demo).
- **Cero recursos nuevos.** El disco, el cielo y las estrellas son procedurales.
- **Textos completos siempre en el DOM.** La accesibilidad no depende del scroll; el canvas es `role="img"`.
- **Agentes por paso.** `cosmic-data-researcher` para datos, `web-motion-designer` para diseño y animación, `section-verifier` al final.

**Descartadas**

- **Track pegajoso con intro, hold y distancia por scroll.** Más espectacular pero añade sincronía scroll ↔ deslizante y un fallback más complejo.
- **Transición de salida distinta de la de entrada.** Dos recursos que calibrar sin ganancia.
- **Transición en la sección que entra, con la anterior subiendo con el scroll normal.** Rompe el patrón de la web (la sección que se va se desvanece en su sitio).
- **Tres specs (motor, cuadrícula/rayo, sección).** Más fricción sin aportar contrato nuevo.
- **Superponer el rayo sobre el canvas del agujero negro.** Requiere proyectar el plano del rayo a la cámara y no mejora la comprensión frente al diagrama.
- **Malla 3D del espacio-tiempo («pozo») en perspectiva.** Es la imagen clásica, pero no es el efecto real de la lente y duplica el trabajo de render.
- **Solo demo + controles.** No cubre la comparación recto/curvado ni la deformación del espacio-tiempo de la idea.
- **Tarjeta que aparece solo al acercarse.** Se prefirió fija con deformación continua; es más descubrible y accesible.
- **Rueda capturada para el zoom del motor.** Atrapa el scroll de la página; el zoom lo da el deslizante.
- **Control manual de inclinación en pantalla.** Más controles; la inclinación automática del demo basta.
- **Web Worker para la tabla de geodésicas.** Requiere confirmación aparte (README del demo).
- **Créditos en pantalla.** Contradice el contenido mínimo del proyecto.

---

## Riesgos identificados

- **Cálculo inicial.** La tabla (1120 filas × 789 muestras con RK4), la textura del disco y el cielo (26 000 estrellas) pueden bloquear el hilo en móvil. Mitigar con cálculo diferido por proximidad, en trozos, y medirlo con CPU 4×.
- **Rendimiento del canvas en móvil.** Trazado y sombreado por píxel en CPU. Mitigar con los factores `preview` y el tope de DPR del original y con el render progresivo; medir fps con CPU limitada.
- **Conflicto táctil.** Orbitar con el dedo frente a hacer scroll. Mitigar con `touch-action: pan-y` y órbita solo horizontal; si resulta incómodo, dejar la órbita solo por teclado en móvil.
- **Fidelidad del mensaje físico.** La deformación del texto sugiere mareas fuertes a 7 rs, falso para TON 618 en el horizonte. Mitigar con el texto de la tarjeta (verificado por `cosmic-data-researcher`) y el carácter metafórico del efecto.
- **Salida sin sección siguiente.** Hasta que exista la 07, la cola de salida termina en una escena vacía al final de la página; la unión con la siguiente sección (solape, `rootMargin` de la navegación) se mide cuando exista.
- **Acoplamiento con Tiempo.** El solape y el fundido dependen de `$timeFade`, `$experimentFade` y del margen negativo de Experimento; cambiar uno obliga a revisar el otro (igual que Escala ↔ Tiempo). El apilamiento (`z-index`) entre Tiempo y Experimento debe resolverse sin romper Ciencia ni Escala.
- **Interacción durante el solape.** Experimento está montado y visible bajo Tiempo mientras este se desvanece; mitigar con `pointer-events` y `visibility` de Tiempo oculto al terminar, y sin controles necesarios hasta entonces.
- **Cola pegajosa con alturas pequeñas.** Si el contenido del stage supera `100dvh`, parte queda oculta durante la cola; verificar en los viewports bajos y, si hace falta, reducir `--stem`/espaciados.
- **Licencia del demo.** El código de Emergent Mind requiere confirmar la licencia con el autor antes de publicar (pendiente declarado).
- **Licencia de la Tierra.** Heredada de SPEC 04 (NASA; confirmar nota de crédito antes de publicar).
- **StrictMode y ciclo de vida.** Doble montaje con bucle y listeners; verificado en el Paso 3 y por el verificador.
- **Contraste del texto sobre el canvas.** El disco y el bloom cambian de brillo con la cámara; medir contraste sobre píxeles renderizados en varias distancias.
- **Soporte de `animation-timeline`.** Sin él la transición depende del fallback; se acepta el corte limpio.

---

## Qué **no** está en este spec

- Web Worker, malla 3D del espacio-tiempo, caída al agujero negro, selector de masa, audio.
- Control de la distancia por scroll y track de scroll con intro o hold.
- Cambios en Hero y Exploración; en Tiempo solo su cola de transición y el apilamiento.
- Resolver la licencia del demo.
- La sección 07 — Evidencia y siguientes, y la unión real de la salida con ellas.
- Navegación completa, Navbar y Footer.

Cada una de estas cosas, si se hace, va en su propio spec.
