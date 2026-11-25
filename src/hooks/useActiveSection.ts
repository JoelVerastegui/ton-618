import { useEffect, useState, useSyncExternalStore } from 'react';
import navigationJson from '@/data/navigation.json';
import type { NavigationData, SectionId } from '@/interfaces/navigation';
import { sectionFromPath, sectionPath } from '@/utils/routes';
import { getSectionsVersion, subscribeSections } from '@/utils/sectionLoader';

const { links } = navigationJson as NavigationData;

// Región observada: desde muy por encima del viewport hasta su centro. Un punto de llegada la
// intersecta mientras está por encima del centro, así que el aviso llega justo al cruzarlo.
const ABOVE_CENTER = '1000000px 0px -50% 0px';

/**
 * Sección activa: la última, en orden de página, cuyo `[data-arrival]` ha quedado por encima del
 * centro del viewport (sin ninguna, el Hero). Al cambiar, escribe su ruta con `replaceState`, sin
 * añadir entradas al historial. Sin listeners de scroll; solo hay render cuando cambia.
 */
export function useActiveSection(): SectionId {
  const [active, setActive] = useState<SectionId>('hero');
  // Al cargarse una sección su punto de llegada es un elemento nuevo: se vuelve a observar
  const version = useSyncExternalStore(subscribeSections, getSectionsVersion);

  useEffect(() => {
    // Sección que dice la URL (`null` si la ruta es desconocida)
    let current = sectionFromPath(window.location.pathname);

    // Cada observador recibe de una vez el estado de todos los marcadores
    const above = new Set<string | null>();

    const observer = new IntersectionObserver(
      (entries) => {
        // Aviso con marcadores ya sustituidos: decide el observador siguiente, con los nuevos
        if (entries.some(({ target }) => !target.isConnected)) return;

        for (const { target, isIntersecting } of entries) {
          const id = target.getAttribute('data-arrival');
          if (isIntersecting) above.add(id);
          else above.delete(id);
        }

        const next = links.findLast((link) => above.has(link.id))?.id ?? 'hero';
        setActive(next);
        if (next === current) return;

        current = next;
        const url = sectionPath(next) + window.location.search;
        window.history.replaceState(window.history.state, '', url);
      },
      { rootMargin: ABOVE_CENTER }
    );

    document.querySelectorAll('[data-arrival]').forEach((marker) => observer.observe(marker));
    return () => observer.disconnect();
  }, [version]);

  return active;
}
