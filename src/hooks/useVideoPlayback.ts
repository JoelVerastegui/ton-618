import { useEffect, type RefObject } from 'react';

/**
 * Reproduce el vídeo solo mientras está en pantalla y lo pausa fuera de vista.
 * Con `prefers-reduced-motion: reduce` no lo reproduce nunca: se queda el póster.
 */
export function useVideoPlayback(ref: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    });

    observer.observe(video);
    return () => observer.disconnect();
  }, [ref]);
}
