import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { PedestrianCoordinates } from '../schemas/pedestrian.schema';

export interface LocationPermissionState {
  permissionStatus: Location.PermissionStatus | null;
  currentLocation: PedestrianCoordinates | null;
  isRequestingPermission: boolean;
  errorMessage: string | null;
}

export const useLocationPermissions = (): LocationPermissionState => {
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [currentLocation, setCurrentLocation] = useState<PedestrianCoordinates | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const requestPermissions = async () => {
      if (Platform.OS === 'web') {
        setIsRequestingPermission(false);
        return;
      }

      setIsRequestingPermission(true);
      setErrorMessage(null);

      try {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (!isMounted) {
          return;
        }

        setPermissionStatus(permission.status);

        if (permission.status !== Location.PermissionStatus.GRANTED) {
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

    requestPermissions();

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
