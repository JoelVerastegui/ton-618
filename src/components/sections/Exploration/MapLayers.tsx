import { memo } from 'react';
import type { CSSProperties } from 'react';
import clsx from 'clsx';
import explorationJson from '@/data/exploration.json';
import type {
  ExplorationData,
  ExplorationLevel,
  ExplorationLevelId,
} from '@/interfaces/exploration';
import styles from '@/components/sections/Exploration/MapLayers.module.scss';

const exploration = explorationJson as ExplorationData;

// ---------------------------------------------------------------------------
// Datos del JSON
// ---------------------------------------------------------------------------
const levelById = (id: ExplorationLevelId): ExplorationLevel => {
  const level = exploration.levels.find((item) => item.id === id);
  if (!level) throw new Error(`Nivel de exploración desconocido: ${id}`);
  return level;
};

const markerLabel = (level: ExplorationLevel, id: string): string =>
  level.markers.find((marker) => marker.id === id)?.label ?? '';

const universe = levelById('universe');
const neighborhood = levelById('cosmic-neighborhood');
const skyRegion = levelById('sky-region');
const ton = levelById('ton618');

// ---------------------------------------------------------------------------
// Geometría determinista (se calcula una sola vez al cargar el módulo)
// ---------------------------------------------------------------------------
type Point = [number, number];
type Bezier = [number, number, number, number, number, number, number, number];

const CENTER = 500;

// PRNG con semilla (mulberry32): mismo mapa en cada carga.
const seeded = (seed: number) => {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const fmt = (n: number) => +n.toFixed(1);

// Puntos como segmentos de longitud casi nula: con `stroke-linecap: round`
// se dibujan como círculos en un único <path>.
const dots = (points: Point[]) => points.map(([x, y]) => `M${fmt(x)} ${fmt(y)}h.01`).join('');

const bezierPath = (curves: Bezier[]) =>
  curves.map((c) => `M${c[0]} ${c[1]}C${c[2]} ${c[3]} ${c[4]} ${c[5]} ${c[6]} ${c[7]}`).join('');

const bezierAt = (c: Bezier, t: number): Point => {
  const u = 1 - t;
  return [
    u ** 3 * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t ** 3 * c[6],
    u ** 3 * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t ** 3 * c[7],
  ];
};

// Puntos repartidos a lo largo de las curvas con dispersión `spread`.
const scatterAlong = (curves: Bezier[], count: number, spread: number, rand: () => number) =>
  Array.from({ length: count }, (): Point => {
    const [x, y] = bezierAt(curves[Math.floor(rand() * curves.length)], rand());
    return [x + (rand() + rand() - 1) * spread, y + (rand() + rand() - 1) * spread];
  });

// Puntos al azar dentro de un disco centrado en (500, 500).
const scatterDisk = (
  count: number,
  radius: number,
  rand: () => number,
  keepOut?: (p: Point) => boolean
) => {
  const points: Point[] = [];
  while (points.length < count) {
    const angle = rand() * Math.PI * 2;
    const dist = radius * Math.sqrt(rand());
    const point: Point = [CENTER + Math.cos(angle) * dist, CENTER + Math.sin(angle) * dist];
    if (!keepOut?.(point)) points.push(point);
  }
  return points;
};

// Nivel 1 -------------------------------------------------------------------
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

const universeRand = seeded(618);
const universeGalaxies = [140, 60, 20].map((count) => {
  const along = Math.round(count * 0.6);
  return dots([
    ...scatterAlong(WEB, along, 34, universeRand),
    ...scatterDisk(count - along, 470, universeRand),
  ]);
});

// Nivel 2 -------------------------------------------------------------------
const CLUSTERS = [
  { x: 290, y: 290, r: 92 },
  { x: 735, y: 250, r: 70 },
  { x: 800, y: 650, r: 84 },
  { x: 380, y: 780, r: 66 },
  { x: 170, y: 560, r: 58 },
];
// Cada filamento termina a ~130 u del centro, fuera del halo de 120 u.
const NEIGHBORHOOD_FILAMENTS: Bezier[] = [
  [290, 290, 340, 360, 400, 400, 420, 430],
  [735, 250, 700, 330, 600, 390, 570, 420],
  [800, 650, 720, 640, 640, 590, 600, 560],
  [380, 780, 400, 700, 450, 640, 470, 600],
  [170, 560, 250, 540, 330, 520, 372, 505],
];
const NEIGHBORHOOD_PATH = bezierPath(NEIGHBORHOOD_FILAMENTS);

const neighborhoodRand = seeded(2218);
const clusterMembers = (count: number): Point[] =>
  Array.from({ length: count }, (): Point => {
    const cluster = CLUSTERS[Math.floor(neighborhoodRand() * CLUSTERS.length)];
    const angle = neighborhoodRand() * Math.PI * 2;
    const dist = cluster.r * 0.8 * Math.sqrt(neighborhoodRand());
    return [cluster.x + Math.cos(angle) * dist, cluster.y + Math.sin(angle) * dist];
  });
const neighborhoodGalaxies = [50, 30].map((count) => {
  const inClusters = Math.round(count * 0.55);
  return dots([
    ...clusterMembers(inClusters),
    ...scatterAlong(NEIGHBORHOOD_FILAMENTS, count - inClusters, 26, neighborhoodRand),
  ]);
});

// Nivel 3 -------------------------------------------------------------------
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

const skyRand = seeded(1228);
const inSkyKeepOut = ([x, y]: Point) =>
  Math.hypot(x - CENTER, y - CENTER) < 60 || // marcador de TON 618
  (x > 300 && x < 700 && y < 190) || // rótulo de la constelación
  Math.hypot(x - CHARA[0], y - CHARA[1]) < 40 ||
  Math.hypot(x - COR_CAROLI[0], y - COR_CAROLI[1]) < 40;
const skyStarsSmall = dots(scatterDisk(30, CHART_RADIUS - 30, skyRand, inSkyKeepOut));
const skyStarsMid = dots(scatterDisk(8, CHART_RADIUS - 30, skyRand, inSkyKeepOut));
const skyNamedStars = dots([CHARA, COR_CAROLI]);
const skyLink = `M${COR_CAROLI[0]} ${COR_CAROLI[1]}L${CHARA[0]} ${CHARA[1]}`;

// Nivel 4 -------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Utilidades de maquetación
// ---------------------------------------------------------------------------
// Coordenadas del viewBox (0-1000) → % de la capa. Objetos creados una vez.
const at = (x: number, y: number): CSSProperties => ({ left: `${x / 10}%`, top: `${y / 10}%` });
const vector = (length: number, deg: number): CSSProperties =>
  ({ '--len': length, '--angle': `${deg}deg` }) as CSSProperties;

const POS = {
  earth: at(EARTH[0], EARTH[1]),
  center: at(CENTER, CENTER),
  earthLine: {
    ...at(EARTH[0], EARTH[1]),
    ...vector(EARTH_TON_LENGTH, EARTH_TON_ANGLE),
  } as CSSProperties,
  scaleNote: at(500, 30),
  milkyWay: at(40, 840),
  skyTitle: at(500, 140),
  tonLabel: at(GUIDE_TARGET[0], GUIDE_TARGET[1]),
  guide: {
    ...at(GUIDE_START[0], GUIDE_START[1]),
    ...vector(GUIDE_LENGTH, GUIDE_DEG),
  } as CSSProperties,
};

const svgProps = {
  className: styles.svg,
  viewBox: '0 0 1000 1000',
  'aria-hidden': true,
  focusable: false,
} as const;

// ---------------------------------------------------------------------------
// Capas
// ---------------------------------------------------------------------------
// Nivel 1 · Universo observable
export const UniverseLayer = memo(function UniverseLayer() {
  return (
    <div className={clsx(styles.layer, styles.layerUniverse)} data-level-id='universe'>
      <svg {...svgProps}>
        <path className={styles.web} d={WEB_PATH} />
        {RINGS.map((radius) => (
          <circle key={radius} className={styles.ring} cx={EARTH[0]} cy={EARTH[1]} r={radius} />
        ))}
        <path className={clsx(styles.galaxies, styles.galaxiesDim)} d={universeGalaxies[0]} />
        <path className={clsx(styles.galaxies, styles.galaxiesMid)} d={universeGalaxies[1]} />
        <path className={clsx(styles.galaxies, styles.galaxiesBright)} d={universeGalaxies[2]} />
      </svg>

      <span className={clsx(styles.line, styles.lineEarth)} style={POS.earthLine} />
      <span className={clsx(styles.dot, styles.dotReference)} style={POS.earth} />
      <span className={clsx(styles.label, styles.labelBelow)} style={POS.earth}>
        {markerLabel(universe, 'earth')}
      </span>
      <span className={clsx(styles.dot, styles.dotSelf)} style={POS.center} />
      <span className={clsx(styles.label, styles.labelRight, styles.labelSelf)} style={POS.center}>
        {markerLabel(universe, 'ton618')}
      </span>
      <span className={clsx(styles.label, styles.labelNote)} style={POS.scaleNote}>
        {universe.scale.scaleNote}
      </span>
    </div>
  );
});

// Nivel 2 · Vecindad cósmica
const CLUSTER_GRADIENT_ID = 'explorationClusterGlow';

export const NeighborhoodLayer = memo(function NeighborhoodLayer() {
  return (
    <div
      className={clsx(styles.layer, styles.layerNeighborhood)}
      data-level-id='cosmic-neighborhood'
    >
      <svg {...svgProps}>
        <defs>
          <radialGradient id={CLUSTER_GRADIENT_ID}>
            <stop className={styles.clusterCore} offset='0' />
            <stop className={styles.clusterMid} offset='0.4' />
            <stop className={styles.clusterEdge} offset='1' />
          </radialGradient>
        </defs>
        <path className={styles.web} d={NEIGHBORHOOD_PATH} />
        {CLUSTERS.map((cluster) => (
          <circle
            key={`${cluster.x}-${cluster.y}`}
            cx={cluster.x}
            cy={cluster.y}
            r={cluster.r}
            fill={`url(#${CLUSTER_GRADIENT_ID})`}
          />
        ))}
        <path className={clsx(styles.galaxies, styles.galaxiesMid)} d={neighborhoodGalaxies[0]} />
        <path
          className={clsx(styles.galaxies, styles.galaxiesBright)}
          d={neighborhoodGalaxies[1]}
        />
        <circle className={styles.halo} cx={CENTER} cy={CENTER} r={120} />
      </svg>

      <span className={clsx(styles.dot, styles.dotSelf)} style={POS.center} />
      <span className={clsx(styles.label, styles.labelRight, styles.labelSelf)} style={POS.center}>
        {markerLabel(neighborhood, 'ton618')}
      </span>
      <span className={clsx(styles.label, styles.labelEdge)} style={POS.milkyWay}>
        {markerLabel(neighborhood, 'milky-way')}
      </span>
      <span className={clsx(styles.label, styles.labelNote)} style={POS.scaleNote}>
        {neighborhood.scale.scaleNote}
      </span>
    </div>
  );
});

// Nivel 3 · Región del cielo
export const SkyRegionLayer = memo(function SkyRegionLayer() {
  return (
    <div className={clsx(styles.layer, styles.layerSky)} data-level-id='sky-region'>
      <svg {...svgProps}>
        <circle className={styles.chart} cx={CENTER} cy={CENTER} r={CHART_RADIUS} />
        {GRID.map((d) => (
          <path key={d} className={styles.grid} d={d} />
        ))}
        <path className={styles.constellation} d={skyLink} />
        <path className={clsx(styles.stars, styles.starsSmall)} d={skyStarsSmall} />
        <path className={clsx(styles.stars, styles.starsMid)} d={skyStarsMid} />
        <path className={clsx(styles.stars, styles.starsNamed)} d={skyNamedStars} />
      </svg>

      <span className={clsx(styles.dot, styles.dotSelf)} style={POS.center} />
      <span className={clsx(styles.label, styles.labelRight, styles.labelSelf)} style={POS.center}>
        {markerLabel(skyRegion, 'ton618')}
      </span>
      <span className={clsx(styles.label, styles.labelTitle)} style={POS.skyTitle}>
        {markerLabel(skyRegion, 'canes-venatici')}
        <span className={styles.labelSub}>{skyRegion.scale.scaleNote}</span>
      </span>
    </div>
  );
});

// Nivel 4 · TON 618 (representación artística)
const BH_HALO_ID = 'explorationHalo';
const BH_DISC_ID = 'explorationDisc';

export const TonLayer = memo(function TonLayer() {
  return (
    <div className={clsx(styles.layer, styles.layerTon)} data-level-id='ton618'>
      <svg {...svgProps}>
        <defs>
          <radialGradient id={BH_HALO_ID}>
            <stop className={styles.haloCore} offset='0.15' />
            <stop className={styles.haloMid} offset='0.5' />
            <stop className={styles.haloEdge} offset='1' />
          </radialGradient>
          <linearGradient id={BH_DISC_ID}>
            <stop className={styles.discEdge} offset='0' />
            <stop className={styles.discHot} offset='0.5' />
            <stop className={styles.discEdge} offset='1' />
          </linearGradient>
        </defs>
        <circle cx={CENTER} cy={CENTER} r={470} fill={`url(#${BH_HALO_ID})`} />
        <g transform={`rotate(-12 ${CENTER} ${CENTER})`}>
          <ellipse cx={CENTER} cy={CENTER} rx={300} ry={80} fill={`url(#${BH_DISC_ID})`} />
          <circle className={styles.hole} cx={CENTER} cy={CENTER} r={92} />
          <circle className={styles.photonRing} cx={CENTER} cy={CENTER} r={97} />
          <path
            d={`M200 ${CENTER}A300 80 0 0 0 800 ${CENTER}L600 ${CENTER}A100 14 0 0 1 400 ${CENTER}Z`}
            fill={`url(#${BH_DISC_ID})`}
            className={styles.discFront}
          />
        </g>
      </svg>

      <span className={clsx(styles.line, styles.lineGuide)} style={POS.guide} />
      <span
        className={clsx(styles.label, styles.labelRight, styles.labelSelf)}
        style={POS.tonLabel}
      >
        {markerLabel(ton, 'ton618')}
      </span>
      <span className={clsx(styles.label, styles.labelNote)} style={POS.scaleNote}>
        {ton.scale.scaleNote}
      </span>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Conjunto: estrellas persistentes + mapa
// ---------------------------------------------------------------------------
interface MapLayersProps {
  // Provisional (paso 4): nivel visible. El paso 5 lo sustituye por el zoom.
  level?: 1 | 2 | 3 | 4;
}

export function MapLayers({ level = 1 }: MapLayersProps) {
  return (
    <>
      <div className={styles.starLayer} aria-hidden='true' />
      <div className={styles.map} data-level={level} aria-hidden='true'>
        <UniverseLayer />
        <NeighborhoodLayer />
        <SkyRegionLayer />
        <TonLayer />
      </div>
    </>
  );
}
