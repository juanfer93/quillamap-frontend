import { useCallback } from 'react';
import { navigationApi } from '@/api/client';
import type {
  RouteCoordinate,
  RouteRequest,
  RouteWaypoint,
} from '@/types/contracts/navigation.contract';
import { useNavigationStore } from '../store/useNavigationStore';
import { getRoutePreferences, toRouteNavigationMode } from '../utils/navigationModes';
import type { QuillaMapMode } from '@/components/maps/QuillaMap.types';

interface RequestRouteParams {
  origin: RouteCoordinate;
  destination: RouteWaypoint;
  mode: QuillaMapMode;
  licensePlate?: string | null;
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

export const useRouteNavigation = () => {
  const startRouting = useNavigationStore((state) => state.startRouting);
  const setActiveRoute = useNavigationStore((state) => state.setActiveRoute);
  const failRouting = useNavigationStore((state) => state.failRouting);

  const requestRoute = useCallback(async (params: RequestRouteParams) => {
    startRouting(params.destination);

    try {
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
