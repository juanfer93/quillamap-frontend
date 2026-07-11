import { useEffect, useState } from 'react';
import { metersPerSecondToKmh } from '../utils/drivingLock';

interface VelocityGuardState {
  speedKmh: number;
}

interface BrowserSpeedCoordinates {
  speed?: number | null;
}

interface BrowserGeolocationPosition {
  coords: BrowserSpeedCoordinates;
}

interface BrowserGeolocation {
  clearWatch: (watchId: number) => void;
  watchPosition: (
    onSuccess: (position: BrowserGeolocationPosition) => void,
    onError?: () => void,
    options?: BrowserGeolocationOptions
  ) => number;
}

interface BrowserNavigator {
  geolocation?: BrowserGeolocation;
}

interface BrowserGeolocationOptions {
  enableHighAccuracy: boolean;
  maximumAge: number;
  timeout: number;
}

const getBrowserGeolocation = (): BrowserGeolocation | undefined => {
  const runtime = globalThis as typeof globalThis & { navigator?: BrowserNavigator };
  return runtime.navigator?.geolocation;
};

export const useVelocityGuard = (): VelocityGuardState => {
  const [speedKmh, setSpeedKmh] = useState(0);

  useEffect(() => {
    const geolocation = getBrowserGeolocation();
    if (!geolocation?.watchPosition) {
      return undefined;
    }

    const watchId = geolocation.watchPosition(
      (position) => setSpeedKmh(metersPerSecondToKmh(position.coords.speed)),
      () => setSpeedKmh(0),
      { enableHighAccuracy: true, maximumAge: 1500, timeout: 8000 }
    );

    return () => {
      geolocation.clearWatch(watchId);
    };
  }, []);

  return { speedKmh };
};
