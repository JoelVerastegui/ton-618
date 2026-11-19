// Mini-cliente del Protocolo de DevTools (CDP) sin dependencias. Requiere Node >= 22
// (WebSocket global). Lanza Edge o Chrome en modo headless y expone una clase Page
// con lo justo para las comprobaciones de verify-section.
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

export function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.EDGE_PATH,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/microsoft-edge',
  ].filter(Boolean);
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error('No se encontró Edge ni Chrome. Define CHROME_PATH con la ruta del ejecutable.');
  return found;
}

// Mata un proceso y sus hijos (en Windows `npx` y el navegador dejan procesos huérfanos).
export function killTree(child) {
  if (!child || child.killed || !child.pid) return;
  try {
    if (process.platform === 'win32') execSync(`taskkill /PID ${child.pid} /T /F`, { stdio: 'ignore' });
    else process.kill(-child.pid, 'SIGKILL');
  } catch {
    /* ya terminado */
  }
}

export async function waitForHttp(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      /* aún no arranca */
    }
    await sleep(300);
  }
  throw new Error(`Timeout esperando ${url}`);
}

export async function launchBrowser() {
  const port = await freePort();
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'verify-section-profile-'));
  const proc = spawn(
    findBrowser(),
    [
      '--headless=new',
      '--disable-gpu',
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileDir}`,
      '--window-size=1440,900',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank',
    ],
    { stdio: 'ignore', detached: process.platform !== 'win32' }
  );
  await waitForHttp(`http://127.0.0.1:${port}/json/version`, 20000);
  return { port, proc, profileDir };
}

export class Page {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    this.errors = [];
    this.traceEvents = [];
    this.traceDone = false;
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.id && this.pending.has(data.id)) {
        this.pending.get(data.id)(data);
        this.pending.delete(data.id);
      } else if (data.method === 'Runtime.exceptionThrown') {
        this.errors.push(`excepción: ${data.params.exceptionDetails.text} ${data.params.exceptionDetails.exception?.description ?? ''}`.trim());
      } else if (data.method === 'Runtime.consoleAPICalled' && data.params.type === 'error') {
        this.errors.push(`console.error: ${JSON.stringify(data.params.args.map((arg) => arg.value))}`);
      } else if (data.method === 'Tracing.dataCollected') {
        this.traceEvents.push(...data.params.value);
      } else if (data.method === 'Tracing.tracingComplete') {
        this.traceDone = true;
      }
    };
  }

  static async connect(port) {
    const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const target = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
    const page = new Page(ws);
    await page.send('Page.enable');
    await page.send('Runtime.enable');
    return page;
  }

  send(method, params = {}) {
    return new Promise((resolve) => {
      const id = ++this.nextId;
      this.pending.set(id, resolve);
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression, awaitPromise = false) {
    const response = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
    if (response.result?.exceptionDetails) {
      throw new Error(`eval falló: ${response.result.exceptionDetails.exception?.description ?? response.result.exceptionDetails.text}`);
    }
    return response.result?.result?.value;
  }

  /**
   * Emula el dispositivo y carga la URL. `touch` activa pointer: coarse / hover: none,
   * `reduce` activa prefers-reduced-motion. Espera `settle` ms a que terminen las entradas.
   */
  async load(url, { width = 1440, height = 900, touch = false, reduce = false, settle = 3800 } = {}) {
    await this.send('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: 5 });
    await this.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: touch ? 2 : 1,
      mobile: touch,
    });
    await this.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
    });
    await this.send('Page.navigate', { url });
    await sleep(settle);
  }

  mouseMove(x, y) {
    return this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
  }

  async click(x, y) {
    await this.mouseMove(x, y);
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  }

  async key(key, code, vk) {
    await this.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk });
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk });
  }

  async screenshot() {
    const response = await this.send('Page.captureScreenshot', { format: 'png' });
    return Buffer.from(response.result.data, 'base64');
  }

  async trace(action, categories = 'devtools.timeline,disabled-by-default-devtools.timeline') {
    this.traceEvents = [];
    this.traceDone = false;
    await this.send('Tracing.start', { categories, transferMode: 'ReportEvents' });
    await action();
    await sleep(300);
    await this.send('Tracing.end');
    while (!this.traceDone) await sleep(100);
    const count = (name) => this.traceEvents.filter((event) => event.name === name).length;
    return { Layout: count('Layout'), UpdateLayoutTree: count('UpdateLayoutTree'), Paint: count('Paint') };
  }

  close() {
    try {
      this.ws.close();
    } catch {
      /* ya cerrado */
    }
  }
}
