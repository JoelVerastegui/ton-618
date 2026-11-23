// Constantes de presentación de la sección Experimento (SPEC 06). La distancia se mide en radios de
// Schwarzschild (rs = 1), igual que el motor. No van en `experiment.json`.

// Rango y valor inicial de la distancia de la cámara (el inicial es el del demo).
export const MIN_DISTANCE = 7;
export const MAX_DISTANCE = 60;
export const INITIAL_DISTANCE = 30;

// Distancia a partir de la cual empieza la deformación de la tarjeta (`--tidal` = 0 en adelante);
// llega a 1 en `MIN_DISTANCE`. Provisional: se calibra en el Paso 12.
export const TIDAL_START = 14;

// Parámetro de impacto del rayo del diagrama, en rs. El radio crítico de captura es 3√3/2 ≈ 2,6:
// con 4,5 el rayo se curva unos 40° y escapa, y sigue siendo legible a cualquier distancia. Provisional (Paso 12).
export const RAY_IMPACT = 4.5;

// Posición del deslizante (0…SLIDER_MAX) y distancia, en escala logarítmica: el recorrido se
// reparte por igual entre cada factor de distancia. Izquierda = lejos (60), derecha = cerca (7).
export const SLIDER_MAX = 1000;

const LOG_SPAN = Math.log(MAX_DISTANCE / MIN_DISTANCE);

export const distanceToSlider = (distance: number): number =>
  Math.round((Math.log(MAX_DISTANCE / distance) / LOG_SPAN) * SLIDER_MAX);

export const sliderToDistance = (position: number): number =>
  MAX_DISTANCE * Math.exp((-position / SLIDER_MAX) * LOG_SPAN);

// Texto de `aria-valuetext` a partir de la plantilla del JSON.
export const formatDistance = (template: string, distance: number): string =>
  template.replace('{value}', String(Math.round(distance)));
