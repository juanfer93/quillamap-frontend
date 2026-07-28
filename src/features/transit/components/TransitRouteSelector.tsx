import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import tw from '@/lib/tailwind';
import type { TransitAgencyKind, TransitMapRouteFeature } from '@/types/contracts/transit.contract';
import type { PublicTransportMode } from '../types/publicTransport.types';
import {
  getRouteLabel,
  getRouteRecorrido,
  hasDrawableRouteGeometry,
  transitAgencyOptions,
  type TransitOperatorGroup,
} from '@/features/navigation/utils/navigationMapController.utils';

interface TransitRouteSelectorProps {
  transitAgencyKind: TransitAgencyKind;
  transitOperatorGroups: TransitOperatorGroup[];
  selectedTransitOperator: TransitOperatorGroup | null;
  selectedTransitRoute: TransitMapRouteFeature | null;
  onModeChange: (mode: PublicTransportMode) => void;
  onOperatorSelect: (operatorKey: string) => void;
  onRouteSelect: (routeId: string) => void;
}

const TransitRouteSelector = ({
  transitAgencyKind,
  transitOperatorGroups,
  selectedTransitOperator,
  selectedTransitRoute,
  onModeChange,
  onOperatorSelect,
  onRouteSelect,
}: TransitRouteSelectorProps) => (
  <View>
    <View testID="transit-agency-selector" style={tw`mb-s flex-row`}>
      {transitAgencyOptions.map((option) => {
        const isSelected = option.value === transitAgencyKind;

        return (
          <Pressable
            key={option.value}
            testID={`transit-agency-${option.value}`}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onModeChange(option.value === 'transmetro' ? 'transmetro' : 'buses')}
            style={[
              tw`mr-s min-h-9 flex-1 items-center justify-center rounded-s border px-s`,
              {
                backgroundColor: isSelected ? '#004574' : '#FFFFFF',
                borderColor: '#004574',
              },
            ]}
          >
            <Text numberOfLines={1} style={[tw`font-bold`, { color: isSelected ? '#FFFFFF' : '#004574' }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>

    <Text testID="public-transport-visible-routes-note" style={tw`mb-s text-xs text-dark-gray`}>
      Mostrando todas las rutas de {transitAgencyKind === 'transmetro' ? 'Transmetro' : 'buses'} en el mapa.
    </Text>

    {selectedTransitOperator ? (
      <View testID="transit-routes-panel">
        <Text style={tw`mb-xs text-xs font-bold text-dark-gray`}>Empresas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="transit-operator-list" style={tw`mb-s`}>
          {transitOperatorGroups.map((group) => {
            const isSelected = group.key === selectedTransitOperator.key;

            return (
              <Pressable
                key={group.key}
                testID={`transit-operator-${group.key}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onOperatorSelect(group.key)}
                style={[
                  tw`mr-s rounded-s border px-s py-xs`,
                  {
                    backgroundColor: isSelected ? '#004574' : '#FFFFFF',
                    borderColor: '#004574',
                  },
                ]}
              >
                <Text numberOfLines={1} style={[tw`font-bold`, { color: isSelected ? '#FFFFFF' : '#004574' }]}>
                  {group.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={tw`mb-xs text-xs font-bold text-dark-gray`}>Rutas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} testID="transit-route-list" style={tw`mb-s`}>
          {selectedTransitOperator.routes.map((route) => {
            const isSelected = route.properties.routeId === selectedTransitRoute?.properties.routeId;

            return (
              <Pressable
                key={route.properties.routeId}
                testID={`transit-route-${route.properties.routeId}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onRouteSelect(route.properties.routeId)}
                style={[
                  tw`mr-s rounded-s border px-s py-xs`,
                  {
                    backgroundColor: isSelected ? '#D4AF37' : '#FFFFFF',
                    borderColor: isSelected ? '#D4AF37' : '#004574',
                  },
                ]}
              >
                <Text numberOfLines={1} style={[tw`font-bold`, { color: '#004574' }]}>
                  {getRouteLabel(route)}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View testID="transit-route-recorrido" style={tw`rounded-s bg-surface-light px-s py-s`}>
          <Text style={tw`text-primary font-bold`}>Recorrido</Text>
          <Text style={tw`mt-xs text-dark-gray`}>{getRouteRecorrido(selectedTransitRoute)}</Text>
          {selectedTransitRoute && !hasDrawableRouteGeometry(selectedTransitRoute) ? (
            <Text testID="transit-route-geometry-warning" style={tw`mt-xs text-xs text-dark-gray`}>
              Geometria pendiente de validacion.
            </Text>
          ) : null}
        </View>
      </View>
    ) : (
      <Text testID="transit-routes-loading" style={tw`text-dark-gray`}>Cargando rutas...</Text>
    )}
  </View>
);

export default TransitRouteSelector;
