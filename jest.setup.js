process.env.EXPO_OS = 'ios';
process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.10:3000/api';

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

import { NativeModules } from 'react-native';
NativeModules.UIManager = NativeModules.UIManager || {};
NativeModules.UIManager.setLayoutAnimationEnabledExperimental = jest.fn();

jest.mock('twrnc', () => {
    const tw = jest.requireActual('twrnc');
    tw.style = (style) => ({ color: style });
    tw.color = (color) => color;
    return tw;
});