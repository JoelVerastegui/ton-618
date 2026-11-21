import { memo } from 'react';
import type { SciencePoint, SciencePointId } from '@/interfaces/science';
import styles from '@/components/sections/Science/PointMarkers.module.scss';

interface PointMarkersProps {
  points: SciencePoint[];
  /** Inertes (sin foco ni clic) hasta que la escena está lista o con un punto abierto. */
  inert: boolean;
  onSelect: (id: SciencePointId) => void;
}

// Un `<button>` por punto, sobre la ilustración y fuera de la cámara (no escalan). La
// posición de cada uno sale de `$sciPoints` (CSS) a través de `data-point-id`.
export const PointMarkers = memo(function PointMarkers({
  points,
  inert,
  onSelect,
}: PointMarkersProps) {
  return (
    <div className={styles.markers} inert={inert}>
      {points.map((point) => (
        <button
          key={point.id}
          type='button'
          className={styles.marker}
          data-point-id={point.id}
          aria-label={point.title}
          onClick={() => onSelect(point.id)}
        >
          <span className={styles.ring} aria-hidden='true' />
          <span className={styles.ringLate} aria-hidden='true' />
          <span className={styles.dot} aria-hidden='true' />
        </button>
      ))}
    </div>
  );
});
