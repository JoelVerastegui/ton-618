import type { ScaleStopId } from '../interfaces/scale';

// Magnitudes físicas de la escena (km, diámetros). `ton618` es el diámetro del
// horizonte de sucesos: 2 · (2GM/c²) con M = 6,6·10¹⁰ M☉ (2,95325 km por M☉).
// `neptuneOrbit` es el diámetro de la órbita media de Neptuno (2 · 30,05 UA).
export const SCALE_KM = {
  earth: 12742,
  sun: 1392700,
  neptuneOrbit: 8.99e9,
  ton618: 3.898e11,
};

// Radio orbital medio de los 8 planetas (UA), de Mercurio a Neptuno.
export const PLANET_ORBITS_AU: number[] = [0.387, 0.723, 1, 1.524, 5.205, 9.582, 19.2, 30.05];

// Zoom de cada parada = píxeles por km respecto a la parada de la Tierra (earth = 1).
// Con V = diámetro del visor, el elemento protagonista mide en cada parada:
// Tierra 0,6·V · Sol 1,0·V · órbita de Neptuno 0,9·V · horizonte de TON 618 0,22·V
// (la imagen del Hero, con su disco, llena el visor; el Sistema solar queda en ~0,005·V).
export const STOP_ZOOM: Record<ScaleStopId, number> = {
  earth: 1,
  sun: 0.015249,
  'solar-system': 2.126e-6,
  ton618: 1.1985e-8,
};

// --- Derivados para la escena y el zoom ------------------------------------------

// Orden de las paradas en el deslizante (posición `i / 3 × 1000`).
export const STOP_ORDER: ScaleStopId[] = ['earth', 'sun', 'solar-system', 'ton618'];

export const SLIDER_MAX = 1000;
const STOP_SPAN = SLIDER_MAX / (STOP_ORDER.length - 1);

// Duración de la animación entre paradas (mismo valor que `$scaleStopMs`).
export const STOP_ANIMATION_MS = 1200;

// Diámetro de la Tierra en la parada de la Tierra, en diámetros del visor (V).
const EARTH_STOP_SIZE = 0.6;
// Parte de la imagen de TON 618 que ocupa su horizonte (zona oscura central: ≈ 214 de 1024 px,
// medido sobre `ton618-blackhole-1024.webp`). Con ello la imagen completa mide 0,22 / 0,209 ≈ 1,05 V
// en su parada y el horizonte 0,22 V.
const HORIZON_IN_IMAGE = 0.209;

// Diámetro de cada elemento en V por unidad de zoom (`tamaño = zoom · k`). Todos se dibujan
// en una caja de 1 V y se escalan con `scale`; `ton618` es el factor de la imagen entera.
export const LAYER_K = {
  earth: EARTH_STOP_SIZE,
  sun: (EARTH_STOP_SIZE * SCALE_KM.sun) / SCALE_KM.earth,
  orbits: (EARTH_STOP_SIZE * SCALE_KM.neptuneOrbit) / SCALE_KM.earth,
  ton618: (EARTH_STOP_SIZE * SCALE_KM.ton618) / SCALE_KM.earth / HORIZON_IN_IMAGE,
};

// El Sol se ve (opacity > 0) mientras mide entre 0,006 V y 4 V (mismas cotas que el SCSS).
export function sunVisible(zoom: number) {
  const size = zoom * LAYER_K.sun;
  return size > 0.006 && size < 4;
}

// Radio de cada órbita relativo a la de Neptuno (1 = borde de la caja del SVG a 0,5 V).
export const PLANET_ORBIT_RATIOS = PLANET_ORBITS_AU.map(
  (au) => au / PLANET_ORBITS_AU[PLANET_ORBITS_AU.length - 1]
);

// Ángulo de cada planeta sobre su órbita (grados), repartidos para que no se alineen.
export const PLANET_ANGLES_DEG = [35, 150, 265, 330, 80, 200, 300, 120];

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
