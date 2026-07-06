import { renderHook, waitFor } from '@testing-library/react-native';
import { useLocationPermissions } from '../hooks/useLocationPermissions.web';

describe('useLocationPermissions web', () => {
  const originalNavigator = globalThis.navigator;

  afterEach(() => {
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: originalNavigator,
    });
    jest.clearAllMocks();
  });

  it('usa navigator.geolocation sin cargar expo-location en web', async () => {
    const getCurrentPosition = jest.fn(
      (onSuccess: (position: { coords: { latitude: number; longitude: number } }) => void) => {
        onSuccess({
          coords: {
            latitude: 10.99,
            longitude: -74.78,
          },
        });
      }
    );

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
    expect(result.current.permissionStatus).toBe('granted');
    expect(result.current.currentLocation).toEqual({
      latitude: 10.99,
      longitude: -74.78,
    });
  });
});
