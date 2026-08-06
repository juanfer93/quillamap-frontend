import {
  PLACES_VISUAL_IDENTITY,
  getPlaceCategoryVisual,
  type PlaceMapFeature,
} from '@/types/contracts/places.contract';
import type {
  SecurityHeatmapPointContract,
  SecurityHeatmapResponseContract,
} from '@/types/contracts/security.contract';
import type {
  TransitMapResponse,
  TransitMapRouteFeature,
  TransitMapStopFeature,
} from '@/types/contracts/transit.contract';
import type {
  QuillaMapCoordinate,
  QuillaMapReportMarker,
  QuillaMapRoutePoint,
  QuillaMapShadeRouteSegment,
  QuillaMapShadeZone,
  QuillaMapThermalComfortRoute,
} from '../types/QuillaMap.types';
import {
  REPORT_ARROYO_MARKER_EMOJI,
  REPORT_BACHE_MARKER_EMOJI,
} from './QuillaMap.maplibre.layers';

const EARTH_RADIUS_METERS = 6_371_008.8;
const DEFAULT_CIRCLE_STEPS = 48;
const MIN_TRANSIT_ROUTE_COORDINATES = 3;
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
const normalizeDegrees = (value: number): number => ((value % 360) + 360) % 360;

const isFiniteCoordinatePair = (coordinate: unknown): coordinate is [number, number] =>
  Array.isArray(coordinate) &&
  coordinate.length >= 2 &&
  Number.isFinite(coordinate[0]) &&
  Number.isFinite(coordinate[1]);

const isValidTransitRouteFeature = (feature: TransitMapResponse['features'][number]): feature is TransitMapRouteFeature =>
  feature.properties.kind === 'route' &&
  feature.geometry.type === 'LineString' &&
  feature.geometry.coordinates.length >= MIN_TRANSIT_ROUTE_COORDINATES &&
  feature.geometry.coordinates.every(isFiniteCoordinatePair);

const isValidTransitStopFeature = (feature: TransitMapResponse['features'][number]): feature is TransitMapStopFeature =>
  feature.properties.kind === 'stop' &&
  feature.geometry.type === 'Point' &&
  isFiniteCoordinatePair(feature.geometry.coordinates);

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

const isValidShadeSegment = (segment: QuillaMapShadeRouteSegment): boolean =>
  segment.geometry.length > 1 &&
  segment.geometry.every((point) => Number.isFinite(point.longitude) && Number.isFinite(point.latitude));

export const getShadeRouteSegmentsFeatureCollection = (
  segments: QuillaMapShadeRouteSegment[] | null | undefined
) => ({
  type: 'FeatureCollection' as const,
  features: segments?.filter(isValidShadeSegment).map((segment) => ({
    type: 'Feature' as const,
    id: segment.id,
    properties: {
      id: segment.id,
      source: segment.source,
    },
    geometry: {
      type: 'LineString' as const,
      coordinates: segment.geometry.map((point) => [point.longitude, point.latitude]),
    },
  })) ?? [],
});

export const getThermalComfortShadeFeatureCollection = (
  route: QuillaMapThermalComfortRoute | null | undefined
) => getShadeRouteSegmentsFeatureCollection(route?.shadeSegments);

export const getTransitRouteFeatureCollection = (
  transitMap: TransitMapResponse | null | undefined
) => ({
  type: 'FeatureCollection' as const,
  features: transitMap?.features.filter(isValidTransitRouteFeature) ?? [],
});

export const getTransitStopFeatureCollection = (
  transitMap: TransitMapResponse | null | undefined
) => ({
  type: 'FeatureCollection' as const,
  features: transitMap?.features.filter(isValidTransitStopFeature) ?? [],
});

export const getTransitMapBounds = (
  transitMap: TransitMapResponse | null | undefined
): { southWest: [number, number]; northEast: [number, number] } | null => {
  const coordinates = transitMap?.features.flatMap((feature) => {
    if (isValidTransitRouteFeature(feature)) {
      return feature.geometry.coordinates;
    }

    if (!isValidTransitStopFeature(feature)) {
      return [];
    }

    if (feature.geometry.type === 'Point') {
      return [feature.geometry.coordinates];
    }

    return [];
  }) ?? [];

  if (coordinates.length === 0) {
    return null;
  }

  const longitudes = coordinates.map((coordinate) => coordinate[0]);
  const latitudes = coordinates.map((coordinate) => coordinate[1]);

  return {
    southWest: [Math.min(...longitudes), Math.min(...latitudes)],
    northEast: [Math.max(...longitudes), Math.max(...latitudes)],
  };
};

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

const getReportMarkerEmoji = (type: QuillaMapReportMarker['type']): string =>
  type === 'arroyo' ? REPORT_ARROYO_MARKER_EMOJI : REPORT_BACHE_MARKER_EMOJI;

export const getReportMarkersFeatureCollection = (markers: QuillaMapReportMarker[]) => ({
  type: 'FeatureCollection' as const,
  features: markers.map((marker) => ({
    type: 'Feature' as const,
    id: marker.id,
    properties: {
      id: marker.id,
      type: marker.type,
      description: marker.description ?? null,
      marker: getReportMarkerEmoji(marker.type),
    },
    geometry: pointGeometry(marker.coordinate),
  })),
});

const getSecurityHeatmapWeight = (point: SecurityHeatmapPointContract): number => {
  const normalizedDanger = Math.min(Math.max(point.dangerLevel, 1), 5) / 5;
  const normalizedIntensity = Math.min(Math.max(point.intensity, 0), 1);
  const normalizedVeracity = Math.min(Math.max(point.veracityScore, 0), 1);

  return Number((normalizedIntensity * (0.75 + normalizedDanger) * (0.7 + normalizedVeracity)).toFixed(4));
};

export const getSecurityHeatmapFeatureCollection = (
  heatmap: SecurityHeatmapResponseContract | null | undefined,
  mode: 'heatmap' | 'driving-lock' = 'heatmap'
) => ({
  type: 'FeatureCollection' as const,
  features: heatmap?.points.map((point) => ({
    type: 'Feature' as const,
    id: point.clusterId,
    properties: {
      clusterId: point.clusterId,
      intensity: point.intensity,
      dangerLevel: point.dangerLevel,
      veracityScore: point.veracityScore,
      reportCount: point.reportCount,
      radiusMeters: point.radiusMeters,
      riskLevel: point.riskLevel,
      hasVerifiedEvidence: point.hasVerifiedEvidence,
      generatedFrom: point.generatedFrom,
      generatedTo: point.generatedTo,
      heatmapWeight: getSecurityHeatmapWeight(point),
      isDrivingLock: mode === 'driving-lock',
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [point.longitude, point.latitude],
    },
  })) ?? [],
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

export const getThermalComfortFocusCoordinates = (
  route: QuillaMapThermalComfortRoute | null | undefined
): QuillaMapCoordinate[] => {
  const shadeCoordinates = route?.shadeSegments.flatMap((segment) => segment.geometry) ?? [];
  const routeCoordinates = route?.geometry ?? [];

  if (routeCoordinates.length > 1) {
    return routeCoordinates;
  }

  return shadeCoordinates;
};

export const getUserLocationFeatureCollection = (
  coordinate: QuillaMapCoordinate | null | undefined
) => getCoordinateFeatureCollection(coordinate, 'user-location');

export const getNavigationBearingDegrees = (
  route: QuillaMapRoutePoint[] | QuillaMapCoordinate[]
): number => {
  const [origin, destination] = route;

  if (!origin || !destination) {
    return 0;
  }

  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);
  const longitudeDelta = toRadians(destination.longitude - origin.longitude);
  const y = Math.sin(longitudeDelta) * Math.cos(destinationLatitude);
  const x =
    Math.cos(originLatitude) * Math.sin(destinationLatitude) -
    Math.sin(originLatitude) * Math.cos(destinationLatitude) * Math.cos(longitudeDelta);

  return normalizeDegrees(toDegrees(Math.atan2(y, x)));
};

export const getNavigationArrowFeatureCollection = (
  coordinate: QuillaMapCoordinate | null | undefined,
  route: QuillaMapRoutePoint[] | QuillaMapCoordinate[]
) => ({
  type: 'FeatureCollection' as const,
  features: coordinate && route.length > 1
    ? [
        {
          type: 'Feature' as const,
          id: 'navigation-arrow',
          properties: {
            id: 'navigation-arrow',
            bearing: getNavigationBearingDegrees(route),
          },
          geometry: pointGeometry(coordinate),
        },
      ]
    : [],
});

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
