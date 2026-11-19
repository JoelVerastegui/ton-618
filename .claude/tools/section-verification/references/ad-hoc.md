# Comprobaciones específicas de una sección

Las comprobaciones genéricas no saben nada de la geometría, los estados ni los valores propios de una
sección. Esas se escriben aparte, en un script temporal, usando la clase `Page` de `scripts/lib/cdp.mjs`.
No las metas en `scripts/checks/` salvo que valgan para cualquier sección.

## Esqueleto

Guarda el script **fuera del proyecto** (carpeta temporal o scratchpad) e impórtalo por ruta absoluta:

```js
import { Page, launchBrowser, killTree } from '<ruta>/.claude/tools/section-verification/scripts/lib/cdp.mjs';

const browser = await launchBrowser();            // Edge/Chrome headless en un puerto libre
const page = await Page.connect(browser.port);
try {
  await page.load('http://localhost:4173/', { width: 640, height: 360, touch: true, settle: 3800 });
  const result = JSON.parse(await page.eval(`(() => { /* medir en la página */ return JSON.stringify({}); })()`));
  console.log(result);
} finally {
  page.close();
  killTree(browser.proc);
}
```

Para servir el proyecto, ejecuta `npm run build` y `npx vite preview --port 4173` aparte (o usa `--base`
en `run.mjs` si solo necesitas las comprobaciones genéricas).

## API de `Page`

- `load(url, { width, height, touch, reduce, settle })` — emula el dispositivo, `prefers-reduced-motion` y
  navega; `settle` es la espera (ms) a que terminen las entradas.
- `eval(expresión, awaitPromise?)` — evalúa en la página y devuelve el valor (devuelve JSON como cadena).
- `mouseMove(x, y)`, `click(x, y)`, `key(key, code, windowsVirtualKeyCode)`, `screenshot()` → Buffer PNG.
- `trace(acción)` — cuenta `Layout`, `UpdateLayoutTree` y `Paint` mientras corre la acción.
- `send(método, params)` — cualquier método de CDP; `errors` recoge excepciones y `console.error`.

## Ejemplos de lo que sí se mide así

- **Texto frente a un obstáculo no rectangular** (el hero: que el texto no tape la sombra circular del
  agujero negro). Se calcula el centro y el radio del círculo a partir del rectángulo del elemento y la
  distancia mínima de cada rectángulo de texto a ese círculo; negativa = se solapan. Se probó en 9 tamaños y
  salió el fallo a 640×360 que la inspección visual a 1440×900 no mostraba.
- **Valores exactos de parallax:** mover el mouse con `mouseMove` hasta una esquina, esperar a que se asiente
  y comparar `getBoundingClientRect()` de cada capa antes y después; comprobar que el elemento que debe
  quedarse quieto tiene el mismo rectángulo.
- **Efecto por scroll:** `window.scrollTo(0, p * innerHeight)` en varios `p`, esperar ~700 ms y leer `opacity`
  y `scale` calculados. Para probar el fallback sin soporte de `animation-timeline`, servir una copia del
  `dist` donde la condición `@supports` esté rota y forzar `CSS.supports` a falso con
  `Page.addScriptToEvaluateOnNewDocument`.
- **Clic en un CTA:** `click` sobre el centro del elemento, esperar y leer `scrollY`.

## Qué decir al informar

Indica siempre el viewport, el método y el número medido, y deja claro lo que se infirió del código en lugar
de medirlo.
