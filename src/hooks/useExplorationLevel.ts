import { useCallback, useEffect, useState, type RefObject } from 'react';
import type { ExplorationLevelId } from '@/interfaces/exploration';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { scrollToElement } from '@/utils/scrollTo';

/**
 * Nivel activo (1-4) de la sección Exploración.
 * - Observa 4 sentinelas del track (hijos de `sentinelsRef`, uno por nivel) con una
 *   línea de observación en el centro del viewport (`rootMargin: -50% 0px -50% 0px`).
 * - Escribe `data-level` en la sección y `data-active` / `data-near` en cada capa del
 *   mapa (`[data-level-id]`) directamente en el DOM. Solo el cambio de nivel actualiza
 *   el estado de React (para `aria-current` y la región aria-live).
 * - Con `prefers-reduced-motion: reduce` los niveles son bloques lineales: no observa ni escribe nada.
 * - `goTo(level)` hace scroll a las anclas ocultas (hijos de `anchorsRef`).
 */
export function useExplorationLevel(
  sectionRef: RefObject<HTMLElement | null>,
  sentinelsRef: RefObject<HTMLElement | null>,
  anchorsRef: RefObject<HTMLElement | null>,
  levelIds: readonly ExplorationLevelId[]
) {
  const [level, setLevel] = useState(1);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const sentinels = sentinelsRef.current ? Array.from(sentinelsRef.current.children) : [];
    if (reducedMotion || !section || sentinels.length === 0) return;

    const layers = levelIds.map((id) =>
      section.querySelector<HTMLElement>(`[data-level-id="${id}"]`)
    );

    const writeDom = (index: number) => {
      section.dataset.level = String(index + 1);
      layers.forEach((layer, i) => {
        if (!layer) return;
        layer.dataset.active = String(i === index);
        layer.dataset.near = String(Math.abs(i - index) === 1);
      });
    };

    const visible = sentinels.map(() => false);
    let current = 0;
    writeDom(current);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visible[sentinels.indexOf(entry.target)] = entry.isIntersecting;
        });
        // En el borde entre dos sentinelas ambas pueden cruzar la línea: gana la posterior.
        // Sin ninguna (antes o después del track) se conserva el último nivel.
        const next = visible.lastIndexOf(true);
        if (next < 0 || next === current) return;
        current = next;
        writeDom(current);
        setLevel(current + 1);
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );
    sentinels.forEach((sentinel) => observer.observe(sentinel));

    return () => {
      observer.disconnect();
      delete section.dataset.level;
      layers.forEach((layer) => {
        if (!layer) return;
        delete layer.dataset.active;
        delete layer.dataset.near;
      });
    };
  }, [sectionRef, sentinelsRef, levelIds, reducedMotion]);

  const goTo = useCallback(
    (target: number) => {
      const anchor = anchorsRef.current?.children[target - 1];
      if (anchor) scrollToElement(anchor);
    },
    [anchorsRef]
  );

  return { level, goTo };
}
