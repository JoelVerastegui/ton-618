import { memo } from 'react';
import { SKY_LAYERS } from '@/utils/scaleSky';
import styles from '@/components/sections/Scale/Sky.module.scss';

// Cielo de la escena: nebulosa del Hero y tres capas de estrellas. Decorativo; el progreso de
// la intro llega por `--intro` (heredada del stage), así que no se renderiza al hacer scroll.
export const Sky = memo(function Sky() {
  return (
    <div className={styles.sky}>
      <div className={styles.nebulaMask}>
        <div className={styles.nebula} />
      </div>
      {SKY_LAYERS.map((layer) => (
        <svg
          key={layer.id}
          className={`${styles.stars} ${styles[layer.id]}`}
          viewBox='0 0 1000 1000'
          focusable='false'
        >
          <path d={layer.path} />
        </svg>
      ))}
    </div>
  );
});
