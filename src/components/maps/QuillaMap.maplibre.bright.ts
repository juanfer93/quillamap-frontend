import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { QuillaMapCoordinate, QuillaMapRoutePoint, QuillaMapShadeZone } from './QuillaMap.types';

export const DARK_MAP_THEME = {
  background: '#26364D',
  controlBackground: '#111B2A',
  controlBorder: '#4B607C',
  controlText: '#F9D84A',
};

export const MAPLIBRE_STYLE: any = {
  version: 8,
  sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'] as string[], tileSize: 256, attribution: '© OpenStreetMap contributors' } },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

export const DARK_MAPLIBRE_STYLE: any = {
  version: 8,
  sources: { cartoDark: { type: 'raster', tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'] as string[], tileSize: 256, maxzoom: 20, attribution: '© OpenStreetMap contributors © CARTO' } },
  layers: [
    { id: 'dark-background', type: 'background', paint: { 'background-color': DARK_MAP_THEME.background } },
    {
      id: 'carto-dark',
      type: 'raster',
      source: 'cartoDark',
      paint: {
        'raster-hue-rotate': 0,
        'raster-saturation': 0.08,
        'raster-contrast': -0.8,
        'raster-brightness-min': 0.56,
        'raster-brightness-max': 0.94,
        'raster-opacity': 0.88,
      },
    },
  ],
};

export const getMapLibreStyle = (mode: 'light' | 'dark' = 'light') => mode === 'dark' ? DARK_MAPLIBRE_STYLE : MAPLIBRE_STYLE;
export const SHADE_MARKER_EMOJI = '☂';

const earth = 6_371_008.8;
const toRad = (n: number) => (n * Math.PI) / 180;
const toDeg = (n: number) => (n * 180) / Math.PI;
const point = (coordinate: QuillaMapCoordinate) => ({ type: 'Point' as const, coordinates: [coordinate.longitude, coordinate.latitude] });

const radiusPolygon = (center: QuillaMapCoordinate, radius: number) => {
  const lat0 = toRad(center.latitude);
  const lon0 = toRad(center.longitude);
  const distance = Math.max(radius, 1) / earth;
  const ring: [number, number][] = [];
  for (let step = 0; step <= 48; step += 1) {
    const bearing = (2 * Math.PI * step) / 48;
    const lat = Math.asin(Math.sin(lat0) * Math.cos(distance) + Math.cos(lat0) * Math.sin(distance) * Math.cos(bearing));
    const lon = lon0 + Math.atan2(Math.sin(bearing) * Math.sin(distance) * Math.cos(lat0), Math.cos(distance) - Math.sin(lat0) * Math.sin(lat));
    ring.push([toDeg(lon), toDeg(lat)]);
  }
  return [ring];
};

export const getRouteFeature = (route: QuillaMapRoutePoint[] | QuillaMapCoordinate[]) => ({ type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: route.map((item) => [item.longitude, item.latitude]) } });
export const getShadeZonesFeatureCollection = (zones: QuillaMapShadeZone[]) => ({ type: 'FeatureCollection' as const, features: zones.map((zone) => ({ type: 'Feature' as const, id: zone.id, properties: { id: zone.id, title: zone.title, radiusMeters: zone.radiusMeters }, geometry: point(zone.coordinate) })) });
export const getShadeZoneAreasFeatureCollection = (zones: QuillaMapShadeZone[]) => ({ type: 'FeatureCollection' as const, features: zones.map((zone) => ({ type: 'Feature' as const, id: `shade-area-${zone.id}`, properties: { id: zone.id, title: zone.title, radiusMeters: zone.radiusMeters }, geometry: { type: 'Polygon' as const, coordinates: radiusPolygon(zone.coordinate, zone.radiusMeters) } })) });
export const getCoordinateFeatureCollection = (coordinate: QuillaMapCoordinate | null | undefined, id: string) => ({ type: 'FeatureCollection' as const, features: coordinate ? [{ type: 'Feature' as const, id, properties: { id }, geometry: point(coordinate) }] : [] });
export const getPlacesFeatureCollection = (places: PlaceMapFeature[]) => ({ type: 'FeatureCollection' as const, features: places.map((place) => ({ type: 'Feature' as const, id: place.id, properties: { id: place.id, source: place.source, category: place.category, title: place.name.es, isTouristSite: place.source === 'tourist_site' }, geometry: point(place.coordinate) })) });
export const getBuildingsFeatureCollection = (places: PlaceMapFeature[]) => ({ type: 'FeatureCollection' as const, features: places.flatMap((place) => {
  const polygon = place.metadata?.polygon;
  const height = place.metadata?.buildingHeightMeters;
  return polygon && height ? [{ type: 'Feature' as const, id: `building-${place.id}`, properties: { id: place.id, source: place.source, color: place.source === 'tourist_site' ? '#D4AF37' : '#004574', height, base: place.metadata?.extrusionBaseMeters ?? 0 }, geometry: polygon }] : [];
}) });
