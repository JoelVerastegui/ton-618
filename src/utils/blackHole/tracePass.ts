import type { BlackHoleAssets, TracePass } from '../../interfaces/blackHole';
import {
  BANDS,
  BG_H,
  BG_W,
  DEG,
  DPSI,
  EMISSION_LUT_SIZE,
  MAX_HITS,
  R_IN,
  R_OUT,
  ROWS,
  SAMPLES,
  SIDE_ROWS,
  TAU,
  TEX,
} from './constants';
import { impactRow } from './geodesicTable';
import { clamp } from './random';

export function createTracePass(): TracePass {
  return {
    width: 0,
    height: 0,
    fine: false,
    hits: new Uint8Array(0),
    band: new Float32Array(0),
    angle: new Float32Array(0),
    red: new Float32Array(0),
    green: new Float32Array(0),
    blue: new Float32Array(0),
    alpha: new Float32Array(0),
    skyU: new Float32Array(0),
    skyV: new Float32Array(0),
    row: 0,
    span: 1,
    version: 0,
  };
}

// Prepara la pasada para `width × height` píxeles. Solo reasigna si no cabe en los arrays actuales.
export function resizeTracePass(pass: TracePass, width: number, height: number): void {
  const pixels = width * height;
  if (pass.hits.length < pixels) {
    pass.hits = new Uint8Array(pixels);
    pass.band = new Float32Array(pixels * MAX_HITS);
    pass.angle = new Float32Array(pixels * MAX_HITS);
    pass.red = new Float32Array(pixels * MAX_HITS);
    pass.green = new Float32Array(pixels * MAX_HITS);
    pass.blue = new Float32Array(pixels * MAX_HITS);
    pass.alpha = new Float32Array(pixels * MAX_HITS);
    pass.skyU = new Float32Array(pixels);
    pass.skyV = new Float32Array(pixels);
  }
  pass.width = width;
  pass.height = height;
  pass.row = 0;
}

type Tracer = (
  pass: TracePass,
  tilt: number,
  distance: number,
  rowStart: number,
  rowEnd: number
) => void;

// Pasada geométrica: por píxel construye el rayo desde la cámara, lo sitúa en la tabla de
// geodésicas (interpolando entre dos filas vecinas) y calcula sus cruces con el disco y, si
// escapa, por dónde sale al cielo. Todo con escalares: sin asignaciones por píxel.
export function createTracer(assets: BlackHoleAssets): Tracer {
  const { samples, end, escape, startPsi } = assets.table;
  const { emissionRed, emissionGreen, emissionBlue, maxIntensity } = assets;
  let slope = 0; // du/dψ de la última consulta (segunda salida de `lookup`)

  // u(ψ) de una fila a `delta` del punto de la cámara, hacia delante o hacia atrás en ψ.
  // Devuelve -1 si el rayo no llega tan lejos.
  const lookup = (row: number, delta: number, forward: boolean): number => {
    const start = startPsi[row];
    let psi: number;
    if (forward) {
      psi = start + delta;
      if (psi >= end[row]) return -1;
    } else {
      psi = start - delta;
      if (psi <= 0) return -1;
    }
    const position = psi / DPSI;
    const index = position | 0;
    const fraction = position - index;
    const at = row * SAMPLES + index;
    const u0 = samples[at];
    const u1 = samples[at + 1];
    slope = ((u1 - u0) / DPSI) * (forward ? 1 : -1);
    return u0 + (u1 - u0) * fraction;
  };

  return (pass, tilt, distance, rowStart, rowEnd) => {
    const { width, height } = pass;
    const cosTilt = Math.cos(tilt);
    const sinTilt = Math.sin(tilt);
    // La cámara está en (cos, sin, 0)·distancia, mira al origen; el disco es el plano y = 0.
    const forwardX = -cosTilt;
    const forwardY = -sinTilt;
    const upX = -sinTilt;
    const upY = cosTilt;
    // Ángulo por píxel: campo de visión que se estrecha al alejarse (zoom aparente).
    const span =
      (2 * (Math.tan(24 * DEG) * Math.pow(26 / distance, 0.85))) / Math.min(width, 1.25 * height);
    const redshift = Math.sqrt(1 - 1 / distance);
    const invRedshift = 1 / redshift;
    const texPerRad = TEX / TAU;
    pass.span = span;

    for (let row = rowStart; row < rowEnd; row += 1) {
      const yOffset = (height / 2 - row - 0.5) * span;
      for (let col = 0; col < width; col += 1) {
        const px = row * width + col;
        const xOffset = (col + 0.5 - width / 2) * span;
        let dirX = forwardX + upX * yOffset;
        let dirY = forwardY + upY * yOffset;
        let dirZ = -xOffset;
        const invLength = 1 / Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
        dirX *= invLength;
        dirY *= invLength;
        dirZ *= invLength;
        // Plano del rayo: coseno y seno del ángulo con la dirección radial, y el eje
        // perpendicular a ella dentro de ese plano.
        const cosRay = -(dirX * cosTilt + dirY * sinTilt);
        const sinRay = Math.sqrt(Math.max(1e-12, 1 - cosRay * cosRay));
        const perpX = (dirX + cosRay * cosTilt) / sinRay;
        const perpY = (dirY + cosRay * sinTilt) / sinRay;
        const perpZ = dirZ / sinRay;
        // Fila de la tabla según el parámetro de impacto, interpolando con la vecina.
        const rowPosition = impactRow((distance * sinRay) / redshift);
        let rowLow = rowPosition | 0;
        let blend = rowPosition - rowLow;
        let rowHigh = Math.min(ROWS - 1, rowLow + 1);
        if (rowLow === SIDE_ROWS - 1) {
          // a ambos lados de B_CRIT no se interpola (un rayo cae y el otro escapa)
          rowHigh = blend < 0.5 ? rowLow : rowHigh;
          rowLow = rowHigh;
          blend = 0;
        }
        if (startPsi[rowLow] < 0 || startPsi[rowHigh] < 0) {
          rowHigh = rowLow = startPsi[rowLow] < 0 ? rowHigh : rowLow;
          blend = 0;
        }
        const forward = cosRay >= 0;
        // ψ del primer cruce del plano del disco, y los siguientes cada π.
        let psi0 = Math.atan2(-sinTilt, perpY);
        if (psi0 <= 1e-6) psi0 += Math.PI;
        if (psi0 <= 1e-6) psi0 += Math.PI;

        let count = 0;
        for (let hit = 0; hit < MAX_HITS; hit += 1) {
          const delta = psi0 + hit * Math.PI;
          let u = lookup(rowLow, delta, forward);
          let du = slope;
          if (blend > 0) {
            const uHigh = lookup(rowHigh, delta, forward);
            if (u >= 0 && uHigh >= 0) {
              u += (uHigh - u) * blend;
              du += (slope - du) * blend;
            } else if (blend > 0.5) {
              u = uHigh;
              du = slope;
            }
          }
          if (u < 0) break;
          const radius = 1 / u;
          if (radius < R_IN || radius > R_OUT) continue;
          const cosPsi = Math.cos(delta);
          const sinPsi = Math.sin(delta);
          // Posición del cruce (x, z) y velocidad del rayo (dr/dψ = -u'/u²), normalizada.
          const posX = radius * (cosPsi * cosTilt + sinPsi * perpX);
          const posZ = radius * (sinPsi * perpZ);
          const dr = -du / (u * u);
          let velX =
            dr * (cosPsi * cosTilt + sinPsi * perpX) +
            radius * (-sinPsi * cosTilt + cosPsi * perpX);
          const velY =
            dr * (cosPsi * sinTilt + sinPsi * perpY) +
            radius * (-sinPsi * sinTilt + cosPsi * perpY);
          let velZ = dr * (sinPsi * perpZ) + radius * (cosPsi * perpZ);
          const invVel = 1 / Math.sqrt(velX * velX + velY * velY + velZ * velZ);
          velX *= invVel;
          velZ *= invVel;
          // Doppler + corrimiento gravitacional: el gas orbita a v = √(1/2(r-1)).
          const tangentX = posZ / radius;
          const tangentZ = -posX / radius;
          const orbital = Math.sqrt(0.5 / (radius - 1));
          const boost =
            (1 /
              ((1 / Math.sqrt(1 - orbital * orbital)) *
                (1 - orbital * -(tangentX * velX + tangentZ * velZ)))) *
            Math.sqrt(1 - 1 / radius) *
            invRedshift;
          const intensity =
            (Math.pow(Math.pow(radius, -3) * (1 - Math.sqrt(R_IN / radius)), 0.25) / maxIntensity) *
            boost;
          const color =
            0 | (clamp((5200 * intensity - 1e3) / 15e3, 0, 1) * (EMISSION_LUT_SIZE - 1));
          const edge = clamp((R_OUT - radius) / 6, 0, 1) * clamp((radius - R_IN) / 0.25, 0, 1);
          const brightness = 3.6 * Math.pow(intensity, 2.7) * edge;
          const slot = px * MAX_HITS + count;
          pass.band[slot] = ((radius - R_IN) / (R_OUT - R_IN)) * (BANDS - 2);
          let texAngle = Math.atan2(posZ, posX) * texPerRad;
          if (texAngle < 0) texAngle += TEX;
          pass.angle[slot] = texAngle;
          pass.red[slot] = emissionRed[color] * brightness;
          pass.green[slot] = emissionGreen[color] * brightness;
          pass.blue[slot] = emissionBlue[color] * brightness;
          pass.alpha[slot] = (0.8 + 0.18 * clamp((R_OUT - 3 - radius) / 6, 0, 1)) * edge;
          count += 1;
        }
        pass.hits[px] = count;

        // El rayo cae al horizonte: no hay cielo detrás.
        if (!(blend > 0.5 ? escape[rowHigh] : escape[rowLow]) && forward) {
          pass.skyV[px] = -1;
          continue;
        }
        // ψ de salida (al infinito si va hacia delante; al origen del rayo si va hacia atrás).
        let exitPsi: number;
        if (forward) {
          const lowPsi = end[rowLow] - startPsi[rowLow];
          const highPsi = end[rowHigh] - startPsi[rowHigh];
          exitPsi =
            escape[rowLow] && escape[rowHigh]
              ? lowPsi + (highPsi - lowPsi) * blend
              : blend > 0.5
                ? highPsi
                : lowPsi;
        } else {
          exitPsi = startPsi[rowLow] + (startPsi[rowHigh] - startPsi[rowLow]) * blend;
        }
        const cosExit = Math.cos(exitPsi);
        const sinExit = Math.sin(exitPsi);
        const outX = cosExit * cosTilt + sinExit * perpX;
        const outY = cosExit * sinTilt + sinExit * perpY;
        const outZ = sinExit * perpZ;
        // Dirección de salida → coordenadas (u, v) del cielo equirrectangular.
        let longitude = Math.atan2(outZ, outX) / TAU;
        if (longitude < 0) longitude += 1;
        pass.skyU[px] = longitude * BG_W;
        pass.skyV[px] = (Math.acos(clamp(outY, -1, 1)) / Math.PI) * (BG_H - 1);
      }
    }
  };
}
