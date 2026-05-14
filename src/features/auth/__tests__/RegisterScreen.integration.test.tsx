import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { authApi } from '@/api/client';
import { Alert } from 'react-native';

// Mock corregido con la estructura real de client.ts
jest.mock('@/api/client', () => ({
  authService: {
    login: jest.fn(),
  },
  authApi: {
    register: jest.fn(),
  },
}));

// Mock de navegación
const mockedNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockedNavigate,
  }),
}));

describe('RegisterScreen - Flujo Completo y Validaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe completar el wizard de registro exitosamente', async () => {
    // Aquí sí usamos authApi.register porque es donde pertenece
    (authApi.register as jest.Mock).mockResolvedValue({
      accessToken: 'fake-token-123',
      user: { id: '1', full_name: 'Juan Fernando', email: 'juan@test.com' }
    });

    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    // Flujo de navegación
    fireEvent.press(getByText('Carro'));
    await waitFor(() => expect(getByText('Particular')).toBeTruthy());
    fireEvent.press(getByText('Particular'));
    
    const plateInput = getByPlaceholderText('ABC-123');
    fireEvent.changeText(plateInput, 'KRL-520');
    fireEvent.press(getByText('SIGUIENTE'));

    // Formulario Final
    await waitFor(() => expect(getByPlaceholderText('Tu nombre')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Tu nombre'), 'Juan Fernando');
    fireEvent.changeText(getByPlaceholderText('ejemplo@correo.com'), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), 'password123');

    fireEvent.press(getByText('FINALIZAR REGISTRO'));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        full_name: 'Juan Fernando',
        email: 'juan@test.com',
        password: 'password123',
        mobility_mode: 'carro',
        vehicle_type: 'particular',
        license_plate: 'KRL-520',
      });
      expect(mockedNavigate).toHaveBeenCalledWith('Home');
    });
  });
});