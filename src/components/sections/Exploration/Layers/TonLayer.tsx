import { memo } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { Layer, LayerSvg } from '@/components/sections/Exploration/Layers/Layer';
import blackHole from '@/assets/images/hero/ton618-blackhole-1024.webp';
import {
  CENTER,
  POS_CENTER,
  POS_SCALE_NOTE,
  at,
  dots,
  scatterDisk,
  seeded,
  vector,
} from '@/utils/geometry';
import type { Point } from '@/utils/geometry';
import { levelById, markerLabel } from '@/utils/layerData';
import shared from '@/components/sections/Exploration/Layers/LayerShared.module.scss';
import styles from '@/components/sections/Exploration/Layers/TonLayer.module.scss';

const ton = levelById('ton618');

// Etiqueta «TON 618» a (700, 240); la guía parte a 175 u del centro, fuera del brillo del disco.
const GUIDE_FROM = 175;
const GUIDE_TARGET: Point = [700, 240];
const guideAngle = Math.atan2(GUIDE_TARGET[1] - CENTER, GUIDE_TARGET[0] - CENTER);
const GUIDE_START: Point = [
  CENTER + Math.cos(guideAngle) * GUIDE_FROM,
  CENTER + Math.sin(guideAngle) * GUIDE_FROM,
];
const GUIDE_LENGTH = Math.round(
  Math.hypot(GUIDE_TARGET[0] - GUIDE_START[0], GUIDE_TARGET[1] - GUIDE_START[1])
);
const GUIDE_DEG = Math.round((guideAngle * 180) / Math.PI);

const POS = {
  label: at(GUIDE_TARGET[0], GUIDE_TARGET[1]),
  guide: {
    ...at(GUIDE_START[0], GUIDE_START[1]),
    ...vector(GUIDE_LENGTH, GUIDE_DEG),
  } as CSSProperties,
};

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
      <span className={clsx(shared.line, styles.lineGuide)} style={POS.guide} />
      <span
        className={clsx(shared.label, shared.labelRight, shared.labelSelf, styles.labelTon)}
        style={POS.label}
      >
        {markerLabel(ton, 'ton618')}
      </span>
      <span className={clsx(shared.label, shared.labelNote)} style={POS_SCALE_NOTE}>
        {ton.scale.scaleNote}
      </span>
    </Layer>
  );
});
