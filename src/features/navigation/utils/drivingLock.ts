export const DRIVING_LOCK_THRESHOLD_KMH = 15;

export const isNavigationUiLocked = (
  speedKmh: number,
  isCopilot: boolean,
  hasActiveRoute: boolean
): boolean => hasActiveRoute && speedKmh > DRIVING_LOCK_THRESHOLD_KMH && !isCopilot;

export const metersPerSecondToKmh = (speedMetersPerSecond: number | null | undefined): number =>
  Math.max(0, (speedMetersPerSecond ?? 0) * 3.6);
