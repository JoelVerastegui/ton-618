import clsx from 'clsx';
import type { SciencePoint, SciencePointId } from '@/interfaces/science';
import styles from '@/components/sections/Science/PointNav.module.scss';

interface PointNavProps {
  points: SciencePoint[];
  active: SciencePointId;
  onSelect: (id: SciencePointId) => void;
  onClose: () => void;
}

// Navegación entre puntos (solo con un punto abierto): un botón por punto, con su
// nombre como `aria-label`, y «Vista completa».
export function PointNav({ points, active, onSelect, onClose }: PointNavProps) {
  return (
    <nav className={styles.nav} aria-label='Puntos de la ilustración'>
      <ul className={styles.list}>
        {points.map((point) => (
          <li key={point.id}>
            <button
              type='button'
              className={clsx(styles.step, point.id === active && styles.current)}
              aria-label={point.title}
              aria-pressed={point.id === active}
              onClick={() => onSelect(point.id)}
            >
              {point.order}
            </button>
          </li>
        ))}
      </ul>
      <button type='button' className={styles.close} onClick={onClose}>
        Vista completa
      </button>
    </nav>
  );
}
