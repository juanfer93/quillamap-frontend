import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import {
  Camera,
  CircleLayer,
  FillExtrusionLayer,
  FillLayer,
  LineLayer,
  MapView,
  ShapeSource,
  SymbolLayer,
  UserLocation,
  type CameraRef,
} from '@maplibre/maplibre-react-native';
import tw from '@/lib/tailwind';
import type { QuillaMapProps } from '../types/QuillaMap.types';
import {
  PLACES_VISUAL_IDENTITY,
  type PlaceMapFeature,
} from '@/types/contracts/places.contract';
import {
  canInteractWithPlaces,
  getRouteCoordinates,
  getVisiblePlaces,
  getVisibleShadeZones,
} from '../styles/QuillaMap.shared';
import PlaceInfoBottomSheet from '@/features/places/components/PlaceInfoBottomSheet';
import QuillaMapControls from './QuillaMapControls';
import {
  DARK_MAP_THEME,
  getBuildingsFeatureCollection,
  getCoordinateFeatureCollection,
  getMapLibreStyle,
  getPlacesFeatureCollection,
  getRouteFeature,
  getShadeZoneAreasFeatureCollection,
  getShadeZonesFeatureCollection,
  SHADE_MARKER_EMOJI,
} from '../styles/QuillaMap.maplibre';

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
  const primary = tw.color(PLACES_VISUAL_IDENTITY.sharkBlue.token) ?? PLACES_VISUAL_IDENTITY.sharkBlue.hex;
  const culturalGold = tw.color(PLACES_VISUAL_IDENTITY.sandGold.token) ?? PLACES_VISUAL_IDENTITY.sandGold.hex;
  const white = tw.color(PLACES_VISUAL_IDENTITY.white.token) ?? PLACES_VISUAL_IDENTITY.white.hex;
  const shadowMarkerColor = tw.color('secondary') ?? culturalGold;
  const isPedestrian = mode === 'pedestrian';
  const isDark = themeMode === 'dark';
  const mapStyle = getMapLibreStyle(themeMode);
  const shouldShowShadowZones = !(isPedestrian && isDark);
  const zones = shouldShowShadowZones ? getVisibleShadeZones(shadeZones, showDefaultShadeZones) : [];
  const visiblePlaces = getVisiblePlaces(places);
  const canOpenPlaces = canInteractWithPlaces(mode);
  const [selectedPlace, setSelectedPlace] = useState<PlaceMapFeature | null>(null);
  const [is3D, setIs3D] = useState(() => visiblePlaces.length > 0);
  const controlBackground = isDark ? DARK_MAP_THEME.controlBackground : white;
  const controlText = isDark ? DARK_MAP_THEME.controlText : darkGray;
  const controlBorder = isDark ? DARK_MAP_THEME.controlBorder : tw.color('medium-gray') ?? '#e0e0e0';
  const [zoomLevel, setZoomLevel] = useState(isPedestrian ? 16 : 15);
  const routeFeature = getRouteFeature(route);
  const shadeFeatureCollection = getShadeZonesFeatureCollection(zones);
  const shadeAreaFeatureCollection = getShadeZoneAreasFeatureCollection(zones);
  const draftFeatureCollection = getCoordinateFeatureCollection(
    shouldShowShadowZones ? selectedCoordinate : null,
    'shadow-zone-draft'
  );
  const placesFeatureCollection = getPlacesFeatureCollection(visiblePlaces);
  const buildingsFeatureCollection = getBuildingsFeatureCollection(visiblePlaces);
  const shadeMarkerColor = isPedestrian ? shadowMarkerColor : layerColor;

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
  const togglePerspective = () => {
    const nextIs3D = !is3D;
    setIs3D(nextIs3D);
    cameraRef.current?.setCamera({
      pitch: nextIs3D ? 48 : 0,
      animationDuration: 220,
      animationMode: 'easeTo',
    });
  };

  return (
    <View testID="quillamap-container" style={[tw`flex-1`, style]}>
      <View
        testID="quillamap-native"
        style={
          isPedestrian
            ? [
                tw`flex-1 overflow-hidden`,
                { backgroundColor: isDark ? DARK_MAP_THEME.background : tw.color('surface-light') ?? '#F8FAFC' },
              ]
            : tw`flex-1 rounded-m overflow-hidden`
        }
      >
        <MapView
          key={isDark ? 'quillamap-native-dark' : 'quillamap-native-light'}
          testID="quillamap-native-map"
          style={tw`flex-1`}
          mapStyle={mapStyle}
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
            pitch={is3D ? 48 : 0}
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

          <ShapeSource
            id="places-source"
            testID="quillamap-native-places-source"
            shape={placesFeatureCollection}
            hitbox={{ width: 48, height: 48 }}
            onPress={(event) => {
              if (!canOpenPlaces) {
                return;
              }

              const id = event.features[0]?.properties?.id;
              const place = typeof id === 'string'
                ? visiblePlaces.find((candidate) => candidate.id === id)
                : undefined;

              if (place) {
                handlePlacePress(place);
              }
            }}
          >
            <CircleLayer
              id="places-hitbox"
              style={{
                circleColor: white,
                circleOpacity: 0.01,
                circleRadius: 22,
              }}
            />
            <CircleLayer
              id="places-marker-background"
              style={{
                circleColor: white,
                circleRadius: 15,
                circleStrokeColor: ['case', ['==', ['get', 'source'], 'tourist_site'], culturalGold, primary],
                circleStrokeWidth: 2,
              }}
            />
            <CircleLayer
              id="places-static-dots"
              testID="quillamap-native-places-layer"
              style={{
                circleColor: ['case', ['==', ['get', 'source'], 'tourist_site'], culturalGold, primary],
                circleRadius: 2.5,
              }}
            />
          </ShapeSource>

          <ShapeSource id="shade-area-source" shape={shadeAreaFeatureCollection}>
            {!isPedestrian ? (
              <>
                <FillLayer
                  id="shade-zone-areas"
                  testID="quillamap-native-shade-areas"
                  style={{
                    fillColor: layerColor,
                    fillOpacity: 0.22,
                  }}
                />
                <LineLayer
                  id="shade-zone-area-outline"
                  style={{
                    lineColor: primary,
                    lineWidth: 2,
                    lineOpacity: 0.9,
                  }}
                />
              </>
            ) : null}
          </ShapeSource>

          <ShapeSource
            id="shade-zones-source"
            testID="quillamap-native-shade-source"
            shape={shadeFeatureCollection}
            hitbox={{ width: 44, height: 44 }}
            onPress={(event) => {
              const id = event.features[0]?.properties?.id;
              const zone = typeof id === 'string' ? zones.find((candidate) => candidate.id === id) : undefined;
              if (zone) {
                onShadeZonePress?.(zone);
              }
            }}
          >
            <CircleLayer
              id="shade-zones-outline"
              style={{
                circleColor: white,
                circleRadius: 17,
                circleStrokeColor: shadeMarkerColor,
                circleStrokeWidth: 2,
              }}
            />
            <SymbolLayer
              id="shade-zones"
              testID="quillamap-native-shade-layer"
              style={{
                textField: SHADE_MARKER_EMOJI,
                textFont: ['sans-serif'],
                textSize: 21,
                textColor: shadeMarkerColor,
                textAllowOverlap: true,
                textIgnorePlacement: true,
                textPitchAlignment: 'viewport',
                textRotationAlignment: 'viewport',
              }}
            />
          </ShapeSource>

          {selectedCoordinate && shouldShowShadowZones ? (
            <ShapeSource id="shade-draft-source" shape={draftFeatureCollection}>
              <CircleLayer
                id="shade-draft-outline"
                style={{
                  circleColor: white,
                  circleRadius: 17,
                  circleStrokeColor: shadowMarkerColor,
                  circleStrokeWidth: 2,
                }}
              />
              <SymbolLayer
                id="shade-draft"
                testID="quillamap-native-shadow-draft-marker"
                style={{
                  textField: SHADE_MARKER_EMOJI,
                  textFont: ['sans-serif'],
                  textSize: 21,
                  textColor: shadowMarkerColor,
                  textAllowOverlap: true,
                  textIgnorePlacement: true,
                  textPitchAlignment: 'viewport',
                  textRotationAlignment: 'viewport',
                }}
              />
            </ShapeSource>
          ) : null}
        </MapView>

        <QuillaMapControls
          mode={mode}
          isDark={isDark}
          is3D={is3D}
          controlBackground={controlBackground}
          controlBorder={controlBorder}
          controlText={controlText}
          darkText={darkGray}
          mapRoute={routeColor}
          mapShade={layerColor}
          primary={primary}
          zonesCount={zones.length}
          showZoom={isPedestrian}
          perspectiveToggleTestID="quillamap-native-perspective-toggle"
          zoomInTestID="quillamap-native-zoom-in"
          zoomOutTestID="quillamap-native-zoom-out"
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onTogglePerspective={togglePerspective}
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
