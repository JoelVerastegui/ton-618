// Lighthouse móvil (Slow 4G simulado, CPU ×4) contra el MISMO navegador headless.
// Se ejecuta varias veces porque CLS y TBT varían entre ejecuciones.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const name = 'lighthouse';
export const description = 'Lighthouse móvil: Performance, Accessibility, Best practices, FCP, LCP, TBT y CLS.';

function runLighthouse(url, port, outFile) {
  return new Promise((resolve) => {
    const command = [
      'npx --yes lighthouse@12',
      url,
      `--port=${port}`,
      '--only-categories=performance,accessibility,best-practices',
      '--form-factor=mobile',
      '--screenEmulation.mobile',
      '--output=json',
      `--output-path="${outFile}"`,
      '--quiet',
    ].join(' ');
    // cwd en tmp para que npx no mezcle el package.json del proyecto
    const child = spawn(command, { cwd: os.tmpdir(), shell: true, stdio: 'ignore' });
    child.on('exit', () => resolve());
  });
}

export async function run({ baseUrl, browserPort, opts }) {
  const runs = opts.lhRuns ?? 2;
  const minPerf = opts.lhPerf ?? 90;
  const maxLcp = opts.lhLcp ?? 2500;
  const results = [];
  for (let i = 1; i <= runs; i++) {
    const outFile = path.join(os.tmpdir(), `verify-section-lh-${Date.now()}-${i}.json`);
    await runLighthouse(baseUrl, browserPort, outFile);
    if (!fs.existsSync(outFile)) {
      results.push({ id: `lighthouse #${i}`, status: 'fail', detail: 'Lighthouse no produjo informe (¿navegador o red?)' });
      continue;
    }
    const report = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    fs.rmSync(outFile, { force: true });
    if (report.runtimeError) {
      const hint =
        report.runtimeError.code === 'NO_FCP'
          ? ' La página pinta pero el navegador no registra FCP: revisa la comprobación "fcp" (texto animado desde opacity: 0).'
          : '';
      results.push({ id: `lighthouse #${i}`, status: 'fail', detail: `${report.runtimeError.code}.${hint}` });
      continue;
    }
    const audits = report.audits;
    const score = (key) => Math.round(report.categories[key].score * 100);
    const lcp = audits['largest-contentful-paint'].numericValue;
    const cls = audits['cumulative-layout-shift'].numericValue;
    results.push(
      {
        id: `lighthouse #${i} puntuaciones`,
        status: score('performance') >= minPerf && score('accessibility') >= minPerf ? 'pass' : 'fail',
        detail: `Performance ${score('performance')}, Accessibility ${score('accessibility')}, Best practices ${score('best-practices')} (mínimo ${minPerf})`,
      },
      {
        id: `lighthouse #${i} LCP`,
        status: lcp <= maxLcp ? 'pass' : 'fail',
        detail: `${audits['largest-contentful-paint'].displayValue} (máximo ${maxLcp} ms); FCP ${audits['first-contentful-paint'].displayValue}; TBT ${audits['total-blocking-time'].displayValue}`,
      },
      {
        id: `lighthouse #${i} CLS`,
        status: cls <= 0.001 ? 'pass' : 'fail',
        detail: `${cls.toFixed(4)}${cls > 0.001 ? ' → mira layout-shifts (suele ser el cambio de fuente: usa una fuente de respaldo con las métricas ajustadas)' : ''}`,
      },
      {
        id: `lighthouse #${i} peso`,
        status: 'info',
        detail: audits['total-byte-weight'].displayValue,
      }
    );
  }
  return results;
}
