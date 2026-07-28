import { getQueryLabel, toWaypoint } from '@/features/navigation/utils/navigationMapController.utils';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { RouteWaypoint } from '@/types/contracts/navigation.contract';
import type {
  TransitAgencyKind,
  TransitBusSuggestion,
  TransitMapResponse,
  TransitMapRouteFeature,
  TransitRouteRequest,
  TransitTransmetroSuggestion,
} from '@/types/contracts/transit.contract';
import { PUBLIC_TRANSPORT_ERROR_MESSAGES } from '../constants/publicTransport.constants';
import type {
  PublicTransportMode,
  TransitFinderState,
  TransitSuggestion,
  TransitSuggestionKind,
} from '../types/publicTransport.types';
import type { TransitOperatorGroup } from '@/features/navigation/utils/navigationMapController.utils';

export const getAgencyKindForPublicTransportMode = (
  mode: PublicTransportMode
): TransitAgencyKind =>
  mode === 'transmetro' || mode === 'find-transmetro' ? 'transmetro' : 'colectivo';

export const toTransitSuggestionRequest = (
  pointA: RouteWaypoint,
  pointB: RouteWaypoint,
  agencyKind: TransitAgencyKind
): TransitRouteRequest => ({
  origin: pointA,
  destination: pointB,
  mode: 'peaton',
  preferences: {
    prioritizeShade: true,
    avoidActiveStreams: true,
    preferredAgencyKind: agencyKind,
  },
});

export const getPublicTransportSuggestionErrorMessage = (error: unknown): string => {
  const apiError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
  const message = apiError.response?.data?.message ?? apiError.message;

  if (Array.isArray(message)) {
    return message[0] ?? PUBLIC_TRANSPORT_ERROR_MESSAGES.suggestionsFallback;
  }

  return message ?? PUBLIC_TRANSPORT_ERROR_MESSAGES.suggestionsFallback;
};

export const getVisibleTransitMap = (
  transitMap: TransitMapResponse | null,
  transitAgencyKind: TransitAgencyKind,
  selectedTransitSuggestionMap: TransitMapResponse | null,
  selectedTransitRoute: TransitMapRouteFeature | null
): TransitMapResponse | null => {
  if (selectedTransitSuggestionMap) {
    return selectedTransitSuggestionMap;
  }

  if (!transitMap) {
    return null;
  }

  if (selectedTransitRoute) {
    return {
      ...transitMap,
      features: [selectedTransitRoute],
    };
  }

  return {
    ...transitMap,
    features: transitMap.features.filter((feature) =>
      feature.properties.agencyKind === transitAgencyKind &&
      (feature.properties.kind === 'route' || feature.properties.kind === 'stop')
    ),
  };
};

export const getFinderByKind = (
  kind: TransitSuggestionKind,
  busFinder: TransitFinderState,
  transmetroFinder: TransitFinderState
): TransitFinderState => kind === 'bus' ? busFinder : transmetroFinder;

export const getFinderWithQuery = (
  finder: TransitFinderState,
  point: 'pointA' | 'pointB',
  queryValue: string
): TransitFinderState => ({
  ...finder,
  [`${point}Query`]: queryValue,
  [point]: null,
});

export const getFinderWithPlace = (
  finder: TransitFinderState,
  point: 'pointA' | 'pointB',
  place: PlaceMapFeature
): TransitFinderState => ({
  ...finder,
  [`${point}Query`]: place.name.es,
  [point]: toWaypoint(place),
});

export const getFinderWithResolvedPoints = (
  finder: TransitFinderState,
  pointA: RouteWaypoint,
  pointB: RouteWaypoint
): TransitFinderState => ({
  ...finder,
  pointA,
  pointB,
  pointAQuery: getQueryLabel(pointA),
  pointBQuery: getQueryLabel(pointB),
});

export const getSelectedTransitOperator = (
  transitOperatorGroups: TransitOperatorGroup[],
  selectedTransitOperatorKey: string | null
): TransitOperatorGroup | null =>
  transitOperatorGroups.find((group) => group.key === selectedTransitOperatorKey) ??
  transitOperatorGroups[0] ??
  null;

export const getSelectedTransitRoute = (
  selectedTransitOperator: TransitOperatorGroup | null,
  selectedTransitRouteId: string | null
): TransitMapRouteFeature | null =>
  selectedTransitOperator?.routes.find((route) => route.properties.routeId === selectedTransitRouteId) ?? null;

export const getTransitSuggestionTitle = (
  kind: TransitSuggestionKind,
  suggestion: TransitSuggestion
): string => {
  if (kind === 'bus') {
    const busSuggestion = suggestion as TransitBusSuggestion;
    return busSuggestion.title ?? busSuggestion.route.shortName;
  }

  const transmetroSuggestion = suggestion as TransitTransmetroSuggestion;
  return transmetroSuggestion.title ??
    `${transmetroSuggestion.feederService.shortName} + ${transmetroSuggestion.trunkService.shortName}`;
};

export const getTransitSuggestionInstructions = (
  suggestion: TransitSuggestion
): string[] =>
  suggestion.seleccion?.pasos
    .map((step) => step.instruction.trim())
    .filter(Boolean) ?? [];
