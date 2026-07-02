import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getAuthStorage } from '../authStorage';

const setPlatform = (os: typeof Platform.OS) => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    get: () => os,
  });
};

describe('getAuthStorage', () => {
  const originalLocalStorage = globalThis.localStorage;

  afterEach(() => {
    setPlatform('ios');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
    });
    jest.clearAllMocks();
  });

  it('usa localStorage cuando la plataforma es web', () => {
    const localStorageMock = {
      getItem: jest.fn(() => 'stored-session'),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };

    setPlatform('web');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });

    const storage = getAuthStorage();

    expect(storage.getItem('quillamap-auth')).toBe('stored-session');
    storage.setItem('quillamap-auth', 'token');
    storage.removeItem('quillamap-auth');

    expect(localStorageMock.getItem).toHaveBeenCalledWith('quillamap-auth');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('quillamap-auth', 'token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('quillamap-auth');
  });

  it('usa AsyncStorage en movil', () => {
    setPlatform('android');

    const storage = getAuthStorage();

    expect(storage).toBe(AsyncStorage);
  });
});
