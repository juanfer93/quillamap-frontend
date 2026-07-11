import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import NavigationMapController from '../components/NavigationMapController';
import { useNavigationStore } from '../store/useNavigationStore';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';
import type { RouteRequest, RouteResponse } from '@/types/contracts/navigation.contract';

let mockSpeedKmh = 0;
const mockCalculateRoute = jest.fn<Promise<RouteResponse>, [RouteRequest]>();

jest.mock('../hooks/useVelocityGuard', () => ({
  useVelocityGuard: () => ({ speedKmh: mockSpeedKmh }),
}));

jest.mock('@/api/client', () => ({
  navigationApi: {
    calculateRoute: (request: RouteRequest) => mockCalculateRoute(request),
  },
}));

jest.mock('@/components/maps/QuillaMap', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Pressable: MockPressable, View: MockView } = jest.requireActual('react-native');

  return ({
    children,
    destinationCoordinate,
    navigationControl,
    routePoints,
  }: {
    children?: React.ReactNode;
    destinationCoordinate?: unknown;
    navigationControl?: { isActive: boolean; onPress: () => void };
    routePoints?: unknown[];
  }) => ReactMock.createElement(
    MockView,
    {
      testID: 'mock-quillamap',
      destinationCoordinate,
      routePoints,
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
};

describe('NavigationMapController', () => {
  beforeEach(() => {
    mockSpeedKmh = 0;
    mockCalculateRoute.mockReset();
    mockCalculateRoute.mockResolvedValue(routeResponse);
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
      'Selecciona un destino valido o usa coordenadas lat,lng'
    );
  });
});
