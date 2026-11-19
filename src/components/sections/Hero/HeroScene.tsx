import clsx from 'clsx';
import styles from '@/components/sections/Hero/HeroScene.module.scss';
import blackHoleImage from '@/assets/images/hero/ton618-blackhole-1024.webp';
import blackHoleImageMobile from '@/assets/images/hero/ton618-blackhole-mobile-800.webp';

const PARTICLE_COUNT = 18;
const SPARKLE_COUNT = 4;

// Escena decorativa del hero (capas de profundidad). Los valores aleatorios de
// estrellas y partículas se generan en compilación (SCSS), no en ejecución.
export function HeroScene() {
  return (
    <div className={styles.scene} aria-hidden='true'>
      <div className={styles.background} />

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

      <div className={styles.core}>
        <div className={styles.coreBody}>
          <div className={styles.coreFloat}>
            <div className={styles.halo} />
            {/* Móvil: recorte 2:1 sin espacio vacío, para que el disco quepa en pantalla.
                El breakpoint coincide con media-breakpoint-down(md) del SCSS. */}
            <picture>
              <source media='(max-width: 767.98px)' srcSet={blackHoleImageMobile} />
              <img
                className={styles.blackHole}
                src={blackHoleImage}
                width={1024}
                height={1024}
                alt=''
                decoding='async'
                fetchPriority='high'
              />
            </picture>
          </div>
        </div>
      </div>

      <div className={styles.scrim} />
    </div>
  );
}
