import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { authApi } from '@/api/client';
import { RegisterResponse } from '@/features/auth/types/auth.types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';

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

// Mock colors
jest.mock('@/constants/theme', () => ({
  corporateColors: {
    black: '#000000',
    lightGray: '#F5F5F5',
    white: '#FFFFFF',
    sharkBlue: '#212124',
  },
}));

describe('RegisterScreen Integration Flow', () => {

  beforeEach(() => {
    (authApi.register as jest.Mock).mockClear();
  });

  // TEST 1: PEATÓN
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

    fireEvent.press(getByText('Peatón'));

    const nameInput = getByPlaceholderText('Nombre completo');
    const emailInput = getByPlaceholderText('Correo electrónico');
    const passwordInput = getByPlaceholderText('Contraseña');
    const submitButton = getByText('Finalizar Registro');

    const testUserPayload = {
      full_name: 'Test Pedestrian',
      email: 'pedestrian@test.com',
      password: 'password123',
    };

    fireEvent.changeText(nameInput, testUserPayload.full_name);
    fireEvent.changeText(emailInput, testUserPayload.email);
    fireEvent.changeText(passwordInput, testUserPayload.password);

    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledTimes(1);
    });

    // Aserción del Peatón (espera undefined en vehículos)
    expect(authApi.register).toHaveBeenCalledWith({
      full_name: testUserPayload.full_name,
      email: testUserPayload.email,
      password: testUserPayload.password,
      mobility_mode: 'peaton',
      vehicle_type: undefined,
      license_plate: undefined,
    });

    const successMessage = await findByText(`¡Bienvenido ${testUserPayload.full_name}! Tu registro ha sido exitoso.`);
    expect(successMessage).toBeTruthy();
  });

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

    const plateInput = getByPlaceholderText('Placa del vehículo');
    fireEvent.changeText(plateInput, 'XYZ-789');
    fireEvent.press(getByText('Siguiente'));

    const nameInput = getByPlaceholderText('Nombre completo');
    const emailInput = getByPlaceholderText('Correo electrónico');
    const passwordInput = getByPlaceholderText('Contraseña');
    const submitButton = getByText('Finalizar Registro');

    const testUserPayload = {
        full_name: 'Test Driver',
        email: 'driver@test.com',
        password: 'password123',
    };

    fireEvent.changeText(nameInput, testUserPayload.full_name);
    fireEvent.changeText(emailInput, testUserPayload.email);
    fireEvent.changeText(passwordInput, testUserPayload.password);

    fireEvent.press(submitButton);

    await waitFor(() => {
        expect(authApi.register).toHaveBeenCalledTimes(1);
    });

    // Aserción del Vehículo (espera carro, particular y placa)
    expect(authApi.register).toHaveBeenCalledWith({
      full_name: testUserPayload.full_name,
      email: testUserPayload.email,
      password: testUserPayload.password,
      mobility_mode: 'carro',
      vehicle_type: 'particular',
      license_plate: 'XYZ-789',
    });

    const successMessage = await findByText(`¡Bienvenido ${testUserPayload.full_name}! Tu registro ha sido exitoso.`);
    expect(successMessage).toBeTruthy();
  });
});