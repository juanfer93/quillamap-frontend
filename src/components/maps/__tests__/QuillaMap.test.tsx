import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import WebQuillaMap from '../QuillaMap.web-renderer';
import NativeQuillaMap from '../QuillaMap.native';
import { QuillaMapShadeZone } from '../QuillaMap.types';

jest.mock('@expo/vector-icons', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Text } = jest.requireActual('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

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

const shadeZones: QuillaMapShadeZone[] = [
  {
    id: 'shade-1',
    title: 'Zona de Sombra Norte',
    coordinate: {
      latitude: 10.9878,
      longitude: -74.7889,
    },
    radiusMeters: 340,
  },
];

describe('QuillaMap', () => {
  it('renderiza la vista visual web del mapa peatonal', () => {
    const { getByTestId, getByText } = render(
      <WebQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
      />
    );

    expect(getByTestId('quillamap-web')).toBeTruthy();
    expect(getByTestId('quillamap-web-map-art')).toBeTruthy();
    expect(getByTestId('quillamap-web-map-tiles')).toBeTruthy();
    expect(getByTestId('quillamap-web-route')).toBeTruthy();
    expect(getByTestId('quillamap-web-shade-marker-shade-1')).toBeTruthy();
    expect(getByText('Buscar ruta fresca')).toBeTruthy();
    expect(getByText('1 sombras')).toBeTruthy();
  });

  it('renderiza mapa nativo y propaga seleccion de zona de sombra', () => {
    const onShadeZonePress = jest.fn<void, [QuillaMapShadeZone]>();

    const { getByTestId, queryByTestId } = render(
      <NativeQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
        onShadeZonePress={onShadeZonePress}
      />
    );

    expect(getByTestId('quillamap-native')).toBeTruthy();
    expect(queryByTestId('quillamap-web')).toBeNull();

    fireEvent.press(getByTestId('quillamap-native-shade-marker-shade-1'));

    expect(onShadeZonePress).toHaveBeenCalledWith(shadeZones[0]);
  });
});
