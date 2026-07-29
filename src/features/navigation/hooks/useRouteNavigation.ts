import { useCallback } from 'react';
import { navigationApi, transitApi } from '@/api/client';
import type {
  RouteCoordinate,
  RouteResponse,
  RouteRequest,
  RouteWaypoint,
} from '@/types/contracts/navigation.contract';
import type {
  TransitItinerary,
  TransitAgencyKind,
  TransitMode,
  TransitRouteRequest,
} from '@/types/contracts/transit.contract';
import { useNavigationStore } from '../store/useNavigationStore';
import { getRoutePreferences, toRouteNavigationMode } from '../utils/navigationModes';
import type { QuillaMapMode } from '@/components/maps/QuillaMap.types';

interface RequestRouteParams {
  origin: RouteCoordinate;
  destination: RouteWaypoint;
  mode: QuillaMapMode;
  licensePlate?: string | null;
  transitAgencyKind?: TransitAgencyKind;
}

interface ApiErrorShape {
  response?: {
    data?: {
      message?: string | string[];
    };
  };
  message?: string;
}

const getRouteErrorMessage = (error: unknown): string => {
  const apiError = error as ApiErrorShape;
  const message = apiError.response?.data?.message ?? apiError.message;

  if (Array.isArray(message)) {
    return message[0] ?? 'No fue posible calcular la ruta';
  }

  return message ?? 'No fue posible calcular la ruta';
};

const toRouteRequest = ({
  origin,
  destination,
  mode,
  licensePlate,
}: RequestRouteParams): RouteRequest => {
  const routeMode = toRouteNavigationMode(mode);

  return {
    origin,
    destination,
    mode: routeMode,
    licensePlate: licensePlate ?? undefined,
    preferences: getRoutePreferences(routeMode),
  };
};

const isTransitQuillaMapMode = (mode: QuillaMapMode): mode is 'tourist' =>
  mode === 'tourist';

const toTransitMode = (mode: 'pedestrian' | 'tourist'): TransitMode =>
  mode === 'tourist' ? 'turista' : 'peaton';

const toTransitRequest = ({
  origin,
  destination,
  mode,
  transitAgencyKind,
}: RequestRouteParams & { mode: 'pedestrian' | 'tourist' }): TransitRouteRequest => {
  const transitMode = toTransitMode(mode);

  return {
    origin,
    destination,
    mode: transitMode,
    preferences: {
      prioritizeShade: transitMode === 'peaton',
      prioritizeCulturalLandmarks: transitMode === 'turista',
      avoidActiveStreams: true,
      preferredAgencyKind: transitAgencyKind,
    },
  };
};

const itineraryMatchesAgency = (
  itinerary: TransitItinerary,
  agencyKind: TransitAgencyKind | undefined
): boolean => {
  if (!agencyKind) {
    return true;
  }

  const busLegs = itinerary.legs.filter((leg) => leg.type === 'bus');
  return busLegs.length > 0 && busLegs.every((leg) => leg.agencyKind === agencyKind);
};

const getBestTransitItinerary = (
  itineraries: TransitItinerary[],
  agencyKind?: TransitAgencyKind
): TransitItinerary | null => {
  const matchingItineraries = itineraries.filter((itinerary) => itineraryMatchesAgency(itinerary, agencyKind));
  const candidates = matchingItineraries.length > 0 ? matchingItineraries : itineraries;

  return [...candidates].sort((left, right) => {
    const durationDelta = left.durationSeconds - right.durationSeconds;
    return durationDelta !== 0 ? durationDelta : left.distanceMeters - right.distanceMeters;
  })[0] ?? null;
};

const flattenTransitGeometry = (itinerary: TransitItinerary): RouteCoordinate[] =>
  itinerary.legs.flatMap((leg, legIndex) =>
    legIndex === 0 ? leg.geometry : leg.geometry.slice(1)
  );

const toRouteResponseFromTransit = (itinerary: TransitItinerary): RouteResponse => ({
  geometry: flattenTransitGeometry(itinerary),
  distanceMeters: itinerary.distanceMeters,
  durationSeconds: itinerary.durationSeconds,
  alerts: itinerary.alerts.map((alert) => ({
    id: alert.id,
    type: alert.type === 'active_stream' ? 'arroyo_activo' : 'sombra',
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
  })),
  provider: 'otp',
  legalStatus: itinerary.riskStatus === 'blocked' ? 'blocked' : itinerary.riskStatus === 'rerouted' ? 'rerouted' : 'allowed',
  etaIso: itinerary.etaIso,
  transit: {
    mode: itinerary.mode,
    transfers: itinerary.transfers,
    riskStatus: itinerary.riskStatus,
    recalculatedForRisk: itinerary.recalculatedForRisk,
    sourceVersion: itinerary.sourceVersion,
    legs: itinerary.legs.map((leg) => ({
      id: leg.id,
      type: leg.type,
      routeShortName: leg.routeShortName,
      agencyKind: leg.agencyKind,
      fromLabel: leg.from.label,
      toLabel: leg.to.label,
      distanceMeters: leg.distanceMeters,
      durationSeconds: leg.durationSeconds,
    })),
  },
});

export const useRouteNavigation = () => {
  const startRouting = useNavigationStore((state) => state.startRouting);
  const setActiveRoute = useNavigationStore((state) => state.setActiveRoute);
  const failRouting = useNavigationStore((state) => state.failRouting);

  const requestRoute = useCallback(async (params: RequestRouteParams) => {
    startRouting(params.destination);

    try {
      if (isTransitQuillaMapMode(params.mode)) {
        const response = await transitApi.calculateItineraries(toTransitRequest({
          ...params,
          mode: params.mode,
        }));
        const bestItinerary = getBestTransitItinerary(response.itineraries, params.transitAgencyKind);

        if (!bestItinerary) {
          throw new Error('No se encontraron rutas de transporte publico.');
        }

        const route = toRouteResponseFromTransit(bestItinerary);
        setActiveRoute(route, params.destination);
        return route;
      }

      const route = await navigationApi.calculateRoute(toRouteRequest(params));
      setActiveRoute(route, params.destination);
      return route;
    } catch (error: unknown) {
      failRouting(getRouteErrorMessage(error));
      throw error;
    }
  }, [failRouting, setActiveRoute, startRouting]);

  return { requestRoute };
};
