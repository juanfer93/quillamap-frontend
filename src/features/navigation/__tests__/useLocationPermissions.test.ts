import { renderHook, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { useLocationPermissions } from '../hooks/useLocationPermissions';

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
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('solicita permisos nativos y obtiene coordenadas en mobile', async () => {
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
