import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { navigationApi, reportsApi, thermalComfortApi } from '@/api';
import { useKarmaRewards } from '@/features/navigation/hooks/useKarmaRewards';
import { useAuthStore } from '@/store/useAuthStore';
import ShadowReportMapFlow from '../components/ShadowReportMapFlow';
import { SHADOW_REPORTS_MAP_LOOKUP_RADIUS_METERS } from '../constants/shadow-report.constants';
import { ReportStatus, ReportType, type CreateReportDto, type Report } from '../types/report.types';

let mockCurrentLocation: { latitude: number; longitude: number } | null = null;

jest.mock('@expo/vector-icons', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Text } = jest.requireActual('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

jest.mock('expo-image-picker', () => ({
  MediaTypeOptions: {
    Images: 'Images',
  },
  requestCameraPermissionsAsync: jest.fn(),
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('@/features/pedestrian/hooks/useLocationPermissions', () => ({
  useLocationPermissions: () => ({
    permissionStatus: 'granted',
    currentLocation: mockCurrentLocation,
    isRequestingPermission: false,
    errorMessage: null,
  }),
}));

jest.mock('@/features/navigation/hooks/useLocationPermissions', () => ({
  useLocationPermissions: () => ({
    permissionStatus: 'granted',
    currentLocation: mockCurrentLocation,
    isRequestingPermission: false,
    errorMessage: null,
  }),
}));

jest.mock('@maplibre/maplibre-react-native', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Pressable, View } = jest.requireActual('react-native');

  const passthrough = (props: Record<string, unknown>) =>
    ReactMock.createElement(View, props, props.children as React.ReactNode);

  const pressableSource = ({
    children,
    onPress,
    shape,
    ...props
  }: {
    children?: React.ReactNode;
    onPress?: (event: { features: Array<{ properties?: Record<string, unknown> }> }) => void;
    shape?: { features?: Array<{ properties?: Record<string, unknown> }> };
  }) =>
    ReactMock.createElement(
      Pressable,
      {
        ...props,
        shape,
        onPress: () => onPress?.({ features: shape?.features ?? [] }),
      },
      children
    );

  return {
    __esModule: true,
    MapView: ReactMock.forwardRef(
      (
        { children, onPress, ...props }: { children?: React.ReactNode; onPress?: (feature: unknown) => void },
        ref: React.Ref<{}>
      ) => {
        ReactMock.useImperativeHandle(ref, () => ({
          setCamera: jest.fn(),
        }));

        return ReactMock.createElement(
          Pressable,
          {
            ...props,
            onPress: (event: { nativeEvent?: { coordinate?: { latitude: number; longitude: number } } }) => {
              const coordinate = event.nativeEvent?.coordinate;
              onPress?.({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'Point',
                  coordinates: coordinate ? [coordinate.longitude, coordinate.latitude] : [0, 0],
                },
              });
            },
          },
          children
        );
      }
    ),
    Camera: ReactMock.forwardRef((props: Record<string, unknown>, ref: React.Ref<{ zoomTo: jest.Mock }>) => {
      ReactMock.useImperativeHandle(ref, () => ({
        zoomTo: jest.fn(),
        setCamera: jest.fn(),
      }));
      return ReactMock.createElement(View, props);
    }),
    UserLocation: passthrough,
    ShapeSource: pressableSource,
    LineLayer: passthrough,
    CircleLayer: passthrough,
    FillLayer: passthrough,
    FillExtrusionLayer: passthrough,
    SymbolLayer: passthrough,
    MarkerView: ({ coordinate, children, ...props }: { coordinate: [number, number]; children?: React.ReactNode }) =>
      ReactMock.createElement(
        View,
        {
          ...props,
          coordinate: {
            longitude: coordinate[0],
            latitude: coordinate[1],
          },
        },
        children
      ),
  };
});

jest.mock('@/api', () => ({
  reportsApi: {
    create: jest.fn(),
    findNearby: jest.fn(),
  },
  navigationApi: {
    calculateRoute: jest.fn(),
  },
  thermalComfortApi: {
    findGreenCoverage: jest.fn(),
  },
  placesApi: {
    findNearby: jest.fn().mockResolvedValue([]),
  },
}));

describe('ShadowReportMapFlow e2e', () => {
  beforeEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    mockCurrentLocation = null;
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
    jest.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValue({ granted: true } as never);
    jest.mocked(ImagePicker.requestMediaLibraryPermissionsAsync).mockResolvedValue({ granted: true } as never);
    jest.mocked(ImagePicker.launchCameraAsync).mockResolvedValue({ canceled: true, assets: [] } as never);
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: true, assets: [] } as never);
    jest.mocked(reportsApi.findNearby).mockResolvedValue([]);
    jest.mocked(navigationApi.calculateRoute).mockResolvedValue({
      geometry: [],
      distanceMeters: 0,
      durationSeconds: 0,
      alerts: [],
      provider: 'osrm',
      legalStatus: 'allowed',
      shadeSegments: [],
    });
    jest.mocked(thermalComfortApi.findGreenCoverage).mockResolvedValue([
      {
        id: 'green-coverage-1',
        osmId: 'way/1',
        type: 'park',
        source: 'overpass',
        name: 'Parque fresco',
        tags: { leisure: 'park' },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-74.82152, 11.01917],
            [-74.82116, 11.01917],
            [-74.82116, 11.01887],
            [-74.82152, 11.01887],
            [-74.82152, 11.01917],
          ]],
        },
      },
    ]);
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

    await waitFor(() => expect(getByTestId('report-evidence-prompt')).toBeTruthy());
    expect(reportsApi.create).not.toHaveBeenCalled();
    fireEvent.press(getByTestId('report-evidence-skip'));

    await waitFor(() => expect(mockDbReports).toHaveLength(1));

    await waitFor(() => {
      expect(queryByTestId('shadow-placement-hint')).toBeNull();
      expect(getByTestId('shadow-report-success').props.children).toBe('Sombra reportada');
    });

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
    expect(getByTestId('quillamap-native-shade-source').props.shape.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({ id: 'db-shadow-1' }),
          geometry: expect.objectContaining({
            coordinates: [tappedCoordinate.longitude, tappedCoordinate.latitude],
          }),
        }),
      ])
    );
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
    await waitFor(() => expect(firstSession.getByTestId('report-evidence-prompt')).toBeTruthy());
    fireEvent.press(firstSession.getByTestId('report-evidence-skip'));

    await waitFor(() => expect(mockDbReports).toHaveLength(1));
    firstSession.unmount();

    const secondSession = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => {
      expect(secondSession.getByTestId('quillamap-native-shade-source').props.shape.features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ id: 'db-shadow-permanent' }),
            geometry: expect.objectContaining({
              coordinates: [tappedCoordinate.longitude, tappedCoordinate.latitude],
            }),
          }),
        ])
      );
    });
    expect(reportsApi.findNearby).toHaveBeenCalledWith({
      lat: 10.9878,
      lng: -74.7889,
      radius: SHADOW_REPORTS_MAP_LOOKUP_RADIUS_METERS,
    });
  });

  it('permite adjuntar evidencia voluntaria desde galeria antes de guardar la sombra', async () => {
    const tappedCoordinate = {
      latitude: 10.994444,
      longitude: -74.787777,
    };

    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
      canceled: false,
      assets: [
        {
          uri: 'file:///tmp/sombra.jpg',
          fileName: 'sombra.jpg',
          mimeType: 'image/jpeg',
        },
      ],
    } as never);
    jest.mocked(reportsApi.create).mockImplementation(async (dto: CreateReportDto) => ({
      id: 'db-shadow-with-photo',
      type: dto.type,
      description: dto.description,
      location: dto.location,
      status: ReportStatus.ACTIVO,
      profileId: 'profile-1',
      createdAt: '2026-07-02T12:15:00.000Z',
      imageUrl: 'https://xyz.supabase.co/storage/v1/object/public/evidence/db-shadow-with-photo/sombra.jpg',
    }));

    const { getByTestId } = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => expect(reportsApi.findNearby).toHaveBeenCalled());

    fireEvent.press(getByTestId('user-tools-profile-button'));
    fireEvent.press(getByTestId('user-tools-report-shadow'));
    fireEvent.press(getByTestId('quillamap-native-map'), {
      nativeEvent: {
        coordinate: tappedCoordinate,
      },
    });

    await waitFor(() => expect(getByTestId('report-evidence-prompt')).toBeTruthy());
    fireEvent.press(getByTestId('report-evidence-gallery'));

    await waitFor(() => {
      expect(reportsApi.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: ReportType.SOMBRA,
          evidenceImage: expect.objectContaining({
            uri: 'file:///tmp/sombra.jpg',
            fileName: 'sombra.jpg',
            mimeType: 'image/jpeg',
          }),
        }),
        'jwt-token'
      );
    });
  });

  it('muestra la foto de evidencia al tocar una sombra persistida con imageUrl', async () => {
    const persistedReport: Report = {
      id: 'db-shadow-photo-existing',
      type: ReportType.SOMBRA,
      description: 'Sombra con foto guardada en Storage',
      location: {
        type: 'Point',
        coordinates: [-74.7889, 10.9878],
      },
      status: ReportStatus.ACTIVO,
      profileId: 'profile-1',
      createdAt: '2026-07-02T12:00:00.000Z',
      imageUrl: 'https://xyz.supabase.co/storage/v1/object/public/evidence/db-shadow-photo-existing/sombra.jpg',
    };

    jest.mocked(reportsApi.findNearby).mockResolvedValue([persistedReport]);

    const { getByTestId } = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => expect(getByTestId('quillamap-native-shade-source')).toBeTruthy());
    fireEvent.press(getByTestId('quillamap-native-shade-source'));

    await waitFor(() => {
      expect(getByTestId('shadow-report-evidence-image').props.source).toEqual({
        uri: persistedReport.imageUrl,
      });
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
      expect(getByTestId('quillamap-native-shade-source').props.shape.features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            properties: expect.objectContaining({ id: 'db-shadow-existing' }),
            geometry: expect.objectContaining({
              coordinates: [-74.7889, 10.9878],
            }),
          }),
        ])
      );
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

    expect(queryByTestId('quillamap-native-shade-source')?.props.shape.features).toEqual([]);
    expect(queryByTestId('quillamap-native-shadow-draft-marker')).toBeNull();
    expect(queryByTestId('user-tools-report-shadow')).toBeTruthy();
  });

  it('no muestra zonas demo cuando backend no devuelve sombras persistidas', async () => {
    const { queryByTestId } = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => expect(reportsApi.findNearby).toHaveBeenCalled());

    expect(queryByTestId('quillamap-native-shade-source')?.props.shape.features).toEqual([]);
  });

  it('abre una busqueda independiente de ruta fresca y muestra el preview sombreado', async () => {
    const { getByTestId, getByText, queryByTestId } = render(
      <ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />
    );

    await waitFor(() => expect(reportsApi.findNearby).toHaveBeenCalled());

    fireEvent.press(getByTestId('user-tools-profile-button'));
    fireEvent.press(getByTestId('thermal-comfort-route-search-toggle'));

    expect(getByTestId('thermal-comfort-route-search-panel')).toBeTruthy();

    fireEvent.changeText(getByTestId('thermal-comfort-route-destination-input'), 'ventana mundo');
    fireEvent.press(getByTestId('thermal-comfort-route-submit'));

    await waitFor(() => {
      expect(thermalComfortApi.findGreenCoverage).toHaveBeenCalledWith({
        lat: 11.01902,
        lng: -74.82134,
        radius: 800,
      });
    });

    expect(navigationApi.calculateRoute).not.toHaveBeenCalled();
    expect(getByTestId('quillamap-native-user-location-source').props.shape.features).toHaveLength(0);
    expect(getByTestId('quillamap-native-route-shade-source').props.shape.features).toHaveLength(0);
    expect(getByTestId('quillamap-native-thermal-comfort-shade-source').props.shape.features).toHaveLength(1);
    expect(getByTestId('quillamap-native-thermal-comfort-shade').props.style.lineColor).toBe('#2FBF71');
    expect(getByTestId('thermal-comfort-route-result')).toBeTruthy();
    expect(getByText('Zonas verdes')).toBeTruthy();
    expect(getByText('Incluye arboles, parques y areas con pasto cerca de tu busqueda.')).toBeTruthy();
    expect(getByText('1 zona verde cercana')).toBeTruthy();
    expect(getByText('1 zona dibujada en el mapa')).toBeTruthy();

    fireEvent.press(getByTestId('thermal-comfort-route-clear'));

    await waitFor(() => {
      expect(queryByTestId('thermal-comfort-route-result')).toBeNull();
      expect(getByTestId('quillamap-native-thermal-comfort-shade-source').props.shape.features).toHaveLength(0);
      expect(getByTestId('quillamap-native-user-location-source').props.shape.features).toHaveLength(1);
    });
  });

  it('busca zonas frescas cerca de la ubicacion activa sin interrumpir el GPS', async () => {
    mockCurrentLocation = {
      latitude: 11.0081,
      longitude: -74.8132,
    };

    const { getByTestId, getByText } = render(<ShadowReportMapFlow canReportShadow onLogout={jest.fn()} />);

    await waitFor(() => expect(reportsApi.findNearby).toHaveBeenCalled());

    fireEvent.press(getByTestId('user-tools-profile-button'));
    fireEvent.press(getByTestId('thermal-comfort-route-search-toggle'));
    fireEvent.press(getByTestId('thermal-comfort-route-current-location'));

    await waitFor(() => {
      expect(thermalComfortApi.findGreenCoverage).toHaveBeenCalledWith({
        lat: 11.0081,
        lng: -74.8132,
        radius: 800,
      });
    });

    expect(navigationApi.calculateRoute).not.toHaveBeenCalled();
    expect(getByTestId('quillamap-native-user-location-source').props.shape.features).toHaveLength(1);
    expect(getByTestId('quillamap-native-user-location-source').props.shape.features[0].geometry.coordinates).toEqual([
      -74.8132,
      11.0081,
    ]);
    expect(getByTestId('quillamap-native-thermal-comfort-shade-source').props.shape.features).toHaveLength(1);
    expect(getByTestId('thermal-comfort-route-result')).toBeTruthy();
    expect(getByText('1 zona verde cercana')).toBeTruthy();
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
