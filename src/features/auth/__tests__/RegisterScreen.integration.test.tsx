import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';
import { authApi } from '@/api/client';
import { Alert } from 'react-native';

// Mock del API
jest.mock('@/api/client', () => ({
  authApi: {
    register: jest.fn(),
  },
}));

// Mock de Alert para verificar que se muestra el mensaje de error
jest.spyOn(Alert, 'alert');

describe('RegisterScreen Validation Logic', () => {
  test('no debe permitir avanzar a datos de usuario si no hay placa en modo carro', async () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    // Paso 1: Seleccionar Carro
    fireEvent.press(getByText('Carro'));
    
    // Paso 2: Seleccionar Particular
    fireEvent.press(getByText('Particular'));

    // Paso 3: Estamos en LicensePlateStep. Intentamos seguir sin escribir nada.
    const nextButton = getByText('Siguiente');
    fireEvent.press(nextButton);

    // Verificamos que se mostró la alerta de placa inválida
    expect(Alert.alert).toHaveBeenCalledWith("Atención", "Por favor ingresa una placa válida.");
    
    // El API no debe haber sido llamado aún
    expect(authApi.register).not.toHaveBeenCalled();
  });

  test('debe mostrar error de Zod si los datos personales son inválidos al final', async () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);

    // Llegamos al final rápido como Peatón
    fireEvent.press(getByText('Peatón'));

    // Llenamos el email mal a propósito
    const emailInput = getByPlaceholderText('Correo electrónico');
    fireEvent.changeText(emailInput, 'correo-invalido');

    const finalizeButton = getByText('Finalizar Registro');
    fireEvent.press(finalizeButton);

    // Zod debería disparar la alerta antes de llamar al API
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith("Datos incompletos", expect.stringContaining("Ingresa un correo electrónico válido"));
    });

    expect(authApi.register).not.toHaveBeenCalled();
  });
});