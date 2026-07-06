import { useEffect, useState } from 'react';
import type {
  LocationPermissionState,
  LocationPermissionStatus,
  NavigationCoordinates,
} from '../types/location.types';

interface BrowserGeolocationPosition {
  coords: NavigationCoordinates;
}

interface BrowserGeolocationError {
  code: number;
  message?: string;
  PERMISSION_DENIED: number;
}

interface BrowserGeolocationOptions {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
}

interface BrowserGeolocation {
  getCurrentPosition: (
    onSuccess: (position: BrowserGeolocationPosition) => void,
    onError: (error: BrowserGeolocationError) => void,
    options: BrowserGeolocationOptions
  ) => void;
}

interface BrowserNavigator {
  geolocation?: BrowserGeolocation;
}

const getBrowserGeolocation = (): BrowserGeolocation | undefined => {
  const runtime = globalThis as typeof globalThis & { navigator?: BrowserNavigator };
  return runtime.navigator?.geolocation;
};

export const useLocationPermissions = (): LocationPermissionState => {
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('prompt');
  const [currentLocation, setCurrentLocation] = useState<NavigationCoordinates | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const geolocation = getBrowserGeolocation();

    setIsRequestingPermission(true);
    setErrorMessage(null);

    if (!geolocation) {
      setPermissionStatus(null);
      setCurrentLocation(null);
      setErrorMessage('Este navegador no soporta ubicacion');
      setIsRequestingPermission(false);
      return () => {
        isMounted = false;
      };
    }

    geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) {
          return;
        }

        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setPermissionStatus('granted');
        setIsRequestingPermission(false);
      },
      (error) => {
        if (!isMounted) {
          return;
        }

        setCurrentLocation(null);
        setPermissionStatus(error.code === error.PERMISSION_DENIED ? 'denied' : null);
        setErrorMessage(error.message || 'No fue posible obtener tu ubicacion');
        setIsRequestingPermission(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000,
      }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    permissionStatus,
    currentLocation,
    isRequestingPermission,
    errorMessage,
  };
};
