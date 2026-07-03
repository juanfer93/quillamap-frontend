import { renderHook, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useLocationPermissions } from '../hooks/useLocationPermissions';

const setPlatform = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
};

jest.mock('expo-location', () => ({
  Accuracy: {
    Balanced: 3,
  },
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined',
  },
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

describe('useLocationPermissions', () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    setPlatform('ios');
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
    jest.clearAllMocks();
  });

  it('usa navigator.geolocation en web', async () => {
    const getCurrentPosition = jest.fn((onSuccess: (position: { coords: { latitude: number; longitude: number } }) => void) => {
      onSuccess({
        coords: {
          latitude: 10.99,
          longitude: -74.78,
        },
      });
    });

    setPlatform('web');
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        geolocation: {
          getCurrentPosition,
        },
      },
    });

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => expect(result.current.isRequestingPermission).toBe(false));

    expect(getCurrentPosition).toHaveBeenCalled();
    expect(Location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    expect(result.current.permissionStatus).toBe('granted');
    expect(result.current.currentLocation).toEqual({
      latitude: 10.99,
      longitude: -74.78,
    });
  });

  it('solicita permisos nativos y obtiene coordenadas en mobile', async () => {
    setPlatform('android');
    jest.mocked(Location.requestForegroundPermissionsAsync).mockResolvedValue({
      status: Location.PermissionStatus.GRANTED,
      granted: true,
      canAskAgain: true,
      expires: 'never',
    });
    jest.mocked(Location.getCurrentPositionAsync).mockResolvedValue({
      coords: {
        latitude: 10.9878,
        longitude: -74.7889,
        altitude: null,
        accuracy: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: 0,
    });

    const { result } = renderHook(() => useLocationPermissions());

    await waitFor(() => expect(result.current.isRequestingPermission).toBe(false));

    expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalled();
    expect(Location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.Balanced,
    });
    expect(result.current.permissionStatus).toBe('granted');
    expect(result.current.currentLocation).toEqual({
      latitude: 10.9878,
      longitude: -74.7889,
    });
  });
});
