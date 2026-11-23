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
// un valor algo mayor da un rayo que se curva claramente y escapa. Provisional (Paso 12).
export const RAY_IMPACT = 3.2;
