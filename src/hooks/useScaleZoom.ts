import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { ScaleStopId } from '@/interfaces/scale';
import {
  SLIDER_MAX,
  STOP_ANIMATION_MS,
  STOP_ORDER,
  stopIndexAt,
  sunVisible,
  zoomAt,
} from '@/utils/scaleGeometry';

// Tiempo sin escrituras tras el que se considera que el zoom dejó de moverse.
const IDLE_MS = 160;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Convierte el scroll del track de la sección en el zoom 0…1000 y lo vuelca en la variable CSS
 * `--zoom` del visor. El track empieza con una intro (el segundo hijo, `introSpan`, mide su
 * alto): ahí el zoom vale 0 y el progreso 0…1 de la intro va en `--intro` del stage (más
 * `data-intro` del visor); después el zoom recorre 0…1000 hasta que el stage se suelta. La fuente de verdad es el scroll: el
 * deslizante y los botones solo hacen scroll (`scrollToValue`, `animateTo`).
 * El valor continuo no es estado de React: se escribe por `ref` con `requestAnimationFrame`, y
 * con `inputRef` también el `value` del deslizante (no controlado). Solo la parada activa es
 * estado, así que hay un render únicamente al cruzar el umbral entre paradas.
 * El `scroll` solo se escucha mientras el track está en vista; su recorrido se mide en `resize`
 * y al cambiar la visibilidad. Mientras se mueve, el visor lleva `data-moving='true'` (el CSS
 * usa `will-change` solo entonces). El primer hijo del track es el stage sticky.
 */
export function useScaleZoom(
  trackRef: RefObject<HTMLElement | null>,
  viewerRef: RefObject<HTMLElement | null>,
  inputRef: RefObject<HTMLInputElement | null>
) {
  const [activeStop, setActiveStop] = useState<ScaleStopId>(STOP_ORDER[0]);

  const travelRef = useRef(1); // recorrido del zoom en px (sin la intro)
  const introRef = useRef(0); // alto de la intro en px
  const animationRef = useRef<(() => void) | null>(null); // cancela la animación en curso

  // Posición de scroll (px de documento) de un valor del zoom.
  const scrollTop = useCallback(
    (value: number) => {
      const track = trackRef.current;
      if (!track) return window.scrollY;
      const top = track.getBoundingClientRect().top + window.scrollY;
      return Math.round(top + introRef.current + (value / SLIDER_MAX) * travelRef.current);
    },
    [trackRef]
  );

  const cancelAnimation = useCallback(() => animationRef.current?.(), []);

  // Salto instantáneo; cancela cualquier animación en curso.
  const scrollToValue = useCallback(
    (value: number) => {
      cancelAnimation();
      window.scrollTo({ top: scrollTop(value), behavior: 'instant' });
    },
    [cancelAnimation, scrollTop]
  );

  // Scroll animado ease-in-out hasta un valor (instantáneo con reduced-motion). La persona lo
  // cancela al tomar el control (rueda, táctil o teclado).
  const animateTo = useCallback(
    (value: number) => {
      cancelAnimation();
      const from = window.scrollY;
      const to = scrollTop(value);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || from === to) {
        window.scrollTo({ top: to, behavior: 'instant' });
        return;
      }

      const start = performance.now();
      let frame = 0;
      const stop = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('wheel', stop);
        window.removeEventListener('touchstart', stop);
        window.removeEventListener('keydown', stop);
        if (animationRef.current === stop) animationRef.current = null;
      };
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / STOP_ANIMATION_MS);
        window.scrollTo({ top: from + (to - from) * easeInOut(t), behavior: 'instant' });
        if (t < 1) frame = requestAnimationFrame(step);
        else stop();
      };

      window.addEventListener('wheel', stop, { passive: true });
      window.addEventListener('touchstart', stop, { passive: true });
      window.addEventListener('keydown', stop);
      animationRef.current = stop;
      frame = requestAnimationFrame(step);
    },
    [cancelAnimation, scrollTop]
  );

  useEffect(() => {
    const track = trackRef.current;
    const stage = track?.firstElementChild as HTMLElement | null | undefined;
    if (!track || !stage) return;

    let frame = 0;
    let idle = 0;
    let listening = false;
    let last = NaN; // último valor del zoom escrito
    let lastIntro = NaN; // último progreso de la intro escrito

    const measure = () => {
      const intro = (stage.nextElementSibling as HTMLElement | null)?.offsetHeight ?? 0;
      introRef.current = intro;
      travelRef.current = Math.max(1, track.offsetHeight - stage.offsetHeight - intro);
    };

    const render = () => {
      frame = 0;
      const scrolled = -track.getBoundingClientRect().top;
      const intro = introRef.current > 0 ? clamp01(scrolled / introRef.current) : 1;
      const value = clamp01((scrolled - introRef.current) / travelRef.current) * SLIDER_MAX;
      if (value === last && intro === lastIntro) return;

      const viewer = viewerRef.current;
      if (intro !== lastIntro) {
        lastIntro = intro;
        stage.style.setProperty('--intro', String(+intro.toFixed(4)));
        if (viewer) viewer.dataset.intro = String(intro < 1);
      }
      if (value === last) {
        markMoving();
        return;
      }
      last = value;

      setActiveStop(STOP_ORDER[stopIndexAt(value)]); // mismo valor: React no renderiza
      const input = inputRef.current;
      // Tolera < 1 de diferencia: al arrastrar, el scroll redondea y no debe mover el pulgar
      if (input && Math.abs(Number(input.value) - value) >= 1) {
        input.value = String(Math.round(value));
      }

      if (!viewer) return;
      const zoom = zoomAt(value);
      viewer.style.setProperty('--zoom', String(zoom));
      // Capa del Sol visible o no (su vídeo solo se reproduce si lo es); sin estado de React
      viewer.dataset.sun = String(sunVisible(zoom));
      markMoving();
    };

    // Marca el visor en movimiento (CSS: `will-change`) hasta que pasa `IDLE_MS` sin escrituras.
    const markMoving = () => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      viewer.dataset.moving = 'true';
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        viewer.dataset.moving = 'false';
      }, IDLE_MS);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onResize = () => {
      measure();
      last = NaN;
      schedule();
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries[entries.length - 1].isIntersecting;
      measure();
      schedule(); // también al salir: deja el valor final exacto (0 o 1000)
      if (visible && !listening) {
        window.addEventListener('scroll', schedule, { passive: true });
        listening = true;
      } else if (!visible && listening) {
        window.removeEventListener('scroll', schedule);
        listening = false;
      }
    });

    measure();
    render(); // valor inicial (la página puede cargarse ya desplazada)
    window.addEventListener('resize', onResize, { passive: true });
    observer.observe(track);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frame);
      window.clearTimeout(idle);
      cancelAnimation();
    };
  }, [trackRef, viewerRef, inputRef, cancelAnimation]);

  return { scrollToValue, animateTo, activeStop };
}
