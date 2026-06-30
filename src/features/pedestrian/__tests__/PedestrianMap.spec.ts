import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import tw from '@/lib/tailwind';
import PedestrianMapContainer from '../components/PedestrianMapContainer';
import { ShadowZone } from '../schemas/pedestrian.schema';

jest.mock('react-native-maps', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Pressable, View } = jest.requireActual('react-native');

  return {
    __esModule: true,
    default: ({ children, ...props }: { children?: React.ReactNode }) =>
      ReactMock.createElement(View, props, children),
    Marker: ({ onPress, ...props }: { onPress?: () => void }) =>
      ReactMock.createElement(Pressable, { ...props, onPress }),
    Circle: (props: Record<string, unknown>) => ReactMock.createElement(View, props),
    Polyline: (props: Record<string, unknown>) => ReactMock.createElement(View, props),
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
    type: 'SOMBRA',
    title: 'Parque Los Fundadores',
    description: 'Sombra continua bajo arbolado urbano.',
    location: {
      latitude: 10.9878,
      longitude: -74.7889,
    },
    status: 'VALIDATED',
    coverageRadiusMeters: 320,
  },
  {
    id: 'shadow-zone-2',
    type: 'SOMBRA',
    title: 'Carrera 51B',
    description: 'Paso peatonal fresco durante la tarde.',
    location: {
      latitude: 10.9941,
      longitude: -74.8089,
    },
    status: 'PENDING',
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
    expect(getByTestId('quillamap-native-shade-marker-shadow-zone-1')).toBeTruthy();
    expect(getByTestId('quillamap-native-shade-marker-shadow-zone-2')).toBeTruthy();
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
    const firstMarker = getByTestId('quillamap-native-shade-marker-shadow-zone-1');
    const firstRadius = getByTestId('quillamap-native-shade-radius-shadow-zone-1');

    expect(nativeMap).toBeTruthy();
    expect(firstMarker).toBeTruthy();
    expect(firstMarker.props.coordinate).toEqual({
      latitude: 10.9878,
      longitude: -74.7889,
    });
    expect(firstRadius.props.radius).toBe(320);

    fireEvent.press(firstMarker);

    expect(onShadowZonePress).toHaveBeenCalledWith(shadowZones[0]);
  });
});
