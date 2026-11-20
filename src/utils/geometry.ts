import type { CSSProperties } from 'react';

// Geometría determinista de las capas del mapa. Todo se calcula una sola vez al
// cargar el módulo de cada capa.
export type Point = [number, number];
export type Bezier = [number, number, number, number, number, number, number, number];

// TON 618 está siempre en el centro del viewBox (0-1000).
export const CENTER = 500;

// PRNG con semilla (mulberry32): mismo mapa en cada carga.
export const seeded = (seed: number) => {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const fmt = (n: number) => +n.toFixed(1);

// Puntos como segmentos de longitud casi nula: con `stroke-linecap: round`
// se dibujan como círculos en un único <path>.
export const dots = (points: Point[]) =>
  points.map(([x, y]) => `M${fmt(x)} ${fmt(y)}h.01`).join('');

export const bezierPath = (curves: Bezier[]) =>
  curves.map((c) => `M${c[0]} ${c[1]}C${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6]} ${c[7]}`).join('');

const bezierAt = (c: Bezier, t: number): Point => {
  const u = 1 - t;
  return [
    u ** 3 * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t ** 3 * c[6],
    u ** 3 * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t ** 3 * c[7],
  ];
};

// Puntos repartidos a lo largo de las curvas con dispersión `spread`.
export const scatterAlong = (curves: Bezier[], count: number, spread: number, rand: () => number) =>
  Array.from({ length: count }, (): Point => {
    const [x, y] = bezierAt(curves[Math.floor(rand() * curves.length)], rand());
    return [x + (rand() + rand() - 1) * spread, y + (rand() + rand() - 1) * spread];
  });

// Puntos al azar dentro de un disco centrado en (500, 500).
export const scatterDisk = (
  count: number,
  radius: number,
  rand: () => number,
  keepOut?: (p: Point) => boolean
) => {
  const points: Point[] = [];
  while (points.length < count) {
    const angle = rand() * Math.PI * 2;
    const dist = radius * Math.sqrt(rand());
    const point: Point = [CENTER + Math.cos(angle) * dist, CENTER + Math.sin(angle) * dist];
    if (!keepOut?.(point)) points.push(point);
  }
  return points;
};

// Coordenadas del viewBox (0-1000) → % de la capa. Objetos creados una vez.
export const at = (x: number, y: number): CSSProperties => ({
  left: `${x / 10}%`,
  top: `${y / 10}%`,
});

export const vector = (length: number, deg: number): CSSProperties =>
  ({ '--len': length, '--angle': `${deg}deg` }) as CSSProperties;

// Posiciones comunes a varias capas
export const POS_CENTER = at(CENTER, CENTER);
export const POS_SCALE_NOTE = at(500, 30);
