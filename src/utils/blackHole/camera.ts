import type { CameraState } from '../../interfaces/blackHole';
import { DEFAULT_AZIMUTH, INITIAL_TILT, MAX_DISTANCE, MAX_TILT, MIN_DISTANCE } from './constants';
import { clamp } from './random';

export const clampDistance = (distance: number): number =>
  clamp(distance, MIN_DISTANCE, MAX_DISTANCE);

export const clampTilt = (tilt: number): number => clamp(tilt, -MAX_TILT, MAX_TILT);

export function createCameraState(distance: number): CameraState {
  return {
    azimuth: DEFAULT_AZIMUTH,
    tilt: INITIAL_TILT,
    distance: clampDistance(distance),
  };
}
