import { useEffect, useMemo, useState } from 'react';
import { transitApi } from '@/api/client';
import { resolveDestination } from '@/features/navigation/utils/destinationSearch';
import {
  getTransitOperatorGroups,
  toBusSuggestionTransitMap,
  toTransmetroSuggestionTransitMap,
} from '@/features/navigation/utils/navigationMapController.utils';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type {
  TransitAgencyKind,
  TransitBusSuggestion,
  TransitBusSuggestionsResponse,
  TransitMapResponse,
  TransitTransmetroSuggestion,
  TransitTransmetroSuggestionsResponse,
} from '@/types/contracts/transit.contract';
import {
  INITIAL_PUBLIC_TRANSPORT_MODE,
  INITIAL_TRANSIT_AGENCY_KIND,
  INITIAL_TRANSIT_SELECTION_BY_AGENCY,
  PUBLIC_TRANSPORT_ERROR_MESSAGES,
} from '../constants/publicTransport.constants';
import {
  emptyTransitFinderState,
  type PublicTransportMode,
  type TransitFinderState,
  type TransitSuggestionKind,
} from '../types/publicTransport.types';
import {
  getAgencyKindForPublicTransportMode,
  getFinderByKind,
  getFinderWithPlace,
  getFinderWithQuery,
  getFinderWithResolvedPoints,
  getPublicTransportSuggestionErrorMessage,
  getSelectedTransitOperator,
  getSelectedTransitRoute,
  getTransitSuggestionInstructions,
  getVisibleTransitMap,
  toTransitSuggestionRequest,
} from '../utils/publicTransport.utils';

export const usePublicTransportController = (places: PlaceMapFeature[]) => {
  const [transitMap, setTransitMap] = useState<TransitMapResponse | null>(null);
  const [transitAgencyKind, setTransitAgencyKind] = useState<TransitAgencyKind>(INITIAL_TRANSIT_AGENCY_KIND);
  const [publicTransportMode, setPublicTransportMode] = useState(INITIAL_PUBLIC_TRANSPORT_MODE);
  const [selectedTransitOperatorKeys, setSelectedTransitOperatorKeys] = useState<Record<TransitAgencyKind, string | null>>(
    INITIAL_TRANSIT_SELECTION_BY_AGENCY
  );
  const [selectedTransitRouteIds, setSelectedTransitRouteIds] = useState<Record<TransitAgencyKind, string | null>>(
    INITIAL_TRANSIT_SELECTION_BY_AGENCY
  );
  const [busFinder, setBusFinder] = useState<TransitFinderState>(emptyTransitFinderState);
  const [transmetroFinder, setTransmetroFinder] = useState<TransitFinderState>(emptyTransitFinderState);
  const [busSuggestions, setBusSuggestions] = useState<TransitBusSuggestionsResponse | null>(null);
  const [transmetroSuggestions, setTransmetroSuggestions] = useState<TransitTransmetroSuggestionsResponse | null>(null);
  const [isLoadingBusSuggestions, setIsLoadingBusSuggestions] = useState(false);
  const [isLoadingTransmetroSuggestions, setIsLoadingTransmetroSuggestions] = useState(false);
  const [busSuggestionError, setBusSuggestionError] = useState<string | null>(null);
  const [transmetroSuggestionError, setTransmetroSuggestionError] = useState<string | null>(null);
  const [selectedTransitSuggestionMap, setSelectedTransitSuggestionMap] = useState<TransitMapResponse | null>(null);
  const [selectedTransitInstructions, setSelectedTransitInstructions] = useState<string[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const transitOperatorGroups = useMemo(
    () => getTransitOperatorGroups(transitMap, transitAgencyKind),
    [transitAgencyKind, transitMap]
  );
  const selectedTransitOperatorKey = selectedTransitOperatorKeys[transitAgencyKind];
  const selectedTransitRouteId = selectedTransitRouteIds[transitAgencyKind];
  const selectedTransitOperator = useMemo(
    () => getSelectedTransitOperator(transitOperatorGroups, selectedTransitOperatorKey),
    [selectedTransitOperatorKey, transitOperatorGroups]
  );
  const selectedTransitRoute = useMemo(
    () => getSelectedTransitRoute(selectedTransitOperator, selectedTransitRouteId),
    [selectedTransitOperator, selectedTransitRouteId]
  );
  const visibleTransitMap = useMemo(
    () => getVisibleTransitMap(transitMap, transitAgencyKind, selectedTransitSuggestionMap, selectedTransitRoute),
    [selectedTransitRoute, selectedTransitSuggestionMap, transitAgencyKind, transitMap]
  );

  useEffect(() => {
    let isMounted = true;

    transitApi.getRouteMap()
      .then((response) => {
        if (isMounted) {
          setTransitMap(response);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTransitMap(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTransitOperatorKey && transitOperatorGroups[0]) {
      setSelectedTransitOperatorKeys((current) => ({
        ...current,
        [transitAgencyKind]: transitOperatorGroups[0].key,
      }));
    }
  }, [selectedTransitOperatorKey, transitAgencyKind, transitOperatorGroups]);

  const activatePublicTransportMode = (nextMode: PublicTransportMode) => {
    setIsPanelOpen(true);
    setPublicTransportMode(nextMode);
    setSelectedTransitSuggestionMap(null);
    setSelectedTransitInstructions([]);
    setTransitAgencyKind(getAgencyKindForPublicTransportMode(nextMode));
  };

  const openPublicTransportPanel = () => {
    setSelectedTransitSuggestionMap(null);
    setSelectedTransitInstructions([]);
    setSelectedTransitRouteIds((current) => ({
      ...current,
      [transitAgencyKind]: null,
    }));
    setIsPanelOpen(true);
  };

  const selectTransitOperator = (operatorKey: string) => {
    setSelectedTransitOperatorKeys((current) => ({
      ...current,
      [transitAgencyKind]: operatorKey,
    }));
    setSelectedTransitRouteIds((current) => ({
      ...current,
      [transitAgencyKind]: null,
    }));
    setSelectedTransitSuggestionMap(null);
    setSelectedTransitInstructions([]);
  };

  const selectTransitRoute = (routeId: string) => {
    setSelectedTransitRouteIds((current) => ({
      ...current,
      [transitAgencyKind]: routeId,
    }));
    setSelectedTransitSuggestionMap(null);
    setSelectedTransitInstructions([]);
    setIsPanelOpen(false);
  };

  const updateFinderState = (
    kind: TransitSuggestionKind,
    updater: (current: TransitFinderState) => TransitFinderState
  ) => {
    if (kind === 'bus') {
      setBusFinder(updater);
      return;
    }

    setTransmetroFinder(updater);
  };

  const setFinderQuery = (
    kind: TransitSuggestionKind,
    point: 'pointA' | 'pointB',
    queryValue: string
  ) => {
    updateFinderState(kind, (current) => getFinderWithQuery(current, point, queryValue));
  };

  const selectFinderPlace = (
    kind: TransitSuggestionKind,
    point: 'pointA' | 'pointB',
    place: PlaceMapFeature
  ) => {
    updateFinderState(kind, (current) => getFinderWithPlace(current, point, place));
    setSelectedTransitSuggestionMap(null);
    setSelectedTransitInstructions([]);
  };

  const requestTransitSuggestions = async (kind: TransitSuggestionKind) => {
    const finder = getFinderByKind(kind, busFinder, transmetroFinder);
    const pointA = finder.pointA ?? resolveDestination(finder.pointAQuery, places);
    const pointB = finder.pointB ?? resolveDestination(finder.pointBQuery, places);

    if (!pointA || !pointB) {
      const message = PUBLIC_TRANSPORT_ERROR_MESSAGES.missingPoints;
      if (kind === 'bus') {
        setBusSuggestionError(message);
      } else {
        setTransmetroSuggestionError(message);
      }
      return;
    }

    updateFinderState(kind, (current) => getFinderWithResolvedPoints(current, pointA, pointB));
    setSelectedTransitSuggestionMap(null);
    setSelectedTransitInstructions([]);

    if (kind === 'bus') {
      setIsLoadingBusSuggestions(true);
      setBusSuggestionError(null);

      try {
        const response = await transitApi.getBusSuggestions(toTransitSuggestionRequest(pointA, pointB, 'colectivo'));
        setBusSuggestions(response);
      } catch (error: unknown) {
        setBusSuggestions(null);
        setBusSuggestionError(getPublicTransportSuggestionErrorMessage(error));
      } finally {
        setIsLoadingBusSuggestions(false);
      }
      return;
    }

    setIsLoadingTransmetroSuggestions(true);
    setTransmetroSuggestionError(null);

    try {
      const response = await transitApi.getTransmetroSuggestions(toTransitSuggestionRequest(pointA, pointB, 'transmetro'));
      setTransmetroSuggestions(response);
    } catch (error: unknown) {
      setTransmetroSuggestions(null);
      setTransmetroSuggestionError(getPublicTransportSuggestionErrorMessage(error));
    } finally {
      setIsLoadingTransmetroSuggestions(false);
    }
  };

  const selectBusSuggestion = (suggestion: TransitBusSuggestion) => {
    setSelectedTransitSuggestionMap(toBusSuggestionTransitMap(suggestion, transitMap));
    setSelectedTransitInstructions(getTransitSuggestionInstructions(suggestion));
    setIsPanelOpen(false);
  };

  const selectTransmetroSuggestion = (suggestion: TransitTransmetroSuggestion) => {
    setSelectedTransitSuggestionMap(toTransmetroSuggestionTransitMap(suggestion, transitMap));
    setSelectedTransitInstructions(getTransitSuggestionInstructions(suggestion));
    setIsPanelOpen(false);
  };

  return {
    busFinder,
    busSuggestionError,
    busSuggestions,
    isPanelOpen,
    isLoadingBusSuggestions,
    isLoadingTransmetroSuggestions,
    publicTransportMode,
    selectedTransitOperator,
    selectedTransitInstructions,
    selectedTransitRoute,
    transitAgencyKind,
    transitOperatorGroups,
    transmetroFinder,
    transmetroSuggestionError,
    transmetroSuggestions,
    visibleTransitMap,
    activatePublicTransportMode,
    openPublicTransportPanel,
    requestTransitSuggestions,
    selectBusSuggestion,
    selectFinderPlace,
    selectTransitOperator,
    selectTransitRoute,
    selectTransmetroSuggestion,
    setFinderQuery,
  };
};
