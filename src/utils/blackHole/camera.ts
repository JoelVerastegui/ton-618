import type { CameraState } from '../../interfaces/blackHole';
import {
  AUTO_TILTS,
  DEFAULT_AZIMUTH,
  DEG,
  MAX_DISTANCE,
  MAX_TILT,
  MIN_DISTANCE,
  TILT_AFTER_INPUT_HOLD,
  TILT_FIRST_HOLD,
  TILT_HOLD,
  TILT_TRANSITION,
} from './constants';
import { clamp } from './random';

export const clampDistance = (distance: number): number =>
  clamp(distance, MIN_DISTANCE, MAX_DISTANCE);

export const clampTilt = (tilt: number): number => clamp(tilt, -MAX_TILT, MAX_TILT);

export function createCameraState(distance: number): CameraState {
  const tilt = AUTO_TILTS[0] * DEG;
  return {
    azimuth: DEFAULT_AZIMUTH,
    tilt,
    distance: clampDistance(distance),
    tiltIndex: 0,
    tiltFrom: tilt,
    tiltTo: tilt,
    tiltTimer: 0,
    tiltHold: TILT_FIRST_HOLD,
  };
}

// Tras un gesto del usuario la inclinación se queda donde está y la automática espera.
export function resetAutoTilt(camera: CameraState): void {
  camera.tiltTimer = 0;
  camera.tiltHold = TILT_AFTER_INPUT_HOLD;
  camera.tiltFrom = camera.tilt;
  camera.tiltTo = camera.tilt;
}

// Deriva en reposo: el azimut gira y la inclinación recorre `AUTO_TILTS` (pausa, transición
// con smoothstep, siguiente).
export function driftCamera(camera: CameraState, dt: number): void {
  camera.azimuth += 0.045 * dt;
  camera.tiltTimer += dt;
  if (camera.tiltTimer > camera.tiltHold + TILT_TRANSITION) {
    camera.tiltTimer = 0;
    camera.tiltHold = TILT_HOLD;
    camera.tiltFrom = camera.tilt;
    camera.tiltIndex = (camera.tiltIndex + 1) % AUTO_TILTS.length;
    camera.tiltTo = AUTO_TILTS[camera.tiltIndex] * DEG;
  }
  if (camera.tiltTimer > camera.tiltHold) {
    const t = (camera.tiltTimer - camera.tiltHold) / TILT_TRANSITION;
    camera.tilt = camera.tiltFrom + (camera.tiltTo - camera.tiltFrom) * (t * t * (3 - 2 * t));
  }
}
