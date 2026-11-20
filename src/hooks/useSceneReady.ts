import { useEffect, useState, type RefObject } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * `true` cuando el scroll ha pasado el centinela (la escena está lista para explorar).
 * El centinela es un elemento del track que empieza en la parada «lista» y llega hasta
 * el final; se observa contra la línea superior del viewport (`rootMargin` de -100 % abajo),
 * así que cambia exactamente cuando esa parada cruza el borde superior.
 * `onLost` se llama al volver atrás de la parada (p. ej. para cerrar el punto activo).
 * Con `prefers-reduced-motion: reduce` no hay intro: siempre está lista.
 */
export function useSceneReady(sentinelRef: RefObject<HTMLElement | null>, onLost: () => void) {
  const reducedMotion = useReducedMotion();
  const [observed, setObserved] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (reducedMotion || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const ready = entries[entries.length - 1].isIntersecting;
        setObserved(ready);
        if (!ready) onLost();
      },
      { rootMargin: '0px 0px -100% 0px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef, reducedMotion, onLost]);

  return reducedMotion || observed;
}
