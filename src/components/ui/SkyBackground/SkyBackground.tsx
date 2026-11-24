import clsx from 'clsx';
import styles from '@/components/ui/SkyBackground/SkyBackground.module.scss';

const PARTICLE_COUNT = 18;
const SPARKLE_COUNT = 4;

interface SkyBackgroundProps {
  // 'hero': degradado azul y zoom por scroll. 'void': negro puro, sin zoom.
  variant?: 'hero' | 'void';
}

// Fondo espacial compartido (capas de profundidad con parallax, nebulosa,
// partículas, centelleo y destellos). Los valores aleatorios de estrellas y
// partículas se generan en compilación (SCSS), no en ejecución. Ocupa todo el
// contenedor posicionado donde se monte.
export function SkyBackground({ variant = 'hero' }: SkyBackgroundProps) {
  return (
    <div className={clsx(styles.sky, variant === 'hero' && styles.zoom)} aria-hidden='true'>
      <div className={clsx(styles.background, variant === 'void' && styles.backgroundVoid)} />

      <div className={clsx(styles.layer, styles.layerFar)}>
        <div className={styles.layerScroll}>
          <div className={styles.layerBody}>
            <div className={styles.farStars} />
          </div>
        </div>
      </div>

      <div className={clsx(styles.layer, styles.layerMid)}>
        <div className={styles.layerScroll}>
          <div className={styles.layerBody}>
            <div className={styles.nebula} />
            <div className={styles.particles}>
              {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
                <span key={i} className={styles.particle} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={clsx(styles.layer, styles.layerNear)}>
        <div className={styles.layerScroll}>
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
      </div>
    </div>
  );
}
