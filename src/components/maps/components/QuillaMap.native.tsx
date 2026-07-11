import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  type MapViewRef,
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
  MAP_3D_PITCH,
  getBuildingsFeatureCollection,
  getCoordinateFeatureCollection,
  getDestinationFeatureCollection,
  getMapLibreStyle,
  getPlacesFeatureCollection,
  getRouteFeatureCollection,
  getShadeZoneAreasFeatureCollection,
  getShadeZonesFeatureCollection,
  getUserLocationFeatureCollection,
  SHADE_MARKER_EMOJI,
  DESTINATION_MARKER_EMOJI,
  NAVIGATION_DESTINATION_LAYER_ID,
  NAVIGATION_DESTINATION_SOURCE_ID,
  NAVIGATION_ROUTE_HALO_LAYER_ID,
  NAVIGATION_ROUTE_LAYER_ID,
  NAVIGATION_ROUTE_LINE_STYLE,
  NAVIGATION_ROUTE_SOURCE_ID,
  USER_LOCATION_LAYER_ID,
  USER_LOCATION_SOURCE_ID,
} from '../styles/QuillaMap.maplibre';

const INITIAL_PEDESTRIAN_ZOOM = 16;
const INITIAL_DEFAULT_ZOOM = 15;
const CAMERA_ANIMATION_DURATION_MS = 520;
const CARDINAL_BEARINGS = [0, 90, 180, 270] as const;
type CardinalBearing = typeof CARDINAL_BEARINGS[number];

const normalizeBearing = (bearing: number): number => ((bearing % 360) + 360) % 360;

const getCompassBearing = (cameraBearing: number): number => normalizeBearing(-cameraBearing);

const getNextCardinalBearing = (cameraBearing: number): CardinalBearing => {
  const normalizedBearing = normalizeBearing(cameraBearing);
  const currentIndex = CARDINAL_BEARINGS.findIndex((bearing) => Math.abs(bearing - normalizedBearing) < 0.5);

  return currentIndex >= 0 ? CARDINAL_BEARINGS[(currentIndex + 1) % CARDINAL_BEARINGS.length] : 0;
};

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
  destinationCoordinate,
  navigationControl,
  style,
}: QuillaMapProps) => {
  const route = getRouteCoordinates(routePoints, center);
  const cameraCenterCoordinate = useMemo(
    () => [center.longitude, center.latitude] as [number, number],
    [center.latitude, center.longitude]
  );
  const mapRef = useRef<MapViewRef | null>(null);
  const cameraRef = useRef<CameraRef | null>(null);
  const layerColor = tw.color('map-shade') ?? '#5DA271';
  const routeColor = NAVIGATION_ROUTE_LINE_STYLE.lineColor;
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
  const [is3D, setIs3D] = useState(false);
  const [cameraBearing, setCameraBearing] = useState<number>(0);
  const controlBackground = isDark ? DARK_MAP_THEME.controlBackground : white;
  const controlText = isDark ? DARK_MAP_THEME.controlText : darkGray;
  const controlBorder = isDark ? DARK_MAP_THEME.controlBorder : tw.color('medium-gray') ?? '#e0e0e0';
  const lightPlaceMarkerColor = ['case', ['==', ['get', 'source'], 'tourist_site'], culturalGold, primary] as const;
  const placeMarkerColor = isDark ? culturalGold : lightPlaceMarkerColor;
  const zoomLevelRef = useRef(isPedestrian ? INITIAL_PEDESTRIAN_ZOOM : INITIAL_DEFAULT_ZOOM);
  const routeFeature = getRouteFeatureCollection(route);
  const userLocationFeatureCollection = getUserLocationFeatureCollection(showUserLocation ? center : null);
  const destinationFeatureCollection = getDestinationFeatureCollection(destinationCoordinate);
  const shadeFeatureCollection = getShadeZonesFeatureCollection(zones);
  const shadeAreaFeatureCollection = getShadeZoneAreasFeatureCollection(zones);
  const draftFeatureCollection = getCoordinateFeatureCollection(
    shouldShowShadowZones ? selectedCoordinate : null,
    'shadow-zone-draft'
  );
  const placesFeatureCollection = getPlacesFeatureCollection(visiblePlaces);
  const buildingsFeatureCollection = getBuildingsFeatureCollection(visiblePlaces);
  const shadeMarkerColor = isPedestrian ? shadowMarkerColor : layerColor;
  const compassBearing = getCompassBearing(cameraBearing);

  const handlePlacePress = (place: PlaceMapFeature) => {
    if (!canOpenPlaces) {
      return;
    }

    setSelectedPlace(place);
    onPlacePress?.(place);
  };
  const closeSelectedPlace = () => {
    setSelectedPlace(null);
  };

  const applyZoom = async (delta: number) => {
    const currentZoom = await mapRef.current?.getZoom().catch(() => zoomLevelRef.current) ?? zoomLevelRef.current;
    const nextZoom = Math.max(11, Math.min(currentZoom + delta, 19));
    zoomLevelRef.current = nextZoom;
    cameraRef.current?.zoomTo(nextZoom, CAMERA_ANIMATION_DURATION_MS);
  };
  const zoomIn = () => applyZoom(1);
  const zoomOut = () => applyZoom(-1);
  const togglePerspective = () => {
    const nextIs3D = !is3D;
    setIs3D(nextIs3D);
    cameraRef.current?.setCamera({
      pitch: nextIs3D ? MAP_3D_PITCH : 0,
      heading: cameraBearing,
      animationDuration: CAMERA_ANIMATION_DURATION_MS,
      animationMode: 'easeTo',
    });
  };
  const toggleCompass = () => {
    const nextCameraBearing = getNextCardinalBearing(cameraBearing);
    setCameraBearing(nextCameraBearing);
    cameraRef.current?.setCamera({
      heading: nextCameraBearing,
      animationDuration: CAMERA_ANIMATION_DURATION_MS,
      animationMode: 'easeTo',
    });
  };

  const handleRegionDidChange = (feature: GeoJSON.Feature<GeoJSON.Point, { heading?: number }>) => {
    const nextHeading = feature.properties?.heading;

    if (typeof nextHeading === 'number') {
      setCameraBearing(normalizeBearing(nextHeading));
    }
  };

  useEffect(() => {
    if (route.length < 2) {
      return;
    }

    const longitudes = route.map((point) => point.longitude);
    const latitudes = route.map((point) => point.latitude);
    const northEast: [number, number] = [Math.max(...longitudes), Math.max(...latitudes)];
    const southWest: [number, number] = [Math.min(...longitudes), Math.min(...latitudes)];

    cameraRef.current?.fitBounds?.(northEast, southWest, [150, 64, 120, 64], CAMERA_ANIMATION_DURATION_MS);
  }, [route]);

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
          ref={mapRef}
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
          onRegionDidChange={handleRegionDidChange}
          onPress={(feature) => {
            const coordinates = feature.geometry.type === 'Point' ? feature.geometry.coordinates : null;
            if (coordinates && typeof coordinates[0] === 'number' && typeof coordinates[1] === 'number') {
              closeSelectedPlace();
              onMapPress?.({
                longitude: coordinates[0],
                latitude: coordinates[1],
              });
            }
          }}
        >
          <Camera
            ref={cameraRef}
            centerCoordinate={cameraCenterCoordinate}
            zoomLevel={zoomLevelRef.current}
          />
          {showUserLocation ? <UserLocation /> : null}

          <ShapeSource
            id={USER_LOCATION_SOURCE_ID}
            testID="quillamap-native-user-location-source"
            shape={userLocationFeatureCollection}
          >
            <CircleLayer
              id={`${USER_LOCATION_LAYER_ID}-halo`}
              testID="quillamap-native-user-location-halo"
              style={{
                circleColor: white,
                circleRadius: 9,
                circleOpacity: 0.95,
                circleStrokeColor: primary,
                circleStrokeWidth: 2,
              }}
            />
            <CircleLayer
              id={USER_LOCATION_LAYER_ID}
              testID="quillamap-native-user-location-dot"
              style={{
                circleColor: primary,
                circleRadius: 4,
                circleOpacity: 1,
              }}
            />
          </ShapeSource>

          <ShapeSource id={NAVIGATION_ROUTE_SOURCE_ID} shape={routeFeature}>
            <LineLayer
              id={NAVIGATION_ROUTE_HALO_LAYER_ID}
              testID="quillamap-native-route-halo"
              style={{
                lineColor: NAVIGATION_ROUTE_LINE_STYLE.haloColor,
                lineWidth: NAVIGATION_ROUTE_LINE_STYLE.haloWidth,
                lineOpacity: NAVIGATION_ROUTE_LINE_STYLE.haloOpacity,
                lineCap: NAVIGATION_ROUTE_LINE_STYLE.lineCap,
                lineJoin: NAVIGATION_ROUTE_LINE_STYLE.lineJoin,
              }}
            />
            <LineLayer
              id={NAVIGATION_ROUTE_LAYER_ID}
              testID="quillamap-native-route"
              style={{
                lineColor: routeColor,
                lineWidth: NAVIGATION_ROUTE_LINE_STYLE.lineWidth,
                lineCap: NAVIGATION_ROUTE_LINE_STYLE.lineCap,
                lineJoin: NAVIGATION_ROUTE_LINE_STYLE.lineJoin,
              }}
            />
          </ShapeSource>

          <ShapeSource id={NAVIGATION_DESTINATION_SOURCE_ID} shape={destinationFeatureCollection}>
            <CircleLayer
              id={`${NAVIGATION_DESTINATION_LAYER_ID}-halo`}
              style={{
                circleColor: white,
                circleRadius: 18,
                circleStrokeColor: primary,
                circleStrokeWidth: 3,
              }}
            />
            <SymbolLayer
              id={NAVIGATION_DESTINATION_LAYER_ID}
              testID="quillamap-native-destination-marker"
              style={{
                textField: DESTINATION_MARKER_EMOJI,
                textFont: ['sans-serif'],
                textSize: 20,
                textColor: primary,
                textAllowOverlap: true,
                textIgnorePlacement: true,
              }}
            />
          </ShapeSource>

          {is3D ? (
            <ShapeSource
              id="buildings-source"
              testID="quillamap-native-buildings-source"
              shape={buildingsFeatureCollection}
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
              <FillExtrusionLayer
                id="places-buildings"
                testID="quillamap-native-building-extrusions"
                style={{
                  fillExtrusionColor: ['get', 'color'],
                  fillExtrusionHeight: ['get', 'height'],
                  fillExtrusionBase: ['get', 'base'],
                  fillExtrusionOpacity: 0.88,
                  fillExtrusionVerticalGradient: true,
                }}
              />
              <LineLayer
                id="places-building-outline"
                testID="quillamap-native-building-outline"
                style={{
                  lineColor: ['get', 'color'],
                  lineWidth: 2,
                  lineOpacity: 0.95,
                }}
              />
            </ShapeSource>
          ) : null}

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
                circleStrokeColor: placeMarkerColor,
                circleStrokeWidth: 2,
              }}
            />
            <SymbolLayer
              id="places-static-dots"
              testID="quillamap-native-places-layer"
              style={{
                textField: ['get', 'icon'],
                textFont: ['Open Sans Regular'],
                textSize: 18,
                textColor: placeMarkerColor,
                textHaloColor: white,
                textHaloWidth: 1,
                textAllowOverlap: true,
                textIgnorePlacement: true,
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
              closeSelectedPlace();
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
          compassTestID="quillamap-native-compass-toggle"
          compassBearing={compassBearing}
          zoomInTestID="quillamap-native-zoom-in"
          zoomOutTestID="quillamap-native-zoom-out"
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onTogglePerspective={togglePerspective}
          onToggleCompass={toggleCompass}
          onControlsInteraction={closeSelectedPlace}
          profileTools={profileTools}
          navigationControl={navigationControl}
        />
        {selectedPlace && canOpenPlaces ? (
          <PlaceInfoBottomSheet
            place={selectedPlace}
            themeMode={themeMode}
            onClose={() => setSelectedPlace(null)}
          />
        ) : null}
        {children}
      </View>
    </View>
  );
};

export default QuillaMap;
