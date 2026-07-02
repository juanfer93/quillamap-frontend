import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

const getWebLocalStorage = (): StateStorage | null => {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }

  return {
    getItem: (name) => globalThis.localStorage.getItem(name),
    setItem: (name, value) => globalThis.localStorage.setItem(name, value),
    removeItem: (name) => globalThis.localStorage.removeItem(name),
  };
};

export const getAuthStorage = (): StateStorage => {
  if (Platform.OS === 'web') {
    return getWebLocalStorage() ?? AsyncStorage;
  }

  return AsyncStorage;
};
