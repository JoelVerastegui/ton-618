import type { BlackHoleAssets, PrepareStats } from '../../interfaces/blackHole';
import { BANDS, EMISSION_LUT_SIZE, TEX } from './constants';
import {
  buildBandSpeed,
  buildDiskTexture,
  buildEmissionLut,
  computeMaxIntensity,
} from './diskTexture';
import { createGeodesicTable, fillGeodesicTable } from './geodesicTable';
import { buildToneLut } from './shadePass';
import { buildSky } from './sky';

// Cálculo inicial: tabla de geodésicas, textura del disco, cielo y LUTs. Es un generador que cede
// entre trozos pequeños para poder repartirlo entre fotogramas (o ejecutarlo de golpe).
function* buildAssetSteps(): Generator<void, BlackHoleAssets> {
  const table = createGeodesicTable();
  yield* fillGeodesicTable(table);

  const diskTexture = new Float32Array(BANDS * TEX);
  yield* buildDiskTexture(diskTexture);

  const sky = { pixels: new Uint32Array(0) };
  yield* buildSky(sky);

  const emissionRed = new Float32Array(EMISSION_LUT_SIZE);
  const emissionGreen = new Float32Array(EMISSION_LUT_SIZE);
  const emissionBlue = new Float32Array(EMISSION_LUT_SIZE);
  buildEmissionLut(emissionRed, emissionGreen, emissionBlue);
  const bandSpeed = new Float32Array(BANDS + 1);
  buildBandSpeed(bandSpeed);

  return {
    table,
    diskTexture,
    sky: sky.pixels,
    emissionRed,
    emissionGreen,
    emissionBlue,
    bandSpeed,
    maxIntensity: computeMaxIntensity(),
    toneLut: buildToneLut(),
  };
}

// Versión síncrona: bloquea el hilo hasta terminar (útil en pruebas y medidas).
export function buildBlackHoleAssets(): BlackHoleAssets {
  const steps = buildAssetSteps();
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
  }
}

const yieldToMain = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

// Versión diferida: trabaja en trozos de `budgetMs` y cede el hilo entre ellos. Devuelve `null` si
// `signal` se aborta antes de terminar.
export async function prepareBlackHoleAssets(
  signal?: AbortSignal,
  budgetMs = 12
): Promise<{ assets: BlackHoleAssets; stats: PrepareStats } | null> {
  const startedAt = performance.now();
  const steps = buildAssetSteps();
  let workMs = 0;
  let longestChunkMs = 0;
  for (;;) {
    if (signal?.aborted) return null;
    const chunkStart = performance.now();
    let result = steps.next();
    while (!result.done && performance.now() - chunkStart < budgetMs) result = steps.next();
    const chunkMs = performance.now() - chunkStart;
    workMs += chunkMs;
    longestChunkMs = Math.max(longestChunkMs, chunkMs);
    if (result.done) {
      return {
        assets: result.value,
        stats: { totalMs: performance.now() - startedAt, workMs, longestChunkMs },
      };
    }
    await yieldToMain();
  }
}
