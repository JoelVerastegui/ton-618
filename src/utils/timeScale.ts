import type { TimeMilestoneId } from '../interfaces/time';

// Tiempo de viaje de la luz de TON 618 hasta nosotros, en millones de años (verificado, SPEC 05:
// z = 2,219, ΛCDM plano con H₀ = 67,4 y Ωm = 0,315 → 10 844 Ma ≈ 10 800).
export const TRAVEL_MA = 10800;

// Antigüedad de cada hito, en millones de años (verificado, SPEC 05). Sirve de referencia del
// orden cronológico; la posición visual sale de `MILESTONE_POS`, no de estas cifras.
export const MILESTONE_AGO_MA: Record<TimeMilestoneId, number> = {
  sun: 4600,
  earth: 4540,
  life: 3500,
  dinosaurs: 230,
  humans: 0.3,
};

// Posición de cada hito en la línea (0 = salida de la luz, 1 = llegada): anclas calibradas a
// mano, monótonas en el orden cronológico (compresión suave, SPEC 05). Valores provisionales,
// se fijan en el Paso 9.
export const MILESTONE_POS: Record<TimeMilestoneId, number> = {
  sun: 0.3,
  earth: 0.4,
  life: 0.55,
  dinosaurs: 0.78,
  humans: 0.92,
};

// Separación mínima entre marcadores consecutivos (fracción de la línea) para que las etiquetas
// no se solapen; la comprueba `hasMinGap`.
export const MIN_GAP = 0.08;

// Orden cronológico de los hitos (de más antiguo a más reciente).
export const MILESTONE_ORDER: TimeMilestoneId[] = ['sun', 'earth', 'life', 'dinosaurs', 'humans'];

// Verdadero si las posiciones están en orden y separadas al menos `MIN_GAP`.
export function hasMinGap(pos: Record<TimeMilestoneId, number> = MILESTONE_POS): boolean {
  return MILESTONE_ORDER.every(
    (id, i) => i === 0 || pos[id] - pos[MILESTONE_ORDER[i - 1]] >= MIN_GAP
  );
}
