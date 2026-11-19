// ¿El navegador registra First Contentful Paint? Si no, Lighthouse falla con NO_FCP y LCP
// no se reporta. Causa típica: texto animado desde opacity: 0 (ver references/lessons.md).
export const name = 'fcp';
export const description = 'El navegador registra first-contentful-paint en desktop y móvil.';

export async function run({ page, baseUrl, opts }) {
  const results = [];
  for (const [label, width, height, touch] of [
    ['desktop 1440x900', 1440, 900, false],
    ['móvil 412x915', 412, 915, true],
  ]) {
    await page.load(baseUrl, { width, height, touch, settle: Math.max(opts.settle ?? 0, 4500) });
    const paints = JSON.parse(
      await page.eval(`JSON.stringify(performance.getEntriesByType('paint').map((p) => p.name + '@' + Math.round(p.startTime)))`)
    );
    const fcp = paints.find((p) => p.startsWith('first-contentful-paint'));
    results.push(
      fcp
        ? { id: `fcp ${label}`, status: 'pass', detail: fcp }
        : {
            id: `fcp ${label}`,
            status: 'fail',
            detail: `no hay first-contentful-paint (solo ${paints.join(', ') || 'nada'}). Sospecha: texto con animación de entrada desde opacity: 0; usa 0.01.`,
          }
    );
  }
  return results;
}
