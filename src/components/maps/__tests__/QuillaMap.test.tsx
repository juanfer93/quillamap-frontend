import React from 'react';
import { Pressable } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import tw from '@/lib/tailwind';
import WebQuillaMap from '../components/QuillaMap.web-renderer';
import NativeQuillaMap from '../components/QuillaMap.native';
import { QuillaMapShadeZone } from '../types/QuillaMap.types';
import {
  PLACES_VISUAL_IDENTITY,
  type PlaceMapFeature,
} from '@/types/contracts/places.contract';
import { NAVIGATION_VISUAL_IDENTITY } from '@/types/contracts/navigation.contract';

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
    setLayoutProperty: jest.fn(),
    setPaintProperty: jest.fn(),
    easeTo: jest.fn(),
    getZoom: jest.fn(() => 15),
    getBearing: jest.fn(() => 0),
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
          getZoom: jest.fn(() => Promise.resolve(15)),
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
    const { getByTestId, queryByTestId, queryByText } = render(
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
    expect(getByTestId('quillamap-web-compass-toggle')).toBeTruthy();
    expect(queryByTestId('quillamap-web-shadow-draft-marker')).toBeNull();
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
    expect(getByTestId('quillamap-native-shade-layer')).toBeTruthy();
    expect(getByTestId('quillamap-native-compass-toggle')).toBeTruthy();

    fireEvent.press(getByTestId('quillamap-native-shade-source'));

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
    expect(queryNativeByTestId('quillamap-native-shade-source')?.props.shape.features).toEqual([]);
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

  it('cicla la orientacion cardinal con brujula en web y nativo sin abrir tarjetas', () => {
    const web = render(
      <WebQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
      />
    );
    const native = render(
      <NativeQuillaMap
        mode="pedestrian"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
      />
    );

    fireEvent.press(web.getByTestId('quillamap-web-compass-toggle'));
    fireEvent.press(native.getByTestId('quillamap-native-compass-toggle'));

    expect(web.queryByTestId('place-bottom-sheet')).toBeNull();
    expect(native.queryByTestId('place-bottom-sheet')).toBeNull();
  });

  it('aplica estilo oscuro al mapa nativo cuando el tema es oscuro', () => {
    const sandGold = tw.color(PLACES_VISUAL_IDENTITY.sandGold.token) ?? PLACES_VISUAL_IDENTITY.sandGold.hex;
    const { getByTestId, getByText, queryByTestId } = render(
      <NativeQuillaMap
        mode="pedestrian"
        themeMode="dark"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        shadeZones={shadeZones}
        places={places}
      />
    );

    const mapStyle = getByTestId('quillamap-native-map').props.mapStyle as {
      layers: Array<{ id: string; paint?: Record<string, number> }>;
      sources: Record<string, unknown>;
    };
    const darkRasterLayer = mapStyle.layers.find((layer) => layer.id === 'carto-dark');

    expect(mapStyle.sources.cartoDark).toBeTruthy();
    expect(darkRasterLayer?.paint?.['raster-contrast']).toBeGreaterThan(0);
    expect(darkRasterLayer?.paint?.['raster-brightness-min']).toBeGreaterThan(0.3);
    expect(darkRasterLayer?.paint?.['raster-brightness-max']).toBe(1);
    expect(getByTestId('quillamap-native-places-layer').props.style.textColor).toBe(sandGold);
    expect(getByTestId('quillamap-native-places-source')).toBeTruthy();
    expect(getByText('N').props.style.color).toBe(sandGold);
    expect(queryByTestId('quillamap-native-shade-source')?.props.shape.features).toEqual([]);
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

  it('pinta la ruta activa en rojo y marca el destino en nativo', () => {
    const destination = { latitude: 11.01902, longitude: -74.82134 };
    const { getByTestId } = render(
      <NativeQuillaMap
        mode="car"
        center={{ latitude: 10.9878, longitude: -74.7889 }}
        routePoints={[
          { id: 'a', latitude: 10.9878, longitude: -74.7889 },
          { id: 'b', ...destination },
        ]}
        destinationCoordinate={destination}
        showDefaultShadeZones={false}
      />
    );

    expect(getByTestId('quillamap-native-route').props.style.lineColor).toBe(
      NAVIGATION_VISUAL_IDENTITY.activeRoute
    );
    expect(getByTestId('quillamap-native-destination-marker')).toBeTruthy();
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
    expect(getByTestId('quillamap-native-shadow-draft-marker').props.style.textColor).toBe(tw.color('secondary'));
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
    expect(getByText('Monumento urbano\nUrban monument')).toBeTruthy();
  });

  it('abre la tarjeta de lugar desde la capa nativa en modo turista', () => {
    const onPlacePress = jest.fn<void, [PlaceMapFeature]>();

    const { getByTestId, getByText } = render(
      <NativeQuillaMap
        mode="tourist"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
        onPlacePress={onPlacePress}
      />
    );

    fireEvent.press(getByTestId('quillamap-native-places-source'));

    expect(onPlacePress).toHaveBeenCalledWith(places[0]);
    expect(getByTestId('place-bottom-sheet-title').props.children).toBe('Ventana al Mundo');
    expect(getByText('Monumento urbano\nUrban monument')).toBeTruthy();
  });

  it('muestra la tarjeta de lugar con superficie oscura y borde dorado en modo oscuro', () => {
    const sandGold = tw.color(PLACES_VISUAL_IDENTITY.sandGold.token) ?? PLACES_VISUAL_IDENTITY.sandGold.hex;
    const { getByTestId } = render(
      <NativeQuillaMap
        mode="tourist"
        themeMode="dark"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
      />
    );

    fireEvent.press(getByTestId('quillamap-native-places-source'));

    expect(getByTestId('place-bottom-sheet').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          backgroundColor: '#111B2A',
          borderTopColor: sandGold,
        }),
      ])
    );
    expect(getByTestId('place-bottom-sheet-title').props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ color: sandGold }),
      ])
    );
  });

  it('abre la tarjeta multimedia de lugares en modo peaton nativo', () => {
    const onNativePlacePress = jest.fn<void, [PlaceMapFeature]>();

    const native = render(
      <NativeQuillaMap
        mode="pedestrian"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
        onPlacePress={onNativePlacePress}
      />
    );

    fireEvent.press(native.getByTestId('quillamap-native-places-source'));

    expect(onNativePlacePress).toHaveBeenCalledWith(places[0]);
    expect(native.getByTestId('place-bottom-sheet')).toBeTruthy();
  });

  it('cierra la tarjeta del lugar al tocar herramientas de perfil en web y nativo', () => {
    const profileTools = <Pressable testID="profile-action" />;
    const web = render(
      <WebQuillaMap
        mode="tourist"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
        profileTools={profileTools}
      />
    );

    fireEvent.press(web.getByTestId('quillamap-web-place-marker-tourist-ventana-al-mundo'));
    expect(web.getByTestId('place-bottom-sheet')).toBeTruthy();

    fireEvent(web.getByTestId('quillamap-profile-tools-slot'), 'touchStart');
    expect(web.queryByTestId('place-bottom-sheet')).toBeNull();

    const native = render(
      <NativeQuillaMap
        mode="pedestrian"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
        profileTools={profileTools}
      />
    );

    fireEvent.press(native.getByTestId('quillamap-native-places-source'));
    expect(native.getByTestId('place-bottom-sheet')).toBeTruthy();

    fireEvent(native.getByTestId('quillamap-profile-tools-slot'), 'touchStart');
    expect(native.queryByTestId('place-bottom-sheet')).toBeNull();
  });

  it('bloquea la tarjeta de lugares en modos de conduccion', () => {
    const onPlacePress = jest.fn<void, [PlaceMapFeature]>();

    const web = render(
      <WebQuillaMap
        mode="car"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
        onPlacePress={onPlacePress}
      />
    );
    const native = render(
      <NativeQuillaMap
        mode="motorcycle"
        center={{ latitude: 11.01902, longitude: -74.82134 }}
        places={places}
        showDefaultShadeZones={false}
        onPlacePress={onPlacePress}
      />
    );

    fireEvent.press(web.getByTestId('quillamap-web-place-marker-tourist-ventana-al-mundo'));
    fireEvent.press(native.getByTestId('quillamap-native-places-source'));

    expect(onPlacePress).not.toHaveBeenCalled();
    expect(web.queryByTestId('place-bottom-sheet')).toBeNull();
    expect(native.queryByTestId('place-bottom-sheet')).toBeNull();
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
    expect(native.getByTestId('quillamap-native-places-source').props.shape.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          properties: expect.objectContaining({
            id: 'tourist-ventana-al-mundo',
            icon: '\u2692',
            iconName: 'construct-outline',
          }),
        }),
      ])
    );
    expect(web.queryByTestId('quillamap-web-building-extrusion-tourist-ventana-al-mundo')).toBeNull();
    expect(native.queryByTestId('quillamap-native-buildings-source')).toBeNull();

    fireEvent.press(web.getByTestId('quillamap-web-perspective-toggle'));
    fireEvent.press(native.getByTestId('quillamap-native-perspective-toggle'));

    expect(native.getByTestId('quillamap-native-buildings-source').props.shape.features[0].properties.height).toBe(47);
    expect(native.getByTestId('quillamap-native-building-extrusions').props.style.fillExtrusionHeight).toEqual(['get', 'height']);
    expect(native.getByTestId('quillamap-native-building-outline')).toBeTruthy();
    expect(native.getByTestId('quillamap-native-building-extrusions').props.style.fillExtrusionColor).toEqual(['get', 'color']);
    expect(native.getByTestId('quillamap-native-building-extrusions').props.style.fillExtrusionOpacity).toBe(0.88);
    expect(native.getByTestId('quillamap-native-building-outline').props.style.lineColor).toEqual(['get', 'color']);
  });
});
