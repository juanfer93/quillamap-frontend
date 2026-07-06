import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import tw from '@/lib/tailwind';
import WebQuillaMap from '../QuillaMap.web-renderer';
import NativeQuillaMap from '../QuillaMap.native';
import { QuillaMapShadeZone } from '../QuillaMap.types';
import type { PlaceMapFeature } from '@/types/contracts/places.contract';

jest.mock('maplibre-gl', () => {
  const mapInstance = {
    on: jest.fn(),
    off: jest.fn(),
    once: jest.fn(),
    remove: jest.fn(),
    jumpTo: jest.fn(),
    isStyleLoaded: jest.fn(() => true),
    getSource: jest.fn(),
    addSource: jest.fn(),
    getLayer: jest.fn(),
    addLayer: jest.fn(),
  };
  const MapMock = jest.fn(() => mapInstance);
  const MarkerMock = jest.fn().mockImplementation(() => ({
    setLngLat: jest.fn().mockReturnThis(),
    addTo: jest.fn().mockReturnThis(),
    remove: jest.fn(),
  }));

  return {
    __esModule: true,
    default: {
      Map: MapMock,
      Marker: MarkerMock,
    },
    Map: MapMock,
    Marker: MarkerMock,
  };
});

jest.mock('@expo/vector-icons', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Text } = jest.requireActual('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => ReactMock.createElement(Text, null, name),
  };
});

jest.mock('@maplibre/maplibre-react-native', () => {
  const ReactMock = jest.requireActual<typeof React>('react');
  const { Pressable, View } = jest.requireActual('react-native');

  const passthrough = (props: Record<string, unknown>) =>
    ReactMock.createElement(View, props, props.children as React.ReactNode);

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
      }));
      return ReactMock.createElement(View, props);
    }),
    UserLocation: passthrough,
    ShapeSource: passthrough,
    LineLayer: passthrough,
    CircleLayer: passthrough,
    FillExtrusionLayer: passthrough,
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

const places: PlaceMapFeature[] = [
  {
    id: 'tourist-ventana-al-mundo',
    source: 'tourist_site',
    category: 'servicios',
    name: {
      es: 'Ventana al Mundo',
      en: 'Window to the World',
    },
    description: {
      es: 'Monumento urbano',
      en: 'Urban monument',
    },
    location: {
      type: 'Point',
      coordinates: [-74.82134, 11.01902],
    },
    coordinate: {
      latitude: 11.01902,
      longitude: -74.82134,
    },
    metadata: {
      history: {
        es: 'Hito cultural contemporaneo',
        en: 'Contemporary cultural landmark',
      },
      openingHours: {
        es: 'Espacio publico abierto',
        en: 'Open public space',
      },
      buildingHeightMeters: 47,
      polygon: {
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

  it('usa MapLibre web y oculta zonas de sombra en tema oscuro', () => {
    const { getByTestId, queryByTestId } = render(
      <WebQuillaMap
        mode="pedestrian"
        themeMode="dark"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
      />
    );

    expect(getByTestId('quillamap-web-maplibre')).toBeTruthy();
    expect(queryByTestId('quillamap-web-shade-marker-shade-1')).toBeNull();
  });

  it('permite acercar el mapa web peatonal', () => {
    const { getByTestId } = render(
      <WebQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
      />
    );

    fireEvent.press(getByTestId('quillamap-web-zoom-in'));

    expect(getByTestId('quillamap-web-zoom-in')).toBeTruthy();
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

    expect(getByTestId('quillamap-native-map').props.mapStyle.sources.osm).toBeTruthy();
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

    const { getByTestId } = render(
      <WebQuillaMap
        mode="pedestrian"
        center={center}
        shadeZones={shadeZones}
        onMapPress={onMapPress}
      />
    );

    getByTestId('quillamap-web-pan-layer').props.onResponderRelease();

    expect(onMapPress).toHaveBeenCalledWith({
      latitude: expect.closeTo(center.latitude, 8),
      longitude: expect.closeTo(center.longitude, 8),
    });
  });

  it('permite arrastrar el mapa web sin asignar una sombra accidental', () => {
    const onMapPress = jest.fn();
    const { getByTestId } = render(
      <WebQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
        onMapPress={onMapPress}
      />
    );

    const panLayer = getByTestId('quillamap-web-pan-layer');

    panLayer.props.onPointerDown();
    panLayer.props.onPointerMove();
    panLayer.props.onPointerUp();

    expect(onMapPress).not.toHaveBeenCalled();
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
    expect(getByTestId('quillamap-native-shadow-draft-marker').props.coordinate).toEqual({
      longitude: selectedCoordinate.longitude,
      latitude: selectedCoordinate.latitude,
    });
  });

  it('abre la tarjeta multimedia de lugares solo en modo turista web', () => {
    const onPlacePress = jest.fn<void, [PlaceMapFeature]>();

    const { getByTestId, getByText } = render(
      <WebQuillaMap
        mode="tourist"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
        onPlacePress={onPlacePress}
      />
    );

    fireEvent.press(getByTestId('quillamap-web-place-marker-tourist-ventana-al-mundo'));

    expect(onPlacePress).toHaveBeenCalledWith(places[0]);
    expect(getByTestId('place-bottom-sheet')).toBeTruthy();
    expect(getByTestId('place-bottom-sheet-title').props.children).toBe('Ventana al Mundo');
    expect(getByText('Hito cultural contemporaneo\nContemporary cultural landmark')).toBeTruthy();
  });

  it('bloquea la tarjeta de lugares en modos de conduccion y peaton', () => {
    const onPlacePress = jest.fn<void, [PlaceMapFeature]>();

    const { getByTestId, queryByTestId } = render(
      <WebQuillaMap
        mode="car"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
        onPlacePress={onPlacePress}
      />
    );

    fireEvent.press(getByTestId('quillamap-web-place-marker-tourist-ventana-al-mundo'));

    expect(onPlacePress).not.toHaveBeenCalled();
    expect(queryByTestId('place-bottom-sheet')).toBeNull();
  });

  it('mantiene marcadores y edificios de lugares equivalentes en web y nativo', () => {
    const web = render(
      <WebQuillaMap
        mode="tourist"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
      />
    );
    const native = render(
      <NativeQuillaMap
        mode="tourist"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
      />
    );

    expect(web.getByTestId('quillamap-web-place-marker-tourist-ventana-al-mundo')).toBeTruthy();
    expect(native.getByTestId('quillamap-native-place-marker-tourist-ventana-al-mundo')).toBeTruthy();
    expect(web.getByTestId('quillamap-web-building-extrusion-tourist-ventana-al-mundo').props.fill).toBeTruthy();
    expect(native.getByTestId('quillamap-native-building-extrusions').props.style.fillExtrusionColor).toEqual(['get', 'color']);
  });
});
