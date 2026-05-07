
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';

// Mocks para evitar el error de importación dinámica interna de Expo
jest.mock('expo/src/winter/runtime.native.ts', () => ({}));
jest.mock('expo/src/winter/installGlobal.ts', () => ({}));

// Set up environment variables
process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';

// Mock global fetch to intercept API calls
global.fetch = jest.fn();

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

// Mock colors to prevent style-related test failures
jest.mock('../../../constants/theme', () => ({
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
    (fetch as jest.Mock).mockClear();
  });

  test('should handle the pedestrian registration flow correctly', async () => {
    // Arrange: Mock a successful API response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: 'User created successfully' }),
    });

    const { getByText, getByPlaceholderText, findByText } = render(<RegisterScreen />);

    // 1. MobilityStep: Select a pedestrian option
    // Assuming the button text is "Peatón" which triggers handleVehicleTypeSelect('PEATON')
    fireEvent.press(getByText('Peatón'));

    // 2. UserDetailsStep: The form should now be visible
    const nameInput = getByPlaceholderText('Nombre completo');
    const emailInput = getByPlaceholderText('Correo electrónico');
    const passwordInput = getByPlaceholderText('Contraseña');
    const submitButton = getByText('Finalizar Registro');

    const testUser = {
      name: 'Test Pedestrian',
      email: 'pedestrian@test.com',
      password: 'password123',
    };

    fireEvent.changeText(nameInput, testUser.name);
    fireEvent.changeText(emailInput, testUser.email);
    fireEvent.changeText(passwordInput, testUser.password);

    // 3. Submit the form
    fireEvent.press(submitButton);

    // 4. Assertions: Check if fetch was called correctly
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...testUser,
          mobility_type: 'PEATON',
        }),
      }
    );

    // Check if success message is shown
    const successMessage = await findByText(`Bienvenido ${testUser.name}, estás en modo PEATON`);
    expect(successMessage).toBeTruthy();
  });

  test('should handle the vehicle registration flow correctly', async () => {
    // Arrange: Mock a successful API response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: 'User created successfully' }),
    });

    const { getByText, getByPlaceholderText, findByText } = render(<RegisterScreen />);

    // 1. MobilityStep: Select "Vehículo" (triggers handleVehicleTypeSelect with 'CARRO'))
    fireEvent.press(getByText('Vehículo'));

    // 2. CarTypeStep: Select "Automóvil" (triggers handleCarTypeSelect with 'PARTICULAR')
    fireEvent.press(getByText('Automóvil'));

    // 3. LicensePlateStep: Enter license plate
    const plateInput = getByPlaceholderText('AAA-000');
    fireEvent.changeText(plateInput, 'XYZ-789');
    fireEvent.press(getByText('Siguiente'));

    // 4. UserDetailsStep: Fill user details
    const nameInput = getByPlaceholderText('Nombre completo');
    const emailInput = getByPlaceholderText('Correo electrónico');
    const passwordInput = getByPlaceholderText('Contraseña');
    const submitButton = getByText('Finalizar Registro');
    
    const testUser = {
        name: 'Test Driver',
        email: 'driver@test.com',
        password: 'password123',
    };

    fireEvent.changeText(nameInput, testUser.name);
    fireEvent.changeText(emailInput, testUser.email);
    fireEvent.changeText(passwordInput, testUser.password);

    // 5. Submit the form
    fireEvent.press(submitButton);

    // 6. Assertions
    await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...testUser,
            mobility_type: 'CARRO',
            vehicle_type: 'PARTICULAR',
            license_plate: 'XYZ-789',
          }),
        }
    );
    
    // Check if success message is shown
    const successMessage = await findByText(`Bienvenido ${testUser.name}, estás en modo CARRO`);
    expect(successMessage).toBeTruthy();
  });
});
