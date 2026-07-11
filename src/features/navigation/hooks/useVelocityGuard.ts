import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { metersPerSecondToKmh } from '../utils/drivingLock';

interface VelocityGuardState {
  speedKmh: number;
}

export const useVelocityGuard = (): VelocityGuardState => {
  const [speedKmh, setSpeedKmh] = useState(0);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startWatch = async () => {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        return;
      }

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: 8,
          timeInterval: 1500,
        },
        (position) => {
          if (isMounted) {
            setSpeedKmh(metersPerSecondToKmh(position.coords.speed));
          }
        }
      );
    };

    void startWatch().catch(() => undefined);

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  return { speedKmh };
};
