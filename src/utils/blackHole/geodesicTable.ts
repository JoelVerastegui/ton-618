import type { GeodesicTable } from '../../interfaces/blackHole';
import {
  B_CRIT,
  DPSI,
  LOG_MIN,
  LOG_YMAX,
  PSI_MAX,
  ROWS,
  SAMPLES,
  SIDE_ROWS,
  SUBSTEPS,
} from './constants';
import { clamp } from './random';

// Parámetro de impacto de cada fila: espaciado logarítmico a ambos lados de B_CRIT, donde la
// curvatura cambia más deprisa (anillo de fotones).
export function rowImpact(row: number): number {
  if (row < SIDE_ROWS) {
    const t = row / (SIDE_ROWS - 1);
    return Math.max(0.001, B_CRIT * (1 - Math.exp(LOG_MIN * t)));
  }
  const t = (row - SIDE_ROWS) / (SIDE_ROWS - 1);
  return B_CRIT * (1 + Math.exp(LOG_MIN + t * (LOG_YMAX - LOG_MIN)));
}

// Inversa de `rowImpact`: fila fraccionaria de un parámetro de impacto.
export function impactRow(impact: number): number {
  if (impact < B_CRIT) {
    const t = Math.max(1e-6, 1 - impact / B_CRIT);
    return clamp(Math.log(t) / LOG_MIN, 0, 1) * (SIDE_ROWS - 1);
  }
  const t = Math.max(1e-6, impact / B_CRIT - 1);
  return SIDE_ROWS + clamp((Math.log(t) - LOG_MIN) / (LOG_YMAX - LOG_MIN), 0, 1) * (SIDE_ROWS - 1);
}

export function createGeodesicTable(): GeodesicTable {
  return {
    samples: new Float32Array(ROWS * SAMPLES),
    end: new Float64Array(ROWS),
    escape: new Uint8Array(ROWS),
    peak: new Int32Array(ROWS),
    startPsi: new Float64Array(ROWS),
  };
}

const ROWS_PER_CHUNK = 16;

// Integra con RK4 la ecuación de la órbita de la luz, u'' = -u + 1,5·u² (u = rs/r, ψ = ángulo),
// una vez por fila. Cede cada `ROWS_PER_CHUNK` filas para poder trocear el cálculo.
export function* fillGeodesicTable(table: GeodesicTable): Generator<void> {
  const { samples, end, escape, peak } = table;
  const h = DPSI / SUBSTEPS;
  for (let row = 0; row < ROWS; row += 1) {
    const base = row * SAMPLES;
    let u = 0;
    let du = 1 / rowImpact(row);
    let psi = 0;
    let sample = 1;
    let state = -1; // -1 integrando, 0 capturado, 1 escapa
    let peakSample = -1;
    samples[base] = 0;
    for (let step = 1; state < 0; step += 1) {
      const k1 = 1.5 * u * u - u;
      const uMid1 = u + 0.5 * h * du;
      const duMid1 = du + 0.5 * h * k1;
      const k2 = 1.5 * uMid1 * uMid1 - uMid1;
      const uMid2 = u + 0.5 * h * duMid1;
      const duMid2 = du + 0.5 * h * k2;
      const k3 = 1.5 * uMid2 * uMid2 - uMid2;
      const uEnd = u + h * duMid2;
      const nextU = u + (h / 6) * (du + 2 * duMid1 + 2 * duMid2 + (du + h * k3));
      const nextDu = du + (h / 6) * (k1 + 2 * k2 + 2 * k3 + (1.5 * uEnd * uEnd - uEnd));
      if (peakSample < 0 && nextDu < 0) peakSample = sample - 1;
      if (nextU >= 1) {
        // cruza el horizonte (u = 1)
        end[row] = psi + (h * (1 - u)) / Math.max(1e-9, nextU - u);
        state = 0;
      } else if (nextU < 0) {
        // se aleja al infinito (u = 0)
        end[row] = psi + (h * u) / Math.max(1e-12, u - nextU);
        state = 1;
      } else if (psi + h >= PSI_MAX - DPSI) {
        end[row] = psi;
        state = 0;
      }
      u = nextU;
      du = nextDu;
      psi += h;
      if (step % SUBSTEPS === 0 && sample < SAMPLES) {
        samples[base + sample] = state === 1 ? 0 : Math.min(1, u);
        sample += 1;
      }
    }
    const fill = state === 1 ? 0 : 1;
    for (; sample < SAMPLES; sample += 1) samples[base + sample] = fill;
    escape[row] = state;
    peak[row] = peakSample < 0 ? Math.min(SAMPLES - 2, Math.floor(end[row] / DPSI)) : peakSample;
    if (row % ROWS_PER_CHUNK === ROWS_PER_CHUNK - 1) yield;
  }
}

// ψ en que cada rayo alcanza la distancia de la cámara (u = 1/distancia), por bisección entre el
// inicio y el punto más cercano. Solo hay que recalcularlo si cambia la distancia.
export function computeStartPsi(table: GeodesicTable, distance: number): void {
  const { samples, peak, startPsi } = table;
  const target = 1 / distance;
  for (let row = 0; row < ROWS; row += 1) {
    const base = row * SAMPLES;
    let low = 0;
    let high = peak[row];
    if (samples[base + high] < target) {
      startPsi[row] = -1;
      continue;
    }
    while (high - low > 1) {
      const mid = (low + high) >> 1;
      if (samples[base + mid] < target) low = mid;
      else high = mid;
    }
    const uLow = samples[base + low];
    const uHigh = samples[base + high];
    startPsi[row] = (low + (target - uLow) / Math.max(1e-12, uHigh - uLow)) * DPSI;
  }
}
