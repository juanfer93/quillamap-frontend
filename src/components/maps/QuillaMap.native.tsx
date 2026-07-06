import React, { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Camera,
  CircleLayer,
  FillExtrusionLayer,
  LineLayer,
  MapView,
  MarkerView,
  ShapeSource,
  UserLocation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import tw from '@/lib/tailwind';
import type { QuillaMapProps } from './QuillaMap.types';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { MapIconProps } from './QuillaMap.icon.types';
import {
  canInteractWithPlaces,
  getRouteCoordinates,
  getVisiblePlaces,
  getVisibleShadeZones,
} from './QuillaMap.shared';
import PlaceInfoBottomSheet from '@/features/places/components/PlaceInfoBottomSheet';
import QuillaMapControls from './QuillaMapControls';
import QuillaMapShadowMarker from './QuillaMapShadowMarker';
import {
  getBuildingsFeatureCollection,
  getPlacesFeatureCollection,
  getRouteFeature,
  getShadeZonesFeatureCollection,
  MAPLIBRE_STYLE,
} from './QuillaMap.maplibre';

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;

const getPlaceTitle = (place: PlaceMapFeature): string => place.name.es;

const QuillaMap = ({
  mode,
  themeMode = 'light',
  center,
  shadeZones,
  places,
  showDefaultShadeZones,
  routePoints,
  showUserLocation = true,
  children,
  profileTools,
  onShadeZonePress,
  onPlacePress,
  onMapPress,
  selectedCoordinate,
  style,
}: QuillaMapProps) => {
  const route = getRouteCoordinates(routePoints, center);
  const cameraRef = useRef<CameraRef | null>(null);
  const layerColor = tw.color('map-shade') ?? '#5DA271';
  const routeColor = tw.color('map-route') ?? '#2F8AC4';
  const darkGray = tw.color('dark-gray') ?? '#333333';
  const primary = '#004574';
  const culturalGold = '#D4AF37';
  const shadowMarkerColor = tw.color('secondary') ?? culturalGold;
  const isPedestrian = mode === 'pedestrian';
  const isDark = themeMode === 'dark';
  const shouldShowShadowZones = !(isPedestrian && isDark);
  const zones = shouldShowShadowZones ? getVisibleShadeZones(shadeZones, showDefaultShadeZones) : [];
  const visiblePlaces = getVisiblePlaces(places);
  const canOpenPlaces = canInteractWithPlaces(mode);
  const [selectedPlace, setSelectedPlace] = useState<PlaceMapFeature | null>(null);
  const controlBackground = isDark ? tw.color('charcoal') ?? '#121212' : tw.color('white') ?? '#FFFFFF';
  const controlText = isDark ? culturalGold : darkGray;
  const controlBorder = isDark ? '#3A3328' : tw.color('medium-gray') ?? '#e0e0e0';
  const [zoomLevel, setZoomLevel] = useState(isPedestrian ? 16 : 15);
  const routeFeature = getRouteFeature(route);
  const shadeFeatureCollection = getShadeZonesFeatureCollection(zones);
  const placesFeatureCollection = getPlacesFeatureCollection(visiblePlaces);
  const buildingsFeatureCollection = getBuildingsFeatureCollection(visiblePlaces);

  const handlePlacePress = (place: PlaceMapFeature) => {
    if (!canOpenPlaces) {
      return;
    }

    setSelectedPlace(place);
    onPlacePress?.(place);
  };

  const applyZoom = (nextZoom: number) => {
    setZoomLevel(nextZoom);
    cameraRef.current?.zoomTo(nextZoom, 180);
  };
  const zoomIn = () => applyZoom(Math.min(zoomLevel + 1, 19));
  const zoomOut = () => applyZoom(Math.max(zoomLevel - 1, 11));

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
          testID="quillamap-native-map"
          style={tw`flex-1`}
          mapStyle={MAPLIBRE_STYLE}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
          scrollEnabled
          zoomEnabled
          rotateEnabled
          pitchEnabled
          onPress={(feature) => {
            const coordinates = feature.geometry.type === 'Point' ? feature.geometry.coordinates : null;
            if (coordinates && typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
              onMapPress?.({
                longitude: coordinates[0],
                latitude: coordinates[1],
              });
            }
          }}
        >
          <Camera
            ref={cameraRef}
            centerCoordinate={[center.longitude, center.latitude]}
            zoomLevel={zoomLevel}
            pitch={visiblePlaces.length > 0 ? 48 : 0}
          />
          {showUserLocation ? <UserLocation /> : null}

          <ShapeSource id="route-source" shape={routeFeature}>
            <LineLayer
              id="route-line"
              testID="quillamap-native-route"
              style={{
                lineColor: routeColor,
                lineWidth: isPedestrian ? 6 : 4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>

          <ShapeSource id="buildings-source" shape={buildingsFeatureCollection}>
            <FillExtrusionLayer
              id="places-buildings"
              testID="quillamap-native-building-extrusions"
              style={{
                fillExtrusionColor: ['get', 'color'],
                fillExtrusionHeight: ['get', 'height'],
                fillExtrusionBase: ['get', 'base'],
                fillExtrusionOpacity: 0.62,
              }}
            />
          </ShapeSource>

          <ShapeSource id="places-source" shape={placesFeatureCollection}>
            <CircleLayer
              id="places-static-dots"
              testID="quillamap-native-places-layer"
              style={{
                circleColor: ['case', ['==', ['get', 'source'], 'tourist_site'], culturalGold, primary],
                circleRadius: 7,
                circleStrokeColor: '#FFFFFF',
                circleStrokeWidth: 2,
              }}
            />
          </ShapeSource>

          <ShapeSource id="shade-zones-source" shape={shadeFeatureCollection}>
            <CircleLayer
              id="shade-zones"
              testID="quillamap-native-shade-layer"
              style={{
                circleColor: layerColor,
                circleOpacity: isPedestrian ? 0 : 0.22,
                circleRadius: isPedestrian ? 0 : 22,
                circleStrokeColor: primary,
                circleStrokeWidth: isPedestrian ? 0 : 2,
              }}
            />
          </ShapeSource>

          {visiblePlaces.map((place) => {
            const isTouristSite = place.source === 'tourist_site';
            const markerColor = isTouristSite ? culturalGold : primary;

            return (
              <MarkerView
                key={place.id}
                coordinate={[place.coordinate.longitude, place.coordinate.latitude]}
                allowOverlap
              >
                <Pressable
                  testID={`quillamap-native-place-marker-${place.id}`}
                  {...({ coordinate: place.coordinate } as Record<string, unknown>)}
                  accessibilityRole={canOpenPlaces ? 'button' : undefined}
                  accessibilityLabel={getPlaceTitle(place)}
                  disabled={!canOpenPlaces}
                  onPress={canOpenPlaces ? () => handlePlacePress(place) : undefined}
                  style={[
                    tw`w-10 h-10 rounded-xl bg-white border-2 items-center justify-center`,
                    { borderColor: markerColor },
                  ]}
                >
                  <MapIcon
                    name={isTouristSite ? 'business-outline' : 'location-outline'}
                    size={17}
                    color={markerColor}
                  />
                  <Text style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}>
                    {getPlaceTitle(place)}
                  </Text>
                </Pressable>
              </MarkerView>
            );
          })}

          {zones.map((zone) => (
            <MarkerView
              key={zone.id}
              coordinate={[zone.coordinate.longitude, zone.coordinate.latitude]}
              allowOverlap
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <Pressable
                testID={`quillamap-native-shade-marker-${zone.id}`}
                {...({ coordinate: zone.coordinate } as Record<string, unknown>)}
                accessibilityRole="button"
                accessibilityLabel={zone.title}
                onPress={() => onShadeZonePress?.(zone)}
              >
                {isPedestrian ? (
                  <QuillaMapShadowMarker color={shadowMarkerColor} />
                ) : (
                  <View style={tw`w-10 h-10 rounded-xl bg-white border-2 border-map-shade items-center justify-center`}>
                    <MapIcon name="leaf-outline" size={18} color={layerColor} />
                  </View>
                )}
              </Pressable>
            </MarkerView>
          ))}

          {selectedCoordinate && shouldShowShadowZones ? (
            <MarkerView
                testID="quillamap-native-shadow-draft-marker"
                coordinate={[selectedCoordinate.longitude, selectedCoordinate.latitude]}
                allowOverlap
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <QuillaMapShadowMarker color={shadowMarkerColor} size="draft" />
              </MarkerView>
          ) : null}
        </MapView>

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
          showZoom={isPedestrian}
          zoomInTestID="quillamap-native-zoom-in"
          zoomOutTestID="quillamap-native-zoom-out"
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          profileTools={profileTools}
        />
        {selectedPlace && canOpenPlaces ? (
          <PlaceInfoBottomSheet
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        ) : null}
        {children}
      </View>
    </View>
  );
};

export default QuillaMap;
