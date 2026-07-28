export const TRANSIT_WALKING_COMPLEX_MENU_LOCK_THRESHOLD_KMH = 6;
export const TRANSIT_BUS_COMPLEX_MENU_LOCK_THRESHOLD_KMH = 15;

export const isTransitComplexUiLocked = (
  speedKmh: number,
  hasActiveTransitItinerary: boolean,
  isCopilot: boolean
): boolean =>
  hasActiveTransitItinerary &&
  !isCopilot &&
  speedKmh >= TRANSIT_WALKING_COMPLEX_MENU_LOCK_THRESHOLD_KMH;

export const getTransitMotionLabel = (speedKmh: number): 'quieto' | 'caminando' | 'bus' =>
  speedKmh >= TRANSIT_BUS_COMPLEX_MENU_LOCK_THRESHOLD_KMH
    ? 'bus'
    : speedKmh >= TRANSIT_WALKING_COMPLEX_MENU_LOCK_THRESHOLD_KMH
      ? 'caminando'
      : 'quieto';
