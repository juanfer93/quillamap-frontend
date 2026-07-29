import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import NavigationMapController from '../components/NavigationMapController';
import { useNavigationStore } from '../store/useNavigationStore';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { RouteRequest, RouteResponse } from '@/types/contracts/navigation.contract';
import type { TransitRouteRequest, TransitRouteResponse } from '@/types/contracts/transit.contract';

jest.setTimeout(15000);

let mockSpeedKmh = 0;
const mockCalculateRoute = jest.fn<Promise<RouteResponse>, [RouteRequest]>();
const mockCalculateTransitItineraries = jest.fn<Promise<TransitRouteResponse>, [TransitRouteRequest]>();

jest.mock('../hooks/useVelocityGuard', () => ({
  useVelocityGuard: () => ({ speedKmh: mockSpeedKmh }),
}));

jest.mock('@/api/client', () => ({
  navigationApi: {
    calculateRoute: (request: RouteRequest) => mockCalculateRoute(request),
  },
  transitApi: {
    calculateItineraries: (request: TransitRouteRequest) => mockCalculateTransitItineraries(request),
  },
}));

jest.mock('@/components/maps/QuillaMap', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Pressable: MockPressable, View: MockView } = jest.requireActual('react-native');

  return ({
    children,
    destinationCoordinate,
    navigationControl,
    profileTools,
    routePoints,
    shadeRouteSegments,
  }: {
    children?: React.ReactNode;
    destinationCoordinate?: unknown;
    navigationControl?: {
      hasActiveRoute?: boolean;
      isActive: boolean;
      onCancel?: () => void;
      onPress: () => void;
    };
    profileTools?: React.ReactNode;
    routePoints?: unknown[];
    shadeRouteSegments?: unknown[];
  }) => ReactMock.createElement(
    MockView,
    {
      testID: 'mock-quillamap',
      destinationCoordinate,
      routePoints,
      shadeRouteSegments,
    },
    ReactMock.createElement(
      MockPressable,
      {
        testID: 'quillamap-navigation-tab',
        isActive: navigationControl?.isActive,
        onPress: navigationControl?.onPress,
      },
      null
    ),
    ReactMock.createElement(
      MockPressable,
      {
        testID: 'quillamap-navigation-cancel',
        hasActiveRoute: navigationControl?.hasActiveRoute,
        onPress: navigationControl?.onCancel,
      },
      null
    ),
    profileTools,
    children
  );
});

const center = { latitude: 10.9878, longitude: -74.7889 };

const places: PlaceMapFeature[] = [
  {
    id: 'ventana',
    source: 'tourist_site',
    category: 'servicios',
    name: { es: 'Ventana al Mundo' },
    location: { type: 'Point', coordinates: [-74.8213, 11.019] },
    coordinate: { latitude: 11.019, longitude: -74.8213 },
  },
];

const routeResponse: RouteResponse = {
  geometry: [center, places[0].coordinate],
  distanceMeters: 3500,
  durationSeconds: 620,
  alerts: [],
  provider: 'osrm',
  legalStatus: 'allowed',
  shadeSegments: [
    {
      id: 'green-coverage-1',
      source: 'green_coverage',
      geometry: [center, places[0].coordinate],
    },
  ],
};

const transitRouteResponse: TransitRouteResponse = {
  generatedAtIso: '2026-07-22T00:00:00.000Z',
  sourceSnapshots: [],
  itineraries: [
    {
      id: 'itinerary-1',
      mode: 'peaton',
      distanceMeters: 2800,
      durationSeconds: 960,
      transfers: 1,
      riskStatus: 'clear',
      sourceVersion: 'test-gtfs',
      recalculatedForRisk: false,
      alerts: [],
      legs: [
        {
          id: 'walk-1',
          type: 'walk',
          geometry: [center, { latitude: 10.99, longitude: -74.79 }],
          distanceMeters: 250,
          durationSeconds: 240,
          from: center,
          to: { latitude: 10.99, longitude: -74.79, label: 'Paradero' },
        },
        {
          id: 'bus-1',
          type: 'bus',
          geometry: [{ latitude: 10.99, longitude: -74.79 }, places[0].coordinate],
          distanceMeters: 2550,
          durationSeconds: 720,
          from: { latitude: 10.99, longitude: -74.79, label: 'Paradero' },
          to: places[0].coordinate,
          routeId: 'route-coochofal-c2',
          routeShortName: 'C2-4133',
          agencyKind: 'colectivo',
        },
      ],
    },
  ],
};

describe('NavigationMapController', () => {
  beforeEach(() => {
    mockSpeedKmh = 0;
    mockCalculateRoute.mockReset();
    mockCalculateTransitItineraries.mockReset();
    mockCalculateRoute.mockResolvedValue(routeResponse);
    mockCalculateTransitItineraries.mockResolvedValue(transitRouteResponse);
    useNavigationStore.getState().clearRoute();
  });

  it('establece destino, pinta ruta y bloquea busqueda al superar 15 km/h', async () => {
    mockSpeedKmh = 22;
    const { getByTestId, queryByTestId } = render(
      <NavigationMapController
        mode="car"
        center={center}
        places={places}
        licensePlate="ABC123"
      >
        <Text>Mapa listo</Text>
      </NavigationMapController>
    );

    fireEvent.press(getByTestId('quillamap-navigation-tab'));
    fireEvent.changeText(getByTestId('navigation-destination-input'), 'Ventana');
    expect(getByTestId('navigation-suggestion-ventana')).toBeTruthy();
    fireEvent.press(getByTestId('navigation-route-submit'));

    await waitFor(() => {
      expect(mockCalculateRoute).toHaveBeenCalledWith(expect.objectContaining({
        mode: 'carro',
        licensePlate: 'ABC123',
        destination: expect.objectContaining({ label: 'Ventana al Mundo' }),
      }));
    });

    await waitFor(() => {
      expect(getByTestId('mock-quillamap').props.routePoints).toHaveLength(2);
      expect(getByTestId('mock-quillamap').props.destinationCoordinate).toMatchObject(places[0].coordinate);
      expect(getByTestId('navigation-driving-lock')).toBeTruthy();
      expect(queryByTestId('navigation-search-panel')).toBeNull();
    });

    fireEvent.press(getByTestId('navigation-copilot-toggle'));

    expect(getByTestId('navigation-search-panel')).toBeTruthy();
    expect(getByTestId('navigation-copilot-active')).toBeTruthy();
  });

  it('muestra error cuando el destino no existe', () => {
    const { getByTestId } = render(
      <NavigationMapController mode="pedestrian" center={center} places={places} />
    );

    fireEvent.press(getByTestId('quillamap-navigation-tab'));
    fireEvent.changeText(getByTestId('navigation-destination-input'), 'Destino inventado');
    fireEvent.press(getByTestId('navigation-route-submit'));

    expect(getByTestId('navigation-route-error').props.children).toBe(
      'Busca y selecciona un destino disponible.'
    );
  });

  it('calcula ruta peatonal GPS por nombre sin mezclar la ruta fresca', async () => {
    const { getByTestId, queryByTestId } = render(
      <NavigationMapController
        mode="pedestrian"
        center={center}
        places={places}
      />
    );

    fireEvent.press(getByTestId('quillamap-navigation-tab'));
    fireEvent.changeText(getByTestId('navigation-destination-input'), 'ventana mundo');
    fireEvent.press(getByTestId('navigation-route-submit'));

    await waitFor(() => {
      expect(mockCalculateRoute).toHaveBeenCalledWith(expect.objectContaining({
        mode: 'peaton',
        destination: expect.objectContaining({ label: 'Ventana al Mundo' }),
        preferences: expect.objectContaining({
          prioritizeShade: false,
        }),
      }));
    });
    expect(mockCalculateTransitItineraries).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(getByTestId('mock-quillamap').props.routePoints).toHaveLength(2);
      expect(getByTestId('mock-quillamap').props.shadeRouteSegments).toHaveLength(1);
      expect(getByTestId('quillamap-navigation-cancel').props.hasActiveRoute).toBe(true);
      expect(queryByTestId('navigation-transit-best-route')).toBeNull();
    });

    fireEvent.press(getByTestId('quillamap-navigation-cancel'));

    await waitFor(() => {
      expect(getByTestId('mock-quillamap').props.routePoints).toBeUndefined();
      expect(getByTestId('mock-quillamap').props.destinationCoordinate).toBeNull();
      expect(queryByTestId('navigation-search-panel')).toBeNull();
    });
  });
});
