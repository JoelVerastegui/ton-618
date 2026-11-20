import { memo } from 'react';
import clsx from 'clsx';
import { Layer, LayerSvg } from '@/components/sections/Exploration/Layers/Layer';
import { CENTER, POS_CENTER, at, dots, fmt, scatterDisk, seeded } from '@/utils/geometry';
import type { Point } from '@/utils/geometry';
import { levelById, markerLabel } from '@/utils/layerData';
import shared from '@/components/sections/Exploration/Layers/LayerShared.module.scss';
import styles from '@/components/sections/Exploration/Layers/SkyRegionLayer.module.scss';

const skyRegion = levelById('sky-region');

const CHART_RADIUS = 430;

// Cuerda del círculo a `offset` del centro, con normal en `angle` grados.
// `bulge` curva la línea para sugerir los paralelos de la esfera celeste.
const chartLine = (offset: number, angle: number, bulge: number) => {
  const rad = (angle * Math.PI) / 180;
  const nx = Math.cos(rad);
  const ny = Math.sin(rad);
  const half = Math.sqrt(CHART_RADIUS ** 2 - offset ** 2);
  const px = CENTER + nx * offset;
  const py = CENTER + ny * offset;
  const ax = px - ny * half;
  const ay = py + nx * half;
  const bx = px + ny * half;
  const by = py - nx * half;
  return `M${fmt(ax)} ${fmt(ay)}Q${fmt(px + nx * bulge)} ${fmt(py + ny * bulge)} ${fmt(bx)} ${fmt(by)}`;
};
// 3 meridianos (RA) y 3 paralelos (Dec)
const GRID = [
  chartLine(-240, 4, 0),
  chartLine(0, 0, 0),
  chartLine(240, -4, 0),
  chartLine(-230, 90, 36),
  chartLine(0, 90, 36),
  chartLine(230, 90, 36),
];

// Cor Caroli y Chara (esquemático: ~25 u por grado, este a la izquierda).
const CHARA: Point = [475, 250];
const COR_CAROLI: Point = [357, 330];

const rand = seeded(1228);
const inKeepOut = ([x, y]: Point) =>
  Math.hypot(x - CENTER, y - CENTER) < 60 || // marcador de TON 618
  (x > 330 && x < 670 && y > 820) || // rótulo «Observas desde la Tierra»
  (x > 300 && x < 700 && y < 190) || // rótulo de la constelación
  Math.hypot(x - CHARA[0], y - CHARA[1]) < 40 ||
  Math.hypot(x - COR_CAROLI[0], y - COR_CAROLI[1]) < 40;
const starsSmall = dots(scatterDisk(30, CHART_RADIUS - 30, rand, inKeepOut));
const starsMid = dots(scatterDisk(8, CHART_RADIUS - 30, rand, inKeepOut));
const starsNamed = dots([CHARA, COR_CAROLI]);
const LINK = `M${COR_CAROLI[0]} ${COR_CAROLI[1]}L${CHARA[0]} ${CHARA[1]}`;

const POS = {
  chara: at(CHARA[0], CHARA[1]),
  corCaroli: at(COR_CAROLI[0], COR_CAROLI[1]),
  earthView: at(500, 870),
  title: at(500, 140),
};

// Nivel 3 · Región del cielo
export const SkyRegionLayer = memo(function SkyRegionLayer() {
  return (
    <Layer levelId='sky-region' variant='sky'>
      <LayerSvg>
        <circle className={styles.chart} cx={CENTER} cy={CENTER} r={CHART_RADIUS} />
        {GRID.map((d) => (
          <path key={d} className={styles.grid} d={d} />
        ))}
        <path className={styles.constellation} d={LINK} />
        <path className={clsx(styles.stars, styles.starsSmall)} d={starsSmall} />
        <path className={clsx(styles.stars, styles.starsMid)} d={starsMid} />
        <path className={clsx(styles.stars, styles.starsNamed)} d={starsNamed} />
      </LayerSvg>

      <span className={shared.pulse} style={POS_CENTER} />
      <span className={clsx(shared.dot, shared.dotSelf)} style={POS_CENTER} />
      <span className={clsx(shared.label, shared.labelRight, shared.labelSelf)} style={POS_CENTER}>
        {markerLabel(skyRegion, 'ton618')}
      </span>
      <span className={clsx(shared.label, shared.labelRight)} style={POS.chara}>
        {markerLabel(skyRegion, 'chara')}
      </span>
      <span className={clsx(shared.label, shared.labelLeft)} style={POS.corCaroli}>
        {markerLabel(skyRegion, 'cor-caroli')}
      </span>
      <span className={clsx(shared.label, shared.labelNote)} style={POS.earthView}>
        {markerLabel(skyRegion, 'earth-view')}
      </span>
      <span className={clsx(shared.label, styles.labelTitle)} style={POS.title}>
        {markerLabel(skyRegion, 'canes-venatici')}
        <span className={styles.labelSub}>{skyRegion.scaleNote}</span>
      </span>
    </Layer>
  );
});
