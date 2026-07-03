import { useMemo } from 'react';
import type { NavigationCoordinates, ProximityMatch, ProximityTarget } from '../types/location.types';

export const PROXIMITY_RADAR_RADIUS_METERS = {
  min: 300,
  max: 500,
  default: 400,
} as const;

const EARTH_RADIUS_METERS = 6371000;

const toRadians = (value: number): number => (value * Math.PI) / 180;

export const getDistanceMeters = (
  origin: NavigationCoordinates,
  target: NavigationCoordinates
): number => {
  const latitudeDelta = toRadians(target.latitude - origin.latitude);
  const longitudeDelta = toRadians(target.longitude - origin.longitude);
  const originLatitude = toRadians(origin.latitude);
  const targetLatitude = toRadians(target.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(originLatitude) * Math.cos(targetLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const normalizeRadius = (radiusMeters?: number): number => {
  if (!radiusMeters) {
    return PROXIMITY_RADAR_RADIUS_METERS.default;
  }

  return Math.min(
    Math.max(radiusMeters, PROXIMITY_RADAR_RADIUS_METERS.min),
    PROXIMITY_RADAR_RADIUS_METERS.max
  );
};

interface ProximityRadarState {
  nearbyTargets: ProximityMatch[];
  nearestTarget: ProximityMatch | null;
  shouldAlert: boolean;
}

export const useProximityRadar = (
  currentLocation: NavigationCoordinates | null,
  targets: ProximityTarget[]
): ProximityRadarState =>
  useMemo(() => {
    if (!currentLocation) {
      return {
        nearbyTargets: [],
        nearestTarget: null,
        shouldAlert: false,
      };
    }

    const nearbyTargets = targets
      .map((target) => {
        const distanceMeters = getDistanceMeters(currentLocation, target.coordinate);
        const radiusMeters = normalizeRadius(target.radiusMeters);

        return {
          ...target,
          radiusMeters,
          distanceMeters,
          isInAlertRange: distanceMeters <= radiusMeters,
        };
      })
      .filter((target) => target.distanceMeters <= PROXIMITY_RADAR_RADIUS_METERS.max)
      .sort((first, second) => first.distanceMeters - second.distanceMeters);

    return {
      nearbyTargets,
      nearestTarget: nearbyTargets[0] ?? null,
      shouldAlert: nearbyTargets.some((target) => target.isInAlertRange),
    };
  }, [currentLocation, targets]);
