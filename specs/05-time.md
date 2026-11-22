# SPEC 05 — Tiempo / Un mensaje del pasado

**Estado:** Approved
**Depende de:** SPEC 04 (y, por ella, SPEC 03, SPEC 02 y SPEC 01)
**Fecha:** 2026-11-22
**Objetivo:** Implementar la sección Tiempo como quinta escena de la web: una línea temporal horizontal sobre un cielo de estrellas y nebulosa, por la que una partícula de luz (movida por el scroll de un tramo pegajoso) viaja desde TON 618 hasta la Tierra mientras van apareciendo cinco hitos de la historia del universo, y que termina con el mensaje «Cuando observamos el universo, también estamos observando su pasado».

Origen del contenido: `docs/ideas/05-time.md`. Datos y textos verificados por el agente `cosmic-data-researcher`; diseño y animación por el agente `web-motion-designer`; verificación final por el agente `section-verifier`.

Recursos: **ninguno nuevo.** La imagen de TON 618 (`ton618-blackhole-1024.webp` del Hero), la Tierra (`earth.webp` de Escala) y la nebulosa del Hero (`nebula.webp`, `nebula-mobile.webp`) se reutilizan; las estrellas y la partícula van en código. La pendiente de licencia de la Tierra (SPEC 04) se hereda.

---

## Alcance

### Incluido

- Componente de sección `Time` (`<section id="time">`) montado en `App.tsx` tras `Scale`.
- **Línea temporal horizontal** que representa el viaje de la luz: a la izquierda, TON 618 (origen); a la derecha, la Tierra (llegada). Una partícula luminosa avanza por ella con un rastro que va rellenando la línea.
- **Movimiento por scroll:** la sección es un track pegajoso (`sticky`); el scroll nativo avanza la partícula de 0 a 1 mientras el stage queda fijo. No hay deslizante ni botones: es una escena contemplativa, sin controles.
- **Cinco hitos** (en este orden: Sol, Tierra, vida, dinosaurios, humanos), cada uno con un marcador en la línea y una **etiqueta breve** (nombre y «hace X años»). Aparecen cuando la partícula pasa por ellos y se quedan visibles. Más la etiqueta de salida (TON 618) y la de llegada (hoy, la Tierra).
- **Compresión suave de la escala de tiempo:** ni lineal ni logarítmica; las posiciones salen de anclas calibradas (ver «Escala de tiempo»).
- **Mensaje final** («Cuando observamos el universo, también estamos observando su pasado») al llegar la luz a la Tierra, con una pausa de scroll antes de soltar el stage.
- **Cielo:** estrellas y nebulosa (no fondo negro), con los mismos elementos que la intro de Escala, sin recursos nuevos.
- **Transición desde Escala:** fundido de Escala con el escenario pegado y entrada del cielo de Tiempo, ver «Transición con Escala».
- Layout adaptado a escritorio y a móvil vertical y apaisado (línea siempre horizontal).
- Accesibilidad: texto completo de los hitos y del mensaje siempre en el DOM (lista ordenada), `summary` para lectores de pantalla, contraste de las etiquetas sobre la nebulosa.
- Comportamiento completo con `prefers-reduced-motion: reduce` (escena estática ya compuesta).
- Fallback sin `animation-timeline` con `useTrackProgress`.
- Datos mínimos en `src/data/time.json` con interfaces en `src/interfaces/time.ts`; anclas y constantes de presentación en `src/utils/timeScale.ts`.

### Excluido (otros specs)

- Controles de usuario: deslizante, botones de parada, «Volver a empezar», zoom o arrastre sobre la línea. El único gesto es el scroll.
- Tarjetas con kicker, título y párrafo largo por hito (una etiqueta breve basta).
- Más de cinco hitos (Vía Láctea, primeros animales, extinciones, etc.) y los acontecimientos de la historia previa a la salida de la luz.
- Audio y sonido ambiente.
- Rótulos de «representación artística», «no a escala» o similares en pantalla (criterio de contenido mínimo del proyecto).
- Datos numéricos destacados fuera de las etiquetas (corrimiento al rojo, edad del universo, expansión del espacio, distancia comoving). La etiqueta de salida solo da el tiempo de viaje.
- Cambios en Hero, Exploración o Ciencia. En Escala solo el fundido final de la transición (ver «Transición con Escala»).
- Navegación completa (rutas, `history.replaceState`, `React.lazy`), Navbar y Footer.
- La sección 06 — Experimento y siguientes.

---

## Modelo de datos

Archivos: `src/interfaces/time.ts` y `src/data/time.json`. Solo contienen lo que se muestra en pantalla o se lee en lectores de pantalla (regla de limpieza al cerrar una sección).

```ts
// src/interfaces/time.ts
export type TimeMilestoneId = 'sun' | 'earth' | 'life' | 'dinosaurs' | 'humans';

export interface TimeEndpoint {
  label: string; // «Sale de TON 618» / «Llega a la Tierra»
  when: string; // «hace más de 10 mil millones de años» / «hoy» (verificado)
}

export interface TimeMilestone {
  id: TimeMilestoneId;
  label: string; // «Nace el Sol», «Nace la Tierra», «Aparece la vida», «Reinan los dinosaurios», «Aparece el ser humano»
  when: string; // «hace 4 600 millones de años», etc. (verificado)
}

export interface TimeData {
  title: string; // «Un mensaje del pasado» (h2 visible)
  subtitle: string; // «Más de 10 mil millones de años»
  hint: string; // invitación del estado inicial («Desliza para seguir la luz»)
  summary: string; // equivalente textual de la escena para lectores de pantalla
  departure: TimeEndpoint;
  milestones: TimeMilestone[]; // 5, de más antiguo a más reciente
  arrival: TimeEndpoint;
  message: string; // «Cuando observamos el universo, también estamos observando su pasado.»
}
```

La posición de cada hito en la línea y las cotas del scroll **no** van en el JSON (son presentación): viven en `src/utils/timeScale.ts` y en tokens SCSS.

```ts
// src/utils/timeScale.ts (los valores finales los fija el Paso 9)
// Anclas de posición 0…1 en la línea (0 = salida, 1 = llegada), monótonas en el orden cronológico:
export const MILESTONE_POS = { sun: …, earth: …, life: …, dinosaurs: …, humans: … };
// Carril de cada etiqueta (lado de la línea y altura) para que no se solapen:
export const LABEL_LANE = { departure: …, sun: …, earth: …, life: …, dinosaurs: …, humans: …, arrival: … };
```

Convenciones:

- Progreso del viaje: `0…1`, entero a `0…1000` solo si hace falta para depurar. La fuente de verdad es la posición de scroll dentro del track.
- La partícula avanza a **velocidad constante en el scroll**: su posición es `progreso × longitud de la línea`. La compresión del tiempo se aplica **solo a los marcadores** (su posición en la línea), no al movimiento. Una etiqueta aparece cuando la partícula pasa por el ancla de su hito.
- Las fechas (`when`) y el tiempo de viaje los verifica `cosmic-data-researcher` (referencia: corrimiento al rojo z ≈ 2,219 de TON 618 ⇒ ≈ 10 800 Ma de tiempo de viaje; NASA: «más de 10 mil millones de años»; Sol ≈ 4 600 Ma, Tierra ≈ 4 540 Ma, vida ≈ 3 500–3 800 Ma, dinosaurios ≈ 230 Ma, *Homo sapiens* ≈ 300 000 años).

### Datos físicos verificados

Consulta: 2026-11-22.

- **Tiempo de viaje de la luz:** z = 2,219 (NED). Tiempo de retrospección (*lookback time*) en ΛCDM plano: `t = (1/H₀) ∫₀^z dz' / [(1+z') √(Ωm(1+z')³ + ΩΛ)]`. Con Planck 2018 (H₀ = 67,4 km/s/Mpc, Ωm = 0,315) da 10,84 Ga; con H₀ = 67,7 y Ωm = 0,31, 10,84 Ga; con H₀ = 70 y Ωm = 0,3, 10,56 Ga. Se usa 10 800 Ma y en pantalla «hace más de 10 mil millones de años» (cierto en toda la horquilla 10,5–10,9 Ga). No es la distancia actual (comóvil ≈ 18 Gal), que no se muestra. No se halló una página de NASA que dé la cifra; el «más de 10 mil millones» de la idea original queda respaldado por el cálculo.
- **Hitos** (en Ma): Sol 4 600 (NASA: se formó hace ≈ 4,6 mil millones de años); Tierra 4 540 (edad radiométrica clásica, Patterson 1956 / USGS); vida 3 500 (evidencia más aceptada: microfósiles y estromatolitos del Pilbara, ≈ 3,47–3,5 Ga; las del Isua, ≈ 3,7 Ga, son discutidas, por eso «hace unos»); dinosaurios 230 (primeros dinosaurios del Triásico, Ischigualasto, ≈ 228–231 Ma); humanos 0,3 (*Homo sapiens* de Jebel Irhoud, ≈ 300 000 años, Hublin et al., *Nature*, 2017).
- **Etiquetas:** exactas para Sol y Tierra («hace 4 600 millones…», «hace 4 540 millones…»); «hace unos…» para vida, dinosaurios y humanos.

### Escala de tiempo

- **Ni lineal ni logarítmica.** En escala lineal real Sol y Tierra quedarían a un 0,6 % de distancia, vida al 66 % y dinosaurios y humanos pegados a la llegada (98–100 %); ilegible. Se usan **anclas calibradas a mano** (`MILESTONE_POS`), monótonas en el orden cronológico real, repartidas en carriles (lado y altura, `LABEL_LANE`) para que las etiquetas no se solapen en móvil.
- **Honestidad:** no se muestran escalas, números de eje ni la palabra «proporcional». El orden y los «hace X años» de las etiquetas son los reales; la distancia visual entre hitos no lo es. Se acepta como licencia de diseño (compresión suave decidida por el autor) y se registra en «Decisiones».
- Sol y Tierra (≈ 60 Ma de diferencia) se separan solo lo justo y sus etiquetas van en lados opuestos de la línea (una arriba, otra abajo).

---

## Recursos visuales

Poco elemento visual, transiciones lentas y tiempo para contemplar (idea original). Elementos de la escena (de atrás hacia delante):

| Elemento      | Recurso                                                                                             | Notas                                                                                 |
| ------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Fondo         | Color `$timeBg` (azul cósmico muy oscuro, de la paleta) + nebulosa del Hero (`nebula.webp`, `nebula-mobile.webp`) con máscara radial | Sin recursos nuevos; la nebulosa queda tenue para que las etiquetas se lean            |
| Estrellas     | 2–3 capas SVG en código con PRNG con semilla (reutiliza o extrae el generador de `scaleSky.ts`)    | Fijas; parpadeo muy lento y solo con la sección en vista                               |
| Línea         | Un `<div>` fino con degradado; una segunda capa (`fill`) con `scaleX` 0 → 1 que sigue a la partícula | Solo `transform`; no se anima `width`                                                  |
| Origen        | `ton618-blackhole-1024.webp` con recorte circular a ≈ 56 px de diámetro                              | Misma imagen que Hero y Escala                                                         |
| Destino       | `earth.webp` a ≈ 56 px                                                                              | Reutiliza el recurso de Escala; se «enciende» (opacidad + escala suave) al llegar la luz |
| Partícula     | Círculo con `radial-gradient` + halo en CSS (sin `filter`)                                          | Rastro por la capa `fill`                                                              |
| Marcadores    | Puntos en CSS sobre la línea, con una raya corta hacia su etiqueta                                   | Aparecen con `opacity` + `scale`                                                       |
| Etiquetas     | Texto HTML (nombre + «hace X años»), alternadas arriba y abajo de la línea                           | Entran con `opacity` + `translate`                                                     |
| Mensaje       | Texto HTML centrado sobre la línea al llegar la luz                                                  | Entra con fundido lento                                                                |

**Reglas heredadas:** solo `transform`/`translate`/`scale` y `opacity` animados (más `visibility` discreta); sin `filter` ni `backdrop-filter`; `will-change` solo en las capas que se mueven mientras se mueven; animaciones pausadas con `data-inview="false"`. Mismos tokens de duración y easing que Ciencia y Escala.

---

## Comportamiento

### Layout

- **Desktop (`$sideBySide`):** la línea ocupa el 72 vw centrada y a ≈ 56 svh de alto; origen a la izquierda y Tierra a la derecha; etiquetas arriba y abajo alternadas; título y subtítulo arriba a la izquierda; el mensaje final centrado encima de la línea.
- **Móvil vertical:** la línea sigue horizontal y ocupa ≈ 84 vw; las etiquetas alternan arriba y abajo, con texto corto y de ≥ 14 px; el mensaje final bajo la línea en dos o tres líneas. Se usa `--viewportExtra` como en Escala.
- **Móvil apaisado bajo:** línea con etiquetas más compactas; título y subtítulo se ocultan al aparecer el mensaje; ningún texto tapa la línea ni sale de la pantalla.
- La sección es un **track de scroll** (`$timeIntro` = 100 svh + `$timeTravel` = 450 svh de recorrido + `$timeHold` = 80 svh de pausa tras el mensaje) con el stage `position: sticky` de `100dvh`. Cifras orientativas; se calibran en el Paso 9.

### Interacción y estados

- **Sin estado de React.** No hay controles; el progreso se resuelve por CSS (`animation-timeline`) con fallback `useTrackProgress` (escribe `--progress`). La sección no tiene `useState`.
- **Fases (x = unidades de scroll del track; se calibran):**

| Evento                                                                       | Intervalo de progreso |
| ---------------------------------------------------------------------------- | --------------------- |
| Intro: entra el cielo, aparecen título, subtítulo, línea, origen y destino    | intro                 |
| Estado inicial: partícula en TON 618, hint visible (desaparece al arrancar)   | 0                     |
| Viaje: la partícula avanza y el rastro rellena la línea; los hitos aparecen   | 0 → 1                 |
| Llegada: la Tierra se enciende y aparece la etiqueta de llegada               | 1                     |
| Mensaje: fundido lento del texto; el resto de la escena se atenúa un poco     | 1 → hold              |
| Hold: pausa con el mensaje visible; después el stage se suelta                | hold                  |

- **Hitos:** cada marcador y etiqueta se muestran al cruzar su ancla y se quedan; al volver hacia arriba se ocultan de forma inversa y reversible (sin saltos).
- **Mensaje:** `<blockquote>` o `<p>` con el texto de `message`; el resto de etiquetas pasan a opacidad ≈ 0,6 para dejarlo en primer plano.
- **Lectores de pantalla:** el visual (cielo, línea, partícula, marcadores) es `aria-hidden`; los hitos van en una `<ol>` con sus textos siempre en el DOM (visualmente ocultos hasta su turno solo con `opacity`, nunca con `display: none`); `summary` solo para lectores; no hay `aria-live` (la lectura sigue el orden del DOM). Sin foco interactivo: la sección no tiene elementos focalizables.

### Transición con Escala

La transición ocurre con el escenario pegado; Escala no se desliza hacia arriba (mismo patrón que Ciencia → Escala).

- **Fundido de Escala** (`$scaleFade` = 50 svh tras su último estado): el visor de TON 618 se encoge hacia su centro (×1 → ×0,02) y el stage entero pasa de opacidad 1 a 0, quedando `visibility: hidden`. El track de Escala suma esos 50 svh y Escala queda por encima (`z-index: 1`).
- **Intro de Tiempo** (`$timeIntro` = 100 svh, solapada con el fundido de Escala mediante margen negativo): bajo la imagen que se apaga aparecen las estrellas (abriéndose desde el centro con distinta velocidad) y la nebulosa; título, subtítulo, línea y la imagen pequeña de TON 618 del origen aparecen con fundido. La partícula espera quieta en el origen.
- **Continuidad:** la imagen de TON 618 que se encoge al centro y el origen pequeño de la izquierda son dos elementos distintos (no se anima el desplazamiento de uno a otro); el fundido los cruza.
- **Vídeo del Sol de Escala:** ya queda pausado fuera de vista; si Escala usa `data-faded` para pausar, se aprovecha el mismo mecanismo.
- Al volver hacia arriba todo se revierte sin saltos ni costuras.

### Reduced-motion

`.track` colapsa a 100dvh sin sticky y sin solape; no hay intro ni fundido; la escena aparece **ya compuesta**: la línea llena, los cinco hitos y sus etiquetas visibles, la partícula en la Tierra y el mensaje final. Estrellas estáticas, sin parpadeo; `document.getAnimations()` de la sección devuelve 0.

### Sin `animation-timeline`

`useTrackProgress` escribe `--progress`; el CSS bajo `@supports not (animation-timeline: view())` reproduce las fases con `clamp`. No hay solape con Escala: el tramo entre ambas se recorre con el cielo ya presente.

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional. Agentes: `cosmic-data-researcher` (paso 2), `web-motion-designer` (pasos 1, 3, 4, 5, 6, 7 y 9), `section-verifier` (paso 10).

1. **Tokens y base.** En `_variables.scss`: `$timeBg`, `$timeIntro`, `$timeTravel`, `$timeHold`, `$scaleFade` y los mixins de altura del track (análogos a `scaleTrackHeight`). Esqueleto de `src/utils/timeScale.ts` (formas sin valores finales).
2. **Datos.** `src/interfaces/time.ts` y `src/data/time.json` con textos verificados (`cosmic-data-researcher`): `title`, `subtitle`, `hint`, `summary`, `departure`, 5 `milestones`, `arrival` y `message`. El investigador fija y documenta en este spec el tiempo de viaje de la luz (con z y cosmología), las fechas de los cinco hitos y el texto de las etiquetas.
3. **Sección estática.** `Time.tsx` y `Time.module.scss`: `<section id="time" aria-labelledby>`, `h2` visible, subtítulo, hint, `summary` solo para lectores, `<ol>` de hitos, stage de 100dvh con cielo, línea, origen y destino; montada en `App.tsx` tras `Scale`. Estrellas reutilizando el generador de `scaleSky.ts` (extraerlo a `src/utils/` si hace falta, sin duplicarlo).
4. **Viaje por scroll.** Partícula, rastro (`fill`), aparición de marcadores y etiquetas ligados al progreso con `animation-timeline`; `MILESTONE_POS` provisional; track pegajoso.
5. **Transición con Escala.** Fundido de Escala (cambio mínimo y localizado en `Scale.module.scss`/`Scale.tsx`), intro de Tiempo con margen negativo, pausa del vídeo del Sol coherente con el fundido.
6. **Mensaje final y hold.** Fundido lento del mensaje, atenuación de las etiquetas, encendido de la Tierra y tramo de pausa.
7. **Fallback y reduced-motion.** `useTrackProgress` para navegadores sin timeline nativo; estado ya compuesto con reduced-motion; `data-inview` pausa el parpadeo de estrellas.
8. **Estilo y limpieza.** Prettier, lint, sin `!important`, sin `style={{}}` salvo valores dinámicos (la posición de cada marcador por variable CSS, no por estilo directo si se puede); revisar `time.json` e interfaces (ningún campo sin uso); eliminar lo que dejó de usarse.
9. **Revisión visual y calibración.** Capturas en los 8 viewports de referencia (320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900, 1920×1080); calibrar `MILESTONE_POS` y `LABEL_LANE`, los tramos del track, el contraste de las etiquetas sobre la nebulosa y la sensación contemplativa del ritmo. Registrar los valores finales en este spec.
10. **Verificación con `section-verifier`.** Rendimiento (capas, Layout/Paint durante el scroll), accesibilidad, responsive, robustez con medición en navegador; registrar resultados y pendientes en este documento.

### Calibración (Paso 9)

Medido con Chrome real y scroll real en los 8 viewports de referencia (inicio/hint, cinco hitos, llegada y mensaje): 0 solapes de texto, línea, marcadores y extremos; sin scroll horizontal (320–2560); contraste medido sobre píxeles reales del fondo renderizado (nebulosa + estrellas, con el halo de texto).

- **`MILESTONE_POS`:** sol 0,20 · tierra 0,36 · vida 0,52 · dinosaurios 0,74 · humanos 0,87 (orden cronológico, separación mínima 0,16 entre Sol, Tierra y vida). Humanos ≤ 0,87 para que su raya no toque la Tierra (48 px) en 320 px de ancho. `LABEL_LANE` no cambia.
- **Track:** `$timeIntro` 100 · `$timeTravel` 420 (antes 450) · `$timeHold` 80 = 600 svh de scroll (≈ 700 svh de altura del track con el viewport inicial). Los hitos aparecen cada ≥ 67 svh.
- **Mensaje:** ubicado en una banda inferior del stage (donde el hint ya se fue), no «sobre la línea»: con siete etiquetas visibles no hay hueco entre ellas.
- **Hold:** las etiquetas, marcadores y línea bajan a 0,85 (no 0,6, que daba 3,2–3,7:1 en las fechas ámbar).
- **Nebulosa:** opacidad 0,9 con velo radial opaco hasta el 55 %; visible pero tenue.
- **Texto:** espacios de no ruptura (U+00A0) en las cifras («4 600 millones», «300 000 años», «10 mil millones», «TON 618») para que no se partan en 320 px; en apaisado bajo el subtítulo baja a 0,75rem para no tocar la etiqueta de la vida.
- **Contraste medido (percentil 97 del fondo bajo cada línea de texto):** mínimo 5,5:1 en las escenas normales y ≥ 4,6:1 en el hold; en 640×360 «hoy» baja a 3,1:1 solo por una estrella puntual detrás (percentil 90: 5,9:1).
- **z-index:** Escala `1`, Ciencia `2`, Tiempo sin z-index (se pinta bajo Escala durante el solape).
- **Transición con Escala:** el stage de Escala mantiene `top: 0` durante el fundido; 0 Layout por frame en el recorrido de Tiempo (los pocos layouts medidos pertenecen al tramo de Escala).

---

## Presupuesto

| Concepto                            | Límite                                                   |
| ----------------------------------- | -------------------------------------------------------- |
| Recursos nuevos (imágenes, vídeo)   | 0 KB                                                     |
| JS de la sección                    | ≤ 4 KB gz                                                |
| CSS de los módulos de Tiempo        | ≤ 4 KB gz                                                |
| `time.json`                         | ≤ 2 KB                                                   |
| Capas compuestas grandes a la vez   | ≤ 6 (> 20 000 px²) en cada fase (el solape con Escala se mide aparte) |
| Trabajo por frame al hacer scroll   | solo composite (0 Layout, 0 Paint) tras calentar         |
| Renders de React                    | 1 (el montaje); 0 durante el scroll                      |
| Lighthouse móvil                    | Performance ≥ 90, CLS 0                                  |

---

## Criterios de aceptación

**Contenido y estructura**

- [ ] `<section id="time">` existe, se monta tras `Scale` en `App.tsx`, tiene `aria-labelledby`, un `<h2>` visible y ningún `<h1>` nuevo.
- [ ] Todos los textos visibles salen de `time.json`; ninguno está escrito en el TSX.
- [ ] Hay exactamente 5 hitos en el orden Sol → Tierra → vida → dinosaurios → humanos; sus fechas y el tiempo de viaje tienen fuente verificada.
- [ ] No aparece ningún rótulo de «representación artística», «ilustrativo» ni «no a escala», ni en pantalla ni en `summary`; no se muestran números de eje ni escala.
- [ ] Los JSON e interfaces no contienen campos que ningún componente use.
- [ ] No hay scroll horizontal entre 320 y 2560 px de ancho.
- [ ] Ni el título, ni las etiquetas ni el mensaje se solapan entre sí, con la línea ni con el origen o el destino, ni salen de la pantalla, en los 8 viewports de referencia y en las 6 posiciones de la escena (inicio, cada hito, llegada).
- [ ] No hay archivos `.scss` sueltos (solo `.module.scss`, salvo los parciales de `src/styles/`), ni `!important`, ni `style={{}}` salvo valores dinámicos; clases en camelCase; el código pasa `prettier --check`.
- [ ] `npm run build` termina sin errores de TypeScript ni de lint.
- [ ] La autoría y licencia de la Tierra (heredada de SPEC 04) están confirmadas y, si se exige, el crédito aparece.

**Viaje y escena**

- [ ] Con el scroll de 0 a 1 la partícula avanza de forma continua y a velocidad constante de TON 618 a la Tierra, sin saltos; el rastro llena la línea hasta la partícula.
- [ ] Cada hito aparece (marcador y etiqueta) cuando la partícula pasa por su ancla, queda visible, y al volver hacia arriba se oculta de forma inversa sin saltos.
- [ ] Los marcadores están en orden cronológico y sus etiquetas no se solapan; Sol y Tierra tienen etiquetas en lados opuestos de la línea.
- [ ] Al llegar la luz, la Tierra se enciende y aparece el mensaje «Cuando observamos el universo, también estamos observando su pasado»; el stage se mantiene fijo `$timeHold` de scroll antes de soltarse.
- [ ] El fondo muestra estrellas y nebulosa (no es negro puro) y el texto mantiene un contraste ≥ 4,5:1 sobre el fondo renderizado.

**Transición con Escala**

- [ ] Durante la transición el stage de Escala no se desplaza verticalmente (`getBoundingClientRect().top` constante) y no hay costuras ni tramos vacíos; al volver hacia arriba se revierte sin saltos.
- [ ] El visor de TON 618 de Escala se encoge hacia su centro y el stage llega a opacidad 0 mientras el cielo de Tiempo entra bajo él.
- [ ] Escala sigue funcionando (deslizante, botones de parada, scroll hasta 1000, vídeo del Sol); solo se añadió el fundido final.
- [ ] Con reduced-motion no hay intro ni fundido ni solape y `document.getAnimations()` de la sección devuelve 0.
- [ ] Sin `animation-timeline`, el viaje funciona vía `--progress` y la consola no muestra errores.

**Accesibilidad**

- [ ] axe/Lighthouse: 0 violaciones; el visual es `aria-hidden` y los 5 hitos, las etiquetas de salida y llegada y el mensaje son legibles para un lector de pantalla en orden.
- [ ] No hay elementos focalizables dentro de la sección; el orden de Tab no se rompe al pasar por ella.
- [ ] Con `prefers-reduced-motion: reduce` la escena aparece compuesta (hitos, línea y mensaje visibles) y `.track` no es sticky.
- [ ] Ningún destello supera 1 evento cada ~2 s; el parpadeo de estrellas es muy lento y nunca se anima el texto.

**Rendimiento** (Chrome DevTools, CPU 4× más lento, emulación móvil)

- [ ] Lighthouse móvil: Performance ≥ 90, CLS = 0.
- [ ] Durante el scroll del viaje y de la intro: 0 Layout y 0 Paint tras calentar; capas compuestas grandes ≤ 6 en cada fase.
- [ ] ≥ 95 % de los frames por debajo de 20 ms durante el scroll (en dispositivo real si el entorno no tiene GPU).
- [ ] Con `data-inview="false"`, `document.getAnimations()` filtrado por la sección devuelve 0 animaciones en ejecución.
- [ ] JS ≤ 4 KB gz, CSS ≤ 4 KB gz y 0 KB de recursos nuevos.

**Verificación final**

- [ ] El agente `section-verifier` se ejecutó sobre la sección y su informe (hallazgos, causas raíz, arreglos aplicados o pendientes) quedó registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas**

- **Scroll con tramo pegajoso, sin controles.** Igual que Escala: el scroll nativo no se secuestra, funciona con teclado y táctil, y la persona controla el ritmo contemplativo. Sin deslizante ni botones, porque el objetivo es observar, no manipular.
- **Cinco hitos: Sol, Tierra, vida, dinosaurios, humanos.** Decisión del autor; hitos de nuestro entorno, fáciles de reconocer, con la salida de la luz y la llegada como extremos. La Vía Láctea y otros acontecimientos se dejan fuera para mantener el contenido mínimo.
- **Marcador + etiqueta breve, sin tarjetas.** La idea pide reducir la cantidad de elementos visuales y dar unos segundos para contemplar; una tarjeta por hito añadiría texto y competiría con la línea.
- **Compresión suave de la escala de tiempo (autor), por anclas calibradas.** La escala lineal real deja cuatro de los cinco hitos pegados al final; se aceptó una distorsión visual controlada, sin números de eje, con el orden y las fechas de las etiquetas reales. Se descartó una fórmula única (potencia o logaritmo) porque no separa a la vez los hitos antiguos y los recientes.
- **Velocidad constante de la partícula; la compresión solo afecta a los marcadores.** Evita que la partícula acelere o frene de forma artificial y mantiene el scroll simple (`progreso × longitud`).
- **Línea siempre horizontal, también en móvil vertical.** Respeta la idea original («línea temporal horizontal»), conserva el mismo recorrido por scroll y la misma mecánica en todos los dispositivos; las etiquetas alternan arriba y abajo para caber.
- **Mensaje y pausa, sin «Volver a empezar».** El cierre es un hold de scroll con el mensaje visible; sin botón extra ni estado nuevo. Repetir el viaje se hace subiendo.
- **Entrada: fundido desde TON 618 con cielo de estrellas y nebulosa (autor).** Da continuidad con el último estado de Escala y recoge el rayo de luz que Escala dejó para esta sección; el fondo no es negro, como pidió el autor, para marcar un cambio emocional y contemplativo.
- **Mismo patrón de transición que Ciencia → Escala.** Escala se desvanece en su centro con el escenario pegado (opacidad, no un stage transparente encima, porque el fondo del `body` no es negro); se toca Escala de forma mínima y localizada.
- **Cero recursos nuevos.** TON 618, Tierra y nebulosa se reutilizan; estrellas y partícula van en código. Cero peso y coherencia visual con el resto.
- **Sin estado de React.** No hay interacción más allá del scroll; todo es CSS (timeline) con un fallback por hook.
- **Textos completos siempre en el DOM.** La accesibilidad no depende del scroll ni de `aria-live`; el visual es decorativo.
- **Agentes por paso.** `cosmic-data-researcher` para datos, `web-motion-designer` para diseño y animación, `section-verifier` al final.

**Descartadas**

- **Movimiento automático al entrar en vista o híbrido.** La persona no controlaría el ritmo, hay que pausar fuera de vista y se pierde el estilo de la web.
- **Escala lineal real o logarítmica exacta.** La lineal deja hitos amontonados; la logarítmica aplasta los antiguos y distorsiona demasiado. La cuenta atrás de años sin escala se descartó por no ser una línea temporal.
- **Siete u ocho hitos.** Contradice «reducir la cantidad de elementos visuales».
- **Tarjeta única por hito** (kicker, título, ≤ 40 palabras). Más texto y menos contemplativa.
- **Línea vertical o línea más larga que la pantalla con cámara lateral en móvil.** Rompe la coherencia con desktop o complica la mecánica y su verificación.
- **Botón «Volver a empezar».** Un control y un estado más sin que aporte a la experiencia contemplativa.
- **Corte limpio a negro desde Escala.** Pierde la continuidad con TON 618 y con el rayo de luz.
- **Fondo negro puro.** Descartado por el autor a favor de estrellas y nebulosa.

---

## Riesgos identificados

- **Hitos juntos (Sol, Tierra y vida).** Sol y Tierra distan ≈ 60 Ma y la vida unos 800 Ma; incluso con compresión suave, en móvil vertical las etiquetas pueden solaparse. Mitigar con carriles de etiquetas (arriba/abajo, cerca/lejos), textos cortos y calibración en el Paso 9.
- **Distorsión de la escala percibida como engaño.** La distancia visual entre hitos no es proporcional. Mitigar con la ausencia de ejes y números, el orden real y la fecha en cada etiqueta; el autor aceptó la compresión.
- **Cifra del tiempo de viaje.** Depende del modelo cosmológico y de la fuente del corrimiento al rojo (z ≈ 2,219); NASA dice «más de 10 mil millones de años». Mitigar usando la forma «más de 10 mil millones de años» en pantalla y documentando z, `H₀` y el cálculo.
- **Fechas de la vida y de los humanos.** El inicio de la vida (≈ 3 500–3 800 Ma) y *Homo sapiens* (≈ 300 000 años) tienen rangos aceptados; el investigador fija una cifra con fuente y la etiqueta evita falsa precisión («hace unos…»).
- **Legibilidad sobre la nebulosa.** El texto sobre un fondo con estrellas y nebulosa puede perder contraste. Mitigar con nebulosa tenue, máscara y medición de contraste sobre el fondo renderizado.
- **Acoplamiento con Escala.** El solape y el fundido dependen de `$scaleFade` y del margen negativo de Tiempo; cambiar uno obliga a revisar el otro (igual que Ciencia ↔ Escala).
- **Scroll en móvil.** El recorrido suma ≈ 630 svh con el hold; si la persona pasa de largo, no se contempla. El hint debe estar visible desde el inicio y el ritmo calibrado en el Paso 9.
- **Rendimiento con cielo y nebulosa.** Estrellas SVG, nebulosa a pantalla completa y capas del viaje a la vez; medir capas y composición en dispositivo real.
- **Licencia de la Tierra.** Heredada de SPEC 04 (NASA; confirmar nota de crédito antes de publicar).
- **Acoplamiento futuro con la navegación.** La sección es un track pegado al final de Escala, con solape; el `rootMargin` del `IntersectionObserver` del spec de navegación debe tenerlo en cuenta.

---

## Qué **no** está en este spec

- Controles de usuario (deslizante, botones de parada, «Volver a empezar», zoom o arrastre).
- Tarjetas por hito y más de cinco hitos; datos numéricos destacados.
- Audio y rótulos de «representación artística» o «no a escala».
- Cambios en Hero, Exploración o Ciencia; en Escala solo el fundido final de la transición.
- Navegación completa, Navbar y Footer.
- El experimento de gravedad (sección 06) y las secciones 7 y 8.

Cada una de estas cosas, si se hace, va en su propio spec.
