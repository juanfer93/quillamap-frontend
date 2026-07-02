import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Circle, MapStyleElement, Marker, Polygon, Polyline, Region } from 'react-native-maps';
import tw from '@/lib/tailwind';
import type { QuillaMapCoordinate, QuillaMapProps } from './QuillaMap.types';
import { getRouteCoordinates, getVisibleShadeZones } from './QuillaMap.shared';
import QuillaMapControls from './QuillaMapControls';

interface MapIconProps {
  name: string;
  size: number;
  color: string;
}

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;
const MIN_NATIVE_DELTA = 0.002;
const MAX_NATIVE_DELTA = 0.08;

const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#1D2D3B' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#B3C0CD' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#162638' }, { weight: 3 }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#405166' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#1D2D3B' }] },
  { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#263849' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#28455A' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#96AABC' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1F6B57' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#344A5F' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#5F7488' }, { weight: 1.05 }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#C1CCD7' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#2C4053' }] },
  { featureType: 'road.local', elementType: 'geometry.stroke', stylers: [{ color: '#4D6378' }, { weight: 0.9 }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#456078' }] },
  { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#7B8FA2' }, { weight: 1.1 }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#687687' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#9AA7B4' }, { weight: 1.2 }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#33495E' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0D3952' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#8BC7E8' }] },
];

const getShadePolygon = (
  coordinate: QuillaMapCoordinate,
  radiusMeters: number
): QuillaMapCoordinate[] => {
  const radius = Math.min(Math.max(radiusMeters, 150), 280);
  const latitudeMeters = 111320;
  const longitudeMeters = 111320 * Math.cos((coordinate.latitude * Math.PI) / 180);
  const points = [
    [-0.82, -0.34],
    [-0.58, -0.92],
    [-0.06, -1.05],
    [0.48, -0.72],
    [0.92, -0.20],
    [0.72, 0.50],
    [0.18, 0.92],
    [-0.46, 0.76],
    [-0.94, 0.22],
  ];

  return points.map(([x, y]) => ({
    latitude: coordinate.latitude + (y * radius) / latitudeMeters,
    longitude: coordinate.longitude + (x * radius) / longitudeMeters,
  }));
};

const QuillaMap = ({
  mode,
  themeMode = 'light',
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
  const layerFillColor = `${tw.color('map-shade-light') ?? '#CFE8D6'}99`;
  const routeColor = tw.color('map-route') ?? '';
  const strokeColor = tw.color('primary') ?? '';
  const darkGray = tw.color('dark-gray') ?? '#333333';
  const primary = tw.color('primary') ?? '#004574';
  const sandGold = tw.color('sand-gold') ?? tw.color('gold') ?? '#D4AF37';
  const isPedestrian = mode === 'pedestrian';
  const isDark = themeMode === 'dark';
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
  const shadeFillColor = isDark ? `${layerColor}66` : layerFillColor;
  const shadeStrokeColor = isDark ? sandGold : layerColor;
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
        >
          <Polyline
            testID="quillamap-native-route"
            coordinates={route}
            strokeColor={routeColor}
            strokeWidth={isPedestrian ? 6 : 4}
          />
          {zones.map((zone) => (
            <React.Fragment key={zone.id}>
              {isPedestrian ? (
                <Polygon
                  testID={`quillamap-native-shade-area-${zone.id}`}
                  coordinates={getShadePolygon(zone.coordinate, zone.radiusMeters)}
                  fillColor={shadeFillColor}
                  strokeColor={shadeStrokeColor}
                  strokeWidth={2}
                />
              ) : (
                <Circle
                  testID={`quillamap-native-shade-radius-${zone.id}`}
                  center={zone.coordinate}
                  radius={zone.radiusMeters}
                  fillColor={layerColor}
                  strokeColor={strokeColor}
                  strokeWidth={2}
                />
              )}
              <Marker
                testID={`quillamap-native-shade-marker-${zone.id}`}
                coordinate={zone.coordinate}
                title={zone.title}
                description={zone.description}
                pinColor={layerColor}
                onPress={() => onShadeZonePress?.(zone)}
              >
                {isPedestrian ? (
                  <View
                    style={[
                      tw`w-9 h-9 rounded-xl border items-center justify-center`,
                      { backgroundColor: controlBackground, borderColor: controlBorder },
                    ]}
                  >
                    <MapIcon name="walk-outline" size={18} color={controlText} />
                  </View>
                ) : null}
              </Marker>
            </React.Fragment>
          ))}
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
