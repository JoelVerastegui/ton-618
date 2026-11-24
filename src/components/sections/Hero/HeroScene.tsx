import { SkyBackground } from '@/components/ui/SkyBackground/SkyBackground';
import styles from '@/components/sections/Hero/HeroScene.module.scss';
import blackHoleImage from '@/assets/images/hero/ton618-blackhole-1024.webp';
import blackHoleImageMobile from '@/assets/images/hero/ton618-blackhole-mobile-800.webp';

// Escena decorativa del hero: fondo espacial compartido + agujero negro y scrim.
export function HeroScene() {
  return (
    <div className={styles.scene} aria-hidden='true'>
      <SkyBackground variant='hero' />

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
