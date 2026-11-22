import { memo, useRef, type CSSProperties, type RefObject } from 'react';
import { useVideoPlayback } from '@/hooks/useVideoPlayback';
import blackHole from '@/assets/images/hero/ton618-blackhole-1024.webp';
import earth from '@/assets/images/scale/earth.webp';
import mercury from '@/assets/images/scale/planets/mercury.webp';
import earthSprite from '@/assets/images/scale/planets/earth.webp';
import venus from '@/assets/images/scale/planets/venus.webp';
import mars from '@/assets/images/scale/planets/mars.webp';
import jupiter from '@/assets/images/scale/planets/jupiter.webp';
import saturn from '@/assets/images/scale/planets/saturn.webp';
import uranus from '@/assets/images/scale/planets/uranus.webp';
import neptune from '@/assets/images/scale/planets/neptune.webp';
import sunPoster from '@/assets/videos/scale/sun-poster.webp';
import sunMp4 from '@/assets/videos/scale/sun.mp4';
import sunWebm from '@/assets/videos/scale/sun.webm';
import { LAYER_K, SYSTEM_PLANETS, type PlanetId } from '@/utils/scaleGeometry';
import styles from '@/components/sections/Scale/Scale.module.scss';

const PLANET_IMAGES: Record<PlanetId, string> = {
  mercury,
  venus,
  earth: earthSprite,
  mars,
  jupiter,
  saturn,
  uranus,
  neptune,
};

// Factores de tamaño por unidad de zoom (constantes de `scaleGeometry`): el SCSS deriva de
// ellos el tamaño de cada capa con `--zoom`.
const layerStyle = {
  '--kEarth': LAYER_K.earth,
  '--kSun': LAYER_K.sun,
  '--kTon': LAYER_K.ton618,
} as CSSProperties;

interface ViewerProps {
  // Contenedor al que `useScaleZoom` escribe `--zoom`.
  viewerRef: RefObject<HTMLDivElement | null>;
}

// Visor circular de la escena. No depende del estado de la sección: el zoom llega por
// `--zoom` (escrita por ref), de modo que mover el scroll no lo vuelve a renderizar.
export const Viewer = memo(function Viewer({ viewerRef }: ViewerProps) {
  const sunRef = useRef<HTMLVideoElement>(null);
  // Reproduce solo con el vídeo en pantalla y la capa del Sol visible (`data-sun` del visor)
  useVideoPlayback(sunRef, viewerRef, 'sun');

  return (
    <div ref={viewerRef} className={styles.viewer} style={layerStyle} aria-hidden='true'>
      <img className={styles.blackHole} src={blackHole} alt='' width={1024} height={1024} />

      {/* Fila de planetas a la escala del Sol: x y tamaño en lados de la caja del Sol */}
      <div className={styles.planets}>
        {SYSTEM_PLANETS.map((planet) => (
          <img
            key={planet.id}
            className={styles.planet}
            style={{ '--x': planet.x, '--size': planet.size } as CSSProperties}
            src={PLANET_IMAGES[planet.id]}
            alt=''
            decoding='async'
            loading='lazy'
          />
        ))}
      </div>

      <video
        ref={sunRef}
        className={styles.sun}
        poster={sunPoster}
        width={400}
        height={400}
        muted
        loop
        playsInline
        preload='none'
        disablePictureInPicture
        tabIndex={-1}
      >
        <source src={sunWebm} type='video/webm' />
        <source src={sunMp4} type='video/mp4' />
      </video>

      <img className={styles.earth} src={earth} alt='' width={560} height={560} />
    </div>
  );
});
