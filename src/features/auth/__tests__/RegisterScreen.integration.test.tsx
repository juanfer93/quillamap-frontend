import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { authApi } from '@/api/client';
import { RegisterResponse } from '@/features/auth/types/auth.types';

// Mock AsyncStorage with an inline mock
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

// Set up environment variables
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';

// Mock the API client
jest.mock('@/api/client', () => ({
  authApi: {
    register: jest.fn(),
  },
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock colors to prevent style-related test failures
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
    // Clear mock history before each test
    (authApi.register as jest.Mock).mockClear();
  });

  test('should handle the pedestrian registration flow correctly', async () => {
    // Arrange: Mock a successful API response
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

    // 1. MobilityStep: Select a pedestrian option
    fireEvent.press(getByText('Peatón'));

    // 2. UserDetailsStep: The form should now be visible
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

    // 3. Submit the form
    fireEvent.press(submitButton);

    // 4. Assertions: Check if authApi.register was called correctly
    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledTimes(1);
    });

    expect(authApi.register).toHaveBeenCalledWith({
      full_name: testUserPayload.full_name,
      email: testUserPayload.email,
      password: testUserPayload.password,
      mobility_mode: 'peaton',
    });

    // Check if success message is shown
    const successMessage = await findByText(`¡Bienvenido ${testUserPayload.full_name}! Tu registro ha sido exitoso.`);
    expect(successMessage).toBeTruthy();
  }, 10000);

  test('should handle the vehicle registration flow correctly', async () => {
    // Arrange: Mock a successful API response
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

    // 1. MobilityStep: Select "Carro"
    fireEvent.press(getByText('Carro'));

    // 2. CarTypeStep: Select "Particular"
    fireEvent.press(getByText('Particular'));

    // 3. LicensePlateStep: Enter license plate
    const plateInput = getByPlaceholderText('Placa del vehículo');
    fireEvent.changeText(plateInput, 'XYZ-789');
    fireEvent.press(getByText('Siguiente'));

    // 4. UserDetailsStep: Fill user details
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

    // 5. Submit the form
    fireEvent.press(submitButton);

    // 6. Assertions
    await waitFor(() => {
        expect(authApi.register).toHaveBeenCalledTimes(1);
    });

    expect(authApi.register).toHaveBeenCalledWith({
      full_name: testUserPayload.full_name,
      email: testUserPayload.email,
      password: testUserPayload.password,
      mobility_mode: 'carro',
      vehicle_type: 'particular',
      license_plate: 'XYZ-789',
    });

    // Check if success message is shown
    const successMessage = await findByText(`¡Bienvenido ${testUserPayload.full_name}! Tu registro ha sido exitoso.`);
    expect(successMessage).toBeTruthy();
  });
});
