import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type {
  QuillaMapCoordinate,
  QuillaMapRoutePoint,
  QuillaMapShadeZone,
} from './QuillaMap.types';

export const DARK_MAP_THEME = {
  background: '#1D2737',
  controlBackground: '#101622',
  controlBorder: '#2D3A4F',
  controlText: '#F4CD2F',
};

export const MAPLIBRE_STYLE: any = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'] as string[],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

/**
 * Waze-inspired dark basemap: deep navy surface, desaturated slate roads and
 * muted green land areas. It intentionally uses a separate raster source so
 * web and native render the same dark cartography instead of dimming controls
 * over the light OpenStreetMap tiles.
 */
export const DARK_MAPLIBRE_STYLE: any = {
  version: 8,
  sources: {
    cartoDark: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'] as string[],
      tileSize: 256,
      maxzoom: 20,
      attribution: '© OpenStreetMap contributors © CARTO',
    },
  },
  layers: [
    {
      id: 'dark-background',
      type: 'background',
      paint: {
        'background-color': DARK_MAP_THEME.background,
      },
    },
    {
      id: 'carto-dark',
      type: 'raster',
      source: 'cartoDark',
      paint: {
        'raster-hue-rotate': -8,
        'raster-saturation': -0.18,
        'raster-contrast': 0.16,
        'raster-brightness-min': 0.08,
        'raster-brightness-max': 0.72,
      },
    },
  ],
};

export const getMapLibreStyle = (themeMode: 'light' | 'dark' = 'light') => (
  themeMode === 'dark' ? DARK_MAPLIBRE_STYLE : MAPLIBRE_STYLE
);

export const SHADE_MARKER_EMOJI = '☂';

const EARTH_RADIUS_METERS = 6_371_008.8;
const DEFAULT_CIRCLE_STEPS = 48;

const toRadians = (value: number): number => (value * Math.PI) / 180;
const toDegrees = (value: number): number => (value * 180) / Math.PI;

const pointGeometry = (coordinate: QuillaMapCoordinate) => ({
  type: 'Point' as const,
  coordinates: [coordinate.longitude, coordinate.latitude],
});

/**
 * Creates a geodesic polygon for a radius measured in meters. CircleLayer uses
 * screen pixels, so it cannot represent a real shadow-zone coverage area.
 */
const getRadiusPolygon = (
  center: QuillaMapCoordinate,
  radiusMeters: number,
  steps = DEFAULT_CIRCLE_STEPS
) => {
  const centerLatitude = toRadians(center.latitude);
  const centerLongitude = toRadians(center.longitude);
  const angularDistance = Math.max(radiusMeters, 1) / EARTH_RADIUS_METERS;
  const coordinates: [number, number][] = [];

  for (let step = 0; step <= steps; step += 1) {
    const bearing = (2 * Math.PI * step) / steps;
    const latitude = Math.asin(
      Math.sin(centerLatitude) * Math.cos(angularDistance) +
        Math.cos(centerLatitude) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const longitude =
      centerLongitude +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(centerLatitude),
        Math.cos(angularDistance) - Math.sin(centerLatitude) * Math.sin(latitude)
      );

    coordinates.push([toDegrees(longitude), toDegrees(latitude)]);
  }

  return [coordinates];
};

export const getRouteFeature = (route: QuillaMapRoutePoint[] | QuillaMapCoordinate[]) => ({
  type: 'Feature' as const,
  properties: {},
  geometry: {
    type: 'LineString' as const,
    coordinates: route.map((point) => [point.longitude, point.latitude]),
  },
});

export const getShadeZonesFeatureCollection = (zones: QuillaMapShadeZone[]) => ({
  type: 'FeatureCollection' as const,
  features: zones.map((zone) => ({
    type: 'Feature' as const,
    id: zone.id,
    properties: {
      id: zone.id,
      title: zone.title,
      radiusMeters: zone.radiusMeters,
    },
    geometry: pointGeometry(zone.coordinate),
  })),
});

export const getShadeZoneAreasFeatureCollection = (zones: QuillaMapShadeZone[]) => ({
  type: 'FeatureCollection' as const,
  features: zones.map((zone) => ({
    type: 'Feature' as const,
    id: `shade-area-${zone.id}`,
    properties: {
      id: zone.id,
      title: zone.title,
      radiusMeters: zone.radiusMeters,
    },
    geometry: {
      type: 'Polygon' as const,
      coordinates: getRadiusPolygon(zone.coordinate, zone.radiusMeters),
    },
  })),
});

export const getCoordinateFeatureCollection = (
  coordinate: QuillaMapCoordinate | null | undefined,
  id: string
) => ({
  type: 'FeatureCollection' as const,
  features: coordinate
    ? [
        {
          type: 'Feature' as const,
          id,
          properties: { id },
          geometry: pointGeometry(coordinate),
        },
      ]
    : [],
});

export const getPlacesFeatureCollection = (places: PlaceMapFeature[]) => ({
  type: 'FeatureCollection' as const,
  features: places.map((place) => ({
    type: 'Feature' as const,
    id: place.id,
    properties: {
      id: place.id,
      source: place.source,
      category: place.category,
      title: place.name.es,
      isTouristSite: place.source === 'tourist_site',
    },
    geometry: pointGeometry(place.coordinate),
  })),
});

export const getBuildingsFeatureCollection = (places: PlaceMapFeature[]) => ({
  type: 'FeatureCollection' as const,
  features: places
    .flatMap((place) => {
      const polygon = place.metadata?.polygon;
      const height = place.metadata?.buildingHeightMeters;

      if (!polygon || !height) {
        return [];
      }

      return [{
        type: 'Feature' as const,
        id: `building-${place.id}`,
        properties: {
          id: place.id,
          source: place.source,
          color: place.source === 'tourist_site' ? '#D4AF37' : '#004574',
          height,
          base: place.metadata?.extrusionBaseMeters ?? 0,
        },
        geometry: polygon,
      }];
    }),
});
