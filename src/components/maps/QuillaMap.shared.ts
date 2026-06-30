import type {
  QuillaMapCoordinate,
  QuillaMapProps,
  QuillaMapRoutePoint,
  QuillaMapShadeZone,
} from './QuillaMap.types';

export const defaultPedestrianRoute: QuillaMapRoutePoint[] = [
  { id: 'route-1', latitude: 10.9869, longitude: -74.7897 },
  { id: 'route-2', latitude: 10.9882, longitude: -74.7889 },
  { id: 'route-3', latitude: 10.9891, longitude: -74.7894 },
  { id: 'route-4', latitude: 10.9901, longitude: -74.7879 },
];

export const defaultShadeZones: QuillaMapShadeZone[] = [
  {
    id: 'demo-shade-1',
    title: 'Zona de Sombra',
    description: 'Refugio solar cercano',
    coordinate: { latitude: 10.9878, longitude: -74.7889 },
    radiusMeters: 360,
  },
  {
    id: 'demo-shade-2',
    title: 'Ruta arborizada',
    description: 'Tramo con cobertura vegetal',
    coordinate: { latitude: 10.9893, longitude: -74.7879 },
    radiusMeters: 260,
  },
];

export const getRouteCoordinates = (
  routePoints: QuillaMapRoutePoint[] | undefined,
  center: QuillaMapCoordinate
): QuillaMapCoordinate[] => {
  const points = routePoints && routePoints.length > 1 ? routePoints : defaultPedestrianRoute;
  return points.length > 1 ? points : [center];
};

export const getVisibleShadeZones = (
  shadeZones: QuillaMapShadeZone[] | undefined
): QuillaMapShadeZone[] => (shadeZones && shadeZones.length > 0 ? shadeZones : defaultShadeZones);

export const getModeTitle = (mode: QuillaMapProps['mode']): string => {
  if (mode === 'pedestrian') return 'Modo Peaton';
  if (mode === 'tourist') return 'Modo Turista';
  if (mode === 'motorcycle') return 'Modo Moto';
  return 'Modo Carro';
};
