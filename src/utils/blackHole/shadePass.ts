import type { BlackHoleAssets, TracePass } from '../../interfaces/blackHole';
import {
  BANDS,
  BG_H,
  BG_W,
  MAX_HITS,
  STAR_U,
  TAU,
  TEX,
  TONE_LUT_SIZE,
  TONE_RANGE,
} from './constants';
import { starHash } from './sky';

// Tone mapping: 1 - e^(-1,1·x) con gamma 1/1,5, de 0…TONE_RANGE a 0…255.
export function buildToneLut(): Uint8Array {
  const lut = new Uint8Array(TONE_LUT_SIZE);
  for (let i = 0; i < TONE_LUT_SIZE; i += 1) {
    const x = (i / (TONE_LUT_SIZE - 1)) * TONE_RANGE;
    lut[i] = Math.round(255 * Math.pow(1 - Math.exp(1.1 * -x), 1 / 1.5));
  }
  return lut;
}

type Shader = (pass: TracePass, pixels: Uint32Array, azimuth: number, gasTime: number) => void;

// Pasada de sombreado: por píxel compone los cruces con el disco (gas animado por rotación
// diferencial), después el cielo y las estrellas lensadas, y escribe el color con tone mapping.
export function createShader(assets: BlackHoleAssets): Shader {
  const { diskTexture, sky, bandSpeed, toneLut } = assets;
  const bandPhase = new Float64Array(BANDS + 1);
  const toneScale = (TONE_LUT_SIZE - 1) / TONE_RANGE;
  const toneMax = TONE_LUT_SIZE - 1;
  const texMask = TEX - 1;
  const skyMaskU = BG_W - 1;
  const starScale = STAR_U / BG_W;

  return (pass, pixels, azimuth, gasTime) => {
    const { width, height, hits, band, angle, red, green, blue, alpha, skyU, skyV } = pass;
    // El azimut gira la textura; el gas avanza con su velocidad angular. El desplazamiento grande
    // mantiene los índices positivos para truncar con `| 0`.
    const azimuthTex = (azimuth / TAU) * TEX;
    for (let b = 0; b < BANDS; b += 1) {
      bandPhase[b] = azimuthTex + bandSpeed[b] * gasTime * (TEX / TAU) + 4 * TEX * 1e3;
    }
    const skyOffset = (azimuth / TAU) * BG_W + 1e3 * BG_W;
    // Lado de un píxel en la rejilla de estrellas (área = starArea) para el brillo del lente.
    const pixelStar = pass.span / (TAU / STAR_U);
    const starArea = pixelStar * pixelStar;

    for (let row = 0; row < height; row += 1) {
      const rowStride = row < height - 1 ? width : -width;
      const rowSign = row < height - 1 ? 1 : -1;
      for (let col = 0; col < width; col += 1) {
        const px = row * width + col;
        let r = 0;
        let g = 0;
        let b = 0;
        let transmit = 1;
        const count = hits[px];
        for (let hit = 0; hit < count; hit += 1) {
          const slot = px * MAX_HITS + hit;
          const bandPos = band[slot];
          const bandIndex = 0 | bandPos;
          const bandFrac = bandPos - bandIndex;
          const texA = angle[slot] + bandPhase[bandIndex];
          const texB = angle[slot] + bandPhase[bandIndex + 1];
          const idxA = 0 | texA;
          const idxB = 0 | texB;
          const fracA = texA - idxA;
          const fracB = texB - idxB;
          const baseA = bandIndex * TEX;
          const baseB = baseA + TEX;
          // Interpolación bilineal entre dos bandas contiguas y dos texels.
          const gasA =
            diskTexture[baseA + (idxA & texMask)] * (1 - fracA) +
            diskTexture[baseA + ((idxA + 1) & texMask)] * fracA;
          const gas =
            gasA +
            (diskTexture[baseB + (idxB & texMask)] * (1 - fracB) +
              diskTexture[baseB + ((idxB + 1) & texMask)] * fracB -
              gasA) *
              bandFrac;
          r += transmit * red[slot] * gas;
          g += transmit * green[slot] * gas;
          b += transmit * blue[slot] * gas;
          const opacity = alpha[slot] * (gas > 0.6 ? 1 : 0.55 + 0.75 * gas);
          transmit *= 1 - (opacity > 0.985 ? 0.985 : opacity);
        }

        const v = skyV[px];
        if (v >= 0 && transmit > 0.02) {
          const u = skyU[px] + skyOffset;
          const u0 = 0 | u;
          const v0 = 0 | v;
          const fu = u - u0;
          const fv = v - v0;
          const x0 = u0 & skyMaskU;
          const x1 = (u0 + 1) & skyMaskU;
          const y0 = v0 * BG_W;
          const y1 = Math.min(BG_H - 1, v0 + 1) * BG_W;
          const c00 = sky[y0 + x0];
          const c10 = sky[y0 + x1];
          const c01 = sky[y1 + x0];
          const c11 = sky[y1 + x1];
          const w00 = (1 - fu) * (1 - fv);
          const w10 = fu * (1 - fv);
          const w01 = (1 - fu) * fv;
          const w11 = fu * fv;
          const sky0 = transmit * (1 / 255) * 0.42;
          r +=
            sky0 * ((255 & c00) * w00 + (255 & c10) * w10 + (255 & c01) * w01 + (255 & c11) * w11);
          g +=
            sky0 *
            (((c00 >> 8) & 255) * w00 +
              ((c10 >> 8) & 255) * w10 +
              ((c01 >> 8) & 255) * w01 +
              ((c11 >> 8) & 255) * w11);
          b +=
            sky0 *
            (((c00 >> 16) & 255) * w00 +
              ((c10 >> 16) & 255) * w10 +
              ((c01 >> 16) & 255) * w01 +
              ((c11 >> 16) & 255) * w11);

          // Estrellas lensadas: la rejilla del cielo se deforma con la lente; el jacobiano de
          // los vecinos da el estiramiento y, con él, el brillo de cada estrella.
          const nx = col < width - 1 ? px + 1 : px - 1;
          const colSign = col < width - 1 ? 1 : -1;
          const ny = px + rowStride;
          if (skyV[nx] >= 0 && skyV[ny] >= 0) {
            let dux = (skyU[nx] - skyU[px]) * colSign;
            let duy = (skyU[ny] - skyU[px]) * rowSign;
            if (dux > BG_W / 2) dux -= BG_W;
            else if (dux < -BG_W / 2) dux += BG_W;
            if (duy > BG_W / 2) duy -= BG_W;
            else if (duy < -BG_W / 2) duy += BG_W;
            dux *= starScale;
            duy *= starScale;
            const dvx = (skyV[nx] - v) * colSign * starScale;
            const dvy = (skyV[ny] - v) * rowSign * starScale;
            const det = dux * dvy - duy * dvx;
            const starU = u * starScale;
            const starV = v * starScale;
            const cellU = 0 | starU;
            const cellV = 0 | starV;
            const hash = starHash(cellU & (STAR_U - 1), cellV);
            if ((1023 & hash) < 20 && det !== 0) {
              const offU = cellU + 0.25 + ((hash >>> 10) & 63) / 126 - starU;
              const offV = cellV + 0.25 + ((hash >>> 16) & 63) / 126 - starV;
              const sx = (dvy * offU - duy * offV) / det;
              const sy = (dux * offV - dvx * offU) / det;
              const dist2 = sx * sx + sy * sy;
              if (dist2 < 6) {
                const code = (hash >>> 22) & 255;
                const base = 0.08 + 4 * Math.pow(code / 255, 7);
                const stretch = Math.min(8, starArea / Math.abs(det));
                const glow = transmit * base * Math.sqrt(stretch) * Math.exp(1.6 * -dist2);
                const tint = 3 & code;
                r += glow * (tint === 0 ? 0.75 : 1);
                g += 0.93 * glow;
                b += glow * (tint === 3 ? 0.7 : 1);
              }
            }
          }
        }

        const rt = r * toneScale;
        const gt = g * toneScale;
        const bt = b * toneScale;
        pixels[px] =
          4278190080 |
          (toneLut[bt < toneMax ? 0 | bt : toneMax] << 16) |
          (toneLut[gt < toneMax ? 0 | gt : toneMax] << 8) |
          toneLut[rt < toneMax ? 0 | rt : toneMax];
      }
    }
  };
}
