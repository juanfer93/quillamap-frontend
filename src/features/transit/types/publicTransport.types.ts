import type { RouteWaypoint } from '@/types/contracts/navigation.contract';
import type {
  TransitBusSuggestion,
  TransitBusSuggestionsResponse,
  TransitTransmetroSuggestion,
  TransitTransmetroSuggestionsResponse,
} from '@/types/contracts/transit.contract';

export type PublicTransportMode = 'buses' | 'transmetro' | 'find-bus' | 'find-transmetro';
export type TransitSuggestionKind = 'bus' | 'transmetro';
export type TransitSuggestion = TransitBusSuggestion | TransitTransmetroSuggestion;
export type TransitSuggestionResponse = TransitBusSuggestionsResponse | TransitTransmetroSuggestionsResponse;

export interface TransitFinderState {
  pointAQuery: string;
  pointBQuery: string;
  pointA: RouteWaypoint | null;
  pointB: RouteWaypoint | null;
}

export const emptyTransitFinderState: TransitFinderState = {
  pointAQuery: '',
  pointBQuery: '',
  pointA: null,
  pointB: null,
};
