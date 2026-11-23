export interface BlackHoleOptions {
  preview?: boolean; // modo miniatura del demo: resolución fija 0,75, sin entrada de usuario
  maxDpr?: number; // tope del DPR del canvas, por defecto 1,25
  captureWheel?: boolean; // la rueda hace zoom y no scroll de página, por defecto false
  distance?: number; // 7…60 radios de Schwarzschild, por defecto 30
  autoDrift?: boolean; // deriva automática de la cámara, por defecto true
  gridAmount?: number; // 0…1, mezcla de la cuadrícula lensada, por defecto 0
  reducedMotion?: boolean; // detiene deriva y rotación del gas
  onError?: (error: unknown) => void;
}

// Parte del motor que se controla desde fuera (deslizante, conmutadores).
export interface BlackHoleControls {
  distance: number; // lectura y escritura, se acota a 7…60
  azimuth: number; // radianes
  tilt: number; // radianes, se acota a ±1,45
  autoDrift: boolean;
  gridAmount: number; // 0…1, se acota
  reducedMotion: boolean; // detiene deriva y rotación del gas
  destroy: () => void;
}

export interface BlackHoleEngine extends BlackHoleControls {
  // Fija el tamaño CSS del canvas y el DPR (ya acotado) y reinicia el render progresivo.
  resize: (width: number, height: number, dpr: number) => void;
  // Avanza `dt` segundos (ya acotado por el bucle) y dibuja un fotograma.
  frame: (dt: number) => void;
  // Marca actividad del usuario: la deriva espera `IDLE_SECONDS` desde la última.
  touch: () => void;
  // Arrastre en curso: durante él no hay deriva de inclinación.
  grab: () => void;
  release: () => void;
  // Gira la cámara; la inclinación automática espera tras el gesto.
  orbitBy: (azimuthDelta: number, tiltDelta: number) => void;
}

// Tabla de geodésicas: u(ψ) = 1/r por parámetro de impacto, integrada una vez con RK4.
export interface GeodesicTable {
  samples: Float32Array; // ROWS × SAMPLES: u(ψ) muestreada cada DPSI
  end: Float64Array; // ψ al que acaba cada rayo (cae o escapa)
  escape: Uint8Array; // 1 si el rayo escapa, 0 si lo captura el agujero negro
  peak: Int32Array; // muestra del máximo de u (punto más cercano)
  startPsi: Float64Array; // ψ en que u = 1/distancia por fila (-1 si no llega); depende de la cámara
}

export interface BlackHoleAssets {
  table: GeodesicTable;
  diskTexture: Float32Array; // BANDS × TEX, intensidad del gas
  sky: Uint32Array; // BG_W × BG_H, RGBA
  emissionRed: Float32Array; // color del cuerpo negro por temperatura (LUT)
  emissionGreen: Float32Array;
  emissionBlue: Float32Array;
  bandSpeed: Float32Array; // velocidad angular del gas por banda (rotación diferencial)
  maxIntensity: number; // normaliza la emisión del disco
  toneLut: Uint8Array; // tone mapping de 0…TONE_RANGE a 0…255
}

// Estadísticas del cálculo inicial diferido (SPEC 06).
export interface PrepareStats {
  totalMs: number; // desde el inicio hasta el final, incluidos los cedidos al navegador
  workMs: number; // tiempo de CPU del cálculo
  longestChunkMs: number; // trozo más largo sin ceder el hilo
}

export interface CameraState {
  azimuth: number;
  tilt: number;
  distance: number;
  tiltIndex: number; // inclinación automática en curso
  tiltFrom: number;
  tiltTo: number;
  tiltTimer: number;
  tiltHold: number; // segundos de pausa antes de la siguiente transición
}

// Geometría del trazado de rayos para un tamaño de render: por píxel hasta MAX_HITS cruces con el
// disco y la coordenada del cielo por donde sale el rayo.
export interface TracePass {
  width: number;
  height: number;
  fine: boolean; // pasada fina completa
  hits: Uint8Array;
  band: Float32Array;
  angle: Float32Array;
  red: Float32Array;
  green: Float32Array;
  blue: Float32Array;
  alpha: Float32Array;
  skyU: Float32Array;
  skyV: Float32Array; // -1 si el rayo cae al agujero negro
  row: number; // siguiente fila por trazar (pasada por trozos)
  span: number; // ángulo por píxel (rad)
  version: number; // versión de cámara para la que se trazó (0 = ninguna)
}

// Punto del plano del rayo, en radios de Schwarzschild (el agujero negro en el origen).
export interface RayPoint {
  x: number;
  y: number;
}

// Geometría ya lista para el diagrama SVG del rayo de luz (eje y hacia abajo).
export interface RayDiagram {
  viewBox: string;
  straight: string; // `d` del trazo recto
  bent: string; // `d` del trazo curvado por la gravedad
  camera: string; // `d` de un punto (la cámara)
}
