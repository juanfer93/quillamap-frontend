import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { authApi } from '@/api/client';
import { Alert } from 'react-native';

// Mock de API
jest.mock('@/api/client', () => ({
  authService: { login: jest.fn() },
  authApi: { register: jest.fn() },
}));

// Mock de navegación (IMPORTANTE)
const mockedNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockedNavigate,
  }),
}));

describe('RegisterScreen - Flujo Completo', () => {
  it('debe completar el wizard de registro exitosamente', async () => {
    (authApi.register as jest.Mock).mockResolvedValue({
      accessToken: 'fake-token',
      user: { id: '1', full_name: 'Juan', email: 'j@t.com' }
    });

    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    // Paso 1
    fireEvent.press(getByText('Carro'));

    // Paso 2
    await waitFor(() => expect(getByText('Particular')).toBeTruthy());
    fireEvent.press(getByText('Particular'));

    // Paso 3: CORREGIDO EL PLACEHOLDER Y EL BOTÓN
    await waitFor(() => expect(getByPlaceholderText('Ej: ABC-12D')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Ej: ABC-12D'), 'KRL-520');
    fireEvent.press(getByText('Siguiente')); // Antes decía SIGUIENTE

    // Paso 4
    await waitFor(() => expect(getByPlaceholderText('Tu nombre')).toBeTruthy());
    fireEvent.changeText(getByPlaceholderText('Tu nombre'), 'Juan Fernando');
    fireEvent.changeText(getByPlaceholderText('ejemplo@correo.com'), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), 'password123');

    fireEvent.press(getByText('FINALIZAR REGISTRO'));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith('Home');
    });
  });
});