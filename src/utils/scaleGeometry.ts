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
