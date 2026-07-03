import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { reportsApi } from '@/api/client';
import { useKarmaRewards } from '@/features/navigation/hooks/useKarmaRewards';
import { useAuthStore } from '@/store/useAuthStore';
import ShadowReportMapFlow from '../components/ShadowReportMapFlow';
import { SHADOW_REPORTS_MAP_LOOKUP_RADIUS_METERS } from '../constants/shadow-report.constants';
import { ReportStatus, ReportType, type CreateReportDto, type Report } from '../types/report.types';

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

jest.mock('react-native-maps', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Pressable, View } = jest.requireActual('react-native');

  return {
    __esModule: true,
    default: ReactMock.forwardRef(
      ({ children, onPress, ...props }: { children?: React.ReactNode; onPress?: (event: unknown) => void }, ref: React.Ref<{ animateToRegion: jest.Mock }>) => {
        ReactMock.useImperativeHandle(ref, () => ({
          animateToRegion: jest.fn(),
        }));

        return ReactMock.createElement(Pressable, { ...props, onPress }, children);
      }
    ),
    Marker: ({ onPress, ...props }: { onPress?: () => void }) =>
      ReactMock.createElement(Pressable, { ...props, onPress }),
    Circle: (props: Record<string, unknown>) => ReactMock.createElement(View, props),
    Polygon: (props: Record<string, unknown>) => ReactMock.createElement(View, props),
    Polyline: (props: Record<string, unknown>) => ReactMock.createElement(View, props),
  };
});

jest.mock('@/api/client', () => ({
  reportsApi: {
    create: jest.fn(),
    findNearby: jest.fn(),
  },
}));

describe('ShadowReportMapFlow e2e', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'profile-1',
        full_name: 'Sombra Tester',
        email: 'sombra@test.com',
        karma: 0,
        mobility_mode: 'peaton',
      },
      session: 'jwt-token',
      isLoading: false,
    });
    useKarmaRewards.getState().resetKarma();
    jest.mocked(reportsApi.findNearby).mockResolvedValue([]);
  });

  it('abre mapa, marca sombra, guarda en DB y muestra el marcador persistido', async () => {
    const mockDbReports: Report[] = [];
    const tappedCoordinate = {
      latitude: 10.991234,
      longitude: -74.781234,
    };

    jest.mocked(reportsApi.create).mockImplementation(async (dto: CreateReportDto) => {
      const savedReport: Report = {
        id: `db-shadow-${mockDbReports.length + 1}`,
        type: dto.type,
        description: dto.description,
        location: dto.location,
        status: ReportStatus.ACTIVO,
        profileId: 'profile-1',
        createdAt: '2026-07-02T12:00:00.000Z',
      };

      mockDbReports.push(savedReport);
      return savedReport;
    });

    const { getByTestId, queryByTestId } = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => expect(reportsApi.findNearby).toHaveBeenCalled());

    fireEvent.press(getByTestId('user-tools-profile-button'));
    fireEvent.press(getByTestId('user-tools-report-shadow'));
    await waitFor(() => expect(getByTestId('shadow-placement-hint')).toBeTruthy());

    fireEvent.press(getByTestId('quillamap-native-map'), {
      nativeEvent: {
        coordinate: tappedCoordinate,
      },
    });

    await waitFor(() => expect(mockDbReports).toHaveLength(1));

    expect(queryByTestId('shadow-placement-hint')).toBeNull();
    expect(getByTestId('shadow-report-success').props.children).toBe('Sombra reportada');

    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 3100);
      });
    });
    await waitFor(() => {
      expect(queryByTestId('shadow-report-success')).toBeNull();
    });

    fireEvent.press(getByTestId('user-tools-profile-button'));
    expect(getByTestId('user-tools-karma-points').props.children).toBe(6);
    expect(mockDbReports[0]).toMatchObject({
      type: ReportType.SOMBRA,
      location: {
        type: 'Point',
        coordinates: [tappedCoordinate.longitude, tappedCoordinate.latitude],
      },
    });
    expect(getByTestId('quillamap-native-shade-marker-db-shadow-1').props.coordinate).toEqual(tappedCoordinate);
  }, 10000);

  it('mantiene la sombra guardada al abrir otra sesion cargando desde backend', async () => {
    const mockDbReports: Report[] = [];
    const tappedCoordinate = {
      latitude: 10.993321,
      longitude: -74.786654,
    };

    jest.mocked(reportsApi.findNearby)
      .mockResolvedValueOnce([])
      .mockImplementation(async () => [...mockDbReports]);
    jest.mocked(reportsApi.create).mockImplementation(async (dto: CreateReportDto) => {
      const savedReport: Report = {
        id: 'db-shadow-permanent',
        type: dto.type,
        description: dto.description,
        location: dto.location,
        status: ReportStatus.ACTIVO,
        profileId: 'profile-1',
        createdAt: '2026-07-02T12:10:00.000Z',
      };

      mockDbReports.push(savedReport);
      return savedReport;
    });

    const firstSession = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => expect(reportsApi.findNearby).toHaveBeenCalled());

    fireEvent.press(firstSession.getByTestId('user-tools-profile-button'));
    fireEvent.press(firstSession.getByTestId('user-tools-report-shadow'));
    await waitFor(() => expect(firstSession.getByTestId('shadow-placement-hint')).toBeTruthy());
    fireEvent.press(firstSession.getByTestId('quillamap-native-map'), {
      nativeEvent: {
        coordinate: tappedCoordinate,
      },
    });

    await waitFor(() => expect(mockDbReports).toHaveLength(1));
    firstSession.unmount();

    const secondSession = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => {
      expect(secondSession.getByTestId('quillamap-native-shade-marker-db-shadow-permanent').props.coordinate).toEqual(
        tappedCoordinate
      );
    });
    expect(reportsApi.findNearby).toHaveBeenCalledWith({
      lat: 10.9878,
      lng: -74.7889,
      radius: SHADOW_REPORTS_MAP_LOOKUP_RADIUS_METERS,
    });
  });

  it('carga zonas de sombra existentes desde el backend al abrir el mapa', async () => {
    const persistedReport: Report = {
      id: 'db-shadow-existing',
      type: ReportType.SOMBRA,
      description: 'Sombra guardada en PostGIS',
      location: {
        type: 'Point',
        coordinates: [-74.7889, 10.9878],
      },
      status: ReportStatus.ACTIVO,
      profileId: 'profile-1',
      createdAt: '2026-07-02T12:00:00.000Z',
    };

    jest.mocked(reportsApi.findNearby).mockResolvedValue([persistedReport]);

    const { getByTestId } = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => {
      expect(getByTestId('quillamap-native-shade-marker-db-shadow-existing').props.coordinate).toEqual({
        latitude: 10.9878,
        longitude: -74.7889,
      });
    });
  });

  it('oculta zonas de sombra y accion de reporte cuando el mapa esta en modo oscuro', async () => {
    const persistedReport: Report = {
      id: 'db-shadow-night',
      type: ReportType.SOMBRA,
      description: 'Sombra guardada en PostGIS',
      location: {
        type: 'Point',
        coordinates: [-74.7889, 10.9878],
      },
      status: ReportStatus.ACTIVO,
      profileId: 'profile-1',
      createdAt: '2026-07-02T18:00:00.000Z',
    };

    jest.mocked(reportsApi.findNearby).mockResolvedValue([persistedReport]);

    const { getByTestId, queryByTestId } = render(
      <ShadowReportMapFlow canReportShadow themeMode="dark" onLogout={jest.fn()} />
    );

    await waitFor(() => expect(reportsApi.findNearby).toHaveBeenCalled());

    fireEvent.press(getByTestId('user-tools-profile-button'));

    expect(queryByTestId('quillamap-native-shade-marker-db-shadow-night')).toBeNull();
    expect(queryByTestId('quillamap-native-shadow-draft-marker')).toBeNull();
    expect(queryByTestId('user-tools-report-shadow')).toBeTruthy();
  });

  it('no muestra zonas demo cuando backend no devuelve sombras persistidas', async () => {
    const { queryByTestId } = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => expect(reportsApi.findNearby).toHaveBeenCalled());

    expect(queryByTestId('quillamap-native-shade-marker-shade-1')).toBeNull();
  });

  it('no marca sombra al tocar el mapa antes de activar reportar sombra', async () => {
    const { getByTestId, queryByTestId } = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => expect(reportsApi.findNearby).toHaveBeenCalled());

    fireEvent.press(getByTestId('quillamap-native-map'), {
      nativeEvent: {
        coordinate: {
          latitude: 10.991234,
          longitude: -74.781234,
        },
      },
    });

    expect(queryByTestId('quillamap-native-shadow-draft-marker')).toBeNull();
    expect(reportsApi.create).not.toHaveBeenCalled();
  });

  it('no permite reportar sombra cuando el perfil no es vehicle_type peaton', async () => {
    const tappedCoordinate = {
      latitude: 10.991234,
      longitude: -74.781234,
    };

    const { getByTestId, queryByTestId } = render(<ShadowReportMapFlow canReportShadow={false} onLogout={jest.fn()} />);

    await waitFor(() => expect(reportsApi.findNearby).toHaveBeenCalled());

    fireEvent.press(getByTestId('quillamap-native-map'), {
      nativeEvent: {
        coordinate: tappedCoordinate,
      },
    });
    fireEvent.press(getByTestId('user-tools-profile-button'));

    expect(queryByTestId('quillamap-native-shadow-draft-marker')).toBeNull();
    expect(queryByTestId('user-tools-report-shadow')).toBeNull();
    expect(reportsApi.create).not.toHaveBeenCalled();
  });
});
