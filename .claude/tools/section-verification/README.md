# section-verification

Caja de herramientas del agente `section-verifier` (`.claude/agents/section-verifier.md`). **No es una
batería fija de pruebas**: son piezas que miden cosas concretas en un navegador headless, para que el
agente las combine según lo que necesite cada sección, o las deje de lado y escriba una prueba a medida.

## Preparación (una vez)

- Node ≥ 22 y Edge o Chrome instalados (si no se encuentran: variable `CHROME_PATH`).
- `npm install --prefix .claude/tools/section-verification/scripts` (dependencias propias; no tocan el
  `package.json` del proyecto, y `node_modules` queda ignorado por git).

## Piezas disponibles

`node .claude/tools/section-verification/scripts/run.mjs --root "<selector>" [--checks a,b,c]`

| Pieza (`--checks`) | Qué mide |
|---|---|
| `layout` | Scroll horizontal en 9 viewports (320 a 2560 px) |
| `fcp` | Que el navegador registre first-contentful-paint (si no, Lighthouse falla con NO_FCP) |
| `paint` | Eventos de Layout y Paint al mover el mouse sobre la sección |
| `motion` | Animaciones corriendo en vista, fuera de vista y con `prefers-reduced-motion`, en desktop y táctil |
| `a11y` | axe-core y contraste ≥ 4,5:1 medido sobre el fondo renderizado (no sobre el CSS) |
| `keyboard` | Tab, `:focus-visible` y área táctil de los controles |
| `frames` | Duración de frame frente a una página vacía en el mismo navegador |
| `lighthouse` | Lighthouse móvil: puntuaciones, FCP, LCP, TBT, CLS y peso (varias ejecuciones con `--lh-runs`) |

Sin `--checks` ejecuta todas. Opciones: `--base <url>` (medir una URL ya servida), `--no-build`,
`--project <ruta>`, `--settle <ms>`, `--lh-runs`, `--lh-perf`, `--lh-lcp`, `--min-target`, `--json <archivo>`.
Salida: `✓` pasa, `✗` falla, `⚠` aviso (no concluyente), `·` informativo; código 1 si hay fallos.
Construye el proyecto y lo sirve con `vite preview`; los procesos se limpian al terminar.

## Documentos

- `references/lessons.md`: fallos reales ya diagnosticados (síntoma, causa, arreglo) y trampas de medición.
- `references/ad-hoc.md`: cómo escribir una prueba a medida con la clase `Page` de `scripts/lib/cdp.mjs`.

## Nota para Windows

Si el servidor de desarrollo (`npm run dev`) está abierto, su vigilante de archivos bloquea el renombrado de
carpetas del proyecto (`EPERM`). Copiar y borrar funciona; mover no.
