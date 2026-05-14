import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import { authService } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

// Mock del cliente API
jest.mock('@/api/client', () => ({
  authService: {
    login: jest.fn(),
  },
}));

// Mock de navegación
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock del Alert de React Native
jest.spyOn(Alert, 'alert');

describe('LoginScreen Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // CORRECCIÓN: Sincronizado con tu interfaz AuthState (user, session, isLoading)
    useAuthStore.setState({ 
      session: null, 
      user: null, 
      isLoading: false 
    });
  });

  test('debe iniciar sesión exitosamente, guardar en el store y navegar a Home', async () => {
    // Usamos el usuario "Test Driver" para mantener coherencia con el test de registro
    const mockUser = {
      id: '2',
      full_name: 'Test Driver',
      email: 'driver@test.com',
      mobility_mode: 'carro' as const,
      vehicle_type: 'particular' as const,
      license_plate: 'XYZ-789',
    };
    
    // El backend devuelve accessToken, pero el store lo guarda como session
    (authService.login as jest.Mock).mockResolvedValue({
      accessToken: 'fake-jwt-token-2',
      user: mockUser,
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    const emailInput = getByPlaceholderText('Correo');
    const passwordInput = getByPlaceholderText('********');
    const loginButton = getByText('Entrar');

    fireEvent.changeText(emailInput, 'driver@test.com');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('driver@test.com', 'password123');
    });

    // CORRECCIÓN: Validamos que se guardó en 'session' según tu useAuthStore
    const authState = useAuthStore.getState();
    expect(authState.session).toBe('fake-jwt-token-2');
    expect(authState.user).toEqual(mockUser);

    expect(mockNavigate).toHaveBeenCalledWith('Home');
  });

  test('debe mostrar alerta si los campos están vacíos sin llamar al API', () => {
    const { getByText } = render(<LoginScreen />);
    
    const loginButton = getByText('Entrar');
    fireEvent.press(loginButton);

    expect(Alert.alert).toHaveBeenCalledWith('Atención', 'Por favor ingresa tus credenciales');
    expect(authService.login).not.toHaveBeenCalled();
  });

  test('debe mostrar alerta de error si el servidor rechaza las credenciales', async () => {
    const errorMessage = 'Credenciales inválidas';
    (authService.login as jest.Mock).mockRejectedValue({
      response: { data: { message: errorMessage } }
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Correo'), 'error@quillamap.com');
    fireEvent.changeText(getByPlaceholderText('********'), 'ClaveEquivocada');
    fireEvent.press(getByText('Entrar'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error de inicio de sesión', errorMessage);
    });
    
    // Validamos que el estado de sesión siga nulo
    const authState = useAuthStore.getState();
    expect(authState.session).toBeNull();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});