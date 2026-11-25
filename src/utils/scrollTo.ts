import { trackScrollAnimation } from '@/utils/scrollAnimations';

const MIN_DURATION_MS = 1400;
const MAX_DURATION_MS = 4000;
// Velocidad de desplazamiento: ms por px de distancia (más lento que el scroll suave nativo)
const MS_PER_PX = 1.4;

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

let cancelCurrent: (() => void) | null = null;

/**
 * Lleva el elemento al borde superior del viewport con un desplazamiento animado y
 * lento (la duración crece con la distancia). Se cancela si la persona toma el
 * control (rueda, táctil o teclado). Con `prefers-reduced-motion: reduce` es instantáneo.
 */
export function scrollToElement(target: Element) {
  cancelCurrent?.();

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const from = window.scrollY;
  const to = Math.max(0, Math.round(from + target.getBoundingClientRect().top));
  const distance = Math.abs(to - from);

  if (reducedMotion || distance === 0) {
    window.scrollTo({ top: to, behavior: 'auto' });
    return;
  }

  const duration = Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, distance * MS_PER_PX));
  const start = performance.now();
  let frame = 0;

  const stop = () => {
    untrack();
    cancelAnimationFrame(frame);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
    window.removeEventListener('keydown', stop);
    if (cancelCurrent === stop) cancelCurrent = null;
  };

  const step = (now: number) => {
    const progress = Math.min(1, (now - start) / duration);
    window.scrollTo({ top: from + (to - from) * easeInOutCubic(progress), behavior: 'auto' });
    if (progress < 1) frame = requestAnimationFrame(step);
    else stop();
  };

  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', stop);
  cancelCurrent = stop;
  const untrack = trackScrollAnimation(stop);
  frame = requestAnimationFrame(step);
}
