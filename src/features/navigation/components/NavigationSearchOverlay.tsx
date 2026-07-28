import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { RouteResponse } from '@/types/contracts/navigation.contract';
import { NAVIGATION_VISUAL_IDENTITY } from '@/types/contracts/navigation.contract';
import tw from '@/lib/tailwind';

interface NavigationSearchOverlayProps {
  activeRoute: RouteResponse | null;
  errorMessage: string | null;
  isOpen: boolean;
  isCopilot: boolean;
  isLocked: boolean;
  isRouting: boolean;
  query: string;
  remainingDistanceMeters: number;
  suggestions: PlaceMapFeature[];
  onClose: () => void;
  onCopilotToggle: () => void;
  onQueryChange: (value: string) => void;
  onSelectSuggestion: (place: PlaceMapFeature) => void;
  onSubmit: () => void;
}

const formatDistance = (meters: number): string =>
  meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;

const formatDuration = (seconds: number): string => `${Math.max(1, Math.round(seconds / 60))} min`;

const getPlaceName = (place: PlaceMapFeature): string => place.name.es;

const getTransitLegLabel = (leg: NonNullable<RouteResponse['transit']>['legs'][number]): string => {
  if (leg.type === 'walk') {
    return 'Caminar';
  }

  if (leg.type === 'transfer') {
    return 'Transbordo';
  }

  return leg.routeShortName ? `Bus ${leg.routeShortName}` : 'Bus';
};

const NavigationSearchOverlay = ({
  activeRoute,
  errorMessage,
  isOpen,
  isCopilot,
  isLocked,
  isRouting,
  query,
  remainingDistanceMeters,
  suggestions,
  onClose,
  onCopilotToggle,
  onQueryChange,
  onSelectSuggestion,
  onSubmit,
}: NavigationSearchOverlayProps) => {
  const distanceText = formatDistance(remainingDistanceMeters);

  if (!isOpen && !isLocked) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={[tw`absolute left-m right-m`, { top: 64 }]}>
      {isLocked ? (
        <View
          testID="navigation-driving-lock"
          style={[
            tw`rounded-m px-m py-s`,
            { backgroundColor: NAVIGATION_VISUAL_IDENTITY.sharkBlue },
          ]}
        >
          <Text style={tw`text-white font-bold`}>Guia activa</Text>
          <Text style={tw`text-white mt-xs`}>
            {distanceText} restantes. Busqueda bloqueada por velocidad.
          </Text>
          <Pressable
            testID="navigation-copilot-toggle"
            accessibilityRole="button"
            onPress={onCopilotToggle}
            style={tw`mt-s self-start rounded-s bg-white px-m py-s`}
          >
            <Text style={{ color: NAVIGATION_VISUAL_IDENTITY.sharkBlue, fontWeight: '700' }}>
              Soy Copiloto
            </Text>
          </Pressable>
        </View>
      ) : (
        <View testID="navigation-search-panel" style={tw`rounded-m bg-white px-m pt-m pb-s shadow-lg`}>
          <View style={tw`flex-row items-center`}>
            <TextInput
              testID="navigation-destination-input"
              accessibilityLabel="Buscar destino"
              value={query}
              onChangeText={onQueryChange}
              placeholder="Buscar destino o lat,lng"
              placeholderTextColor="#6B7280"
              style={[
                tw`flex-1 rounded-s border border-medium-gray px-s py-s text-dark-gray`,
                { borderColor: NAVIGATION_VISUAL_IDENTITY.sharkBlue },
              ]}
            />
            <Pressable
              testID="navigation-route-submit"
              accessibilityRole="button"
              disabled={isRouting}
              onPress={onSubmit}
              style={[
                tw`ml-s rounded-s px-m py-s`,
                { backgroundColor: NAVIGATION_VISUAL_IDENTITY.sharkBlue, opacity: isRouting ? 0.6 : 1 },
              ]}
            >
              <Text style={tw`text-white font-bold`}>{isRouting ? '...' : 'Ir'}</Text>
            </Pressable>
            <Pressable
              testID="navigation-panel-close"
              accessibilityRole="button"
              accessibilityLabel="Cerrar navegacion"
              onPress={onClose}
              style={tw`ml-xs w-9 h-9 rounded-s items-center justify-center`}
            >
              <Text style={tw`text-primary text-xl font-bold`}>x</Text>
            </Pressable>
          </View>

          {suggestions.length > 0 ? (
            <View testID="navigation-suggestions-list" style={tw`mt-m border-t border-light-gray pt-xs`}>
              {suggestions.map((place) => (
                <Pressable
                  key={place.id}
                  testID={`navigation-suggestion-${place.id}`}
                  accessibilityRole="button"
                  onPress={() => onSelectSuggestion(place)}
                  style={tw`py-s`}
                >
                  <Text style={tw`text-primary font-bold`}>{getPlaceName(place)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          {activeRoute ? (
            <View style={tw`mt-m border-t border-light-gray pt-s`}>
              <Text testID="navigation-route-summary" style={tw`mt-s text-primary font-bold`}>
                {distanceText} - ETA {formatDuration(activeRoute.durationSeconds)}
              </Text>
              {activeRoute.transit ? (
                <View testID="navigation-transit-stack" style={tw`mt-s`}>
                  <Text testID="navigation-transit-best-route" style={tw`text-primary font-bold`}>
                    Ruta mas corta - {activeRoute.transit.transfers} transbordo{activeRoute.transit.transfers === 1 ? '' : 's'}
                  </Text>
                  {activeRoute.transit.legs.map((leg) => (
                    <View
                      key={leg.id}
                      testID={`navigation-transit-leg-${leg.id}`}
                      style={tw`mt-xs flex-row items-center justify-between`}
                    >
                      <Text numberOfLines={1} style={tw`mr-s flex-1 text-dark-gray`}>
                        {getTransitLegLabel(leg)}
                      </Text>
                      <Text style={tw`text-primary font-bold`}>
                        {formatDuration(leg.durationSeconds)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {activeRoute.alerts[0] ? (
                <Text testID="navigation-route-alert" style={tw`mt-xs text-error font-bold`}>
                  {activeRoute.alerts[0].title}
                </Text>
              ) : null}
            </View>
          ) : null}

          {isCopilot ? (
            <Text testID="navigation-copilot-active" style={tw`mt-s text-primary font-bold`}>
              Soy Copiloto activo
            </Text>
          ) : null}

          {errorMessage ? (
            <Text testID="navigation-route-error" style={tw`mt-s text-error`}>
              {errorMessage}
            </Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default NavigationSearchOverlay;
