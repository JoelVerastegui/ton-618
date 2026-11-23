import { BG_H, BG_W, TAU } from './constants';
import { makeRandom } from './random';

const NEBULA_COUNT = 1100;
const STAR_COUNT = 26000;
const DARK_PATCH_COUNT = 320;
const STARS_PER_CHUNK = 2600;

// Latitud (rad) a partir de la longitud: la Vía Láctea es una banda sinusoidal sobre el cielo.
const bandLatitude = (longitude: number, spread: number): number =>
  0.42 * Math.sin(longitude + 0.6) + spread;

// Cielo equirrectangular de BG_W × BG_H: nebulosas, 26 000 estrellas y manchas oscuras. Devuelve
// el RGBA (Uint32) en `result.pixels`. Cede entre trozos de estrellas.
export function* buildSky(result: { pixels: Uint32Array }): Generator<void> {
  const canvas = document.createElement('canvas');
  canvas.width = BG_W;
  canvas.height = BG_H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No hay contexto 2D para el cielo');
  const random = makeRandom(5);
  const scale = BG_W / 2048;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, BG_W, BG_H);
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 0; i < NEBULA_COUNT; i += 1) {
    const longitude = random() * TAU;
    const scatter = 0.16 * (random() + random() + random() - 1.5);
    const latitude = bandLatitude(longitude, scatter);
    const x = (longitude / TAU) * BG_W;
    const y = (0.5 - latitude / Math.PI) * BG_H;
    const radius = (8 + 40 * random()) * scale;
    const mix = random();
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const alpha = 0.03 + 0.035 * random();
    gradient.addColorStop(
      0,
      `rgba(${110 + 120 * mix}, ${120 + 40 * mix}, ${210 - 90 * mix}, ${alpha})`
    );
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    // Se repite a ambos lados para que el cielo cierre sin costura en longitud 0 / 2π.
    for (const wrap of [-BG_W, 0, BG_W]) {
      ctx.fillRect(x + wrap - radius, y - radius, 2 * radius, 2 * radius);
    }
  }
  yield;

  for (let i = 0; i < STAR_COUNT; i += 1) {
    const longitude = random() * TAU;
    const latitude = bandLatitude(longitude, 0.14 * (random() + random() + random() - 1.5));
    const x = (longitude / TAU) * BG_W;
    const y = (0.5 - latitude / Math.PI) * BG_H;
    ctx.fillStyle = `rgba(255, 235, 215, ${0.04 + 0.1 * random()})`;
    ctx.fillRect(x, y, 1, 1);
    if (i % STARS_PER_CHUNK === STARS_PER_CHUNK - 1) yield;
  }

  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < DARK_PATCH_COUNT; i += 1) {
    const longitude = random() * TAU;
    const latitude = bandLatitude(longitude, 0.07 * (random() - 0.5));
    const x = (longitude / TAU) * BG_W;
    const y = (0.5 - latitude / Math.PI) * BG_H;
    const radius = (5 + 20 * random()) * scale;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
  }
  yield;

  const data = ctx.getImageData(0, 0, BG_W, BG_H).data;
  result.pixels = new Uint32Array(data.buffer.slice(0));
}

// Hash entero de una celda de la rejilla de estrellas: bits bajos = presencia, medios = posición
// dentro de la celda, altos = brillo y color.
export function starHash(x: number, y: number): number {
  let hash = Math.imul(x, 374761393) ^ Math.imul(y, 668265263);
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177);
  hash ^= hash >>> 16;
  return hash >>> 0;
}
