import {
  PLACES_VISUAL_IDENTITY,
  canOpenPlaceDetails,
  toPlacesNavigationMode,
} from '@/types/contracts/places.contract';

describe('places contract RF5', () => {
  it('allows multimedia cards only in tourist navigation mode', () => {
    expect(canOpenPlaceDetails('turista')).toBe(true);
    expect(canOpenPlaceDetails('peaton')).toBe(false);
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
});
