export const INITIAL_PEDESTRIAN_ZOOM = 16;
export const INITIAL_DEFAULT_ZOOM = 15;
export const PLACES_MIN_VISIBLE_ZOOM = 14.75;
export const PLACES_FADE_START_ZOOM = 14.75;
export const PLACES_FULL_OPACITY_ZOOM = 16;
export const PLACES_MAX_VISIBLE_ZOOM = 19;
export const CAMERA_ANIMATION_DURATION_MS = 520;

const CARDINAL_BEARINGS = [0, 90, 180, 270] as const;
type CardinalBearing = typeof CARDINAL_BEARINGS[number];

export const normalizeBearing = (bearing: number): number => ((bearing % 360) + 360) % 360;

export const getCompassBearing = (cameraBearing: number): number => normalizeBearing(-cameraBearing);

export const getNextCardinalBearing = (cameraBearing: number): CardinalBearing => {
  const normalizedBearing = normalizeBearing(cameraBearing);
  const currentIndex = CARDINAL_BEARINGS.findIndex((bearing) => Math.abs(bearing - normalizedBearing) < 0.5);

  return currentIndex >= 0 ? CARDINAL_BEARINGS[(currentIndex + 1) % CARDINAL_BEARINGS.length] : 0;
};
