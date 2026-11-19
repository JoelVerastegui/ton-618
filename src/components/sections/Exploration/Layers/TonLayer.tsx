import { memo } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import { Layer, LayerSvg } from '@/components/sections/Exploration/Layers/Layer';
import { CENTER, POS_SCALE_NOTE, at, vector } from '@/utils/geometry';
import type { Point } from '@/utils/geometry';
import { levelById, markerLabel } from '@/utils/layerData';
import shared from '@/components/sections/Exploration/Layers/LayerShared.module.scss';
import styles from '@/components/sections/Exploration/Layers/TonLayer.module.scss';

const ton = levelById('ton618');

// Etiqueta «TON 618» a (700, 240); la guía parte a 110 u del centro.
const GUIDE_FROM = 110;
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

const HALO_ID = 'explorationHalo';
const DISC_ID = 'explorationDisc';

// Nivel 4 · TON 618 (representación artística)
export const TonLayer = memo(function TonLayer() {
  return (
    <Layer levelId='ton618' variant='ton'>
      <LayerSvg>
        <defs>
          <radialGradient id={HALO_ID}>
            <stop className={styles.haloCore} offset='0.15' />
            <stop className={styles.haloMid} offset='0.5' />
            <stop className={styles.haloEdge} offset='1' />
          </radialGradient>
          <linearGradient id={DISC_ID}>
            <stop className={styles.discEdge} offset='0' />
            <stop className={styles.discHot} offset='0.5' />
            <stop className={styles.discEdge} offset='1' />
          </linearGradient>
        </defs>
        <circle cx={CENTER} cy={CENTER} r={470} fill={`url(#${HALO_ID})`} />
        <g transform={`rotate(-12 ${CENTER} ${CENTER})`}>
          <ellipse cx={CENTER} cy={CENTER} rx={300} ry={80} fill={`url(#${DISC_ID})`} />
          <circle className={styles.hole} cx={CENTER} cy={CENTER} r={92} />
          <circle className={styles.photonRing} cx={CENTER} cy={CENTER} r={97} />
          <path
            d={`M200 ${CENTER}A300 80 0 0 0 800 ${CENTER}L600 ${CENTER}A100 14 0 0 1 400 ${CENTER}Z`}
            fill={`url(#${DISC_ID})`}
            className={styles.discFront}
          />
        </g>
      </LayerSvg>

      <span className={clsx(shared.line, styles.lineGuide)} style={POS.guide} />
      <span className={clsx(shared.label, shared.labelRight, shared.labelSelf)} style={POS.label}>
        {markerLabel(ton, 'ton618')}
      </span>
      <span className={clsx(shared.label, shared.labelNote)} style={POS_SCALE_NOTE}>
        {ton.scale.scaleNote}
      </span>
    </Layer>
  );
});
