import type { ScaleStopId } from '../interfaces/scale';

// Magnitudes físicas de la escena (km, diámetros). `ton618` es el diámetro del
// horizonte de sucesos: 2 · (2GM/c²) con M = 6,6·10¹⁰ M☉ (2,95325 km por M☉).
export const SCALE_KM = {
  earth: 12742,
  sun: 1392700,
  ton618: 3.898e11,
};

// Diámetro ecuatorial de los planetas (km). Fuente: NASA/NSSDC, Planetary Fact Sheet.
const PLANET_KM = {
  mercury: 4879,
  venus: 12104,
  earth: 12742,
  mars: 6779,
  jupiter: 139820,
  saturn: 116460,
  uranus: 50724,
  neptune: 49244,
};

export type PlanetId = keyof typeof PLANET_KM;

// Parte del lado de cada sprite que ocupa el cuerpo del planeta (medida sobre los .webp; el
// resto es margen y, en Saturno, los anillos).
const PLANET_FILL: Record<PlanetId, number> = {
  mercury: 0.968,
  venus: 0.967,
  earth: 0.956,
  mars: 0.97,
  jupiter: 0.969,
  saturn: 0.57,
  uranus: 0.949,
  neptune: 0.949,
};

// Parte del lado del vídeo del Sol que ocupa su disco (medida sobre el póster).
const SUN_DISC = 0.94;

// Fila de planetas junto al Sol. Las unidades son el lado de la caja del Sol (el vídeo), así que
// la fila escala con él. Los tamaños son reales; las distancias no: separación fija y legible.
// El orden es el de distancia al Sol, alternando lados: a cada lado hay un planeta pequeño, otro
// pequeño, un gigante y un gigante de hielo, y la distancia crece hacia fuera.
const PLANET_ORDER: PlanetId[] = [
  'mercury',
  'venus',
  'earth',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
];
// Hueco entre el borde del disco solar y el primer planeta, y separación entre planetas contiguos
// (suficiente para los anillos de Saturno).
const FIRST_GAP = 0.14;
const SLOT_GAP = 0.2;

export const SYSTEM_PLANETS = PLANET_ORDER.map((id, i) => ({
  id,
  // Lado del sprite
  size: (PLANET_KM[id] / SCALE_KM.sun) * (SUN_DISC / PLANET_FILL[id]),
  // Centro en x (+ derecha, − izquierda); los pares a la derecha, los impares a la izquierda
  x: (i % 2 === 0 ? 1 : -1) * (SUN_DISC / 2 + FIRST_GAP + Math.floor(i / 2) * SLOT_GAP),
}));

// Mitad de la fila en cajas del Sol: del centro al borde exterior del último planeta.
const SYSTEM_HALF_ROW = Math.max(...SYSTEM_PLANETS.map((p) => Math.abs(p.x) + p.size / 2));

// --- Derivados para la escena y el zoom ------------------------------------------

// Orden de las paradas en el deslizante (posición `i / 3 × 1000`).
export const STOP_ORDER: ScaleStopId[] = ['earth', 'sun', 'solar-system', 'ton618'];

export const SLIDER_MAX = 1000;
const STOP_SPAN = SLIDER_MAX / (STOP_ORDER.length - 1);

// Duración de la animación entre paradas.
export const STOP_ANIMATION_MS = 1200;

// Tamaños en cada parada, en diámetros del visor (V).
const EARTH_STOP_SIZE = 0.6; // diámetro de la Tierra
const SUN_STOP_SIZE = 1; // disco del Sol
const SYSTEM_ROW_SIZE = 0.88; // fila de planetas completa (deja un margen en el visor circular)
const TON_STOP_SIZE = 0.22; // horizonte de TON 618
// Parte de la imagen de TON 618 que ocupa su horizonte (zona oscura central: ≈ 214 de 1024 px,
// medido sobre `ton618-blackhole-1024.webp`). Con ello la imagen completa mide 0,22 / 0,209 ≈ 1,05 V
// en su parada y el horizonte 0,22 V.
const HORIZON_IN_IMAGE = 0.209;

// Diámetro de cada elemento en V por unidad de zoom (`tamaño = zoom · k`). Todos se dibujan
// en una caja de 1 V y se escalan con `scale`; `sun` es el de la caja del vídeo (con su disco
// a escala real) y `ton618` el de la imagen entera.
export const LAYER_K = {
  earth: EARTH_STOP_SIZE,
  sun: (EARTH_STOP_SIZE * SCALE_KM.sun) / SCALE_KM.earth / SUN_DISC,
  ton618: (EARTH_STOP_SIZE * SCALE_KM.ton618) / SCALE_KM.earth / HORIZON_IN_IMAGE,
};

// Zoom de cada parada = píxeles por km respecto a la parada de la Tierra (earth = 1).
// Tierra 0,6·V · Sol 1,0·V · Sistema solar: fila de planetas de 0,88·V (el Sol, ≈ 0,34·V) ·
// horizonte de TON 618 0,22·V (la imagen del Hero, con su disco, llena el visor).
export const STOP_ZOOM: Record<ScaleStopId, number> = {
  earth: 1,
  sun: SUN_STOP_SIZE / SUN_DISC / LAYER_K.sun,
  'solar-system': SYSTEM_ROW_SIZE / (2 * SYSTEM_HALF_ROW) / LAYER_K.sun,
  ton618: (TON_STOP_SIZE * SCALE_KM.earth) / (EARTH_STOP_SIZE * SCALE_KM.ton618),
};

// El Sol (y su fila de planetas) se ve (opacity > 0) mientras su caja mide entre 0,003 V y 4 V
// (mismas cotas que el SCSS).
export function sunVisible(zoom: number) {
  const size = zoom * LAYER_K.sun;
  return size > 0.003 && size < 4;
}

// Parada más cercana a la posición del deslizante (0…1000).
export function stopIndexAt(value: number) {
  return Math.min(STOP_ORDER.length - 1, Math.max(0, Math.round(value / STOP_SPAN)));
}

// Zoom de una posición del deslizante: lineal en el logaritmo entre paradas contiguas.
export function zoomAt(value: number) {
  const clamped = Math.min(SLIDER_MAX, Math.max(0, value));
  const index = Math.min(STOP_ORDER.length - 2, Math.floor(clamped / STOP_SPAN));
  const t = clamped / STOP_SPAN - index;
  const from = Math.log(STOP_ZOOM[STOP_ORDER[index]]);
  const to = Math.log(STOP_ZOOM[STOP_ORDER[index + 1]]);
  return Math.exp(from + (to - from) * t);
}

// Posición del deslizante de una parada.
export function stopValue(id: ScaleStopId) {
  return STOP_ORDER.indexOf(id) * STOP_SPAN;
}
