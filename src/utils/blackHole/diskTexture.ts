import { BANDS, EMISSION_LUT_SIZE, R_IN, R_OUT, SPIN, TEX } from './constants';
import { clamp, makeRandom } from './random';

// Color del cuerpo negro (aproximación de Tanner Helland) normalizado al canal mayor.
function blackbody(kelvin: number): [number, number, number] {
  const t = kelvin / 100;
  let red: number;
  let green: number;
  let blue: number;
  if (t <= 66) {
    red = 255;
    green = 99.4708025861 * Math.log(t) - 161.1195681661;
    blue = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    red = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    green = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    blue = 255;
  }
  red = clamp(red, 0, 255);
  green = clamp(green, 0, 255);
  blue = clamp(blue, 0, 255);
  const peak = Math.max(red, green, blue);
  return [red / peak, green / peak, blue / peak];
}

// Octavas del ruido del gas: [nodos por vuelta, peso].
const OCTAVES: ReadonlyArray<readonly [number, number]> = [
  [5, 0.45],
  [13, 0.3],
  [31, 0.22],
  [83, 0.14],
];
const BANDS_PER_CHUNK = 8;

// Intensidad del gas: BANDS × TEX de ruido suave periódico (varias octavas). Cada banda hereda
// el 78 % de la anterior, de modo que el gas forma anillos con estructura continua en radio.
export function* buildDiskTexture(texture: Float32Array): Generator<void> {
  const random = makeRandom(11);
  let gain = 1;
  let drift = 0;
  let previous: Float64Array[] | null = null;
  for (let band = 0; band < BANDS; band += 1) {
    const nodes: Float64Array[] = OCTAVES.map(([count], octave) => {
      const values = new Float64Array(count);
      for (let k = 0; k < count; k += 1) {
        values[k] = previous ? 0.78 * previous[octave][k] + 0.22 * random() : random();
      }
      return values;
    });
    previous = nodes;
    drift = 0.85 * drift + 0.1 * (random() - 0.5);
    gain = clamp(gain + drift, 0.6, 1.3);
    for (let x = 0; x < TEX; x += 1) {
      let sum = 0;
      for (let octave = 0; octave < OCTAVES.length; octave += 1) {
        const [count, weight] = OCTAVES[octave];
        const position = (x / TEX) * count;
        const index = Math.floor(position);
        const fraction = position - index;
        const smooth = fraction * fraction * (3 - 2 * fraction);
        const values = nodes[octave];
        sum +=
          weight * (values[index % count] * (1 - smooth) + values[(index + 1) % count] * smooth);
      }
      texture[band * TEX + x] = Math.max(0.05, 0.5 + 1.7 * (sum - 0.6)) * gain;
    }
    if (band % BANDS_PER_CHUNK === BANDS_PER_CHUNK - 1) yield;
  }
}

// Color de emisión por temperatura (1000…16000 K), con la saturación realzada.
export function buildEmissionLut(red: Float32Array, green: Float32Array, blue: Float32Array): void {
  for (let i = 0; i < EMISSION_LUT_SIZE; i += 1) {
    const [r, g, b] = blackbody(1000 + (i / (EMISSION_LUT_SIZE - 1)) * 15000);
    const luma = 0.3 * r + 0.55 * g + 0.15 * b;
    red[i] = Math.max(0, luma + 1.6 * (r - luma));
    green[i] = Math.max(0, luma + 1.6 * (g - luma));
    blue[i] = Math.max(0, luma + 1.6 * (b - luma));
  }
}

// Velocidad angular kepleriana del gas por banda (rotación diferencial): ω ∝ r^(-3/2).
export function buildBandSpeed(bandSpeed: Float32Array): void {
  for (let band = 0; band <= BANDS; band += 1) {
    const radius = R_IN + (band / BANDS) * (R_OUT - R_IN);
    bandSpeed[band] = Math.sqrt(0.5 / (radius * radius * radius)) * SPIN;
  }
}

// Máximo de la intensidad radial del disco, para normalizar la emisión.
export function computeMaxIntensity(): number {
  let max = 0;
  for (let radius = R_IN; radius < R_OUT; radius += 0.01) {
    max = Math.max(max, Math.pow(Math.pow(radius, -3) * (1 - Math.sqrt(R_IN / radius)), 0.25));
  }
  return max;
}
