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

export type PlaceIconName =
  | 'restaurant-outline'
  | 'medkit-outline'
  | 'bus-outline'
  | 'cart-outline'
  | 'construct-outline'
  | 'business-outline'
  | 'location-outline';

export const PLACES_VISUAL_IDENTITY = {
  sharkBlue: {
    token: 'shark-blue',
    hex: '#004574',
  },
  sandGold: {
    token: 'sand-gold',
    hex: '#D4AF37',
  },
  white: {
    token: 'white',
    hex: '#FFFFFF',
  },
} as const;

export interface BilingualText {
  es: string;
  en?: string;
}

export interface PlaceCategoryVisual {
  iconName: PlaceIconName;
  iconGlyph: string;
  label: BilingualText;
}

export const PLACE_CATEGORY_VISUALS = {
  comida: {
    iconName: 'restaurant-outline',
    iconGlyph: '\u{1F374}',
    label: {
      es: 'Comida',
      en: 'Food',
    },
  },
  salud: {
    iconName: 'medkit-outline',
    iconGlyph: '\u271A',
    label: {
      es: 'Salud',
      en: 'Health',
    },
  },
  transporte: {
    iconName: 'bus-outline',
    iconGlyph: '\u{1F68C}',
    label: {
      es: 'Transporte',
      en: 'Transport',
    },
  },
  compras: {
    iconName: 'cart-outline',
    iconGlyph: '\u{1F6D2}',
    label: {
      es: 'Compras',
      en: 'Shopping',
    },
  },
  servicios: {
    iconName: 'construct-outline',
    iconGlyph: '\u2692',
    label: {
      es: 'Servicios',
      en: 'Services',
    },
  },
} as const satisfies Record<PlaceCategory, PlaceCategoryVisual>;

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
  iconName?: PlaceIconName;
  iconGlyph?: string;
  metadata?: PlaceMetadata;
}

export interface PlacesNearbyQuery {
  lat: number;
  lng: number;
  radius?: number;
  limit?: number;
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
  navigationMode === 'turista' || navigationMode === 'peaton';

export const getPlaceCategoryVisual = (category: PlaceCategory): PlaceCategoryVisual =>
  PLACE_CATEGORY_VISUALS[category];
