import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import LoginScreen from '../screens/LoginScreen';
import { authService } from '@/api/client';

jest.mock('@/api/client', () => ({
  authService: { login: jest.fn() },
  authApi: { register: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
}));

describe('LoginScreen - Integracion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe realizar el login correctamente', async () => {
    jest.mocked(authService.login).mockResolvedValue({
      accessToken: 'token-123',
      user: {
        id: 'profile-1',
        full_name: 'Juan Tester',
        email: 'juan@test.com',
      },
    });

    const { getByPlaceholderText, getByText } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText(/Correo/), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), '123456');
    fireEvent.press(getByText(/entrar/i));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('juan@test.com', '123456');
    });
  });

  it('muestra un error visible cuando backend rechaza credenciales invalidas', async () => {
    jest.mocked(authService.login).mockRejectedValue({
      isAxiosError: true,
      response: {
        data: {
          message: 'Credenciales invalidas',
        },
      },
    });

    const { getByPlaceholderText, getByText, getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText(/Correo/), 'juan@test.com');
    fireEvent.changeText(getByPlaceholderText('********'), '123456');
    fireEvent.press(getByText(/entrar/i));

    await waitFor(() => {
      expect(getByTestId('login-form-error').props.children).toBe('Credenciales invalidas');
    });
  });

  it('muestra errores de validacion sin llamar al backend', () => {
    const { getByPlaceholderText, getByText, getByTestId } = render(<LoginScreen />);

    fireEvent.changeText(getByPlaceholderText(/Correo/), 'correo-invalido');
    fireEvent.changeText(getByPlaceholderText('********'), '123');
    fireEvent.press(getByText(/entrar/i));

    expect(getByTestId('login-email-error').props.children).toBe('Ingresa un correo electronico valido');
    expect(getByTestId('login-password-error').props.children).toBe('La contrasena debe tener al menos 6 caracteres');
    expect(authService.login).not.toHaveBeenCalled();
  });
});
