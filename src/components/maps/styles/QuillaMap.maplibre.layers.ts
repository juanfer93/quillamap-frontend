import { NAVIGATION_VISUAL_IDENTITY } from '@/types/contracts/navigation.contract';

export const SHADE_MARKER_EMOJI = '\u2602';
export const REPORT_ARROYO_MARKER_EMOJI = '\u{1F30A}';
export const REPORT_BACHE_MARKER_EMOJI = '\u{1F4A5}';
export const DESTINATION_MARKER_EMOJI = '\u25CE';
export const NAVIGATION_ARROW_MARKER = '\u25B2';
export const MAP_3D_PITCH = 62;

export const REPORT_MARKER_SOURCE_ID = 'report-marker-source';
export const REPORT_MARKER_LAYER_ID = 'report-marker';
export const NAVIGATION_ROUTE_SOURCE_ID = 'route-source';
export const NAVIGATION_ROUTE_HALO_LAYER_ID = 'route-line-halo';
export const NAVIGATION_ROUTE_LAYER_ID = 'route-line';
export const NAVIGATION_SHADE_ROUTE_SOURCE_ID = 'route-shade-source';
export const NAVIGATION_SHADE_ROUTE_HALO_LAYER_ID = 'route-shade-halo';
export const NAVIGATION_DESTINATION_SOURCE_ID = 'navigation-destination-source';
export const NAVIGATION_DESTINATION_LAYER_ID = 'navigation-destination-marker';
export const NAVIGATION_ARROW_SOURCE_ID = 'navigation-arrow-source';
export const NAVIGATION_ARROW_LAYER_ID = 'navigation-arrow-marker';
export const THERMAL_COMFORT_SHADE_SOURCE_ID = 'thermal-comfort-shade-source';
export const THERMAL_COMFORT_SHADE_HALO_LAYER_ID = 'thermal-comfort-shade-halo';
export const THERMAL_COMFORT_SHADE_LAYER_ID = 'thermal-comfort-shade-line';
export const SECURITY_HEATMAP_SOURCE_ID = 'security-heatmap-source';
export const SECURITY_HEATMAP_LAYER_ID = 'security-heatmap-layer';
export const SECURITY_HEATMAP_ALERT_LAYER_ID = 'security-heatmap-alerts';
export const SECURITY_HEATMAP_HITBOX_LAYER_ID = 'security-heatmap-hitbox';
export const USER_LOCATION_SOURCE_ID = 'user-location-source';
export const USER_LOCATION_LAYER_ID = 'user-location-dot';
export const TRANSIT_ROUTE_SOURCE_ID = 'transit-route-source';
export const TRANSIT_ROUTE_LAYER_ID = 'transit-route-line';
export const TRANSIT_ROUTE_HALO_LAYER_ID = 'transit-route-line-halo';
export const TRANSIT_STOP_SOURCE_ID = 'transit-stop-source';
export const TRANSIT_STOP_LAYER_ID = 'transit-stop-dot';

export const NAVIGATION_ROUTE_LINE_STYLE = {
  lineColor: NAVIGATION_VISUAL_IDENTITY.activeRoute,
  haloColor: '#FFFFFF',
  haloOpacity: 0.92,
  haloWidth: 12,
  lineWidth: 7,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
};

export const NAVIGATION_SHADE_ROUTE_LINE_STYLE = {
  lineColor: '#8EDFA5',
  lineOpacity: 0.62,
  lineWidth: 17,
  lineBlur: 1.4,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
};

export const THERMAL_COMFORT_SHADE_LINE_STYLE = {
  haloColor: '#FFFFFF',
  haloOpacity: 0.9,
  haloWidth: 20,
  lineColor: '#2FBF71',
  lineOpacity: 0.96,
  lineWidth: 12,
  lineBlur: 0.4,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
};

export const TRANSIT_ROUTE_LINE_STYLE = {
  haloColor: '#FFFFFF',
  haloOpacity: 0.72,
  haloWidth: 5,
  lineOpacity: 0.84,
  lineWidth: 3,
  lineCap: 'round' as const,
  lineJoin: 'round' as const,
};

export const SECURITY_HEATMAP_STYLE = {
  heatmapOpacity: ['interpolate', ['linear'], ['zoom'], 10, 0.28, 12, 0.52, 15, 0.8, 18, 0.66],
  heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 11, 0.92, 15, 1.28, 18, 1.42],
  heatmapRadius: [
    'interpolate',
    ['linear'],
    ['zoom'],
    10,
    ['interpolate', ['linear'], ['get', 'intensity'], 0, 8, 1, 18],
    14,
    ['interpolate', ['linear'], ['get', 'intensity'], 0, 18, 1, 38],
    18,
    ['interpolate', ['linear'], ['get', 'intensity'], 0, 28, 1, 58],
  ],
  heatmapWeight: ['interpolate', ['linear'], ['get', 'heatmapWeight'], 0, 0, 0.5, 0.75, 1, 1.25, 2, 1.8],
  heatmapColor: [
    'interpolate',
    ['linear'],
    ['heatmap-density'],
    0,
    'rgba(0, 69, 116, 0)',
    0.18,
    'rgba(125, 190, 220, 0.55)',
    0.42,
    'rgba(255, 183, 77, 0.78)',
    0.72,
    'rgba(249, 115, 22, 0.88)',
    1,
    'rgba(220, 38, 38, 0.94)',
  ],
} as const;

export const SECURITY_HEATMAP_ALERT_STYLE = {
  circleColor: ['match', ['get', 'riskLevel'], 'critical', '#991B1B', 'high', '#DC2626', 'medium', '#F97316', '#004574'],
  circleOpacity: [
    'case',
    ['==', ['get', 'isDrivingLock'], true],
    ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.58, 1, 0.94],
    ['interpolate', ['linear'], ['get', 'intensity'], 0, 0.3, 1, 0.6],
  ],
  circleRadius: [
    'interpolate',
    ['linear'],
    ['zoom'],
    0,
    ['interpolate', ['linear'], ['get', 'intensity'], 0, 26, 1, 62],
    8,
    ['interpolate', ['linear'], ['get', 'intensity'], 0, 20, 1, 46],
    12,
    ['interpolate', ['linear'], ['get', 'intensity'], 0, 14, 1, 34],
    16,
    ['interpolate', ['linear'], ['get', 'intensity'], 0, 9, 1, 22],
    20,
    ['interpolate', ['linear'], ['get', 'intensity'], 0, 6, 1, 15],
  ],
  circleStrokeColor: '#FFFFFF',
  circleStrokeWidth: ['case', ['==', ['get', 'riskLevel'], 'critical'], 3, 2],
} as const;
