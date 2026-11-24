# SPEC 08 — Epílogo / Algo más grande todavía

**Estado:** Approved
**Depende de:** SPEC 07 (y, por ella, SPEC 06, SPEC 05, SPEC 04, SPEC 03, SPEC 02 y SPEC 01)
**Fecha:** 2026-11-24
**Objetivo:** Implementar la sección Epílogo como octava y última escena de la web: el fondo del Hero sobre negro puro con, en el centro, una imagen del Gran Atractor (generada con IA a partir de la referencia) con un pequeño punto «VÍA LÁCTEA» y una única pregunta («¿Has oído hablar del Gran Atractor?») sin respuesta, precedida a modo de subtítulo por el mensaje «Y aun así, TON 618 es solamente una pequeña parte de un universo que todavía estamos intentando comprender».

Origen del contenido: `docs/ideas/08-epilogue.md` (idea inicial, no vinculante; en caso de conflicto mandan las decisiones de esta spec). Diseño y animación los hace `web-motion-designer`; verificación final `section-verifier`. No hay datos científicos que verificar: la sección no afirma nada sobre el Gran Atractor, solo lo plantea.

Recursos: **una imagen nueva** (el Gran Atractor, generada con IA por la persona a partir de `Downloads/the great attractor.jpg`). El fondo se reutiliza del Hero (extraído a un componente compartido); estrellas, nebulosa, destellos, marcador de la Vía Láctea y parallax van en código.

**Créditos:** como en SPEC 06 y 07, en el `README.md`, no en pantalla. Solo si se acaba usando la imagen de referencia (plan de respaldo) se añade su atribución; con la imagen generada con IA no hay crédito de terceros que declarar.

---

## Alcance

### Incluido

- Componente `Epilogue` (`<section id="epilogue">`) montado en `App.tsx` tras `Evidence`. Es una **sección normal**: contenido ≥ `100dvh`, pasa con el scroll de la página, sin track pegajoso, sin cola y sin transición propia de entrada ni de salida (ver «Decisiones»).
- **Fondo del Hero reutilizado:** se extrae de `HeroScene` un componente compartido (fondo, capas de estrellas lejanas/medias/cercanas, nebulosa, partículas, centelleo y destellos, y parallax por capas) que usan Hero y Epílogo. En Epílogo el color base es `#000` (no el degradado azul del Hero) y no se aplican el agujero negro, el scrim ni el zoom por scroll del Hero.
- **Refactor mínimo en Hero** para extraer ese fondo: su aspecto y comportamiento no cambian (misma escena, mismas animaciones, mismo parallax, mismo zoom por scroll).
- **Imagen del Gran Atractor:** líneas de flujo doradas que convergen hacia un punto brillante, con ramas y un vacío interior oscuro, sobre fondo transparente (negro → alfa). Ocupa el centro de la sección. Sin texto, sin rótulos y sin estrellas propias.
- **Indicador de la Vía Láctea** en código: punto + anillo que pulsa + etiqueta «VÍA LÁCTEA», colocado en el extremo de una de las ramas. Su posición se calibra sobre la imagen final (en escritorio y en móvil, si el recorte cambia).
- **Cliffhanger:** la pregunta «¿Has oído hablar del Gran Atractor?» en el centro de la composición, con el mensaje de cierre como **subtítulo encima de ella** (tipografía discreta). Ningún texto, dato ni enlace después de la pregunta.
- **Reveal suave** del mensaje, la pregunta y el marcador al entrar en vista (una sola vez, orden y tiempos los fija `web-motion-designer`).
- **Interactividad:** parallax con el mouse (el del fondo, compartido), brillo del núcleo que respira y movimiento ambiental continuo en móvil en lugar de hover; con `prefers-reduced-motion` la escena aparece compuesta y estática.
- Layout adaptado a escritorio y móvil (vertical y apaisado).
- Accesibilidad: textos en el DOM, `summary` solo para lectores (descripción de la escena), imagen decorativa (`alt=""`/`aria-hidden`), `prefers-reduced-motion`.
- Datos mínimos en `src/data/epilogue.json`; interfaces en `src/interfaces/epilogue.ts`.
- **Prompt para generar la imagen con IA** entregado a la persona en el paso correspondiente, siguiendo la regla del proyecto (sin fondo, negro → alfa, sin estrellas ni rótulos).

### Excluido (otros specs)

- Cualquier transición Evidencia → Epílogo (cola pegajosa, efecto, solape, apilamiento). Evidencia **no se modifica**.
- Botón para volver al inicio, enlaces a fuentes, explicación del Gran Atractor y cualquier texto tras la pregunta.
- Rótulos de «representación artística», «ilustrativo» o «no a escala»; créditos en pantalla.
- Prototipo SVG/CSS del Gran Atractor como imagen principal (solo sirve como referencia de movimiento).
- Cambios en Exploración, Ciencia, Escala, Tiempo, Experimento y Evidencia.
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
| Gran Atractor | `src/assets/images/epilogue/great-attractor*.webp` (nueva, IA) | Fondo transparente; versión móvil si hace falta; peso a fijar tras recibirla |
| Indicador Vía Láctea | Punto + anillo + etiqueta, en HTML/CSS | Posición calibrada sobre la imagen final; el anillo pulsa con `transform`/`opacity` |
| Brillo del núcleo | Gradiente radial CSS sobre el punto brillante | «Respira» con `opacity`/`scale` |
| Pregunta y mensaje | Texto HTML | Pregunta como protagonista, mensaje como subtítulo discreto encima |

**Reglas heredadas:** solo `transform`/`translate`/`scale` y `opacity` animados por CSS (más `visibility` discreta); sin `filter` ni `backdrop-filter`; `will-change` solo mientras se mueve; sin `!important`; animaciones pausadas con `data-inview="false"`; mismos tokens de duración y easing que el resto de secciones.

---

## Comportamiento

### Layout

- **Desktop:** la imagen centrada, a gran tamaño sin salirse de `100dvh`; la pregunta en el centro de la composición con el mensaje como subtítulo encima; el marcador sobre el extremo de la rama. La pregunta no oculta el punto brillante ni el marcador.
- **Móvil vertical:** imagen ancha y centrada con el texto sin solaparse con el marcador; texto ≥ 14 px; la sección puede exceder 100dvh.
- **Móvil apaisado bajo:** composición compacta; nada sale de pantalla.
- Posición exacta de la pregunta respecto de la imagen, tamaños y puntos de ruptura los fija `web-motion-designer` y se calibran en el Paso 8.

### Interacción y estados

- Parallax con el mouse (fondo compartido; la imagen puede desplazarse a un ritmo propio). En móvil, deriva ambiental continua (la misma del fallback del Hero).
- Entrada por scroll normal: al ser visible se revela el contenido una sola vez (mensaje, pregunta y marcador con retraso suave).
- Sin estados de carga complejos: la imagen carga perezosa con contenedor de proporción fija (CLS 0).
- Sin controles: no hay nada interactivo salvo el parallax; no hay elementos focalizables nuevos.

### Transiciones

- **Entrada:** ninguna (scroll normal, como Hero → Exploración). Evidencia termina como sección normal y el Epílogo empieza justo debajo; ambas tienen fondo negro, de modo que no hay costura visible.
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

- [ ] `<section id="epilogue">` existe, se monta tras `Evidence` en `App.tsx`, mide ≥ `100dvh`, tiene `aria-labelledby` y ningún `<h1>` nuevo.
- [ ] Todos los textos visibles salen de `epilogue.json`; ninguno está escrito en el TSX.
- [ ] La pregunta «¿Has oído hablar del Gran Atractor?» está en el centro de la composición con el mensaje de cierre como subtítulo encima; no hay ningún texto, dato ni enlace después de la pregunta.
- [ ] No hay botón de volver al inicio, enlaces a fuentes, créditos en pantalla ni rótulos de «representación artística», «ilustrativo» o «no a escala».
- [ ] El punto de la Vía Láctea con su etiqueta «VÍA LÁCTEA» es código (no parte de la imagen), está sobre el extremo de una rama y la imagen no contiene texto ni rótulos.
- [ ] Hero y Epílogo usan el mismo componente de fondo; el fondo del Epílogo es `#000`.
- [ ] Los JSON e interfaces no contienen campos que ningún componente use.
- [ ] No hay scroll horizontal entre 320 y 2560 px de ancho.
- [ ] Ni la pregunta, ni el mensaje ni el marcador se solapan entre sí ni salen de la pantalla, ni la pregunta tapa el marcador, en los 8 viewports de referencia.
- [ ] No hay `.scss` sueltos (solo `.module.scss`), ni `!important`, ni `style={{}}` salvo valores dinámicos; clases en camelCase; `prettier --check` limpio.
- [ ] `npm run build` y `npm run lint` terminan sin errores ni avisos nuevos.

**Hero (regresión)**

- [ ] Tras el refactor, el Hero se ve y se mueve igual (capturas antes/después, parallax, zoom por scroll, deriva móvil); `Evidence` y el resto de secciones no se modificaron.

**Interacción y movimiento**

- [ ] El parallax con el mouse mueve el fondo del Epílogo; en móvil hay movimiento ambiental continuo y no hay dependencia de hover.
- [ ] El anillo del marcador pulsa y el brillo del núcleo respira; los destellos de estrellas no superan 1 evento cada ~2 s.
- [ ] El reveal ocurre una sola vez al entrar en vista y no vuelve a dispararse.
- [ ] Con `prefers-reduced-motion: reduce` la escena aparece compuesta y estática y `document.getAnimations()` de la sección devuelve 0.
- [ ] Con `data-inview="false"` las animaciones de la sección están pausadas.

**Transición**

- [ ] Evidencia → Epílogo es scroll normal: sin solape, sin cola pegajosa y sin costura visible entre ambos fondos; el Epílogo termina al final de la página sin espacio sobrante.

**Accesibilidad**

- [ ] axe/Lighthouse: 0 violaciones; imagen decorativa sin `alt` descriptivo; el orden de lectura sigue el del DOM.
- [ ] El texto mantiene un contraste ≥ 4,5:1 sobre el fondo y la imagen renderizados, también en el punto más brillante del Gran Atractor.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [ ] CLS = 0; la imagen carga perezosa con proporción fija; peso total de imágenes nuevas ≤ 120 KB (o el límite ajustado y registrado).
- [ ] 0 Layout y 0 renders de React durante el parallax; solo `transform` y `opacity` animados.
- [ ] JS ≤ 2 KB gz y CSS ≤ 3 KB gz.

**Verificación final**

- [ ] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz, arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Transición Evidencia → Epílogo: scroll normal (autor).** Manda la idea 08 sobre lo que dejaba abierto la SPEC 07 («SPEC 08 se hace cargo del final de Evidencia»). Sin cola ni efecto, Evidencia no se toca; el final no cierra la historia con espectáculo, la deja abierta.
- **Esperar a la imagen generada con IA (autor).** La implementación se detiene en el Paso 3 hasta recibir la imagen; la de referencia queda solo como plan de respaldo si el resultado no sirve (con eliminación del rótulo «MILKY WAY» y atribución pendiente).
- **Fondo del Hero extraído a un componente compartido (autor).** Cumple «se reutiliza, no se reimplementa» sin duplicar CSS; implica un refactor mínimo en Hero con verificación de regresión.
- **Mensaje como subtítulo sobre la pregunta (autor).** Sustituye la idea de situarlo descentrado: va encima de la pregunta, discreto, y la pregunta sigue siendo el centro y el protagonista.
- **Marcador de la Vía Láctea en código.** Calibrable sobre la imagen final y común a ambos planes (IA o referencia).
- **Sin rótulos de representación ni créditos en pantalla; créditos solo en el `README.md`.** Coherente con el contenido mínimo del proyecto.
- **Sección sin controles.** La única interacción es el parallax; no hay elementos focalizables nuevos.
- **Agentes por paso.** `web-motion-designer` para diseño, `section-verifier` al final; sin `cosmic-data-researcher` porque no hay datos que verificar.

**Descartadas**

- **Efecto de salida nuevo en Evidencia.** Añade cola pegajosa y solape para una sección que debe pasar sin ceremonia.
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
- **Contraste del texto.** Pregunta y subtítulo sobre líneas doradas muy brillantes; medir sobre el render y, si hace falta, atenuar la imagen bajo el texto.
- **Costura con Evidencia.** Ambos fondos son `#000`, pero las estrellas de Evidencia (telón) y las del Hero difieren; revisar la unión en el Paso 8.
- **Reveal en reduced-motion y sin IntersectionObserver.** El contenido debe verse siempre; no ocultar texto si falla el observer.

---

## Qué **no** está en este spec

- Transición entre Evidencia y Epílogo.
- Botón de reinicio, enlaces, fuentes o cualquier explicación del Gran Atractor.
- Prototipo SVG/CSS como imagen principal.
- Cambios en las demás secciones salvo el refactor mínimo del fondo del Hero.
- Audio, navegación completa, Navbar y Footer.

Cada una de estas cosas, si se hace, va en su propio spec.
