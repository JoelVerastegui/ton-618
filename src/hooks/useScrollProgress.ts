import { useEffect, type RefObject } from 'react';

/**
 * Fallback de la transición por scroll para navegadores sin
 * `animation-timeline`. Escribe `--progress` (0–1, sobre el primer alto de
 * viewport de scroll) en el elemento indicado. Si el navegador soporta
 * animaciones guiadas por scroll, no hace nada: la transición la resuelve CSS.
 */
export function useScrollProgress(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element || CSS.supports('animation-timeline', 'scroll()')) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      const progress = Math.max(0, Math.min(1, window.scrollY / window.innerHeight));
      element.style.setProperty('--progress', progress.toFixed(4));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      cancelAnimationFrame(frame);
      element.style.removeProperty('--progress');
    };
  }, [ref]);
}
