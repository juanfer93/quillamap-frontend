import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { useAuthStore } from '@/store/useAuthStore';

// Mocks mínimos para el entorno (no afectan la petición HTTP real)
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// CONFIGURACIÓN DE API REAL (IP del entorno de desarrollo local)
process.env.EXPO_PUBLIC_API_URL = '[http://192.168.1.10:3000/api](http://192.168.1.10:3000/api)';

describe('PRUEBA E2E REAL - Registro QuillaMap', () => {
  test('Debe registrar un usuario real en el Backend y recibir el token', async () => {
    const emailDinamico = `test_${Date.now()}@quillamap.com`;
    
    const { getByText, getByPlaceholderText, findByText } = render(<RegisterScreen />);

    // 1. Selección
    fireEvent.press(getByText('Peatón'));

    // 2. Datos Reales
    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'Juan Test E2E');
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), emailDinamico);
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'password123');

    // 3. Disparo al Backend
    fireEvent.press(getByText('Finalizar Registro'));

    // 4. Verificación (45s de espera por lentitud del disco)
    const successMessage = await findByText(/registro ha sido exitoso/i, {}, { timeout: 45000 });
    expect(successMessage).toBeTruthy();

    // 5. Validar Zustand
    const session = useAuthStore.getState().session;
    console.log('🚀 Resultado E2E - Token Recibido:', session ? 'SÍ' : 'NO');
    expect(session).not.toBeNull();
  }, 60000); // 60 segundos de timeout total para Jest
});