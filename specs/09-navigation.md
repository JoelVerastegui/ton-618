# SPEC 09 — Navegación entre secciones

**Estado:** Implemented
**Depende de:** SPEC 08 (y, por ella, SPEC 07, SPEC 06, SPEC 05, SPEC 04, SPEC 03, SPEC 02 y SPEC 01)
**Fecha:** 2026-11-25
**Objetivo:** Implementar la navegación de `docs/navigation.md`: una ruta por sección con carga bajo demanda y un menú lateral cuyos enlaces saltan al inicio de la sección elegida, cubiertos por una transición de salto hiperespacial.

Origen: `docs/navigation.md`. Esta spec fija lo que ese documento dejaba abierto; en caso de conflicto mandan las decisiones de esta spec y el documento se actualiza (Paso 11). Diseño, menú y transición los hace `web-motion-designer`; verificación `section-verifier`. No hay datos científicos que investigar.

---

## Alcance

### Incluido

- **Rutas por sección** bajo el prefijo `/ton-618/`, actualizadas con `history.replaceState` según la sección visible.
- **Acceso directo:** abrir una ruta coloca la página en el punto de llegada de su sección, sin animación ni transición. Una ruta desconocida se reemplaza por la de inicio.
- **Punto de llegada** por sección: la escena ya compuesta, al 100 %.
- **Carga bajo demanda** con `React.lazy` e `IntersectionObserver` para todas las secciones salvo el Hero. Una sección cargada queda montada.
- **Ícono de menú** fijo arriba a la derecha y **menú lateral** con fondo desenfocado, a pantalla completa por debajo de `md`, con el nombre de cada sección.
- **Salto instantáneo** desde los enlaces del menú.
- **Transición de salto hiperespacial** en CSS/SVG, ≈ 1,4 s, con orientación según el destino.
- **Ajustes de layout** en las secciones para que el ícono no se solape con el contenido en reposo.
- **Preparación para GitHub Pages:** `base` de Vite y `404.html` como respaldo.
- Componente `Icon` basado en los symbols de `public/icons.svg` (como pide `docs/architecture.md`).

### Excluido

- Publicación y automatización del despliegue (workflow de GitHub Actions, activar Pages, dominio propio). Se publica a mano.
- Cambios en las animaciones por scroll, en el scroll animado del botón del Hero y en los niveles de Exploración.
- Salto instantáneo o transición desde cualquier control que no sea un enlace del menú.
- Historial con `pushState` (Atrás y Adelante no recorren las secciones).
- Rutas para niveles, puntos, paradas o preguntas dentro de una sección.
- Desmontar secciones ya cargadas.
- Conservar la posición exacta dentro de una sección al recargar: se vuelve a su punto de llegada.
- Footer, numeración o descripciones en el menú, audio y librerías de navegación o animación.
- Título del documento y metadatos por ruta.

---

## Modelo de datos

Archivos: `src/interfaces/navigation.ts` y `src/data/navigation.json`.

```ts
// src/interfaces/navigation.ts
export type SectionId =
  | 'hero'
  | 'exploration'
  | 'science'
  | 'scale'
  | 'time'
  | 'experiment'
  | 'evidence'
  | 'epilogue';

export interface NavigationLink {
  id: SectionId; // id del <section>
  path: string; // relativo a la base: '' para el Hero, 'science', …
  label: string; // texto del menú
}

export interface NavigationData {
  menuLabel: string; // nombre accesible del menú
  openLabel: string; // nombre accesible del ícono
  closeLabel: string; // nombre accesible del botón de cierre
  links: NavigationLink[]; // 8, en el orden de la página
}
```

| `id`          | `path`        | `label`     |
| ------------- | ------------- | ----------- |
| `hero`        | `''`          | Inicio      |
| `exploration` | `exploration` | Exploración |
| `science`     | `science`     | Ciencia     |
| `scale`       | `scale`       | Escala      |
| `time`        | `time`        | Tiempo      |
| `experiment`  | `experiment`  | Experimento |
| `evidence`    | `evidence`    | Evidencia   |
| `epilogue`    | `epilogue`    | Epílogo     |

Archivos previstos (los nombres de componentes y hooks pueden ajustarse sin cambiar la responsabilidad):

| Archivo | Responsabilidad |
| --- | --- |
| `src/utils/routes.ts` | Convertir entre ruta (con `import.meta.env.BASE_URL`) y `SectionId` |
| `src/utils/sectionArrival.ts` | Localizar el punto de llegada y saltar a él |
| `src/utils/settleSection.ts` | Esperar a que el destino esté listo y completar sus animaciones de entrada |
| `src/hooks/useActiveSection.ts` | Sección activa y actualización de la URL |
| `src/hooks/useSectionNavigation.ts` | Secuencia de navegación (estado, dirección, carga, salto) |
| `src/hooks/useScrollLock.ts` | Bloqueo del scroll de fondo |
| `src/components/layout/LazySection/` | Marcador de posición y carga de cada sección |
| `src/components/layout/SectionMenu/` | Ícono, panel y enlaces |
| `src/components/layout/Hyperspace/` | Transición |
| `src/components/ui/Icon/` | Symbols de `public/icons.svg` |
| `src/styles/_sectionTracks.scss` | Alturas, solapes y puntos de llegada compartidos entre cada sección y su marcador de posición |

Convenciones:

- **Punto de llegada:** cada sección declara en su marcado un elemento `[data-arrival]`, no pegajoso, cuya posición fija su SCSS. El marcador de posición declara el mismo elemento en la misma posición.
- **Sección pendiente:** una sección que aún no puede mostrarse completa pone `data-arrival-pending` hasta estar lista.
- **Estado de React:** sección activa, menú abierto, fase y dirección de la transición y secciones cargadas. Nada se guarda entre sesiones.

---

## Comportamiento

### Punto de llegada

Las posiciones salen de los mismos tokens SCSS que animan cada sección y se calibran en el Paso 12.

| Sección | Punto de llegada | Qué se ve |
| --- | --- | --- |
| Hero | Inicio de la página | Escena inicial |
| Exploración | Borde superior de su track | Nivel 1 con su mapa y su tarjeta |
| Ciencia | Escena lista (`$scienceReady`) | Visor, título y marcadores, sin punto seleccionado |
| Escala | Fin de la intro (`$scaleIntro`) | Zoom en 0 con su tarjeta |
| Tiempo | Fin de la intro (`$timeIntro`) | Título, línea y partícula al inicio |
| Experimento | Borde superior de su track | Agujero negro dibujado y controles |
| Evidencia | Borde superior de su envoltorio `.tail` | Título, comparador y preguntas |
| Epílogo | Borde superior de la sección | Gran Atractor, marcador y texto completos |

- La posición se mide en el DOM con la sección ya cargada.
- Con `prefers-reduced-motion: reduce` o sin `animation-timeline`, el punto de llegada es el equivalente en el layout de ese modo.
- El estado interno de una sección ya usada (pregunta abierta, comparador, zoom del Experimento) se conserva. Lo que depende del scroll toma el valor del punto de llegada.

### Sección activa y URL

- Está activa la última sección, en orden de página, cuyo `[data-arrival]` ha quedado por encima del centro del viewport. Sin ninguna, el Hero.
- Se detecta con `IntersectionObserver`, sin listeners de scroll.
- La URL cambia con `replaceState` solo cuando cambia la sección activa.
- Durante una navegación por menú la detección se ignora y la URL se escribe una vez, con el destino.

### Acceso directo

1. Se lee la ruta y se desactiva la restauración de scroll del navegador (`history.scrollRestoration = 'manual'`).
2. Se cargan la sección destino y sus vecinas.
3. Se coloca la página en el punto de llegada y se completan las animaciones de entrada.

Se aceptan rutas con y sin barra final. La raíz sin barra (`/ton-618`) queda fuera (decidido tras el Paso 13).

Con `prefers-reduced-motion: reduce` y sin anclaje de scroll (`overflow-anchor`), el acceso directo carga además Exploración, cuya altura el marcador de posición solo estima (decidido tras el Paso 13).

Excepción: al abrir o recargar la ruta de inicio no se completan animaciones; el Hero conserva su entrada de carga (decidido en el Paso 5).

### Carga bajo demanda

- El Hero se carga con la página; las otras siete se importan con `React.lazy`.
- Cada una se carga cuando su marcador de posición está a menos de dos alturas de viewport, o cuando una navegación la pide.
- El marcador de posición tiene el `id` de la sección, su altura, su margen de solape y su `[data-arrival]`, de modo que el botón del Hero sigue encontrando su destino.
- Evidencia y Epílogo miden según su contenido: su marcador reserva al menos su altura mínima, y toda navegación carga el destino y sus vecinas antes de medir.
- Si la carga de un destino falla durante una navegación, se carga la página completa en su ruta. Si falla en la carga inicial, queda el marcador de posición, sin reintentos en bucle. Si falla pasado el tope de 8 s no hay recarga automática: recargar lo decide la persona (decidido tras el Paso 13).

### Menú

- El ícono es un botón fijo arriba a la derecha, de al menos 44×44 px, respetando las áreas seguras, con contraste suficiente sobre cualquier sección y por encima de todas ellas.
- El panel es un `<dialog>` modal que entra por la derecha, con botón de cierre y los 8 enlaces. La sección activa lleva `aria-current`.
- Desde `md` es un panel lateral (más ancho con 420 px de alto o menos, donde los enlaces van en dos columnas) y el resto de la pantalla se ve desenfocado. Por debajo de `md` ocupa toda la pantalla, con fondo translúcido y desenfoque.
- Se cierra con un enlace, el botón de cierre, `Escape` o clic fuera. El foco vuelve al ícono.
- `Tab` desde el ícono lleva al primer control de la sección activa, no al principio de la página (decidido en el Paso 8).
- Con barra de scroll clásica, mientras el menú está abierto la barra se oculta y su ancho se compensa (margen en la página y en el ícono), medido al abrir: el panel llega al borde y nada se mueve. No se usa `scrollbar-gutter` (decidido en el Paso 8).
- Los enlaces son `<a>` con su ruta real: el clic con modificadores o con el botón central conserva el comportamiento del navegador.
- El desenfoque usa `backdrop-filter` solo en el menú y sin animar su radio (excepción a la regla de las specs anteriores). Sin soporte, el fondo se oscurece.
- La entrada y salida animan solo `transform` y `opacity`; con movimiento reducido no hay animación.

### Navegación y transición

Dirección: se compara el punto de llegada del destino con el scroll actual (tolerancia de 2 px). Destino por debajo: la transición va de abajo hacia arriba. Por encima: de arriba hacia abajo. Igual: solo se cierra el menú.

| Fase | Duración orientativa | Qué ocurre |
| --- | --- | --- |
| Entrada | 500 ms | Se cierra el menú, se cancela cualquier scroll animado en curso y la transición cubre la pantalla |
| Cubierta | ≥ 300 ms (≥ 600 ms hacia Inicio o Exploración) | Carga del destino y vecinas, salto instantáneo, URL, destino listo y animaciones de entrada completadas |
| Salida | 600 ms | La transición sale en la misma orientación |

- **Aspecto:** fondo negro `#000` liso, sin degradados y de bordes rectos (decidido tras el Paso 11), con estelas de estrellas estiradas en la dirección del viaje, en CSS/SVG, animando solo `transform` y `opacity`. Es un único componente; la orientación contraria es su espejo.
- **Espera:** la pantalla sigue cubierta hasta que el destino esté cargado, sin `data-arrival-pending` y con sus imágenes visibles decodificadas. Tope de 8 s; pasado el tope se descubre igualmente.
- **Fondos:** la nebulosa (fondo CSS de Inicio, Escala y Tiempo) se precarga desde `index.html`; la espera no incluye los fondos CSS (decidido tras el Paso 13).
- **Animaciones de entrada:** se completan (`finish()`) las animaciones y transiciones finitas del destino basadas en tiempo. No se tocan las guiadas por scroll ni las infinitas.
- Mientras dura, no se admite otra navegación ni scroll de la persona (rueda, táctil o teclado).
- La transición es decorativa (`aria-hidden`) y no existe en pantalla fuera de una navegación.
- Con `prefers-reduced-motion: reduce` no hay transición: se carga el destino y se salta.

### GitHub Pages

- `base: '/ton-618/'` en `vite.config.ts`, también en desarrollo.
- El build genera `dist/404.html` idéntico a `dist/index.html`, con un paso en `vite.config.ts`, sin dependencias nuevas.
- Toda ruta a un archivo de `public/` usa la base.

---

## Plan de implementación

Cada paso deja el proyecto compilando y funcional. Agentes: `web-motion-designer` (pasos 8, 9, 10 y 12), `section-verifier` (pasos 9 y 13); el resto, el agente principal.

1. **Base y respaldo.** `base`, generación de `404.html` y revisión de rutas a `public/`. Verificar `npm run dev` y `npm run preview` en `/ton-618/`.
2. **Datos y rutas.** `navigation.ts`, `navigation.json` y `routes.ts`.
3. **Puntos de llegada.** `[data-arrival]` en las 8 secciones y `sectionArrival.ts`; comprobar cada posición desde consola.
4. **Sección activa y URL.** `useActiveSection.ts`.
5. **Acceso directo.** Posicionamiento inicial, ruta desconocida y `settleSection.ts`; `data-arrival-pending` en Experimento y donde haga falta.
6. **Carga bajo demanda.** `_sectionTracks.scss`, `LazySection` y `React.lazy` en `App.tsx`; comparar posiciones y capturas con el estado anterior.
7. **Navegación.** `useSectionNavigation.ts`: carga, salto, URL y manejo de errores, sin interfaz todavía.
8. **Menú.** `Icon`, symbols de menú y cierre, `SectionMenu`, `useScrollLock.ts`; los enlaces saltan sin transición.
9. **Solapes del ícono.** `section-verifier` mide los choques en las 8 secciones; `web-motion-designer` mueve el contenido afectado reservando el hueco con un token en `_variables.scss`.
10. **Transición.** `Hyperspace` en sus dos orientaciones, integrada en la secuencia, con reduced-motion.
11. **Documentación y limpieza.** Actualizar `docs/navigation.md`, `docs/architecture.md` y `README.md` (la base; el despliegue no se documenta, lo hace el autor: decidido tras el Paso 11); quitar los symbols sin uso de `icons.svg`; Prettier y lint; JSON e interfaces sin campos sin uso.
12. **Calibración visual.** Capturas en los 8 viewports de referencia (320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900, 1920×1080) y en 768×1024: menú, ícono, transición y llegadas; registrar valores finales aquí.
13. **Verificación con `section-verifier`.** Criterios de aceptación, rendimiento, accesibilidad y robustez; registrar resultados y pendientes en este documento.

---

## Calibración visual (Paso 12)

Capturas en Edge headless sin GPU sobre `preview`, en los 8 viewports de referencia y en 768×1024: las 8 llegadas desde el menú, el menú abierto y la transición (entrada, cubierta y salida, en ambas orientaciones). Sin errores de consola.

### Puntos de llegada

Sin cambios. En los 9 viewports, hacia abajo y hacia arriba, el scroll coincide con su `[data-arrival]` (0 px de diferencia) y no queda ninguna sección pendiente.

| Sección | Distancia desde el borde superior de su track o sección |
| --- | --- |
| Hero, Exploración, Experimento, Evidencia (`.tail`) y Epílogo | 0 |
| Ciencia | `$scienceReady` (110) × `--explUnit` (0,6 svh en móvil vertical; 1 svh lado a lado) |
| Escala | `$scaleIntro`, 120 svh |
| Tiempo | `$timeIntro`, 100 svh |

- La tarjeta de Exploración llega al 98 % de opacidad (0,36 px por debajo de su sitio): su entrada por scroll termina 0,66 unidades más abajo.
- En 320×568, Evidencia mide más que la pantalla: la cuarta pregunta queda cortada en la llegada y se alcanza con el scroll.

### Ícono y menú

- **Ícono:** 44×44 px a 12 px de los bordes (o el área segura); hueco reservado `$menuClearRight` (64 px sin área segura). En la llegada no se solapa con nada en ninguno de los 9 viewports.
- **Panel:** pantalla completa por debajo de 768 px y 352 px (`$menuWidth`) desde ahí. Enlaces de 48 px de alto (texto de 20 a 26 px), dos columnas en apaisado de hasta 420 px de alto y sin scroll interno en ningún viewport. El cierre ocupa el sitio del ícono.
- **Movimiento:** entrada de 320 ms (`$easeOutExpo`), salida de 200 ms (`$easeCinematic`) y desenfoque fijo de 10 px.
- El anillo de foco del ícono tras navegar solo se ve con teclado (comprobado con ratón, táctil y teclado).

### Transición

- Entrada de 500 ms y salida de 600 ms con `cubic-bezier(0.65, 0, 0.35, 1)`; pausa cubierta mínima de 600 ms hacia Inicio y Exploración y de 300 ms hacia el resto.
- Fondo `#000` de bordes rectos. Estelas: 22 lejanas (1 px, alfa 0,45, ciclo de 36 vh en 600 ms) y 14 cercanas (2 px, alfa 0,9, ciclo de 64 vh en 450 ms).
- Cubre todo el ancho útil y el alto en los 9 viewports y en ambas orientaciones.
- Al cerrarse, el menú sigue hasta 200 ms por encima: se desvanece mientras la transición apenas asoma por el borde de entrada (opacidad 0,1 a los 195 ms). No se aprecia como defecto y no se cambia.

### Ajustes

| Archivo | Antes | Después |
| --- | --- | --- |
| `Evidence.module.scss`, hueco derecho para el ícono en apaisado | Hasta 420 px de alto | Hasta 520 px de alto (la columna de 15 rem sigue limitada a 420 px) |

Con más de 420 px de alto, abrir una pregunta metía una cabecera bajo el ícono (a 740×421, 900×450 y 932×430) o la dejaba a menos de 8 px (a 900×500 y 1280×500). Con el ajuste no hay solapes con ninguna pregunta abierta en 568×320, 640×360, 740×421, 844×390, 900×450, 900×500, 932×430, 960×520 y 1280×500; en 960×540, 1000×600, 1024×600, 1280×620 y 1366×650 ya no los había.

### Pendientes

- **Tarjeta de Exploración al 98 %** (aceptado por el autor tras el Paso 12): no se percibe y su punto de llegada sigue en el borde superior del track.
- **Barra de scroll clásica** (aceptado por el autor tras el Paso 12): sigue visible a la derecha durante la transición, como parte del navegador, y su tirador cambia de sitio con la pantalla cubierta.
- **Etiquetas del nivel 1 de Exploración** (anterior a esta spec, sin corregir): «Estás aquí» y la leyenda de los anillos se pisan en 320×568 y 568×320 (56×15 px), 360×640 y 640×360 (46×8 px) y 390×844 (38×3 px). En apaisado bajo, la tarjeta tapa además parte de «TON 618».
- **Experimento a 568×320 y 640×360:** la tarjeta arranca cerrada; abierta queda a 8 px del ícono y, a 568×320, a 2 px del joystick. Sin solapes y sin cambios.
- **Duración (Paso 13):** sin GPU, con las secciones cargadas, la secuencia cumple el margen hasta 640 px de ancho y lo supera en algunos destinos desde 768 px (hasta 2,8 s en 1920×1080). Medir con GPU.

---

## Verificación (Paso 13)

Sobre `8f19b3f`, sin cambios en el código. Línea base «antes»: `57ae406`.

**Entorno:** Windows 10, 7,4 GB de RAM, Edge 158 headless, `vite preview` (rutas también en `dev`). Sin GPU salvo rendimiento, que usa la GPU integrada (AMD Radeon, D3D11). Móvil y CPU 4× son emulados. Resultado: 28 de 32 criterios cumplidos; los 4 sin marcar fallan en un caso concreto.

### Criterios

| Criterio | Resultado y valor medido |
| --- | --- |
| URL durante el scroll | Cumple. 8 rutas en orden en ambos sentidos y 0 discrepancias en 5 configuraciones (320 a 1920 px, una con movimiento reducido) |
| Historial | Cumple. `history.length` no cambia con el scroll ni tras 4 navegaciones por configuración |
| Acceso directo con y sin barra | **No cumple** solo en la raíz: 60 de 60 cargas correctas (0 px, sin transición, `dev` y `preview`), pero `/ton-618` sin barra responde 404 con el aviso de Vite en ambos |
| Recarga | Cumple. 24 de 24 (3 viewports) |
| Ruta desconocida | Cumple. 7 de 7 pasan a `/ton-618/`, conservando parámetros; también con un servidor que imita Pages |
| `404.html` | Cumple. Idéntico a `index.html` |
| Chunks iniciales | Cumple. En los 9 viewports solo Exploración y sus dos dependencias |
| Una descarga y sin desmontar | Cumple. 23 recursos JS/CSS, 0 repetidos; las 8 secciones siguen montadas tras 4 recorridos y 12 navegaciones |
| Sin saltos de contenido | **No cumple** sin anclaje de scroll y con movimiento reducido: entrando en `/epilogue` y subiendo salta 141,5 px (390×844) y 877 px (1440×900). Con anclaje, máximo 0,5 px; modo normal y sin `animation-timeline`, 0 px. El anclaje se anuló por CSS: no se probó en Safari |
| Botón del Hero | Cumple. Con el chunk retenido 3 s llega a 0 px de su destino con scroll animado |
| Ícono, 8 nombres y sección activa | **No cumple** de 768 px de ancho en adelante con 420 px de alto o menos: la segunda columna queda cortada (44 a 51 px) y aparece scroll horizontal (768×390 a 932×420 y 1280×400). En los 9 viewports de referencia, 72 de 72 correctos |
| Panel lateral o pantalla completa | Cumple. 352 px desde 768 px y ancho completo por debajo; `blur(10px)` |
| Cierres y foco | Cumple. Enlace, botón, `Escape` y clic fuera; el foco vuelve al ícono |
| Fondo bloqueado | Cumple. 0 px de scroll y de desplazamiento con rueda, táctil y teclado, con barra clásica y sin ella; 24 `Tab` sin llegar a la página |
| Solapes del ícono | Cumple. 0 en llegadas, estados abiertos y reposo en 18 combinaciones (9 viewports, normal y reducido) y en 844×390. Control negativo (ícono sobre el título): 20 solapes en llegada o estado. El contenido en movimiento cruza por debajo, más veces con movimiento reducido |
| Llegadas | Cumple. 28 primeras visitas y 112 pares encadenados (390×844 y 1440×900), y, sin `animation-timeline`, 24 accesos directos y 42 idas y vueltas, todas a 1 px o menos |
| Pantalla al descubrirse | **No cumple** si un fondo CSS aún no ha llegado: con la nebulosa retenida 6 s, Tiempo se descubre sin ella y aparece después. En condiciones normales y en Slow 4G no hay animaciones finitas a medias, imágenes visibles sin cargar ni fuentes pendientes |
| Orientación | Cumple. `up` y `down` según el destino; mismas animaciones, 500 y 600 ms, `cubic-bezier(0.65, 0, 0.35, 1)` |
| Sección actual | Cumple. A 2 px o menos solo cierra el menú; desde 3 px más abajo, orientación `up` |
| Duración | Cumple con GPU y CPU 1×: 160 navegaciones en 390, 768, 1440 y 1920 px dentro del margen (medianas 1451–1557 ms; Inicio y Exploración 1759–1783 ms). Con CPU 4× solo se pasan Experimento (390×844, 4 de 5, hasta 1622 ms) y Ciencia (1 de 5, 1617 ms). Sin GPU llega a 2584 ms en 1920×1080 |
| Cubierta y URL | Cumple. Todos los saltos con la pantalla cubierta y una sola escritura de la URL |
| Entradas bloqueadas | Cumple. Rueda, táctil, teclado, clic y arrastre sobre controles: un único salto, sin otra navegación |
| Red limitada | Cumple. Slow 4G: cubierta de 1,0 a 5,4 s; con el chunk retenido 20 s descubre a los 8,06 s de estar cubierta |
| Movimiento reducido | Cumple. 24 de 24 sin transición ni animación del menú, 42–378 ms |
| Regresión | Cumple. 5 configuraciones: 3155 valores de animaciones por scroll sin diferencias, mismos niveles, alto de página y botón del Hero. Las diferencias de píxeles son los ajustes por el ícono, las estrellas aleatorias de cada compilación, el canvas y un artefacto del script (ocultaba el `<header>` del título de Ciencia en la base) |
| Textos del menú | Cumple. Todos en `navigation.json` |
| axe y Lighthouse | Cumple. axe: 0 violaciones en 48 análisis (3 viewports, 8 secciones, menú cerrado y abierto). Lighthouse accesibilidad 100. Contraste mínimo: enlaces 7,5:1, ícono 15,6:1 |
| `transform` y `opacity`, 50 fps | Cumple. Solo `transform`. CPU 4× en 390×844 y 360×640: salida 58–62 fps; en 112 tramos con la sección cargada, 1 bajo 50 (48 fps, entrada hacia Inicio). La primera visita a Ciencia en un navegador recién abierto bajó a 44–47 fps (2 de 2), con huecos de hasta 140 ms; las siguientes, 60 |
| Estilos y archivos | Cumple. Sin `.scss` sueltos, `!important` ni `style={{}}`; los 23 `style={…}` son valores calculados y anteriores a esta spec; lógica `.ts` solo en `utils/` y `hooks/` |
| Build y lint | Cumple. Sin errores; el aviso `PLUGIN_TIMINGS` también sale en la línea base |
| Presupuesto | Cumple. Ver tabla siguiente |

### Presupuesto

| Concepto | Medido |
| --- | --- |
| Recursos y dependencias nuevos | 0 |
| JS propio de la navegación | 4090 B gz |
| CSS del menú y la transición | 2026 B gz |
| JS inicial (con los chunks perezosos de la carga) | 94 708 → 81 723 B gz; CSS 41 528 → 33 221 B gz |
| Renders de React durante el scroll | Con todo cargado, solo 14 renders del menú (cambios de sección); los de las secciones son los mismos que antes |
| Lighthouse móvil, mediana de 5 | Performance 90 → 90, CLS 0, LCP 3621 → 3546 ms, TBT 26 → 0 ms, peso 722 → 649 KB |
| CLS en acceso directo | 0 en las 8 rutas (390×844 y 1440×900) |

### Cambios tras la verificación

Decididos por el autor. **Sin verificar:** los comprueba el autor. Los valores de las tablas anteriores son de antes de estos cambios.

| Fallo (numeración de abajo) | Decisión |
| --- | --- |
| 1. Menú cortado | Corregido: desde 768 px de ancho y con 420 px de alto o menos el panel mide 26 rem (`$menuWidthShort`) |
| 2. Salto sin anclaje de scroll | Corregido solo para esos navegadores: con movimiento reducido, el acceso directo carga también Exploración |
| 3. Fallo pasado el tope de 8 s | Aceptado: sin recarga automática |
| 6. Raíz sin barra | Excluida del criterio |
| 7. Falla una vecina | Sin cambios: el autor no lo ha observado |
| 8. Fondos CSS | Precarga de la nebulosa en `index.html`; si aun así tarda más que la pantalla cubierta, aparecerá después |

### Fallos y pendientes

Detectados en la verificación, por orden de gravedad.

1. **Menú cortado en móvil apaisado** (≥ 768 px de ancho, ≤ 420 px de alto, p. ej. 844×390). Las dos columnas de `.list` necesitan 395–402 px y el panel mide 352 px. Opciones: ensanchar el panel en ese caso (unas 26 rem) o limitar las dos columnas a menos de `md`, con scroll vertical.
2. **Salto de contenido sin anclaje de scroll y con movimiento reducido.** El marcador de Exploración mide 3000 px fijos y la sección, más. Opciones: cargar Exploración en todo acceso directo con movimiento reducido, o compensar el scroll al montar una sección por encima cuando no haya anclaje.
3. **Chunk que tarda más de 8 s y falla:** no se recarga la página; queda la sección en blanco y elegirla en su llegada no hace nada (se recupera al navegar a ella desde otra posición). Propuesta: seguir observando el fallo tras el tope y recargar si la persona sigue en el destino.
4. **Sin conexión,** navegar a una sección sin cargar sustituye la web por la página de error del navegador (es la recarga completa prevista). Decidir si sin conexión conviene quedarse en el marcador de posición.
5. **Movimiento reducido y red lenta:** hasta 8 s sin respuesta visual y con la entrada bloqueada. Decidir si se muestra un indicador estático.
6. **`/ton-618` sin barra** en `dev` y `preview`: redirigir desde un plugin en `vite.config.ts` o acotar el criterio. En GitHub Pages no se ha comprobado.
7. **Falla una vecina en el acceso directo** (`useDirectAccess`, `Promise.all`): no se completa el destino ni se vuelve a colocar la página (entrada visible; −142 px con movimiento reducido y sin anclaje). Propuesta: como en `arrive`, `allSettled` para las vecinas y exigir solo el destino.
8. **Fondos CSS** (`settleSection`): no se esperan. Incluirlos en la espera o precargar la nebulosa; en uso normal ya está pedida desde la carga inicial.
9. **Tarjeta de Exploración a 568×320:** al estrecharse por el ícono crece en alto y en el nivel 3 pisa más «Canes Venatici» y «Observas desde la Tierra».
10. **Menores:** girar durante la salida deja la página en otra sección (igual que al girar sin navegar; en entrada y cubierta, 0 px); `Tab` desde el ícono en Tiempo, llegando por scroll, sale de la página porque Experimento aún no ha cargado; con texto al 200 % a 320 px, cuatro nombres necesitan scroll horizontal; en Ciencia compacta el orden de `Tab` (tarjeta y luego navegación) no es el visual.
11. **Anterior a esta spec, sin corregir:** solape de las etiquetas del nivel 1 de Exploración.

### No verificado

- **Dispositivo real:** los tirones que el autor vio en su móvil al descubrirse Inicio y Exploración no se reproducen aquí (con GPU y CPU 4×, tarea más larga 64 ms y salida a 58–60 fps; con 6×, 112 ms). Tampoco el coste en un móvil modesto, las áreas seguras, las barras dinámicas, el gesto táctil con inercia ni un lector de pantalla.
- **Safari y Firefox:** anclaje de scroll, `<dialog>` con `@starting-style` y `allow-discrete`, `backdrop-filter` y su alternativa, `animation-timeline` (solo simulado en Edge).
- **GitHub Pages real** y la redirección de la raíz sin barra.
- El desenfoque del menú no cambia los fps medidos con GPU y CPU 4× (frente al mismo menú sin él); Experimento a 1440×900 baja a 9 fps con o sin menú, por su canvas.

---

## Presupuesto

| Concepto | Límite |
| --- | --- |
| Recursos nuevos (imágenes, video, fuentes) | 0 KB |
| Dependencias nuevas | 0 |
| JS propio de la navegación (menú y transición incluidos) | ≤ 5 KB gz |
| CSS del menú y la transición | ≤ 3 KB gz |
| JS inicial de la página | Menor que antes de esta spec |
| Renders de React durante el scroll | Solo al cambiar la sección activa o cargar una sección |
| Lighthouse móvil | CLS 0; Performance no peor que antes de esta spec |

---

## Criterios de aceptación

**Rutas y acceso directo**

- [x] Al hacer scroll de principio a fin y de vuelta, la URL toma las 8 rutas en orden y coincide con la sección visible.
- [x] La longitud del historial no aumenta al hacer scroll ni al usar el menú.
- [x] Abrir cada una de las 8 rutas, con y sin barra final (salvo la raíz `/ton-618` sin barra), muestra su punto de llegada sin animación de scroll ni transición, en `dev` y en `preview`.
- [x] Recargar en cualquier ruta vuelve al punto de llegada de esa sección.
- [x] Una ruta desconocida muestra el Hero y la URL pasa a `/ton-618/`.
- [x] `dist/404.html` existe tras el build y es idéntico a `dist/index.html`.

**Carga bajo demanda**

- [x] Al abrir `/ton-618/` solo se descargan los chunks del Hero y de las secciones a menos de dos viewports.
- [x] Cada sección se descarga una sola vez y no se desmonta.
- [x] Al recorrer la página en ambos sentidos, también tras entrar directo en `/ton-618/epilogue`, no hay saltos de contenido (desplazamiento ≤ 1 px). _Sin marcar: corregido tras el Paso 13; lo comprueba el autor._
- [x] El botón del Hero lleva a Exploración con su scroll animado aunque la sección aún no haya cargado.

**Menú e ícono**

- [x] El ícono se ve en las 8 secciones y abre el menú, que muestra los 8 nombres y marca la sección activa. _Sin marcar: corregido tras el Paso 13; lo comprueba el autor._
- [x] Desde 768 px es un panel lateral con el fondo desenfocado; por debajo ocupa toda la pantalla.
- [x] Se cierra con enlace, botón de cierre, `Escape` y clic fuera (donde hay fuera); el foco vuelve al ícono.
- [x] Con el menú abierto el fondo no hace scroll, no se desplaza el layout y el foco no sale del menú a la página.
- [x] El ícono no se solapa con texto, controles, tarjetas ni marcadores en reposo (stage pegado, elementos fijos, punto de llegada y estados interactivos abiertos: nivel, punto, parada, tarjeta, pregunta), en las 8 secciones y en los 9 viewports del Paso 12. Se admite que el contenido en movimiento cruce por debajo al hacer scroll (decidido en el Paso 9).

**Navegación y transición**

- [x] Cada enlace llega al punto de llegada de su sección, desde arriba y desde abajo, también en la primera visita.
- [x] Al descubrirse la pantalla no hay restos de otra sección, fundidos a medias ni elementos apareciendo. _Sin marcar: corregido tras el Paso 13; lo comprueba el autor._
- [x] Destino abajo: la transición va hacia arriba; destino arriba: hacia abajo; misma forma, duración y curva.
- [x] Elegir la sección actual en su punto de llegada solo cierra el menú; elegirla desde más abajo usa la orientación «arriba».
- [x] Con las secciones ya cargadas, la secuencia dura 1,4 s ± 0,2 s (1,7 s ± 0,2 s hacia Inicio o Exploración, decidido tras el Paso 11 por tirones en móvil al descubrirse).
- [x] Mientras la pantalla está cubierta no se ven secciones intermedias y la URL solo cambia una vez.
- [x] Durante la transición, los clics, la rueda, el táctil y el teclado no mueven la página ni inician otra navegación.
- [x] Con la red limitada, la pantalla sigue cubierta hasta que el destino está listo (tope 8 s).
- [x] Con `prefers-reduced-motion: reduce` el salto es directo, sin transición ni animación del menú.

**Regresión**

- [x] Las animaciones por scroll de las secciones, el botón del Hero y los niveles de Exploración se comportan igual que antes (capturas antes y después en las mismas posiciones), salvo los ajustes por el ícono.

**Calidad**

- [x] Todos los textos del menú salen de `navigation.json`.
- [x] axe/Lighthouse: 0 violaciones, también con el menú abierto.
- [x] La transición anima solo `transform` y `opacity` y se mantiene a ≥ 50 fps con CPU 4× más lenta en emulación móvil.
- [x] No hay `.scss` sueltos fuera de `src/styles/`, ni `!important`, ni `style={{}}` salvo valores dinámicos; `.ts` de lógica solo en `utils/` y `hooks/`; `prettier --check` limpio.
- [x] `npm run build` y `npm run lint` terminan sin errores ni avisos nuevos.
- [x] Se cumple el presupuesto.
- [x] El informe de `section-verifier` queda registrado en este documento.

---

## Decisiones tomadas y descartadas

**Tomadas por el autor**

- **Una sola spec** para todo el documento, en lugar de separar rutas y menú.
- **Llegada con la escena ya compuesta.** Las intros por scroll se ven al volver hacia arriba.
- **Animaciones de entrada ya completas** al descubrirse la pantalla.
- **Secciones montadas tras cargar.** Conserva el estado y evita cambios de altura.
- **Salto hiperespacial en CSS/SVG, ≈ 1,4 s.**
- **Ícono arriba a la derecha;** si choca, se mueve el contenido de la sección.
- **Menú solo con nombres.**
- **GitHub Pages, solo preparación.**

**Tomadas al redactar (revisar)**

- Nombres del menú: Inicio, Exploración, Ciencia, Escala, Tiempo, Experimento, Evidencia y Epílogo.
- `<dialog>` modal: da `Escape`, foco contenido y fondo inerte sin librerías.
- Sección activa por el punto de llegada y el centro del viewport: las secciones se solapan y observar sus cajas sería ambiguo.
- `[data-arrival]` por sección: la posición vive junto a los tokens que la definen, sin constantes duplicadas en TypeScript.
- Carga a dos viewports de distancia, fases de 500 / 300 / 600 ms (pausa de 600 ms hacia Inicio y Exploración) y tope de espera de 8 s.
- Recarga completa si falla la carga de un destino.
- `base` también en desarrollo, para que las rutas se prueben igual que en producción.

**Descartadas**

- `pushState` y librerías de enrutado.
- Scroll suave desde el menú: contradice el salto instantáneo.
- Telón de estrellas existente, panel de color, canvas y video para la transición.
- Reproducir las intros tras la transición.
- Desmontar secciones lejanas.
- Workflow de despliegue.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El marcador de posición no mide como la sección (solapes negativos, reduced-motion, sin `animation-timeline`) | Tokens y mixins compartidos; comparar alturas en cada modo y viewport |
| Safari no ancla el scroll y una carga por encima mueve el contenido | Alturas exactas y carga anticipada de vecinas; probar en dispositivo real |
| Llegar de golpe deja observadores, videos o el canvas del Experimento sin actualizar | Fase cubierta con espera de `data-arrival-pending`; probar cada origen y destino |
| `finish()` altera una animación que debía continuar | Solo animaciones finitas basadas en tiempo y dentro del destino |
| Bloquear el scroll cambia el ancho por la barra de desplazamiento | Compensar su ancho mientras está oculta y comprobar que nada se mueve |
| `backdrop-filter` sobre escenas animadas cuesta en móviles modestos | Radio fijo, sin animarlo; medir y reducirlo si hace falta |
| GitHub Pages responde con estado 404 en rutas profundas, aunque la web cargue | Limitación aceptada del alojamiento |
| La nueva `base` rompe rutas o las herramientas de `section-verifier` | Paso 1 aislado; pasar a las herramientas la URL con `/ton-618/` |
| Mover contenido por el ícono rompe un layout ya calibrado | Cambios mínimos y capturas en los 9 viewports |

---

## Qué **no** está en este spec

- Publicación automática, dominio propio o configuración de Pages.
- Cambios en animaciones por scroll, botón del Hero o niveles de Exploración.
- Historial navegable, subrutas internas o metadatos por ruta.
- Footer, audio y librerías nuevas.

Cada una de estas cosas, si se hace, va en su propio spec.
