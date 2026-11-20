# SPEC 03 — Ciencia / Anatomía de un monstruo

**Estado:** Approved
**Depende de:** SPEC 02 (y, por ella, SPEC 01)
**Fecha:** 2026-11-20
**Objetivo:** Implementar la sección Ciencia como tercera escena de la web: tras el zoom final de Exploración, una intro guiada por scroll aleja la cámara del agujero negro hasta revelar la ilustración completa de un cuásar, con cuatro puntos interactivos (horizonte de sucesos, disco de acreción, lente gravitacional y chorros relativistas) que acercan la cámara a esa parte y muestran su tarjeta.

Origen del contenido: `docs/ideas/03-science.md`. Datos y textos verificados por el agente `cosmic-data-researcher`; diseño, animación y prompts de imagen por el agente `web-motion-designer`; verificación final por el agente `section-verifier`.

---

## Alcance

### Incluido

- Componente de sección `Science` (`<section id="science">`) montado en `App.tsx` tras `Exploration`.
- **Intro con continuidad de zoom:** track sticky corto que empieza con el mismo fotograma que el final de Exploración (agujero negro en círculo, mismo fondo y estrellas) y, con el scroll, hace zoom-out hasta la ilustración completa del cuásar.
- **Ilustración del cuásar:** una imagen generada con IA (WebP con alfa, el negro pasa a transparencia) más capas SVG/CSS interactivas. Mismo balance que la SPEC 02.
- **Cuatro puntos interactivos** (marcadores `<button>`): horizonte de sucesos, disco de acreción, lente gravitacional, chorros relativistas. Al pulsar uno, la cámara se acerca a esa parte (`transform`) y aparece su tarjeta; un control permite volver a la vista completa.
- **Animación explicativa** dentro del punto «Disco de acreción»: el material que cae se calienta y brilla mientras el horizonte permanece negro (por qué el agujero negro no emite luz, pero su entorno sí).
- Estado inicial: vista completa con los cuatro marcadores pulsantes, título y una invitación breve; sin tarjeta abierta.
- Una tarjeta a la vez, con el estilo de las tarjetas de la SPEC 02 (kicker, título, respuesta ≤ 40 palabras).
- Accesibilidad: marcadores y navegación entre puntos con teclado, `Esc` para volver, gestión del foco.
- Comportamiento completo con `prefers-reduced-motion: reduce`.
- Datos mínimos en `src/data/science.json` con interfaces en `src/interfaces/science.ts`.
- Fallback sin `animation-timeline` (generalizando el hook `useTrackProgress`).

### Excluido (otros specs)

- Cualquier cambio visual o de contenido en Hero y Exploración (la continuidad se resuelve solo desde Ciencia; ver «Decisiones»).
- Zoom libre del usuario (rueda, pellizco, arrastre) y scroll guiado de punto en punto.
- Elementos adicionales del cuásar (toro de polvo, corona, regiones de líneas anchas) y datos numéricos destacados por punto.
- Las secciones 4 en adelante (masa, luminosidad, etc.).
- Navegación completa (rutas, `history.replaceState`, `React.lazy`), Navbar y Footer.
- Audio.
- Imágenes astronómicas reales.
- Rótulos de «representación artística» o de escala en pantalla (criterio de contenido mínimo de las secciones anteriores). A cambio, los textos son generales («en un cuásar…») y no afirman rasgos de TON 618 que no estén verificados.
- Los pendientes de verificación de la SPEC 02 (ya corregidos según el autor; no se tocan aquí).

---

## Modelo de datos

Archivos: `src/interfaces/science.ts` y `src/data/science.json`. Solo contienen lo que se muestra en pantalla o se lee en lectores de pantalla (regla de limpieza al cerrar una sección).

```ts
// src/interfaces/science.ts
export type SciencePointId = 'horizon' | 'disk' | 'lens' | 'jets';

export interface SciencePoint {
  id: SciencePointId;
  order: number;
  kicker: string; // p. ej. «El límite»
  title: string; // nombre del punto: «Horizonte de sucesos», «Disco de acreción», «Lente gravitacional», «Chorros relativistas»
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

| Punto                  | Idea                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| Horizonte de sucesos   | El límite a partir del cual nada, ni siquiera la luz, puede escapar.                                         |
| Disco de acreción      | Gas y materia que orbitan y se calientan intensamente. El agujero negro no emite luz; el material que cae sí. |
| Lente gravitacional    | La gravedad desvía la luz y deforma lo que se observa (el disco lejano se ve curvado sobre el agujero).      |
| Chorros relativistas   | Haces de partículas lanzados casi a la velocidad de la luz que se observan en muchos cuásares.               |

---

## Ilustración

Principio de la SPEC 02: la imagen aporta realismo; el SVG/HTML/CSS aporta interactividad y movimiento. La imagen **no es un fondo**: es un elemento sin fondo (negro → alfa, procesado con `sharp` desde un directorio temporal, sin dependencia nueva). Los prompts los redacta `web-motion-designer` y la imagen la genera el autor.

**Imagen** `src/assets/images/science/quasar-1536.webp` (1536×1536, ≤ 220 KB, alfa), composición cuadrada con restricciones propias de la continuidad:

- Agujero negro en el centro (500, 500 en un viewBox de 1000), mismo estilo, ángulo (~75°) y paleta que `ton618-blackhole-1024.webp` del Hero.
- El conjunto agujero + disco ocupa ~32 % del ancho (el agujero ~8,4 %), con la proporción disco/agujero de la imagen del Hero (≈ 3,9). Esto hace que, escalada ×2,5 (`$zoomOut`), el agujero coincida con el del último nivel de Exploración (21 % de su capa).
- Dos chorros casi verticales hacia arriba y abajo que llegan hasta ~±46 % del alto y quedan dentro del círculo del mapa. Sin estrellas ni nebulosas de fondo, sin texto.
- La lente gravitacional (arco del disco lejano sobre y bajo la sombra) forma parte de la imagen.

**Capas** (de atrás hacia delante), dentro de un «visor» circular (`clip-path: circle(50%)` estático, igual que el nivel 4 de Exploración, de modo que el primer fotograma sea idéntico):

| Capa                | Contenido                                                                                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estrellas           | Capa persistente (`_starfield.scss`) fija en la escala final de Exploración (1,15) + puntos SVG centelleantes en **un solo grupo** (solo `opacity`).                    |
| Capa de entrada     | `TonLayer` de Exploración (agujero negro de la imagen del Hero con su campo estelar), reutilizado o extraído a un componente compartido; sin duplicar imagen ni estrellas. |
| Cámara              | `div` único con `transform` (`translate` + `scale`) que contiene la imagen del cuásar y las superposiciones de cada punto. Estado por `data-point` y CSS, sin estilos en línea. |
| Superposiciones     | Una por punto, visibles solo con ese punto activo (`opacity`): horizonte (anillo discontinuo sobre la sombra), disco (flujo de partículas), lente (rayos curvados), chorros (pulsos que recorren el eje). |
| Marcadores y UI     | Marcadores, `PointNav` y tarjeta fuera de la cámara (no escalan).                                                                                                     |

**Animación del disco (explicativa):** como máximo ~24 partículas HTML/SVG repartidas en 3 anillos concéntricos (frío ámbar tenue en el exterior, ámbar brillante en el medio, blanco-dorado en el interior). Cada anillo rota (`rotate`) y se contrae (`scale`) hacia el agujero, y el brillo crece hacia dentro por `opacity` de anillos superpuestos; ninguna partícula entra en la sombra del horizonte, que queda negra. Solo `transform` y `opacity`; sin `offset-path`, `stroke-dashoffset` ni `filter` (decisiones de la SPEC 02). Se anima solo con el punto «Disco» activo y la sección en vista.

**Reglas heredadas de la SPEC 02:** solo `transform` y `opacity` animados; sin `filter`, `backdrop-filter`, `mix-blend-mode`; `will-change` solo en la cámara mientras se mueve; animaciones de estrellas en un único grupo por capa (lección de la verificación: un `<path>` animado = una capa compuesta); animaciones pausadas con `data-inview="false"`.

---

## Comportamiento

### Layout (misma geometría que Exploración, para que el primer fotograma coincida)

- **Desktop (`$sideBySide`):** visor cuadrado `$mapSizeDesktop` centrado en (34vw, 50svh); tarjeta a la derecha (`$cardWidth`, mismos márgenes y estilo que la SPEC 02). Título y hint arriba a la izquierda sobre el visor o debajo del visor, sin tapar la sombra del horizonte.
- **Móvil y tablet:** visor `$mapSizeMobile` con centro a 34svh del borde superior; tarjeta abajo; `--viewportExtra` como en Exploración.
- `PointNav` (visible solo con un punto activo): 4 botones (uno por punto, el activo con `aria-pressed="true"`) y «Vista completa»; áreas ≥ 44 px.

### Track e intro

Track = 100dvh + 200 unidades de recorrido (`$scienceTravel`), con la misma unidad `--explUnit` (1svh en side-by-side, 0,6svh en móvil vertical). `x` en unidades desde que el sticky se pega:

| Evento                                                          | x          |
| --------------------------------------------------------------- | ---------- |
| Capa de entrada (`TonLayer`): escala 1 → 0,4; opacidad 1 hasta el 60 % del tramo y luego → 0 | 0 → 110    |
| Imagen del cuásar: escala 2,5 → 1; opacidad 0 → 1 entre el 20 % y el 60 % del tramo        | 0 → 110    |
| Título y hint: opacidad + `translate` de entrada                | 70 → 110   |
| Marcadores: aparecen y empiezan a pulsar; la sección pasa a `data-ready="true"` | 90 → 110   |
| Hold (la escena queda lista para explorar)                      | 110 → 200  |

Es el cruce de niveles de la SPEC 02 al revés (zoom-out): nunca hay dos capas con opacidad intermedia a la vez. Con `data-ready="false"` los marcadores no son interactivos; si la persona vuelve hacia atrás a `x < 110`, el punto activo se cierra.

### Interacción

- **Estado:** un único `useState<SciencePointId | null>` en `Science`. Un clic = un render; las capas pesadas van en `memo`.
- **Cámara:** `data-point` en el contenedor; el CSS define `translate`/`scale` por punto desde `$sciPoints` y anima con `transition: transform 1100ms $easeCinematic`. Valores iniciales, a calibrar con la imagen real: horizonte ×3 al centro; disco ×2 al centro; lente ×2,2 desplazada hacia el arco superior; chorros ×1,8 desplazada hacia el chorro superior. Cada objetivo coloca la parte elegida en el centro del visor, lejos de la tarjeta.
- **Marcadores:** `<button>` con nombre accesible = `title` del punto; se atenúan (`opacity`) mientras hay un punto activo; el cambio entre puntos se hace con `PointNav`.
- **Tarjeta:** entra con `opacity` + `translate` ($cardShift); una sola visible; con el cambio de punto se intercambian sin que haya dos a la vez.
- **Teclado y foco:** al abrir un punto el foco pasa al título de su tarjeta (`tabindex="-1"`); `Esc` o «Vista completa» cierran el punto y devuelven el foco al marcador; Tab recorre marcadores → `PointNav`.
- **Lectores de pantalla:** el visor y sus capas son `aria-hidden`; `summary` es texto solo para lectores; la tarjeta abierta es una región con `aria-labelledby` (el cambio de punto se anuncia con `aria-live="polite"` en el contenedor de la tarjeta).

### Reduced-motion

`.track` colapsa a 100dvh sin sticky; la ilustración se ve completa (sin intro ni `TonLayer`); sin pulso, centelleo, flujo del disco ni rayos animados; la cámara se mueve de forma **instantánea** al pulsar (acción de la persona, no animación automática); `document.getAnimations()` de la sección devuelve 0.

### Sin `animation-timeline`

`useTrackProgress` (generalizado: recibe las refs de la sección y del track y deja de mencionar Exploración en su documentación) escribe `--progress`; el CSS bajo `@supports not (animation-timeline: view())` reproduce la tabla anterior.

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional. Agentes: `cosmic-data-researcher` (pasos 2), `web-motion-designer` (pasos 3, 5, 7 y 8), `section-verifier` (paso 11).

1. **Tokens y base.** En `_variables.scss`: `$scienceTravel: 200`, `$scienceReady: 110`, `$quasarIntroScale: 2.5`, `$motionCamera: 1100ms`, mapa `$sciPoints` (posición del marcador y objetivo de cámara por punto), mixin/función de altura y rango del track de Ciencia (análogos a `explorationTrackHeight` y `exploRange`, con `--explUnit`). Generalizar el comentario y la firma de `useTrackProgress` si hace falta.
2. **Datos.** `src/interfaces/science.ts` y `src/data/science.json` con textos verificados (agente `cosmic-data-researcher`): cuatro puntos, `title`, `hint` y `summary`. Incluir en el informe qué afirmaciones se pueden hacer sobre chorros en TON 618 y cuáles no.
3. **Imagen y prompts.** `web-motion-designer` redacta el prompt de la imagen del cuásar (con las restricciones de composición de «Ilustración») y las superposiciones; el autor la genera; se procesa el fondo a alfa y se guarda como `src/assets/images/science/quasar-1536.webp` (≤ 220 KB).
4. **Sección estática.** `Science.tsx` y `Science.module.scss`: `<section id="science" aria-labelledby>`, `h2` visible, hint, `summary` solo lectores, track + stage sticky (`dvh` con `vh` de respaldo), tarjetas como `<article>`; montada en `App.tsx` tras `Exploration`. El stage usa `$scene2Bg` y la capa de estrellas a escala 1,15.
5. **Escena e intro.** Visor circular con `TonLayer` (reutilizado/extraído) y la imagen del cuásar dentro de la cámara; animaciones de la tabla «Track e intro» con `animation-timeline: view()` sobre el track de Ciencia. Verificar que el fotograma en x = 0 coincide con el final de Exploración.
6. **Puntos, cámara y tarjetas.** `PointMarkers`, `PointCard` y `PointNav`; estado, `data-point`, transiciones de la cámara, tarjeta única, `Esc`, foco y `data-ready`.
7. **Superposiciones.** Horizonte, disco (animación explicativa), lente y chorros, cada una activa solo con su punto y con la sección en vista (`useInView` y `data-inview`).
8. **Fallback y reduced-motion.** `useTrackProgress` para navegadores sin timeline nativo; reglas de reduced-motion.
9. **Estilo y limpieza.** Prettier, lint, sin `!important`, sin `style={{}}` salvo valores dinámicos; revisar `science.json` e interfaces (ningún campo sin uso).
10. **Revisión visual y de contenido.** Capturas en los 8 viewports de referencia; comprobar solapes con la sombra del horizonte y con la tarjeta; calibrar objetivos de cámara.
11. **Verificación con `section-verifier`.** Rendimiento, accesibilidad, responsive, animaciones y robustez, con medición en navegador; registrar resultados y pendientes en este documento.

---

## Presupuesto

| Concepto                          | Límite                                          |
| --------------------------------- | ----------------------------------------------- |
| Imagen nueva                      | ≤ 220 KB (`quasar-1536.webp`)                   |
| JS del chunk de Ciencia           | ≤ 10 KB gz                                      |
| CSS de los módulos de Ciencia     | ≤ 6 KB gz                                       |
| `science.json`                    | ≤ 3 KB                                          |
| Nodos SVG / HTML                  | ≤ 80 / ≤ 70 (sin contar los puntos de cada `<path>`) |
| Capas compuestas a la vez         | ≤ 4 (cámara, capa de entrada, estrellas, tarjeta)   |
| Trabajo por frame al hacer scroll | solo composite (0 Layout, 0 Paint) con la intro en curso |
| Lighthouse móvil                  | Performance ≥ 90, CLS 0                         |

---

## Criterios de aceptación

**Contenido y estructura**

- [ ] `<section id="science">` existe, se monta tras `Exploration` en `App.tsx`, tiene `aria-labelledby`, un `<h2>` visible y un `<h3>` por tarjeta; no hay ningún `<h1>` nuevo.
- [ ] Todos los textos visibles salen de `science.json` (salvo los fijos de `PointNav`); ninguno está escrito en el TSX.
- [ ] Hay 4 puntos en el orden horizonte → disco → lente → chorros; cada respuesta tiene ≤ 40 palabras y ≤ 220 caracteres.
- [ ] No aparece ningún rótulo de «representación artística», «ilustrativo» ni «no a escala», ni en pantalla ni en `summary`; ningún texto afirma un rasgo de TON 618 sin fuente verificada.
- [ ] Los JSON e interfaces no contienen campos que ningún componente use.
- [ ] No hay scroll horizontal entre 320 y 2560 px de ancho.
- [ ] Ni el texto ni las tarjetas tapan la sombra del horizonte en 320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900 y 1920×1080.
- [ ] No hay archivos `.scss` sueltos (solo `.module.scss`), ni `!important`, ni `style={{}}` salvo valores dinámicos; clases en camelCase; el código pasa `prettier --check`.
- [ ] `npm run build` termina sin errores de TypeScript ni de lint.

**Intro y continuidad**

- [ ] Con el sticky recién pegado (x = 0) el agujero negro de Ciencia coincide con el del final de Exploración: mismo centro y mismo diámetro (±2 px) en 1440×900 y 390×844, mismo fondo `$scene2Bg`, sin saltos de color.
- [ ] En x = 110 (±10) la ilustración del cuásar se ve completa a escala 1 y la sección tiene `data-ready="true"`; antes, los marcadores no son interactivos.
- [ ] Durante el cruce nunca hay dos capas con `opacity` intermedia a la vez (`getComputedStyle` o grabación frame a frame).
- [ ] En móvil vertical el recorrido usa la unidad 0,6svh y las paradas (0, 90, 110, 200) siguen sincronizadas; con las barras del navegador visibles y ocultas no asoma la sección siguiente ni queda hueco, y CLS = 0.
- [ ] Sin `animation-timeline`, el efecto funciona vía `--progress` y la consola no muestra errores.
- [ ] Solo se animan `transform` y `opacity`.

**Interacción**

- [ ] Pulsar cada marcador (clic, toque, Enter o Espacio) activa su punto: `data-point` cambia, la cámara se acerca a la parte correcta y se muestra solo su tarjeta.
- [ ] El flujo del disco se ve únicamente con «Disco de acreción» activo; la sombra del horizonte permanece negra durante la animación.
- [ ] `Esc` y «Vista completa» devuelven a la vista completa y el foco regresa al marcador; `PointNav` permite pasar de un punto a otro sin volver.
- [ ] Con un punto activo, la parte ampliada no queda bajo la tarjeta ni sale del visor circular en los 8 viewports de referencia.
- [ ] Volver atrás a x < 110 cierra el punto activo y desactiva los marcadores.
- [ ] Un clic provoca como máximo 1 render de `Science` y 0 de las capas del visor (`memo`).

**Accesibilidad**

- [ ] axe/Lighthouse: 0 violaciones; todo texto ≥ 4,5:1 (incluidas las etiquetas de los marcadores sobre la imagen).
- [ ] Visor e imágenes `aria-hidden`; `summary` accesible; los 4 marcadores tienen nombre accesible y se alcanzan con Tab con `:focus-visible` visible y áreas ≥ 44 px.
- [ ] El cambio de punto se anuncia (`aria-live`) sin ruido durante el scroll.
- [ ] Con `prefers-reduced-motion: reduce`: `document.getAnimations()` de la sección devuelve 0, `.track` no es sticky, la ilustración se ve completa y la cámara cambia sin transición.
- [ ] Ningún destello supera 1 evento cada ~2 s; el centelleo es lento (≥ 4,2 s por ciclo).

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [ ] Lighthouse móvil: Performance ≥ 90, CLS = 0.
- [ ] Durante el scroll de la intro y estable en el hold: 0 Layout y 0 Paint tras calentar; capas compuestas ≤ 4 (se mide cuántas hay en cada estado).
- [ ] ≥ 95 % de los frames por debajo de 20 ms durante la intro y el movimiento de cámara (en dispositivo real si el entorno no tiene GPU).
- [ ] Con `data-inview="false"`, `document.getAnimations()` filtrado por la sección devuelve 0 animaciones en ejecución.
- [ ] La imagen nueva pesa ≤ 220 KB; el JS de la sección ≤ 10 KB gz y el CSS ≤ 6 KB gz.
- [ ] La imagen se ve nítida con la cámara al máximo (×3) en 1440×900 y en pantallas 2×; si no, se baja el máximo de la cámara o se regenera con más resolución.

**Verificación final**

- [ ] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz, arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Ilustración con IA + SVG/CSS.** Mismo balance que la SPEC 02: la imagen da impacto; las superposiciones dan interactividad. SVG puro se vio demasiado esquemático.
- **Cuatro puntos, con chorros relativistas.** Los chorros son el rasgo más espectacular de un cuásar; el toro de polvo queda fuera para no saturar de texto.
- **Mecánica de clic con la cámara, no scroll guiado.** Es lo que describe la idea original, evita sumar más scroll tras 500svh de Exploración y es accesible con teclado. El único tramo guiado por scroll es la intro.
- **Intro pegada en Ciencia (continuidad de zoom).** Ciencia toma el relevo con el mismo fotograma que el final de Exploración y hace zoom-out. No modifica la SPEC 02 ni acopla ambas secciones. Es el cruce de niveles de Exploración al revés, así que reutiliza sus reglas de zoom y de opacidad.
- **Mismo visor circular y misma geometría que el nivel 4.** Garantiza que el primer fotograma coincida y respeta la decisión de ilustraciones circulares de la SPEC 02.
- **La imagen del cuásar tiene el agujero negro a escala 1/2,5.** Con `$quasarIntroScale = 2.5` coincide con el último nivel de Exploración; el prompt se redacta con esa restricción.
- **Cámara por `data-point` y CSS.** Sin estilos en línea ni estado de scroll; un solo render por clic.
- **Marcadores como `<button>` y `PointNav` solo con punto activo.** Evita recalcular la posición de los marcadores con la cámara ampliada y mantiene el cambio de punto accesible.
- **Una tarjeta a la vez junto a la ilustración.** Mismo patrón de las tarjetas de Exploración; un popover anclado taparía la ilustración en móvil.
- **Estado inicial con vista completa y hint.** Invita a explorar; no hay tarjeta abierta por defecto.
- **Animación del disco dentro del punto «Disco de acreción».** Responde a «por qué no brilla el agujero pero sí su entorno» sin añadir controles.
- **Solo texto ≤ 40 palabras por punto.** Contenido mínimo; las cifras de masa y luminosidad se dejan a secciones futuras.
- **Sin rótulos de «representación artística».** Criterio vigente del proyecto; los textos son generales para no afirmar lo no verificado.
- **Pendientes de la SPEC 02 fuera de alcance.** Ya resueltos según el autor; esta spec evita repetirlos (centelleo en un solo grupo, animaciones solo con la sección en vista).
- **Agentes por paso.** `cosmic-data-researcher` para datos, `web-motion-designer` para diseño e imagen, `section-verifier` al final.

**Descartadas**

- **Ampliar el track de Exploración con una quinta capa.** Modificaría la SPEC 02 (capas, tabla de scroll, `LevelNav`) y acoplaría ambas secciones.
- **Superposición del stage de Ciencia sobre el de Exploración (`margin-top` negativo) para una costura perfecta.** El stage de Ciencia taparía el de Exploración antes de pegarse y obligaría a desvanecer la tarjeta 4 y `LevelNav`; se acepta el efecto «transportador» (dos escenas que suben juntas) y que la continuidad empiece al pegarse el sticky.
- **Scroll guiado de punto en punto.** Más cinematográfico, pero suma scroll y complejidad.
- **Popover anclado al punto.** Problemas de colisión y de tapar la ilustración en móvil.
- **Animación explicativa como intro automática o como botón aparte.** Fuerza a verla o añade un control extra.
- **Animar `clip-path` para abrir el círculo.** Repinta; la imagen con alfa y el cruce por `opacity` logran el mismo efecto.
- **Dato numérico destacado por punto.** Más datos que verificar y adelanto de contenido de otras secciones.
- **`offset-path` y `stroke-dashoffset` para las partículas y los rayos.** Repintan en cada frame.

---

## Riesgos identificados

- **Acierto de la imagen generada.** La composición (agujero pequeño con disco al 32 %, chorros dentro del círculo, mismo estilo que el Hero) es exigente. Si el generador no la cumple, se compone el chorro en SVG/CSS con degradados o se regenera; el calibrado de `$quasarIntroScale` y de los objetivos de cámara depende de la imagen final.
- **Nitidez al ampliar.** Con la cámara ×3 y un visor de ~806 px, una imagen de 1536 px rinde ~1,6 px por px de pantalla; en pantallas 2× puede verse blanda. Mitigar con un máximo de cámara menor, o más resolución si el generador lo permite (la versión gratuita limita a 1024 px: valorar entonces ×2,5 y 1024 px).
- **Rigor científico de los chorros.** TON 618 es radiofuente (B2 1225+31), pero no hay evidencia de chorros resueltos documentada en este proyecto; el texto debe hablar de los cuásares en general. El investigador debe confirmar cada afirmación antes de escribirla.
- **Efecto «transportador» en la unión.** Al pasar de Exploración a Ciencia, los dos agujeros negros suben a la vez (100dvh de separación) antes de que Ciencia se pegue. Si resulta feo en pantalla, valorar la superposición (descartada) en otro spec.
- **Scroll en móvil.** La intro y el hold suman 200 unidades (≈ 120svh en móvil vertical): si la persona pasa de largo, la sección se va sin haber explorado. El hint y los marcadores pulsantes deben estar visibles desde x = 110.
- **Márgenes de la ilustración ampliada.** Con la cámara cerca, parte de la imagen puede quedar bajo la tarjeta en pantallas estrechas; los objetivos de cámara deben calibrarse por viewport.
- **Rendimiento en móviles de gama media.** Capas grandes con `transform` y varias animaciones simultáneas; medir en dispositivo real con las barras del navegador dinámicas (`dvh`/`--viewportExtra`).
- **Reutilizar `TonLayer`.** Pertenece a Exploración y lleva su pulso de destino; al extraerlo hay que asegurar que Exploración no cambia visualmente.
- **Acoplamiento futuro con la navegación.** La sección ocupa ~300svh en desktop (~220svh en móvil vertical); el `rootMargin` del `IntersectionObserver` del spec de navegación debe tenerlo en cuenta.

---

## Qué **no** está en este spec

- Cambios en Hero o Exploración.
- Zoom libre y scroll guiado de punto en punto.
- Toro de polvo, corona y otros elementos del cuásar; datos numéricos destacados.
- Masa, luminosidad y secciones 4 en adelante.
- Navegación completa, Navbar y Footer, audio e imágenes astronómicas reales.

Cada una de estas cosas, si se hace, va en su propio spec.
