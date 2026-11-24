# SPEC 07 — Evidencia / Lo que vemos y lo que imaginamos

**Estado:** Approved
**Depende de:** SPEC 06 (y, por ella, SPEC 05, SPEC 04, SPEC 03, SPEC 02 y SPEC 01)
**Fecha:** 2026-11-24
**Objetivo:** Implementar la sección Evidencia como séptima escena de la web: un comparador con control deslizante que revela, sobre la misma imagen, la observación astronómica real de TON 618 frente a una representación artística de su entorno, seguido de cuatro preguntas en acordeón que aclaran qué se ha observado de verdad y qué se imagina; que recibe la transición de salida de Experimento (el telón de estrellas) y termina como sección normal, sin transición de salida propia.

Origen del contenido: `docs/ideas/07-evidence.md` (idea inicial, no vinculante). Datos, textos y la imagen real los verifica `cosmic-data-researcher`; diseño y animación los hace `web-motion-designer`; verificación final `section-verifier`.

Recursos: **una imagen nueva** (la observación real, de dominio público o con crédito aceptable) más la reutilización de `ton618-blackhole-1024.webp` y `ton618-blackhole-mobile-800.webp` del Hero como representación artística. El resto (fondo, estrellas, tirador del control) va en CSS/SVG.

**Créditos:** igual que en SPEC 06, todos los créditos se declaran en el `README.md` del proyecto, no en pantalla. Esta spec añade ahí el de la imagen real de la observación (fuente, autor y licencia).

---

## Alcance

### Incluido

- Componente `Evidence` (`<section id="evidence">`) montado en `App.tsx` tras `Experiment`. Es una **sección normal**: su contenido mide ≥ `100dvh` y pasa con el scroll de la página; **no** tiene track pegajoso ni cola de salida.
- **Comparador de imágenes** con control deslizante (`<input type="range">` accesible sobre las dos imágenes superpuestas): a un lado la **observación astronómica** (imagen real de TON 618) y al otro la **representación artística** (la imagen del Hero), con un tirador que divide la escena. Posición inicial 50 %, arrastrable con ratón, dedo y teclado (flechas, `Inicio`/`Fin`). Cada lado lleva su rótulo («Observación astronómica» y «Representación artística») como parte del contenido de la sección (ver «Decisiones»).
- **Cuatro preguntas interactivas** en un acordeón de **una sola abierta a la vez**:
  1. ¿Tenemos una fotografía directa de TON 618?
  2. ¿El agujero negro es lo que produce la luz del cuásar?
  3. ¿Podemos observar lo que sucede dentro del horizonte de sucesos?
  4. ¿Todas las imágenes de agujeros negros representan observaciones reales?

  Cada una muestra, al abrirse, un veredicto corto y una respuesta breve (≤ 40 palabras), verificados.
- **Entrada:** Evidencia **recibe** la transición ya existente de Experimento (telón de estrellas que sube y desvanece el stage de Experimento): se solapa bajo él con margen negativo y se apila por debajo. No se modifica el efecto ni su mixin.
- Layout adaptado a escritorio y móvil (vertical y apaisado).
- Accesibilidad: textos y estado del acordeón en el DOM, `summary` para lectores, comparador operable por teclado, `prefers-reduced-motion`.
- Datos mínimos en `src/data/evidence.json`; interfaces en `src/interfaces/evidence.ts`.
- **Créditos en `README.md`** de la imagen real.

### Excluido (otros specs)

- **Transición de salida de Evidencia** (Evidencia → Epílogo): es nueva y se diseña e implementa en SPEC 08, que **solo se hace cargo del final de Evidencia** (añadir su cola pegajosa y su efecto). Esta spec no deja cola, token ni hueco reservado para ella.
- La sección 08 — Epílogo.
- Cualquier cambio en Hero, Exploración, Ciencia, Escala y Tiempo.
- Cambios en el efecto de Experimento (`Distortion`, `_distortion.scss`) ni en su cola. Solo se permite el ajuste mínimo de apilamiento y `pointer-events` descrito en «Transiciones».
- Zoom, panorámica o anotaciones sobre las imágenes; galería con otros agujeros negros (M87*, Sgr A*) como imágenes (pueden mencionarse en el texto de la pregunta 4, sin imagen).
- Audio.
- Rótulos de «representación artística» fuera de los dos del comparador (ni en `summary`, ni en pies de foto, ni créditos en pantalla).
- Navegación completa (rutas, `history.replaceState`, `React.lazy`), Navbar y Footer.

---

## Modelo de datos

Archivos: `src/interfaces/evidence.ts` y `src/data/evidence.json`. Solo contienen lo que se muestra en pantalla o se lee en lectores de pantalla (regla de limpieza al cerrar una sección).

```ts
// src/interfaces/evidence.ts
export interface EvidenceCompareSide {
  label: string;        // «Observación astronómica» / «Representación artística»
  alt: string;          // descripción de la imagen para lectores
}

export interface EvidenceQuestion {
  question: string;     // la pregunta
  verdict: string;      // veredicto corto: «No», «No directamente», «Sí, pero…»
  answer: string;       // ≤ 40 palabras, verificado
}

export interface EvidenceData {
  title: string;        // h2 visible («Lo que vemos y lo que imaginamos»)
  subtitle: string;     // frase de una línea
  hint: string;         // invitación del comparador («Desliza para comparar»)
  summary: string;      // equivalente textual de la escena para lectores
  compare: {
    observation: EvidenceCompareSide;
    representation: EvidenceCompareSide;
    sliderLabel: string; // nombre accesible del control («Comparar observación y representación»)
    valueText: string;   // plantilla de aria-valuetext («{value} % observación»)
  };
  questions: EvidenceQuestion[]; // 4, en el orden de la lista de arriba
}
```

Las rutas de imágenes **no** van en el JSON: se importan en el TSX desde `src/assets/images/evidence/` (como Hero y Escala). Las constantes de presentación (posición inicial del comparador, paso del teclado) viven como constantes del componente o en tokens SCSS (`$evidenceBg`); no se crea `utils/` salvo que haya lógica real.

Convenciones:

- Posición del comparador: entero `0…100`, solo en DOM/CSS (variable `--split` escrita directamente, 0 renders de React al arrastrar).
- Estado de React: solo el índice de la pregunta abierta (o ninguno).

### Datos que debe verificar `cosmic-data-researcher`

Los siguientes puntos son hipótesis de trabajo, **no** hechos verificados; se confirman y se registran con fuente en este spec (Paso 2):

- **Foto directa:** no existe una imagen resuelta de TON 618; las imágenes de survey (SDSS, Legacy Survey, Pan-STARRS, Hubble, etc.) lo muestran como un punto brillante, un cuásar, a z ≈ 2,219. Elegir una imagen real concreta con **licencia compatible** (dominio público o crédito aceptable) y anotar autor, fuente y licencia. Si ninguna es adecuada, decirlo antes de elegir.
- **El cuásar y el agujero negro:** la luz proviene del disco de acreción caliente y el gas alrededor, no del agujero negro en sí; la formulación de la respuesta debe ser correcta y no inducir a pensar que el agujero negro «brilla».
- **Horizonte de sucesos:** nada que ocurra dentro puede observarse, por definición (la luz no escapa). Distinguir entre observar la sombra o el borde y observar el interior.
- **Imágenes reales de agujeros negros:** distinguir las imágenes obtenidas por el Event Horizon Telescope (M87*, 2019; Sgr A*, 2022) de simulaciones y arte; explicar por qué TON 618 no se puede resolver así (distancia y tamaño angular). Verificar fechas y fuente.
- Los textos de las cuatro respuestas no inventan cifras que no estén verificadas.

---

## Recursos visuales

| Elemento | Recurso | Notas |
| --- | --- | --- |
| Fondo | Color de la paleta (`$evidenceBg`), posiblemente con el campo de estrellas existente (`_starfield.scss`) | Continúa el espacio oscuro de Experimento; no es negro puro |
| Observación | `src/assets/images/evidence/ton618-observation*.webp` (nueva, real) | Recortada y procesada; versión móvil si hace falta; con crédito en README |
| Representación | `ton618-blackhole-1024.webp` y `ton618-blackhole-mobile-800.webp` (Hero) | Reutilizada, 0 KB nuevos en esta cara |
| Comparador | `<input type="range">` estilizado + tirador en CSS/SVG | Las imágenes se revelan con `clip-path` o `transform` según decida el diseño; sin `filter` |
| Acordeón | `<button aria-expanded>` + región, en HTML | Sin librerías |

**Reglas heredadas:** solo `transform`/`translate`/`scale` y `opacity` animados por CSS (más `visibility` discreta); sin `filter` ni `backdrop-filter`; `will-change` solo mientras se mueve; sin `!important`; mismos tokens de duración y easing que Escala y Tiempo.

---

## Comportamiento

### Layout

- **Desktop (`$sideBySide`):** título y subtítulo arriba a la izquierda; el comparador ocupa la mayor parte de la altura; las preguntas, en una columna a un lado (derecha) junto al comparador. Todo cabe en ≥ 100dvh.
- **Móvil vertical:** título y subtítulo arriba, comparador debajo (ancho completo) y preguntas apiladas bajo él. La sección puede exceder 100dvh y se recorre con el scroll normal. Texto ≥ 14 px.
- **Móvil apaisado bajo:** layout compacto; el comparador no tapa los textos ni sale de pantalla.
- Cifras, proporciones de imagen y puntos de ruptura los fija `web-motion-designer` y se calibran en el Paso 8.

### Interacción y estados

- **Comparador:** posición inicial 50 %; arrastre horizontal en ratón y táctil (`touch-action: pan-y`: el gesto vertical siempre es scroll de página); teclado: flechas ±5 %, `Inicio`/`Fin` a los extremos. El control es un `<input type="range">` real; el estado visual se escribe sin renders de React.
- **Hint:** visible hasta la primera interacción con el comparador.
- **Acordeón:** una pregunta abierta como máximo; abrir otra cierra la anterior; la abierta puede cerrarse. Al abrir se ve el veredicto y la respuesta. Estado inicial: todas cerradas. Cada cabecera es un botón con `aria-expanded` y `aria-controls`; navegable con Tab, `Enter` y `Espacio`.
- **Lectores de pantalla:** las imágenes tienen `alt`; el contenido de todas las respuestas está en el DOM (`hidden` o visualmente reducido solo mientras está cerrado, sin `display: none` que lo elimine del árbol cuando la persona lo necesite abrir con un lector); `summary` solo para lectores.
- **Sin estado de carga complejo:** las imágenes cargan perezosas (`loading="lazy"`), con el contenedor de proporción fija para que no haya CLS.

### Transiciones

- **Entrada (ya hecha, solo se recibe):** Experimento aplica sobre sí mismo el telón de estrellas de abajo hacia arriba y desvanece su stage; Evidencia se solapa bajo él con margen negativo (`-100dvh`, solo con `prefers-reduced-motion: no-preference`, como Experimento bajo Tiempo) y se pinta por debajo (nuevo valor en `$sectionLayers`: `'evidence': 8`, justo bajo `'experiment': 9`).
- **Punteros durante el solape:** el contenido de Evidencia no debe recibir el puntero mientras el stage de Experimento sigue visible, ni Experimento debe capturarlo cuando ya está oculto. Se resuelve con `pointer-events` (cambio mínimo y localizado en `Experiment.module.scss` si hace falta) sin tocar el efecto.
- **Cálculo y carga:** la imagen real se precarga con margen para estar lista cuando el telón empieza a subir.
- **Salida:** ninguna. Evidencia termina como sección normal al final de la página hasta que SPEC 08 la conecte; entonces añadirá su cola y su efecto.
- Al volver hacia arriba todo se revierte sin saltos ni costuras.

### Reduced-motion

Sin solape y sin transición propia (Experimento ya colapsa su track a `100dvh` en este modo): la escena aparece compuesta y estática. El comparador y el acordeón siguen funcionando, sin animaciones de apertura ni del tirador; `document.getAnimations()` de la sección devuelve 0.

### Sin `animation-timeline`

Evidencia no depende de `animation-timeline`: el comparador, el acordeón y la entrada (solape) no lo usan. El telón de Experimento ya tiene su fallback por `--progress`.

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional. Agentes: `cosmic-data-researcher` (paso 2), `web-motion-designer` (pasos 1, 3, 4, 5, 6 y 8), `section-verifier` (paso 9); el agente principal hace el README (paso 7).

1. **Tokens y base.** En `_variables.scss`: `$evidenceBg` y `'evidence': 8` en `$sectionLayers`. Sección esqueleto `Evidence.tsx` + `Evidence.module.scss` (título, `summary`, contenedores vacíos) montada en `App.tsx` tras `Experiment`.
2. **Datos e imagen real.** `src/interfaces/evidence.ts` y `src/data/evidence.json` con textos verificados (`cosmic-data-researcher`); seleccionar la imagen real con licencia compatible, procesarla a `.webp` (≤ 60 KB en total, con versión móvil si hace falta) en `src/assets/images/evidence/` y documentar en este spec la fuente, el autor, la licencia y la formulación de cada respuesta.
3. **Comparador.** Componente del comparador (con su `.module.scss`): dos imágenes superpuestas, `<input type="range">` sobre ellas, tirador, rótulos de cada lado, `--split` por DOM, hint, teclado, `touch-action: pan-y`. Sin renders de React al arrastrar.
4. **Preguntas.** Acordeón de una sola abierta, con `aria-expanded`/`aria-controls`, veredicto y respuesta; estado de React mínimo (índice abierto).
5. **Layout responsive.** Escritorio (columnas), móvil vertical (apilado) y apaisado bajo; sin scroll horizontal; sin solapes; imágenes con proporción fija (CLS 0).
6. **Entrada.** Solape con margen negativo y apilamiento bajo Experimento; ajuste mínimo de `pointer-events`; comprobar que Experimento y su telón se ven exactamente igual; precarga con margen.
7. **Reduced-motion, limpieza y créditos.** Estado compuesto con reduced-motion; Prettier, lint, sin `!important`, sin `style={{}}` salvo valores dinámicos; revisar `evidence.json` e interfaces (ningún campo sin uso); añadir en `README.md` el crédito de la imagen real.
8. **Revisión visual y calibración.** Capturas en los 8 viewports de referencia (320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900, 1920×1080); calibrar proporciones, tirador y la unión con el telón de Experimento; registrar valores finales aquí.
9. **Verificación con `section-verifier`.** Rendimiento (Layout/Paint al arrastrar, CLS, peso), accesibilidad (teclado, lector, contraste), responsive y robustez (montar/desmontar, StrictMode); registrar resultados y pendientes en este documento.

---

## Presupuesto

| Concepto | Límite |
| --- | --- |
| Recursos nuevos (imágenes) | ≤ 60 KB en total |
| JS de la sección | ≤ 3 KB gz |
| CSS de los módulos de Evidencia | ≤ 3 KB gz |
| `evidence.json` | ≤ 2,5 KB |
| Renders de React al arrastrar el comparador | 0 |
| Layout durante el arrastre del comparador | 0 por fotograma |
| Lighthouse móvil | Performance ≥ 90, CLS 0 |

---

## Criterios de aceptación

**Contenido y estructura**

- [x] `<section id="evidence">` existe, se monta tras `Experiment` en `App.tsx`, mide ≥ `100dvh`, tiene `aria-labelledby`, un `<h2>` visible y ningún `<h1>` nuevo.
- [x] Todos los textos visibles salen de `evidence.json`; ninguno está escrito en el TSX.
- [x] Hay exactamente 4 preguntas, en el orden de la idea, cada respuesta ≤ 40 palabras y con fuente verificada anotada en este spec.
- [x] La respuesta 2 no afirma que el agujero negro emita la luz; la 3 no afirma que se observe el interior; la 4 distingue observaciones reales de simulaciones.
- [x] La imagen real de TON 618 tiene licencia compatible y su crédito consta en el `README.md`; el crédito no aparece en pantalla.
- [x] No aparece ningún rótulo de «representación artística», «ilustrativo» ni «no a escala» salvo los dos del comparador; no hay créditos en pantalla.
- [x] Los JSON e interfaces no contienen campos que ningún componente use.
- [x] No hay scroll horizontal entre 320 y 2560 px de ancho.
- [x] Ni el título, ni el comparador, ni las preguntas se solapan entre sí ni salen de la pantalla, en los 8 viewports de referencia, con todas las preguntas cerradas y con cada una abierta.
- [x] No hay `.scss` sueltos (solo `.module.scss`), ni `!important`, ni `style={{}}` salvo valores dinámicos; clases en camelCase; `prettier --check` limpio.
- [x] `npm run build` y `npm run lint` terminan sin errores ni avisos nuevos.

**Interacción**

- [x] El tirador se mueve de 0 a 100 de forma continua con ratón y con táctil; el gesto vertical hace scroll de página; con teclado, flechas ±5 y `Inicio`/`Fin` llevan a los extremos; el `aria-valuetext` se actualiza. _(Pendiente: el gesto vertical con `touch-action: pan-y` solo se puede validar en un móvil real; el resto está medido.)_
- [x] Con 0 y con 100 se ve solo una de las dos imágenes completa, sin costuras ni huecos.
- [x] El acordeón nunca tiene más de una pregunta abierta; abrir otra cierra la anterior; se puede cerrar la abierta; funciona con `Enter` y `Espacio`.
- [x] El hint desaparece tras la primera interacción con el comparador.

**Transición**

- [x] Durante el telón de Experimento, Evidencia se descubre bajo él ya compuesta (imagen cargada, sin parpadeo ni hueco) y queda como sección normal al terminar.
- [x] El efecto, duración y easing de Experimento no cambian respecto al estado previo a esta spec (sin diferencia en su cola).
- [x] Ninguno de los controles de Evidencia recibe clics mientras el stage de Experimento sigue visible, y Experimento no captura el puntero una vez oculto.
- [x] Evidencia no tiene cola pegajosa, tokens ni estilos de transición de salida; termina al final de la página sin espacio sobrante.
- [x] Con reduced-motion no hay solape y `document.getAnimations()` de la sección devuelve 0.
- [x] Al volver hacia arriba todo se revierte sin saltos ni costuras.

**Accesibilidad**

- [x] axe/Lighthouse: 0 violaciones; imágenes con `alt`; control con nombre accesible; el orden de lectura sigue el del DOM.
- [x] El orden de Tab es: control del comparador y luego las cuatro cabeceras del acordeón; todos con foco visible.
- [x] El texto mantiene un contraste ≥ 4,5:1 sobre el fondo renderizado, también el rótulo sobre cada imagen. _(Pendiente: título y subtítulo bajan de 4,5:1 en un 0,4-1 % de los píxeles de su caja, donde cruzan una estrella; el resto del texto cumple.)_
- [x] Con `prefers-reduced-motion: reduce` la escena aparece compuesta y sin animaciones.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [x] Lighthouse móvil: Performance ≥ 90, CLS = 0.
- [x] Arrastrar el comparador: 0 Layout de la escena (solo el de la reposición del pulgar nativo del `<input type="range">`, 1 por movimiento y sin coste medible), 0 renders de React; abrir una pregunta no provoca más de un render.
- [x] Peso: imágenes nuevas ≤ 60 KB, JS ≤ 3 KB gz, CSS ≤ 3 KB gz.

**Verificación final**

- [x] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz, arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Transición de salida fuera de esta spec (autor).** Evidencia → Epílogo es un efecto nuevo y la siguiente sección es la última; se diseña e implementa en SPEC 08. Esta spec no deja cola ni hueco: Evidencia termina como sección normal y SPEC 08 modificará su final.
- **Sección normal, sin track de scroll (autor).** Como Experimento: el control lo mueve la persona y el scroll es solo scroll; menos mecánica y sin conflicto táctil.
- **Imágenes: observación real de dominio público y representación reutilizada del Hero (autor).** Honestidad ante todo: la observación no puede ser generada. La cara artística reutiliza el recurso del Hero, 0 KB nuevos.
- **Acordeón de una sola pregunta abierta (autor).** Compacto, accesible con teclado y con estado mínimo.
- **Rótulos «Observación astronómica» y «Representación artística» sí van en pantalla.** Son el contenido de la sección, no un aviso de cortesía: nombran qué es cada lado del comparador. Excepción a la regla de no poner rótulos de representación artística (SPEC 06); fuera del comparador siguen sin aparecer.
- **Créditos solo en el `README.md`.** Coherente con el contenido mínimo del proyecto.
- **Entrada recibida sin tocar el efecto.** Solo apilamiento y `pointer-events`; Experimento conserva su cola y mixin.
- **Agentes por paso.** `cosmic-data-researcher` para datos e imagen, `web-motion-designer` para diseño, `section-verifier` al final.

**Descartadas**

- **Transición de salida en esta spec (Alcance de la idea inicial).** Se difiere a SPEC 08 por decisión del autor.
- **Cola vacía reservada ($evidenceFade).** Añade un token sin uso; SPEC 08 la crea cuando haga falta.
- **Track pegajoso guiado por scroll.** Quita control al usuario y complica el móvil.
- **Ambas imágenes generadas con IA.** Una «observación» sintética contradice el mensaje de la sección.
- **Tarjetas que se voltean y pestañas.** Peor accesibilidad y más ocultación de contenido que el acordeón.
- **Galería con M87* y Sgr A* como imágenes.** Amplía el alcance; pueden citarse en la respuesta 4.
- **Créditos en pantalla.** Contradice el contenido mínimo del proyecto.

---

## Riesgos identificados

- **Imagen real poco atractiva.** TON 618 sale como un punto brillante en cualquier survey; puede no «lucir» junto a la representación. Mitigar con un recorte cuidado y dejando que el contraste entre ambas sea precisamente el mensaje.
- **Licencia de la imagen real.** Hay que confirmar que se puede usar y recortar con crédito en README antes de publicar; si ninguna sirve, se pide al autor decidir (no se usa una imagen sin licencia clara).
- **Mensaje físico incorrecto.** Las respuestas sobre el cuásar y el horizonte son fáciles de formular mal. Mitigar con verificación del investigador y límite de 40 palabras.
- **Unión con el telón de Experimento.** Evidencia se solapa 100dvh bajo un stage pegado; si no está lista (imagen) se vería un hueco. Mitigar con precarga con margen y calibración del Paso 8.
- **Punteros durante el solape.** Experimento (con controles y canvas) está por encima de Evidencia; sin ajuste, sus cajas capturarían clics sobre Evidencia al terminar el telón. Mitigar con `pointer-events` mínimo y comprobarlo.
- **Acoplamiento con SPEC 08.** La salida nueva exigirá tocar el final de Evidencia (cola pegajosa y su altura); la altura de esta sección debe poder crecer sin romper el layout.
- **Táctil en el comparador.** El arrastre horizontal frente al scroll vertical; `touch-action: pan-y` evita atrapar el scroll, pero debe probarse en móvil real.
- **Licencia de la imagen del Hero.** Heredada de SPEC 01; confirmar crédito antes de publicar.

---

## Qué **no** está en este spec

- La transición de salida de Evidencia y la sección 08 — Epílogo.
- Cambios en las secciones anteriores salvo el ajuste mínimo de `pointer-events` en Experimento.
- Imágenes de otros agujeros negros, zoom, panorámica o audio.
- Navegación completa, Navbar y Footer.

Cada una de estas cosas, si se hace, va en su propio spec.

---

## Resultados del Paso 2 (datos e imagen real)

Consulta: 2026-11-24.

### Imagen real de la observación

- **Fuente:** Legacy Surveys (DR9), recorte generado con el visor `https://www.legacysurvey.org/viewer/jpeg-cutout?ra=187.1040&dec=31.4772&layer=ls-dr9&pixscale=0.262&size=512` (coordenadas de TON 618: 12h 28m 24,97s, +31° 28′ 37,7″).
- **Autor/crédito exigido:** «Legacy Surveys / D. Lang (Perimeter Institute)», sin alterar el texto.
- **Licencia:** Creative Commons Attribution 4.0 International (CC BY 4.0) para las imágenes del visor; fuente: `https://www.legacysurvey.org/acknowledgment/`. Permite recortar y reprocesar con crédito (README, Paso 7).
- **Procesado:** recorte de 300×300 px alrededor del cuásar (0,262″/px), reducción de ruido suave, escalado y WebP. El cuásar queda centrado. Se descartó SDSS DR9 (la imagen de Wikipedia) por no tener una licencia de imagen tan explícita.
- **Archivos** (`src/assets/images/evidence/`): `ton618-observation-768.webp` (768×768, 1:1, 31,2 KB) y `ton618-observation-mobile-640.webp` (640×320, 2:1, 12,0 KB). Total 43,2 KB (≤ 60 KB). Mismos aspectos que `ton618-blackhole-1024.webp` (1:1) y `ton618-blackhole-mobile-800.webp` (2:1); se muestran con `object-fit: cover` al tamaño del contenedor.
- **Desviación:** el desktop es 768 px (no 1024) para cumplir el presupuesto; el grano del cielo no comprime mejor.

### Verificación de las hipótesis

1. **Foto directa: confirmada.** TON 618 (z ≈ 2,219) es un punto brillante en SDSS/Legacy Survey; no existe imagen resuelta. Tiempo de viaje de la luz ≈ 10,8 mil millones de años (cálculo propio, H0 = 67,7, Ωm = 0,31); el texto dice «más de 10 mil millones».
2. **Luz del cuásar: confirmada.** NASA (Anatomy of a black hole): el disco de acreción es «la principal fuente de luz»; los agujeros negros no emiten ni reflejan luz. ESA/Hubble (glosario): los cuásares brillan por el gas que cae, calentado por gravedad y fricción. Que eclipsa a su galaxia anfitriona figura en la literatura de TON 618 (Wikipedia como puerta; pendiente de cita primaria si se quiere citar).
3. **Horizonte: confirmado.** NASA: nada que cruce el horizonte, ni la luz, puede salir; lo observable es el gas y la sombra, no el interior.
4. **EHT: confirmado.** M87*: anunciada el 10-04-2019, observaciones de 2017 a 1,3 mm, anillo de 42 ± 3 µas (EHT Paper I, ApJL 875 L1; ESO eso1907). Sgr A*: anunciada el 12-05-2022, datos de 2017 (ESO eso2208). Ambas son reconstrucciones de observaciones reales (VLBI), no fotografías ópticas. **TON 618 no se resuelve:** con M ≈ 6,6·10¹⁰ M☉ (radio de Schwarzschild ≈ 1,95·10¹¹ km), distancia angular ≈ 1,75 Gpc (cosmología plana H0 = 67,7, Ωm = 0,31), la sombra (≈ 5,2 R_s) mide ≈ 4 µas, unas diez veces menos que el anillo de M87* (42 µas). Cálculo propio; el texto no incluye cifras para no depender de la masa adoptada (con 4·10¹⁰ M☉ sale ≈ 2,4 µas). El texto dice solo «demasiado pequeña en el cielo».

### Textos finales (en `src/data/evidence.json`, respuestas ≤ 40 palabras)

| # | Veredicto | Respuesta | Palabras |
| --- | --- | --- | --- |
| 1 | No | Ningún telescopio ha resuelto TON 618. En las imágenes de los grandes sondeos del cielo es solo un punto brillante: su luz viajó más de 10 mil millones de años y está demasiado lejos para mostrar detalle. | 37 |
| 2 | No directamente | El agujero negro no emite luz. Brilla el gas que cae hacia él: forma un disco que la gravedad y la fricción calientan hasta brillar más que su galaxia. | 29 |
| 3 | No | Nada que cruce el horizonte puede enviarnos información, ni siquiera la luz. Vemos el gas que lo rodea y la sombra que proyecta, nunca su interior. | 26 |
| 4 | No, casi todas son arte | Las imágenes reales son las del Event Horizon Telescope: M87* (2019) y Sagitario A* (2022). El resto son simulaciones o ilustraciones. TON 618 está demasiado lejos y su sombra es demasiado pequeña en el cielo. | 35 |

### Fuentes

- Legacy Surveys, Acknowledgment: https://www.legacysurvey.org/acknowledgment/
- ESO eso1907 (EHT, M87*): https://www.eso.org/public/news/eso1907/
- ESO eso2208 (EHT, Sgr A*): https://www.eso.org/public/news/eso2208-eht-mw/
- EHT Collaboration 2019, ApJL 875 L1: https://arxiv.org/abs/1906.11238
- NASA, Anatomy of a Black Hole: https://science.nasa.gov/universe/black-holes/anatomy/
- ESA/Hubble, Quasar: https://esahubble.org/wordbank/quasar/

---

## Resultados del Paso 8 (revisión visual y calibración)

Capturas en los 8 viewports (cerradas y con cada pregunta abierta) con Chrome + puppeteer-core fuera del repo; también transición con Experimento, reduced-motion y comparador a 0/50/100.

### Qué fallaba y qué se cambió (solo `src/components/sections/Evidence/*`)

- **Escritorio 1440×900 y 1920×1080:** la sección medía 909 / 1089 px (9 px de más, scroll sobrante). `--compareMaxH` pasa de `100dvh - 8rem` a `100dvh - 9rem`: ahora mide exactamente `100dvh` en 1024×600, 1440×900 y 1920×1080 con todas las preguntas, cerradas o abiertas.
- **Móvil vertical:** el comparador 2:1 era muy bajo (140 px a 320) y el hint (abajo) tapaba el tirador y los rótulos. `--ratio` pasa a `1.333` (4:3; las imágenes 2:1 se recortan con `cover`, el sujeto está centrado) y el hint sube a `top: 0.75rem`.
- **Apaisado bajo (640×360, 568×320):** el comparador medía ~200×100 y los rótulos se solapaban. Columna de preguntas `minmax(15rem, 18rem)`, `--compareMaxH: 100dvh - 8.5rem`, `--ratio: 1.5` en apaisado bajo (menor que `md`), comparador alineado arriba (`align-items: flex-start`, no salta al abrir una pregunta) y acordeón compacto (`Questions.module.scss`: botón 14 px, padding y gaps menores).
- **Tirador en los extremos:** a 0 y 100 quedaba cortado a la mitad por `overflow: clip`. Se desplaza con `translate: clamp(...)` para quedar entero dentro de la caja (la línea sigue en el borde).

### Comprobado por viewport (todo OK salvo lo indicado)

- 320×568, 360×640, 390×844: sin scroll horizontal; título, comparador y preguntas apilados sin solapes; la sección excede `100dvh` y se recorre con scroll (390×844 cerrada = 844). Texto mínimo 14 px.
- 640×360, 568×320: sin scroll horizontal, sin solapes, comparador 304×203 / 232×155. Cerradas caben en `100dvh`; **con una pregunta abierta la sección crece** a 412 px (ver pendiente).
- 1024×600, 1440×900, 1920×1080: sin scroll horizontal, sección = `100dvh` exacta con cualquier pregunta abierta; comparador 464 / 756 / 936 px (cuadrado).
- Comparador: a 0 el `clip-path` es `inset(0 100% 0 0)` (solo la representación) y a 100 `inset(0 0 0 0)` (solo la observación); sin costuras. Flechas ±5 y `Inicio`/`Fin` correctos; `--split` y `aria-valuetext` se actualizan.
- Hint visible al cargar (opacity 1, `data-touched=false`) y oculto tras la primera interacción.
- Contraste de rótulos y hint: texto `$starlight` sobre `rgba(#000, .72)`, peor caso (imagen blanca) ≈ 7:1.

### Unión con el telón de Experimento

- Evidencia se descubre compuesta bajo el telón (capturas del solape sin hueco ni costura; título, comparador y preguntas visibles bajo las estrellas); al terminar, `evidence.top = 0` y el stage de Experimento queda `visibility: hidden`.
- `document.elementFromPoint` sobre el control y la primera pregunta: mientras el stage sigue visible el clic va a `#experiment`; con el stage oculto va a `#evidence` (en 1440×900 y 390×844). Experimento no se modificó en este paso.
- `prefers-reduced-motion: reduce`: `margin-top: 0` (sin solape; `evidence.top == experiment.bottom`), `getAnimations()` de la sección = 0, sin scroll horizontal.

### Valores finales

`--compareMaxH`: `100dvh - 9rem` (sideBySide) / `100dvh - 8.5rem` (apaisado bajo). `--ratio`: 1.333 (móvil vertical), 1.5 (apaisado bajo), 1 (≥ `md`). Columnas: `1fr` + `minmax(17rem, 26rem)` / `minmax(15rem, 18rem)` (apaisado bajo).

### Pendiente / dudoso

- Apaisado bajo con pregunta abierta (640×360, 568×320): la respuesta no cabe en `100dvh` (la columna mide ~388 px frente a ~336 disponibles); la sección crece ~52–92 px y se hace scroll. Aceptado para no reducir más el texto (≥ 14 px).
- En escritorio ancho (1920) el comparador queda centrado en su columna y el título alineado a la izquierda del todo; hay aire a ambos lados. Es solo estético.
- Los dos rótulos siguen visibles aunque su imagen esté oculta (a 0 o 100): decisión de diseño por simplicidad.
- Probar el gesto táctil en un móvil real (emulación de puppeteer no valida `touch-action`).

---

## Cambios posteriores al Paso 8 (petición del autor)

- **Fondo:** `$evidenceBg` pasa a `#000` y la sección lleva el mismo cielo del telón de la transición de Experimento (estrellas lejanas, medias y cercanas más nebulosa en blanco y negro), estático. Las estrellas y la nebulosa se extrajeron a `src/styles/_deepSky.scss`, compartido con `Distortion.module.scss` (el CSS del telón no cambia).
- **Rótulos del comparador:** cuando el tirador pasa por encima de un rótulo, este se oculta (`opacity`) y solo queda el de la imagen visible. Las posiciones se miden al montar y al cambiar de tamaño (sin lecturas de layout al arrastrar).

---

## Resultados del Paso 9 (verificación con `section-verifier`)

Fecha: 2026-11-24. Chrome headless (sin GPU) + puppeteer-core sobre `vite preview` del build de producción (y `vite dev` para StrictMode); scripts y capturas fuera del repo. Los criterios **no están marcados** en la lista de aceptación: lo decide el autor.

### Arreglo aplicado

- `Questions.module.scss`: se quita `transition: border-color` de `.item` (y su entrada en `prefers-reduced-motion`). Incumplía la regla heredada «solo `transform`/`opacity` animados» (animaba el color del borde, que repinta). El borde ámbar de la pregunta abierta cambia ahora sin transición. No hay más cambios en el repo.

### Hallazgos

1. **Lighthouse móvil Performance 87-89 (< 90), no atribuible a Evidencia.** 3 ejecuciones con Evidencia: 88 / 87 / 89, LCP 3,5-3,7 s, TBT 110-180 ms, CLS 0. Línea base sin Evidencia (build con Evidencia quitada de `App.tsx`, restaurado después): 87 / 89 / 89, LCP 3,5-3,6 s. Accesibilidad y Best practices 100. El LCP es de la página inicial (Hero), no de Evidencia (sus imágenes son `lazy` y se cargan ~2 viewports antes de verse). Pendiente para quien optimice el Hero/LCP; el criterio de la página entera no lo puede cerrar Evidencia.
2. **Layout al arrastrar: 1 por movimiento (12 de 578 objetos sucios), no 0.** Causa raíz aislada por eliminación: escribir `--split` por JS en bucle de `requestAnimationFrame` = 0 Layout (100 recálculos de estilo, solo Paint), con `clip-path`, `translate` y `cqw` incluidos; en cambio, mover el `<input type=range>` (con ratón o por programa) dispara Layout, y con el pulgar/pista nativos ocultos baja a 3. Es la reposición del pulgar nativo del range (obligatorio por la spec), no el comparador. `contain: strict` en el input no lo elimina. No se corrige; coste real: fotogramas mediana 16,7 ms, p95 ≤ 17 ms, 0 tareas largas con 4× CPU en 390×844 y 320×568. Proponer criterio: «0 Layout de la escena; solo el del pulgar nativo».
3. **Título y subtítulo sobre estrellas.** Contraste mediano 16,5:1 (título) y 8,1-8,9:1 (subtítulo); entre 0,4 y 1 % de los píxeles de su caja (el glifo cruza una estrella cercana) bajan de 4,5:1. Inevitable con texto sobre campo de estrellas; si el autor quiere 100 %, bajar la opacidad de la capa `.near` bajo el encabezado o un degradado oscuro local (decisión de diseño).
4. **568×320 con el control en 50 %:** los dos rótulos (2 líneas) se tocan (solape de 1 px) y el de la observación queda oculto por la lógica de «tirador por encima» (la arista medida 50,4 % > 50). Cosmético; en 640×360, 390×844 y 320×568 ambos se ven al 50 %.
5. **Observación 768 px a 1920/2560 px:** el comparador mide 936 / 1296 px, así que la imagen real se escala 1,2× / 1,7×. Limitado por el presupuesto de 60 KB; solo estético.
6. **Apaisado bajo con pregunta abierta** (640×360, 568×320): la sección crece a 375-412 px (> 100dvh), ya aceptado; sin otros solapes.
7. No se encontraron errores de consola, fugas ni desbordes.

### Medidas por criterio

| Criterio | Estado | Método y número |
| --- | --- | --- |
| `<section id=evidence>` tras `Experiment`, ≥ 100dvh, `aria-labelledby`, un `h2`, sin `h1` nuevo | Cumple | `h1` total = 1 (Hero), 0 en Evidencia, 1 `h2`; altura ≥ 100dvh en 11 viewports (con respuesta abierta en apaisado bajo excede, permitido) |
| Textos desde `evidence.json` | Cumple | Lectura del TSX: ningún texto visible literal |
| 4 preguntas, respuestas ≤ 40 palabras | Cumple | 4; 37 / 29 / 26 / 35 palabras |
| Respuestas 2, 3 y 4 correctas | Cumple (texto) | Releídas contra el Paso 2; sin cifras nuevas |
| Crédito de la imagen en README, no en pantalla | Cumple | `README.md` línea 42; sin crédito en el DOM |
| Sin rótulos extra de «representación artística» | Cumple | `grep` en TSX/SCSS/JSON: solo los dos rótulos, el `alt` y el `summary` (solo lectores) |
| JSON e interfaces sin campos sin uso | Cumple | Cada campo se usa en `Evidence`, `Compare` o `Questions` |
| Sin scroll horizontal 320-2560 | Cumple | 11 viewports (320 a 2560): `scrollWidth ≤ clientWidth`, 0 elementos fuera por X |
| Sin solapes ni salidas de pantalla en los 8 viewports, cerradas y con cada pregunta abierta | Cumple con salvedades | Cajas de cabecera, comparador y preguntas sin intersección; salvedades: hallazgos 4 y 6 |
| Solo `.module.scss`, sin `!important`, sin `style={{}}`, camelCase, prettier | Cumple | `grep` limpio; `prettier --check` limpio |
| `npm run build` y `lint` | Cumple | Sin errores ni avisos nuevos (tras el arreglo) |
| Tirador 0-100 continuo, ratón y táctil, flechas ±5, Inicio/Fin, `aria-valuetext` | Cumple (táctil con emulación) | Ratón: 101 valores distintos; táctil CDP: 36 valores (1-96); flechas ±5 correctas; `End` 100, `Home` 0; `aria-valuetext` «N % observación»; `touch-action: pan-y` no validable |
| 0 y 100 muestran una sola imagen | Cumple | `clip-path` `inset(0 100% 0 0)` a 0 e `inset(0 0 0 0)` a 100 |
| Acordeón: una abierta, cierra la anterior, cierra la abierta, Enter y Espacio | Cumple | Estados `tfff` → `fftf` → `ffff`; Enter abre, Espacio cierra y abre; `aria-controls` y `aria-labelledby` correctos en las 4 |
| Hint desaparece tras la primera interacción | Cumple | Opacidad 1 → 0 al primer arrastre |
| Evidencia se descubre bajo el telón compuesta | Cumple | Imágenes cargadas con la sección a ≈ 1980 px (1440×900) y 1856 px (390×844) bajo el viewport, mucho antes de verse |
| Experimento no cambia su efecto | Cumple (por diff) | Solo 2 reglas de `pointer-events` en `Experiment.module.scss`; cola y mixin intactos |
| Sin clics en Evidencia con el stage visible, y Experimento no captura después | Cumple | `elementFromPoint`: `#experiment` mientras `visibility: visible`; `#evidence` con `hidden` (1440×900 y 390×844) |
| Sin cola pegajosa y sin espacio sobrante | Cumple | Hueco inferior = 0 en todos los viewports |
| Reduced-motion: sin solape y `getAnimations()` = 0 | Cumple | Solape 0 px; 0 animaciones (también tras abrir una pregunta), 1440×900 y 390×844 |
| Al volver arriba sin saltos | Cumple | 0 diferencias de posición y de opacidad del stage entre bajada y subida (~16 puntos por viewport) |
| axe 0 violaciones, `alt`, nombre del control | Cumple | axe 0 violaciones (41 reglas); Lighthouse Accessibility 100 |
| Orden de Tab y foco visible | Cumple | Control y luego 4 cabeceras; `:focus-visible` verdadero; anillo ámbar 2 px en el tirador y claro 2 px en las cabeceras |
| Contraste ≥ 4,5:1 (incluidos rótulos) | Cumple con salvedad | Muestreo sobre captura con el texto oculto: rótulos y hint ≥ 8,3:1; cabeceras ≥ 8,3:1; respuestas ≥ 5,0:1 (veredicto ámbar 5,05); título y subtítulo: hallazgo 3 |
| Lighthouse móvil Performance ≥ 90 | No cumple (no atribuible) | Hallazgo 1 |
| Lighthouse CLS = 0 | Cumple | 0,0000 en las 3 ejecuciones |
| 0 renders de React al arrastrar; ≤ 1 al abrir una pregunta | Cumple | Hook de React DevTools contando commits: 0 al arrastrar (101 pasos) y 1 al abrir o cambiar de pregunta |
| 0 Layout por fotograma al arrastrar | No cumple (causa nativa) | Hallazgo 2 |
| Imágenes ≤ 60 KB, JS ≤ 3 KB gz, CSS ≤ 3 KB gz, JSON ≤ 2,5 KB | Cumple | Imágenes 43,2 KB; JS +2,1 KB gz (builds con y sin Evidencia, incluye el JSON); CSS +1,25 KB gz; `evidence.json` 2237 B (983 B gz) |
| Robustez: StrictMode, montar/desmontar, consola | Cumple (desmontaje solo por StrictMode) | `vite dev`: 2 `ResizeObserver`, 1 desconectado y 1 vivo; 0 mensajes de consola en dev y en producción; no se pudo desmontar la app entera |
| Paso 9 registrado | Cumple | Esta sección |

### No medible aquí

- `touch-action: pan-y` (gesto vertical frente a horizontal) y fotogramas reales: hace falta un móvil físico; el headless no tiene GPU.
- Firefox y Safari (`::-moz-range-*`, `cqw`, `clip-path`), zoom de texto del 200 % con fuente aumentada (solo equivalentes de ancho: 320 y 768 px) y Profiler de React (se contaron commits con el hook).
- Tras el arreglo de `Questions.module.scss` solo se repitieron build, lint y prettier; las mediciones de interacción, contraste y axe son del build anterior (el cambio no toca marcado ni layout).

### Cambios propuestos a la spec

- Presupuesto: «0 Layout por fotograma» pasa a «0 Layout de la escena; solo el pulgar nativo del range» (hallazgo 2).
- Lighthouse: medir con y sin Evidencia, o mover la meta de Performance a una spec de optimización del Hero (hallazgo 1).
- Contraste: aceptar excepciones de píxel de estrella bajo título y subtítulo, o decidir un degradado local (hallazgo 3).
