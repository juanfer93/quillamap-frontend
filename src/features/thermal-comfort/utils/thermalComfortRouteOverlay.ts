import type {
  QuillaMapCoordinate,
  QuillaMapShadeRouteSegment,
  QuillaMapThermalComfortRoute,
} from '@/components/maps/QuillaMap.types';
import type {
  ThermalComfortGreenCoverage,
  ThermalComfortRoutePreview,
  ThermalComfortSearchMode,
} from '../types/thermalComfortRoute.types';
import type { RouteWaypoint } from '@/types/contracts/navigation.contract';

const POINT_MARKER_DELTA = 0.00008;
const DESTINATION_FOCUS_DELTA = 0.0045;

const toCoordinate = ([longitude, latitude]: [number, number]): QuillaMapCoordinate => ({
  latitude,
  longitude,
});

const getDestinationFocusGeometry = (destination: RouteWaypoint): QuillaMapCoordinate[] => [
  {
    latitude: destination.latitude - DESTINATION_FOCUS_DELTA,
    longitude: destination.longitude - DESTINATION_FOCUS_DELTA,
  },
  {
    latitude: destination.latitude + DESTINATION_FOCUS_DELTA,
    longitude: destination.longitude + DESTINATION_FOCUS_DELTA,
  },
];

const hasValidLine = (geometry: QuillaMapCoordinate[]): boolean =>
  geometry.length > 1 &&
  geometry.every((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));

const getSegmentSource = (coverage: ThermalComfortGreenCoverage): QuillaMapShadeRouteSegment['source'] =>
  coverage.type === 'park' ? 'park' : 'green_coverage';

const getPointSegment = (
  coverage: ThermalComfortGreenCoverage,
  coordinates: [number, number],
  index: number
): QuillaMapShadeRouteSegment => {
  const [longitude, latitude] = coordinates;

  return {
    id: `green-coverage-${coverage.id}-${index}`,
    source: getSegmentSource(coverage),
    geometry: [
      { latitude: latitude - POINT_MARKER_DELTA, longitude },
      { latitude: latitude + POINT_MARKER_DELTA, longitude },
    ],
  };
};

const getLineSegment = (
  coverage: ThermalComfortGreenCoverage,
  coordinates: Array<[number, number]>,
  index: number
): QuillaMapShadeRouteSegment | null => {
  const geometry = coordinates.map(toCoordinate);

  if (!hasValidLine(geometry)) {
    return null;
  }

  return {
    id: `green-coverage-${coverage.id}-${index}`,
    source: getSegmentSource(coverage),
    geometry,
  };
};

const toShadeSegments = (coverage: ThermalComfortGreenCoverage): QuillaMapShadeRouteSegment[] => {
  const { geometry } = coverage;

  if (geometry.type === 'Point') {
    return [getPointSegment(coverage, geometry.coordinates, 0)];
  }

  if (geometry.type === 'LineString') {
    const segment = getLineSegment(coverage, geometry.coordinates, 0);
    return segment ? [segment] : [];
  }

  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates
      .map((line, index) => getLineSegment(coverage, line, index))
      .filter((segment): segment is QuillaMapShadeRouteSegment => Boolean(segment));
  }

  if (geometry.type === 'Polygon') {
    return geometry.coordinates
      .map((ring, index) => getLineSegment(coverage, ring, index))
      .filter((segment): segment is QuillaMapShadeRouteSegment => Boolean(segment));
  }

  return geometry.coordinates
    .flatMap((polygon) => polygon)
    .map((ring, index) => getLineSegment(coverage, ring, index))
    .filter((segment): segment is QuillaMapShadeRouteSegment => Boolean(segment));
};

export const toThermalComfortRoutePreview = (
  destination: RouteWaypoint,
  greenCoverage: ThermalComfortGreenCoverage[],
  searchMode: ThermalComfortSearchMode
): ThermalComfortRoutePreview => ({
  destination,
  greenCoverageCount: greenCoverage.length,
  searchMode,
  shadeSegments: greenCoverage.flatMap(toShadeSegments),
});

export const toThermalComfortRouteOverlay = (
  preview: ThermalComfortRoutePreview | null
): QuillaMapThermalComfortRoute | null => {
  if (!preview) {
    return null;
  }

  return {
    geometry: getDestinationFocusGeometry(preview.destination),
    shadeSegments: preview.shadeSegments,
    origin: null,
    destination: preview.destination,
  };
};
