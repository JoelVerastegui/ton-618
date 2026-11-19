// Mover el mouse sobre la sección no debe provocar Layout ni Paint (solo composite).
// Se calienta primero: la primera pasada puede repintar por la promoción inicial de capas.
import { sleep } from '../lib/cdp.mjs';

export const name = 'paint';
export const description = 'Layout = 0 y Paint = 0 durante 120 movimientos de mouse (tras calentar).';

export async function run({ page, baseUrl, opts }) {
  await page.load(baseUrl, { settle: opts.settle });
  const { w, h } = JSON.parse(
    await page.eval(`JSON.stringify({ w: document.documentElement.clientWidth, h: innerHeight })`)
  );
  // Región del barrido (fracciones del viewport). Por defecto la mitad superior,
  // para no pasar por elementos interactivos cuyo hover repinta legítimamente.
  const { x0, x1, y0, y1 } = opts.sweep ?? { x0: 0.07, x1: 0.9, y0: 0.11, y1: 0.5 };
  const sweep = async (n) => {
    for (let i = 0; i < n; i++) {
      const t = i / n;
      await page.mouseMove(w * (x0 + (x1 - x0) * t), h * (y0 + (y1 - y0) * (0.5 + 0.5 * Math.sin(t * 6))));
      await sleep(16);
    }
  };
  await sweep(80);
  await sleep(800);
  const counts = await page.trace(() => sweep(120));
  const results = [
    {
      id: 'paint con mouse',
      status: counts.Layout === 0 && counts.Paint === 0 ? 'pass' : 'fail',
      detail: `Layout=${counts.Layout} Paint=${counts.Paint}${
        counts.Paint > 0 ? ' → las capas que se mueven no están promovidas al compositor: prueba will-change: translate/transform' : ''
      }`,
    },
    { id: 'recálculo de estilo con mouse', status: 'info', detail: `UpdateLayoutTree=${counts.UpdateLayoutTree} (esperable si el parallax escribe variables CSS)` },
  ];
  return results;
}
