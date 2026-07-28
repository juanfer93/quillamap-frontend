import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../screens/HomeScreen';
import { useKarmaRewards } from '@/features/navigation/hooks/useKarmaRewards';
import { useAuthStore, AuthUser } from '@/store/useAuthStore';

const mockReset = jest.fn();
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
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

jest.mock('@/features/navigation/hooks/useLocationPermissions', () => ({
  useLocationPermissions: () => ({
    permissionStatus: 'granted',
    currentLocation: null,
    isRequestingPermission: false,
    errorMessage: null,
  }),
}));

jest.mock('@/api/client', () => ({
  reportsApi: {
    findNearby: jest.fn(() => new Promise(() => {})),
    create: jest.fn(),
  },
  placesApi: {
    findNearby: jest.fn().mockResolvedValue([]),
  },
}));

jest.mock('@/components/maps/QuillaMap', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Pressable, View } = jest.requireActual('react-native');

  return ({
    children,
    navigationControl,
    profileTools,
  }: {
    children?: React.ReactNode;
    navigationControl?: {
      hasActiveRoute?: boolean;
      isActive: boolean;
      onCancel?: () => void;
      onPress: () => void;
    };
    profileTools?: React.ReactNode;
  }) => ReactMock.createElement(
    View,
    { testID: 'mock-quillamap' },
    ReactMock.createElement(Pressable, {
      testID: 'quillamap-navigation-tab',
      onPress: navigationControl?.onPress,
    }),
    profileTools,
    children
  );
});

const pedestrianUser: AuthUser = {
  id: 'user-peaton',
  full_name: 'Paula Peaton',
  email: 'paula@quillamap.com',
  karma: 12,
  mobility_mode: 'peaton',
  vehicle_type: 'peaton',
};

const legacyPedestrianUser: AuthUser = {
  id: 'user-peaton-legacy',
  full_name: 'Pedro Peaton Legacy',
  email: 'legacy@quillamap.com',
  mobility_mode: 'peaton',
  vehicle_type: null,
};

const mismatchedPedestrianUser: AuthUser = {
  id: 'user-peaton-mismatch',
  full_name: 'Maria Peaton Mismatch',
  email: 'mismatch@quillamap.com',
  mobility_mode: 'peaton',
  vehicle_type: 'moto',
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
    useKarmaRewards.getState().resetKarma();
    mockReset.mockClear();
    mockNavigate.mockClear();
  });

  it('renderiza el Modo Peaton cuando inicia sesion un usuario peaton', () => {
    useAuthStore.setState({
      user: pedestrianUser,
      session: 'token-peaton',
      isLoading: false,
    });

    const { getByTestId } = render(<HomeScreen />);

    expect(getByTestId('pedestrian-map-container')).toBeTruthy();
    expect(getByTestId('user-tools-profile-button')).toBeTruthy();
  });

  it('muestra reportar sombra para peatones legacy sin vehicle_type persistido', () => {
    useAuthStore.setState({
      user: legacyPedestrianUser,
      session: 'token-peaton-legacy',
      isLoading: false,
    });

    const { getByTestId } = render(<HomeScreen />);

    fireEvent.press(getByTestId('user-tools-profile-button'));

    expect(getByTestId('user-tools-report-shadow')).toBeTruthy();
  });

  it('muestra reportar sombra cuando el mapa activo es peaton aunque vehicle_type venga desalineado', () => {
    useAuthStore.setState({
      user: mismatchedPedestrianUser,
      session: 'token-peaton-mismatch',
      isLoading: false,
    });

    const { getByTestId } = render(<HomeScreen />);

    fireEvent.press(getByTestId('user-tools-profile-button'));

    expect(getByTestId('user-tools-report-shadow')).toBeTruthy();
  });

  it('muestra el karma total del perfil y los puntos ganados en la sesion', () => {
    useAuthStore.setState({
      user: pedestrianUser,
      session: 'token-peaton',
      isLoading: false,
    });
    useKarmaRewards.setState({ karmaPoints: 6 });

    const { getByTestId } = render(<HomeScreen />);

    fireEvent.press(getByTestId('user-tools-profile-button'));

    expect(getByTestId('user-tools-karma-points').props.children).toBe(18);
  });

  it('renderiza el mapa de lugares para perfiles no peatonales', () => {
    useAuthStore.setState({
      user: carUser,
      session: 'token-carro',
      isLoading: false,
    });

    const { getByTestId, queryByText, queryByTestId } = render(<HomeScreen />);

    expect(queryByTestId('pedestrian-map-container')).toBeNull();
    expect(getByTestId('places-map-container')).toBeTruthy();
    expect(queryByText('Hola Carlos Carro, bienvenido a QuillaMap')).toBeNull();
  });

  it('abre la vista independiente de transporte publico desde el perfil', () => {
    useAuthStore.setState({
      user: pedestrianUser,
      session: 'token-peaton',
      isLoading: false,
    });

    const { getByTestId } = render(<HomeScreen />);

    fireEvent.press(getByTestId('user-tools-profile-button'));
    fireEvent.press(getByTestId('public-transport-toggle'));

    expect(mockNavigate).toHaveBeenCalledWith('PublicTransport');
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

  it('abre perfil, cierra sesion y redirige a Login', async () => {
    useAuthStore.setState({
      user: pedestrianUser,
      session: 'token-peaton',
      isLoading: false,
    });

    const { getByTestId } = render(<HomeScreen />);

    fireEvent.press(getByTestId('user-tools-profile-button'));
    fireEvent.press(getByTestId('user-tools-logout'));

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    });
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
