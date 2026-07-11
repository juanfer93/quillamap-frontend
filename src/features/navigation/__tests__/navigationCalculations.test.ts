import {
  INFINITE_ROUTE_PENALTY_SECONDS,
  calculateDistanceMeters,
  calculateRouteDistanceMeters,
  getRiskPenaltySeconds,
  penalizeRouteCandidate,
} from '../utils/navigationCalculations';
import type { RouteResponse, RouteRiskMatch } from '@/types/contracts/navigation.contract';

const estadioMetropolitano = { latitude: 10.926, longitude: -74.8006 };
const ventanaAlMundo = { latitude: 11.019, longitude: -74.8213 };

describe('navigationCalculations', () => {
  it('calcula distancia haversine entre dos puntos de Barranquilla', () => {
    const distance = calculateDistanceMeters(estadioMetropolitano, ventanaAlMundo);

    expect(distance).toBeGreaterThan(10_000);
    expect(distance).toBeLessThan(11_000);
  });

  it('suma la distancia de una ruta por segmentos', () => {
    const distance = calculateRouteDistanceMeters([
      estadioMetropolitano,
      { latitude: 10.98, longitude: -74.81 },
      ventanaAlMundo,
    ]);

    expect(distance).toBeGreaterThan(calculateDistanceMeters(estadioMetropolitano, ventanaAlMundo));
  });

  it('aplica penalizacion infinita cuando la ruta cruza riesgos activos', () => {
    const matches: RouteRiskMatch[] = [
      { id: 'arroyo-84', type: 'arroyo_activo', routeIntersects: true },
    ];

    expect(getRiskPenaltySeconds(matches)).toBe(INFINITE_ROUTE_PENALTY_SECONDS);
  });

  it('marca bloqueada una ruta con restriccion legal de placa', () => {
    const route: RouteResponse = {
      geometry: [estadioMetropolitano, ventanaAlMundo],
      distanceMeters: 10_500,
      durationSeconds: 1_200,
      alerts: [],
      provider: 'osrm',
      legalStatus: 'allowed',
    };
    const matches: RouteRiskMatch[] = [
      { id: 'pyp-5', type: 'pico_y_placa', routeIntersects: true, legalBlock: true },
    ];

    expect(penalizeRouteCandidate(route, matches)).toEqual({
      route,
      totalPenaltySeconds: INFINITE_ROUTE_PENALTY_SECONDS,
      isBlocked: true,
    });
  });
});
