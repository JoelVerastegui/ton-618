import { memo } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import milkyWay from '@/assets/images/exploration/milky-way-384.webp';
import { Layer, LayerSvg } from '@/components/sections/Exploration/Layers/Layer';
import {
  CENTER,
  POS_CENTER,
  at,
  bezierPath,
  dots,
  fmt,
  scatterAlong,
  scatterDisk,
  seeded,
  vector,
} from '@/utils/geometry';
import type { Bezier, Point } from '@/utils/geometry';
import { levelById, markerLabel } from '@/utils/layerData';
import shared from '@/components/sections/Exploration/Layers/LayerShared.module.scss';
import styles from '@/components/sections/Exploration/Layers/UniverseLayer.module.scss';

const universe = levelById('universe');

// La Tierra está en (250, 690) y TON 618 en (500, 500): 314 u de distancia a
// -37°. Esa distancia equivale a ~10,8 mil millones de años de viaje de la luz
// (29,07 u por cada mil millones), por eso cada anillo (+4 mil millones) añade 116,3 u.
const EARTH: Point = [250, 690];
const EARTH_TON_LENGTH = Math.round(Math.hypot(CENTER - EARTH[0], CENTER - EARTH[1])); // 314
const EARTH_TON_ANGLE = Math.round(
  (Math.atan2(CENTER - EARTH[1], CENTER - EARTH[0]) * 180) / Math.PI
); // -37
const RING_STEP = fmt((4 * EARTH_TON_LENGTH) / 10.8);
const RINGS = [1, 2, 3].map((n) => fmt(n * RING_STEP));

const WEB: Bezier[] = [
  [60, 300, 250, 330, 380, 450, 500, 500],
  [500, 500, 620, 540, 700, 700, 880, 780],
  [500, 500, 560, 380, 640, 260, 800, 180],
  [250, 690, 300, 820, 400, 880, 520, 960],
  [150, 150, 300, 200, 330, 320, 380, 450],
  [880, 780, 900, 600, 940, 420, 960, 250],
];
const WEB_PATH = bezierPath(WEB);

const rand = seeded(618);
const galaxies = [140, 60, 20].map((count) => {
  const along = Math.round(count * 0.6);
  return dots([...scatterAlong(WEB, along, 34, rand), ...scatterDisk(count - along, 470, rand)]);
});

// La Vía Láctea (vista cenital, ilustración generada con IA) se coloca de modo que
// la Tierra quede sobre un brazo, a ~0,6 del radio del centro galáctico.
const MILKY_WAY_CENTER: Point = [EARTH[0] - 41, EARTH[1] - 31];

const POS = {
  milkyWay: at(MILKY_WAY_CENTER[0], MILKY_WAY_CENTER[1]),
  earth: at(EARTH[0], EARTH[1]),
  earthLine: {
    ...at(EARTH[0], EARTH[1]),
    ...vector(EARTH_TON_LENGTH, EARTH_TON_ANGLE),
  } as CSSProperties,
  ringLegend: at(500, 860),
};

// Nivel 1 · Universo observable
export const UniverseLayer = memo(function UniverseLayer() {
  return (
    <Layer levelId='universe' variant='universe'>
      <LayerSvg className={styles.disc}>
        <path className={shared.web} d={WEB_PATH} />
        {RINGS.map((radius) => (
          <circle key={radius} className={styles.ring} cx={EARTH[0]} cy={EARTH[1]} r={radius} />
        ))}
        <path
          className={clsx(shared.galaxies, shared.galaxiesDim, styles.twinkleA)}
          d={galaxies[0]}
        />
        <path
          className={clsx(shared.galaxies, shared.galaxiesMid, styles.twinkleB)}
          d={galaxies[1]}
        />
        <path
          className={clsx(shared.galaxies, shared.galaxiesBright, styles.twinkleC)}
          d={galaxies[2]}
        />
      </LayerSvg>

      <img
        className={styles.milkyWay}
        style={POS.milkyWay}
        src={milkyWay}
        alt=''
        width={384}
        height={384}
        decoding='async'
      />
      <span className={clsx(shared.line, styles.lineEarth)} style={POS.earthLine} />
      <span className={clsx(shared.dot, shared.dotReference)} style={POS.earth} />
      <span className={clsx(shared.label, shared.labelBelow, styles.labelHere)} style={POS.earth}>
        {markerLabel(universe, 'earth')}
      </span>
      <span className={shared.pulse} style={POS_CENTER} />
      <span className={clsx(shared.dot, shared.dotSelf)} style={POS_CENTER} />
      <span className={clsx(shared.label, shared.labelRight, shared.labelSelf)} style={POS_CENTER}>
        {markerLabel(universe, 'ton618')}
      </span>
      <span className={clsx(shared.label, styles.labelRings)} style={POS.ringLegend}>
        {universe.ringLegend}
      </span>
    </Layer>
  );
});
