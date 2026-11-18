import clsx from 'clsx';
import styles from '@/components/sections/Hero/HeroScene.module.scss';

const PARTICLE_COUNT = 18;
const SPARKLE_COUNT = 4;

// Escena decorativa del hero (capas de profundidad). Los valores aleatorios de
// estrellas y partículas se generan en compilación (SCSS), no en ejecución.
export function HeroScene() {
  return (
    <div className={styles.scene} aria-hidden='true'>
      <div className={styles.background} />

      <div className={clsx(styles.layer, styles.layerFar)}>
        <div className={styles.layerBody}>
          <div className={styles.farStars} />
        </div>
      </div>

      <div className={clsx(styles.layer, styles.layerMid)}>
        <div className={styles.layerBody}>
          <div className={styles.nebula} />
          <div className={styles.particles}>
            {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
              <span key={i} className={styles.particle} />
            ))}
          </div>
        </div>
      </div>

      <div className={clsx(styles.layer, styles.layerNear)}>
        <div className={styles.layerBody}>
          <div className={styles.nearStars} />
          <div className={styles.twinkleA} />
          <div className={styles.twinkleB} />
          <div className={styles.twinkleC} />
          <div className={styles.sparkles}>
            {Array.from({ length: SPARKLE_COUNT }, (_, i) => (
              <span key={i} className={styles.sparkle} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.core}>
        <div className={styles.coreBody}>
          <div className={styles.halo} />
          <div className={styles.lens} />
          <div className={styles.shadow} />
          <div className={styles.disc} />
        </div>
      </div>

      <div className={styles.scrim} />
    </div>
  );
}
