import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import tw from '@/lib/tailwind';
import { getDestinationSuggestions } from '@/features/navigation/utils/destinationSearch';
import {
  getFormattedDistance,
  getFormattedDuration,
} from '@/features/navigation/utils/navigationMapController.utils';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type {
  TransitFinderState,
  TransitSuggestion,
  TransitSuggestionKind,
  TransitSuggestionResponse,
} from '../types/publicTransport.types';
import {
  getTransitSuggestionInstructions,
  getTransitSuggestionTitle,
} from '../utils/publicTransport.utils';
import TransitSuggestionSteps from './TransitSuggestionSteps';

interface TransitSuggestionFinderProps {
  kind: TransitSuggestionKind;
  finder: TransitFinderState;
  places: PlaceMapFeature[];
  response: TransitSuggestionResponse | null;
  isLoading: boolean;
  error: string | null;
  onQueryChange: (point: 'pointA' | 'pointB', value: string) => void;
  onPlaceSelect: (point: 'pointA' | 'pointB', place: PlaceMapFeature) => void;
  onSubmit: () => void;
  onSuggestionSelect: (suggestion: TransitSuggestion) => void;
}

const TransitSuggestionFinder = ({
  kind,
  finder,
  places,
  response,
  isLoading,
  error,
  onQueryChange,
  onPlaceSelect,
  onSubmit,
  onSuggestionSelect,
}: TransitSuggestionFinderProps) => {
  const renderInput = (point: 'pointA' | 'pointB', label: string) => {
    const queryValue = point === 'pointA' ? finder.pointAQuery : finder.pointBQuery;
    const selectedPoint = point === 'pointA' ? finder.pointA : finder.pointB;
    const suggestions = selectedPoint ? [] : getDestinationSuggestions(queryValue, places);
    const testPrefix = `public-transport-find-${kind === 'bus' ? 'bus' : 'transmetro'}-${point === 'pointA' ? 'point-a' : 'point-b'}`;

    return (
      <View style={tw`mb-s`}>
        <Text style={tw`mb-xs text-xs font-bold text-dark-gray`}>{label}</Text>
        <TextInput
          testID={`${testPrefix}-input`}
          value={queryValue}
          onChangeText={(value) => onQueryChange(point, value)}
          placeholder={`Buscar ${label}`}
          placeholderTextColor="#666666"
          style={tw`rounded-s border border-light-gray bg-white px-s py-s text-primary`}
        />
        {suggestions.map((place) => (
          <Pressable
            key={place.id}
            testID={`${testPrefix}-suggestion-${place.id}`}
            accessibilityRole="button"
            onPress={() => onPlaceSelect(point, place)}
            style={tw`mt-xs rounded-s bg-surface-light px-s py-xs`}
          >
            <Text style={tw`text-primary`}>{place.name.es}</Text>
          </Pressable>
        ))}
      </View>
    );
  };

  const rutasPosibles = response?.rutasPosibles.slice(0, 4) ?? [];

  return (
    <View>
      {renderInput('pointA', 'Punto A')}
      {renderInput('pointB', 'Punto B')}
      <Pressable
        testID={`public-transport-find-${kind === 'bus' ? 'bus' : 'transmetro'}-submit`}
        accessibilityRole="button"
        onPress={onSubmit}
        style={tw`mb-s min-h-10 items-center justify-center rounded-s bg-primary px-s`}
      >
        <Text style={tw`font-bold text-white`}>Buscar opciones</Text>
      </Pressable>

      {isLoading ? <Text style={tw`text-dark-gray`}>Buscando opciones...</Text> : null}
      {error ? <Text testID={`public-transport-find-${kind}-error`} style={tw`text-error`}>{error}</Text> : null}
      {response && rutasPosibles.length === 0 && !error ? (
        <Text style={tw`text-dark-gray`}>{response.coverage.note ?? 'No hay opciones para esos puntos.'}</Text>
      ) : null}

      {rutasPosibles.map((suggestion, index) => {
        const instructions = getTransitSuggestionInstructions(suggestion);

        return (
          <Pressable
            key={`${kind}-${index}-${getTransitSuggestionTitle(kind, suggestion)}`}
            testID={`transit-suggestion-card-${index}`}
            accessibilityRole="button"
            onPress={() => onSuggestionSelect(suggestion)}
            style={tw`mb-s rounded-m border border-light-gray bg-white p-s`}
          >
            <Text style={tw`font-bold text-primary`}>{getTransitSuggestionTitle(kind, suggestion)}</Text>
            <Text style={tw`mt-xs text-dark-gray`}>
              {getFormattedDuration(suggestion.durationSeconds)} | {getFormattedDistance(suggestion.totalDistanceMeters)} | caminata aprox. {getFormattedDistance(suggestion.totalWalkMeters)}
            </Text>
            {'seleccion' in suggestion && suggestion.seleccion ? (
              <Text style={tw`mt-xs text-xs text-dark-gray`}>{suggestion.seleccion.summary}</Text>
            ) : null}
            <TransitSuggestionSteps instructions={instructions} compact />
          </Pressable>
        );
      })}
    </View>
  );
};

export default TransitSuggestionFinder;
