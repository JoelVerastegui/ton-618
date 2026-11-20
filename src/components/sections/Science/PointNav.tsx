import type { ReactNode } from 'react';
import type { SciencePoint, SciencePointId } from '@/interfaces/science';
import styles from '@/components/sections/Science/PointNav.module.scss';

interface PointNavProps {
  points: SciencePoint[];
  active: SciencePointId;
  onSelect: (id: SciencePointId) => void;
  onClose: () => void;
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox='0 0 24 24'
      width='22'
      height='22'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.75'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      focusable='false'
    >
      {children}
    </svg>
  );
}

// Navegación entre puntos (solo con un punto abierto): flecha anterior, flecha siguiente
// (circulares: tras el último vuelve al primero y al revés) y un telescopio que devuelven
// la cámara a la vista completa. Áreas ≥ 44 px.
export function PointNav({ points, active, onSelect, onClose }: PointNavProps) {
  const index = points.findIndex((point) => point.id === active);
  const previous = points[(index - 1 + points.length) % points.length];
  const next = points[(index + 1) % points.length];

  return (
    <nav className={styles.nav} aria-label='Puntos de la ilustración'>
      <button
        type='button'
        className={styles.button}
        aria-label={`Anterior: ${previous.title}`}
        onClick={() => onSelect(previous.id)}
      >
        <Icon>
          <path d='M19 12H5' />
          <path d='m12 19-7-7 7-7' />
        </Icon>
      </button>
      <button type='button' className={styles.button} aria-label='Vista completa' onClick={onClose}>
        <Icon>
          <path d='m10.065 12.493-6.18 1.318a.934.934 0 0 1-1.108-.702l-.537-2.15a1.07 1.07 0 0 1 .691-1.265l13.504-4.44' />
          <path d='m13.56 11.747 4.332-.924' />
          <path d='m16 21-3.105-6.21' />
          <path d='M16.485 5.94a2 2 0 0 1 1.455-2.425l1.09-.272a1 1 0 0 1 1.212.727l1.515 6.06a1 1 0 0 1-.727 1.213l-1.09.272a2 2 0 0 1-2.425-1.455z' />
          <path d='m6.158 8.633 1.114 4.456' />
          <path d='m8 21 3.105-6.21' />
          <circle cx='12' cy='13' r='2' />
        </Icon>
      </button>
      <button
        type='button'
        className={styles.button}
        aria-label={`Siguiente: ${next.title}`}
        onClick={() => onSelect(next.id)}
      >
        <Icon>
          <path d='M5 12h14' />
          <path d='m12 5 7 7-7 7' />
        </Icon>
      </button>
    </nav>
  );
}
