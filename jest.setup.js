process.env.EXPO_OS = 'ios';
process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.26:3000/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn(() => Promise.resolve([])),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
  multiMerge: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve(false)),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }) => React.createElement(Text, null, name),
    MaterialIcons: ({ name }) => React.createElement(Text, null, name),
    FontAwesome: ({ name }) => React.createElement(Text, null, name),
  };
});

jest.mock('@maplibre/maplibre-react-native', () => {
  const React = require('react');
  const { Pressable, View } = require('react-native');
  const passthrough = (props) => React.createElement(View, props, props.children);

  return {
    __esModule: true,
    MapView: React.forwardRef(({ children, onPress, ...props }, ref) => {
      React.useImperativeHandle(ref, () => ({
        setCamera: jest.fn(),
      }));

      return React.createElement(
        Pressable,
        {
          ...props,
          onPress: (event) => {
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
    }),
    Camera: React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        zoomTo: jest.fn(),
      }));
      return React.createElement(View, props);
    }),
    UserLocation: passthrough,
    ShapeSource: passthrough,
    LineLayer: passthrough,
    CircleLayer: passthrough,
    FillExtrusionLayer: passthrough,
    MarkerView: ({ coordinate, children, ...props }) =>
      React.createElement(
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

import { NativeModules } from 'react-native';
NativeModules.UIManager = NativeModules.UIManager || {};
NativeModules.UIManager.setLayoutAnimationEnabledExperimental = jest.fn();

jest.mock('twrnc', () => {
    const tw = jest.requireActual('twrnc');
    tw.style = (style) => ({ color: style });
    tw.color = (color) => color;
    return tw;
});
