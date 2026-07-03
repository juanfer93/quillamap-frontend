import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import type { StateStorage } from 'zustand/middleware';

export const AUTH_STORAGE_KEY = 'quillamap-auth';
const KEYCHAIN_SERVICE = 'quillamap.auth.session';

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

export const getKeychainAuthStorage = (): StateStorage => ({
  getItem: async () => {
    const credentials = await Keychain.getGenericPassword({
      service: KEYCHAIN_SERVICE,
    });

    return credentials ? credentials.password : null;
  },
  setItem: async (name, value) => {
    await Keychain.setGenericPassword(name, value, {
      service: KEYCHAIN_SERVICE,
    });
  },
  removeItem: async () => {
    await Keychain.resetGenericPassword({
      service: KEYCHAIN_SERVICE,
    });
  },
});

export const getAuthStorage = (): StateStorage => {
  if (Platform.OS === 'web') {
    return getWebLocalStorage() ?? AsyncStorage;
  }

  return getKeychainAuthStorage();
};

export const clearAuthStorage = async (): Promise<void> => {
  const storage = getAuthStorage();
  await storage.removeItem(AUTH_STORAGE_KEY);
};
