import { useEffect, type RefObject } from 'react';

// Margen con el que se empieza a cargar el vídeo antes de que entre en pantalla.
const LOAD_MARGIN = '100% 0px';

/**
 * Carga el vídeo al acercarse (una pantalla antes) y lo reproduce solo mientras está en
 * pantalla. Con `prefers-reduced-motion: reduce` no lo reproduce nunca: se queda el póster.
 * Con `gateRef` y `gateAttr`, además exige que `data-<gateAttr>` de ese elemento valga
 * `'true'` (p. ej. capa visible según el zoom); se observa con `MutationObserver`, sin
 * renders de React.
 * Con `blockAttr`, además se pausa mientras `data-<blockAttr>` de ese mismo elemento valga
 * `'true'` (p. ej. el escenario ya está oculto); al dejar de valerlo se reanuda.
 * El `<video>` debe llevar `preload='none'`.
 */
export function useVideoPlayback(
  ref: RefObject<HTMLVideoElement | null>,
  gateRef?: RefObject<HTMLElement | null>,
  gateAttr?: string,
  blockAttr?: string
) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const gate = gateRef?.current;
    const gateName = gateAttr ? `data-${gateAttr}` : '';
    const blockName = blockAttr ? `data-${blockAttr}` : '';
    const gateOpen = () =>
      !gate ||
      ((!gateName || gate.getAttribute(gateName) === 'true') &&
        (!blockName || gate.getAttribute(blockName) !== 'true'));

    let visible = false; // en pantalla
    const sync = () => {
      if (visible && gateOpen()) video.play().catch(() => {});
      else video.pause();
    };

    const loader = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        video.preload = 'auto';
        video.load();
        // `load()` cancela un `play()` pendiente: se reanuda si ya está en pantalla.
        sync();
        loader.disconnect();
      },
      { rootMargin: LOAD_MARGIN }
    );
    if (!reduced) loader.observe(video);

    const player = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      sync();
    });
    if (!reduced) player.observe(video);

    const gateObserver = new MutationObserver(sync);
    const watched = [gateName, blockName].filter(Boolean);
    if (!reduced && gate && watched.length) {
      gateObserver.observe(gate, { attributes: true, attributeFilter: watched });
    }

    return () => {
      loader.disconnect();
      player.disconnect();
      gateObserver.disconnect();
    };
  }, [ref, gateRef, gateAttr, blockAttr]);
}
