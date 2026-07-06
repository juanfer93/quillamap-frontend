export const PLACE_CATEGORY_VALUES = [
  'servicios',
  'transporte',
  'comida',
  'compras',
  'salud',
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORY_VALUES)[number];

export type PlaceSource = 'place' | 'tourist_site';

export type PlacesNavigationMode = 'turista' | 'peaton' | 'carro' | 'moto';

export interface BilingualText {
  es: string;
  en?: string;
}

export interface PlaceOpeningHours {
  es: string;
  en?: string;
}

export interface GeoJsonPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface GeoJsonPolygon {
  type: 'Polygon';
  coordinates: [Array<[number, number]>];
}

export interface PlaceMetadata {
  history?: BilingualText;
  openingHours?: PlaceOpeningHours;
  photos?: string[];
  websiteUrl?: string;
  address?: string;
  buildingHeightMeters?: number;
  extrusionBaseMeters?: number;
  polygon?: GeoJsonPolygon;
}

export interface PlaceContract {
  id: string;
  name: BilingualText;
  description?: BilingualText;
  category: PlaceCategory;
  source: PlaceSource;
  location: GeoJsonPoint;
  metadata?: PlaceMetadata;
}

export interface PlacesNearbyQuery {
  lat: number;
  lng: number;
  radius?: number;
  category?: PlaceCategory;
}

export interface PlaceMapFeature extends PlaceContract {
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

export const toPlacesNavigationMode = (mode: 'tourist' | 'pedestrian' | 'car' | 'motorcycle'): PlacesNavigationMode => {
  if (mode === 'tourist') return 'turista';
  if (mode === 'pedestrian') return 'peaton';
  if (mode === 'motorcycle') return 'moto';
  return 'carro';
};

export const canOpenPlaceDetails = (navigationMode: PlacesNavigationMode): boolean =>
  navigationMode === 'turista';
