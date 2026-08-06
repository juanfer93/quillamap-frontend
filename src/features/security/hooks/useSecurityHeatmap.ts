import { useEffect } from 'react';
import { reportsApi } from '@/api';
import { PROXIMITY_RADAR_RADIUS_METERS } from '@/features/navigation/hooks/useProximityRadar';
import type { NavigationCoordinates } from '@/features/navigation/types/location.types';
import { useSecurityMapStore } from '../store/useSecurityMapStore';

interface UseSecurityHeatmapOptions {
  center: NavigationCoordinates;
  enabled: boolean;
  isDrivingLockActive?: boolean;
  radiusMeters?: number;
}

export const SECURITY_HEATMAP_LOOKUP_RADIUS_METERS = 5_000;

export const useSecurityHeatmap = ({
  center,
  enabled,
  isDrivingLockActive = false,
  radiusMeters = SECURITY_HEATMAP_LOOKUP_RADIUS_METERS,
}: UseSecurityHeatmapOptions) => {
  const setSecurityHeatmap = useSecurityMapStore((state) => state.setSecurityHeatmap);
  const setSecurityMapError = useSecurityMapStore((state) => state.setSecurityMapError);
  const setSecurityMapLoading = useSecurityMapStore((state) => state.setSecurityMapLoading);

  useEffect(() => {
    let isMounted = true;

    if (!enabled) {
      setSecurityHeatmap(null);
      setSecurityMapLoading(false);
      setSecurityMapError(null);
      return () => {
        isMounted = false;
      };
    }

    setSecurityMapLoading(true);
    reportsApi
      .findSecurityHeatmap({
        lat: center.latitude,
        lng: center.longitude,
        radius: radiusMeters,
        criticalOnly: isDrivingLockActive,
        proximityRadius: isDrivingLockActive ? PROXIMITY_RADAR_RADIUS_METERS.max : undefined,
      })
      .then((heatmap) => {
        if (isMounted) {
          setSecurityHeatmap(heatmap);
          setSecurityMapLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSecurityHeatmap(null);
          setSecurityMapError('No se pudo cargar el mapa de seguridad.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    center.latitude,
    center.longitude,
    enabled,
    isDrivingLockActive,
    radiusMeters,
    setSecurityHeatmap,
    setSecurityMapError,
    setSecurityMapLoading,
  ]);
};
