import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type {
  QuillaMapCoordinate,
  QuillaMapRoutePoint,
  QuillaMapShadeZone,
} from './QuillaMap.types';

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

const pointGeometry = (coordinate: QuillaMapCoordinate) => ({
  type: 'Point' as const,
  coordinates: [coordinate.longitude, coordinate.latitude],
});

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
