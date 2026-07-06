import type { QuillaMapRoutePoint, QuillaMapShadeZone } from './QuillaMap.types';

export const DEFAULT_TILE_ZOOM = 16;
export const MIN_TILE_ZOOM = 14;
export const MAX_TILE_ZOOM = 18;
export const TILE_SIZE = 256;

export const MIN_NATIVE_DELTA = 0.002;
export const MAX_NATIVE_DELTA = 0.08;

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
