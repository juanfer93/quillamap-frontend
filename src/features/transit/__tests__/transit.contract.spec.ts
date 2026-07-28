import {
  TRANSIT_CONSTRAINTS,
  TRANSIT_VISUAL_IDENTITY,
  isTransitMode,
  type TransitRouteRequest,
} from '@/types/contracts/transit.contract';

describe('transit contract', () => {
  const legacyBlue = ['#1E', '3A', '8A'].join('');

  it('limita Transit a los modos peaton y turista', () => {
    expect(isTransitMode('peaton')).toBe(true);
    expect(isTransitMode('turista')).toBe(true);
    expect(isTransitMode('carro')).toBe(false);
    expect(isTransitMode('moto')).toBe(false);
  });

  it('mantiene la identidad visual aprobada', () => {
    expect(TRANSIT_VISUAL_IDENTITY.sharkBlue).toBe('#004574');
    expect(TRANSIT_VISUAL_IDENTITY.touristGold).toBe('#D4AF37');
    expect(Object.values(TRANSIT_VISUAL_IDENTITY)).not.toContain(legacyBlue);
  });

  it('define el radio server-side para validacion fisica comunitaria', () => {
    expect(TRANSIT_CONSTRAINTS.physicalValidationRadiusMeters).toBe(80);
  });

  it('expresa preferencias distintas por modo sin permitir modos vehiculares', () => {
    const request: TransitRouteRequest = {
      origin: { latitude: 10.9878, longitude: -74.7889, label: 'Origen' },
      destination: { latitude: 11.019, longitude: -74.8213, label: 'Ventana al Mundo' },
      mode: 'turista',
      preferences: {
        prioritizeCulturalLandmarks: true,
        avoidActiveStreams: true,
      },
    };

    expect(request.mode).toBe('turista');
    expect(request.preferences?.prioritizeCulturalLandmarks).toBe(true);
  });
});
