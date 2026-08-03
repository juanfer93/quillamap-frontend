import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import tw from '@/lib/tailwind';
import { thermalComfortApi } from '@/api';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { RouteWaypoint } from '@/types/contracts/navigation.contract';
import { getDestinationSuggestions, resolveDestination } from '@/features/navigation/utils/destinationSearch';
import type {
  ThermalComfortRoutePreview,
  ThermalComfortSearchMode,
} from '../types/thermalComfortRoute.types';
import { toThermalComfortRoutePreview } from '../utils/thermalComfortRouteOverlay';

const THERMAL_COMFORT_GREEN_COVERAGE_RADIUS_METERS = 800;

interface ThermalComfortRouteSearchPanelProps {
  currentLocation?: RouteWaypoint | null;
  places: PlaceMapFeature[];
  onClose: () => void;
  onClearPreview: () => void;
  onRoutePreview: (preview: ThermalComfortRoutePreview) => void;
}

const getPlaceName = (place: PlaceMapFeature): string => place.name.es;

const getShadeSegmentsLabel = (preview: ThermalComfortRoutePreview): string => {
  const total = preview.shadeSegments.length;
  return total === 1 ? '1 zona dibujada en el mapa' : `${total} zonas dibujadas en el mapa`;
};

const getGreenCoverageLabel = (preview: ThermalComfortRoutePreview): string =>
  preview.greenCoverageCount === 1
    ? '1 zona verde cercana'
    : `${preview.greenCoverageCount} zonas verdes cercanas`;

const ThermalComfortRouteSearchPanel = ({
  currentLocation,
  places,
  onClose,
  onClearPreview,
  onRoutePreview,
}: ThermalComfortRouteSearchPanelProps) => {
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<ThermalComfortRoutePreview | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const suggestions = useMemo(
    () => getDestinationSuggestions(query, places),
    [places, query],
  );

  const requestFreshRoute = async (
    destination: RouteWaypoint | null,
    searchMode: ThermalComfortSearchMode
  ) => {
    if (!destination) {
      setErrorMessage(
        searchMode === 'current_location'
          ? 'Activa tu ubicacion para buscar zonas frescas cercanas.'
          : 'Busca y selecciona un destino disponible.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const greenCoverage = await thermalComfortApi.findGreenCoverage({
        lat: destination.latitude,
        lng: destination.longitude,
        radius: THERMAL_COMFORT_GREEN_COVERAGE_RADIUS_METERS,
      });
      const routePreview = toThermalComfortRoutePreview(destination, greenCoverage, searchMode);

      if (routePreview.shadeSegments.length === 0) {
        setPreview(null);
        setErrorMessage('No encontramos zonas frescas cerca de ese lugar.');
        return;
      }

      setPreview(routePreview);
      setQuery(searchMode === 'current_location' ? '' : destination.label ?? query);
      onRoutePreview(routePreview);
    } catch {
      setPreview(null);
      setErrorMessage('No fue posible buscar zonas frescas cerca de ese lugar.');
    } finally {
      setIsLoading(false);
    }
  };

  const requestNearCurrentLocation = () => {
    void requestFreshRoute(
      currentLocation ? { ...currentLocation, label: 'Mi ubicacion' } : null,
      'current_location'
    );
  };

  const submitQuery = () => {
    void requestFreshRoute(resolveDestination(query, places), 'place');
  };

  const selectSuggestion = (place: PlaceMapFeature) => {
    const destination = { ...place.coordinate, label: place.name.es };
    void requestFreshRoute(destination, 'place');
  };

  const clearPreview = () => {
    setPreview(null);
    setErrorMessage(null);
    onClearPreview();
  };

  return (
    <View
      testID="thermal-comfort-route-search-panel"
      style={tw`absolute left-m right-m bottom-24 rounded-m border border-medium-gray bg-white px-m pt-m pb-s shadow-lg`}
    >
      <View style={tw`flex-row items-center`}>
        <Text style={tw`flex-1 text-primary font-bold`}>Zonas verdes</Text>
        <Pressable
          testID="thermal-comfort-route-panel-close"
          accessibilityRole="button"
          accessibilityLabel="Cerrar busqueda de ruta fresca"
          onPress={onClose}
          style={tw`w-9 h-9 rounded-s items-center justify-center`}
        >
          <Text style={tw`text-primary text-xl font-bold`}>x</Text>
        </Pressable>
      </View>
      <Text style={tw`mt-xs text-dark-gray`}>
        Incluye arboles, parques y areas con pasto cerca de tu busqueda.
      </Text>

      <Pressable
        testID="thermal-comfort-route-current-location"
        accessibilityRole="button"
        accessibilityLabel="Buscar zonas frescas cerca de mi ubicacion"
        disabled={isLoading}
        onPress={requestNearCurrentLocation}
        style={[tw`mt-s rounded-s border border-primary px-m py-s items-center`, isLoading ? { opacity: 0.6 } : null]}
      >
        <Text style={tw`text-primary font-bold`}>Cerca de mi ubicacion</Text>
      </Pressable>

      <View style={tw`mt-s flex-row items-center`}>
        <TextInput
          testID="thermal-comfort-route-destination-input"
          accessibilityLabel="Buscar destino fresco"
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar lugar o zona verde"
          placeholderTextColor="#6B7280"
          style={[tw`flex-1 rounded-s border border-medium-gray px-s py-s text-dark-gray`, { borderColor: '#004574' }]}
        />
        <Pressable
          testID="thermal-comfort-route-submit"
          accessibilityRole="button"
          disabled={isLoading}
          onPress={submitQuery}
          style={[tw`ml-s rounded-s bg-primary px-m py-s`, isLoading ? { opacity: 0.6 } : null]}
        >
          <Text style={tw`text-white font-bold`}>{isLoading ? '...' : 'Buscar'}</Text>
        </Pressable>
      </View>

      {suggestions.length > 0 ? (
        <View testID="thermal-comfort-route-suggestions-list" style={tw`mt-s border-t border-light-gray pt-xs`}>
          {suggestions.map((place) => (
            <Pressable
              key={place.id}
              testID={`thermal-comfort-route-suggestion-${place.id}`}
              accessibilityRole="button"
              onPress={() => selectSuggestion(place)}
              style={tw`py-s`}
            >
              <Text style={tw`text-primary font-bold`}>{getPlaceName(place)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {preview ? (
        <View testID="thermal-comfort-route-result" style={tw`mt-s border-t border-light-gray pt-s`}>
          <Text style={tw`text-primary font-bold`}>{getGreenCoverageLabel(preview)}</Text>
          <Text style={tw`mt-xs text-dark-gray font-bold`}>
            {getShadeSegmentsLabel(preview)}
          </Text>
          <Pressable
            testID="thermal-comfort-route-clear"
            accessibilityRole="button"
            accessibilityLabel="Borrar zonas verdes"
            onPress={clearPreview}
            style={tw`mt-s rounded-s border border-primary px-m py-s items-center`}
          >
            <Text style={tw`text-primary font-bold`}>Borrar zonas verdes</Text>
          </Pressable>
        </View>
      ) : null}

      {errorMessage ? (
        <Text testID="thermal-comfort-route-error" style={tw`mt-s text-error`}>
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
};

export default ThermalComfortRouteSearchPanel;
