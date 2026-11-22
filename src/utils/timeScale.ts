import type { TimeMilestoneId } from '../interfaces/time';

// Posición de cada hito en la línea (0 = salida de la luz, 1 = llegada): anclas calibradas a
// mano, monótonas en el orden cronológico (compresión suave, SPEC 05). Valores provisionales,
// se fijan en el Paso 9. Las fechas verificadas de cada hito están en `time.json` y en el spec.
export const MILESTONE_POS: Record<TimeMilestoneId, number> = {
  sun: 0.22,
  earth: 0.4,
  life: 0.55,
  dinosaurs: 0.78,
  humans: 0.92,
};

// Carril de cada etiqueta (presentación): lado de la línea y altura (`near` pegada a la línea,
// `far` más lejos). Los extremos y los hitos vecinos se reparten para que no se solapen.
export type TimeLabelId = TimeMilestoneId | 'departure' | 'arrival';

export const LABEL_LANE: Record<TimeLabelId, { side: 'up' | 'down'; lane: 'near' | 'far' }> = {
  departure: { side: 'down', lane: 'far' },
  sun: { side: 'up', lane: 'near' },
  earth: { side: 'down', lane: 'near' },
  life: { side: 'up', lane: 'far' },
  dinosaurs: { side: 'down', lane: 'far' },
  humans: { side: 'up', lane: 'near' },
  arrival: { side: 'up', lane: 'far' },
};
