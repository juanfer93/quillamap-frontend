import type {
  QuillaMapCoordinate,
  QuillaMapProps,
  QuillaMapRoutePoint,
  QuillaMapShadeZone,
} from './QuillaMap.types';

export const defaultPedestrianRoute: QuillaMapRoutePoint[] = [
  { id: 'route-1', latitude: 10.9849, longitude: -74.7907 },
  { id: 'route-2', latitude: 10.9862, longitude: -74.7896 },
  { id: 'route-3', latitude: 10.9875, longitude: -74.7898 },
  { id: 'route-4', latitude: 10.9884, longitude: -74.7888 },
  { id: 'route-5', latitude: 10.9895, longitude: -74.7881 },
  { id: 'route-6', latitude: 10.9904, longitude: -74.7869 },
];

export const defaultShadeZones: QuillaMapShadeZone[] = [
  {
    id: 'demo-shade-1',
    title: 'Zona de Sombra',
    description: 'Refugio solar cercano',
    coordinate: { latitude: 10.9901, longitude: -74.7893 },
    radiusMeters: 280,
  },
  {
    id: 'demo-shade-2',
    title: 'Ruta arborizada',
    description: 'Tramo con cobertura vegetal',
    coordinate: { latitude: 10.9867, longitude: -74.7869 },
    radiusMeters: 220,
  },
  {
    id: 'demo-shade-3',
    title: 'Parque fresco',
    description: 'Cobertura vegetal cercana',
    coordinate: { latitude: 10.9842, longitude: -74.7917 },
    radiusMeters: 190,
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
