import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';

const mockedGoBack = jest.fn();
const mockedNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockedGoBack, navigate: mockedNavigate }),
}));

describe('RegisterScreen - Flujo de Retroceso', () => {
  it('debe mostrar el spinner y navegar', async () => {
    const { findByTestId } = render(<RegisterScreen />);
    
    // 1. Usamos findBy para esperar que el componente aparezca
    const backButton = await findByTestId('back-button');
    
    // 2. Presionamos
    await act(async () => {
      fireEvent.press(backButton);
    });

    // 3. Verificamos que el spinner aparezca (requiere que agregues testID="spinner" a tu ActivityIndicator)
    const spinner = await findByTestId('spinner');
    expect(spinner).toBeTruthy();

    // 4. Esperamos el timer del useEffect (400ms)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
    });

    // 5. Verificamos la navegación
    expect(mockedNavigate).toHaveBeenCalledWith('Login');
  });
});
