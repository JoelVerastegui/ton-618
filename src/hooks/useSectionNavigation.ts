import { useCallback, useState } from 'react';
import type { NavigationDirection, SectionId } from '@/interfaces/navigation';
import { blockInput } from '@/utils/blockInput';
import { isNavigating, setNavigating } from '@/utils/navigationState';
import { sectionPath } from '@/utils/routes';
import { cancelScrollAnimations } from '@/utils/scrollAnimations';
import { arrivalTop, jumpToArrival } from '@/utils/sectionArrival';
import { neighborhood, requestSection } from '@/utils/sectionLoader';
import { settleSection } from '@/utils/settleSection';

// Tope de espera del destino: pasado, se muestra como esté.
const TIMEOUT_MS = 8000;
// Un destino a esta distancia o menos ya está en pantalla.
const SAME_PLACE_PX = 2;

const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

// Escribe la ruta, si cambia, sin añadir entradas al historial.
const writeUrl = (url: string) => {
  if (window.location.pathname + window.location.search === url) return;
  window.history.replaceState(window.history.state, '', url);
};

// Carga el destino y sus vecinas, salta y lo deja listo. Solo se rechaza si falla el destino.
const arrive = async (id: SectionId, url: string, expired: AbortSignal) => {
  const neighbors = Promise.allSettled(neighborhood(id).map(requestSection));
  await requestSection(id);
  await neighbors;
  if (expired.aborted) return;

  jumpToArrival(id);
  writeUrl(url);
  await settleSection(id);
};

/**
 * Navegación a una sección: carga el destino y sus vecinas, salta sin animación a su punto de
 * llegada, escribe su ruta, sin añadir entradas al historial, y espera a que esté listo (tope de
 * 8 s). Mientras dura no admite otra navegación ni entradas de la persona. Si el destino no se puede
 * descargar, carga la página completa en su ruta.
 * `direction` dice dónde queda el destino mientras hay una navegación en curso (`null` si no).
 */
export function useSectionNavigation() {
  const [direction, setDirection] = useState<NavigationDirection | null>(null);

  const navigate = useCallback(async (id: SectionId) => {
    // Con la sección sin cargar, mide su marcador de posición: basta para saber hacia dónde queda
    const top = arrivalTop(id);
    if (isNavigating() || top === null) return;

    const distance = top - window.scrollY;
    if (Math.abs(distance) <= SAME_PLACE_PX) return;

    setNavigating(true);
    setDirection(distance > 0 ? 'down' : 'up');
    cancelScrollAnimations();
    const unblockInput = blockInput();
    const url = sectionPath(id) + window.location.search;
    const expired = new AbortController();

    try {
      await Promise.race([arrive(id, url, expired.signal), delay(TIMEOUT_MS)]);
    } catch {
      // La página sigue bloqueada hasta que se recarga
      window.location.replace(url);
      return;
    }
    expired.abort();

    // De nuevo: las animaciones de entrada pueden cambiar la medida (o se agotó la espera)
    jumpToArrival(id);
    writeUrl(url); // solo falta si se agotó la espera antes del salto

    unblockInput();
    setNavigating(false);
    setDirection(null);
  }, []);

  return { direction, navigate };
}
