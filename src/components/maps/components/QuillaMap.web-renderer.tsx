import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import maplibregl, {
  type ExpressionSpecification,
  type Map as MapLibreMap,
  type Marker as MapLibreMarker,
} from 'maplibre-gl';
import tw from '@/lib/tailwind';
import type { QuillaMapProps } from '../types/QuillaMap.types';
import {
  PLACES_VISUAL_IDENTITY,
  getPlaceCategoryVisual,
  type PlaceMapFeature,
} from '@/types/contracts/places.contract';
import type { SecurityHeatmapPointContract } from '@/types/contracts/security.contract';
import type { MapIconProps } from '../types/QuillaMap.icon.types';
import PlaceInfoBottomSheet from '@/features/places/components/PlaceInfoBottomSheet';
import {
  canInteractWithPlaces,
  getRouteCoordinates,
  getVisiblePlaces,
  getVisibleShadeZones,
} from '../styles/QuillaMap.shared';
import QuillaMapControls from './QuillaMapControls';
import {
  createSecurityMarkerElement,
  createShadowMarkerElement,
  hasDom,
} from './QuillaMap.web-dom';
import { applyQuillaMapWebLayers } from './QuillaMap.web-layers';
import {
  DARK_MAP_THEME,
  MAP_3D_PITCH,
  getBuildingsFeatureCollection,
  getDestinationFeatureCollection,
  getMapLibreStyle,
  getNavigationArrowFeatureCollection,
  getNavigationBearingDegrees,
  getPlacesFeatureCollection,
  getRouteFeatureCollection,
  getShadeRouteSegmentsFeatureCollection,
  getShadeZoneAreasFeatureCollection,
  getShadeZonesFeatureCollection,
  getSecurityHeatmapFeatureCollection,
  getThermalComfortFocusCoordinates,
  getThermalComfortShadeFeatureCollection,
  getTransitMapBounds,
  getTransitRouteFeatureCollection,
  getTransitStopFeatureCollection,
  getUserLocationFeatureCollection,
  NAVIGATION_ROUTE_LINE_STYLE,
  NAVIGATION_SHADE_ROUTE_LINE_STYLE,
  SECURITY_HEATMAP_ALERT_LAYER_ID,
  SECURITY_HEATMAP_HITBOX_LAYER_ID,
  SECURITY_HEATMAP_STYLE,
  THERMAL_COMFORT_SHADE_LINE_STYLE,
} from '../styles/QuillaMap.maplibre';
import {
  CAMERA_ANIMATION_DURATION_MS,
  INITIAL_DEFAULT_ZOOM,
  INITIAL_PEDESTRIAN_ZOOM,
  PLACES_FULL_OPACITY_ZOOM,
  PLACES_MIN_VISIBLE_ZOOM,
  getCompassBearing,
  getNextCardinalBearing,
  normalizeBearing,
} from '../utils/QuillaMap.camera';

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;

const tokenColor = (name: string, fallback = ''): string => {
  const value = tw.color(name);
  return typeof value === 'string' ? value : fallback;
};

const getPlaceTitle = (place: PlaceMapFeature): string => place.name.es;

const getFallbackIcon = (place: PlaceMapFeature): string =>
  place.source === 'tourist_site'
    ? 'business-outline'
    : place.iconName ?? getPlaceCategoryVisual(place.category).iconName;

const QuillaMapWebRenderer = ({
  mode,
  themeMode = 'light',
  center,
  shadeZones,
  places,
  showDefaultShadeZones,
  routePoints,
  shadeRouteSegments,
  thermalComfortRoute,
  transitMap,
  securityHeatmap,
  securityHeatmapMode = 'heatmap',
  draftMarkerKind = 'shadow',
  showUserLocation = true,
  showCompassControl = true,
  showZoomControl = true,
  children,
  profileTools,
  onShadeZonePress,
  onPlacePress,
  onSecurityHeatmapPointPress,
  onMapPress,
  selectedCoordinate,
  destinationCoordinate,
  navigationControl,
  style,
}: QuillaMapProps) => {
  const mapHostRef = useRef<View | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const shadowMarkerRefs = useRef<MapLibreMarker[]>([]);
  const route = getRouteCoordinates(routePoints, center);
  const isDark = themeMode === 'dark';
  const isPedestrian = mode === 'pedestrian';
  const mapStyle = getMapLibreStyle(themeMode);
  const shouldShowShadowZones = !(isPedestrian && isDark);
  const zoomLevelRef = useRef(isPedestrian ? INITIAL_PEDESTRIAN_ZOOM : INITIAL_DEFAULT_ZOOM);
  const [mapZoom, setMapZoom] = useState(zoomLevelRef.current);
  const zones = shouldShowShadowZones && mapZoom >= PLACES_MIN_VISIBLE_ZOOM
    ? getVisibleShadeZones(shadeZones, showDefaultShadeZones)
    : [];
  const visiblePlaces = mapZoom >= PLACES_MIN_VISIBLE_ZOOM ? getVisiblePlaces(places) : [];
  const canOpenPlaces = canInteractWithPlaces(mode);
  const placesRef = useRef(visiblePlaces);
  const zonesRef = useRef(zones);
  const securityHeatmapPointsRef = useRef(securityHeatmap?.points ?? []);
  const onMapPressRef = useRef(onMapPress);
  const onPlacePressRef = useRef(onPlacePress);
  const onShadeZonePressRef = useRef(onShadeZonePress);
  const onSecurityHeatmapPointPressRef = useRef(onSecurityHeatmapPointPress);
  const canOpenPlacesRef = useRef(canOpenPlaces);
  const [is3D, setIs3D] = useState(false);
  const [cameraBearing, setCameraBearing] = useState<number>(0);
  const [selectedPlace, setSelectedPlace] = useState<PlaceMapFeature | null>(null);
  const mapShade = tokenColor('map-shade', '#5DA271');
  const mapRoute = NAVIGATION_ROUTE_LINE_STYLE.lineColor;
  const primary = tokenColor(PLACES_VISUAL_IDENTITY.sharkBlue.token, PLACES_VISUAL_IDENTITY.sharkBlue.hex);
  const darkGray = tokenColor('dark-gray', '#333333');
  const culturalGold = tokenColor(PLACES_VISUAL_IDENTITY.sandGold.token, PLACES_VISUAL_IDENTITY.sandGold.hex);
  const white = tokenColor(PLACES_VISUAL_IDENTITY.white.token, PLACES_VISUAL_IDENTITY.white.hex);
  const lightPlaceMarkerColor: ExpressionSpecification = ['case', ['==', ['get', 'source'], 'tourist_site'], culturalGold, primary];
  const placeMarkerColor = isDark ? culturalGold : lightPlaceMarkerColor;
  const shadowMarkerColor = tokenColor('secondary') || culturalGold;
  const shadeMarkerColor = isPedestrian ? shadowMarkerColor : mapShade;
  const controlBackground = isDark ? DARK_MAP_THEME.controlBackground : white;
  const controlText = isDark ? DARK_MAP_THEME.controlText : darkGray;
  const controlBorder = isDark ? DARK_MAP_THEME.controlBorder : tokenColor('medium-gray', '#E0E0E0');
  const routeFeature = useMemo(() => getRouteFeatureCollection(route), [route]);
  const shadeRouteSegmentsFeatureCollection = useMemo(
    () => getShadeRouteSegmentsFeatureCollection(shadeRouteSegments),
    [shadeRouteSegments]
  );
  const thermalComfortShadeFeatureCollection = useMemo(
    () => getThermalComfortShadeFeatureCollection(thermalComfortRoute),
    [thermalComfortRoute]
  );
  const thermalComfortFocusCoordinates = useMemo(
    () => getThermalComfortFocusCoordinates(thermalComfortRoute),
    [thermalComfortRoute]
  );
  const transitRouteFeatureCollection = useMemo(
    () => getTransitRouteFeatureCollection(transitMap),
    [transitMap]
  );
  const transitStopFeatureCollection = useMemo(
    () => getTransitStopFeatureCollection(transitMap),
    [transitMap]
  );
  const transitMapBounds = useMemo(() => getTransitMapBounds(transitMap), [transitMap]);
  const securityHeatmapFeatureCollection = useMemo(
    () => getSecurityHeatmapFeatureCollection(securityHeatmap, securityHeatmapMode),
    [securityHeatmap, securityHeatmapMode]
  );
  const routeBearing = useMemo(() => getNavigationBearingDegrees(route), [route]);
  const navigationArrowFeatureCollection = useMemo(
    () => getNavigationArrowFeatureCollection(showUserLocation ? center : null, route),
    [center, route, showUserLocation]
  );
  const userLocationFeatureCollection = useMemo(
    () => getUserLocationFeatureCollection(showUserLocation ? center : null),
    [center, showUserLocation]
  );
  const destinationFeatureCollection = useMemo(
    () => getDestinationFeatureCollection(destinationCoordinate),
    [destinationCoordinate]
  );
  const shadeFeatureCollection = useMemo(() => getShadeZonesFeatureCollection(zones), [zones]);
  const shadeAreaFeatureCollection = useMemo(() => getShadeZoneAreasFeatureCollection(zones), [zones]);
  const placesFeatureCollection = useMemo(() => getPlacesFeatureCollection(visiblePlaces), [visiblePlaces]);
  const buildingsFeatureCollection = useMemo(() => getBuildingsFeatureCollection(visiblePlaces), [visiblePlaces]);
  const compassBearing = getCompassBearing(cameraBearing);

  const handlePlacePress = (place: PlaceMapFeature) => {
    if (!canOpenPlaces) {
      return;
    }

    setSelectedPlace(place);
    onPlacePress?.(place);
  };

  const handleSecurityHeatmapPointPress = (point: SecurityHeatmapPointContract) => {
    setSelectedPlace(null);
    onSecurityHeatmapPointPress?.(point);
  };

  const closeSelectedPlace = () => {
    setSelectedPlace(null);
  };

  const togglePerspective = () => {
    const nextIs3D = !is3D;
    setIs3D(nextIs3D);
    mapRef.current?.easeTo({
      pitch: nextIs3D ? MAP_3D_PITCH : 0,
      bearing: cameraBearing,
      duration: CAMERA_ANIMATION_DURATION_MS,
      easing: (time) => 1 - Math.pow(1 - time, 3),
    });
  };

  const toggleCompass = () => {
    const nextCameraBearing = getNextCardinalBearing(cameraBearing);
    setCameraBearing(nextCameraBearing);
    mapRef.current?.easeTo({
      bearing: nextCameraBearing,
      duration: CAMERA_ANIMATION_DURATION_MS,
      easing: (time) => 1 - Math.pow(1 - time, 3),
    });
  };

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  useEffect(() => {
    placesRef.current = visiblePlaces;
  }, [visiblePlaces]);

  useEffect(() => {
    securityHeatmapPointsRef.current = securityHeatmap?.points ?? [];
  }, [securityHeatmap]);

  useEffect(() => {
    canOpenPlacesRef.current = canOpenPlaces;
  }, [canOpenPlaces]);

  useEffect(() => {
    onMapPressRef.current = onMapPress;
  }, [onMapPress]);

  useEffect(() => {
    onPlacePressRef.current = onPlacePress;
  }, [onPlacePress]);

  useEffect(() => {
    onShadeZonePressRef.current = onShadeZonePress;
  }, [onShadeZonePress]);

  useEffect(() => {
    onSecurityHeatmapPointPressRef.current = onSecurityHeatmapPointPress;
  }, [onSecurityHeatmapPointPress]);

  useEffect(() => {
    if (mapZoom >= PLACES_MIN_VISIBLE_ZOOM) {
      return;
    }

    setSelectedPlace(null);
  }, [mapZoom]);

useEffect(() => {
    const host = mapHostRef.current as unknown as HTMLElement;
    const map = new maplibregl.Map({
      container: host,
      style: mapStyle,
      center: [center.longitude, center.latitude],
      zoom: zoomLevelRef.current,
      pitch: is3D ? MAP_3D_PITCH : 0,
      bearing: cameraBearing,
      attributionControl: false,
    });

    const syncCompassBearing = () => {
      const nextZoom = map.getZoom();
      zoomLevelRef.current = nextZoom;
      setMapZoom(nextZoom);
      setCameraBearing(normalizeBearing(map.getBearing()));
    };

    const handleMapClick = (event: maplibregl.MapMouseEvent) => {
      const securityLayers = [
        SECURITY_HEATMAP_HITBOX_LAYER_ID,
        SECURITY_HEATMAP_ALERT_LAYER_ID,
      ].filter((layerId) => map.getLayer(layerId));
      const securityFeature = securityLayers.length > 0
        ? map.queryRenderedFeatures(event.point, { layers: securityLayers })[0]
        : undefined;
      const rawSecurityClusterId = securityFeature?.properties?.clusterId;
      const securityClusterId = typeof rawSecurityClusterId === 'string'
        ? rawSecurityClusterId
        : typeof rawSecurityClusterId === 'number'
          ? String(rawSecurityClusterId)
          : null;
      const securityPoint = securityClusterId
        ? securityHeatmapPointsRef.current.find((candidate) => candidate.clusterId === securityClusterId)
        : undefined;

      if (securityPoint) {
        setSelectedPlace(null);
        onSecurityHeatmapPointPressRef.current?.(securityPoint);
        return;
      }

      const placeLayers = [
        'places-hitbox',
        'places-static-dots',
        'places-marker-background',
        'places-buildings',
      ].filter((layerId) => map.getLayer(layerId));
      const placeFeature = placeLayers.length > 0
        ? map.queryRenderedFeatures(event.point, { layers: placeLayers })[0]
        : undefined;
      const rawPlaceId = placeFeature?.properties?.id;
      const placeId = typeof rawPlaceId === 'string'
        ? rawPlaceId
        : typeof rawPlaceId === 'number'
          ? String(rawPlaceId)
          : null;
      const place = placeId ? placesRef.current.find((candidate) => candidate.id === placeId) : undefined;

      if (place && canOpenPlacesRef.current) {
        setSelectedPlace(place);
        onPlacePressRef.current?.(place);
        return;
      }

      const feature = map.getLayer('shade-zones')
        ? map.queryRenderedFeatures(event.point, { layers: ['shade-zones'] })[0]
        : undefined;
      const rawId = feature?.properties?.id;
      const zoneId = typeof rawId === 'string' ? rawId : typeof rawId === 'number' ? String(rawId) : null;
      const zone = zoneId ? zonesRef.current.find((candidate) => candidate.id === zoneId) : undefined;

      if (zone) {
        setSelectedPlace(null);
        onShadeZonePressRef.current?.(zone);
        return;
      }

      setSelectedPlace(null);
      onMapPressRef.current?.({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    };

    mapRef.current = map;
    map.on('click', handleMapClick);
    map.on('rotateend', syncCompassBearing);
    map.on('moveend', syncCompassBearing);

    return () => {
      map.off('click', handleMapClick);
      map.off('rotateend', syncCompassBearing);
      map.off('moveend', syncCompassBearing);
      shadowMarkerRefs.current.forEach((marker) => marker.remove());
      shadowMarkerRefs.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.jumpTo({
      center: [center.longitude, center.latitude],
      zoom: zoomLevelRef.current,
    });
  }, [center.latitude, center.longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return undefined;
    }

    const applyLayers = () => {
      applyQuillaMapWebLayers({
        map,
        routeFeature,
        shadeRouteSegmentsFeatureCollection,
        thermalComfortShadeFeatureCollection,
        transitRouteFeatureCollection,
        transitStopFeatureCollection,
        securityHeatmapFeatureCollection,
        navigationArrowFeatureCollection,
        userLocationFeatureCollection,
        destinationFeatureCollection,
        buildingsFeatureCollection,
        placesFeatureCollection,
        shadeFeatureCollection,
        shadeAreaFeatureCollection,
        securityHeatmapMode,
        is3D,
        isPedestrian,
        mapRoute,
        mapShade,
        placeMarkerColor,
        primary,
        shadeMarkerColor,
        white,
      });
    };

    if (map.isStyleLoaded()) {
      applyLayers();
      return undefined;
    }

    map.once('load', applyLayers);
    return () => {
      map.off('load', applyLayers);
    };
  }, [
    buildingsFeatureCollection,
    destinationFeatureCollection,
    is3D,
    mapRoute,
    mapShade,
    mapStyle,
    navigationArrowFeatureCollection,
    placesFeatureCollection,
    primary,
    routeFeature,
    securityHeatmapFeatureCollection,
    securityHeatmapMode,
    shadeRouteSegmentsFeatureCollection,
    shadeAreaFeatureCollection,
    shadeFeatureCollection,
    shadeMarkerColor,
    thermalComfortShadeFeatureCollection,
    transitRouteFeatureCollection,
    transitStopFeatureCollection,
    userLocationFeatureCollection,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || route.length < 2) {
      return;
    }

    const longitudes = route.map((point) => point.longitude);
    const latitudes = route.map((point) => point.latitude);
    const southWest: [number, number] = [Math.min(...longitudes), Math.min(...latitudes)];
    const northEast: [number, number] = [Math.max(...longitudes), Math.max(...latitudes)];

    map.fitBounds([southWest, northEast], {
      padding: { top: 150, bottom: 120, left: 64, right: 64 },
      duration: CAMERA_ANIMATION_DURATION_MS,
    });
  }, [route]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || thermalComfortFocusCoordinates.length < 2) {
      return;
    }

    const longitudes = thermalComfortFocusCoordinates.map((point) => point.longitude);
    const latitudes = thermalComfortFocusCoordinates.map((point) => point.latitude);
    const southWest: [number, number] = [Math.min(...longitudes), Math.min(...latitudes)];
    const northEast: [number, number] = [Math.max(...longitudes), Math.max(...latitudes)];

    map.fitBounds([southWest, northEast], {
      padding: { top: 112, bottom: 156, left: 42, right: 42 },
      duration: CAMERA_ANIMATION_DURATION_MS,
    });
  }, [thermalComfortFocusCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || route.length > 1 || thermalComfortFocusCoordinates.length > 1 || !transitMapBounds) {
      return;
    }

    map.fitBounds([transitMapBounds.southWest, transitMapBounds.northEast], {
      padding: { top: 96, bottom: 96, left: 36, right: 36 },
      duration: CAMERA_ANIMATION_DURATION_MS,
    });
  }, [route.length, thermalComfortFocusCoordinates.length, transitMapBounds]);

  useEffect(() => {
    const map = mapRef.current;

    if (route.length < 2) {
      return;
    }

    setIs3D(true);
    setCameraBearing(routeBearing);
    map?.easeTo({
      pitch: MAP_3D_PITCH,
      bearing: routeBearing,
      duration: CAMERA_ANIMATION_DURATION_MS,
      easing: (time) => 1 - Math.pow(1 - time, 3),
    });
  }, [route.length, routeBearing]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasDom()) {
      return;
    }

    shadowMarkerRefs.current.forEach((marker) => marker.remove());
    shadowMarkerRefs.current = [];

    zones.forEach((zone) => {
      const element = createShadowMarkerElement(
        `quillamap-web-shade-marker-${zone.id}`,
        shadeMarkerColor,
        zone.title
      );
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        onShadeZonePress?.(zone);
      });

      const marker = new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat([zone.coordinate.longitude, zone.coordinate.latitude])
        .addTo(map);
      shadowMarkerRefs.current.push(marker);
    });

    if (selectedCoordinate && shouldShowShadowZones) {
      const element = draftMarkerKind === 'security'
        ? createSecurityMarkerElement(
          'quillamap-web-security-draft-marker',
          'Nueva zona peligrosa'
        )
        : createShadowMarkerElement(
          'quillamap-web-shadow-draft-marker',
          shadowMarkerColor,
          'Nueva zona de sombra'
        );
      element.disabled = true;
      element.style.cursor = 'default';

      const marker = new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat([selectedCoordinate.longitude, selectedCoordinate.latitude])
        .addTo(map);
      shadowMarkerRefs.current.push(marker);
    }
  }, [
    draftMarkerKind,
    mapStyle,
    onShadeZonePress,
    selectedCoordinate,
    shadeMarkerColor,
    shadowMarkerColor,
    shouldShowShadowZones,
    zones,
  ]);

  const applyZoom = (delta: number) => {
    const map = mapRef.current;
    const currentZoom = map?.getZoom() ?? zoomLevelRef.current;
    const nextZoom = Math.max(11, Math.min(currentZoom + delta, 19));
    zoomLevelRef.current = nextZoom;
    setMapZoom(nextZoom);
    map?.easeTo({
      zoom: nextZoom,
      duration: CAMERA_ANIMATION_DURATION_MS,
      easing: (time) => 1 - Math.pow(1 - time, 3),
    });
  };
  const zoomIn = () => applyZoom(1);
  const zoomOut = () => applyZoom(-1);

  const fallbackFeatures = !hasDom() ? (
    <>
      {visiblePlaces.map((place) => {
        const isTouristSite = place.source === 'tourist_site';
        const markerColor = isDark || isTouristSite ? culturalGold : primary;

        return (
          <Pressable
            key={place.id}
            testID={`quillamap-web-place-marker-${place.id}`}
            accessibilityRole={canOpenPlaces ? 'button' : undefined}
            accessibilityLabel={getPlaceTitle(place)}
            disabled={!canOpenPlaces}
            onPress={canOpenPlaces ? () => handlePlacePress(place) : undefined}
            style={[
              tw`absolute w-10 h-10 rounded-xl bg-white border-2 items-center justify-center`,
              {
                borderColor: markerColor,
                left: 24,
                top: 84 + visiblePlaces.indexOf(place) * 48,
                zIndex: 10,
              },
            ]}
          >
            <MapIcon
              name={getFallbackIcon(place)}
              size={17}
              color={markerColor}
            />
            <Text style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}>
              {getPlaceTitle(place)}
            </Text>
          </Pressable>
        );
      })}
      {securityHeatmap?.points.map((point) => (
        <Pressable
          key={point.clusterId}
          testID={`quillamap-web-security-heatmap-point-${point.clusterId}`}
          accessibilityRole="button"
          accessibilityLabel="Punto de seguridad"
          onPress={() => handleSecurityHeatmapPointPress(point)}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
      ))}
      {zones.map((zone) => (
        <Pressable
          key={zone.id}
          testID={`quillamap-web-shade-marker-${zone.id}`}
          accessibilityRole="button"
          accessibilityLabel={zone.title}
          onPress={() => onShadeZonePress?.(zone)}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
      ))}
      {selectedCoordinate && shouldShowShadowZones ? (
        <View
          testID={draftMarkerKind === 'security'
            ? 'quillamap-web-security-draft-marker'
            : 'quillamap-web-shadow-draft-marker'}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
      ) : null}
      {destinationCoordinate ? (
        <View
          testID="quillamap-web-destination-marker"
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
      ) : null}
      {showUserLocation ? (
        <View
          testID="quillamap-web-user-location-dot"
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
      ) : null}
      {is3D ? buildingsFeatureCollection.features.map((feature) => (
        <View
          key={String(feature.id)}
          testID={`quillamap-web-building-extrusion-${feature.properties.id}`}
          {...({
            fill: feature.properties.color,
            extrusionHeight: feature.properties.height,
          } as Record<string, unknown>)}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
      )) : null}
    </>
  ) : null;

  return (
    <View testID="quillamap-container" style={[tw`flex-1`, style]}>
      <View
        testID="quillamap-web"
        style={
          isPedestrian
            ? [
                tw`flex-1 overflow-hidden`,
                { backgroundColor: isDark ? DARK_MAP_THEME.background : tokenColor('surface-light') || '#F8FAFC' },
              ]
            : [
                tw`flex-1 overflow-hidden rounded-m border border-medium-gray`,
                { backgroundColor: isDark ? DARK_MAP_THEME.background : tokenColor('surface-light') || '#F8FAFC' },
              ]
        }
      >
        <View
          ref={mapHostRef}
          testID="quillamap-web-maplibre"
          style={tw`absolute inset-0`}
        />
        {!hasDom() ? (
          <View
            testID="quillamap-web-pan-layer"
            onResponderRelease={() => onMapPress?.(center)}
            {...({
              onPointerDown: () => undefined,
              onPointerMove: () => undefined,
              onPointerUp: () => undefined,
            } as Record<string, unknown>)}
            style={tw`absolute inset-0`}
          />
        ) : null}
        <View testID="quillamap-web-route" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
        <View
          testID="quillamap-web-route-shade-halo"
          {...({
            featuresCount: shadeRouteSegmentsFeatureCollection.features.length,
            lineColor: NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineColor,
          } as Record<string, unknown>)}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
        <View
          testID="quillamap-web-thermal-comfort-shade"
          {...({
            featuresCount: thermalComfortShadeFeatureCollection.features.length,
            lineColor: THERMAL_COMFORT_SHADE_LINE_STYLE.lineColor,
          } as Record<string, unknown>)}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
        <View
          testID="quillamap-web-transit-routes"
          {...({ featuresCount: transitRouteFeatureCollection.features.length } as Record<string, unknown>)}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
        <View
          testID="quillamap-web-transit-stops"
          {...({ featuresCount: transitStopFeatureCollection.features.length } as Record<string, unknown>)}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
        <View
          testID="quillamap-web-security-heatmap"
          {...({
            featuresCount: securityHeatmapFeatureCollection.features.length,
            mode: securityHeatmapMode,
            heatmapColor: SECURITY_HEATMAP_STYLE.heatmapColor,
          } as Record<string, unknown>)}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
        <View testID="quillamap-web-map-art" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
        <View testID="quillamap-web-map-tiles" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
        {route.length > 1 && showUserLocation ? (
          <View
            testID="quillamap-web-navigation-arrow"
            {...({ bearing: routeBearing, is3D } as Record<string, unknown>)}
            style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          />
        ) : null}

        {fallbackFeatures}

        <QuillaMapControls
          mode={mode}
          isDark={isDark}
          is3D={is3D}
          controlBackground={controlBackground}
          controlBorder={controlBorder}
          controlText={controlText}
          darkText={darkGray}
          mapRoute={mapRoute}
          mapShade={mapShade}
          primary={primary}
          zonesCount={zones.length}
          showCompass={showCompassControl}
          showZoom={isPedestrian && showZoomControl}
          showLocate
          perspectiveToggleTestID="quillamap-web-perspective-toggle"
          compassTestID="quillamap-web-compass-toggle"
          compassBearing={compassBearing}
          zoomInTestID="quillamap-web-zoom-in"
          zoomOutTestID="quillamap-web-zoom-out"
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onTogglePerspective={togglePerspective}
          onToggleCompass={toggleCompass}
          onControlsInteraction={closeSelectedPlace}
          profileTools={profileTools}
          navigationControl={navigationControl}
        />

        {children}

        {selectedPlace && canOpenPlaces ? (
          <PlaceInfoBottomSheet
            place={selectedPlace}
            themeMode={themeMode}
            onClose={() => setSelectedPlace(null)}
          />
        ) : null}
      </View>
    </View>
  );
};

export default QuillaMapWebRenderer;
