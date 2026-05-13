import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { useAuthStore } from '@/store/useAuthStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(), getItem: jest.fn(), removeItem: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: jest.fn() }),
}));

describe('PRUEBA E2E REAL - Registro QuillaMap (Diagnóstico Profundo)', () => {
  test('Debe registrar al usuario o mostrar exactamente qué falló', async () => {
    const emailDinamico = `test_${Date.now()}@quillamap.com`;
    const { getByText, getByPlaceholderText, queryByText, debug } = render(<RegisterScreen />);

    fireEvent.press(getByText('Peatón'));
    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'Juan Test E2E');
    fireEvent.changeText(getByPlaceholderText('Correo electrónico'), emailDinamico);
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'password123');

    console.log('⏳ Disparando petición a NestJS...');
    fireEvent.press(getByText('Finalizar Registro'));

    try {
      // Esperamos hasta 30s. Si falla, el catch imprimirá la pantalla.
      await waitFor(() => {
        const success = queryByText(/registro ha sido exitoso/i);
        const errorMessage = queryByText(/error/i) || queryByText(/failed/i);
        
        if (errorMessage) {
          console.error('❌ SE DETECTÓ UN ERROR EN LA PANTALLA:', errorMessage.props.children);
          throw new Error('La petición falló y se mostró un error en la UI.');
        }
        
        expect(success).toBeTruthy();
      }, { timeout: 30000 });

      const session = useAuthStore.getState().session;
      console.log('✅ TEST PASADO. Token:', session ? 'Recibido' : 'Nulo');

    } catch (error) {
      console.log('⚠️ EL TEST FALLÓ. IMPRIMIENDO LA PANTALLA ACTUAL:');
      debug(); // ESTO ES LA MAGIA: Nos mostrará el HTML virtual para ver qué texto hay
      throw error;
    }
  }, 40000);
});
