import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import { authService } from '@/api/client'; // Cambiado de authApi a authService

// Mock corregido con la estructura real
jest.mock('@/api/client', () => ({
  authService: {
    login: jest.fn(), // login vive en authService
  },
  authApi: {
    register: jest.fn(), // register vive en authApi
  },
}));

describe('LoginScreen - Validación e Integración', () => {
  it('debe realizar el login correctamente', async () => {
    // Usamos authService.login para el mock
    (authService.login as jest.Mock).mockResolvedValue({
      accessToken: 'token-valido',
      user: { email: 'juan@test.com' }
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), '123456');
    fireEvent.press(getByText('ENTRAR'));

    await waitFor(() => {
      // Verificamos la llamada en authService
      expect(authService.login).toHaveBeenCalledWith('juan@test.com', '123456');
    });
  });
});