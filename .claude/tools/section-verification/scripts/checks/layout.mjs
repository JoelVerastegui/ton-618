// Desbordes horizontales en una batería de viewports (móvil, tablet, desktop, pantallas bajas).
export const name = 'layout';
export const description = 'Sin scroll horizontal en 9 viewports (320 a 2560 px) y sección encontrada.';

const DEFAULT_VIEWPORTS = [
  [320, 568, true],
  [360, 640, true],
  [390, 844, true],
  [640, 360, true],
  [768, 1024, false],
  [1024, 768, false],
  [1440, 900, false],
  [1920, 1080, false],
  [2560, 1440, false],
];

export async function run({ page, baseUrl, root, opts }) {
  const results = [];
  for (const [width, height, touch] of opts.viewports ?? DEFAULT_VIEWPORTS) {
    await page.load(baseUrl, { width, height, touch, settle: opts.settle });
    const r = JSON.parse(
      await page.eval(`(() => {
        const d = document.documentElement;
        const el = document.querySelector(${JSON.stringify(root)});
        return JSON.stringify({ found: !!el, scrollW: d.scrollWidth, clientW: d.clientWidth });
      })()`)
    );
    const id = `overflow-x ${width}x${height}${touch ? ' táctil' : ''}`;
    if (!r.found) results.push({ id, status: 'fail', detail: `no existe ${root}` });
    else if (r.scrollW > r.clientW) results.push({ id, status: 'fail', detail: `scrollWidth ${r.scrollW} > clientWidth ${r.clientW}` });
    else results.push({ id, status: 'pass', detail: `${r.scrollW} ≤ ${r.clientW}` });
  }
  return results;
}
