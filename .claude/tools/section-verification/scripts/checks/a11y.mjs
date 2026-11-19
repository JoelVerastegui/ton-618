// Accesibilidad: axe-core + contraste medido sobre el fondo renderizado.
//
// axe no puede calcular el contraste sobre gradientes e imágenes (lo deja como
// "incomplete"). Por eso se fotografía la página con el texto transparente y se
// muestrea el fondo real detrás de cada texto. Se usan la mediana y el percentil 90,
// no el máximo: una estrella suelta detrás de una letra falsea el peor píxel.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const name = 'a11y';
export const description = 'axe-core (0 violaciones) y contraste ≥ 4,5:1 medido sobre el fondo renderizado.';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(path.join(here, '..', 'noop.js'));

const luminance = ([r, g, b]) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (hi + 0.05) / (lo + 0.05);
};
const blend = (fg, alpha, bg) => fg.map((c, i) => c * alpha + bg[i] * (1 - alpha));

async function runAxe({ page, baseUrl, opts }) {
  await page.load(baseUrl, { settle: opts.settle });
  const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  await page.eval(axeSource);
  const report = JSON.parse(
    await page.eval(
      `axe.run(document, { resultTypes: ['violations', 'incomplete'] }).then((r) => JSON.stringify({
        violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help })),
        incomplete: r.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
        passes: r.passes.length }))`,
      true
    )
  );
  const results = report.violations.map((v) => ({
    id: `axe ${v.id}`,
    status: 'fail',
    detail: `${v.impact}: ${v.help} (${v.nodes} nodos)`,
  }));
  if (!report.violations.length) results.push({ id: 'axe', status: 'pass', detail: `0 violaciones (${report.passes} reglas superadas)` });
  for (const inc of report.incomplete) {
    results.push({
      id: `axe ${inc.id} (revisión manual)`,
      status: 'info',
      detail: `${inc.nodes} nodos que axe no puede evaluar; se cubren con el muestreo de contraste de abajo`,
    });
  }
  return results;
}

async function sampleContrast({ page, baseUrl, root, opts }, [width, height, touch]) {
  await page.load(baseUrl, { width, height, touch, settle: opts.settle });
  const items = JSON.parse(
    await page.eval(`(() => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const rgba = (str) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000'; ctx.fillStyle = str; ctx.fillRect(0, 0, 1, 1);
        const d = ctx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255]; };
      const section = document.querySelector(${JSON.stringify(root)});
      const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
      const seen = new Set(); const out = [];
      while (walker.nextNode()) {
        const node = walker.currentNode; const el = node.parentElement;
        if (!node.textContent.trim() || seen.has(el)) continue; seen.add(el);
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
        const b = el.getBoundingClientRect();
        if (b.width < 2 || b.height < 2 || b.bottom < 0 || b.top > innerHeight) continue;
        const [r, g, bl, a] = rgba(cs.color);
        const firstClass = (el.className + '').split(/\\s+/)[0].replace(/_[a-z0-9]+_\\d+$/, '').replace(/^_/, '');
        out.push({ label: firstClass.slice(0, 24) || el.tagName.toLowerCase(),
          text: node.textContent.trim().slice(0, 24), rect: [b.left, b.top, b.right, b.bottom].map(Math.round),
          color: [r, g, bl], alpha: a, size: parseFloat(cs.fontSize), weight: +cs.fontWeight });
      }
      // texto transparente para fotografiar solo el fondo (los fondos propios, como el de un botón, se conservan)
      const style = document.createElement('style');
      style.textContent = ${JSON.stringify(root)} + ' * { color: transparent !important; -webkit-text-fill-color: transparent !important; text-shadow: none !important; }';
      document.head.appendChild(style);
      return JSON.stringify(out);
    })()`)
  );
  await new Promise((r) => setTimeout(r, 300));
  const { PNG } = await import('pngjs');
  const png = PNG.sync.read(await page.screenshot());
  const scale = png.width / (await page.eval('innerWidth'));
  const percentile = (rect, pct) => {
    const px = [];
    const [l, t, r, b] = rect.map((v) => Math.round(v * scale));
    for (let y = Math.max(0, t); y < Math.min(png.height, b); y += 2)
      for (let x = Math.max(0, l); x < Math.min(png.width, r); x += 2) {
        const i = (png.width * y + x) * 4;
        px.push([png.data[i], png.data[i + 1], png.data[i + 2]]);
      }
    px.sort((p, q) => luminance(p) - luminance(q));
    return px[Math.min(px.length - 1, Math.floor(px.length * pct))];
  };
  return items.map((item) => {
    const bg90 = percentile(item.rect, 0.9);
    const bgMed = percentile(item.rect, 0.5);
    const r90 = ratio(blend(item.color, item.alpha, bg90), bg90);
    const rMed = ratio(blend(item.color, item.alpha, bgMed), bgMed);
    const large = item.size >= 24 || (item.size >= 18.66 && item.weight >= 700);
    const need = large ? 3 : 4.5;
    return {
      id: `contraste ${width}x${height} "${item.text}" (${item.label})`,
      status: r90 >= need ? 'pass' : 'fail',
      detail: `p90=${r90.toFixed(2)} mediana=${rMed.toFixed(2)} (mínimo ${need}${large ? ', texto grande' : ''})`,
    };
  });
}

export async function run(ctx) {
  const results = await runAxe(ctx);
  for (const viewport of ctx.opts.contrastViewports ?? [
    [1440, 900, false],
    [390, 844, true],
    [640, 360, true],
  ]) {
    results.push(...(await sampleContrast(ctx, viewport)));
  }
  return results;
}
