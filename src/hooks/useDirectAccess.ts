import { useLayoutEffect } from 'react';
import { sectionFromPath, sectionPath } from '@/utils/routes';
import { jumpToArrival } from '@/utils/sectionArrival';
import { settleSection } from '@/utils/settleSection';

// Entradas con las que la persona toma el control de la página.
const INPUT_EVENTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const;

// Al abrir o recargar manda la ruta: el navegador no restaura la posición anterior. Va al importar
// el módulo para que valga antes de que termine la carga.
window.history.scrollRestoration = 'manual';

/**
 * Acceso directo: coloca la página en el punto de llegada de la sección de la ruta, sin animación,
 * y completa sus animaciones de entrada. Una ruta desconocida se reemplaza por la de inicio. El
 * Hero no se toca: conserva su entrada de carga.
 */
export function useDirectAccess() {
  // Layout effect: salta antes del primer pintado y antes de que observen las secciones.
  useLayoutEffect(() => {
    const id = sectionFromPath(window.location.pathname);
    if (!id) {
      const url = sectionPath('hero') + window.location.search;
      window.history.replaceState(window.history.state, '', url);
      return;
    }
    if (id === 'hero') return;

    const input = new AbortController();
    let touched = false;
    for (const type of INPUT_EVENTS) {
      window.addEventListener(type, () => (touched = true), {
        passive: true,
        signal: input.signal,
      });
    }

    jumpToArrival(id);
    settleSection(id).then(() => {
      // Se vuelve a medir: fuentes e imágenes pueden haber cambiado las alturas anteriores
      if (!input.signal.aborted && !touched) jumpToArrival(id);
      input.abort();
    });

    return () => input.abort();
  }, []);
}
