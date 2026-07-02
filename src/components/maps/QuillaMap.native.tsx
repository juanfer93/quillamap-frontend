import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Circle, Marker, Polyline, Region } from 'react-native-maps';
import tw from '@/lib/tailwind';
import type { QuillaMapProps } from './QuillaMap.types';
import type { MapIconProps } from './QuillaMap.icon.types';
import { MAX_NATIVE_DELTA, MIN_NATIVE_DELTA } from './QuillaMap.constants';
import { getRouteCoordinates, getVisibleShadeZones } from './QuillaMap.shared';
import { darkMapStyle } from './QuillaMap.native-style';
import QuillaMapControls from './QuillaMapControls';
import QuillaMapShadowMarker from './QuillaMapShadowMarker';

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;

const QuillaMap = ({
  mode,
  themeMode = 'light',
  center,
  shadeZones,
  showDefaultShadeZones,
  routePoints,
  showUserLocation = true,
  children,
  onShadeZonePress,
  onMapPress,
  selectedCoordinate,
  style,
}: QuillaMapProps) => {
  const route = getRouteCoordinates(routePoints, center);
  const layerColor = tw.color('map-shade') ?? '';
  const routeColor = tw.color('map-route') ?? '';
  const strokeColor = tw.color('primary') ?? '';
  const darkGray = tw.color('dark-gray') ?? '#333333';
  const primary = tw.color('primary') ?? '#004574';
  const sandGold = tw.color('sand-gold') ?? tw.color('gold') ?? '';
  const shadowMarkerColor = tw.color('secondary') ?? tw.color('brand-secondary') ?? sandGold;
  const isPedestrian = mode === 'pedestrian';
  const isDark = themeMode === 'dark';
  const shouldShowShadowZones = !(isPedestrian && isDark);
  const zones = shouldShowShadowZones ? getVisibleShadeZones(shadeZones, showDefaultShadeZones) : [];
  const initialRegion: Region = {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta: isPedestrian ? 0.012 : 0.018,
    longitudeDelta: isPedestrian ? 0.012 : 0.018,
  };
  const mapRef = useRef<MapView | null>(null);
  const currentRegionRef = useRef<Region>(initialRegion);
  const [mapDelta, setMapDelta] = useState({
    latitudeDelta: initialRegion.latitudeDelta,
    longitudeDelta: initialRegion.longitudeDelta,
  });
  const controlBackground = isDark ? tw.color('charcoal') ?? '#121212' : tw.color('white') ?? '#FFFFFF';
  const controlText = isDark ? sandGold : darkGray;
  const controlBorder = isDark ? '#3A3328' : tw.color('medium-gray') ?? '#e0e0e0';
  const applyZoom = (factor: number) => {
    const currentRegion = currentRegionRef.current;
    const nextRegion: Region = {
      ...currentRegion,
      latitudeDelta: Math.min(Math.max(mapDelta.latitudeDelta * factor, MIN_NATIVE_DELTA), MAX_NATIVE_DELTA),
      longitudeDelta: Math.min(Math.max(mapDelta.longitudeDelta * factor, MIN_NATIVE_DELTA), MAX_NATIVE_DELTA),
    };

    currentRegionRef.current = nextRegion;
    setMapDelta({
      latitudeDelta: nextRegion.latitudeDelta,
      longitudeDelta: nextRegion.longitudeDelta,
    });
    mapRef.current?.animateToRegion(nextRegion, 180);
  };
  const zoomIn = () => applyZoom(0.62);
  const zoomOut = () => applyZoom(1.45);

  return (
    <View testID="quillamap-container" style={[tw`flex-1`, style]}>
      <View
        testID="quillamap-native"
        style={
          isPedestrian
            ? [
                tw`flex-1 overflow-hidden`,
                { backgroundColor: isDark ? '#1D2D3B' : tw.color('surface-light') ?? '#F8FAFC' },
              ]
            : tw`flex-1 rounded-m overflow-hidden`
        }
      >
        <MapView
          ref={mapRef}
          testID="quillamap-native-map"
          style={tw`flex-1`}
          initialRegion={initialRegion}
          onRegionChangeComplete={(region) => {
            currentRegionRef.current = region;
            setMapDelta({
              latitudeDelta: region.latitudeDelta,
              longitudeDelta: region.longitudeDelta,
            });
          }}
          showsUserLocation={showUserLocation}
          showsMyLocationButton={!isPedestrian && showUserLocation}
          customMapStyle={isDark ? darkMapStyle : []}
          userInterfaceStyle={isDark ? 'dark' : 'light'}
          scrollEnabled
          zoomEnabled
          rotateEnabled
          pitchEnabled
          onPress={(event) => onMapPress?.(event.nativeEvent.coordinate)}
        >
          <Polyline
            testID="quillamap-native-route"
            coordinates={route}
            strokeColor={routeColor}
            strokeWidth={isPedestrian ? 6 : 4}
          />
          {zones.map((zone) => (
            <React.Fragment key={zone.id}>
              {!isPedestrian ? (
                <Circle
                  testID={`quillamap-native-shade-radius-${zone.id}`}
                  center={zone.coordinate}
                  radius={zone.radiusMeters}
                  fillColor={layerColor}
                  strokeColor={strokeColor}
                  strokeWidth={2}
                />
              ) : null}
              <Marker
                testID={`quillamap-native-shade-marker-${zone.id}`}
                coordinate={zone.coordinate}
                title={zone.title}
                description={zone.description}
                pinColor={layerColor}
                onPress={() => onShadeZonePress?.(zone)}
              >
                {isPedestrian ? (
                  <QuillaMapShadowMarker color={shadowMarkerColor} />
                ) : null}
              </Marker>
            </React.Fragment>
          ))}
          {selectedCoordinate && shouldShowShadowZones ? (
            <Marker
              testID="quillamap-native-shadow-draft-marker"
              coordinate={selectedCoordinate}
              title="Zona de sombra"
              pinColor={shadowMarkerColor}
            >
              <QuillaMapShadowMarker color={shadowMarkerColor} size="draft" />
            </Marker>
          ) : null}
          {isPedestrian
            ? route.slice(1, 5).map((point) => (
                <Marker key={`route-marker-${point.latitude}-${point.longitude}`} coordinate={point}>
                  <View
                    style={[
                      tw`w-8 h-8 rounded-xl border items-center justify-center`,
                      { backgroundColor: controlBackground, borderColor: controlBorder },
                    ]}
                  >
                    <MapIcon name="walk-outline" size={16} color={controlText} />
                  </View>
                </Marker>
              ))
            : null}
        </MapView>
        {isPedestrian ? (
          <QuillaMapControls
            mode={mode}
            isDark={isDark}
            controlBackground={controlBackground}
            controlBorder={controlBorder}
            controlText={controlText}
            darkText={darkGray}
            mapRoute={routeColor}
            mapShade={layerColor}
            primary={primary}
            zonesCount={zones.length}
            showZoom
            zoomInTestID="quillamap-native-zoom-in"
            zoomOutTestID="quillamap-native-zoom-out"
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
          />
        ) : null}
        {children}
      </View>
    </View>
  );
};

export default QuillaMap;
