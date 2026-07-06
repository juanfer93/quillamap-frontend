import type {
  QuillaMapCoordinate,
  QuillaMapMode,
  QuillaMapProps,
  QuillaMapRoutePoint,
  QuillaMapShadeZone,
} from '../types/QuillaMap.types';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import {
  canOpenPlaceDetails,
  toPlacesNavigationMode,
} from '@/types/contracts/places.contract';
import { defaultPedestrianRoute, defaultShadeZones } from '../types/QuillaMap.constants';

export const getRouteCoordinates = (
  routePoints: QuillaMapRoutePoint[] | undefined,
  center: QuillaMapCoordinate
): QuillaMapCoordinate[] => {
  const points = routePoints && routePoints.length > 1 ? routePoints : defaultPedestrianRoute;
  return points.length > 1 ? points : [center];
};

export const getVisibleShadeZones = (
  shadeZones: QuillaMapShadeZone[] | undefined,
  showDefaultShadeZones = true
): QuillaMapShadeZone[] => {
  if (shadeZones && shadeZones.length > 0) {
    return shadeZones;
  }

  return showDefaultShadeZones ? defaultShadeZones : [];
};

export const getModeTitle = (mode: QuillaMapProps['mode']): string => {
  if (mode === 'pedestrian') return 'Modo Peaton';
  if (mode === 'tourist') return 'Modo Turista';
  if (mode === 'motorcycle') return 'Modo Moto';
  return 'Modo Carro';
};

export const getVisiblePlaces = (places: PlaceMapFeature[] | undefined): PlaceMapFeature[] =>
  places ?? [];

export const canInteractWithPlaces = (mode: QuillaMapMode): boolean =>
  canOpenPlaceDetails(toPlacesNavigationMode(mode));
