import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, NativeModules } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import { authService } from '@/api/client';
import { useAuthStore } from '@/store/useAuthStore';

// 1. MOCK DE ASYNC STORAGE (Vital para evitar el error de "Native module is null")
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve(null)),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve(null)),
  clear: jest.fn(() => Promise.resolve(null)),
}));

// 2. MOCK DE ANIMACIONES (Para eliminar los avisos de 'act')
NativeModules.UIManager = NativeModules.UIManager || {
  setLayoutAnimationEnabledExperimental: jest.fn(),
};
jest.mock('react-native/Libraries/LayoutAnimation/LayoutAnimation', () => ({
  configureNext: jest.fn(),
  Presets: { easeInEaseOut: 'easeInEaseOut' },
}));

// Mock de servicios
jest.mock('@/api/client', () => ({
  authService: {
    login: jest.fn(),
  },
}));

// Mock de navegación
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Espiamos el Alert
jest.spyOn(Alert, 'alert');

describe('LoginScreen Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Manejo de timers para cerrar el test limpiamente
    
    // Reseteamos el store a un estado inicial limpio antes de cada test
    act(() => {
      useAuthStore.setState({ 
        session: null, 
        user: null, 
        isLoading: false 
      });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Test 1: Éxito (Aumentamos timeout a 30s)
  test('debe iniciar sesión exitosamente, guardar en el store y navegar a Home', async () => {
    const mockUser = { id: '1', email: 'test@test.com', full_name: 'Juan Pacheco' };
    (authService.login as jest.Mock).mockResolvedValue({
      accessToken: 'fake-jwt-token',
      user: mockUser,
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Correo'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), 'password123');
    
    // Usamos regex /entrar/i para mayor robustez
    fireEvent.press(getByText(/entrar/i));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@test.com', 'password123');
    });

    // Validamos que el store se actualizó correctamente
    const state = useAuthStore.getState();
    expect(state.session).toBe('fake-jwt-token');
    expect(state.user).toEqual(mockUser);
    
    expect(mockNavigate).toHaveBeenCalledWith('Home');
    
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
  }, 30000);

  // Test 2: Validación Zod (Campos vacíos)
  test('debe mostrar alerta si los campos están vacíos sin llamar al API', () => {
    const { getByText } = render(<LoginScreen />);
    
    fireEvent.press(getByText(/entrar/i));

    // Verificamos el mensaje que definimos en el esquema de Zod
    expect(Alert.alert).toHaveBeenCalledWith('Atención', 'El correo es obligatorio');
    expect(authService.login).not.toHaveBeenCalled();
    
    act(async () => {
      jest.runOnlyPendingTimers();
    });
  }, 30000);

  // Test 3: Error de servidor
  test('debe mostrar alerta de error si el servidor rechaza las credenciales', async () => {
    const errorMessage = 'Credenciales inválidas';
    (authService.login as jest.Mock).mockRejectedValue({
      response: { data: { message: errorMessage } }
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Correo'), 'error@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), 'wrongpass');
    
    fireEvent.press(getByText(/entrar/i));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error de inicio de sesión', errorMessage);
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
  }, 30000);
});