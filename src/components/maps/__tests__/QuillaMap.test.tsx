import React from 'react';
import { Dimensions, Image } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';
import tw from '@/lib/tailwind';
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
    const { getByTestId, getByText, queryByTestId, queryByText } = render(
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
    expect(queryByTestId('quillamap-web-shadow-draft-marker')).toBeNull();
    expect(getByText('umbrella-outline')).toBeTruthy();
    expect(queryByText('partly-sunny-outline')).toBeNull();
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
    expect(queryByTestId('quillamap-native-shade-radius-shade-1')).toBeNull();
    expect(getByTestId('quillamap-native-shade-marker-shade-1').props.coordinate).toEqual(shadeZones[0].coordinate);

    fireEvent.press(getByTestId('quillamap-native-shade-marker-shade-1'));

    expect(onShadeZonePress).toHaveBeenCalledWith(shadeZones[0]);
  });

  it('no pinta marcadores por defecto cuando el flujo real pide solo datos persistidos', () => {
    const { queryByTestId: queryWebByTestId } = render(
      <WebQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={[]}
        showDefaultShadeZones={false}
      />
    );
    const { queryByTestId: queryNativeByTestId } = render(
      <NativeQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={[]}
        showDefaultShadeZones={false}
      />
    );

    expect(queryWebByTestId('quillamap-web-shade-marker-shade-1')).toBeNull();
    expect(queryNativeByTestId('quillamap-native-shade-marker-shade-1')).toBeNull();
  });

  it('oscurece tiles web manteniendo detalle cuando el tema es oscuro', () => {
    const { UNSAFE_getAllByType, queryByTestId } = render(
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
    expect(queryByTestId('quillamap-web-shade-marker-shade-1')).toBeNull();
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
    const { getByTestId, queryByTestId } = render(
      <NativeQuillaMap
        mode="pedestrian"
        themeMode="dark"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
      />
    );

    expect(getByTestId('quillamap-native-map').props.customMapStyle.length).toBeGreaterThan(0);
    expect(queryByTestId('quillamap-native-shade-marker-shade-1')).toBeNull();
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

  it('convierte el click web en coordenadas exactas del mapa', () => {
    const onMapPress = jest.fn();
    const center = { latitude: 10.9878, longitude: -74.7889 };
    const dimensions = Dimensions.get('window');
    const mapWidth = Math.max(320, dimensions.width - 48);
    const mapHeight = Math.max(520, dimensions.height - 210);

    const { getByTestId } = render(
      <WebQuillaMap
        mode="pedestrian"
        center={center}
        shadeZones={shadeZones}
        onMapPress={onMapPress}
      />
    );

    getByTestId('quillamap-web-pan-layer').props.onResponderRelease({
      nativeEvent: {
        locationX: mapWidth / 2,
        locationY: mapHeight / 2,
      },
    });

    expect(onMapPress).toHaveBeenCalledWith({
      latitude: expect.closeTo(center.latitude, 8),
      longitude: expect.closeTo(center.longitude, 8),
    });
  });

  it('permite arrastrar el mapa web sin asignar una sombra accidental', () => {
    const onMapPress = jest.fn();
    const { getByTestId, UNSAFE_getAllByType } = render(
      <WebQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
        onMapPress={onMapPress}
      />
    );

    const panLayer = getByTestId('quillamap-web-pan-layer');
    const initialTileLeft = UNSAFE_getAllByType(Image)[0].props.style.left;

    act(() => {
      panLayer.props.onPointerDown({
        nativeEvent: {
          clientX: 120,
          clientY: 160,
        },
      });
      panLayer.props.onPointerMove({
        nativeEvent: {
          clientX: 170,
          clientY: 180,
        },
      });
      panLayer.props.onPointerUp({
        nativeEvent: {
          clientX: 170,
          clientY: 180,
        },
      });
    });

    expect(onMapPress).not.toHaveBeenCalled();
    expect(UNSAFE_getAllByType(Image)[0].props.style.left).not.toBe(initialTileLeft);
  });

  it('propaga el tap nativo y pinta el marcador temporal con token dorado', () => {
    const onMapPress = jest.fn();
    const selectedCoordinate = { latitude: 10.9912, longitude: -74.7812 };

    const { getByTestId } = render(
      <NativeQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
        selectedCoordinate={selectedCoordinate}
        onMapPress={onMapPress}
      />
    );

    fireEvent.press(getByTestId('quillamap-native-map'), {
      nativeEvent: {
        coordinate: selectedCoordinate,
      },
    });

    expect(onMapPress).toHaveBeenCalledWith(selectedCoordinate);
    expect(getByTestId('quillamap-native-shadow-draft-marker').props.coordinate).toEqual(selectedCoordinate);
    expect(getByTestId('quillamap-native-shadow-draft-marker').props.pinColor).toBe(tw.color('secondary'));
  });
});
