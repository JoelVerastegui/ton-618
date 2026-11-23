import { useEffect, useRef, type KeyboardEvent, type PointerEvent } from 'react';
import styles from '@/components/ui/Joystick/Joystick.module.scss';

// Fracción del recorrido del pulgar por debajo de la cual no se mueve nada (zona muerta).
const DEAD_ZONE = 0.12;
// Fotograma más largo que se simula en la repetición (s).
const MAX_DT = 1 / 30;

interface JoystickProps {
  label: string; // nombre accesible
  // Cada fotograma mientras el pulgar está desplazado: `x` e `y` en -1…1 (derecha y arriba son
  // positivos, ya sin zona muerta) y la duración del fotograma en segundos.
  onMove: (x: number, y: number, dt: number) => void;
  // Teclado: un paso por flecha (`dx`, `dy` valen -1, 0 o 1).
  onStep: (dx: number, dy: number) => void;
}

/**
 * Joystick táctil: se arrastra el pulgar desde el centro y, mientras esté desplazado, llama a
 * `onMove` cada fotograma con la dirección y la intensidad. Al soltar vuelve al centro. Sin estado
 * de React: el pulgar se mueve escribiendo `transform` en el DOM. Con teclado se enfoca y las
 * flechas dan un paso. La posición y la visibilidad las pone quien lo usa (envolviéndolo).
 */
export function Joystick({ label, onMove, onStep }: JoystickProps) {
  const actions = useRef({ onMove, onStep });
  useEffect(() => {
    actions.current = { onMove, onStep };
  });
  const baseRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const pointerId = useRef<number | null>(null);
  const vector = useRef({ x: 0, y: 0 });
  const frame = useRef(0);

  const stop = () => {
    cancelAnimationFrame(frame.current);
    pointerId.current = null;
    vector.current = { x: 0, y: 0 };
    if (thumbRef.current) thumbRef.current.style.transform = 'translate(0px, 0px)';
  };
  useEffect(() => stop, []);

  // Coloca el pulgar bajo el dedo, limitado al borde de la base, y guarda el vector -1…1.
  const track = (event: PointerEvent<HTMLDivElement>) => {
    const base = baseRef.current;
    const thumb = thumbRef.current;
    if (!base || !thumb) return;
    const rect = base.getBoundingClientRect();
    const radius = (rect.width - thumb.offsetWidth) / 2;
    let dx = event.clientX - (rect.left + rect.width / 2);
    let dy = event.clientY - (rect.top + rect.height / 2);
    const length = Math.hypot(dx, dy);
    if (length > radius) {
      dx = (dx / length) * radius;
      dy = (dy / length) * radius;
    }
    thumb.style.transform = `translate(${dx}px, ${dy}px)`;
    const magnitude = Math.min(1, Math.hypot(dx, dy) / radius);
    // Rampa suave desde el borde de la zona muerta hasta 1
    const scale = magnitude < DEAD_ZONE ? 0 : (magnitude - DEAD_ZONE) / (1 - DEAD_ZONE) / magnitude;
    vector.current = { x: (dx / radius) * scale, y: (-dy / radius) * scale };
  };

  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (pointerId.current !== null) return;
    pointerId.current = event.pointerId;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    track(event);
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, MAX_DT);
      last = now;
      const { x, y } = vector.current;
      if (x !== 0 || y !== 0) actions.current.onMove(x, y, dt);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, 1],
      ArrowDown: [0, -1],
    };
    const step = steps[event.key];
    if (!step) return;
    event.preventDefault();
    actions.current.onStep(step[0], step[1]);
  };

  return (
    <div
      ref={baseRef}
      className={styles.base}
      role='group'
      aria-label={label}
      tabIndex={0}
      onPointerDown={start}
      onPointerMove={(event) => {
        if (event.pointerId === pointerId.current) track(event);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={handleKey}
    >
      <span ref={thumbRef} className={styles.thumb} />
    </div>
  );
}
