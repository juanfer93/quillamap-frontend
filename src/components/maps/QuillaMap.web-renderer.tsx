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
import QuillaMapShadowMarker from './QuillaMapShadowMarker';
import {
  getBuildingsFeatureCollection,
  getPlacesFeatureCollection,
  getRouteFeature,
  getShadeZonesFeatureCollection,
  MAPLIBRE_STYLE,
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
  const markerRefs = useRef<MapLibreMarker[]>([]);
  const route = getRouteCoordinates(routePoints, center);
  const isDark = themeMode === 'dark';
  const isPedestrian = mode === 'pedestrian';
  const shouldShowShadowZones = !(isPedestrian && isDark);
  const zones = shouldShowShadowZones ? getVisibleShadeZones(shadeZones, showDefaultShadeZones) : [];
  const visiblePlaces = getVisiblePlaces(places);
  const canOpenPlaces = canInteractWithPlaces(mode);
  const [zoomLevel, setZoomLevel] = useState(isPedestrian ? 16 : 15);
  const [selectedPlace, setSelectedPlace] = useState<PlaceMapFeature | null>(null);
  const mapShade = tokenColor('map-shade') || '#5DA271';
  const mapRoute = tokenColor('map-route') || '#2F8AC4';
  const primary = '#004574';
  const darkGray = tokenColor('dark-gray') || '#333333';
  const culturalGold = '#D4AF37';
  const shadowMarkerColor = tokenColor('secondary') || culturalGold;
  const controlBackground = isDark ? '#121212' : tokenColor('white');
  const controlText = isDark ? culturalGold : darkGray;
  const controlBorder = isDark ? '#3A3328' : tokenColor('medium-gray');
  const routeFeature = useMemo(() => getRouteFeature(route), [route]);
  const shadeFeatureCollection = useMemo(() => getShadeZonesFeatureCollection(zones), [zones]);
  const placesFeatureCollection = useMemo(() => getPlacesFeatureCollection(visiblePlaces), [visiblePlaces]);
  const buildingsFeatureCollection = useMemo(() => getBuildingsFeatureCollection(visiblePlaces), [visiblePlaces]);

  const handlePlacePress = (place: PlaceMapFeature) => {
    if (!canOpenPlaces) {
      return;
    }

    setSelectedPlace(place);
    onPlacePress?.(place);
  };

  useEffect(() => {
    if (!hasDom() || mapRef.current || !mapHostRef.current) {
      return undefined;
    }

    const host = mapHostRef.current as unknown as HTMLElement;
    const map = new maplibregl.Map({
      container: host,
      style: MAPLIBRE_STYLE,
      center: [center.longitude, center.latitude],
      zoom: zoomLevel,
      pitch: visiblePlaces.length > 0 ? 48 : 0,
      attributionControl: false,
    });

    mapRef.current = map;

    map.on('click', (event) => {
      onMapPress?.({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      });
    });

    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.jumpTo({
      center: [center.longitude, center.latitude],
      zoom: zoomLevel,
      pitch: visiblePlaces.length > 0 ? 48 : 0,
    });
  }, [center.latitude, center.longitude, visiblePlaces.length, zoomLevel]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return undefined;
    }

    const applyLayers = () => {
      upsertGeoJsonSource(map, 'route-source', routeFeature);
      upsertGeoJsonSource(map, 'buildings-source', buildingsFeatureCollection);
      upsertGeoJsonSource(map, 'places-source', placesFeatureCollection);
      upsertGeoJsonSource(map, 'shade-zones-source', shadeFeatureCollection);

      if (!map.getLayer('places-buildings')) {
        map.addLayer({
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
      }

      if (!map.getLayer('route-line')) {
        map.addLayer({
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
      }

      if (!map.getLayer('shade-zones')) {
        map.addLayer({
          id: 'shade-zones',
          type: 'circle',
          source: 'shade-zones-source',
          paint: {
            'circle-color': mapShade,
            'circle-opacity': isPedestrian ? 0 : 0.22,
            'circle-radius': isPedestrian ? 0 : 22,
            'circle-stroke-color': primary,
            'circle-stroke-width': isPedestrian ? 0 : 2,
          },
        });
      }

      if (!map.getLayer('places-static-dots')) {
        map.addLayer({
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
      }
    };

    if (map.isStyleLoaded()) {
      applyLayers();
      return undefined;
    }

    map.once('load', applyLayers);
    return () => {
      map.off('load', applyLayers);
    };
  }, [buildingsFeatureCollection, isPedestrian, mapRoute, mapShade, placesFeatureCollection, routeFeature, shadeFeatureCollection]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasDom()) {
      return;
    }

    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

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
      markerRefs.current.push(marker);
    });
  }, [canOpenPlaces, visiblePlaces]);

  const zoomIn = () => setZoomLevel((currentZoom) => Math.min(currentZoom + 1, 19));
  const zoomOut = () => setZoomLevel((currentZoom) => Math.max(currentZoom - 1, 11));

  const fallbackMarkers = !hasDom() ? (
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
            ? (isDark ? tw`flex-1 overflow-hidden bg-charcoal` : tw`flex-1 overflow-hidden bg-surface-light`)
            : tw`flex-1 overflow-hidden rounded-m border border-medium-gray bg-surface-light dark:bg-charcoal`
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

        {fallbackMarkers}

        {zones.map((zone, index) => (
          <Pressable
            key={zone.id}
            testID={`quillamap-web-shade-marker-${zone.id}`}
            accessibilityRole="button"
            accessibilityLabel={zone.title}
            onPress={() => onShadeZonePress?.(zone)}
            style={[
              isPedestrian
                ? tw`absolute w-10 h-12 items-center justify-start`
                : tw`absolute w-10 h-10 rounded-xl bg-white border-2 border-map-shade items-center justify-center`,
              {
                left: 24,
                top: 160 + index * 48,
                zIndex: 12,
              },
            ]}
          >
            {isPedestrian ? (
              <QuillaMapShadowMarker color={shadowMarkerColor} />
            ) : (
              <MapIcon name="leaf-outline" size={18} color={mapShade} />
            )}
          </Pressable>
        ))}

        {selectedCoordinate && shouldShowShadowZones ? (
          <View
            testID="quillamap-web-shadow-draft-marker"
            style={[tw`absolute w-11 items-center justify-start`, { height: 52, left: 72, top: 160, zIndex: 12 }]}
          >
            <QuillaMapShadowMarker color={shadowMarkerColor} size="draft" />
          </View>
        ) : null}

        <QuillaMapControls
          mode={mode}
          isDark={isDark}
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
          zoomInTestID="quillamap-web-zoom-in"
          zoomOutTestID="quillamap-web-zoom-out"
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
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
