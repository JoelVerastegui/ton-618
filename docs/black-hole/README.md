# Agujero negro: portar el demo a TypeScript (ruta A)

## Objetivo

Reescribir el demo "Black Hole" de Emergent Mind (JavaScript minificado) como código **TypeScript legible, tipado y sin minificar**, listo para usarse después en una sección de TON 618. El resultado visual y el comportamiento deben ser **idénticos** al demo original.

**Alcance de esta tarea:** solo el motor (utils + hook). **No** crear la sección, ni rutas, ni JSON, ni tocar `App.tsx`. La sección se especificará después con el skill spec.

## Archivos fuente (`docs/black-hole/source/`)

| Archivo | Tamaño | Qué es |
|---|---|---|
| `demo.js` | 12,7 KB | Módulo ES minificado. `export default function (app)` recibe el objeto `app` del runtime y devuelve los manejadores `resize`, `frame`, `pointerdown`, `pointermove`, `pointerup`, `keydown`, `stop`. Importa `clamp` desde `"canvas_gallery/runtime"`. |
| `runtime.js` | 3,7 KB | Runtime del sitio. `run(canvas, init, { preview, maxDpr, onError })` gestiona bucle de animación, tamaño y DPR, eventos de puntero y teclado, y pausa con `IntersectionObserver`. También exporta `createNoise`, `clamp`, `lerp`, `random`. |

Son la fuente de verdad. No los modifiques ni los importes desde el proyecto. Origen: https://www.emergentmind.com/visualizations/black-hole (demo `black-hole`). Antes de publicar en producción hay que confirmar la licencia con el autor. Menciónalo como pendiente, no lo resuelvas.

## Cómo funciona el demo (mapa para leer el minificado)

1. **Tabla de geodésicas (`buildTable`)**: integra una vez con RK4 la ecuación `u'' = -u + 1.5u²` para 1120 parámetros de impacto (`ROWS = 2 * SIDE_ROWS`), con `DPSI = 0.02`, `SUBSTEPS = 8` y 789 muestras por fila. Guarda `u(ψ)` por fila, el ángulo final (`end`), si el rayo escapa (`escape`) y el pico (`peak`). `rowImpact` y `impactRow` convierten entre índice de fila y parámetro de impacto, con espaciado logarítmico cerca de `B_CRIT = 1.5·√3`.
2. **Ángulo inicial por distancia (`V`)**: para la distancia actual de la cámara `E` busca por bisección, en cada fila, el ángulo donde `u = 1/E`. Se recalcula solo cuando cambia `E`.
3. **Consulta de tabla (`Q`)**: interpola `u` y su derivada en una fila, hacia delante o hacia atrás en ψ.
4. **Pasada geométrica (`j`)**: por cada píxel construye el rayo, elige la fila por interpolación entre dos filas vecinas y calcula hasta `MAX_HITS = 3` cruces con el disco (`R_IN = 3` a `R_OUT = 15`). Para cada cruce guarda banda radial, ángulo, color de emisión, alfa y factor Doppler/gravitacional. Para los rayos que escapan guarda la coordenada del cielo (`bgU`, `bgV`). Soporta render por filas para el afinado progresivo.
5. **Pasada de sombreado (`J`)**: por píxel compone los cruces del disco (textura animada por rotación diferencial `SPIN`), luego el cielo y las estrellas lensadas con `starHash`. Aplica un tone mapping con LUT de 4096 entradas y escribe en un `Uint32Array`.
6. **Recursos procedurales**: `buildDiskTexture` (160 bandas × 1024 de ruido suave), `buildSky` (cielo 1024×512 con nebulosas, 26 000 estrellas y manchas oscuras), `blackbody` (temperatura a color), `makeRandom` (PRNG con semilla).
7. **Render progresivo**: pasada gruesa adaptativa (escala 0,18 a 0,5) y pasada fina (0,7, baja hasta 0,4 si los fotogramas son lentos). Al cambiar la cámara se reinicia la pasada gruesa; la fina se calcula por trozos de ~9 ms.
8. **Bloom**: el buffer se reduce a 1/4 y 1/12 y se suma con `globalCompositeOperation = 'lighter'` y `globalAlpha = 0.3`.
9. **Cámara**: azimut `G` con deriva, inclinación `B` que alterna entre `AUTO_TILTS` (mantiene 9 s, transición de 4,5 s con smoothstep) y distancia `E` en [7, 60] (inicial 30). Mientras `app.idle` (4 s sin interacción) la cámara deriva sola. El usuario puede orbitar arrastrando, hacer zoom con rueda o pellizco y mover con flechas y `+`/`-`.

Los nombres de una letra del minificado no están documentados. Deduce el significado leyendo el código y comprueba contra este mapa.

## Entregables

Respeta [architecture.md](../architecture.md) y [styles-rules.md](../styles-rules.md). Código con formato Prettier (`.prettierrc` del proyecto). Los `.ts` van en `utils/` y `hooks/`; en `components/` solo `tsx` y `scss`. Usa solo lo necesario.

Propuesta de estructura (ajústala si ves una mejor, pero justifícalo):

```
src/
├── interfaces/blackHole.ts        # Tipos: BlackHoleOptions, GeodesicTable, FrameBuffer, CameraState, BlackHoleControls...
├── utils/blackHole/
│   ├── constants.ts               # Constantes con nombre (R_IN, R_OUT, ROWS, SAMPLES, MAX_HITS, SPIN, AUTO_TILTS...)
│   ├── geodesicTable.ts           # buildTable, rowImpact, impactRow, consulta e interpolación
│   ├── diskTexture.ts             # buildDiskTexture, blackbody, LUT de color
│   ├── sky.ts                     # buildSky, starHash
│   ├── tracePass.ts               # pasada geométrica (j)
│   ├── shadePass.ts               # pasada de sombreado (J)
│   ├── camera.ts                  # estado de cámara, auto-tilt, límites
│   └── createBlackHole.ts         # Ensambla todo y devuelve { frame, resize, destroy, setDistance, ... }
└── hooks/useBlackHole.ts          # Liga el canvas con el motor, bucle, resize, pausa e interacción
```

Reutiliza los hooks existentes en vez de duplicar: `useInView.ts` para la pausa fuera de pantalla y `useReducedMotion.ts` para reducir o detener la deriva. Revisa antes si encajan.

## Requisitos

1. **Equivalencia visual.** La salida debe coincidir con el demo original en disco, sombra, anillo de fotones, cielo y estrellas lensadas, animación del gas, inclinación automática, bloom y render progresivo. Mantén los mismos números (constantes, fórmulas, LUTs). No "mejores" la física ni el aspecto.
2. **Sin dependencias nuevas.** Nada de librerías ni de `runtime.js`. Del runtime porta solo lo que usa el demo: bucle con `MAX_DT = 1/30`, `ResizeObserver`, DPR con tope, eventos de puntero, `idle` a los 4 s. `createNoise`, `lerp` y `random` no los usa el demo, así que no los portes.
3. **TypeScript estricto.** Sin `any`. Tipos explícitos en los arrays tipados (`Float32Array`, `Uint32Array`...). Nombres descriptivos en lugar de letras sueltas. Comentarios cortos que expliquen las ideas físicas y de rendimiento (no el "qué" obvio).
4. **Control externo.** El motor debe exponer, además del control por puntero y teclado: `distance` (7 a 60, lectura y escritura), inclinación y azimut, activar o desactivar la deriva automática, y un modo en el que la rueda no capture el scroll de la página (opción `captureWheel`, por defecto `false`). La sección futura necesitará un deslizador y conmutadores.
5. **Ciclo de vida limpio.** Un `destroy()` que quite todos los listeners y cancele el bucle. Compatible con React StrictMode (doble montaje) sin fugas ni doble bucle.
6. **Rendimiento.** No asignar objetos por píxel ni por fotograma en los bucles calientes (conserva los arrays reutilizados). Si el cálculo inicial de la tabla, del cielo o de la textura bloquea el hilo de forma notable, déjalo preparado para ejecutarse de forma diferida y señálalo. No lo muevas a un Web Worker sin pedir confirmación.
7. **Móvil.** Conserva los factores `preview` y el tope de DPR del original (`min(dpr, 1.25)`).
8. **Accesibilidad básica.** Que el canvas pueda recibir foco para las teclas, y que `prefers-reduced-motion` detenga la deriva y la rotación del gas.

## Verificación

1. `npm run build` y el linter del proyecto sin errores ni warnings nuevos.
2. Montar el motor en una página temporal (no la dejes en el proyecto) y compararlo lado a lado con el demo original en http://127.0.0.1 (puedes servir `docs/black-hole/source/` con un servidor estático, con un import map `{"canvas_gallery/runtime": "./runtime.js"}`). Revisa el disco con el lado Doppler brillante, el arco del lado lejano, el anillo fino y las estrellas curvadas.
3. Comprobar el ciclo de vida: montar, desmontar y volver a montar sin errores en consola ni listeners colgados.
4. Medir el tiempo del cálculo inicial y los fps en escritorio y con límite de CPU para simular móvil.
5. Resume al final: qué hiciste, qué difiere del original (si algo), medidas y puntos abiertos (licencia, bloqueo inicial, captura de rueda).

## Fuera de alcance

- La sección "Experimento" y su spec (se hará con el skill spec a partir de `docs/ideas/06-experiment.md`).
- Cuadrícula deformada, trayectoria de luz o cualquier visualización añadida al demo.
- Integración en rutas, lazy loading, navbar o transiciones.
