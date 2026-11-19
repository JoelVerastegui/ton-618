import { useEffect, type RefObject } from 'react';

// Constante de tiempo del suavizado exponencial (ms)
const TAU_MS = 180;
// Umbral por debajo del cual el bucle se considera asentado
const SETTLE_EPSILON = 0.001;
// Evita saltos bruscos tras una pausa larga (p. ej. cambio de pestaña)
const MAX_DT_MS = 64;

const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/**
 * Parallax con mouse. Escribe `--px` y `--py` (valores suavizados en [-1, 1])
 * en el elemento indicado; las capas los consumen desde CSS. No usa estado de
 * React y el bucle de rAF se detiene en cuanto los valores se asientan.
 *
 * Solo se activa con puntero preciso (mouse) y sin `prefers-reduced-motion`,
 * y reacciona en vivo a los cambios de ambas condiciones.
 */
export function useParallaxPointer(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const finePointer = window.matchMedia(FINE_POINTER_QUERY);
    const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

    let detach: (() => void) | null = null;

    const attach = () => {
      let targetX = 0;
      let targetY = 0;
      let currentX = 0;
      let currentY = 0;
      let frame = 0;
      let lastTime = 0;

      const write = () => {
        element.style.setProperty('--px', currentX.toFixed(4));
        element.style.setProperty('--py', currentY.toFixed(4));
      };

      const tick = (now: number) => {
        const dt = Math.min(now - lastTime, MAX_DT_MS);
        lastTime = now;

        const k = 1 - Math.exp(-dt / TAU_MS);
        currentX += (targetX - currentX) * k;
        currentY += (targetY - currentY) * k;

        if (
          Math.abs(targetX - currentX) < SETTLE_EPSILON &&
          Math.abs(targetY - currentY) < SETTLE_EPSILON
        ) {
          currentX = targetX;
          currentY = targetY;
          write();
          frame = 0;
          return;
        }

        write();
        frame = requestAnimationFrame(tick);
      };

      const schedule = () => {
        if (frame) return;
        lastTime = performance.now();
        frame = requestAnimationFrame(tick);
      };

      const onPointerMove = (event: PointerEvent) => {
        // clientWidth excluye la barra de scroll, así que el extremo derecho sí llega a 1
        const { clientWidth, clientHeight } = document.documentElement;
        targetX = clamp((event.clientX / clientWidth) * 2 - 1);
        targetY = clamp((event.clientY / clientHeight) * 2 - 1);
        schedule();
      };

      const onPointerLeave = () => {
        targetX = 0;
        targetY = 0;
        schedule();
      };

      element.addEventListener('pointermove', onPointerMove, { passive: true });
      element.addEventListener('pointerleave', onPointerLeave, { passive: true });

      return () => {
        element.removeEventListener('pointermove', onPointerMove);
        element.removeEventListener('pointerleave', onPointerLeave);
        cancelAnimationFrame(frame);
        element.style.removeProperty('--px');
        element.style.removeProperty('--py');
      };
    };

    const sync = () => {
      const shouldRun = finePointer.matches && !reducedMotion.matches;

      if (shouldRun && !detach) {
        detach = attach();
      } else if (!shouldRun && detach) {
        detach();
        detach = null;
      }
    };

    finePointer.addEventListener('change', sync);
    reducedMotion.addEventListener('change', sync);
    sync();

    return () => {
      finePointer.removeEventListener('change', sync);
      reducedMotion.removeEventListener('change', sync);
      detach?.();
      detach = null;
    };
  }, [ref]);
}
