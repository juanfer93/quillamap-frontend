import type { Map as MapLibreMap } from 'maplibre-gl';

export const renderWebShadeAreas = (
  map: MapLibreMap,
  isPedestrian: boolean,
  mapShade: string,
  primary: string
) => {
  if (!map.getLayer('shade-zone-areas')) {
    map.addLayer({
      id: 'shade-zone-areas',
      type: 'fill',
      source: 'shade-area-source',
      paint: { 'fill-color': mapShade, 'fill-opacity': isPedestrian ? 0 : 0.22 },
    });
  }

  if (!map.getLayer('shade-zone-area-outline')) {
    map.addLayer({
      id: 'shade-zone-area-outline',
      type: 'line',
      source: 'shade-area-source',
      paint: {
        'line-color': primary,
        'line-width': 2,
        'line-opacity': isPedestrian ? 0 : 0.9,
      },
    });
  }

  map.setPaintProperty('shade-zone-areas', 'fill-color', mapShade);
  map.setPaintProperty('shade-zone-areas', 'fill-opacity', isPedestrian ? 0 : 0.22);
  map.setPaintProperty('shade-zone-area-outline', 'line-color', primary);
  map.setPaintProperty('shade-zone-area-outline', 'line-opacity', isPedestrian ? 0 : 0.9);
};
