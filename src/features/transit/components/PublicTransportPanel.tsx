import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import tw from '@/lib/tailwind';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type {
  TransitAgencyKind,
  TransitBusSuggestion,
  TransitBusSuggestionsResponse,
  TransitMapRouteFeature,
  TransitTransmetroSuggestion,
  TransitTransmetroSuggestionsResponse,
} from '@/types/contracts/transit.contract';
import type { TransitOperatorGroup } from '@/features/navigation/utils/navigationMapController.utils';
import type {
  PublicTransportMode,
  TransitFinderState,
} from '../types/publicTransport.types';
import TransitRouteSelector from './TransitRouteSelector';
import TransitSuggestionFinder from './TransitSuggestionFinder';

interface PublicTransportPanelProps {
  publicTransportMode: PublicTransportMode;
  transitAgencyKind: TransitAgencyKind;
  transitOperatorGroups: TransitOperatorGroup[];
  selectedTransitOperator: TransitOperatorGroup | null;
  selectedTransitRoute: TransitMapRouteFeature | null;
  places: PlaceMapFeature[];
  busFinder: TransitFinderState;
  transmetroFinder: TransitFinderState;
  busSuggestions: TransitBusSuggestionsResponse | null;
  transmetroSuggestions: TransitTransmetroSuggestionsResponse | null;
  isLoadingBusSuggestions: boolean;
  isLoadingTransmetroSuggestions: boolean;
  busSuggestionError: string | null;
  transmetroSuggestionError: string | null;
  onBack: () => void;
  onModeChange: (mode: PublicTransportMode) => void;
  onOperatorSelect: (operatorKey: string) => void;
  onRouteSelect: (routeId: string) => void;
  onFinderQueryChange: (kind: 'bus' | 'transmetro', point: 'pointA' | 'pointB', value: string) => void;
  onFinderPlaceSelect: (kind: 'bus' | 'transmetro', point: 'pointA' | 'pointB', place: PlaceMapFeature) => void;
  onFindBusSubmit: () => void;
  onFindTransmetroSubmit: () => void;
  onBusSuggestionSelect: (suggestion: TransitBusSuggestion) => void;
  onTransmetroSuggestionSelect: (suggestion: TransitTransmetroSuggestion) => void;
}

const PublicTransportPanel = ({
  publicTransportMode,
  transitAgencyKind,
  transitOperatorGroups,
  selectedTransitOperator,
  selectedTransitRoute,
  places,
  busFinder,
  transmetroFinder,
  busSuggestions,
  transmetroSuggestions,
  isLoadingBusSuggestions,
  isLoadingTransmetroSuggestions,
  busSuggestionError,
  transmetroSuggestionError,
  onBack,
  onModeChange,
  onOperatorSelect,
  onRouteSelect,
  onFinderQueryChange,
  onFinderPlaceSelect,
  onFindBusSubmit,
  onFindTransmetroSubmit,
  onBusSuggestionSelect,
  onTransmetroSuggestionSelect,
}: PublicTransportPanelProps) => (
  <View
    testID="public-transport-panel"
    style={[tw`absolute left-0 right-0 top-14 bottom-0 rounded-m border border-medium-gray bg-white p-s`, { zIndex: 40, elevation: 40 }]}
  >
    <View style={tw`mb-s flex-row items-center`}>
      <Text style={tw`flex-1 text-lg font-bold text-primary`}>Transporte público</Text>
      <Pressable
        testID="public-transport-close"
        accessibilityRole="button"
        accessibilityLabel="Volver al mapa principal"
        onPress={onBack}
        style={tw`rounded-s border border-primary px-s py-xs`}
      >
        <Text style={tw`font-bold text-primary`}>Volver</Text>
      </Pressable>
    </View>

    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={tw`mb-s flex-row flex-wrap`}>
        <Pressable
          testID="public-transport-buses"
          accessibilityRole="button"
          accessibilityState={{ selected: publicTransportMode === 'buses' }}
          onPress={() => onModeChange('buses')}
          style={tw`mb-xs mr-xs rounded-s border border-primary px-s py-xs`}
        >
          <Text style={tw`font-bold text-primary`}>Buses</Text>
        </Pressable>
        <Pressable
          testID="public-transport-transmetro"
          accessibilityRole="button"
          accessibilityState={{ selected: publicTransportMode === 'transmetro' }}
          onPress={() => onModeChange('transmetro')}
          style={tw`mb-xs mr-xs rounded-s border border-primary px-s py-xs`}
        >
          <Text style={tw`font-bold text-primary`}>Transmetro</Text>
        </Pressable>
        <Pressable
          testID="public-transport-find-bus"
          accessibilityRole="button"
          accessibilityState={{ selected: publicTransportMode === 'find-bus' }}
          onPress={() => onModeChange('find-bus')}
          style={tw`mb-xs mr-xs rounded-s border border-primary px-s py-xs`}
        >
          <Text style={tw`font-bold text-primary`}>¿Qué bus me sirve?</Text>
        </Pressable>
        <Pressable
          testID="public-transport-find-transmetro"
          accessibilityRole="button"
          accessibilityState={{ selected: publicTransportMode === 'find-transmetro' }}
          onPress={() => onModeChange('find-transmetro')}
          style={tw`mb-xs mr-xs rounded-s border border-primary px-s py-xs`}
        >
          <Text style={tw`font-bold text-primary`}>¿Qué Transmetro me sirve?</Text>
        </Pressable>
      </View>

      {publicTransportMode === 'buses' || publicTransportMode === 'transmetro' ? (
        <TransitRouteSelector
          transitAgencyKind={transitAgencyKind}
          transitOperatorGroups={transitOperatorGroups}
          selectedTransitOperator={selectedTransitOperator}
          selectedTransitRoute={selectedTransitRoute}
          onModeChange={onModeChange}
          onOperatorSelect={onOperatorSelect}
          onRouteSelect={onRouteSelect}
        />
      ) : null}
      {publicTransportMode === 'find-bus' ? (
        <TransitSuggestionFinder
          kind="bus"
          finder={busFinder}
          places={places}
          response={busSuggestions}
          isLoading={isLoadingBusSuggestions}
          error={busSuggestionError}
          onQueryChange={(point, value) => onFinderQueryChange('bus', point, value)}
          onPlaceSelect={(point, place) => onFinderPlaceSelect('bus', point, place)}
          onSubmit={onFindBusSubmit}
          onSuggestionSelect={(suggestion) => onBusSuggestionSelect(suggestion as TransitBusSuggestion)}
        />
      ) : null}
      {publicTransportMode === 'find-transmetro' ? (
        <TransitSuggestionFinder
          kind="transmetro"
          finder={transmetroFinder}
          places={places}
          response={transmetroSuggestions}
          isLoading={isLoadingTransmetroSuggestions}
          error={transmetroSuggestionError}
          onQueryChange={(point, value) => onFinderQueryChange('transmetro', point, value)}
          onPlaceSelect={(point, place) => onFinderPlaceSelect('transmetro', point, place)}
          onSubmit={onFindTransmetroSubmit}
          onSuggestionSelect={(suggestion) => onTransmetroSuggestionSelect(suggestion as TransitTransmetroSuggestion)}
        />
      ) : null}
    </ScrollView>
  </View>
);

export default PublicTransportPanel;
