import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { authApi } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { NavigationContainer } from '@react-navigation/native';

// Aumentamos el tiempo de espera para evitar errores de timeout en renders pesados
jest.setTimeout(20000);

// Mocks de dependencias
jest.mock('@/api/client', () => ({
  authApi: { register: jest.fn() },
}));

const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe('RegisterScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpiamos el store antes de cada prueba
    useAuthStore.getState().signOut();
  });

  const renderScreen = () => 
    render(
      <NavigationContainer>
        <RegisterScreen />
      </NavigationContainer>
    );

  test('debe completar el flujo de Peatón y registrar exitosamente', async () => {
    const mockResponse = {
      accessToken: 'token-peaton',
      user: { id: '1', full_name: 'Juan Pacheco', email: 'juan@test.com' }
    };
    (authApi.register as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { getByText, getByPlaceholderText } = renderScreen();

    // Paso 1: Seleccionar Peatón
    fireEvent.press(getByText('Peatón'));

    // Paso 4: Datos de usuario
    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'Juan Pacheco');
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), '123456');

    fireEvent.press(getByText('Finalizar Registro'));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith(expect.objectContaining({
        mobility_mode: 'peaton'
      }));
      expect(useAuthStore.getState().session).toBe('token-peaton');
      expect(getByText(/registro ha sido exitoso/i)).toBeTruthy();
    }, { timeout: 5000 });
  });

  test('debe bloquear el avance en LicensePlateStep si la placa es corta', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByPlaceholderText, queryByPlaceholderText } = renderScreen();

    // Flujo Carro -> Particular -> Placa
    fireEvent.press(getByText('Carro'));
    fireEvent.press(getByText('Particular'));
    
    const inputPlaca = getByPlaceholderText('Ej: ABC-12D');
    fireEvent.changeText(inputPlaca, 'ABC'); // Placa muy corta

    fireEvent.press(getByText('Siguiente'));

    expect(alertSpy).toHaveBeenCalledWith("Atención", "Por favor ingresa una placa válida.");
    // Verificar que no avanzó al paso 4
    expect(queryByPlaceholderText('Nombre completo')).toBeNull();
  });

  test('debe validar errores de Zod en el último paso', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.press(getByText('Peatón'));

    // Llenamos el nombre para que Zod pase esa validación y evalúe el correo
    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'Juan Pacheco');
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'correo-invalido');
    
    fireEvent.press(getByText('Finalizar Registro'));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Datos incompletos", "Ingresa un correo electrónico válido");
      expect(authApi.register).not.toHaveBeenCalled();
    });
  });
});