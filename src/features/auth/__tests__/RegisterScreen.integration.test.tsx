import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { authApi } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore'; 
import { NavigationContainer } from '@react-navigation/native';

// 1. Mocks de dependencias
jest.mock('@/api/client', () => ({
  authApi: {
    register: jest.fn(),
  },
}));

// Mock de Navegación
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Espía para las alertas
const alertSpy = jest.spyOn(Alert, 'alert');

describe('RegisterScreen Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // CORRECCIÓN 1: Usar signOut() en lugar de logout()
    useAuthStore.getState().signOut();
  });

  const renderScreen = () =>
    render(
      <NavigationContainer>
        <RegisterScreen />
      </NavigationContainer>
    );

  test('debe registrar, guardar en useAuthStore y navegar a Home cuando los datos son válidos', async () => {
    const mockUser = { id: '123', full_name: 'Juan Fernando', email: 'juan@test.com' };
    const mockToken = 'fake-jwt-token';
    
    (authApi.register as jest.Mock).mockResolvedValueOnce({
      accessToken: mockToken,
      user: mockUser,
    });

    const { getByText, getByPlaceholderText } = renderScreen();

    // Paso 1: Peatón
    fireEvent.press(getByText('Peatón'));

    // Paso 4: Datos
    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'Juan Fernando');
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), '123456');

    fireEvent.press(getByText('Finalizar Registro'));

    await waitFor(() => {
      // VALIDACIÓN 1: El API se llamó
      expect(authApi.register).toHaveBeenCalled();

      // VALIDACIÓN 2: Verificamos el estado del store
      const storeState = useAuthStore.getState();
      // CORRECCIÓN 2: Usar session en lugar de token
      expect(storeState.session).toBe(mockToken);
      expect(storeState.user?.full_name).toBe('Juan Fernando');

      // VALIDACIÓN 3: Navegación
      expect(mockNavigate).toHaveBeenCalledWith('Home');
    });
  });

  test('debe bloquear el avance si falta la placa en modo vehículo', async () => {
    const { getByText, queryByPlaceholderText } = renderScreen();

    fireEvent.press(getByText('Carro'));
    fireEvent.press(getByText('Particular'));
    
    // Intentar seguir sin escribir placa
    fireEvent.press(getByText('Siguiente'));

    expect(alertSpy).toHaveBeenCalledWith("Atención", "Por favor ingresa una placa válida.");
    expect(queryByPlaceholderText('Nombre completo')).toBeNull();
  });

  test('debe mostrar errores de Zod si los campos no cumplen requisitos', async () => {
    const { getByText, getByPlaceholderText } = renderScreen();

    fireEvent.press(getByText('Peatón'));

    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'Ju');
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'no-email');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), '123');

    fireEvent.press(getByText('Finalizar Registro'));

    await waitFor(() => {
      expect(authApi.register).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith("Datos incompletos", expect.any(String));
    });
  });
});