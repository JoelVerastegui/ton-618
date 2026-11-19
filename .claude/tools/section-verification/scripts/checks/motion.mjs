// Animaciones en ejecución dentro de la sección: en vista, fuera de vista y con reduced-motion.
export const name = 'motion';
export const description = 'Animaciones: pausadas fuera de vista y ausentes con prefers-reduced-motion.';

const countRunning = (root) => `(() => {
  const section = document.querySelector(${JSON.stringify(root)});
  const all = document.getAnimations().filter((a) => a.effect && a.effect.target && section.contains(a.effect.target));
  return JSON.stringify({ total: all.length, running: all.filter((a) => a.playState === 'running').length });
})()`;

// Añade una página alta debajo para poder sacar la sección del viewport.
const ADD_SPACER = `(() => { const d = document.createElement('div'); d.style.height = '6000px'; document.body.appendChild(d); })()`;

async function scenario(page, { baseUrl, root, opts, label, touch = false, reduce = false }) {
  await page.load(baseUrl, { touch, reduce, width: touch ? 390 : 1440, height: touch ? 844 : 900, settle: opts.settle });
  const results = [];
  const inView = JSON.parse(await page.eval(countRunning(root)));
  if (reduce) {
    results.push({
      id: `reduced-motion ${label}`,
      status: inView.total === 0 ? 'pass' : 'fail',
      detail: `getAnimations() de la sección = ${inView.total} (debe ser 0; las animaciones terminadas con fill también cuentan)`,
    });
    return results;
  }
  results.push({ id: `en vista ${label}`, status: 'info', detail: `${inView.running} corriendo (de ${inView.total})` });
  await page.eval(ADD_SPACER);
  await page.eval('window.scrollTo(0, document.documentElement.scrollHeight)');
  await new Promise((r) => setTimeout(r, 1200));
  const out = JSON.parse(await page.eval(countRunning(root)));
  results.push({
    id: `fuera de vista ${label}`,
    status: out.running === 0 ? 'pass' : 'fail',
    detail: `${out.running} animaciones corriendo con la sección fuera del viewport (debe ser 0)`,
  });
  await page.eval('window.scrollTo(0, 0)');
  await new Promise((r) => setTimeout(r, 1200));
  const back = JSON.parse(await page.eval(countRunning(root)));
  results.push({
    id: `reanuda al volver ${label}`,
    status: inView.running > 0 && back.running === 0 ? 'warn' : 'pass',
    detail: `${back.running} corriendo tras volver (antes ${inView.running})`,
  });
  return results;
}

export async function run(ctx) {
  return [
    ...(await scenario(ctx.page, { ...ctx, label: 'desktop' })),
    ...(await scenario(ctx.page, { ...ctx, label: 'táctil', touch: true })),
    ...(await scenario(ctx.page, { ...ctx, label: 'desktop', reduce: true })),
    ...(await scenario(ctx.page, { ...ctx, label: 'táctil', touch: true, reduce: true })),
  ];
}
