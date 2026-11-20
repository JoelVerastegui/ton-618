import { memo } from 'react';
import clsx from 'clsx';
import { Layer, LayerSvg } from '@/components/sections/Exploration/Layers/Layer';
import blackHole from '@/assets/images/hero/ton618-blackhole-1024.webp';
import { POS_CENTER, dots, scatterDisk, seeded } from '@/utils/geometry';
import shared from '@/components/sections/Exploration/Layers/LayerShared.module.scss';
import styles from '@/components/sections/Exploration/Layers/TonLayer.module.scss';

// Estrellas del fondo, bajo la imagen del agujero negro: puntos repartidos por todo el
// cuadrado (el radio 710 cubre las esquinas). Un grupo fijo y tres que centellean con
// ritmos distintos.
const rand = seeded(618);
const [fixedStars, ...twinklingStars] = [220, 60, 60, 60].map((count) =>
  dots(scatterDisk(count, 710, rand))
);
const TWINKLE = [styles.twinkleA, styles.twinkleB, styles.twinkleC];

// Nivel 4 · TON 618 (representación artística). La imagen del agujero negro es la del
// Hero (misma URL: sin descarga nueva).
export const TonLayer = memo(function TonLayer() {
  return (
    <Layer levelId='ton618' variant='ton'>
      <LayerSvg className={styles.disc}>
        <path className={clsx(shared.galaxies, styles.stars)} d={fixedStars} />
        {twinklingStars.map((d, i) => (
          <path
            key={TWINKLE[i]}
            className={clsx(shared.galaxies, styles.stars, TWINKLE[i])}
            d={d}
          />
        ))}
      </LayerSvg>
      <img
        className={styles.blackHole}
        src={blackHole}
        alt=''
        width={1024}
        height={1024}
        decoding='async'
      />

      <span className={clsx(shared.pulse, styles.pulseHole)} style={POS_CENTER} />
    </Layer>
  );
});
