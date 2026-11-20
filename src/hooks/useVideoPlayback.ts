import { useEffect, type RefObject } from 'react';

// Margen con el que se empieza a cargar el vídeo antes de que entre en pantalla.
const LOAD_MARGIN = '100% 0px';

/**
 * Carga el vídeo al acercarse (una pantalla antes) y lo reproduce solo mientras está en
 * pantalla. Con `prefers-reduced-motion: reduce` no lo reproduce nunca: se queda el póster.
 * El `<video>` debe llevar `preload='none'`.
 */
export function useVideoPlayback(ref: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let visible = false;

    const loader = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        video.preload = 'auto';
        video.load();
        // `load()` cancela un `play()` pendiente: se reanuda si ya está en pantalla.
        if (visible) video.play().catch(() => {});
        loader.disconnect();
      },
      { rootMargin: LOAD_MARGIN }
    );
    if (!reduced) loader.observe(video);

    const player = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) video.play().catch(() => {});
      else video.pause();
    });
    if (!reduced) player.observe(video);

    return () => {
      loader.disconnect();
      player.disconnect();
    };
  }, [ref]);
}
