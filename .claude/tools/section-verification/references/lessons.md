# Lecciones: síntoma → causa → arreglo

Todo esto salió de verificar la sección Hero de ton-618. Cada entrada dice cómo se diagnosticó, porque
el diagnóstico es lo reutilizable.

## Contenido

1. [Lighthouse falla con NO_FCP / LCP vacío](#lighthouse-falla-con-no_fcp)
2. [Mover el mouse provoca Paint](#mover-el-mouse-provoca-paint)
3. [CLS distinto de 0](#cls-distinto-de-0)
4. [Frames lentos](#frames-lentos)
5. [Contraste sobre gradientes](#contraste-sobre-gradientes)
6. [Trampas de medición](#trampas-de-medición)

## Lighthouse falla con NO_FCP

- **Síntoma:** `NO_FCP` («la página no pintó contenido»), aunque las capturas muestran la página bien.
  La comprobación `fcp` falla: `performance.getEntriesByType('paint')` solo trae `first-paint`.
- **Causa:** Chromium no registra como contenido pintado (ni FCP ni LCP) un texto que se anima desde
  `opacity: 0`. La opacidad pasa a 1 en el compositor y el detector nunca vuelve a mirar ese texto.
- **Cómo se aisló:** con una página trivial que sí daba FCP (descarta el entorno), se insertó texto de prueba
  en cada contenedor del hero (los contenedores no eran el problema) y luego clones del texto real con y sin
  su animación (la animación era el problema). Variantes de opacidad inicial: `0` no cuenta; `0.01`, `0.3` y
  «solo `translate`» sí.
- **Arreglo:** que las animaciones de entrada partan de `opacity: 0.01`. El aspecto es idéntico.
- **Ojo:** quitar *una* animación a la vez puede no bastar; la prueba que sirvió fue el clon aislado.

## Mover el mouse provoca Paint

- **Síntoma:** `paint` da `Paint > 0` (264 en 120 movimientos) aunque `Layout = 0`. Sin mover el mouse, 0.
- **Causa:** las capas de parallax se desplazan con `translate` pero no están promovidas a capa de
  compositor, así que cada cambio las repinta.
- **Arreglo:** `will-change: translate` en esas capas (y `will-change: auto` fuera de vista y con
  reduced-motion, para no mantener capas inútiles). Tras calentar, 0 paints.
- **Notas de método:** calentar antes de medir (la primera pasada puede repintar por la promoción
  inicial); barrer el mouse solo por la zona sin controles (el hover de un botón repinta legítimamente);
  `UpdateLayoutTree` alto es normal si el hook escribe variables CSS y no es el problema.
- **Riesgo conocido:** `will-change` puede dejar borrosas las capas que además se escalan; mirar a 2×.

## CLS distinto de 0

- **Síntoma:** Lighthouse da CLS 0,01 y el culpable es el bloque de texto (`layout-shifts` en el JSON).
- **Causa:** el cambio de fuente. Mientras llega la fuente web se pinta una de respaldo con otras métricas;
  al cambiar, el bloque (anclado abajo) se mueve.
- **Arreglo:** una `@font-face` de respaldo con las métricas ajustadas y `<link rel="preload">` de la fuente.
  Medir en el navegador (canvas `measureText` a 100 px con ambas fuentes sobre frases reales):
  `size-adjust` = ancho total de la fuente web / ancho total de Arial; `ascent-override` =
  (ascent web / 100) / size-adjust; ídem `descent-override`; `line-gap-override: 0%`.
  Poner la fuente de respaldo justo después de la web en la pila.
- **Ojo:** se comprueba con varias ejecuciones; un 0 en una sola puede ser casualidad.

## Frames lentos

- **Síntoma:** la mediana de frame es ~33–66 ms.
- **Causa probable, no del código:** el navegador headless no tiene GPU y compone por software. La
  comparación con una página vacía en el mismo navegador (16,7 ms) separa entorno de página.
- **Cómo localizar el coste:** inyectar CSS que desactive grupos de animación y medir de nuevo. En el hero,
  sin ninguna animación iba a 60 fps y quitar cualquiera de cuatro grupos (pulso del halo, centelleo, campos
  de estrellas, gradientes) también: el margen era estrecho, no había un culpable único.
- **Qué hacer:** nunca dar el criterio por cumplido ni por fallido; pedir medirlo en un dispositivo real.

## Contraste sobre gradientes

- axe deja el contraste como «incomplete» sobre gradientes e imágenes. La comprobación `a11y` fotografía la
  página con el texto transparente y muestrea el fondo real detrás de cada texto.
- **Usar percentil 90 y mediana, no el máximo.** El píxel más claro suele ser una estrella suelta detrás de
  una letra; con el máximo salían tres «fallos» falsos que con p90 eran 5,5–13:1.
- Un `color-mix(in oklch, …)` entre ámbar y un color casi neutro interpola el matiz por el camino corto y sale
  **rosa**. Usar `in oklab` (o `in srgb`) cuando los matices estén lejos.
- No cubierto: contraste de estados hover/focus. Se calcula a mano con los colores de esos estados
  (leer el CSS) o con `CSS.forcePseudoState`.

## Trampas de medición

- **Barra de scroll:** `innerWidth` incluye la barra; con una de 15 px el mouse nunca llega al 100 % del
  borde derecho. Normalizar con `document.documentElement.clientWidth` y no probar en los últimos píxeles
  (caen sobre la barra).
- **Ancho mínimo de la ventana headless (500 px):** para viewports estrechos usar la emulación de
  dispositivo (`Emulation.setDeviceMetricsOverride`, lo que hace `page.load`), no `--window-size`.
- **`getAnimations()` cuenta las animaciones terminadas con `fill`:** para «0 animaciones con
  reduced-motion» no basta con quitar el movimiento; hay que quitar también las de entrada (`animation: none`).
- **Fuera de vista:** una página con una sola sección no permite sacarla del viewport; la comprobación
  añade un div alto al final del `body` para poder hacerlo.
- **Compensaciones de layout con reduced-motion:** si el track colapsa, desaparece la barra de scroll y los
  rectángulos cambian ~1 px; no es un desplazamiento del parallax.
- **Windows:** `npx` y el navegador dejan procesos huérfanos; el orquestador usa `taskkill /T`.
- **Lighthouse se conecta al mismo navegador** con `--port`; sin eso intenta lanzar el suyo y puede fallar
  con NO_FCP aunque la página esté bien (se descartó el entorno con una página trivial).
- **Controles negativos:** al terminar de tocar la herramienta, reintroducir a propósito un fallo conocido
  (`opacity: 0` en la animación de entrada; quitar `will-change`) y confirmar que se detecta. Restaurar los
  archivos desde una copia exacta, no con `git checkout`, si hay cambios sin commit.
