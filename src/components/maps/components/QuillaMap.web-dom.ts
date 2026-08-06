import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import tw from '@/lib/tailwind';
import { PLACES_VISUAL_IDENTITY } from '@/types/contracts/places.contract';
import { SHADE_MARKER_EMOJI } from '../styles/QuillaMap.maplibre';

const tokenColor = (name: string, fallback = ''): string => {
  const value = tw.color(name);
  return typeof value === 'string' ? value : fallback;
};

export const hasDom = () => typeof document !== 'undefined';

export const createShadowMarkerElement = (testID: string, color: string, label: string) => {
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

export const createSecurityMarkerElement = (testID: string, label: string, color = '#DC2626') => {
  const element = document.createElement('button');
  element.type = 'button';
  element.dataset.testid = testID;
  element.setAttribute('aria-label', label);
  element.style.width = '40px';
  element.style.height = '40px';
  element.style.padding = '0';
  element.style.borderRadius = '50%';
  element.style.background = color;
  element.style.border = `3px solid ${tokenColor(PLACES_VISUAL_IDENTITY.white.token, PLACES_VISUAL_IDENTITY.white.hex)}`;
  element.style.boxShadow = '0 6px 14px rgba(220, 38, 38, 0.35)';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
  element.style.cursor = 'pointer';
  return element;
};

export const upsertGeoJsonSource = (
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
