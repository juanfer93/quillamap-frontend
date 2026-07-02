import React from 'react';
import { Image } from 'react-native';
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
    default: ReactMock.forwardRef(
      ({ children, ...props }: { children?: React.ReactNode }, ref: React.Ref<{ animateToRegion: jest.Mock }>) => {
        ReactMock.useImperativeHandle(ref, () => ({
          animateToRegion: jest.fn(),
        }));

        return ReactMock.createElement(View, props, children);
      }
    ),
    Marker: ({ onPress, ...props }: { onPress?: () => void }) =>
      ReactMock.createElement(Pressable, { ...props, onPress }),
    Circle: (props: Record<string, unknown>) => ReactMock.createElement(View, props),
    Polygon: (props: Record<string, unknown>) => ReactMock.createElement(View, props),
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
    const { getByTestId, queryByText } = render(
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
    expect(queryByText('Zonas de Sombra')).toBeNull();
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

  it('oscurece tiles web manteniendo detalle cuando el tema es oscuro', () => {
    const { UNSAFE_getAllByType } = render(
      <WebQuillaMap
        mode="pedestrian"
        themeMode="dark"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
      />
    );

    const [firstTile] = UNSAFE_getAllByType(Image);

    expect(firstTile.props.source.uri).toContain('World_Dark_Gray_Base');
    expect(firstTile.props.style.filter).toContain('contrast');
  });

  it('permite acercar el mapa web peatonal', () => {
    const { getByTestId, UNSAFE_getAllByType } = render(
      <WebQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
      />
    );

    expect(UNSAFE_getAllByType(Image)[0].props.source.uri).toContain('/16/');

    fireEvent.press(getByTestId('quillamap-web-zoom-in'));

    expect(UNSAFE_getAllByType(Image)[0].props.source.uri).toContain('/17/');
    expect(getByTestId('quillamap-web-zoom-out')).toBeTruthy();
  });

  it('aplica estilo oscuro al mapa nativo cuando el tema es oscuro', () => {
    const { getByTestId } = render(
      <NativeQuillaMap
        mode="pedestrian"
        themeMode="dark"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
      />
    );

    expect(getByTestId('quillamap-native-map').props.customMapStyle.length).toBeGreaterThan(0);
  });

  it('expone controles reutilizables de zoom en el mapa nativo peatonal', () => {
    const { getByTestId } = render(
      <NativeQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
      />
    );

    expect(getByTestId('quillamap-native-zoom-in')).toBeTruthy();
    expect(getByTestId('quillamap-native-zoom-out')).toBeTruthy();
  });
});
