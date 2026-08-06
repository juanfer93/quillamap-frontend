import type { StyleSpecification } from 'maplibre-gl';
import { PLACES_VISUAL_IDENTITY } from '@/types/contracts/places.contract';

export const DARK_MAP_THEME = {
  background: '#1D2938',
  controlBackground: '#111B2A',
  controlBorder: '#4B607C',
  controlText: PLACES_VISUAL_IDENTITY.sandGold.hex,
};

export const MAPLIBRE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
};

export const DARK_MAPLIBRE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
  sources: {
    cartoDark: {
      type: 'raster',
      tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 20,
      attribution: 'OpenStreetMap contributors CARTO',
    },
  },
  layers: [
    {
      id: 'dark-background',
      type: 'background',
      paint: {
        'background-color': DARK_MAP_THEME.background,
      },
    },
    {
      id: 'carto-dark',
      type: 'raster',
      source: 'cartoDark',
      paint: {
        'raster-saturation': -0.12,
        'raster-contrast': 0.18,
        'raster-brightness-min': 0.34,
        'raster-brightness-max': 1,
        'raster-opacity': 1,
      },
    },
  ],
};

export const getMapLibreStyle = (themeMode: 'light' | 'dark' = 'light'): StyleSpecification =>
  themeMode === 'dark' ? DARK_MAPLIBRE_STYLE : MAPLIBRE_STYLE;
