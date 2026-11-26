# SPEC 09 — Navegación entre secciones

**Estado:** Approved
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

Se aceptan rutas con y sin barra final.

Excepción: al abrir o recargar la ruta de inicio no se completan animaciones; el Hero conserva su entrada de carga (decidido en el Paso 5).

### Carga bajo demanda

- El Hero se carga con la página; las otras siete se importan con `React.lazy`.
- Cada una se carga cuando su marcador de posición está a menos de dos alturas de viewport, o cuando una navegación la pide.
- El marcador de posición tiene el `id` de la sección, su altura, su margen de solape y su `[data-arrival]`, de modo que el botón del Hero sigue encontrando su destino.
- Evidencia y Epílogo miden según su contenido: su marcador reserva al menos su altura mínima, y toda navegación carga el destino y sus vecinas antes de medir.
- Si la carga de un destino falla durante una navegación, se carga la página completa en su ruta. Si falla en la carga inicial, queda el marcador de posición, sin reintentos en bucle.

### Menú

- El ícono es un botón fijo arriba a la derecha, de al menos 44×44 px, respetando las áreas seguras, con contraste suficiente sobre cualquier sección y por encima de todas ellas.
- El panel es un `<dialog>` modal que entra por la derecha, con botón de cierre y los 8 enlaces. La sección activa lleva `aria-current`.
- Desde `md` es un panel lateral y el resto de la pantalla se ve desenfocado. Por debajo de `md` ocupa toda la pantalla, con fondo translúcido y desenfoque.
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
| Cubierta | ≥ 300 ms | Carga del destino y vecinas, salto instantáneo, URL, destino listo y animaciones de entrada completadas |
| Salida | 600 ms | La transición sale en la misma orientación |

- **Aspecto:** fondo oscuro opaco con estelas de estrellas estiradas en la dirección del viaje, en CSS/SVG, animando solo `transform` y `opacity`. Es un único componente; la orientación contraria es su espejo.
- **Espera:** la pantalla sigue cubierta hasta que el destino esté cargado, sin `data-arrival-pending` y con sus imágenes visibles decodificadas. Tope de 8 s; pasado el tope se descubre igualmente.
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
11. **Documentación y limpieza.** Actualizar `docs/navigation.md`, `docs/architecture.md` y `README.md` (base y publicación manual); quitar los symbols sin uso de `icons.svg`; Prettier y lint; JSON e interfaces sin campos sin uso.
12. **Calibración visual.** Capturas en los 8 viewports de referencia (320×568, 360×640, 390×844, 640×360, 568×320, 1024×600, 1440×900, 1920×1080) y en 768×1024: menú, ícono, transición y llegadas; registrar valores finales aquí.
13. **Verificación con `section-verifier`.** Criterios de aceptación, rendimiento, accesibilidad y robustez; registrar resultados y pendientes en este documento.

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

- [ ] Al hacer scroll de principio a fin y de vuelta, la URL toma las 8 rutas en orden y coincide con la sección visible.
- [ ] La longitud del historial no aumenta al hacer scroll ni al usar el menú.
- [ ] Abrir cada una de las 8 rutas, con y sin barra final, muestra su punto de llegada sin animación de scroll ni transición, en `dev` y en `preview`.
- [ ] Recargar en cualquier ruta vuelve al punto de llegada de esa sección.
- [ ] Una ruta desconocida muestra el Hero y la URL pasa a `/ton-618/`.
- [ ] `dist/404.html` existe tras el build y es idéntico a `dist/index.html`.

**Carga bajo demanda**

- [ ] Al abrir `/ton-618/` solo se descargan los chunks del Hero y de las secciones a menos de dos viewports.
- [ ] Cada sección se descarga una sola vez y no se desmonta.
- [ ] Al recorrer la página en ambos sentidos, también tras entrar directo en `/ton-618/epilogue`, no hay saltos de contenido (desplazamiento ≤ 1 px).
- [ ] El botón del Hero lleva a Exploración con su scroll animado aunque la sección aún no haya cargado.

**Menú e ícono**

- [ ] El ícono se ve en las 8 secciones y abre el menú, que muestra los 8 nombres y marca la sección activa.
- [ ] Desde 768 px es un panel lateral con el fondo desenfocado; por debajo ocupa toda la pantalla.
- [ ] Se cierra con enlace, botón de cierre, `Escape` y clic fuera (donde hay fuera); el foco vuelve al ícono.
- [ ] Con el menú abierto el fondo no hace scroll, no se desplaza el layout y el foco no sale del menú a la página.
- [ ] El ícono no se solapa con texto, controles, tarjetas ni marcadores en reposo (stage pegado, elementos fijos, punto de llegada y estados interactivos abiertos: nivel, punto, parada, tarjeta, pregunta), en las 8 secciones y en los 9 viewports del Paso 12. Se admite que el contenido en movimiento cruce por debajo al hacer scroll (decidido en el Paso 9).

**Navegación y transición**

- [ ] Cada enlace llega al punto de llegada de su sección, desde arriba y desde abajo, también en la primera visita.
- [ ] Al descubrirse la pantalla no hay restos de otra sección, fundidos a medias ni elementos apareciendo.
- [ ] Destino abajo: la transición va hacia arriba; destino arriba: hacia abajo; misma forma, duración y curva.
- [ ] Elegir la sección actual en su punto de llegada solo cierra el menú; elegirla desde más abajo usa la orientación «arriba».
- [ ] Con las secciones ya cargadas, la secuencia dura 1,4 s ± 0,2 s.
- [ ] Mientras la pantalla está cubierta no se ven secciones intermedias y la URL solo cambia una vez.
- [ ] Durante la transición, los clics, la rueda, el táctil y el teclado no mueven la página ni inician otra navegación.
- [ ] Con la red limitada, la pantalla sigue cubierta hasta que el destino está listo (tope 8 s).
- [ ] Con `prefers-reduced-motion: reduce` el salto es directo, sin transición ni animación del menú.

**Regresión**

- [ ] Las animaciones por scroll de las secciones, el botón del Hero y los niveles de Exploración se comportan igual que antes (capturas antes y después en las mismas posiciones), salvo los ajustes por el ícono.

**Calidad**

- [ ] Todos los textos del menú salen de `navigation.json`.
- [ ] axe/Lighthouse: 0 violaciones, también con el menú abierto.
- [ ] La transición anima solo `transform` y `opacity` y se mantiene a ≥ 50 fps con CPU 4× más lenta en emulación móvil.
- [ ] No hay `.scss` sueltos fuera de `src/styles/`, ni `!important`, ni `style={{}}` salvo valores dinámicos; `.ts` de lógica solo en `utils/` y `hooks/`; `prettier --check` limpio.
- [ ] `npm run build` y `npm run lint` terminan sin errores ni avisos nuevos.
- [ ] Se cumple el presupuesto.
- [ ] El informe de `section-verifier` queda registrado en este documento.

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
- Carga a dos viewports de distancia, fases de 500 / 300 / 600 ms y tope de espera de 8 s.
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
