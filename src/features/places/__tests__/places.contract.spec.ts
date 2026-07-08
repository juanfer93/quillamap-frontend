import {
  PLACE_CATEGORY_VISUALS,
  PLACES_VISUAL_IDENTITY,
  canOpenPlaceDetails,
  getPlaceCategoryVisual,
  toPlacesNavigationMode,
} from '@/types/contracts/places.contract';

describe('places contract RF5', () => {
  it('allows multimedia cards in walking/tourist modes and blocks driving modes', () => {
    expect(canOpenPlaceDetails('turista')).toBe(true);
    expect(canOpenPlaceDetails('peaton')).toBe(true);
    expect(canOpenPlaceDetails('moto')).toBe(false);
    expect(canOpenPlaceDetails('carro')).toBe(false);
  });

  it('maps QuillaMap modes to the persisted navigation contract', () => {
    expect(toPlacesNavigationMode('tourist')).toBe('turista');
    expect(toPlacesNavigationMode('pedestrian')).toBe('peaton');
    expect(toPlacesNavigationMode('motorcycle')).toBe('moto');
    expect(toPlacesNavigationMode('car')).toBe('carro');
  });

  it('publishes the required zero-cost places visual identity', () => {
    expect(PLACES_VISUAL_IDENTITY.sharkBlue).toEqual({
      token: 'shark-blue',
      hex: '#004574',
    });
    expect(PLACES_VISUAL_IDENTITY.sandGold).toEqual({
      token: 'sand-gold',
      hex: '#D4AF37',
    });
  });

  it('publishes semantic Waze-like category icons through the shared contract', () => {
    expect(getPlaceCategoryVisual('comida')).toMatchObject({
      iconName: 'restaurant-outline',
      iconGlyph: '\u{1F374}',
    });
    expect(getPlaceCategoryVisual('salud')).toMatchObject({
      iconName: 'medkit-outline',
      iconGlyph: '\u271A',
    });
    expect(getPlaceCategoryVisual('transporte')).toMatchObject({
      iconName: 'bus-outline',
      iconGlyph: '\u{1F68C}',
    });
    expect(Object.keys(PLACE_CATEGORY_VISUALS).sort()).toEqual([
      'comida',
      'compras',
      'salud',
      'servicios',
      'transporte',
    ]);
  });
});
