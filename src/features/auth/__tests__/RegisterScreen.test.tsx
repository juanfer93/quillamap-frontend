
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';

// 1. Configuración Inicial (Mocks)
global.fetch = jest.fn() as jest.Mock;

process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000';

// Mock para el hook de navegación, si es necesario
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
    }),
  };
});

describe('RegisterScreen', () => {
  beforeEach(() => {
    // Limpiamos los mocks antes de cada prueba
    (global.fetch as jest.Mock).mockClear();
  });

  // Test 1: Renderizado inicial
  test('Renderiza correctamente el Paso 1 con la pregunta y las 4 tarjetas', () => {
    const { getByText, getAllByTestId } = render(<RegisterScreen />);
    
    expect(getByText('¿Cómo te mueves por la ciudad?')).toBeTruthy();
    
    const mobilityCards = getAllByTestId(/^mobility-card-/);
    expect(mobilityCards.length).toBe(4);
    expect(getByText('Peatón')).toBeTruthy();
    expect(getByText('Bicicleta')).toBeTruthy();
    expect(getByText('Moto')).toBeTruthy();
    expect(getByText('Carro')).toBeTruthy();
  });

  // Test 2: Saltos condicionales
  test("Al presionar 'Peatón' salta al Paso 4 (inputs de Nombre y Correo)", () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);
    
    fireEvent.press(getByText('Peatón'));

    expect(getByText('¡Ya casi terminamos!')).toBeTruthy();
    expect(getByPlaceholderText('Nombre completo')).toBeTruthy();
    expect(getByPlaceholderText('correo@dominio.com')).toBeTruthy();
  });

  test("Al presionar 'Carro' avanza al Paso 2 ('Taxi' / 'Particular')", () => {
    const { getByText } = render(<RegisterScreen />);
    
    fireEvent.press(getByText('Carro'));

    expect(getByText('¿Qué tipo de vehículo usas?')).toBeTruthy();
    expect(getByText('Taxi')).toBeTruthy();
    expect(getByText('Particular')).toBeTruthy();
  });

  // Test 3: Lógica de la placa
  test('Transforma el texto de la placa a mayúsculas', () => {
    const { getByText, getByPlaceholderText } = render(<RegisterScreen />);
    
    // Navegamos hasta el paso de la placa
    fireEvent.press(getByText('Moto')); // O 'Carro' y luego 'Particular'
    fireEvent.press(getByText('Particular'));

    const plateInput = getByPlaceholderText('ABC12E');
    fireEvent.changeText(plateInput, 'abc12');
    
    // El valor visualmente renderizado debe estar en mayúsculas
    expect(plateInput.props.value).toBe('ABC12');
  });

  // Test 4: Registro exitoso
  test('Completa el flujo y muestra la pantalla de éxito en un registro exitoso', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ message: 'Usuario registrado con éxito' }),
    });

    const { getByText, getByPlaceholderText, findByText } = render(<RegisterScreen />);

    // Flujo para un peatón
    fireEvent.press(getByText('Peatón'));

    // Llenar formulario
    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('correo@dominio.com'), 'john.doe@test.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirmar contraseña'), 'password123');

    // Enviar formulario
    fireEvent.press(getByText('Finalizar Registro'));

    // Verificaciones
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'John Doe',
            email: 'john.doe@test.com',
            password: 'password123',
            mobility_type: 'PEATON',
            vehicle_type: null,
            license_plate: null,
          }),
        })
      );
    });

    // Verificar pantalla de éxito
    const successMessage = await findByText(/¡Bienvenido a la comunidad,/);
    expect(successMessage).toBeTruthy();
    expect(getByText('John Doe')).toBeTruthy();
  });

  // Test 5: Manejo de errores del servidor
  test('Muestra un mensaje de error si el servidor devuelve un error 500', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Error interno del servidor' }),
    });

    const { getByText, getByPlaceholderText, findByText } = render(<RegisterScreen />);

    // Flujo y llenado de formulario
    fireEvent.press(getByText('Peatón'));
    fireEvent.changeText(getByPlaceholderText('Nombre completo'), 'Jane Doe');
    fireEvent.changeText(getByPlaceholderText('correo@dominio.com'), 'jane.doe@test.com');
    fireEvent.changeText(getByPlaceholderText('Contraseña'), 'password123');
    fireEvent.changeText(getByPlaceholderText('Confirmar contraseña'), 'password123');

    // Enviar
    const submitButton = getByText('Finalizar Registro');
    fireEvent.press(submitButton);
    
    // Verificar que el botón de carga desaparece y se muestra el error
    const errorMessage = await findByText('Error de conexión con el servidor.');
    expect(errorMessage).toBeTruthy();
    
    // El botón debe volver a estar habilitado
    expect(submitButton).not.toBeDisabled();
  });
});
