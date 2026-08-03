import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import PublicTransportScreen from '../screens/PublicTransportScreen';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type {
  TransitBusSuggestionsResponse,
  TransitMapResponse,
  TransitRouteRequest,
  TransitTransmetroSuggestionsResponse,
} from '@/types/contracts/transit.contract';

const mockGoBack = jest.fn();
const mockGetRouteMap = jest.fn<Promise<TransitMapResponse>, []>();
const mockGetBusSuggestions = jest.fn<Promise<TransitBusSuggestionsResponse>, [TransitRouteRequest]>();
const mockGetTransmetroSuggestions = jest.fn<Promise<TransitTransmetroSuggestionsResponse>, [TransitRouteRequest]>();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
}));

jest.mock('@/features/navigation/hooks/useLocationPermissions', () => ({
  useLocationPermissions: () => ({
    currentLocation: { latitude: 10.9878, longitude: -74.7889 },
  }),
}));

const places: PlaceMapFeature[] = [
  {
    id: 'ventana',
    source: 'tourist_site',
    category: 'servicios',
    name: { es: 'Ventana al Mundo' },
    location: { type: 'Point', coordinates: [-74.8213, 11.019] },
    coordinate: { latitude: 11.019, longitude: -74.8213 },
  },
  {
    id: 'villa-carolina',
    source: 'place',
    category: 'servicios',
    name: { es: 'Villa Carolina' },
    location: { type: 'Point', coordinates: [-74.796, 11.0195] },
    coordinate: { latitude: 11.0195, longitude: -74.796 },
  },
];

jest.mock('@/features/places/hooks/usePlaces', () => ({
  usePlaces: () => ({ places }),
}));

jest.mock('@/api', () => ({
  transitApi: {
    getRouteMap: () => mockGetRouteMap(),
    getBusSuggestions: (request: TransitRouteRequest) => mockGetBusSuggestions(request),
    getTransmetroSuggestions: (request: TransitRouteRequest) => mockGetTransmetroSuggestions(request),
  },
}));

jest.mock('@/components/maps/QuillaMap', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { View: MockView } = jest.requireActual('react-native');

  return ({
    children,
    transitMap,
    showCompassControl,
    showZoomControl,
  }: {
    children?: React.ReactNode;
    transitMap?: unknown;
    showCompassControl?: boolean;
    showZoomControl?: boolean;
  }) => ReactMock.createElement(
    MockView,
    { testID: 'mock-quillamap', transitMap, showCompassControl, showZoomControl },
    children
  );
});

const transitMapResponse: TransitMapResponse = {
  type: 'FeatureCollection',
  generatedAtIso: '2026-07-22T00:00:00.000Z',
  features: [
    {
      type: 'Feature',
      id: 'shape-coochofal-c2',
      properties: {
        id: 'shape-coochofal-c2',
        kind: 'route',
        routeId: 'route-coochofal-c2',
        shortName: 'C2-4133',
        longName: 'Coochofal C2-4133',
        agencyKind: 'colectivo',
        operatorName: 'COOCHOFAL',
        sourceKind: 'osm_overpass',
        color: '#0077A3',
        streets: ['Carrera 38', 'Calle 50', 'Calle 43'],
      },
      geometry: {
        type: 'LineString',
        coordinates: [[-74.79, 10.99], [-74.795, 10.995], [-74.8, 11]],
      },
    },
    {
      type: 'Feature',
      id: 'shape-transmetro-b1',
      properties: {
        id: 'shape-transmetro-b1',
        kind: 'route',
        routeId: 'route-transmetro-b1',
        shortName: 'B1',
        longName: 'Transmetro B1',
        agencyKind: 'transmetro',
        operatorName: 'Transmetro',
        sourceKind: 'osm_overpass',
        color: '#004574',
        streets: ['Troncal Murillo'],
      },
      geometry: {
        type: 'LineString',
        coordinates: [[-74.78, 10.98], [-74.795, 10.995], [-74.81, 11.01]],
      },
    },
  ],
};

const busSuggestionsResponse: TransitBusSuggestionsResponse = {
  puntoA: { ...places[1].coordinate, label: 'Villa Carolina' },
  puntoB: { ...places[0].coordinate, label: 'Ventana al Mundo' },
  origin: { ...places[1].coordinate, label: 'Villa Carolina' },
  destination: { ...places[0].coordinate, label: 'Ventana al Mundo' },
  searchRadiusMeters: 900,
  generatedAtIso: '2026-07-28T00:00:00.000Z',
  coverage: { hasSuggestions: true },
  suggestions: [],
  rutasPosibles: [
    {
      optionNumber: 1,
      title: 'Opcion 1: C2-4133 - COOCHOFAL',
      route: {
        id: 'route-coochofal-c2',
        shortName: 'C2-4133',
        longName: 'Coochofal C2-4133',
        agencyKind: 'colectivo',
        operatorName: 'COOCHOFAL',
        sourceKind: 'osm_overpass',
        isCurrentlyOperating: true,
        operatingCondition: 'always',
      },
      shapeId: 'shape-coochofal-c2',
      totalDistanceMeters: 2400,
      totalWalkMeters: 300,
      busDistanceMeters: 2100,
      durationSeconds: 780,
      walkDurationSeconds: 240,
      busDurationSeconds: 540,
      originWalkMeters: 120,
      destinationWalkMeters: 180,
      boardingPoint: { latitude: 10.99, longitude: -74.79, label: 'Subir a C2-4133' },
      alightingPoint: { latitude: 11, longitude: -74.8, label: 'Bajarse de C2-4133' },
      routeStreets: ['Carrera 38', 'Calle 50'],
      directionConfidence: 'shape_order',
      steps: [],
      seleccion: {
        summary: 'C2-4133 de COOCHOFAL: 13 min aprox, 2.40 km.',
        pasos: [
          {
            type: 'walk_to_boarding',
            instruction: 'Camina hasta Subir a C2-4133.',
            from: { ...places[1].coordinate, label: 'Villa Carolina' },
            to: { latitude: 10.99, longitude: -74.79, label: 'Subir a C2-4133' },
            distanceMeters: 120,
          },
          {
            type: 'board_bus',
            instruction: 'Coge el bus C2-4133 ahi.',
            place: { latitude: 10.99, longitude: -74.79, label: 'Subir a C2-4133' },
          },
          {
            type: 'alight_bus',
            instruction: 'Bajate en Bajarse de C2-4133.',
            place: { latitude: 11, longitude: -74.8, label: 'Bajarse de C2-4133' },
          },
          {
            type: 'walk_to_destination',
            instruction: 'Camina desde Bajarse de C2-4133 hasta Ventana al Mundo.',
            from: { latitude: 11, longitude: -74.8, label: 'Bajarse de C2-4133' },
            to: { ...places[0].coordinate, label: 'Ventana al Mundo' },
            distanceMeters: 180,
          },
        ],
      },
      notes: [],
    },
  ],
};

busSuggestionsResponse.suggestions = busSuggestionsResponse.rutasPosibles;

const transmetroSuggestionsResponse: TransitTransmetroSuggestionsResponse = {
  puntoA: { ...places[1].coordinate, label: 'Villa Carolina' },
  puntoB: { ...places[0].coordinate, label: 'Ventana al Mundo' },
  seccion: 'transmetro',
  searchRadiusMeters: 900,
  generatedAtIso: '2026-07-28T00:00:00.000Z',
  coverage: { hasSuggestions: true },
  rutasPosibles: [
    {
      optionNumber: 1,
      title: 'Opcion 1: A8-1 + B1',
      totalDistanceMeters: 3600,
      totalWalkMeters: 260,
      transitDistanceMeters: 3340,
      durationSeconds: 1100,
      walkDurationSeconds: 240,
      transitDurationSeconds: 860,
      originWalkMeters: 100,
      destinationWalkMeters: 160,
      transferWalkMeters: 0,
      feederService: {
        id: 'route-transmetro-a8',
        shortName: 'A8-1',
        longName: 'Alimentador Villa Carolina',
        agencyKind: 'transmetro',
        operatorName: 'Transmetro',
        sourceKind: 'osm_overpass',
        isCurrentlyOperating: true,
        operatingCondition: 'always',
      },
      trunkService: {
        id: 'route-transmetro-b1',
        shortName: 'B1',
        longName: 'Transmetro B1',
        agencyKind: 'transmetro',
        operatorName: 'Transmetro',
        sourceKind: 'osm_overpass',
        isCurrentlyOperating: true,
        operatingCondition: 'always',
      },
      boardingStop: { latitude: 10.98, longitude: -74.78, label: 'Paradero Villa Carolina' },
      transferStation: { latitude: 10.995, longitude: -74.795, label: 'Estacion Joe Arroyo' },
      destinationStation: { latitude: 11.01, longitude: -74.81, label: 'Estacion Estadio' },
      seleccion: {
        summary: 'A8-1 + B1: 18 min aprox, 3.60 km.',
        pasos: [
          {
            type: 'board_feeder',
            instruction: 'Coge el servicio A8-1 ahi.',
            serviceShortName: 'A8-1',
            place: { latitude: 10.98, longitude: -74.78, label: 'Paradero Villa Carolina' },
          },
          {
            type: 'board_trunk',
            instruction: 'Coge el servicio B1 en Estacion Joe Arroyo.',
            serviceShortName: 'B1',
            place: { latitude: 10.995, longitude: -74.795, label: 'Estacion Joe Arroyo' },
          },
        ],
      },
      notes: [],
    },
  ],
};

describe('PublicTransportScreen', () => {
  beforeEach(() => {
    mockGoBack.mockClear();
    mockGetRouteMap.mockReset();
    mockGetBusSuggestions.mockReset();
    mockGetTransmetroSuggestions.mockReset();
    mockGetRouteMap.mockResolvedValue(transitMapResponse);
    mockGetBusSuggestions.mockResolvedValue(busSuggestionsResponse);
    mockGetTransmetroSuggestions.mockResolvedValue(transmetroSuggestionsResponse);
  });

  it('muestra todas las rutas de buses en una vista propia del feature transit', async () => {
    const { getByTestId, queryByTestId } = render(<PublicTransportScreen />);

    expect(getByTestId('public-transport-screen')).toBeTruthy();
    expect(getByTestId('public-transport-panel')).toBeTruthy();
    expect(getByTestId('mock-quillamap').props.showCompassControl).toBe(false);
    expect(getByTestId('mock-quillamap').props.showZoomControl).toBe(false);

    await waitFor(() => {
      const transitMap = getByTestId('mock-quillamap').props.transitMap as TransitMapResponse;
      expect(transitMap.features).toHaveLength(1);
      expect(transitMap.features[0].properties.agencyKind).toBe('colectivo');
    });

    fireEvent.press(getByTestId('transit-route-route-coochofal-c2'));

    await waitFor(() => {
      const transitMap = getByTestId('mock-quillamap').props.transitMap as TransitMapResponse;
      expect(queryByTestId('public-transport-panel')).toBeNull();
      expect(getByTestId('public-transport-return-to-panel')).toBeTruthy();
      expect(transitMap.features).toHaveLength(1);
      expect(transitMap.features[0].properties.routeId).toBe('route-coochofal-c2');
      expect(getByTestId('mock-quillamap').props.showCompassControl).toBe(true);
      expect(getByTestId('mock-quillamap').props.showZoomControl).toBe(true);
    });

    fireEvent.press(getByTestId('public-transport-return-to-panel'));

    expect(getByTestId('public-transport-panel')).toBeTruthy();
  });

  it('busca que bus sirve y pinta la sugerencia seleccionada', async () => {
    const { getByTestId, queryByTestId } = render(<PublicTransportScreen />);

    fireEvent.press(getByTestId('public-transport-find-bus'));
    fireEvent.changeText(getByTestId('public-transport-find-bus-point-a-input'), 'Villa');
    fireEvent.press(getByTestId('public-transport-find-bus-point-a-suggestion-villa-carolina'));
    fireEvent.changeText(getByTestId('public-transport-find-bus-point-b-input'), 'Ventana');
    fireEvent.press(getByTestId('public-transport-find-bus-point-b-suggestion-ventana'));
    fireEvent.press(getByTestId('public-transport-find-bus-submit'));

    await waitFor(() => {
      expect(mockGetBusSuggestions).toHaveBeenCalledWith(expect.objectContaining({
        origin: expect.objectContaining({ label: 'Villa Carolina' }),
        destination: expect.objectContaining({ label: 'Ventana al Mundo' }),
        preferences: expect.objectContaining({ preferredAgencyKind: 'colectivo' }),
      }));
      expect(getByTestId('transit-suggestion-card-0')).toBeTruthy();
      expect(getByTestId('transit-suggestion-step-0').props.children).toContain('Camina hasta Subir a C2-4133.');
      expect(getByTestId('transit-suggestion-step-1').props.children).toContain('Coge el bus C2-4133 ahi.');
      expect(getByTestId('transit-suggestion-step-2').props.children).toContain('Bajate en Bajarse de C2-4133.');
      expect(getByTestId('transit-suggestion-step-3').props.children).toContain('Camina desde Bajarse de C2-4133 hasta Ventana al Mundo.');
    });

    fireEvent.press(getByTestId('transit-suggestion-card-0'));

    await waitFor(() => {
      const transitMap = getByTestId('mock-quillamap').props.transitMap as TransitMapResponse;
      expect(queryByTestId('public-transport-panel')).toBeNull();
      expect(getByTestId('public-transport-return-to-panel')).toBeTruthy();
      expect(getByTestId('public-transport-selected-steps')).toBeTruthy();
      expect(getByTestId('transit-suggestion-step-3').props.children).toContain('Camina desde Bajarse de C2-4133 hasta Ventana al Mundo.');
      expect(transitMap.features.some((feature) => feature.properties.kind === 'route')).toBe(true);
      expect(transitMap.features.some((feature) => feature.properties.kind === 'stop')).toBe(true);
    });
  });

  it('busca que Transmetro sirve sin combinarlo con bus', async () => {
    const { getByTestId } = render(<PublicTransportScreen />);

    fireEvent.press(getByTestId('public-transport-find-transmetro'));
    fireEvent.changeText(getByTestId('public-transport-find-transmetro-point-a-input'), 'Villa');
    fireEvent.press(getByTestId('public-transport-find-transmetro-point-a-suggestion-villa-carolina'));
    fireEvent.changeText(getByTestId('public-transport-find-transmetro-point-b-input'), 'Ventana');
    fireEvent.press(getByTestId('public-transport-find-transmetro-point-b-suggestion-ventana'));
    fireEvent.press(getByTestId('public-transport-find-transmetro-submit'));

    await waitFor(() => {
      expect(mockGetTransmetroSuggestions).toHaveBeenCalledWith(expect.objectContaining({
        preferences: expect.objectContaining({ preferredAgencyKind: 'transmetro' }),
      }));
      expect(getByTestId('transit-suggestion-card-0')).toBeTruthy();
    });
  });
});
