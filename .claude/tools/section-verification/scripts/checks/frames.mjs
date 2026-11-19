// Fluidez: duración de frame con la sección inactiva, comparada con una página vacía en el
// MISMO navegador. Sin GPU (headless) los números absolutos no son representativos; la
// comparación con la línea base sí dice si el entorno o la página es el limitante.
import { sleep } from '../lib/cdp.mjs';

export const name = 'frames';
export const description = 'Duración de frame (mediana) frente a una página vacía como línea base.';

async function medianFrame(page, ms = 2500) {
  await page.eval(`window.__f = []; window.__run = true; (() => { let last = performance.now(); const loop = (t) => { window.__f.push(t - last); last = t; if (window.__run) requestAnimationFrame(loop); }; requestAnimationFrame(loop); })()`);
  await sleep(ms);
  await page.eval('window.__run = false');
  const frames = JSON.parse(await page.eval('JSON.stringify(window.__f.slice(2))')).sort((a, b) => a - b);
  return { median: frames[Math.floor(frames.length / 2)], p95: frames[Math.floor(frames.length * 0.95)], n: frames.length };
}

export async function run({ page, baseUrl, opts }) {
  await page.load('data:text/html,<body style="margin:0;background:%23000"><h1 style="color:%23fff">x</h1>', { settle: 1200 });
  const baseline = await medianFrame(page);
  await page.load(baseUrl, { settle: opts.settle });
  const idle = await medianFrame(page);
  const detail = `página: mediana ${idle.median.toFixed(1)} ms (p95 ${idle.p95.toFixed(1)}), página vacía: ${baseline.median.toFixed(1)} ms`;
  if (idle.median <= 20) return [{ id: 'frames en reposo', status: 'pass', detail }];
  if (baseline.median <= 20)
    return [
      {
        id: 'frames en reposo',
        status: 'warn',
        detail: `${detail}. La página supera el presupuesto de 20 ms en un navegador sin GPU: no concluyente, medir en un dispositivo real. Para localizar el coste, desactiva grupos de animaciones uno a uno y vuelve a medir.`,
      },
    ];
  return [{ id: 'frames en reposo', status: 'info', detail: `${detail}. El entorno ya va lento sin la página; no concluyente.` }];
}
