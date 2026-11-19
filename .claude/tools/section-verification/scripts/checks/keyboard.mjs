// Teclado: cada control de la sección es alcanzable con Tab, muestra foco visible y tiene
// un área táctil suficiente.
export const name = 'keyboard';
export const description = 'Controles alcanzables con Tab, :focus-visible visible y área táctil ≥ 48 px.';

export async function run({ page, baseUrl, root, opts }) {
  await page.load(baseUrl, { settle: opts.settle });
  const minTarget = opts.minTarget ?? 48;
  const results = [];
  const seen = new Set();
  for (let i = 0; i < 12; i++) {
    await page.key('Tab', 'Tab', 9);
    const info = JSON.parse(
      await page.eval(`(() => {
        const a = document.activeElement; const section = document.querySelector(${JSON.stringify(root)});
        if (!a || a === document.body) return JSON.stringify({ none: true });
        const cs = getComputedStyle(a); const b = a.getBoundingClientRect();
        return JSON.stringify({ inside: section.contains(a), tag: a.tagName.toLowerCase(), text: (a.textContent || '').trim().slice(0, 30),
          focusVisible: a.matches(':focus-visible'), outline: cs.outlineStyle + ' ' + cs.outlineWidth, shadow: cs.boxShadow !== 'none',
          w: Math.round(b.width), h: Math.round(b.height) });
      })()`)
    );
    if (info.none || !info.inside) break;
    const key = `${info.tag}:${info.text}`;
    if (seen.has(key)) break;
    seen.add(key);
    const hasFocusRing = info.focusVisible && (info.outline.startsWith('solid') || info.shadow);
    results.push({
      id: `foco "${info.text}"`,
      status: hasFocusRing ? 'pass' : 'fail',
      detail: `:focus-visible=${info.focusVisible} outline=${info.outline}`,
    });
    results.push({
      id: `área táctil "${info.text}"`,
      status: info.h >= minTarget && info.w >= minTarget ? 'pass' : 'fail',
      detail: `${info.w}x${info.h} px (mínimo ${minTarget})`,
    });
  }
  if (!results.length) results.push({ id: 'teclado', status: 'info', detail: 'la sección no tiene controles enfocables' });
  return results;
}
