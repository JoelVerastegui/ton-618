import { useCallback, useEffect, useRef, type RefObject } from 'react';
import type { BlackHoleEngine, BlackHoleOptions, PrepareStats } from '../interfaces/blackHole';
import { loadBlackHoleAssets } from '../utils/blackHole/assets';
import {
  ORBIT_STEP,
  TILT_STEP,
  ZOOM_IN_FACTOR,
  ZOOM_OUT_FACTOR,
} from '../utils/blackHole/constants';
import { createBlackHole } from '../utils/blackHole/createBlackHole';
import { useReducedMotion } from './useReducedMotion';

// Fotograma más largo que se simula (el bucle se alarga, no salta, en pestañas lentas).
const MAX_DT = 1 / 30;
const ORBIT_PER_PIXEL = 0.006;
const TILT_PER_PIXEL = 0.005;
const WHEEL_ZOOM = 0.0012;

interface UseBlackHoleOptions extends Omit<BlackHoleOptions, 'reducedMotion' | 'distance'> {
  // Empieza el cálculo inicial y monta el motor cuando es `true` (preparación diferida).
  enabled?: boolean;
  // Distancia inicial del motor; luego se controla con `engineRef.current.distance`.
  initialDistance?: number;
  // El motor está listo (tras el cálculo inicial y el montaje).
  onReady?: (engine: BlackHoleEngine, stats: PrepareStats) => void;
  // La distancia cambió por la entrada del usuario sobre el canvas (teclas, rueda).
  onDistanceChange?: (distance: number) => void;
}

interface UseBlackHoleResult {
  engineRef: RefObject<BlackHoleEngine | null>;
  // Detiene o reanuda el bucle (p. ej. con la escena oculta) además de la pausa por visibilidad.
  setPaused: (paused: boolean) => void;
}

/**
 * Liga un `<canvas>` con el motor del agujero negro: bucle de animación, tamaño y DPR, pausa fuera
 * de vista o con la pestaña oculta, puntero y teclado. El estado vive en refs: ningún render de
 * React por fotograma ni por interacción. `destroy()` quita todo; es compatible con StrictMode.
 */
export function useBlackHole(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  options: UseBlackHoleOptions = {}
): UseBlackHoleResult {
  const { enabled = true, maxDpr = 1.25, captureWheel = false, preview = false } = options;
  const reducedMotion = useReducedMotion();
  const autoDrift = options.autoDrift ?? true;
  const engineRef = useRef<BlackHoleEngine | null>(null);
  const pausedRef = useRef(false);
  const kickRef = useRef<() => void>(() => {});

  // Las opciones que cambian sin reiniciar el motor se leen desde un ref.
  const latest = useRef({ ...options, reducedMotion });
  useEffect(() => {
    latest.current = { ...options, reducedMotion };
  });

  useEffect(() => {
    const engine = engineRef.current;
    if (engine) engine.reducedMotion = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    const engine = engineRef.current;
    if (engine) engine.autoDrift = autoDrift;
  }, [autoDrift]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!enabled || !canvas) return;

    let cancelled = false;
    let teardown: (() => void) | null = null;

    loadBlackHoleAssets()
      .then(({ assets, stats }) => {
        if (cancelled) return;
        const settings = latest.current;
        const engine = createBlackHole(canvas, assets, {
          preview,
          distance: settings.initialDistance,
          autoDrift: settings.autoDrift,
          reducedMotion: settings.reducedMotion,
        });
        engineRef.current = engine;

        let frameId: number | null = null;
        let lastTime: number | null = null;
        let inView = true;
        let stopped = false;
        const cleanups: Array<() => void> = [];

        const halt = () => {
          if (frameId !== null) cancelAnimationFrame(frameId);
          frameId = null;
          lastTime = null; // el siguiente fotograma no acumula el tiempo parado
        };
        const stop = () => {
          if (stopped) return;
          stopped = true;
          halt();
          cleanups.forEach((cleanup) => cleanup());
          engine.destroy();
          if (engineRef.current === engine) engineRef.current = null;
          kickRef.current = () => {};
        };
        const schedule = () => {
          if (stopped || pausedRef.current || !inView || document.hidden || frameId !== null)
            return;
          frameId = requestAnimationFrame(tick);
        };
        function tick(time: number) {
          frameId = null;
          if (stopped) return;
          const dt = lastTime === null ? 1 / 60 : Math.min((time - lastTime) / 1000, MAX_DT);
          lastTime = time;
          try {
            engine.frame(dt);
          } catch (error) {
            stop();
            if (!settings.onError) throw error;
            settings.onError(error);
            return;
          }
          schedule();
        }
        const listen = (
          target: HTMLElement | Document,
          type: string,
          handler: (event: never) => void,
          opts?: AddEventListenerOptions
        ) => {
          target.addEventListener(type, handler as EventListener, opts);
          cleanups.push(() => target.removeEventListener(type, handler as EventListener, opts));
        };

        // --- Tamaño y DPR ---
        const measure = () => {
          const rect = canvas.getBoundingClientRect();
          const width = Math.max(1, Math.round(rect.width));
          const height = Math.max(1, Math.round(rect.height));
          const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
          engine.resize(width, height, dpr);
        };
        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(canvas);
        cleanups.push(() => resizeObserver.disconnect());
        measure();

        // --- Pausa por visibilidad ---
        const intersection = new IntersectionObserver(([entry]) => {
          inView = entry.isIntersecting;
          if (inView) schedule();
          else halt();
        });
        intersection.observe(canvas);
        cleanups.push(() => intersection.disconnect());
        listen(document, 'visibilitychange', () => (document.hidden ? halt() : schedule()));
        kickRef.current = () => (pausedRef.current ? halt() : schedule());

        // --- Entrada de usuario (no en miniatura) ---
        if (!preview) {
          let dragX = 0;
          let dragY = 0;
          // Punteros activos (para el pellizco): con dos dedos se hace zoom y no se orbita.
          const pointers = new Map<number, { x: number; y: number }>();
          let pinchDistance = 0;
          const zoomBy = (factor: number) => {
            engine.distance *= factor;
            latest.current.onDistanceChange?.(engine.distance);
          };
          const measurePinch = () => {
            const [a, b] = [...pointers.values()];
            return Math.hypot(a.x - b.x, a.y - b.y);
          };
          listen(canvas, 'pointerdown', (event: PointerEvent) => {
            pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
            dragX = event.clientX;
            dragY = event.clientY;
            if (pointers.size === 2) pinchDistance = measurePinch();
            canvas.setPointerCapture?.(event.pointerId);
          });
          listen(canvas, 'pointermove', (event: PointerEvent) => {
            const pointer = pointers.get(event.pointerId);
            if (!pointer) return;
            pointer.x = event.clientX;
            pointer.y = event.clientY;
            if (pointers.size >= 2) {
              // Pellizco: separar los dedos acerca (la distancia baja) y juntarlos aleja
              const distance = measurePinch();
              if (pinchDistance > 0 && distance > 0) zoomBy(pinchDistance / distance);
              pinchDistance = distance;
              return;
            }
            // Horizontal gira (acimut). Vertical inclina con ratón o lápiz; con el dedo el gesto
            // vertical es scroll de página (`touch-action: pan-y`) y se inclina con el joystick.
            const tilt =
              event.pointerType === 'touch' ? 0 : TILT_PER_PIXEL * (event.clientY - dragY);
            engine.orbitBy(-ORBIT_PER_PIXEL * (event.clientX - dragX), tilt);
            dragX = event.clientX;
            dragY = event.clientY;
          });
          const endDrag = (event: PointerEvent) => {
            pointers.delete(event.pointerId);
            // Al quedar un dedo, el arrastre sigue desde donde está
            const [rest] = [...pointers.values()];
            if (rest) {
              dragX = rest.x;
              dragY = rest.y;
            }
          };
          listen(canvas, 'pointerup', endDrag);
          listen(canvas, 'pointercancel', endDrag);
          listen(canvas, 'contextmenu', (event: Event) => event.preventDefault());
          listen(canvas, 'keydown', (event: KeyboardEvent) => {
            let handled = true;
            if (event.key === 'ArrowLeft') engine.orbitBy(-ORBIT_STEP, 0);
            else if (event.key === 'ArrowRight') engine.orbitBy(ORBIT_STEP, 0);
            else if (event.key === 'ArrowUp') engine.orbitBy(0, TILT_STEP);
            else if (event.key === 'ArrowDown') engine.orbitBy(0, -TILT_STEP);
            else if (event.key === '+' || event.key === '=') zoomBy(ZOOM_IN_FACTOR);
            else if (event.key === '-') zoomBy(ZOOM_OUT_FACTOR);
            else handled = false;
            if (handled) {
              event.preventDefault();
              event.stopPropagation();
            }
          });
          if (captureWheel) {
            listen(
              canvas,
              'wheel',
              (event: WheelEvent) => {
                event.preventDefault();
                zoomBy(Math.exp(WHEEL_ZOOM * event.deltaY));
              },
              { passive: false }
            );
          }
        }

        teardown = stop;
        settings.onReady?.(engine, stats);
        schedule();
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const { onError } = latest.current;
        if (onError) onError(error);
        else throw error;
      });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, [enabled, canvasRef, maxDpr, captureWheel, preview]);

  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
    kickRef.current();
  }, []);

  return { engineRef, setPaused };
}
