import { dots, scatterDisk, seeded } from '@/utils/geometry';

// Capas de estrellas del cielo de la intro de Escala: puntos en un viewBox de 0-1000 (el
// visor), deterministas (misma semilla, mismo cielo). Cada capa es un único <path> de puntos;
// el CSS les da el grosor, el brillo y la velocidad con la que se abren (más cerca, más rápido).
export const SKY_LAYERS = [
  { id: 'far', count: 70, seed: 618 },
  { id: 'mid', count: 44, seed: 1337 },
  { id: 'near', count: 26, seed: 4242 },
].map(({ id, count, seed }) => ({
  id,
  path: dots(scatterDisk(count, 500, seeded(seed))),
}));
