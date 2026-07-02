import React from 'react';
import { render } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';
import { useAuthStore, AuthUser } from '@/store/useAuthStore';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    reset: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Text } = jest.requireActual('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

jest.mock('@/features/pedestrian/hooks/useLocationPermissions', () => ({
  useLocationPermissions: () => ({
    permissionStatus: 'granted',
    currentLocation: null,
    isRequestingPermission: false,
    errorMessage: null,
  }),
}));

const pedestrianUser: AuthUser = {
  id: 'user-peaton',
  full_name: 'Paula Peaton',
  email: 'paula@quillamap.com',
  mobility_mode: 'peaton',
};

const carUser: AuthUser = {
  id: 'user-carro',
  full_name: 'Carlos Carro',
  email: 'carlos@quillamap.com',
  mobility_mode: 'carro',
};

describe('HomeScreen', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      session: null,
      isLoading: false,
    });
  });

  it('renderiza el Modo Peaton cuando inicia sesion un usuario peaton', () => {
    useAuthStore.setState({
      user: pedestrianUser,
      session: 'token-peaton',
      isLoading: false,
    });

    const { getByTestId } = render(<HomeScreen />);

    expect(getByTestId('pedestrian-map-container')).toBeTruthy();
    expect(getByTestId('pedestrian-logout-button')).toBeTruthy();
  });

  it('mantiene el home general para perfiles no peatonales', () => {
    useAuthStore.setState({
      user: carUser,
      session: 'token-carro',
      isLoading: false,
    });

    const { getByText, queryByTestId } = render(<HomeScreen />);

    expect(queryByTestId('pedestrian-map-container')).toBeNull();
    expect(getByText('Hola Carlos Carro, bienvenido a QuillaMap')).toBeTruthy();
  });

  it('mantiene el home general cuando el backend devuelve mobility_mode null', () => {
    useAuthStore.setState({
      user: {
        id: 'user-null',
        full_name: 'Usuario Sin Modo',
        email: 'sinmodo@quillamap.com',
        mobility_mode: null,
      },
      session: 'token-null',
      isLoading: false,
    });

    const { getByText, queryByTestId } = render(<HomeScreen />);

    expect(queryByTestId('pedestrian-map-container')).toBeNull();
    expect(getByText('Hola Usuario Sin Modo, bienvenido a QuillaMap')).toBeTruthy();
  });
});
