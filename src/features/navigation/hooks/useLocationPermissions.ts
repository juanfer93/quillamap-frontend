import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
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

const toPermissionStatus = (status: Location.PermissionStatus): LocationPermissionStatus => {
  if (status === Location.PermissionStatus.GRANTED) {
    return 'granted';
  }

  if (status === Location.PermissionStatus.DENIED) {
    return 'denied';
  }

  return 'prompt';
};

export const useLocationPermissions = (): LocationPermissionState => {
  const [permissionStatus, setPermissionStatus] = useState<LocationPermissionStatus>('prompt');
  const [currentLocation, setCurrentLocation] = useState<NavigationCoordinates | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestBrowserLocation = () => {
      const geolocation = getBrowserGeolocation();
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

    const requestNativeLocation = async () => {
      setIsRequestingPermission(true);
      setErrorMessage(null);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        const status = toPermissionStatus(permission.status);
        setPermissionStatus(status);

        if (status !== 'granted') {
          setCurrentLocation(null);
          setErrorMessage('Permiso de ubicacion denegado');
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) {
          return;
        }

        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      } catch (error: unknown) {
        if (!isMounted) {
          return;
        }

        const message = error instanceof Error ? error.message : 'No fue posible solicitar la ubicacion';
        setPermissionStatus(null);
        setCurrentLocation(null);
        setErrorMessage(message);
      } finally {
        if (isMounted) {
          setIsRequestingPermission(false);
        }
      }
    };

    if (Platform.OS === 'web') {
      requestBrowserLocation();
    } else {
      void requestNativeLocation();
    }

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
