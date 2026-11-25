import type { SectionId } from '@/interfaces/navigation';

// Posición de scroll del punto de llegada de una sección (su `[data-arrival]`), medida en el DOM y
// limitada al recorrido de la página. `null` si la sección aún no está en el DOM.
export const arrivalTop = (id: SectionId): number | null => {
  const marker = document.querySelector(`[data-arrival='${id}']`);
  if (!marker) return null;

  // Hacia arriba: con posiciones fraccionarias, quedarse corto dejaría la intro sin terminar.
  const top = Math.ceil(window.scrollY + marker.getBoundingClientRect().top);
  const { scrollHeight, clientHeight } = document.documentElement;
  return Math.max(0, Math.min(top, scrollHeight - clientHeight));
};

// Salto instantáneo al punto de llegada. `false` si la sección aún no está en el DOM.
export const jumpToArrival = (id: SectionId): boolean => {
  const top = arrivalTop(id);
  if (top === null) return false;

  window.scrollTo({ top, behavior: 'instant' });
  return true;
};
