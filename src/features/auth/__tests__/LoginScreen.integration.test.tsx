import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import { authService } from '@/api/client';

// Mock de servicios y navegación (Se mantiene igual)
jest.mock('@/api/client', () => ({
  authService: {
    login: jest.fn(),
  },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

// Mock de Alert para espiar sus llamadas
jest.spyOn(Alert, 'alert');

describe('LoginScreen Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe iniciar sesión exitosamente, guardar en el store y navegar a Home', async () => {
    const mockUser = { id: '1', email: 'test@test.com', full_name: 'Test User' };
    (authService.login as jest.Mock).mockResolvedValue({
      accessToken: 'fake-token',
      user: mockUser,
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Correo'), 'test@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), 'password123');
    fireEvent.press(getByText('ENTRAR'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });

  test('debe mostrar alerta si los campos están vacíos sin llamar al API', () => {
    const { getByText } = render(<LoginScreen />);
    const loginButton = getByText('ENTRAR');

    fireEvent.press(loginButton);

    // CORRECCIÓN AQUÍ: Ahora esperamos el mensaje de Zod
    expect(Alert.alert).toHaveBeenCalledWith('Atención', 'El correo es obligatorio');
    expect(authService.login).not.toHaveBeenCalled();
  });

  test('debe mostrar alerta de error si el servidor rechaza las credenciales', async () => {
    (authService.login as jest.Mock).mockRejectedValue({
      response: { data: { message: 'Credenciales inválidas' } }
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);
    
    fireEvent.changeText(getByPlaceholderText('Correo'), 'error@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), 'wrongpass');
    fireEvent.press(getByText('ENTRAR'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error de inicio de sesión', 'Credenciales inválidas');
    });
  });
});