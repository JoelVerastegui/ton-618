import { useEffect, type RefObject } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Escribe `data-faded='true'` en `targetRef` mientras el scroll haya pasado el centinela: un
 * elemento que empieza justo al final del track (cuando el fundido final termina y el stage
 * queda oculto) y sigue hacia abajo. Se observa contra el viewport, sin estado de React ni
 * listeners de scroll. Con `prefers-reduced-motion: reduce` no hay fundido: nunca se escribe.
 * `onChange` (opcional, debe ser estable) recibe también cada cambio, p. ej. para pausar un bucle.
 */
export function useSectionFaded(
  targetRef: RefObject<HTMLElement | null>,
  sentinelRef: RefObject<HTMLElement | null>,
  onChange?: (faded: boolean) => void
) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const target = targetRef.current;
    const sentinel = sentinelRef.current;
    if (reducedMotion || !target || !sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      const faded = entries[entries.length - 1].isIntersecting;
      target.setAttribute('data-faded', String(faded));
      onChange?.(faded);
    });

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
      target.removeAttribute('data-faded');
      onChange?.(false);
    };
  }, [targetRef, sentinelRef, reducedMotion, onChange]);
}
