# SPEC 08 — Epílogo / Algo más grande todavía

**Estado:** Implemented
**Depende de:** SPEC 07 (y, por ella, SPEC 06, SPEC 05, SPEC 04, SPEC 03, SPEC 02 y SPEC 01)
**Fecha:** 2026-11-24
**Objetivo:** Implementar la sección Epílogo como octava y última escena de la web: el fondo del Hero sobre negro puro con, en el centro, una imagen del Gran Atractor (generada con IA a partir de la referencia) con un pequeño punto «VÍA LÁCTEA» y una única pregunta («¿Has oído hablar del Gran Atractor?») sin respuesta, precedida a modo de subtítulo por el mensaje «Y aun así, TON 618 es solamente una pequeña parte de un universo que todavía estamos intentando comprender».

Origen del contenido: `docs/ideas/08-epilogue.md` (idea inicial, no vinculante; en caso de conflicto mandan las decisiones de esta spec). Diseño y animación los hace `web-motion-designer`; verificación final `section-verifier`. No hay datos científicos que verificar: la sección no afirma nada sobre el Gran Atractor, solo lo plantea.

Recursos: **una imagen nueva** (el Gran Atractor, generada con IA por la persona a partir de `Downloads/the great attractor.jpg`). El fondo se reutiliza del Hero (extraído a un componente compartido); estrellas, nebulosa, destellos, marcador de la Vía Láctea y parallax van en código.

**Créditos:** como en SPEC 06 y 07, en el `README.md`, no en pantalla. Solo si se acaba usando la imagen de referencia (plan de respaldo) se añade su atribución; con la imagen generada con IA no hay crédito de terceros que declarar.

---

## Alcance

### Incluido

- Componente `Epilogue` (`<section id="epilogue">`) montado en `App.tsx` tras `Evidence`. Es una **sección normal**: contenido ≥ `100dvh`, pasa con el scroll de la página, sin track pegajoso propio, sin cola y sin transición propia de entrada ni de salida. La única «cola» es la pegajosa que se añadió a **Evidencia** para que no salga tan rápido (ver «Decisiones»).
- **Fondo del Hero reutilizado:** se extrae de `HeroScene` un componente compartido (fondo, capas de estrellas lejanas/medias/cercanas, nebulosa, partículas, centelleo y destellos, y parallax por capas) que usan Hero y Epílogo. En Epílogo el color base es `#000` (no el degradado azul del Hero) y no se aplican el agujero negro, el scrim ni el zoom por scroll del Hero.
- **Refactor mínimo en Hero** para extraer ese fondo: su aspecto y comportamiento no cambian (misma escena, mismas animaciones, mismo parallax, mismo zoom por scroll).
- **Imagen del Gran Atractor:** líneas de flujo doradas que convergen hacia un punto brillante, con ramas y un vacío interior oscuro, sobre negro puro integrada con `mix-blend-mode: screen` (el negro desaparece sobre el cielo; no se usa alfa real por peso, ver «Decisiones»). Ocupa el centro de la sección. Sin texto, sin rótulos y sin estrellas propias.
- **Indicador de la Vía Láctea** en código: punto + anillo que pulsa + etiqueta «VÍA LÁCTEA», colocado en el extremo de la rama corta que baja desde la rama superior derecha, como en la imagen de referencia. Su posición es relativa a la imagen y se calibró sobre la imagen final; la etiqueta va a la derecha del punto (bajo él en móvil vertical).
- **Cliffhanger:** la pregunta «¿Has oído hablar del Gran Atractor?» en la **parte inferior** de la pantalla, sobre la imagen pero sin tapar el Gran Atractor, con el mensaje de cierre como **subtítulo encima de ella** (tipografía discreta). Ningún texto, dato ni enlace después de la pregunta.
- **Reveal suave** (una sola vez): el **Gran Atractor y su marcador aparecen cuando se ve el 75 % de la sección** (antes permanecen ocultos); el mensaje y la pregunta se revelan al entrar en vista. Para ello `useInView` recibe un parámetro opcional `threshold`.
- **Cola pegajosa en Evidencia** (cambio mínimo en la sección anterior): Evidencia se queda fija ~60dvh de scroll al llegar a su final antes de dar paso al Epílogo.
- **Costura con Evidencia:** degradado de negro a transparente en el borde superior del Epílogo.
- **Interactividad:** parallax con el mouse (el del fondo, compartido), brillo del núcleo que respira y movimiento ambiental continuo en móvil en lugar de hover; con `prefers-reduced-motion` la escena aparece compuesta y estática.
- Layout adaptado a escritorio y móvil (vertical y apaisado).
- Accesibilidad: textos en el DOM, `summary` solo para lectores (descripción de la escena), imagen decorativa (`alt=""`/`aria-hidden`), `prefers-reduced-motion`.
- Datos mínimos en `src/data/epilogue.json`; interfaces en `src/interfaces/epilogue.ts`.
- **Prompt para generar la imagen con IA** entregado a la persona en el paso correspondiente, siguiendo la regla del proyecto (sin fondo, negro → alfa, sin estrellas ni rótulos).

### Excluido (otros specs)

- Cualquier transición propia del Epílogo desde Evidencia (efecto, solape, apilamiento). Evidencia solo recibe la cola pegajosa indicada arriba; ningún otro cambio en ella.
- Botón para volver al inicio, enlaces a fuentes, explicación del Gran Atractor y cualquier texto tras la pregunta.
- Rótulos de «representación artística», «ilustrativo» o «no a escala»; créditos en pantalla.
- Prototipo SVG/CSS del Gran Atractor como imagen principal (solo sirve como referencia de movimiento).
- Cambios en Exploración, Ciencia, Escala, Tiempo y Experimento, y en Evidencia salvo su cola pegajosa.
- Efectos interactivos adicionales sobre la imagen (linterna con el puntero, capas que oscilan, onda al clic): se probaron y se descartaron.
- Audio.
- Navegación completa (rutas, `history.replaceState`, `React.lazy`), Navbar y Footer.

---

## Modelo de datos

Archivos: `src/interfaces/epilogue.ts` y `src/data/epilogue.json`. Solo contienen lo que se muestra o se lee en lectores de pantalla (regla de limpieza al cerrar una sección).

```ts
// src/interfaces/epilogue.ts
export interface EpilogueData {
  summary: string;      // equivalente textual de la escena para lectores
  message: string;      // subtítulo de cierre («Y aun así, TON 618 es solamente…»)
  question: string;     // «¿Has oído hablar del Gran Atractor?»
  markerLabel: string;  // «VÍA LÁCTEA»
}
```

Las rutas de imágenes **no** van en el JSON: se importan en el TSX desde `src/assets/images/epilogue/`. La posición del marcador (coordenadas relativas a la imagen) y las constantes de presentación viven en el componente o en tokens SCSS; no se crea `utils/` salvo que haya lógica real.

Convenciones:

- Parallax: `--px` y `--py` los escribe `useParallaxPointer` (ya existente) sobre la sección; sin estado de React.
- Estado de React: ninguno, salvo el que requiera el reveal (preferible `useInView` + atributo `data-*`).

---

## Recursos visuales

| Elemento | Recurso | Notas |
| --- | --- | --- |
| Fondo | Componente compartido extraído de `HeroScene` | Base `#000`; estrellas, nebulosa y destellos del Hero; sin agujero negro ni scrim |
| Gran Atractor | `src/assets/images/epilogue/great-attractor.webp` (nueva, IA) | 1024×1024, 106 KB, negro opaco + `screen`; sin versión móvil |
| Indicador Vía Láctea | Punto + anillo + etiqueta, en HTML/CSS | Sobre la punta de la rama corta, posición relativa a la imagen; el anillo pulsa con `transform`/`opacity` |
| Brillo del núcleo | Gradiente radial CSS sobre el punto brillante | «Respira» con `opacity`/`scale` |
| Pregunta y mensaje | Texto HTML | En la parte inferior; pregunta como protagonista, mensaje como subtítulo discreto encima |

**Reglas heredadas:** solo `transform`/`translate`/`scale` y `opacity` animados por CSS (más `visibility` discreta); sin `filter` ni `backdrop-filter`; `will-change` solo mientras se mueve; sin `!important`; animaciones pausadas con `data-inview="false"`; mismos tokens de duración y easing que el resto de secciones.

---

## Comportamiento

### Layout

- **Desktop:** la imagen centrada, a gran tamaño sin salirse de `100dvh`; la pregunta y el mensaje (subtítulo encima) en la parte inferior de la pantalla; el marcador sobre el extremo de la rama corta. El texto no oculta el punto brillante ni el marcador.
- **Móvil vertical:** imagen ancha y centrada con el texto sin solaparse con el marcador; mensaje ≥ 14 px, salvo con poca altura (≤ 600 px, donde se compacta a 13 px); la sección puede exceder 100dvh.
- **Móvil apaisado bajo:** composición compacta; nada sale de pantalla.
- Posición exacta de la pregunta respecto de la imagen, tamaños y puntos de ruptura los fija `web-motion-designer` y se calibran en el Paso 8.

### Interacción y estados

- Parallax con el mouse (fondo compartido; la imagen puede desplazarse a un ritmo propio). En móvil, deriva ambiental continua (la misma del fallback del Hero).
- Entrada por scroll normal: al verse el 75 % de la sección se funde el Gran Atractor y después aparece el marcador; el texto se revela al entrar en vista. Todo una sola vez.
- Sin estados de carga complejos: la imagen carga perezosa con contenedor de proporción fija (CLS 0).
- Sin controles: no hay nada interactivo salvo el parallax; no hay elementos focalizables nuevos.

### Transiciones

- **Entrada:** scroll normal, sin efecto propio. Evidencia se queda fija ~60dvh (cola pegajosa) al llegar a su final y luego sale con normalidad; el Epílogo empieza justo debajo con un degradado de negro en su borde superior, de modo que no hay costura visible.
- **Salida:** ninguna; es la última sección.

### Reduced-motion

El parallax no se adjunta; sin deriva, sin pulso del anillo, sin respiración del brillo y sin reveal animado (el contenido aparece compuesto). `document.getAnimations()` de la sección devuelve 0.

### Sin `animation-timeline`

El Epílogo no depende de `animation-timeline`; el reveal usa `IntersectionObserver` (`useInView`).

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional. Agentes: `web-motion-designer` (pasos 1, 2, 4, 5, 6 y 8), `section-verifier` (paso 9); el agente principal hace el prompt de la imagen (paso 3) y README (paso 7).

1. **Fondo compartido.** Extraer de `HeroScene` un componente de fondo reutilizable (con su `.module.scss`) y hacer que Hero lo use sin cambios visibles; verificar con capturas antes/después en 2 viewports y que el parallax y el zoom por scroll del Hero siguen igual. Tokens en `_variables.scss` si hacen falta (`$epilogueBg: #000`).
2. **Sección esqueleto.** `Epilogue.tsx` y `Epilogue.module.scss`: `<section id="epilogue" aria-labelledby>`, fondo compartido sobre negro, `summary`, mensaje y pregunta provisionales desde `epilogue.json`, montada en `App.tsx` tras `Evidence`; `useParallaxPointer` e `useInView` sobre la sección.
3. **Prompt de la imagen y pausa.** Entregar a la persona el prompt de generación con IA (fondo oscuro/transparente, sin texto, sin rótulos, sin estrellas de fondo; líneas de flujo doradas que convergen hacia un punto brillante, con ramas y vacío interior oscuro; adjuntando la referencia). **El flujo se detiene hasta que la persona entregue la imagen.** Si el resultado no sirve, se pide decidir el plan de respaldo (imagen de referencia con «MILKY WAY» eliminado y atribución en README).
4. **Imagen.** Procesar la imagen recibida (negro → alfa) a `.webp` en `src/assets/images/epilogue/` con versión móvil si hace falta; integrarla en el centro con proporción fija y carga perezosa.
5. **Indicador de la Vía Láctea y composición.** Punto + anillo que pulsa + etiqueta, calibrados sobre el extremo de una rama; colocar la pregunta y el mensaje (subtítulo encima) sin tapar punto brillante ni marcador; brillo del núcleo que respira.
6. **Reveal, movimiento ambiental y layout responsive.** Reveal suave por `useInView`; parallax y deriva móvil; escritorio, móvil vertical y apaisado bajo sin scroll horizontal ni solapes.
7. **Reduced-motion, limpieza y créditos.** Estado compuesto y estático con reduced-motion; Prettier, lint, sin `!important`, sin `style={{}}` salvo valores dinámicos; `.ts` solo en `utils`/`hooks`; revisar `epilogue.json` e interfaces (ningún campo sin uso); actualizar `README.md` solo si procede (ver «Créditos»).
8. **Revisión visual y calibración.** Capturas en los 8 viewports de referencia (320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900, 1920×1080); calibrar posición del marcador, tamaño de imagen y texto, y la unión con Evidencia; registrar valores finales aquí.
9. **Verificación con `section-verifier`.** Rendimiento (peso de la imagen, CLS, animaciones y capas), accesibilidad (contraste del texto sobre el fondo y la imagen, reduced-motion), responsive y robustez (StrictMode, montar/desmontar); verificar también que el Hero no ha cambiado; registrar resultados y pendientes en este documento.

---

## Valores finales (Paso 8)

Revisión en los 8 viewports de referencia (320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900, 1920×1080): sin scroll horizontal, sin solapes y todo dentro de pantalla.

- **Imagen:** `great-attractor.webp`, 1024×1024, 106 KB, negro opaco sobre `mix-blend-mode: screen` (en lugar de alfa real: con alfa pesaba 410–640 KB). Lado `--size: min(100vw, 100dvh)`, centrada.
- **Marcador:** punta de la rama corta en `--markerX: 0.737`, `--markerY: 0.521` (relativos a la imagen). Etiqueta a la derecha del punto (como en la referencia) desde 576 px o en apaisado; en móvil vertical, bajo el punto y alineada a su derecha. 14 px.
- **Núcleo:** `--coreX: 0.404`, `--coreY: 0.313`; brillo de 34 % del lado, respira 6 s.
- **Texto:** en la parte inferior (`align-items: flex-end`, relleno inferior `clamp(1.5rem, 7dvh, 4rem)`); pregunta `clamp(1.5rem, 5vw, 2.5rem)`, mensaje 15 px (14 px o más, salvo con poca altura: ver abajo); vela radial oscura tras el texto para el contraste. Con poca altura (≤ 600 px) el texto se compacta (mensaje 13 px, pregunta `clamp(1.25rem, 3.6vw, 2rem)`).
- **Unión con Evidencia:** había costura visible (Evidencia es negro liso, el Epílogo entraba con nebulosa). Se añadió un degradado de `10rem` de negro a transparente en el borde superior del Epílogo (`.section::after`, sobre la imagen y bajo el texto).
- **Cola pegajosa de Evidencia:** `Evidence.tsx` envuelve la sección en `.tail`; la sección es `position: sticky; bottom: 0` y `.tail::before` añade 60dvh de tramo vacío (no relleno: un sticky no sube por encima del contenido de su contenedor). Medido en 1440×900, 390×844 y 320×568 (Evidencia de 685 px): queda fija exactamente 60dvh y no se pierde contenido. El solape de −100dvh con la cola de Experimento pasó de la sección a `.tail`.
- **Reveal del Gran Atractor:** `.stage` (cubre la sección) observado con `useInView(stageRef, true, 0.75)`; la imagen se funde en 1,6 s (`opacity` y `scale` 0.96→1) y el marcador aparece 1,4 s después. Medido: oculto hasta el 70 % visible, visible desde el 80 %, sin repetirse.

---

## Presupuesto

| Concepto | Límite |
| --- | --- |
| Recursos nuevos (imágenes) | ≤ 120 KB en total (a ajustar al recibir la imagen) |
| JS de la sección | ≤ 2 KB gz |
| CSS de los módulos del Epílogo | ≤ 3 KB gz |
| `epilogue.json` | ≤ 1 KB |
| Renders de React por interacción | 0 |
| Cambio de peso de Hero tras el refactor | ≈ 0 (sin duplicar el fondo) |
| Lighthouse móvil | CLS 0; sin empeorar el Performance de la página |

---

## Criterios de aceptación

**Contenido y estructura**

- [x] `<section id="epilogue">` existe, se monta tras `Evidence` en `App.tsx`, mide ≥ `100dvh`, tiene `aria-labelledby` y ningún `<h1>` nuevo.
- [x] Todos los textos visibles salen de `epilogue.json`; ninguno está escrito en el TSX.
- [x] La pregunta «¿Has oído hablar del Gran Atractor?» está en la parte inferior con el mensaje de cierre como subtítulo encima; no hay ningún texto, dato ni enlace después de la pregunta.
- [x] No hay botón de volver al inicio, enlaces a fuentes, créditos en pantalla ni rótulos de «representación artística», «ilustrativo» o «no a escala».
- [x] El punto de la Vía Láctea con su etiqueta «VÍA LÁCTEA» es código (no parte de la imagen), está sobre el extremo de la rama corta (como en la referencia) y la imagen no contiene texto ni rótulos.
- [x] Hero y Epílogo usan el mismo componente de fondo; el fondo del Epílogo es `#000`.
- [x] Los JSON e interfaces no contienen campos que ningún componente use.
- [x] No hay scroll horizontal entre 320 y 2560 px de ancho.
- [x] Ni la pregunta, ni el mensaje ni el marcador se solapan entre sí ni salen de la pantalla, ni la pregunta tapa el marcador, en los 8 viewports de referencia.
- [x] No hay `.scss` sueltos (solo `.module.scss`), ni `!important`, ni `style={{}}` salvo valores dinámicos; clases en camelCase; `prettier --check` limpio.
- [x] `npm run build` y `npm run lint` terminan sin errores ni avisos nuevos.

**Hero (regresión)**

- [x] Tras el refactor, el Hero se ve y se mueve igual (capturas antes/después, parallax, zoom por scroll, deriva móvil); el resto de secciones no se modificaron y `Evidence` solo recibió la cola pegajosa.

**Interacción y movimiento**

- [x] El parallax con el mouse mueve el fondo del Epílogo; en móvil hay movimiento ambiental continuo y no hay dependencia de hover.
- [x] El anillo del marcador pulsa y el brillo del núcleo respira; los destellos de estrellas no superan 1 evento cada ~2 s.
- [x] El Gran Atractor y el marcador permanecen ocultos hasta que se ve el 75 % de la sección; el reveal ocurre una sola vez y no vuelve a dispararse.
- [x] Con `prefers-reduced-motion: reduce` la escena aparece compuesta y estática y `document.getAnimations()` de la sección devuelve 0.
- [x] Con `data-inview="false"` las animaciones de la sección están pausadas.

**Transición**

- [x] Evidencia → Epílogo: Evidencia se queda fija ~60dvh al llegar a su final y luego sale con scroll normal; sin solape del Epílogo, sin costura visible entre ambos fondos y sin espacio sobrante al final de la página. Con reduced-motion no hay cola pegajosa.

**Accesibilidad**

- [x] axe/Lighthouse: 0 violaciones; imagen decorativa sin `alt` descriptivo; el orden de lectura sigue el del DOM.
- [x] El texto mantiene un contraste ≥ 4,5:1 sobre el fondo y la imagen renderizados, también en el punto más brillante del Gran Atractor. _Excepción aceptada (Paso 9):_ en viewports de 1024 a 1600 px de ancho en 16:9/16:10, el final de la primera línea del subtítulo cruza la rama dorada inferior y baja a 2,5–3,3:1 en el peor píxel (2,5–4 % de su caja); la pregunta pasa siempre (≥ 7,5:1). Se acepta por legibilidad visual comprobada en captura.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [x] CLS = 0; la imagen carga perezosa con proporción fija; peso total de imágenes nuevas ≤ 120 KB (o el límite ajustado y registrado).
- [x] 0 Layout y 0 renders de React durante el parallax; solo `transform` y `opacity` animados.
- [x] JS ≤ 2 KB gz y CSS ≤ 3 KB gz.

**Verificación final**

- [x] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz, arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Transición Evidencia → Epílogo: scroll normal, con una cola pegajosa mínima en Evidencia (autor).** Se pidió al ver que al llegar «casi se notaba la última sección» y Evidencia salía demasiado rápido. Es un cambio acotado a Evidencia (`.tail` + `position: sticky; bottom: 0`, ~60dvh, solo sin reduced-motion); el Epílogo sigue sin efecto de entrada.
- **Gran Atractor como negro opaco + `screen` (autor).** Con alfa real el WebP pesaba 410–640 KB frente al límite de 120 KB; así pesa 106 KB y se ve igual sobre el cielo.
- **Texto en la parte inferior (autor).** Sustituye la idea de ponerlo en el centro: deja a la vista el Gran Atractor.
- **Marcador en la rama corta (autor).** Coincide con la imagen de referencia (la Vía Láctea está al final de esa rama, no de la larga).
- **Reveal del Gran Atractor al 75 % de la sección (autor).** No aparece antes de que la sección esté casi entera en pantalla.
- **Esperar a la imagen generada con IA (autor).** La implementación se detiene en el Paso 3 hasta recibir la imagen; la de referencia queda solo como plan de respaldo si el resultado no sirve (con eliminación del rótulo «MILKY WAY» y atribución pendiente).
- **Fondo del Hero extraído a un componente compartido (autor).** Cumple «se reutiliza, no se reimplementa» sin duplicar CSS; implica un refactor mínimo en Hero con verificación de regresión.
- **Mensaje como subtítulo sobre la pregunta (autor).** Sustituye la idea de situarlo descentrado: va encima de la pregunta, discreto, y la pregunta sigue siendo el centro y el protagonista.
- **Marcador de la Vía Láctea en código.** Calibrable sobre la imagen final y común a ambos planes (IA o referencia).
- **Sin rótulos de representación ni créditos en pantalla; créditos solo en el `README.md`.** Coherente con el contenido mínimo del proyecto.
- **Sección sin controles.** La única interacción es el parallax; no hay elementos focalizables nuevos.
- **Agentes por paso.** `web-motion-designer` para diseño, `section-verifier` al final; sin `cosmic-data-researcher` porque no hay datos que verificar.

**Descartadas**

- **Efecto de salida complejo en Evidencia** (solape, apilamiento, telón). Solo se admite la cola pegajosa mínima.
- **Efectos interactivos sobre la imagen** (linterna que sigue al puntero, copias que oscilan alrededor del núcleo, onda al clic): implementados y descartados por el autor; no convencían.
- **Copiar el fondo del Hero al Epílogo.** Duplica código y se incumple la decisión de reutilizarlo.
- **Prototipo SVG/CSS del Gran Atractor como imagen principal.** Ya descartado en la idea; solo referencia de movimiento.
- **Implementar con la referencia como provisional.** Se prefirió esperar a la imagen definitiva.
- **Texto explicativo, datos o enlaces tras la pregunta.** Matan el cliffhanger.
- **Botón de volver al inicio.** Fuera de alcance: la sección termina en la pregunta.

---

## Riesgos identificados

- **Resultado de la IA.** La imagen puede no parecerse a la referencia (sin ramas, sin vacío interior, fondo no limpio). Mitigar con el prompt, iterar con la persona y, si falla, plan de respaldo.
- **Fondo transparente.** Si la IA entrega fondo negro con ruido, negro → alfa deja un halo; mitigar con curva de niveles en el procesado y con el fondo `#000` de la sección (que lo absorbe).
- **Licencia de la imagen de referencia.** Solo aplica si se usa el respaldo (visualización de terceros sobre Laniakea); pendiente de confirmar antes de publicar.
- **Regresión en Hero.** El refactor del fondo puede alterar el parallax, el zoom por scroll o la deriva móvil; mitigar con capturas antes/después y verificación en el Paso 9.
- **Calibración del marcador.** Debe seguir al extremo de la rama al cambiar de tamaño y de recorte móvil; posición relativa a la imagen, no al viewport.
- **Contraste del texto.** Pregunta y subtítulo sobre líneas doradas muy brillantes; medir sobre el render y, si hace falta, atenuar la imagen bajo el texto. _Resultado (Paso 9):_ la pregunta pasa (≥ 7,5:1); el subtítulo queda como excepción aceptada en desktop (ver criterio de accesibilidad).
- **Costura con Evidencia.** Ambos fondos son `#000`, pero las estrellas de Evidencia (telón) y las del Hero difieren; revisar la unión en el Paso 8.
- **Reveal en reduced-motion y sin IntersectionObserver.** El contenido debe verse siempre; no ocultar texto si falla el observer.

---

## Qué **no** está en este spec

- Efectos de transición entre Evidencia y Epílogo más allá de la cola pegajosa.
- Botón de reinicio, enlaces, fuentes o cualquier explicación del Gran Atractor.
- Prototipo SVG/CSS como imagen principal.
- Cambios en las demás secciones salvo el refactor mínimo del fondo del Hero y la cola pegajosa de Evidencia.
- Audio, navegación completa, Navbar y Footer.

Cada una de estas cosas, si se hace, va en su propio spec.
