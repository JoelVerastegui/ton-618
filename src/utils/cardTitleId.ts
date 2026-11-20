import type { SciencePointId } from '@/interfaces/science';

/** Id del título de la tarjeta de un punto de Ciencia (`aria-labelledby` y destino del foco). */
export const cardTitleId = (id: SciencePointId) => `scienceCard-${id}`;
