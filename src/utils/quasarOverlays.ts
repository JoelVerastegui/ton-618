import { CENTER, fmt } from '@/utils/geometry';

// Geometría de las superposiciones del cuásar (viewBox 0-1000, centro en 500, 500).
// Medidas sobre `quasar-1536.webp`: anillo de fotón de radio ≈ 42,7; el disco llega a
// ±157 en horizontal; la banda visible es muy fina (≈ 0,09 × radio), pero las partículas usan
// la proporción 0,26 de la spec para que se vean sobre el fondo y no se pierdan en la banda; los arcos de lente
// ocupan el anillo de radio 50-76 sobre y bajo la sombra (centro ≈ 500, 499).

// --- Horizonte -----------------------------------------------------------------
// Anillo discontinuo justo fuera del anillo de fotón de la imagen.
export const HORIZON_RADIUS = 46;

// --- Disco ---------------------------------------------------------------------
// Tres anillos de 8 partículas (frío → caliente, de fuera adentro). Se dibujan en el
// plano del disco (círculos) y el grupo estático las aplasta con `DISK_RATIO`; las
// partículas se contraen con el `scale` del anillo. Cada anillo ocupa dos arcos
// (derecha e izquierda del agujero): así, con el giro y la contracción, ninguna llega
// a pasar por delante de la sombra (radio ≈ 43).
export const DISK_RATIO = 0.26;

export interface DiskParticle {
  x: number;
  y: number;
}

export interface DiskRing {
  id: 'outer' | 'mid' | 'inner';
  particles: DiskParticle[];
}

const RING_RADII = [
  ['outer', 140],
  ['mid', 115],
  ['inner', 92],
] as const;
// Posiciones angulares (°) dentro de cada arco; el desfase por anillo evita alinearlas.
const ARC_ANGLES = [-34, -20, 20, 34];

export const DISK_RINGS: DiskRing[] = RING_RADII.map(([id, radius], ring) => ({
  id,
  particles: [0, 180].flatMap((side) =>
    ARC_ANGLES.map((angle) => {
      const rad = ((angle + side + ring * 4) * Math.PI) / 180;
      return { x: fmt(radius * Math.cos(rad)), y: fmt(radius * Math.sin(rad)) };
    })
  ),
}));

// --- Lente ---------------------------------------------------------------------
// Arcos de circunferencia sobre (ángulos 205°-335°) y bajo la sombra (25°-155°).
const arc = (radius: number, from: number, to: number) => {
  const point = (deg: number) => {
    const rad = (deg * Math.PI) / 180;
    return `${fmt(CENTER + radius * Math.cos(rad))} ${fmt(499 + radius * Math.sin(rad))}`;
  };
  return `M${point(from)}A${radius} ${radius} 0 0 1 ${point(to)}`;
};

export const LENS_ARCS = [
  arc(54, 205, 335),
  arc(62, 205, 335),
  arc(70, 207, 333),
  arc(52, 25, 155),
  arc(60, 27, 153),
];
