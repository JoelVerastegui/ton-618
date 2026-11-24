// Constantes del motor del agujero negro (port del demo «Black Hole» de Emergent Mind). Los
// valores son los del demo: no se retocan para no alterar la equivalencia visual.

export const TAU = 2 * Math.PI;
export const DEG = Math.PI / 180;

// --- Geodésicas (agujero negro de Schwarzschild, rs = 1) ---------------------------------------
// Radio crítico de captura en parámetro de impacto: 3√3/2 rs.
export const B_CRIT = 1.5 * Math.sqrt(3);
// Paso angular de las muestras de la tabla y subpasos de RK4 por muestra.
export const DPSI = 0.02;
export const SUBSTEPS = 8;
// Ángulo máximo que se integra por rayo (más de dos vueltas y media).
export const PSI_MAX = 5 * Math.PI;
export const SAMPLES = Math.ceil(PSI_MAX / DPSI) + 3;
// Filas por lado de B_CRIT (rayos que caen / rayos que escapan); espaciado logarítmico.
export const SIDE_ROWS = 560;
export const ROWS = 2 * SIDE_ROWS;
export const LOG_MIN = Math.log(1e-6);
export const LOG_YMAX = Math.log(90 / B_CRIT - 1);

// --- Disco de acreción -------------------------------------------------------------------------
export const R_IN = 3;
export const R_OUT = 15;
// Bandas radiales y texels por banda de la textura de gas.
export const BANDS = 160;
export const TEX = 1024;
// Cruces del rayo con el disco que se acumulan (frontal, anillo de fotones, trasero).
export const MAX_HITS = 3;
// Escala de la rotación diferencial del gas.
export const SPIN = 2.4;

// --- Cielo -------------------------------------------------------------------------------------
export const BG_W = 1024;
export const BG_H = 512;
// Rejilla de estrellas lensadas (el doble que el cielo en ancho).
export const STAR_U = 2048;

// --- Color y tone mapping ----------------------------------------------------------------------
export const EMISSION_LUT_SIZE = 512;
export const TONE_LUT_SIZE = 4096;
export const TONE_RANGE = 10;

// --- Cámara ------------------------------------------------------------------------------------
export const MIN_DISTANCE = 7;
export const MAX_DISTANCE = 60;
export const DEFAULT_DISTANCE = 30;
export const DEFAULT_AZIMUTH = 0.6;
// Inclinación inicial de la cámara (2,5°); solo cambia si la persona la mueve.
export const INITIAL_TILT = 2.5 * DEG;
export const MAX_TILT = 1.45;
// Deriva constante del fondo respecto al agujero negro (rad/s): el azimut avanza despacio.
export const AZIMUTH_DRIFT = 0.01;

// --- Render progresivo -------------------------------------------------------------------------
export const SCALE_MIN_COARSE = 0.18;
export const SCALE_MAX_COARSE = 0.5;
export const SCALE_MIN_FINE = 0.4;
export const FINE_DELAY = 0.08;
// Tiempo máximo (ms) que la pasada fina puede ocupar en un fotograma, y filas por trozo.
export const FINE_SLICE_MS = 9;
export const FINE_ROWS_PER_CHUNK = 6;

// --- Pasos de entrada (teclas y botones en pantalla) -----------------------------------------
// Giro del acimut y de la inclinación por pulsación (rad) y factores de distancia por pulsación.
export const ORBIT_STEP = 0.12;
export const TILT_STEP = 0.06;
export const ZOOM_IN_FACTOR = 0.9;
export const ZOOM_OUT_FACTOR = 1.1;
