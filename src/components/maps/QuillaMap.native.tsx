import React from 'react';
import { View } from 'react-native';
import MapView, { Circle, Marker, Polyline } from 'react-native-maps';
import tw from '@/lib/tailwind';
import type { QuillaMapProps } from './QuillaMap.types';
import { getRouteCoordinates, getVisibleShadeZones } from './QuillaMap.shared';

const QuillaMap = ({
  center,
  shadeZones,
  routePoints,
  showUserLocation = true,
  children,
  onShadeZonePress,
  style,
}: QuillaMapProps) => {
  const zones = getVisibleShadeZones(shadeZones);
  const route = getRouteCoordinates(routePoints, center);
  const layerColor = tw.color('map-shade') ?? '';
  const routeColor = tw.color('map-route') ?? '';
  const strokeColor = tw.color('primary') ?? '';

  return (
    <View testID="quillamap-container" style={[tw`flex-1`, style]}>
      <View testID="quillamap-native" style={tw`flex-1 rounded-m overflow-hidden`}>
        <MapView
          testID="quillamap-native-map"
          style={tw`flex-1`}
          initialRegion={{
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: 0.018,
            longitudeDelta: 0.018,
          }}
          showsUserLocation={showUserLocation}
          showsMyLocationButton={showUserLocation}
        >
          <Polyline
            testID="quillamap-native-route"
            coordinates={route}
            strokeColor={routeColor}
            strokeWidth={4}
          />
          {zones.map((zone) => (
            <React.Fragment key={zone.id}>
              <Circle
                testID={`quillamap-native-shade-radius-${zone.id}`}
                center={zone.coordinate}
                radius={zone.radiusMeters}
                fillColor={layerColor}
                strokeColor={strokeColor}
                strokeWidth={2}
              />
              <Marker
                testID={`quillamap-native-shade-marker-${zone.id}`}
                coordinate={zone.coordinate}
                title={zone.title}
                description={zone.description}
                pinColor={layerColor}
                onPress={() => onShadeZonePress?.(zone)}
              />
            </React.Fragment>
          ))}
        </MapView>
        {children}
      </View>
    </View>
  );
};

export default QuillaMap;
