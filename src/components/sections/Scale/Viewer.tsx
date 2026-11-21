import { memo } from 'react';
import blackHole from '@/assets/images/hero/ton618-blackhole-1024.webp';
import styles from '@/components/sections/Scale/Scale.module.scss';

// Visor circular de la escena. No depende del estado de la sección.
export const Viewer = memo(function Viewer() {
  return (
    <div className={styles.viewer} aria-hidden='true'>
      <img className={styles.blackHole} src={blackHole} alt='' width={1024} height={1024} />
    </div>
  );
});
