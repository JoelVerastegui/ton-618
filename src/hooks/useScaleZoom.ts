import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { ScaleStopId } from '@/interfaces/scale';
import {
  STOP_ANIMATION_MS,
  STOP_ORDER,
  stopIndexAt,
  sunVisible,
  zoomAt,
} from '@/utils/scaleGeometry';

// Tiempo sin escrituras tras el que se considera que el zoom dejó de moverse.
const IDLE_MS = 160;

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Convierte la posición del deslizante (0…1000) en la variable CSS `--zoom` del visor.
 * El valor continuo no es estado de React: se escribe por `ref` con `requestAnimationFrame`.
 * Solo la parada activa es estado, así que hay un render únicamente al cruzar el umbral.
 * Con `inputRef` escribe también el `value` del deslizante (no controlado).
 * Mientras se mueve, el visor lleva `data-moving='true'` (el CSS usa `will-change` solo entonces).
 */
export function useScaleZoom(
  targetRef: RefObject<HTMLElement | null>,
  inputRef?: RefObject<HTMLInputElement | null>
) {
  const [activeStop, setActiveStop] = useState<ScaleStopId>(STOP_ORDER[0]);

  const valueRef = useRef(0);
  const frameRef = useRef(0); // rAF de escritura
  const animationRef = useRef(0); // rAF de la animación entre paradas
  const idleRef = useRef(0);

  const write = useCallback(() => {
    frameRef.current = 0;
    const el = targetRef.current;
    if (!el) return;
    const zoom = zoomAt(valueRef.current);
    el.style.setProperty('--zoom', String(zoom));
    // Capa del Sol visible o no (su vídeo solo se reproduce si lo es); sin estado de React
    el.dataset.sun = String(sunVisible(zoom));
    el.dataset.moving = 'true';
    window.clearTimeout(idleRef.current);
    idleRef.current = window.setTimeout(() => {
      el.dataset.moving = 'false';
    }, IDLE_MS);
  }, [targetRef]);

  const apply = useCallback(
    (value: number) => {
      valueRef.current = value;
      // Deslizante no controlado: se sincroniza por ref (animaciones de los botones)
      if (inputRef?.current) inputRef.current.value = String(Math.round(value));
      setActiveStop(STOP_ORDER[stopIndexAt(value)]); // mismo valor: React no renderiza
      if (!frameRef.current) frameRef.current = requestAnimationFrame(write);
    },
    [write, inputRef]
  );

  const cancelAnimation = useCallback(() => {
    cancelAnimationFrame(animationRef.current);
    animationRef.current = 0;
  }, []);

  // Salto a una posición; cancela cualquier animación en curso.
  const setValue = useCallback(
    (value: number) => {
      cancelAnimation();
      apply(value);
    },
    [apply, cancelAnimation]
  );

  // Animación ease-in-out hasta una posición (instantánea con reduced-motion).
  const animateTo = useCallback(
    (target: number) => {
      cancelAnimation();
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        apply(target);
        return;
      }
      const from = valueRef.current;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / STOP_ANIMATION_MS);
        apply(from + (target - from) * easeInOut(t));
        animationRef.current = t < 1 ? requestAnimationFrame(step) : 0;
      };
      animationRef.current = requestAnimationFrame(step);
    },
    [apply, cancelAnimation]
  );

  useEffect(() => {
    write(); // valor inicial
    return () => {
      cancelAnimation();
      cancelAnimationFrame(frameRef.current);
      window.clearTimeout(idleRef.current);
    };
  }, [write, cancelAnimation]);

  return { setValue, animateTo, activeStop };
}
