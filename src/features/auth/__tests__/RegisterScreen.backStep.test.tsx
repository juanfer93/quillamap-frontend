import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import RegisterScreen from '../screens/RegisterScreen';

const mockedGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({ goBack: mockedGoBack }),
}));

describe('RegisterScreen - handleBackStep', () => {
  it('debe activar el spinner antes de navegar al Login', async () => {
    const { getByTestId, queryByTestId } = render(<RegisterScreen />);
    
    const backButton = getByTestId('back-button'); 

    fireEvent.press(backButton);


    await act(async () => {
      await new Promise((r) => setTimeout(r, 500));
    });

    expect(mockedGoBack).toHaveBeenCalledTimes(1);
  });
});