import type { ScaleStopId } from '../interfaces/scale';

// Magnitudes físicas de la escena (km). Los valores finales los fija el Paso 2.
export const SCALE_KM = {
  earth: 0,
  sun: 0,
  neptuneOrbit: 0,
  ton618: 0,
};

// Radio orbital medio de los 8 planetas (UA), de Mercurio a Neptuno.
export const PLANET_ORBITS_AU: number[] = [];

// Factor de zoom de cada parada.
export const STOP_ZOOM: Record<ScaleStopId, number> = {
  earth: 1,
  sun: 0,
  'solar-system': 0,
  ton618: 0,
};
