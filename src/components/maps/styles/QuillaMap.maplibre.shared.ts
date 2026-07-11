import type { StyleSpecification } from 'maplibre-gl';
import {
  PLACES_VISUAL_IDENTITY,
  getPlaceCategoryVisual,
  type PlaceMapFeature,
} from '@/types/contracts/places.contract';
import { NAVIGATION_VISUAL_IDENTITY } from '@/types/contracts/navigation.contract';
import type {
  QuillaMapCoordinate,
  QuillaMapRoutePoint,
  QuillaMapShadeZone,
} from '../types/QuillaMap.types';

export const DARK_MAP_THEME = {
  background: '#1D2938',
  controlBackground: '#111B2A',
  controlBorder: '#4B607C',
  controlText: PLACES_VISUAL_IDENTITY.sandGold.hex,
};

export const MAPLIBRE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap contributors',
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

export const DARK_MAPLIBRE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    cartoDark: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 20,
      attribution: 'OpenStreetMap contributors CARTO',
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
        'raster-saturation': -0.12,
        'raster-contrast': 0.18,
        'raster-brightness-min': 0.34,
        'raster-brightness-max': 1,
        'raster-opacity': 1,
      },
    },
  ],
};

export const getMapLibreStyle = (themeMode: 'light' | 'dark' = 'light'): StyleSpecification =>
  themeMode === 'dark' ? DARK_MAPLIBRE_STYLE : MAPLIBRE_STYLE;

export const SHADE_MARKER_EMOJI = '\u2602';
export const DESTINATION_MARKER_EMOJI = '\u25CE';
export const MAP_3D_PITCH = 62;
export const NAVIGATION_ROUTE_SOURCE_ID = 'route-source';
export const NAVIGATION_ROUTE_HALO_LAYER_ID = 'route-line-halo';
export const NAVIGATION_ROUTE_LAYER_ID = 'route-line';
export const NAVIGATION_DESTINATION_SOURCE_ID = 'navigation-destination-source';
export const NAVIGATION_DESTINATION_LAYER_ID = 'navigation-destination-marker';
export const NAVIGATION_ROUTE_LINE_STYLE = {
  lineColor: NAVIGATION_VISUAL_IDENTITY.activeRoute,
  haloColor: '#FFFFFF',
  haloOpacity: 0.92,
  haloWidth: 12,
  lineWidth: 7,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
};

const EARTH_RADIUS_METERS = 6_371_008.8;
const DEFAULT_CIRCLE_STEPS = 48;
const FALLBACK_TOURIST_EXTRUSION_HEIGHT_METERS = 24;
const TOURIST_FOOTPRINT_DELTA = {
  longitude: 0.000055,
  latitude: 0.000115,
};
const PLACE_FOOTPRINT_DELTA = {
  longitude: 0.00008,
  latitude: 0.00008,
};

const toRadians = (value: number): number => (value * Math.PI) / 180;
const toDegrees = (value: number): number => (value * 180) / Math.PI;

const pointGeometry = (coordinate: QuillaMapCoordinate) => ({
  type: 'Point' as const,
  coordinates: [coordinate.longitude, coordinate.latitude],
});

const getFallbackFootprint = (place: PlaceMapFeature) => {
  const delta = place.source === 'tourist_site' ? TOURIST_FOOTPRINT_DELTA : PLACE_FOOTPRINT_DELTA;
  const { longitude, latitude } = place.coordinate;

  return {
    type: 'Polygon' as const,
    coordinates: [[
      [longitude - delta.longitude, latitude + delta.latitude],
      [longitude + delta.longitude, latitude + delta.latitude],
      [longitude + delta.longitude, latitude - delta.latitude],
      [longitude - delta.longitude, latitude - delta.latitude],
      [longitude - delta.longitude, latitude + delta.latitude],
    ]],
  };
};

const getExtrusionHeight = (place: PlaceMapFeature): number | null => {
  const sourceHeight = place.metadata?.buildingHeightMeters;

  if (!sourceHeight && place.source !== 'tourist_site') {
    return null;
  }

  return sourceHeight ?? FALLBACK_TOURIST_EXTRUSION_HEIGHT_METERS;
};

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

export const getRouteFeatureCollection = (route: QuillaMapRoutePoint[] | QuillaMapCoordinate[]) => ({
  type: 'FeatureCollection' as const,
  features: route.length > 1 ? [getRouteFeature(route)] : [],
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

export const getDestinationFeatureCollection = (
  coordinate: QuillaMapCoordinate | null | undefined
) => getCoordinateFeatureCollection(coordinate, 'navigation-destination');

export const getPlacesFeatureCollection = (places: PlaceMapFeature[]) => ({
  type: 'FeatureCollection' as const,
  features: places.map((place) => {
    const categoryVisual = getPlaceCategoryVisual(place.category);

    return {
      type: 'Feature' as const,
      id: place.id,
      properties: {
        id: place.id,
        source: place.source,
        category: place.category,
        title: place.name.es,
        isTouristSite: place.source === 'tourist_site',
        icon: place.iconGlyph ?? categoryVisual.iconGlyph,
        iconName: place.iconName ?? categoryVisual.iconName,
      },
      geometry: pointGeometry(place.coordinate),
    };
  }),
});

export const getBuildingsFeatureCollection = (places: PlaceMapFeature[]) => ({
  type: 'FeatureCollection' as const,
  features: places.flatMap((place) => {
    const height = getExtrusionHeight(place);

    if (!height) {
      return [];
    }

    const polygon = place.metadata?.polygon ?? getFallbackFootprint(place);

    return [
      {
        type: 'Feature' as const,
        id: `building-${place.id}`,
        properties: {
          id: place.id,
          source: place.source,
          color: place.source === 'tourist_site'
            ? PLACES_VISUAL_IDENTITY.sandGold.hex
            : PLACES_VISUAL_IDENTITY.sharkBlue.hex,
          height,
          base: place.metadata?.extrusionBaseMeters ?? 0,
          sourceHeightMeters: place.metadata?.buildingHeightMeters ?? null,
        },
        geometry: polygon,
      },
    ];
  }),
});
