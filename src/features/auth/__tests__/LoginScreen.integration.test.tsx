import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import { authService } from '@/api/client';

// Mock de API
jest.mock('@/api/client', () => ({
  authService: { login: jest.fn() },
  authApi: { register: jest.fn() },
}));

// Mock de navegación (AÑADIDO PARA SOLUCIONAR EL ERROR)
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

describe('LoginScreen - Integración', () => {
  it('debe realizar el login correctamente', async () => {
    (authService.login as jest.Mock).mockResolvedValue({
      accessToken: 'token-123',
      user: { email: 'juan@test.com' }
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), '123456');
    fireEvent.press(getByText('ENTRAR'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('juan@test.com', '123456');
    });
  });
});