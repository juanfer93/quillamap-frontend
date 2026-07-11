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
  DARK_MAP_THEME,
  MAP_3D_PITCH,
  getBuildingsFeatureCollection,
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

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;
type AddLayerObject = Parameters<MapLibreMap['addLayer']>[0];
const INITIAL_PEDESTRIAN_ZOOM = 16;
const INITIAL_DEFAULT_ZOOM = 15;
const CAMERA_ANIMATION_DURATION_MS = 520;
const CARDINAL_BEARINGS = [0, 90, 180, 270] as const;
type CardinalBearing = typeof CARDINAL_BEARINGS[number];

const tokenColor = (name: string, fallback = ''): string => {
  const value = tw.color(name);
  return typeof value === 'string' ? value : fallback;
};

const getPlaceTitle = (place: PlaceMapFeature): string => place.name.es;

const normalizeBearing = (bearing: number): number => ((bearing % 360) + 360) % 360;

const getCompassBearing = (cameraBearing: number): number => normalizeBearing(-cameraBearing);

const getNextCardinalBearing = (cameraBearing: number): CardinalBearing => {
  const normalizedBearing = normalizeBearing(cameraBearing);
  const currentIndex = CARDINAL_BEARINGS.findIndex((bearing) => Math.abs(bearing - normalizedBearing) < 0.5);

  return currentIndex >= 0 ? CARDINAL_BEARINGS[(currentIndex + 1) % CARDINAL_BEARINGS.length] : 0;
};

const getFallbackIcon = (place: PlaceMapFeature): string =>
  place.source === 'tourist_site'
    ? 'business-outline'
    : place.iconName ?? getPlaceCategoryVisual(place.category).iconName;

const hasDom = () => typeof document !== 'undefined';

const createShadowMarkerElement = (testID: string, color: string, label: string) => {
  const element = document.createElement('button');
  element.type = 'button';
  element.dataset.testid = testID;
  element.setAttribute('aria-label', label);
  element.textContent = SHADE_MARKER_EMOJI;
  element.style.width = '36px';
  element.style.height = '36px';
  element.style.padding = '0';
  element.style.borderRadius = '50%';
  element.style.background = tokenColor(PLACES_VISUAL_IDENTITY.white.token, PLACES_VISUAL_IDENTITY.white.hex);
  element.style.border = `2px solid ${color}`;
  element.style.boxShadow = '0 6px 14px rgba(0, 69, 116, 0.2)';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
  element.style.cursor = 'pointer';
  element.style.fontFamily = 'sans-serif';
  element.style.fontSize = '21px';
  element.style.lineHeight = '1';
  element.style.color = color;
  return element;
};

const upsertGeoJsonSource = (
  map: MapLibreMap,
  id: string,
  data: GeoJSON.Feature | GeoJSON.FeatureCollection
) => {
  const source = map.getSource(id) as maplibregl.GeoJSONSource | undefined;

  if (source) {
    source.setData(data);
    return;
  }

  map.addSource(id, {
    type: 'geojson',
    data,
  });
};

const QuillaMapWebRenderer = ({
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
  const mapHostRef = useRef<View | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const shadowMarkerRefs = useRef<MapLibreMarker[]>([]);
  const route = getRouteCoordinates(routePoints, center);
  const isDark = themeMode === 'dark';
  const isPedestrian = mode === 'pedestrian';
  const mapStyle = getMapLibreStyle(themeMode);
  const shouldShowShadowZones = !(isPedestrian && isDark);
  const zones = shouldShowShadowZones ? getVisibleShadeZones(shadeZones, showDefaultShadeZones) : [];
  const visiblePlaces = getVisiblePlaces(places);
  const canOpenPlaces = canInteractWithPlaces(mode);
  const placesRef = useRef(visiblePlaces);
  const zonesRef = useRef(zones);
  const onMapPressRef = useRef(onMapPress);
  const onPlacePressRef = useRef(onPlacePress);
  const onShadeZonePressRef = useRef(onShadeZonePress);
  const canOpenPlacesRef = useRef(canOpenPlaces);
  const zoomLevelRef = useRef(isPedestrian ? INITIAL_PEDESTRIAN_ZOOM : INITIAL_DEFAULT_ZOOM);
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
    if (!hasDom() || mapRef.current || !mapHostRef.current) {
      return undefined;
    }

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
      setCameraBearing(normalizeBearing(map.getBearing()));
    };

    const handleMapClick = (event: maplibregl.MapMouseEvent) => {
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

    const addLayerIfMissing = (id: string, layer: AddLayerObject) => {
      if (!map.getLayer(id)) {
        map.addLayer(layer);
      }
    };

    const applyLayers = () => {
      upsertGeoJsonSource(map, NAVIGATION_ROUTE_SOURCE_ID, routeFeature);
      upsertGeoJsonSource(map, USER_LOCATION_SOURCE_ID, userLocationFeatureCollection);
      upsertGeoJsonSource(map, NAVIGATION_DESTINATION_SOURCE_ID, destinationFeatureCollection);
      upsertGeoJsonSource(map, 'buildings-source', buildingsFeatureCollection);
      upsertGeoJsonSource(map, 'places-source', placesFeatureCollection);
      upsertGeoJsonSource(map, 'shade-zones-source', shadeFeatureCollection);
      upsertGeoJsonSource(map, 'shade-area-source', shadeAreaFeatureCollection);

      addLayerIfMissing('places-buildings', {
        id: 'places-buildings',
        type: 'fill-extrusion',
        source: 'buildings-source',
        layout: {
          visibility: is3D ? 'visible' : 'none',
        },
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-opacity': 0.88,
          'fill-extrusion-vertical-gradient': true,
        },
      });

      addLayerIfMissing('places-building-outline', {
        id: 'places-building-outline',
        type: 'line',
        source: 'buildings-source',
        layout: {
          visibility: is3D ? 'visible' : 'none',
        },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2,
          'line-opacity': 0.95,
        },
      });
      map.setLayoutProperty('places-buildings', 'visibility', is3D ? 'visible' : 'none');
      map.setLayoutProperty('places-building-outline', 'visibility', is3D ? 'visible' : 'none');

      addLayerIfMissing(NAVIGATION_ROUTE_HALO_LAYER_ID, {
        id: NAVIGATION_ROUTE_HALO_LAYER_ID,
        type: 'line',
        source: NAVIGATION_ROUTE_SOURCE_ID,
        paint: {
          'line-color': NAVIGATION_ROUTE_LINE_STYLE.haloColor,
          'line-width': NAVIGATION_ROUTE_LINE_STYLE.haloWidth,
          'line-opacity': NAVIGATION_ROUTE_LINE_STYLE.haloOpacity,
        },
        layout: {
          'line-cap': NAVIGATION_ROUTE_LINE_STYLE.lineCap,
          'line-join': NAVIGATION_ROUTE_LINE_STYLE.lineJoin,
        },
      });
      map.setPaintProperty(NAVIGATION_ROUTE_HALO_LAYER_ID, 'line-color', NAVIGATION_ROUTE_LINE_STYLE.haloColor);
      map.setPaintProperty(NAVIGATION_ROUTE_HALO_LAYER_ID, 'line-width', NAVIGATION_ROUTE_LINE_STYLE.haloWidth);
      map.setPaintProperty(NAVIGATION_ROUTE_HALO_LAYER_ID, 'line-opacity', NAVIGATION_ROUTE_LINE_STYLE.haloOpacity);

      addLayerIfMissing(NAVIGATION_ROUTE_LAYER_ID, {
        id: NAVIGATION_ROUTE_LAYER_ID,
        type: 'line',
        source: NAVIGATION_ROUTE_SOURCE_ID,
        paint: {
          'line-color': mapRoute,
          'line-width': NAVIGATION_ROUTE_LINE_STYLE.lineWidth,
        },
        layout: {
          'line-cap': NAVIGATION_ROUTE_LINE_STYLE.lineCap,
          'line-join': NAVIGATION_ROUTE_LINE_STYLE.lineJoin,
        },
      });
      map.setPaintProperty(NAVIGATION_ROUTE_LAYER_ID, 'line-color', mapRoute);
      map.setPaintProperty(NAVIGATION_ROUTE_LAYER_ID, 'line-width', NAVIGATION_ROUTE_LINE_STYLE.lineWidth);

      addLayerIfMissing(`${USER_LOCATION_LAYER_ID}-halo`, {
        id: `${USER_LOCATION_LAYER_ID}-halo`,
        type: 'circle',
        source: USER_LOCATION_SOURCE_ID,
        paint: {
          'circle-color': white,
          'circle-radius': 9,
          'circle-opacity': 0.95,
          'circle-stroke-color': primary,
          'circle-stroke-width': 2,
        },
      });
      addLayerIfMissing(USER_LOCATION_LAYER_ID, {
        id: USER_LOCATION_LAYER_ID,
        type: 'circle',
        source: USER_LOCATION_SOURCE_ID,
        paint: {
          'circle-color': primary,
          'circle-radius': 4,
          'circle-opacity': 1,
        },
      });

      addLayerIfMissing(`${NAVIGATION_DESTINATION_LAYER_ID}-halo`, {
        id: `${NAVIGATION_DESTINATION_LAYER_ID}-halo`,
        type: 'circle',
        source: NAVIGATION_DESTINATION_SOURCE_ID,
        paint: {
          'circle-color': white,
          'circle-radius': 18,
          'circle-stroke-color': primary,
          'circle-stroke-width': 3,
        },
      });
      addLayerIfMissing(NAVIGATION_DESTINATION_LAYER_ID, {
        id: NAVIGATION_DESTINATION_LAYER_ID,
        type: 'symbol',
        source: NAVIGATION_DESTINATION_SOURCE_ID,
        layout: {
          'text-field': DESTINATION_MARKER_EMOJI,
          'text-font': ['Open Sans Regular'],
          'text-size': 20,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': primary,
          'text-halo-color': white,
          'text-halo-width': 1,
        },
      });

      addLayerIfMissing('shade-zone-areas', {
        id: 'shade-zone-areas',
        type: 'fill',
        source: 'shade-area-source',
        paint: {
          'fill-color': mapShade,
          'fill-opacity': isPedestrian ? 0 : 0.22,
        },
      });
      addLayerIfMissing('shade-zone-area-outline', {
        id: 'shade-zone-area-outline',
        type: 'line',
        source: 'shade-area-source',
        paint: {
          'line-color': primary,
          'line-width': 2,
          'line-opacity': isPedestrian ? 0 : 0.9,
        },
      });
      map.setPaintProperty('shade-zone-areas', 'fill-color', mapShade);
      map.setPaintProperty('shade-zone-areas', 'fill-opacity', isPedestrian ? 0 : 0.22);
      map.setPaintProperty('shade-zone-area-outline', 'line-color', primary);
      map.setPaintProperty('shade-zone-area-outline', 'line-opacity', isPedestrian ? 0 : 0.9);

      addLayerIfMissing('shade-zones', {
        id: 'shade-zones',
        type: 'circle',
        source: 'shade-zones-source',
        paint: {
          'circle-color': white,
          'circle-radius': 17,
          'circle-stroke-color': shadeMarkerColor,
          'circle-stroke-width': 2,
        },
      });
      map.setPaintProperty('shade-zones', 'circle-stroke-color', shadeMarkerColor);

      addLayerIfMissing('places-hitbox', {
        id: 'places-hitbox',
        type: 'circle',
        source: 'places-source',
        paint: {
          'circle-color': white,
          'circle-opacity': 0.01,
          'circle-radius': 22,
        },
      });

      addLayerIfMissing('places-marker-background', {
        id: 'places-marker-background',
        type: 'circle',
        source: 'places-source',
        paint: {
          'circle-color': white,
          'circle-radius': 15,
          'circle-stroke-color': placeMarkerColor,
          'circle-stroke-width': 2,
        },
      });

      addLayerIfMissing('places-static-dots', {
        id: 'places-static-dots',
        type: 'symbol',
        source: 'places-source',
        layout: {
          'text-field': ['get', 'icon'],
          'text-font': ['Open Sans Regular'],
          'text-size': 18,
          'text-allow-overlap': true,
          'text-ignore-placement': true,
        },
        paint: {
          'text-color': placeMarkerColor,
          'text-halo-color': '#ffffff',
          'text-halo-width': 1,
        },
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
    placesFeatureCollection,
    routeFeature,
    shadeAreaFeatureCollection,
    shadeFeatureCollection,
    shadeMarkerColor,
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
      const element = createShadowMarkerElement(
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
          testID="quillamap-web-shadow-draft-marker"
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
        <View testID="quillamap-web-map-art" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
        <View testID="quillamap-web-map-tiles" style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />

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
          showZoom={isPedestrian}
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
