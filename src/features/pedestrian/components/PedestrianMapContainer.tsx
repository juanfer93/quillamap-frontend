import React from 'react';
import { Text, View } from 'react-native';
import tw from '@/lib/tailwind';
import QuillaMap from '@/components/maps/QuillaMap';
import { QuillaMapShadeZone } from '@/components/maps/QuillaMap.types';
import { PROXIMITY_RADAR_RADIUS_METERS, useProximityRadar } from '@/features/navigation/hooks/useProximityRadar';
import {
  DEFAULT_PEDESTRIAN_CENTER,
  PedestrianCoordinates,
  ShadowZone,
} from '../schemas/pedestrian.schema';
import { useLocationPermissions } from '../hooks/useLocationPermissions';
import type { PedestrianMapContainerProps } from '../types/pedestrian.types';

const getShadowZoneTitle = (zone: ShadowZone): string => zone.title ?? 'Zona de sombra';

const getShadowZoneRadius = (zone: ShadowZone): number =>
  zone.coverageRadiusMeters ?? PROXIMITY_RADAR_RADIUS_METERS.default;

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
  onMapPress,
  selectedShadowCoordinate,
  profileTools,
}: PedestrianMapContainerProps) => {
  const { currentLocation, isRequestingPermission, errorMessage } = useLocationPermissions();
  const center = getCenterCoordinate(currentLocation, initialCenter);
  const isDark = themeMode === 'dark';
  const shouldShowShadowZones = !isDark;
  const mapShadeZones = shouldShowShadowZones ? shadowZones.map(toMapShadeZone) : [];
  const proximityTargets = mapShadeZones.map((zone) => ({
    id: zone.id,
    coordinate: zone.coordinate,
    radiusMeters: zone.radiusMeters,
  }));
  const proximityRadar = useProximityRadar(currentLocation, proximityTargets);

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
            Rastreo de proximidad entre {PROXIMITY_RADAR_RADIUS_METERS.min}m y{' '}
            {PROXIMITY_RADAR_RADIUS_METERS.max}m
          </Text>
          {proximityRadar.shouldAlert ? (
            <Text testID="proximity-radar-alert" style={tw`text-primary dark:text-secondary mt-xs font-bold`}>
              Zona relevante a {Math.round(proximityRadar.nearestTarget?.distanceMeters ?? 0)}m
            </Text>
          ) : null}
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
          themeMode={themeMode}
          center={center}
          shadeZones={mapShadeZones}
          showDefaultShadeZones={false}
          selectedCoordinate={shouldShowShadowZones ? selectedShadowCoordinate : null}
          profileTools={profileTools}
          onMapPress={shouldShowShadowZones ? onMapPress : undefined}
          onShadeZonePress={(zone) => {
            if (!shouldShowShadowZones) {
              return;
            }

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
