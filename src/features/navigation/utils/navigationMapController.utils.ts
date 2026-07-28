import type {
  QuillaMapCoordinate,
  QuillaMapRoutePoint,
} from '@/components/maps/QuillaMap.types';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { RouteWaypoint } from '@/types/contracts/navigation.contract';
import type {
  TransitAgencyKind,
  TransitBusSuggestion,
  TransitMapResponse,
  TransitMapRouteFeature,
  TransitMapStopFeature,
  TransitTransmetroSuggestion,
  TransitWaypoint,
} from '@/types/contracts/transit.contract';

export const toRoutePoints = (geometry: QuillaMapCoordinate[]): QuillaMapRoutePoint[] =>
  geometry.map((point, index) => ({ ...point, id: `navigation-route-${index}` }));

export const toWaypoint = (place: PlaceMapFeature): RouteWaypoint => ({
  ...place.coordinate,
  label: place.name.es,
});

export const getQueryLabel = (destination: RouteWaypoint): string =>
  destination.label ?? `${destination.latitude},${destination.longitude}`;

export const transitAgencyOptions: Array<{ label: string; value: TransitAgencyKind }> = [
  { label: 'Bus', value: 'colectivo' },
  { label: 'Transmetro', value: 'transmetro' },
];

export interface TransitOperatorGroup {
  key: string;
  label: string;
  routes: TransitMapRouteFeature[];
}

export const getRouteOperatorLabel = (route: TransitMapRouteFeature): string =>
  route.properties.operatorName ??
  (route.properties.agencyKind === 'transmetro' ? 'Transmetro' : 'Buses colectivos');

export const getRouteLabel = (route: TransitMapRouteFeature): string =>
  route.properties.shortName || route.properties.longName || route.properties.routeId;

export const hasDrawableRouteGeometry = (route: TransitMapRouteFeature | null): boolean =>
  Boolean(route && route.geometry.coordinates.length >= 3);

export const getRouteRecorrido = (route: TransitMapRouteFeature | null): string => {
  if (!route) {
    return 'Selecciona una ruta para ver su recorrido.';
  }

  const streets = route.properties.streets?.filter(Boolean) ?? [];
  if (streets.length > 0) {
    return streets.join(' > ');
  }

  return route.properties.longName ?? getRouteLabel(route);
};

export const getTransitOperatorGroups = (
  transitMap: TransitMapResponse | null,
  agencyKind: TransitAgencyKind
): TransitOperatorGroup[] => {
  const routes = transitMap?.features.filter(
    (feature): feature is TransitMapRouteFeature =>
      feature.properties.kind === 'route' && feature.properties.agencyKind === agencyKind
  ) ?? [];
  const groupsByKey = new Map<string, TransitOperatorGroup>();

  for (const route of routes) {
    const label = getRouteOperatorLabel(route);
    const key = label.toLowerCase();
    const group = groupsByKey.get(key) ?? { key, label, routes: [] };
    group.routes.push(route);
    groupsByKey.set(key, group);
  }

  return Array.from(groupsByKey.values())
    .map((group) => ({
      ...group,
      routes: group.routes.sort((left, right) => getRouteLabel(left).localeCompare(getRouteLabel(right))),
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
};

const WALK_SEGMENT_COLOR = '#004574';
const BUS_SEGMENT_COLOR = '#0077A3';
const TRANSMETRO_FEEDER_COLOR = '#00A0DF';
const TRANSMETRO_TRUNK_COLOR = '#D4AF37';

const isFiniteWaypoint = (waypoint: TransitWaypoint | undefined): waypoint is TransitWaypoint =>
  Boolean(
    waypoint &&
    Number.isFinite(waypoint.latitude) &&
    Number.isFinite(waypoint.longitude)
  );

const toCoordinatePair = (waypoint: TransitWaypoint): [number, number] => [
  waypoint.longitude,
  waypoint.latitude,
];

const getMidpoint = (from: [number, number], to: [number, number]): [number, number] => [
  (from[0] + to[0]) / 2,
  (from[1] + to[1]) / 2,
];

const ensureDrawableLine = (coordinates: [number, number][]): [number, number][] => {
  if (coordinates.length >= 3) {
    return coordinates;
  }

  if (coordinates.length === 2) {
    return [coordinates[0], getMidpoint(coordinates[0], coordinates[1]), coordinates[1]];
  }

  return coordinates;
};

const getStraightLineCoordinates = (
  from: TransitWaypoint | undefined,
  to: TransitWaypoint | undefined
): [number, number][] => {
  if (!isFiniteWaypoint(from) || !isFiniteWaypoint(to)) {
    return [];
  }

  return ensureDrawableLine([toCoordinatePair(from), toCoordinatePair(to)]);
};

const getSquaredDistance = (coordinate: [number, number], waypoint: TransitWaypoint): number => {
  const longitudeDelta = coordinate[0] - waypoint.longitude;
  const latitudeDelta = coordinate[1] - waypoint.latitude;
  return longitudeDelta * longitudeDelta + latitudeDelta * latitudeDelta;
};

const getNearestCoordinateIndex = (
  coordinates: [number, number][],
  waypoint: TransitWaypoint
): number => coordinates.reduce((bestIndex, coordinate, index) => {
  const bestDistance = getSquaredDistance(coordinates[bestIndex], waypoint);
  const currentDistance = getSquaredDistance(coordinate, waypoint);
  return currentDistance < bestDistance ? index : bestIndex;
}, 0);

const getRouteSegmentCoordinates = (
  route: TransitMapRouteFeature | null,
  from: TransitWaypoint | undefined,
  to: TransitWaypoint | undefined
): [number, number][] => {
  if (!route || !isFiniteWaypoint(from) || !isFiniteWaypoint(to)) {
    return getStraightLineCoordinates(from, to);
  }

  const routeCoordinates = route.geometry.coordinates;
  if (routeCoordinates.length < 3) {
    return getStraightLineCoordinates(from, to);
  }

  const fromIndex = getNearestCoordinateIndex(routeCoordinates, from);
  const toIndex = getNearestCoordinateIndex(routeCoordinates, to);
  const startIndex = Math.min(fromIndex, toIndex);
  const endIndex = Math.max(fromIndex, toIndex);
  const segment = routeCoordinates.slice(startIndex, endIndex + 1);

  return ensureDrawableLine([toCoordinatePair(from), ...segment, toCoordinatePair(to)]);
};

const findTransitRoute = (
  transitMap: TransitMapResponse | null,
  agencyKind: TransitAgencyKind,
  routeId?: string,
  shortName?: string
): TransitMapRouteFeature | null => {
  const routes = transitMap?.features.filter(
    (feature): feature is TransitMapRouteFeature =>
      feature.properties.kind === 'route' &&
      feature.properties.agencyKind === agencyKind
  ) ?? [];

  return routes.find((route) => route.id === routeId) ??
    routes.find((route) => route.properties.routeId === routeId) ??
    routes.find((route) => route.properties.shortName === shortName) ??
    null;
};

const createTransitLineFeature = (params: {
  id: string;
  agencyKind: TransitAgencyKind;
  routeId: string;
  shortName: string;
  longName?: string;
  color: string;
  coordinates: [number, number][];
}): TransitMapRouteFeature | null => {
  const coordinates = ensureDrawableLine(params.coordinates);

  if (coordinates.length < 3) {
    return null;
  }

  return {
    type: 'Feature',
    id: params.id,
    properties: {
      id: params.id,
      kind: 'route',
      routeId: params.routeId,
      shortName: params.shortName,
      longName: params.longName,
      agencyKind: params.agencyKind,
      color: params.color,
    },
    geometry: {
      type: 'LineString',
      coordinates,
    },
  };
};

const createTransitStopFeature = (
  id: string,
  agencyKind: TransitAgencyKind,
  waypoint: TransitWaypoint | undefined,
  color: string
): TransitMapStopFeature | null => {
  if (!isFiniteWaypoint(waypoint)) {
    return null;
  }

  return {
    type: 'Feature',
    id,
    properties: {
      id,
      kind: 'stop',
      name: waypoint.label ?? 'Punto de transporte',
      agencyKind,
      color,
    },
    geometry: {
      type: 'Point',
      coordinates: toCoordinatePair(waypoint),
    },
  };
};

const pushFeature = (
  features: TransitMapResponse['features'],
  feature: TransitMapResponse['features'][number] | null
) => {
  if (feature) {
    features.push(feature);
  }
};

export const toBusSuggestionTransitMap = (
  suggestion: TransitBusSuggestion,
  sourceTransitMap: TransitMapResponse | null
): TransitMapResponse => {
  const route = findTransitRoute(
    sourceTransitMap,
    'colectivo',
    suggestion.route.id,
    suggestion.route.shortName
  );
  const features: TransitMapResponse['features'] = [];
  const pasos = suggestion.seleccion?.pasos ?? [];
  const boardStep = pasos.find((step) => step.type === 'board_bus');
  const alightStep = pasos.find((step) => step.type === 'alight_bus');

  pasos.forEach((step, index) => {
    if (step.type === 'walk_to_boarding' || step.type === 'walk_to_destination') {
      pushFeature(features, createTransitLineFeature({
        id: `suggestion-bus-walk-${suggestion.optionNumber ?? 0}-${index}`,
        agencyKind: 'colectivo',
        routeId: `walk-${index}`,
        shortName: 'Caminar',
        color: WALK_SEGMENT_COLOR,
        coordinates: getStraightLineCoordinates(step.from, step.to),
      }));
    }
  });

  pushFeature(features, createTransitLineFeature({
    id: `suggestion-bus-route-${suggestion.optionNumber ?? suggestion.route.id}`,
    agencyKind: 'colectivo',
    routeId: suggestion.route.id,
    shortName: suggestion.route.shortName,
    longName: suggestion.route.longName,
    color: route?.properties.color ?? BUS_SEGMENT_COLOR,
    coordinates: getRouteSegmentCoordinates(
      route,
      boardStep?.place ?? suggestion.boardingPoint,
      alightStep?.place ?? suggestion.alightingPoint
    ),
  }));

  pushFeature(features, createTransitStopFeature(
    `suggestion-bus-boarding-${suggestion.optionNumber ?? suggestion.route.id}`,
    'colectivo',
    boardStep?.place ?? suggestion.boardingPoint,
    BUS_SEGMENT_COLOR
  ));
  pushFeature(features, createTransitStopFeature(
    `suggestion-bus-alighting-${suggestion.optionNumber ?? suggestion.route.id}`,
    'colectivo',
    alightStep?.place ?? suggestion.alightingPoint,
    BUS_SEGMENT_COLOR
  ));

  return {
    type: 'FeatureCollection',
    features,
    generatedAtIso: new Date().toISOString(),
  };
};

export const toTransmetroSuggestionTransitMap = (
  suggestion: TransitTransmetroSuggestion,
  sourceTransitMap: TransitMapResponse | null
): TransitMapResponse => {
  const feederRoute = findTransitRoute(
    sourceTransitMap,
    'transmetro',
    suggestion.feederService.id,
    suggestion.feederService.shortName
  );
  const trunkRoute = findTransitRoute(
    sourceTransitMap,
    'transmetro',
    suggestion.trunkService.id,
    suggestion.trunkService.shortName
  );
  const features: TransitMapResponse['features'] = [];
  const pasos = suggestion.seleccion.pasos;

  pasos.forEach((step, index) => {
    if (step.type === 'walk_to_stop' || step.type === 'walk_to_destination') {
      pushFeature(features, createTransitLineFeature({
        id: `suggestion-transmetro-walk-${suggestion.optionNumber}-${index}`,
        agencyKind: 'transmetro',
        routeId: `walk-${index}`,
        shortName: 'Caminar',
        color: WALK_SEGMENT_COLOR,
        coordinates: getStraightLineCoordinates(step.from, step.to),
      }));
    }
  });

  pushFeature(features, createTransitLineFeature({
    id: `suggestion-transmetro-feeder-${suggestion.optionNumber}`,
    agencyKind: 'transmetro',
    routeId: suggestion.feederService.id,
    shortName: suggestion.feederService.shortName,
    longName: suggestion.feederService.longName,
    color: feederRoute?.properties.color ?? TRANSMETRO_FEEDER_COLOR,
    coordinates: getRouteSegmentCoordinates(
      feederRoute,
      suggestion.boardingStop,
      suggestion.transferStation
    ),
  }));

  pushFeature(features, createTransitLineFeature({
    id: `suggestion-transmetro-trunk-${suggestion.optionNumber}`,
    agencyKind: 'transmetro',
    routeId: suggestion.trunkService.id,
    shortName: suggestion.trunkService.shortName,
    longName: suggestion.trunkService.longName,
    color: trunkRoute?.properties.color ?? TRANSMETRO_TRUNK_COLOR,
    coordinates: getRouteSegmentCoordinates(
      trunkRoute,
      suggestion.transferStation,
      suggestion.destinationStation
    ),
  }));

  pushFeature(features, createTransitStopFeature(
    `suggestion-transmetro-boarding-${suggestion.optionNumber}`,
    'transmetro',
    suggestion.boardingStop,
    TRANSMETRO_FEEDER_COLOR
  ));
  pushFeature(features, createTransitStopFeature(
    `suggestion-transmetro-transfer-${suggestion.optionNumber}`,
    'transmetro',
    suggestion.transferStation,
    TRANSMETRO_TRUNK_COLOR
  ));
  pushFeature(features, createTransitStopFeature(
    `suggestion-transmetro-destination-${suggestion.optionNumber}`,
    'transmetro',
    suggestion.destinationStation,
    TRANSMETRO_TRUNK_COLOR
  ));

  return {
    type: 'FeatureCollection',
    features,
    generatedAtIso: new Date().toISOString(),
  };
};

export const getFormattedDistance = (distanceMeters: number): string =>
  distanceMeters >= 1_000
    ? `${(distanceMeters / 1_000).toFixed(1)} km`
    : `${Math.round(distanceMeters)} m`;

export const getFormattedDuration = (durationSeconds: number): string =>
  `${Math.max(1, Math.round(durationSeconds / 60))} min`;
