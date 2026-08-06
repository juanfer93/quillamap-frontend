import {
  type ExpressionSpecification,
  type Map as MapLibreMap,
} from 'maplibre-gl';
import {
  DESTINATION_MARKER_EMOJI,
  NAVIGATION_ARROW_LAYER_ID,
  NAVIGATION_ARROW_MARKER,
  NAVIGATION_ARROW_SOURCE_ID,
  NAVIGATION_DESTINATION_LAYER_ID,
  NAVIGATION_DESTINATION_SOURCE_ID,
  NAVIGATION_ROUTE_HALO_LAYER_ID,
  NAVIGATION_ROUTE_LAYER_ID,
  NAVIGATION_ROUTE_LINE_STYLE,
  NAVIGATION_ROUTE_SOURCE_ID,
  NAVIGATION_SHADE_ROUTE_HALO_LAYER_ID,
  NAVIGATION_SHADE_ROUTE_LINE_STYLE,
  NAVIGATION_SHADE_ROUTE_SOURCE_ID,
  SECURITY_HEATMAP_ALERT_LAYER_ID,
  SECURITY_HEATMAP_ALERT_STYLE,
  SECURITY_HEATMAP_HITBOX_LAYER_ID,
  SECURITY_HEATMAP_LAYER_ID,
  SECURITY_HEATMAP_SOURCE_ID,
  SECURITY_HEATMAP_STYLE,
  THERMAL_COMFORT_SHADE_HALO_LAYER_ID,
  THERMAL_COMFORT_SHADE_LAYER_ID,
  THERMAL_COMFORT_SHADE_LINE_STYLE,
  THERMAL_COMFORT_SHADE_SOURCE_ID,
  TRANSIT_ROUTE_HALO_LAYER_ID,
  TRANSIT_ROUTE_LAYER_ID,
  TRANSIT_ROUTE_LINE_STYLE,
  TRANSIT_ROUTE_SOURCE_ID,
  TRANSIT_STOP_LAYER_ID,
  TRANSIT_STOP_SOURCE_ID,
  USER_LOCATION_LAYER_ID,
  USER_LOCATION_SOURCE_ID,
} from '../styles/QuillaMap.maplibre';
import { upsertGeoJsonSource } from './QuillaMap.web-dom';
import { PLACES_FULL_OPACITY_ZOOM, PLACES_MIN_VISIBLE_ZOOM } from '../utils/QuillaMap.camera';

type AddLayerObject = Parameters<MapLibreMap['addLayer']>[0];
type MapGeoJson = GeoJSON.Feature | GeoJSON.FeatureCollection;

const fadePlacesOpacity = (baseOpacity: number): ExpressionSpecification =>
  ['interpolate', ['linear'], ['zoom'], PLACES_MIN_VISIBLE_ZOOM, 0, PLACES_FULL_OPACITY_ZOOM, baseOpacity];

type ApplyQuillaMapWebLayersParams = {
  map: MapLibreMap;
  routeFeature: MapGeoJson;
  shadeRouteSegmentsFeatureCollection: MapGeoJson;
  thermalComfortShadeFeatureCollection: MapGeoJson;
  transitRouteFeatureCollection: MapGeoJson;
  transitStopFeatureCollection: MapGeoJson;
  securityHeatmapFeatureCollection: MapGeoJson;
  navigationArrowFeatureCollection: MapGeoJson;
  userLocationFeatureCollection: MapGeoJson;
  destinationFeatureCollection: MapGeoJson;
  buildingsFeatureCollection: MapGeoJson;
  placesFeatureCollection: MapGeoJson;
  shadeFeatureCollection: MapGeoJson;
  shadeAreaFeatureCollection: MapGeoJson;
  securityHeatmapMode: 'heatmap' | 'driving-lock';
  is3D: boolean;
  isPedestrian: boolean;
  mapRoute: string;
  mapShade: string;
  placeMarkerColor: string | ExpressionSpecification;
  primary: string;
  shadeMarkerColor: string;
  white: string;
};

export const applyQuillaMapWebLayers = ({
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
}: ApplyQuillaMapWebLayersParams) => {
  const addLayerIfMissing = (id: string, layer: AddLayerObject) => {
    if (!map.getLayer(id)) {
      map.addLayer(layer);
    }
  };

  upsertGeoJsonSource(map, NAVIGATION_ROUTE_SOURCE_ID, routeFeature);
  upsertGeoJsonSource(map, NAVIGATION_SHADE_ROUTE_SOURCE_ID, shadeRouteSegmentsFeatureCollection);
  upsertGeoJsonSource(map, THERMAL_COMFORT_SHADE_SOURCE_ID, thermalComfortShadeFeatureCollection);
  upsertGeoJsonSource(map, TRANSIT_ROUTE_SOURCE_ID, transitRouteFeatureCollection);
  upsertGeoJsonSource(map, TRANSIT_STOP_SOURCE_ID, transitStopFeatureCollection);
  upsertGeoJsonSource(map, SECURITY_HEATMAP_SOURCE_ID, securityHeatmapFeatureCollection);
  upsertGeoJsonSource(map, NAVIGATION_ARROW_SOURCE_ID, navigationArrowFeatureCollection);
  upsertGeoJsonSource(map, USER_LOCATION_SOURCE_ID, userLocationFeatureCollection);
  upsertGeoJsonSource(map, NAVIGATION_DESTINATION_SOURCE_ID, destinationFeatureCollection);
  upsertGeoJsonSource(map, 'buildings-source', buildingsFeatureCollection);
  upsertGeoJsonSource(map, 'places-source', placesFeatureCollection);
  upsertGeoJsonSource(map, 'shade-zones-source', shadeFeatureCollection);
  upsertGeoJsonSource(map, 'shade-area-source', shadeAreaFeatureCollection);

  addLayerIfMissing(SECURITY_HEATMAP_LAYER_ID, {
    id: SECURITY_HEATMAP_LAYER_ID,
    type: 'heatmap',
    source: SECURITY_HEATMAP_SOURCE_ID,
    layout: {
      visibility: securityHeatmapMode === 'driving-lock' ? 'none' : 'visible',
    },
    paint: {
      'heatmap-weight': SECURITY_HEATMAP_STYLE.heatmapWeight as unknown as ExpressionSpecification,
      'heatmap-intensity': SECURITY_HEATMAP_STYLE.heatmapIntensity as unknown as ExpressionSpecification,
      'heatmap-radius': SECURITY_HEATMAP_STYLE.heatmapRadius as unknown as ExpressionSpecification,
      'heatmap-color': SECURITY_HEATMAP_STYLE.heatmapColor as unknown as ExpressionSpecification,
      'heatmap-opacity': SECURITY_HEATMAP_STYLE.heatmapOpacity as unknown as ExpressionSpecification,
    },
  });
  map.setLayoutProperty(
    SECURITY_HEATMAP_LAYER_ID,
    'visibility',
    securityHeatmapMode === 'driving-lock' ? 'none' : 'visible'
  );

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

  addLayerIfMissing(TRANSIT_ROUTE_HALO_LAYER_ID, {
    id: TRANSIT_ROUTE_HALO_LAYER_ID,
    type: 'line',
    source: TRANSIT_ROUTE_SOURCE_ID,
    paint: {
      'line-color': TRANSIT_ROUTE_LINE_STYLE.haloColor,
      'line-width': TRANSIT_ROUTE_LINE_STYLE.haloWidth,
      'line-opacity': TRANSIT_ROUTE_LINE_STYLE.haloOpacity,
    },
    layout: {
      'line-cap': TRANSIT_ROUTE_LINE_STYLE.lineCap,
      'line-join': TRANSIT_ROUTE_LINE_STYLE.lineJoin,
    },
  });
  map.setPaintProperty(TRANSIT_ROUTE_HALO_LAYER_ID, 'line-color', TRANSIT_ROUTE_LINE_STYLE.haloColor);
  map.setPaintProperty(TRANSIT_ROUTE_HALO_LAYER_ID, 'line-width', TRANSIT_ROUTE_LINE_STYLE.haloWidth);
  map.setPaintProperty(TRANSIT_ROUTE_HALO_LAYER_ID, 'line-opacity', TRANSIT_ROUTE_LINE_STYLE.haloOpacity);

  addLayerIfMissing(TRANSIT_ROUTE_LAYER_ID, {
    id: TRANSIT_ROUTE_LAYER_ID,
    type: 'line',
    source: TRANSIT_ROUTE_SOURCE_ID,
    paint: {
      'line-color': ['get', 'color'],
      'line-width': TRANSIT_ROUTE_LINE_STYLE.lineWidth,
      'line-opacity': TRANSIT_ROUTE_LINE_STYLE.lineOpacity,
    },
    layout: {
      'line-cap': TRANSIT_ROUTE_LINE_STYLE.lineCap,
      'line-join': TRANSIT_ROUTE_LINE_STYLE.lineJoin,
    },
  });
  map.setPaintProperty(TRANSIT_ROUTE_LAYER_ID, 'line-width', TRANSIT_ROUTE_LINE_STYLE.lineWidth);
  map.setPaintProperty(TRANSIT_ROUTE_LAYER_ID, 'line-opacity', TRANSIT_ROUTE_LINE_STYLE.lineOpacity);

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

  addLayerIfMissing(NAVIGATION_SHADE_ROUTE_HALO_LAYER_ID, {
    id: NAVIGATION_SHADE_ROUTE_HALO_LAYER_ID,
    type: 'line',
    source: NAVIGATION_SHADE_ROUTE_SOURCE_ID,
    paint: {
      'line-color': NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineColor,
      'line-width': NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineWidth,
      'line-opacity': NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineOpacity,
      'line-blur': NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineBlur,
    },
    layout: {
      'line-cap': NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineCap,
      'line-join': NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineJoin,
    },
  });
  map.setPaintProperty(NAVIGATION_SHADE_ROUTE_HALO_LAYER_ID, 'line-color', NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineColor);
  map.setPaintProperty(NAVIGATION_SHADE_ROUTE_HALO_LAYER_ID, 'line-width', NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineWidth);
  map.setPaintProperty(NAVIGATION_SHADE_ROUTE_HALO_LAYER_ID, 'line-opacity', NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineOpacity);
  map.setPaintProperty(NAVIGATION_SHADE_ROUTE_HALO_LAYER_ID, 'line-blur', NAVIGATION_SHADE_ROUTE_LINE_STYLE.lineBlur);

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

  addLayerIfMissing(`${TRANSIT_STOP_LAYER_ID}-halo`, {
    id: `${TRANSIT_STOP_LAYER_ID}-halo`,
    type: 'circle',
    source: TRANSIT_STOP_SOURCE_ID,
    paint: {
      'circle-color': white,
      'circle-radius': 5,
      'circle-opacity': 0.76,
    },
  });
  addLayerIfMissing(TRANSIT_STOP_LAYER_ID, {
    id: TRANSIT_STOP_LAYER_ID,
    type: 'circle',
    source: TRANSIT_STOP_SOURCE_ID,
    paint: {
      'circle-color': ['get', 'color'],
      'circle-radius': ['case', ['==', ['get', 'agencyKind'], 'transmetro'], 4.5, 3.6],
      'circle-opacity': 0.95,
      'circle-stroke-color': white,
      'circle-stroke-width': 1,
    },
  });

  addLayerIfMissing(`${NAVIGATION_ARROW_LAYER_ID}-halo`, {
    id: `${NAVIGATION_ARROW_LAYER_ID}-halo`,
    type: 'circle',
    source: NAVIGATION_ARROW_SOURCE_ID,
    paint: {
      'circle-color': white,
      'circle-radius': 18,
      'circle-opacity': 0.96,
      'circle-stroke-color': mapRoute,
      'circle-stroke-width': 3,
    },
  });
  addLayerIfMissing(NAVIGATION_ARROW_LAYER_ID, {
    id: NAVIGATION_ARROW_LAYER_ID,
    type: 'symbol',
    source: NAVIGATION_ARROW_SOURCE_ID,
    layout: {
      'text-field': NAVIGATION_ARROW_MARKER,
      'text-font': ['Open Sans Regular'],
      'text-size': 25,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
      'text-pitch-alignment': 'map',
      'text-rotation-alignment': 'map',
      'text-rotate': ['get', 'bearing'],
    },
    paint: {
      'text-color': mapRoute,
      'text-halo-color': white,
      'text-halo-width': 1,
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
      'fill-opacity': fadePlacesOpacity(isPedestrian ? 0 : 0.22),
    },
  });
  addLayerIfMissing('shade-zone-area-outline', {
    id: 'shade-zone-area-outline',
    type: 'line',
    source: 'shade-area-source',
    paint: {
      'line-color': primary,
      'line-width': 2,
      'line-opacity': fadePlacesOpacity(isPedestrian ? 0 : 0.9),
    },
  });
  map.setPaintProperty('shade-zone-areas', 'fill-color', mapShade);
  map.setPaintProperty('shade-zone-areas', 'fill-opacity', fadePlacesOpacity(isPedestrian ? 0 : 0.22));
  map.setPaintProperty('shade-zone-area-outline', 'line-color', primary);
  map.setPaintProperty('shade-zone-area-outline', 'line-opacity', fadePlacesOpacity(isPedestrian ? 0 : 0.9));

  addLayerIfMissing('shade-zones', {
    id: 'shade-zones',
    type: 'circle',
    source: 'shade-zones-source',
    paint: {
      'circle-color': white,
      'circle-radius': 17,
      'circle-stroke-color': shadeMarkerColor,
      'circle-stroke-width': 2,
      'circle-opacity': fadePlacesOpacity(1),
    },
  });
  map.setPaintProperty('shade-zones', 'circle-stroke-color', shadeMarkerColor);
  map.setPaintProperty('shade-zones', 'circle-opacity', fadePlacesOpacity(1));

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
      'circle-opacity': fadePlacesOpacity(1),
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
      'text-opacity': fadePlacesOpacity(1),
    },
  });

  addLayerIfMissing(THERMAL_COMFORT_SHADE_HALO_LAYER_ID, {
    id: THERMAL_COMFORT_SHADE_HALO_LAYER_ID,
    type: 'line',
    source: THERMAL_COMFORT_SHADE_SOURCE_ID,
    paint: {
      'line-color': THERMAL_COMFORT_SHADE_LINE_STYLE.haloColor,
      'line-width': THERMAL_COMFORT_SHADE_LINE_STYLE.haloWidth,
      'line-opacity': THERMAL_COMFORT_SHADE_LINE_STYLE.haloOpacity,
    },
    layout: {
      'line-cap': THERMAL_COMFORT_SHADE_LINE_STYLE.lineCap,
      'line-join': THERMAL_COMFORT_SHADE_LINE_STYLE.lineJoin,
    },
  });
  map.setPaintProperty(THERMAL_COMFORT_SHADE_HALO_LAYER_ID, 'line-color', THERMAL_COMFORT_SHADE_LINE_STYLE.haloColor);
  map.setPaintProperty(THERMAL_COMFORT_SHADE_HALO_LAYER_ID, 'line-width', THERMAL_COMFORT_SHADE_LINE_STYLE.haloWidth);
  map.setPaintProperty(THERMAL_COMFORT_SHADE_HALO_LAYER_ID, 'line-opacity', THERMAL_COMFORT_SHADE_LINE_STYLE.haloOpacity);

  addLayerIfMissing(THERMAL_COMFORT_SHADE_LAYER_ID, {
    id: THERMAL_COMFORT_SHADE_LAYER_ID,
    type: 'line',
    source: THERMAL_COMFORT_SHADE_SOURCE_ID,
    paint: {
      'line-color': THERMAL_COMFORT_SHADE_LINE_STYLE.lineColor,
      'line-width': THERMAL_COMFORT_SHADE_LINE_STYLE.lineWidth,
      'line-opacity': THERMAL_COMFORT_SHADE_LINE_STYLE.lineOpacity,
      'line-blur': THERMAL_COMFORT_SHADE_LINE_STYLE.lineBlur,
    },
    layout: {
      'line-cap': THERMAL_COMFORT_SHADE_LINE_STYLE.lineCap,
      'line-join': THERMAL_COMFORT_SHADE_LINE_STYLE.lineJoin,
    },
  });
  map.setPaintProperty(THERMAL_COMFORT_SHADE_LAYER_ID, 'line-color', THERMAL_COMFORT_SHADE_LINE_STYLE.lineColor);
  map.setPaintProperty(THERMAL_COMFORT_SHADE_LAYER_ID, 'line-width', THERMAL_COMFORT_SHADE_LINE_STYLE.lineWidth);
  map.setPaintProperty(THERMAL_COMFORT_SHADE_LAYER_ID, 'line-opacity', THERMAL_COMFORT_SHADE_LINE_STYLE.lineOpacity);
  map.setPaintProperty(THERMAL_COMFORT_SHADE_LAYER_ID, 'line-blur', THERMAL_COMFORT_SHADE_LINE_STYLE.lineBlur);

  addLayerIfMissing(SECURITY_HEATMAP_ALERT_LAYER_ID, {
    id: SECURITY_HEATMAP_ALERT_LAYER_ID,
    type: 'circle',
    source: SECURITY_HEATMAP_SOURCE_ID,
    filter: ['in', ['get', 'riskLevel'], ['literal', ['medium', 'high', 'critical']]],
    paint: {
      'circle-color': SECURITY_HEATMAP_ALERT_STYLE.circleColor as unknown as ExpressionSpecification,
      'circle-opacity': SECURITY_HEATMAP_ALERT_STYLE.circleOpacity as unknown as ExpressionSpecification,
      'circle-radius': SECURITY_HEATMAP_ALERT_STYLE.circleRadius as unknown as ExpressionSpecification,
      'circle-stroke-color': SECURITY_HEATMAP_ALERT_STYLE.circleStrokeColor,
      'circle-stroke-width': SECURITY_HEATMAP_ALERT_STYLE.circleStrokeWidth as unknown as ExpressionSpecification,
    },
  });
  addLayerIfMissing(SECURITY_HEATMAP_HITBOX_LAYER_ID, {
    id: SECURITY_HEATMAP_HITBOX_LAYER_ID,
    type: 'circle',
    source: SECURITY_HEATMAP_SOURCE_ID,
    paint: {
      'circle-color': primary,
      'circle-opacity': 0.01,
      'circle-radius': 28,
    },
  });
};
