import { useEffect, useState } from 'react';
import { PedestrianCoordinates } from '../schemas/pedestrian.schema';

interface BrowserGeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
  };
}

interface BrowserGeolocationError {
  code: number;
  message?: string;
  PERMISSION_DENIED: number;
}

interface BrowserGeolocation {
  getCurrentPosition: (
    onSuccess: (position: BrowserGeolocationPosition) => void,
    onError: (error: BrowserGeolocationError) => void,
    options: {
      enableHighAccuracy: boolean;
      timeout: number;
      maximumAge: number;
    }
  ) => void;
}

interface BrowserNavigator {
  geolocation?: BrowserGeolocation;
}

export interface LocationPermissionState {
  permissionStatus: 'granted' | 'denied' | 'prompt' | null;
  currentLocation: PedestrianCoordinates | null;
  isRequestingPermission: boolean;
  errorMessage: string | null;
}

export const useLocationPermissions = (): LocationPermissionState => {
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | null>('prompt');
  const [currentLocation, setCurrentLocation] = useState<PedestrianCoordinates | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestBrowserLocation = async () => {
      const browserRuntime = globalThis as unknown as { navigator?: BrowserNavigator };
      const geolocation = browserRuntime.navigator?.geolocation;

      setIsRequestingPermission(true);
      setErrorMessage(null);

      if (!geolocation) {
        setPermissionStatus(null);
        setCurrentLocation(null);
        setErrorMessage('Este navegador no soporta ubicacion');
        setIsRequestingPermission(false);
        return;
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
    };

    requestBrowserLocation();

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
