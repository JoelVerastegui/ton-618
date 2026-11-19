import { useEffect, type RefObject } from 'react';

/**
 * Fallback del scroll de la sección Exploración para navegadores sin
 * `animation-timeline: view()`. Escribe en la sección, sin estado de React:
 * - `--progress`: 0–1 sobre el recorrido del sticky (de que el stage se pega
 *   hasta que se libera).
 * - `--enterProgress`: 0–1 mientras el stage entra (de -100 a 0 svh de
 *   recorrido); vale 1 durante todo el sticky.
 * Si el navegador soporta el timeline nativo, no hace nada ni registra listeners.
 * El `scroll` solo se escucha mientras el track está en vista; top y alturas se
 * cachean en `resize` y al cambiar la visibilidad, así que el handler solo lee
 * `window.scrollY`.
 */
export function useTrackProgress(
  sectionRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const stage = track?.firstElementChild as HTMLElement | null | undefined;
    if (!section || !track || !stage || CSS.supports('animation-timeline', 'view()')) return;

    let top = 0; // posición del track en el documento
    let stageHeight = 1; // 100svh
    let travel = 1; // recorrido del sticky en px
    let frame = 0;
    let listening = false;

    const measure = () => {
      top = track.getBoundingClientRect().top + window.scrollY;
      stageHeight = stage.offsetHeight || 1;
      travel = Math.max(1, track.offsetHeight - stageHeight);
    };

    const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

    const update = () => {
      frame = 0;
      const offset = window.scrollY - top;
      section.style.setProperty('--progress', clamp01(offset / travel).toFixed(4));
      section.style.setProperty(
        '--enterProgress',
        clamp01((offset + stageHeight) / stageHeight).toFixed(4)
      );
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const onResize = () => {
      measure();
      schedule();
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries[entries.length - 1].isIntersecting;
      measure();
      schedule(); // también al salir: deja los valores finales exactos
      if (visible && !listening) {
        window.addEventListener('scroll', schedule, { passive: true });
        listening = true;
      } else if (!visible && listening) {
        window.removeEventListener('scroll', schedule);
        listening = false;
      }
    });

    measure();
    update();
    window.addEventListener('resize', onResize, { passive: true });
    observer.observe(track);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
      section.style.removeProperty('--progress');
      section.style.removeProperty('--enterProgress');
    };
  }, [sectionRef, trackRef]);
}
