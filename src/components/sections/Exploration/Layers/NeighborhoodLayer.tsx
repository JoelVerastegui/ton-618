import { memo } from 'react';
import clsx from 'clsx';
import { Layer, LayerSvg } from '@/components/sections/Exploration/Layers/Layer';
import {
  CENTER,
  POS_CENTER,
  POS_SCALE_NOTE,
  at,
  bezierPath,
  dots,
  scatterAlong,
  seeded,
} from '@/utils/geometry';
import type { Bezier, Point } from '@/utils/geometry';
import { levelById, markerLabel } from '@/utils/layerData';
import shared from '@/components/sections/Exploration/Layers/LayerShared.module.scss';
import styles from '@/components/sections/Exploration/Layers/NeighborhoodLayer.module.scss';

const neighborhood = levelById('cosmic-neighborhood');

const CLUSTERS = [
  { x: 290, y: 290, r: 92 },
  { x: 735, y: 250, r: 70 },
  { x: 800, y: 650, r: 84 },
  { x: 380, y: 780, r: 66 },
  { x: 170, y: 560, r: 58 },
];
// Cada filamento termina a ~130 u del centro, fuera del halo de 120 u.
const FILAMENTS: Bezier[] = [
  [290, 290, 340, 360, 400, 400, 420, 430],
  [735, 250, 700, 330, 600, 390, 570, 420],
  [800, 650, 720, 640, 640, 590, 600, 560],
  [380, 780, 400, 700, 450, 640, 470, 600],
  [170, 560, 250, 540, 330, 520, 372, 505],
];
const FILAMENTS_PATH = bezierPath(FILAMENTS);

const rand = seeded(2218);
const clusterMembers = (count: number): Point[] =>
  Array.from({ length: count }, (): Point => {
    const cluster = CLUSTERS[Math.floor(rand() * CLUSTERS.length)];
    const angle = rand() * Math.PI * 2;
    const dist = cluster.r * 0.8 * Math.sqrt(rand());
    return [cluster.x + Math.cos(angle) * dist, cluster.y + Math.sin(angle) * dist];
  });
const galaxies = [50, 30].map((count) => {
  const inClusters = Math.round(count * 0.55);
  return dots([
    ...clusterMembers(inClusters),
    ...scatterAlong(FILAMENTS, count - inClusters, 26, rand),
  ]);
});

const POS = { milkyWay: at(40, 840) };

const CLUSTER_GRADIENT_ID = 'explorationClusterGlow';

// Nivel 2 · Vecindad cósmica
export const NeighborhoodLayer = memo(function NeighborhoodLayer() {
  return (
    <Layer levelId='cosmic-neighborhood' variant='neighborhood'>
      <LayerSvg>
        <defs>
          <radialGradient id={CLUSTER_GRADIENT_ID}>
            <stop className={styles.clusterCore} offset='0' />
            <stop className={styles.clusterMid} offset='0.4' />
            <stop className={styles.clusterEdge} offset='1' />
          </radialGradient>
        </defs>
        <path className={shared.web} d={FILAMENTS_PATH} />
        {CLUSTERS.map((cluster) => (
          <circle
            key={`${cluster.x}-${cluster.y}`}
            cx={cluster.x}
            cy={cluster.y}
            r={cluster.r}
            fill={`url(#${CLUSTER_GRADIENT_ID})`}
          />
        ))}
        <path className={clsx(shared.galaxies, shared.galaxiesMid)} d={galaxies[0]} />
        <path className={clsx(shared.galaxies, shared.galaxiesBright)} d={galaxies[1]} />
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
      <span className={clsx(shared.label, shared.labelNote)} style={POS_SCALE_NOTE}>
        {neighborhood.scale.scaleNote}
      </span>
    </Layer>
  );
});
