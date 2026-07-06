import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import type {
  LocationPermissionState,
  LocationPermissionStatus,
  NavigationCoordinates,
} from '../types/location.types';

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

    void requestNativeLocation();

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
