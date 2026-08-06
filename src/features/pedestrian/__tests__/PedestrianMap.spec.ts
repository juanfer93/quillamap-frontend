import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import tw from '@/lib/tailwind';
import PedestrianMapContainer from '../components/PedestrianMapContainer';
import { ShadowZone } from '../schemas/pedestrian.schema';

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
      ({ children, ...props }: { children?: React.ReactNode }, ref: React.Ref<{}>) => {
        ReactMock.useImperativeHandle(ref, () => ({
          setCamera: jest.fn(),
        }));

        return ReactMock.createElement(Pressable, props, children);
      }
    ),
    Camera: ReactMock.forwardRef((props: Record<string, unknown>, ref: React.Ref<{ zoomTo: jest.Mock }>) => {
      ReactMock.useImperativeHandle(ref, () => ({
        zoomTo: jest.fn(),
      }));
      return ReactMock.createElement(View, props);
    }),
    UserLocation: passthrough,
    ShapeSource: pressableSource,
    LineLayer: passthrough,
    CircleLayer: passthrough,
    FillLayer: passthrough,
    FillExtrusionLayer: passthrough,
    HeatmapLayer: passthrough,
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

jest.mock('@expo/vector-icons', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Text } = jest.requireActual('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

jest.mock('../hooks/useLocationPermissions', () => ({
  useLocationPermissions: () => ({
    permissionStatus: 'granted',
    currentLocation: {
      latitude: 10.9878,
      longitude: -74.7889,
    },
    isRequestingPermission: false,
    errorMessage: null,
  }),
}));

const shadowZones: ShadowZone[] = [
  {
    id: 'shadow-zone-1',
    type: 'sombra',
    title: 'Parque Los Fundadores',
    description: 'Sombra continua bajo arbolado urbano.',
    location: {
      latitude: 10.9878,
      longitude: -74.7889,
    },
    status: 'activo',
    coverageRadiusMeters: 320,
  },
  {
    id: 'shadow-zone-2',
    type: 'sombra',
    title: 'Carrera 51B',
    description: 'Paso peatonal fresco durante la tarde.',
    location: {
      latitude: 10.9941,
      longitude: -74.8089,
    },
    status: 'activo',
    coverageRadiusMeters: 450,
  },
];

describe('PedestrianMapContainer', () => {
  it('renderiza el tema claro y carga marcadores de zonas de sombra', () => {
    const { getAllByText, getByTestId } = render(
      React.createElement(PedestrianMapContainer, {
        shadowZones,
        themeMode: 'light',
      })
    );

    expect(getByTestId('pedestrian-map-container')).toHaveStyle(tw`bg-surface-light`);
    expect(getAllByText('Modo Peaton').length).toBeGreaterThan(0);
    expect(getByTestId('quillamap-container')).toBeTruthy();
    expect(getByTestId('quillamap-native-shade-source').props.shape.features).toHaveLength(2);
    expect(getByTestId('quillamap-native-shade-layer')).toBeTruthy();
  });

  it('usa el renderizado nativo en el entorno movil de pruebas', () => {
    const { getByTestId, queryByTestId } = render(
      React.createElement(PedestrianMapContainer, {
        shadowZones,
      })
    );

    expect(getByTestId('quillamap-native')).toBeTruthy();
    expect(queryByTestId('quillamap-web')).toBeNull();
  });

  it('entrega las zonas de sombra alimentadas por PostGIS al mapa reusable', () => {
    const onShadowZonePress = jest.fn<void, [ShadowZone]>();

    const { getByTestId } = render(
      React.createElement(PedestrianMapContainer, {
        shadowZones,
        onShadowZonePress,
      })
    );

    const nativeMap = getByTestId('quillamap-native-map');
    const shadeSource = getByTestId('quillamap-native-shade-source');

    expect(nativeMap).toBeTruthy();
    expect(shadeSource.props.shape.features[0].geometry.coordinates).toEqual([-74.7889, 10.9878]);

    fireEvent.press(shadeSource);

    expect(onShadowZonePress).toHaveBeenCalledWith(shadowZones[0]);
  });
});
