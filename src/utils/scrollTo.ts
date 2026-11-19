/**
 * Lleva el elemento al borde superior del viewport con `scrollIntoView`.
 * Es suave salvo con `prefers-reduced-motion: reduce`, que lo hace instantáneo.
 */
export function scrollToElement(target: Element) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
}
