import { useCallback, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { SectionId, Transition } from '@/interfaces/navigation';
import { blockInput } from '@/utils/blockInput';
import { isNavigating, setNavigating } from '@/utils/navigationState';
import { sectionPath } from '@/utils/routes';
import { cancelScrollAnimations } from '@/utils/scrollAnimations';
import { arrivalTop, jumpToArrival } from '@/utils/sectionArrival';
import { neighborhood, requestSection } from '@/utils/sectionLoader';
import { settleSection } from '@/utils/settleSection';

// Tope de espera del destino: pasado, se muestra como esté.
const TIMEOUT_MS = 8000;
// Tiempo mínimo con la pantalla cubierta. Inicio y Exploración son escenas pesadas: en móvil
// necesitan más para estar dibujadas antes de descubrirse.
const MIN_COVER_MS = 300;
const HEAVY_COVER_MS = 600;
const HEAVY_SECTIONS: SectionId[] = ['hero', 'exploration'];
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
 * Navegación a una sección: cubre la pantalla con la transición, carga el destino y sus vecinas,
 * salta sin animación a su punto de llegada, escribe su ruta, sin añadir entradas al historial,
 * espera a que esté listo (tope de 8 s) y descubre la pantalla. Mientras dura no admite otra
 * navegación ni entradas de la persona. Con movimiento reducido no hay transición. Si el destino no
 * se puede descargar, carga la página completa en su ruta.
 * `transition` es lo que debe mostrar `Hyperspace` (`null`: nada), que avisa con `endPhase` al
 * terminar cada fase.
 */
export function useSectionNavigation() {
  const [transition, setTransition] = useState<Transition | null>(null);
  const phaseEnd = useRef<() => void>(undefined);
  const reducedMotion = useReducedMotion();

  const endPhase = useCallback(() => phaseEnd.current?.(), []);

  const navigate = useCallback(
    async (id: SectionId) => {
      // Con la sección sin cargar, mide su marcador de posición: basta para saber hacia dónde queda
      const top = arrivalTop(id);
      if (isNavigating() || top === null) return;

      const distance = top - window.scrollY;
      if (Math.abs(distance) <= SAME_PLACE_PX) return;

      const direction = distance > 0 ? 'down' : 'up';
      // Muestra una fase de la transición y se resuelve cuando termina
      const play = (phase: Transition['phase']) => {
        if (reducedMotion) return Promise.resolve();
        return new Promise<void>((resolve) => {
          phaseEnd.current = resolve;
          setTransition({ direction, phase });
        });
      };

      setNavigating(true);
      cancelScrollAnimations();
      const unblockInput = blockInput();
      const url = sectionPath(id) + window.location.search;
      const expired = new AbortController();

      // Nada se mueve hasta que la pantalla está cubierta
      await play('in');
      const coverMs = HEAVY_SECTIONS.includes(id) ? HEAVY_COVER_MS : MIN_COVER_MS;
      const minCover = delay(reducedMotion ? 0 : coverMs);

      try {
        await Promise.race([arrive(id, url, expired.signal), delay(TIMEOUT_MS)]);
      } catch {
        // La página sigue cubierta y bloqueada hasta que se recarga
        window.location.replace(url);
        return;
      }
      expired.abort();

      // De nuevo: las animaciones de entrada pueden cambiar la medida (o se agotó la espera)
      jumpToArrival(id);
      writeUrl(url); // solo falta si se agotó la espera antes del salto

      await minCover;
      await play('out');

      setTransition(null);
      unblockInput();
      setNavigating(false);
    },
    [reducedMotion]
  );

  return { transition, endPhase, navigate };
}
