import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { useAuthStore } from '@/store/useAuthStore';

// Mocks mínimos de sistema (AsyncStorage y Navigation)
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

// CONFIGURACIÓN DE API REAL
process.env.EXPO_PUBLIC_API_URL = 'http://192.168.1.10:3000/api';

describe('PRUEBA E2E REAL - Registro QuillaMap', () => {
  test('Debe registrar un usuario real en el Backend y recibir el token', async () => {
    // Email único para no chocar con registros anteriores en Supabase
    const emailDinamico = `test_${Date.now()}@quillamap.com`;
    
    const { getByText, getByPlaceholderText, findByText } = render(<RegisterScreen />);

    // 1. Flujo de selección
    fireEvent.press(getByText('Peatón'));

    // 2. Llenado de datos reales
    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'Juan Test E2E');
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), emailDinamico);
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'password123');

    // 3. Envío al Backend
    fireEvent.press(getByText('Finalizar Registro'));

    // 4. Verificación (Esperamos 20s porque el disco está al 100%)
    const successMessage = await findByText(/registro ha sido exitoso/i, {}, { timeout: 20000 });
    expect(successMessage).toBeTruthy();

    // 5. Validar que Zustand guardó la sesión real
    const session = useAuthStore.getState().session;
    console.log('🚀 Resultado E2E - Token Recibido:', session ? 'SÍ' : 'NO');
    expect(session).not.toBeNull();
  }, 25000);
});