#!/usr/bin/env node
// Orquestador de verify-section: construye y sirve el proyecto (o usa una URL), lanza un
// navegador headless, ejecuta las comprobaciones elegidas y resume el resultado.
//
//   node run.mjs --root "#hero" [--checks layout,fcp,paint,motion,a11y,keyboard,frames,lighthouse]
//                [--base http://localhost:4173/] [--project <ruta>] [--no-build]
//                [--settle 3800] [--lh-runs 2] [--lh-perf 90] [--lh-lcp 2500] [--min-target 48]
//                [--json salida.json]
//
// Códigos de salida: 0 = sin fallos, 1 = hay fallos, 2 = error de uso o de entorno.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Page, freePort, killTree, launchBrowser, waitForHttp } from './lib/cdp.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const ALL_CHECKS = ['layout', 'fcp', 'paint', 'motion', 'a11y', 'keyboard', 'frames', 'lighthouse'];
const FILE_OF = { fcp: 'vitals' };

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[key] = true;
    else {
      args[key] = next;
      i++;
    }
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
if (args.help || !args.root) {
  console.log('Uso: node run.mjs --root "<selector de la sección>" [opciones]. Ver la cabecera de run.mjs.');
  process.exit(args.help ? 0 : 2);
}
if (Number(process.versions.node.split('.')[0]) < 22) {
  console.error('Hace falta Node >= 22 (WebSocket global).');
  process.exit(2);
}
if (!fs.existsSync(path.join(here, 'node_modules', 'axe-core'))) {
  console.error('Faltan dependencias. Ejecuta: npm install --prefix "' + here + '"');
  process.exit(2);
}

const project = path.resolve(args.project ?? process.cwd());
const checks = (args.checks ? String(args.checks).split(',') : ALL_CHECKS).map((c) => c.trim());
const unknown = checks.filter((c) => !ALL_CHECKS.includes(c));
if (unknown.length) {
  console.error(`Comprobaciones desconocidas: ${unknown.join(', ')}. Disponibles: ${ALL_CHECKS.join(', ')}`);
  process.exit(2);
}

const opts = {
  settle: args.settle ? Number(args.settle) : 3800,
  lhRuns: args['lh-runs'] ? Number(args['lh-runs']) : 2,
  lhPerf: args['lh-perf'] ? Number(args['lh-perf']) : 90,
  lhLcp: args['lh-lcp'] ? Number(args['lh-lcp']) : 2500,
  minTarget: args['min-target'] ? Number(args['min-target']) : 48,
};

const children = [];
let browser = null;
let page = null;

async function serve() {
  if (args.base) return args.base;
  if (!args['no-build']) {
    console.log('› construyendo el proyecto (npm run build)…');
    const build = spawnSync('npm run build', { cwd: project, shell: true, encoding: 'utf8' });
    if (build.status !== 0) {
      console.error(build.stdout + build.stderr);
      throw new Error('npm run build falló: no se verifica una sección que no compila.');
    }
  }
  const port = await freePort();
  const preview = spawn(`npx vite preview --port ${port} --strictPort`, {
    cwd: project,
    shell: true,
    stdio: 'ignore',
    detached: process.platform !== 'win32',
  });
  children.push(preview);
  const url = `http://localhost:${port}/`;
  await waitForHttp(url);
  return url;
}

async function cleanup() {
  page?.close();
  children.forEach(killTree);
  if (browser) {
    killTree(browser.proc);
    await new Promise((r) => setTimeout(r, 500));
    fs.rmSync(browser.profileDir, { recursive: true, force: true });
  }
}

const ICON = { pass: '✓', fail: '✗', warn: '⚠', info: '·' };
const all = [];

try {
  const baseUrl = await serve();
  console.log(`› sirviendo ${baseUrl}`);
  browser = await launchBrowser();
  page = await Page.connect(browser.port);
  const ctx = { page, baseUrl, root: String(args.root), opts, browserPort: browser.port };

  for (const check of checks) {
    const mod = await import(`./checks/${FILE_OF[check] ?? check}.mjs`);
    console.log(`\n## ${mod.name} — ${mod.description}`);
    let results;
    try {
      results = await mod.run(ctx);
    } catch (error) {
      results = [{ id: `${check} (error del script)`, status: 'fail', detail: String(error.message ?? error) }];
    }
    for (const r of results) {
      console.log(`${ICON[r.status]} ${r.id} — ${r.detail}`);
      all.push({ check, ...r });
    }
  }

  const errors = [...new Set(page.errors)];
  console.log('\n## consola — errores de JavaScript durante toda la ejecución');
  if (errors.length) {
    for (const e of errors.slice(0, 8)) console.log(`✗ ${e}`);
    all.push({ check: 'console', id: 'errores de consola', status: 'fail', detail: `${errors.length} únicos` });
  } else {
    console.log('✓ sin errores ni excepciones');
    all.push({ check: 'console', id: 'errores de consola', status: 'pass', detail: 'ninguno' });
  }
} catch (error) {
  console.error(`\nError: ${error.message}`);
  await cleanup();
  process.exit(2);
}

await cleanup();
const count = (status) => all.filter((r) => r.status === status).length;
console.log(`\nResumen: ${count('pass')} correctas, ${count('fail')} fallos, ${count('warn')} avisos, ${count('info')} informativas.`);
if (args.json) fs.writeFileSync(String(args.json), JSON.stringify(all, null, 2));
process.exit(count('fail') ? 1 : 0);
