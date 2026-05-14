import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import tw from 'twrnc';
import { useThemeStore } from '@/store/useThemeStore';

interface CarTypeStepProps {
  selectedType?: 'particular' | 'taxi'; 
  handleCarTypeSelect: (type: 'particular' | 'taxi') => void;
}

const CarTypeStep: React.FC<CarTypeStepProps> = ({ handleCarTypeSelect }) => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? 'dark' : 'light';

  const iconColor = tw.color(theme === 'dark' ? 'gold' : 'shark-blue');

  return (
    <View style={tw`items-center`}>
      <Text style={tw`text-2xl font-bold mb-l text-center text-${theme === 'dark' ? 'white' : 'shark-blue'}`}>¿Qué tipo de carro conduces?</Text>
      <TouchableOpacity style={tw`bg-${theme === 'dark' ? 'dark-gray' : 'white'} p-l rounded-l mb-m w-full items-center flex-row justify-center shadow-md`} onPress={() => handleCarTypeSelect('particular')}>
        <FontAwesome name="car" size={40} color={iconColor} />
        <Text style={tw`text-lg font-semibold ml-m text-${theme === 'dark' ? 'white' : 'shark-blue'}`}>Particular</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tw`bg-${theme === 'dark' ? 'dark-gray' : 'white'} p-l rounded-l mb-m w-full items-center flex-row justify-center shadow-md`} onPress={() => handleCarTypeSelect('taxi')}>
        <FontAwesome name="taxi" size={40} color={iconColor} />
        <Text style={tw`text-lg font-semibold ml-m text-${theme === 'dark' ? 'white' : 'shark-blue'}`}>Taxi</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CarTypeStep;
