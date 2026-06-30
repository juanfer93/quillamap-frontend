import React from 'react';
import { Text, View } from 'react-native';
import tw from '@/lib/tailwind';
import QuillaMap from '@/components/maps/QuillaMap';
import { QuillaMapShadeZone } from '@/components/maps/QuillaMap.types';
import {
  DEFAULT_PEDESTRIAN_CENTER,
  PEDESTRIAN_PROXIMITY_RADIUS_METERS,
  PedestrianCoordinates,
  ShadowZone,
} from '../schemas/pedestrian.schema';
import { useLocationPermissions } from '../hooks/useLocationPermissions';
import type { PedestrianMapContainerProps } from '../types/pedestrian.types';

const getShadowZoneTitle = (zone: ShadowZone): string => zone.title ?? 'Zona de sombra';

const getShadowZoneRadius = (zone: ShadowZone): number =>
  zone.coverageRadiusMeters ?? PEDESTRIAN_PROXIMITY_RADIUS_METERS.default;

const getCenterCoordinate = (
  currentLocation: PedestrianCoordinates | null,
  initialCenter?: PedestrianCoordinates
): PedestrianCoordinates => currentLocation ?? initialCenter ?? DEFAULT_PEDESTRIAN_CENTER;

const toMapShadeZone = (zone: ShadowZone): QuillaMapShadeZone => ({
  id: zone.id,
  title: getShadowZoneTitle(zone),
  description: zone.description,
  coordinate: zone.location,
  radiusMeters: getShadowZoneRadius(zone),
});

const PedestrianMapContainer = ({
  shadowZones,
  themeMode = 'light',
  initialCenter,
  showHeader = true,
  onShadowZonePress,
}: PedestrianMapContainerProps) => {
  const { currentLocation, isRequestingPermission, errorMessage } = useLocationPermissions();
  const center = getCenterCoordinate(currentLocation, initialCenter);
  const mapShadeZones = shadowZones.map(toMapShadeZone);
  const isDark = themeMode === 'dark';

  return (
    <View
      testID="pedestrian-map-container"
      style={[
        tw`flex-1 bg-surface-light dark:bg-charcoal`,
        showHeader ? tw`p-m` : tw`p-0`,
      ]}
    >
      {showHeader ? (
        <View style={tw`mb-m`}>
          <Text style={tw`text-primary dark:text-secondary text-2xl font-bold`}>
            Modo Peaton
          </Text>
          <Text style={tw`text-dark-gray dark:text-light-gray mt-xs`}>
            Rastreo de proximidad entre {PEDESTRIAN_PROXIMITY_RADIUS_METERS.min}m y{' '}
            {PEDESTRIAN_PROXIMITY_RADIUS_METERS.max}m
          </Text>
          {isRequestingPermission ? (
            <Text style={tw`text-primary dark:text-secondary mt-xs`}>
              Solicitando permiso de ubicacion
            </Text>
          ) : null}
          {errorMessage ? (
            <Text style={tw`text-error mt-xs`}>
              {errorMessage}
            </Text>
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          tw`flex-1`,
          isDark ? tw`bg-charcoal` : tw`bg-surface-light`,
        ]}
      >
        <QuillaMap
          mode="pedestrian"
          center={center}
          shadeZones={mapShadeZones}
          onShadeZonePress={(zone) => {
            const selectedZone = shadowZones.find((shadowZone) => shadowZone.id === zone.id);
            if (selectedZone) {
              onShadowZonePress?.(selectedZone);
            }
          }}
        />
      </View>
    </View>
  );
};

export default PedestrianMapContainer;
