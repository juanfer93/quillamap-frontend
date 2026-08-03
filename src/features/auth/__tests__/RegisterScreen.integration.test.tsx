import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { authApi } from '@/api';

// Mock de API y Navegación
jest.mock('@/api', () => ({
  authService: { login: jest.fn() },
  authApi: { register: jest.fn() },
}));

const mockedNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockedNavigate,
  }),
}));

describe('RegisterScreen - Flujo Completo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Aumentamos el tiempo de espera a 30 segundos al final de la función 'it'
  it('debe completar el wizard de registro exitosamente', async () => {
    (authApi.register as jest.Mock).mockResolvedValue({
      accessToken: 'fake-token',
      user: { id: '1', full_name: 'Juan', email: 'j@t.com' }
    });

    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    // Paso 1: Movilidad
    fireEvent.press(getByText(/carro/i));

    // Paso 2: Tipo de Vehículo
    await waitFor(() => expect(getByText(/particular/i)).toBeTruthy(), { timeout: 5000 });
    fireEvent.press(getByText(/particular/i));

    // Paso 3: Placa (Usa el placeholder exacto del error)
    await waitFor(() => expect(getByPlaceholderText('Ej: ABC-12D')).toBeTruthy(), { timeout: 5000 });
    fireEvent.changeText(getByPlaceholderText('Ej: ABC-12D'), 'KRL-520');
    fireEvent.press(getByText(/siguiente/i));

    // Paso 4: Detalles de Usuario
    await waitFor(() => expect(getByPlaceholderText(/nombre/i)).toBeTruthy(), { timeout: 5000 });
    fireEvent.changeText(getByPlaceholderText(/nombre/i), 'Juan Fernando');
    fireEvent.changeText(getByPlaceholderText(/correo/i), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), 'password123');

    fireEvent.press(getByText(/finalizar registro/i));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalled();
      expect(mockedNavigate).toHaveBeenCalledWith('Home');
    }, { timeout: 10000 });
  }, 30000); 

  it('debe mostrar un aviso claro cuando el correo ya existe', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    (authApi.register as jest.Mock).mockRejectedValue({
      response: {
        data: {
          message: 'El correo ya existe. Inicia sesion o usa otro correo.',
        },
      },
    });

    const { getByText, getByPlaceholderText, findByPlaceholderText } = render(<RegisterScreen />);

    fireEvent.press(getByText(/peat/i));

    await findByPlaceholderText(/nombre/i);
    fireEvent.changeText(getByPlaceholderText(/nombre/i), 'Juan Fernando');
    fireEvent.changeText(getByPlaceholderText(/correo/i), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), 'password123');

    fireEvent.press(getByText(/finalizar registro/i));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        'No pudimos crear tu cuenta',
        'El correo ya existe. Inicia sesion o usa otro correo.',
      );
    });
    expect(authApi.register).toHaveBeenCalledWith(
      expect.objectContaining({
        mobility_mode: 'peaton',
        vehicle_type: 'peaton',
      })
    );
    expect(mockedNavigate).not.toHaveBeenCalledWith('Home');
  });
});
