import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NativeModules } from 'react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { authApi } from '@/api/client';
import { RegisterResponse } from '@/features/auth/types/auth.types';

// 1. Mock de LayoutAnimation y otros módulos nativos para ahorrar CPU
NativeModules.UIManager = NativeModules.UIManager || {
  setLayoutAnimationEnabledExperimental: jest.fn(),
};

jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation', () => ({
  ...jest.requireActual('react-native/Libraries/LayoutAnimation/LayoutAnimation'),
  configureNext: jest.fn(),
  Presets: {
    easeInEaseOut: 'easeInEaseOut',
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

// Mock del API client
jest.mock('@/api/client', () => ({
  authApi: {
    register: jest.fn(),
  },
}));

// Mock de navegación
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

describe('RegisterScreen Integration Flow', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Maneja los setTimeout de navegación
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // TEST 1: PEATÓN (Aumentamos timeout a 30s por el disco duro)
  test('should handle the pedestrian registration flow correctly', async () => {
    const mockUser = {
      id: '1',
      full_name: 'Test Pedestrian',
      email: 'pedestrian@test.com',
      mobility_mode: 'peaton' as const,
    };
    const mockResponse: RegisterResponse = {
      user: mockUser,
      accessToken: 'fake-jwt-token',
    };
    (authApi.register as jest.Mock).mockResolvedValue(mockResponse);

    const { getByText, getByPlaceholderText, findByText } = render(<RegisterScreen />);

    // Navegar
    fireEvent.press(getByText('Peatón'));

    const testUserPayload = {
      full_name: 'Test Pedestrian',
      email: 'pedestrian@test.com',
      password: 'password123',
    };

    fireEvent.changeText(getByPlaceholderText('Nombre completo'), testUserPayload.full_name);
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), testUserPayload.email);
    fireEvent.changeText(getByPlaceholderText('Contraseña'), testUserPayload.password);

    fireEvent.press(getByText('Finalizar Registro'));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        full_name: testUserPayload.full_name,
        email: testUserPayload.email,
        password: testUserPayload.password,
        mobility_mode: 'peaton',
        vehicle_type: undefined,
        license_plate: undefined,
      });
    });

    const successMessage = await findByText(`¡Bienvenido ${testUserPayload.full_name}! Tu registro ha sido exitoso.`);
    expect(successMessage).toBeTruthy();
    
    // Avanzar los timers para limpiar el setTimeout de navegación
    jest.runAllTimers();
  }, 30000);

  // TEST 2: VEHÍCULO
  test('should handle the vehicle registration flow correctly', async () => {
    const mockUser = {
      id: '2',
      full_name: 'Test Driver',
      email: 'driver@test.com',
      mobility_mode: 'carro' as const,
      vehicle_type: 'particular' as const,
      license_plate: 'XYZ-789',
    };
    const mockResponse: RegisterResponse = {
      user: mockUser,
      accessToken: 'fake-jwt-token-2',
    };
    (authApi.register as jest.Mock).mockResolvedValue(mockResponse);

    const { getByText, getByPlaceholderText, findByText } = render(<RegisterScreen />);

    fireEvent.press(getByText('Carro'));
    fireEvent.press(getByText('Particular'));

    fireEvent.changeText(getByPlaceholderText('Placa del vehículo'), 'XYZ-789');
    fireEvent.press(getByText('Siguiente'));

    const testUserPayload = {
        full_name: 'Test Driver',
        email: 'driver@test.com',
        password: 'password123',
    };

    fireEvent.changeText(getByPlaceholderText('Nombre completo'), testUserPayload.full_name);
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), testUserPayload.email);
    fireEvent.changeText(getByPlaceholderText('Contraseña'), testUserPayload.password);

    fireEvent.press(getByText('Finalizar Registro'));

    await waitFor(() => {
        expect(authApi.register).toHaveBeenCalledWith({
          full_name: testUserPayload.full_name,
          email: testUserPayload.email,
          password: testUserPayload.password,
          mobility_mode: 'carro',
          vehicle_type: 'particular',
          license_plate: 'XYZ-789',
        });
    });

    const successMessage = await findByText(`¡Bienvenido ${testUserPayload.full_name}! Tu registro ha sido exitoso.`);
    expect(successMessage).toBeTruthy();
    
    jest.runAllTimers();
  }, 30000);
});