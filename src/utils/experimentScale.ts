import { DEFAULT_DISTANCE, MAX_DISTANCE, MIN_DISTANCE } from './blackHole/constants';

// Constantes de presentación de la sección Experimento (SPEC 06). La distancia se mide en radios de
// Schwarzschild (rs = 1), igual que el motor. No van en `experiment.json`.

// Valor inicial de la distancia de la cámara (el del demo). El rango 7–60 es el del motor.
export const INITIAL_DISTANCE = DEFAULT_DISTANCE;

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

// Velocidad máxima del joystick en pantalla (rad/s): giro del acimut y de la inclinación.
export const ORBIT_RATE = 1.5;
export const TILT_RATE = 1;
