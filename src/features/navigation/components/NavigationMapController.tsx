import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import QuillaMap from '@/components/maps/QuillaMap';
import type { QuillaMapProps } from '@/components/maps/QuillaMap.types';
import type { RouteWaypoint } from '@/types/contracts/navigation.contract';
import { useNavigationStore } from '../store/useNavigationStore';
import { useRouteNavigation } from '../hooks/useRouteNavigation';
import { useVelocityGuard } from '../hooks/useVelocityGuard';
import { getDestinationSuggestions, resolveDestination } from '../utils/destinationSearch';
import { DRIVING_LOCK_THRESHOLD_KMH, isNavigationUiLocked } from '../utils/drivingLock';
import {
  getQueryLabel,
  toRoutePoints,
  toWaypoint,
} from '../utils/navigationMapController.utils';
import NavigationSearchOverlay from './NavigationSearchOverlay';

interface NavigationMapControllerProps extends Omit<
  QuillaMapProps,
  | 'routePoints'
  | 'shadeRouteSegments'
  | 'destinationCoordinate'
  | 'children'
> {
  children?: ReactNode;
  licensePlate?: string | null;
  sensorSpeedKmh?: number;
  renderProfileTools?: (transitRoutesSection: ReactNode | null) => ReactNode;
}

const NavigationMapController = ({
  center,
  mode,
  places = [],
  licensePlate,
  sensorSpeedKmh,
  children,
  profileTools,
  renderProfileTools,
  ...mapProps
}: NavigationMapControllerProps) => {
  const { requestRoute } = useRouteNavigation();
  const { speedKmh } = useVelocityGuard();
  const activeRoute = useNavigationStore((state) => state.activeRoute);
  const destination = useNavigationStore((state) => state.destination);
  const errorMessage = useNavigationStore((state) => state.errorMessage);
  const isRouting = useNavigationStore((state) => state.isRouting);
  const remainingDistanceMeters = useNavigationStore((state) => state.remainingDistanceMeters);
  const clearRoute = useNavigationStore((state) => state.clearRoute);
  const failRouting = useNavigationStore((state) => state.failRouting);
  const [query, setQuery] = useState('');
  const [isCopilot, setIsCopilot] = useState(false);
  const [isNavigationPanelOpen, setIsNavigationPanelOpen] = useState(false);
  const effectiveSpeedKmh = sensorSpeedKmh ?? speedKmh;
  const hasActiveRoute = Boolean(activeRoute);
  const isLocked = isNavigationUiLocked(effectiveSpeedKmh, isCopilot, hasActiveRoute);
  const isSecurityHeatmapDrivingLock = effectiveSpeedKmh > DRIVING_LOCK_THRESHOLD_KMH;
  const routePoints = activeRoute ? toRoutePoints(activeRoute.geometry) : undefined;
  const suggestions = useMemo(
    () => getDestinationSuggestions(query, places),
    [places, query]
  );

  const requestDestinationRoute = async (target: RouteWaypoint) => {
    setQuery(getQueryLabel(target));
    await requestRoute({
      origin: center,
      destination: target,
      mode,
      licensePlate,
    }).catch(() => undefined);
  };

  const submitQuery = () => {
    const target = resolveDestination(query, places);
    if (!target) {
      failRouting('Busca y selecciona un destino disponible.');
      return;
    }

    void requestDestinationRoute(target);
  };

  const cancelNavigation = () => {
    clearRoute();
    setQuery('');
    setIsNavigationPanelOpen(false);
  };

  const resolvedProfileTools = renderProfileTools
    ? renderProfileTools(null)
    : profileTools;

  return (
    <QuillaMap
      {...mapProps}
      center={center}
      mode={mode}
      places={places}
      routePoints={routePoints}
      shadeRouteSegments={activeRoute?.shadeSegments}
      destinationCoordinate={destination}
      securityHeatmapMode={isSecurityHeatmapDrivingLock ? 'driving-lock' : 'heatmap'}
      profileTools={resolvedProfileTools}
      navigationControl={{
        hasActiveRoute,
        isActive: isNavigationPanelOpen,
        onCancel: cancelNavigation,
        onPress: () => setIsNavigationPanelOpen((value) => !value),
      }}
    >
      {children}
      <NavigationSearchOverlay
        activeRoute={activeRoute}
        errorMessage={errorMessage}
        isOpen={isNavigationPanelOpen}
        isCopilot={isCopilot}
        isLocked={isLocked}
        isRouting={isRouting}
        query={query}
        remainingDistanceMeters={remainingDistanceMeters}
        suggestions={suggestions}
        onClose={() => setIsNavigationPanelOpen(false)}
        onCopilotToggle={() => setIsCopilot((value) => !value)}
        onQueryChange={setQuery}
        onSelectSuggestion={(place) => {
          void requestDestinationRoute(toWaypoint(place));
        }}
        onSubmit={submitQuery}
      />
    </QuillaMap>
  );
};

export default NavigationMapController;
