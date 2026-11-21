import type { ChangeEvent, KeyboardEvent, RefObject } from 'react';
import clsx from 'clsx';
import type { ScaleStop, ScaleStopId } from '@/interfaces/scale';
import { SLIDER_MAX, STOP_ORDER, stopIndexAt, stopValue } from '@/utils/scaleGeometry';
import styles from '@/components/sections/Scale/ScaleSlider.module.scss';

// Paso de las flechas del teclado.
const KEY_STEP = 10;

interface ScaleSliderProps {
  stops: ScaleStop[];
  activeStop: ScaleStopId;
  // Deslizante no controlado: el hook escribe su `value` por ref.
  inputRef: RefObject<HTMLInputElement | null>;
  onValue: (value: number) => void;
  onStop: (value: number) => void;
}

// Deslizante de escala y botones de parada. El valor continuo no es estado de React.
export function ScaleSlider({ stops, activeStop, inputRef, onValue, onStop }: ScaleSliderProps) {
  const activeTitle = stops.find((stop) => stop.id === activeStop)?.title;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onValue(Number(event.currentTarget.value));
  };

  // Flechas ±10, Home/End a los extremos y PageUp/PageDown a la parada anterior/siguiente.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const value = Number(event.currentTarget.value);
    const index = stopIndexAt(value);
    let next: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowUp':
        next = Math.min(SLIDER_MAX, value + KEY_STEP);
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        next = Math.max(0, value - KEY_STEP);
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = SLIDER_MAX;
        break;
      case 'PageUp':
        next = stopValue(STOP_ORDER[Math.max(0, index - 1)]);
        break;
      case 'PageDown':
        next = stopValue(STOP_ORDER[Math.min(STOP_ORDER.length - 1, index + 1)]);
        break;
    }

    if (next === null) return;
    event.preventDefault();
    onValue(next);
  };

  return (
    <div className={styles.control}>
      <input
        ref={inputRef}
        className={styles.slider}
        type='range'
        min={0}
        max={SLIDER_MAX}
        step={1}
        defaultValue={0}
        aria-label='Escala'
        aria-valuetext={activeTitle}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <div className={styles.stops}>
        {stops.map((stop) => (
          <button
            key={stop.id}
            type='button'
            className={clsx(styles.stop, stop.id === activeStop && styles.active)}
            aria-current={stop.id === activeStop ? 'step' : undefined}
            onClick={() => onStop(stopValue(stop.id))}
          >
            {stop.title}
          </button>
        ))}
      </div>
    </div>
  );
}
