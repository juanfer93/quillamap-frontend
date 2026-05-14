process.env.EXPO_OS = 'ios';
process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.10:3000/api';

jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import { NativeModules } from 'react-native';
NativeModules.UIManager = NativeModules.UIManager || {};
NativeModules.UIManager.setLayoutAnimationEnabledExperimental = jest.fn();

jest.mock('twrnc', () => {
    const tw = jest.requireActual('twrnc');
    tw.style = (style) => ({ color: style });
    tw.color = (color) => color;
    return tw;
});