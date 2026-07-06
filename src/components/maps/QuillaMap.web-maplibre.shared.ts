import maplibregl, { type Map as MapLibreMap } from 'maplibre-gl';
import tw from '@/lib/tailwind';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';

export const hasDom = () => typeof document !== 'undefined';

export const getMapColor = (name: string, fallback: string): string => {
  const value = tw.color(name);
  return typeof value === 'string' ? value : fallback;
};

export const getPlaceTitle = (place: PlaceMapFeature): string => place.name.es;

export const createPlaceMarkerElement = (
  testID: string,
  isTouristSite: boolean,
  color: string,
  label: string
): HTMLButtonElement => {
  const element = document.createElement('button');
  element.type = 'button';
  element.dataset.testid = testID;
  element.setAttribute('aria-label', label);
  Object.assign(element.style, {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: '#FFFFFF',
    border: `2px solid ${color}`,
    boxShadow: '0 8px 16px rgba(0, 69, 116, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color,
  });
  element.textContent = isTouristSite ? '◆' : '•';
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

  map.addSource(id, { type: 'geojson', data });
};
