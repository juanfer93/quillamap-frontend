import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { authApi } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import { NavigationContainer } from '@react-navigation/native';

// 1. Mocks de dependencias externas
jest.mock('@/api/client', () => ({
  authApi: {
    register: jest.fn(),
  },
}));

// Mock del store de autenticación
const mockSetSession = jest.fn();
jest.mock('@/store/useAuthStore', () => ({
  useAuthStore: (selector: any) => selector({ setSession: mockSetSession }),
}));

// Mock de navegación
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Spy para las alertas de React Native
const alertSpy = jest.spyOn(Alert, 'alert');

describe('RegisterScreen Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderScreen = () => 
    render(
      <NavigationContainer>
        <RegisterScreen />
      </NavigationContainer>
    );

  test('debe registrar exitosamente a un Peatón (camino feliz)', async () => {
    (authApi.register as jest.Mock).mockResolvedValueOnce({
      accessToken: 'fake-token',
      user: { id: '1', full_name: 'Juan Pacheco', email: 'juan@test.com' },
    });

    const { getByText, getByPlaceholderText } = renderScreen();

    // Paso 1: Seleccionar Peatón
    fireEvent.press(getByText('Peatón'));

    // Paso 4 (Directo): Llenar datos de usuario
    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'Juan Pacheco');
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), '123456');

    fireEvent.press(getByText('Finalizar Registro'));

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith(expect.objectContaining({
        full_name: 'Juan Pacheco',
        mobility_mode: 'peaton',
      }));
      expect(mockSetSession).toHaveBeenCalledWith('fake-token', expect.any(Object));
      expect(getByText('¡Bienvenido Juan Pacheco! Tu registro ha sido exitoso.')).toBeTruthy();
    });
  });

  test('debe bloquear el avance si la placa es inválida en modo Carro', async () => {
    const { getByText, queryByPlaceholderText } = renderScreen();

    // Paso 1: Carro
    fireEvent.press(getByText('Carro'));
    
    // Paso 2: Particular
    fireEvent.press(getByText('Particular'));

    // Paso 3: Intentar seguir sin placa
    fireEvent.press(getByText('Siguiente'));

    // Verificar alerta de placa
    expect(alertSpy).toHaveBeenCalledWith("Atención", "Por favor ingresa una placa válida.");
    
    // Verificar que NO estamos en el paso 4 (UserDetails)
    expect(queryByPlaceholderText('Nombre completo')).toBeNull();
  });

  test('debe mostrar error de Zod si los datos de usuario son inválidos', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    // Llegar al final como Peatón
    fireEvent.press(getByText('Peatón'));

    // Llenar datos con errores (password muy corto y nombre vacío)
    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'J');
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'invalido');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), '123');

    fireEvent.press(getByText('Finalizar Registro'));

    // Verificar que Zod detiene el proceso antes del API
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Datos incompletos", expect.any(String));
      expect(authApi.register).not.toHaveBeenCalled();
    });
  });

  test('debe manejar errores del servidor correctamente', async () => {
    (authApi.register as jest.Mock).mockRejectedValueOnce({
      response: { data: { message: 'El correo ya está registrado' } },
    });

    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.press(getByText('Peatón'));

    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'Juan Pacheco');
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'juan@error.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), '123456');

    fireEvent.press(getByText('Finalizar Registro'));

    await waitFor(() => {
      expect(getByText('El correo ya está registrado')).toBeTruthy();
    });
  });
});