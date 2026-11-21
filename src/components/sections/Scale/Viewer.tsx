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
import { LAYER_K, PLANET_ANGLES_DEG, PLANET_ORBIT_RATIOS } from '@/utils/scaleGeometry';
import styles from '@/components/sections/Scale/Scale.module.scss';

// De Mercurio a Neptuno (mismo orden que PLANET_ORBITS_AU).
const PLANETS = [mercury, venus, earthSprite, mars, jupiter, saturn, uranus, neptune];
// La Tierra no lleva sprite propio en la órbita: su imagen se reutiliza como marcador.
const SATURN_INDEX = 5;

// Factores de tamaño por unidad de zoom (constantes de `scaleGeometry`): el SCSS deriva de
// ellos el tamaño de cada capa con `--zoom`.
const layerStyle = {
  '--kEarth': LAYER_K.earth,
  '--kSun': LAYER_K.sun,
  '--kOrbits': LAYER_K.orbits,
  '--kTon': LAYER_K.ton618,
} as CSSProperties;

interface ViewerProps {
  // Contenedor al que `useScaleZoom` escribe `--zoom`.
  viewerRef: RefObject<HTMLDivElement | null>;
}

// Visor circular de la escena. No depende del estado de la sección: el zoom llega por
// `--zoom` (escrita por ref), de modo que arrastrar el control no lo vuelve a renderizar.
export const Viewer = memo(function Viewer({ viewerRef }: ViewerProps) {
  const sunRef = useRef<HTMLVideoElement>(null);
  useVideoPlayback(sunRef);

  return (
    <div ref={viewerRef} className={styles.viewer} style={layerStyle} aria-hidden='true'>
      <img className={styles.blackHole} src={blackHole} alt='' width={1024} height={1024} />

      <svg className={styles.orbits} viewBox='0 0 100 100' focusable='false'>
        {PLANET_ORBIT_RATIOS.map((ratio, i) => (
          <circle key={i} className={styles.orbit} cx={50} cy={50} r={50 * ratio} />
        ))}
      </svg>

      <div className={styles.planets}>
        {PLANETS.map((src, i) => (
          <img
            key={i}
            className={i === SATURN_INDEX ? styles.saturn : styles.planet}
            style={
              {
                '--orbit': 50 * PLANET_ORBIT_RATIOS[i],
                '--angle': `${PLANET_ANGLES_DEG[i]}deg`,
              } as CSSProperties
            }
            src={src}
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
