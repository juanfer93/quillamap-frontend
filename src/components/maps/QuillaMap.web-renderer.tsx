import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import maplibregl, { type Map as MapLibreMap, type Marker as MapLibreMarker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import tw from '@/lib/tailwind';
import type { QuillaMapProps } from './QuillaMap.types';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { MapIconProps } from './QuillaMap.icon.types';
import PlaceInfoBottomSheet from '@/features/places/components/PlaceInfoBottomSheet';
import {
  canInteractWithPlaces,
  getRouteCoordinates,
  getVisiblePlaces,
  getVisibleShadeZones,
} from './QuillaMap.shared';
import QuillaMapControls from './QuillaMapControls';
import {
  DARK_MAP_THEME,
  getBuildingsFeatureCollection,
  getMapLibreStyle,
  getPlacesFeatureCollection,
  getRouteFeature,
  getShadeZoneAreasFeatureCollection,
  getShadeZonesFeatureCollection,
  SHADE_MARKER_EMOJI,
} from './QuillaMap.maplibre';

const MapIcon = Ionicons as React.ComponentType<MapIconProps>;

const tokenColor = (name: string): string => {
  const value = tw.color(name);
  return typeof value === 'string' ? value : '';
};

const getPlaceTitle = (place: PlaceMapFeature): string => place.name.es;

const hasDom = () => typeof document !== 'undefined';

const createMarkerElement = (testID: string, iconName: string, color: string, label: string) => {
  const element = document.createElement('button');
  element.type = 'button';
  element.dataset.testid = testID;
  element.setAttribute('aria-label', label);
  element.style.width = '40px';
  element.style.height = '40px';
  element.style.borderRadius = '10px';
  element.style.background = '#FFFFFF';
  element.style.border = `2px solid ${color}`;
  element.style.boxShadow = '0 8px 16px rgba(0, 69, 116, 0.18)';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
  element.style.cursor = 'pointer';
  element.style.color = color;
  element.innerHTML = iconName === 'business-outline' ? '◆' : '•';
  return element;
};

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
  element.style.background = '#FFFFFF';
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
  children,
  profileTools,
  onShadeZonePress,
  onPlacePress,
  onMapPress,
  selectedCoordinate,
  style,
}: QuillaMapProps) => {
  const mapHostRef = useRef<View | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const placeMarkerRefs = useRef<MapLibreMarker[]>([]);
  const shadowMarkerRefs = useRef<MapLibreMarker[]>([]);
  const route = getRouteCoordinates(routePoints, center);
  const isDark = themeMode === 'dark';
  const isPedestrian = mode === 'pedestrian';
  const mapStyle = getMapLibreStyle(themeMode);
  const shouldShowShadowZones = !(isPedestrian && isDark);
  const zones = shouldShowShadowZones ? getVisibleShadeZones(shadeZones, showDefaultShadeZones) : [];
  const visiblePlaces = getVisiblePlaces(places);
  const canOpenPlaces = canInteractWithPlaces(mode);
  const zonesRef = useRef(zones);
  const onMapPressRef = useRef(onMapPress);
  const onShadeZonePressRef = useRef(onShadeZonePress);
  const [zoomLevel, setZoomLevel] = useState(isPedestrian ? 16 : 15);
  const [is3D, setIs3D] = useState(() => visiblePlaces.length > 0);
  const [selectedPlace, setSelectedPlace] = useState<PlaceMapFeature | null>(null);
  const mapShade = tokenColor('map-shade') || '#5DA271';
  const mapRoute = tokenColor('map-route') || '#2F8AC4';
  const primary = '#004574';
  const darkGray = tokenColor('dark-gray') || '#333333';
  const culturalGold = '#D4AF37';
  const shadowMarkerColor = tokenColor('secondary') || culturalGold;
  const shadeMarkerColor = isPedestrian ? shadowMarkerColor : mapShade;
  const controlBackground = isDark ? DARK_MAP_THEME.controlBackground : tokenColor('white') || '#FFFFFF';
  const controlText = isDark ? DARK_MAP_THEME.controlText : darkGray;
  const controlBorder = isDark ? DARK_MAP_THEME.controlBorder : tokenColor('medium-gray') || '#E0E0E0';
  const routeFeature = useMemo(() => getRouteFeature(route), [route]);
  const shadeFeatureCollection = useMemo(() => getShadeZonesFeatureCollection(zones), [zones]);
  const shadeAreaFeatureCollection = useMemo(() => getShadeZoneAreasFeatureCollection(zones), [zones]);
  const placesFeatureCollection = useMemo(() => getPlacesFeatureCollection(visiblePlaces), [visiblePlaces]);
  const buildingsFeatureCollection = useMemo(() => getBuildingsFeatureCollection(visiblePlaces), [visiblePlaces]);

  const handlePlacePress = (place: PlaceMapFeature) => {
    if (!canOpenPlaces) {
      return;
    }

    setSelectedPlace(place);
    onPlacePress?.(place);
  };

  const togglePerspective = () => {
    const nextIs3D = !is3D;
    setIs3D(nextIs3D);
    mapRef.current?.easeTo({
      pitch: nextIs3D ? 48 : 0,
      duration: 220,
    });
  };

  useEffect(() => {
    zonesRef.current = zones;
  }, [zones]);

  useEffect(() => {
    onMapPressRef.current = onMapPress;
  }, [onMapPress]);

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
      zoom: zoomLevel,
      pitch: is3D ? 48 : 0,
      attributionControl: false,
    });

    const handleMapClick = (event: maplibregl.MapMouseEvent) => {
      const feature = map.getLayer('shade-zones')
        ? map.queryRenderedFeatures(event.point, { layers: ['shade-zones'] })[0]
        : undefined;
      const rawId = feature?.properties?.id;
      const zoneId = typeof rawId === 'string' ? rawId : typeof rawId === 'number' ? String(rawId) : null;
      const zone = zoneId ? zonesRef.current.find((candidate) => candidate.id === zoneId) : undefined;

      if (zone) {
        onShadeZonePressRef.current?.(zone);
        return;
      }

      onMapPressRef.current?.({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    };

    mapRef.current = map;
    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      placeMarkerRefs.current.forEach((marker) => marker.remove());
      placeMarkerRefs.current = [];
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
      zoom: zoomLevel,
    });
  }, [center.latitude, center.longitude, zoomLevel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return undefined;
    }

    const addLayerIfMissing = (id: string, layer: any) => {
      if (!map.getLayer(id)) {
        map.addLayer(layer);
      }
    };

    const applyLayers = () => {
      upsertGeoJsonSource(map, 'route-source', routeFeature);
      upsertGeoJsonSource(map, 'buildings-source', buildingsFeatureCollection);
      upsertGeoJsonSource(map, 'places-source', placesFeatureCollection);
      upsertGeoJsonSource(map, 'shade-zones-source', shadeFeatureCollection);
      upsertGeoJsonSource(map, 'shade-area-source', shadeAreaFeatureCollection);

      addLayerIfMissing('places-buildings', {
        id: 'places-buildings',
        type: 'fill-extrusion',
        source: 'buildings-source',
        paint: {
          'fill-extrusion-color': ['get', 'color'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'base'],
          'fill-extrusion-opacity': 0.62,
        },
      });

      addLayerIfMissing('route-line', {
        id: 'route-line',
        type: 'line',
        source: 'route-source',
        paint: {
          'line-color': mapRoute,
          'line-width': isPedestrian ? 6 : 4,
        },
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
      });
      map.setPaintProperty('route-line', 'line-color', mapRoute);
      map.setPaintProperty('route-line', 'line-width', isPedestrian ? 6 : 4);

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
          'circle-color': '#FFFFFF',
          'circle-radius': 17,
          'circle-stroke-color': shadeMarkerColor,
          'circle-stroke-width': 2,
        },
      });
      map.setPaintProperty('shade-zones', 'circle-stroke-color', shadeMarkerColor);

      addLayerIfMissing('places-static-dots', {
        id: 'places-static-dots',
        type: 'circle',
        source: 'places-source',
        paint: {
          'circle-color': ['case', ['==', ['get', 'source'], 'tourist_site'], culturalGold, primary],
          'circle-radius': 7,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 2,
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
    isPedestrian,
    mapRoute,
    mapShade,
    mapStyle,
    placesFeatureCollection,
    routeFeature,
    shadeAreaFeatureCollection,
    shadeFeatureCollection,
    shadeMarkerColor,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasDom()) {
      return;
    }

    placeMarkerRefs.current.forEach((marker) => marker.remove());
    placeMarkerRefs.current = [];

    visiblePlaces.forEach((place) => {
      const isTouristSite = place.source === 'tourist_site';
      const markerColor = isTouristSite ? culturalGold : primary;
      const element = createMarkerElement(
        `quillamap-web-place-marker-${place.id}`,
        isTouristSite ? 'business-outline' : 'location-outline',
        markerColor,
        getPlaceTitle(place)
      );

      if (!canOpenPlaces) {
        element.disabled = true;
        element.style.cursor = 'default';
      } else {
        element.addEventListener('click', (event) => {
          event.stopPropagation();
          handlePlacePress(place);
        });
      }

      const marker = new maplibregl.Marker({ element })
        .setLngLat([place.coordinate.longitude, place.coordinate.latitude])
        .addTo(map);
      placeMarkerRefs.current.push(marker);
    });
  }, [canOpenPlaces, mapStyle, visiblePlaces]);

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

  const zoomIn = () => setZoomLevel((currentZoom) => Math.min(currentZoom + 1, 19));
  const zoomOut = () => setZoomLevel((currentZoom) => Math.max(currentZoom - 1, 11));

  const fallbackFeatures = !hasDom() ? (
    <>
      {visiblePlaces.map((place) => {
        const isTouristSite = place.source === 'tourist_site';
        const markerColor = isTouristSite ? culturalGold : primary;

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
              name={isTouristSite ? 'business-outline' : 'location-outline'}
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
      {buildingsFeatureCollection.features.map((feature) => (
        <View
          key={String(feature.id)}
          testID={`quillamap-web-building-extrusion-${feature.properties.id}`}
          {...({ fill: feature.properties.color } as Record<string, unknown>)}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />
      ))}
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
          zoomInTestID="quillamap-web-zoom-in"
          zoomOutTestID="quillamap-web-zoom-out"
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onTogglePerspective={togglePerspective}
          profileTools={profileTools}
        />

        {children}

        {selectedPlace && canOpenPlaces ? (
          <PlaceInfoBottomSheet
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
          />
        ) : null}
      </View>
    </View>
  );
};

export default QuillaMapWebRenderer;
