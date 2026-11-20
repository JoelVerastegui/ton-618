import { memo } from 'react';
import clsx from 'clsx';
import deepField from '@/assets/images/exploration/deep-field-1024.webp';
import { Layer, LayerSvg } from '@/components/sections/Exploration/Layers/Layer';
import { CENTER, POS_CENTER, at, dots, scatterDisk, seeded } from '@/utils/geometry';
import type { Point } from '@/utils/geometry';
import { levelById, markerLabel } from '@/utils/layerData';
import shared from '@/components/sections/Exploration/Layers/LayerShared.module.scss';
import styles from '@/components/sections/Exploration/Layers/NeighborhoodLayer.module.scss';

const neighborhood = levelById('cosmic-neighborhood');

const rand = seeded(2218);

// Estrellas del fondo, encima de la ilustración (galaxias y nebulosas, generada con
// IA): puntos repartidos por el disco visible (radio 500) y fuera del halo de TON 618.
// Un grupo fijo y tres que centellean con ritmos distintos.
const clearOfHalo = (p: Point) => Math.hypot(p[0] - CENTER, p[1] - CENTER) < 135;
const [fixedStars, ...twinklingStars] = [380, 90, 90, 90].map((count) =>
  dots(scatterDisk(count, 1000, rand, clearOfHalo))
);
const TWINKLE = [styles.twinkleA, styles.twinkleB, styles.twinkleC];

const POS = { milkyWay: at(40, 840) };

// Nivel 2 · Vecindad cósmica
export const NeighborhoodLayer = memo(function NeighborhoodLayer() {
  return (
    <Layer levelId='cosmic-neighborhood' variant='neighborhood'>
      <img
        className={styles.backdrop}
        src={deepField}
        alt=''
        width={1024}
        height={1024}
        decoding='async'
      />
      <LayerSvg className={styles.disc}>
        <path className={clsx(shared.galaxies, styles.stars)} d={fixedStars} />
        {twinklingStars.map((d, i) => (
          <path
            key={TWINKLE[i]}
            className={clsx(shared.galaxies, styles.stars, TWINKLE[i])}
            d={d}
          />
        ))}
        <circle className={styles.halo} cx={CENTER} cy={CENTER} r={120} />
      </LayerSvg>

      <span className={shared.pulse} style={POS_CENTER} />
      <span className={clsx(shared.dot, shared.dotSelf)} style={POS_CENTER} />
      <span className={clsx(shared.label, shared.labelRight, shared.labelSelf)} style={POS_CENTER}>
        {markerLabel(neighborhood, 'ton618')}
      </span>
      <span className={clsx(shared.label, styles.labelEdge)} style={POS.milkyWay}>
        {markerLabel(neighborhood, 'milky-way')}
      </span>
    </Layer>
  );
});
