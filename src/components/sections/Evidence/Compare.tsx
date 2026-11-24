import { useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import type { EvidenceData } from '@/interfaces/evidence';
import observationDesktop from '@/assets/images/evidence/ton618-observation-768.webp';
import observationMobile from '@/assets/images/evidence/ton618-observation-mobile-640.webp';
import representationDesktop from '@/assets/images/hero/ton618-blackhole-1024.webp';
import representationMobile from '@/assets/images/hero/ton618-blackhole-mobile-800.webp';
import styles from '@/components/sections/Evidence/Compare.module.scss';

// Posición inicial y paso del teclado (% de la observación visible).
const INITIAL = 50;
const KEY_STEP = 5;

// Desde este ancho se usan las versiones cuadradas de escritorio (= `md` de Bootstrap).
const DESKTOP_MEDIA = '(min-width: 768px)';

interface CompareProps {
  hint: string;
  data: EvidenceData['compare'];
}

// Comparador: la observación (arriba) se revela sobre la representación con `clip-path`. El valor
// (0-100, % de observación) solo vive en el DOM: `--split` y `aria-valuetext` se escriben por
// ref, sin renders de React al arrastrar.
export function Compare({ hint, data }: CompareProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const valueText = (value: number) => data.valueText.replace('{value}', String(value));

  const apply = (value: number) => {
    const root = rootRef.current;
    const input = inputRef.current;
    if (!root || !input) return;
    root.style.setProperty('--split', String(value));
    input.setAttribute('aria-valuetext', valueText(value));
  };

  // El hint se oculta (por atributo, sin estado) con la primera interacción.
  const markTouched = () => {
    if (rootRef.current) rootRef.current.dataset.touched = 'true';
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    markTouched();
    apply(Number(event.currentTarget.value));
  };

  // Flechas ±5 (el paso nativo es 1 para que el arrastre sea continuo); Inicio/Fin ya nativos.
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const value = Number(input.value);
    let next: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowUp')
      next = Math.min(100, value + KEY_STEP);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown')
      next = Math.max(0, value - KEY_STEP);

    if (next === null) return;
    event.preventDefault();
    input.value = String(next);
    markTouched();
    apply(next);
  };

  return (
    <div ref={rootRef} className={styles.compare} data-touched='false'>
      <picture>
        <source media={DESKTOP_MEDIA} srcSet={representationDesktop} />
        <img
          className={styles.image}
          src={representationMobile}
          alt={data.representation.alt}
          loading='lazy'
          decoding='async'
        />
      </picture>
      <picture className={styles.observation}>
        <source media={DESKTOP_MEDIA} srcSet={observationDesktop} />
        <img
          className={styles.image}
          src={observationMobile}
          alt={data.observation.alt}
          loading='lazy'
          decoding='async'
        />
      </picture>

      <span className={`${styles.label} ${styles.labelObservation}`}>{data.observation.label}</span>
      <span className={`${styles.label} ${styles.labelRepresentation}`}>
        {data.representation.label}
      </span>

      <input
        ref={inputRef}
        className={styles.slider}
        type='range'
        min={0}
        max={100}
        step={1}
        defaultValue={INITIAL}
        aria-label={data.sliderLabel}
        aria-valuetext={valueText(INITIAL)}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPointerDown={markTouched}
      />

      <div className={styles.handle} aria-hidden='true'>
        <span className={styles.line} />
        <svg className={styles.knob} viewBox='0 0 44 44' focusable='false'>
          <circle cx='22' cy='22' r='21' />
          <path d='M19 15l-7 7 7 7M25 15l7 7-7 7' />
        </svg>
      </div>

      <p className={styles.hint}>{hint}</p>
    </div>
  );
}
