import type { TransitItinerary, TransitLeg } from '@/types/contracts/transit.contract';
import {
  countTransitTransfers,
  getTransitLegFeatureCollection,
  getTransitLegStyle,
  summarizeTransitItinerary,
} from '../utils/transitCalculations';

const origin = { latitude: 10.9878, longitude: -74.7889, label: 'Origen' };
const stop = { latitude: 10.99, longitude: -74.79, label: 'Paradero' };
const transferStop = { latitude: 11.0, longitude: -74.8, label: 'Transbordo' };
const destination = { latitude: 11.019, longitude: -74.8213, label: 'Destino' };

const legs: TransitLeg[] = [
  {
    id: 'walk-to-stop',
    type: 'walk',
    geometry: [origin, stop],
    distanceMeters: 320,
    durationSeconds: 260,
    from: origin,
    to: stop,
  },
  {
    id: 'bus-a1',
    type: 'bus',
    geometry: [stop, transferStop],
    distanceMeters: 2200,
    durationSeconds: 540,
    from: stop,
    to: transferStop,
    routeId: 'A1-2',
    routeShortName: 'A1-2',
    agencyKind: 'transmetro',
  },
  {
    id: 'bus-u30',
    type: 'bus',
    geometry: [transferStop, destination],
    distanceMeters: 1800,
    durationSeconds: 430,
    from: transferStop,
    to: destination,
    routeId: 'U-30',
    routeShortName: 'U-30',
    agencyKind: 'transmetro',
  },
];

const itinerary: TransitItinerary = {
  id: 'itinerary-1',
  mode: 'turista',
  legs,
  alerts: [],
  riskStatus: 'clear',
  distanceMeters: 4320,
  durationSeconds: 1230,
  transfers: 1,
  sourceVersion: 'quilla-gtfs-2026-07-22',
  recalculatedForRisk: false,
};

describe('transitCalculations', () => {
  it('calcula transbordos a partir de piernas en bus', () => {
    expect(countTransitTransfers(legs)).toBe(1);
  });

  it('diferencia visualmente caminata, bus y transbordo', () => {
    expect(getTransitLegStyle('walk')).toMatchObject({ lineColor: '#004574', lineDasharray: [2, 2] });
    expect(getTransitLegStyle('bus')).toMatchObject({ lineColor: '#0077A3', lineWidth: 6 });
    expect(getTransitLegStyle('transfer')).toMatchObject({ lineColor: '#D4AF37', lineDasharray: [1, 2] });
  });

  it('resume distancia, duracion y transbordos desde el itinerario', () => {
    expect(summarizeTransitItinerary(itinerary)).toEqual({
      distanceMeters: 4320,
      durationSeconds: 1230,
      transfers: 1,
    });
  });

  it('genera GeoJSON por pierna para MapLibre', () => {
    const featureCollection = getTransitLegFeatureCollection(itinerary);

    expect(featureCollection.features).toHaveLength(3);
    expect(featureCollection.features[0].properties).toMatchObject({
      type: 'walk',
      lineColor: '#004574',
      lineDasharray: [2, 2],
    });
    expect(featureCollection.features[1].geometry.coordinates[0]).toEqual([-74.79, 10.99]);
  });
});
