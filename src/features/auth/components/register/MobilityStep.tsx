import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import tw from 'twrnc';
import { useThemeStore } from '@/store/useThemeStore';

interface MobilityStepProps {
  selectedMode?: 'peaton' | 'turista' | 'moto' | 'carro'; 
  handleVehicleTypeSelect: (type: 'peaton' | 'turista' | 'moto' | 'carro') => void;
}

const MobilityStep: React.FC<MobilityStepProps> = ({ handleVehicleTypeSelect }) => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? 'dark' : 'light';

  const iconColor = tw.style(theme === 'dark' ? 'text-gold' : 'text-shark-blue').color as string;

  return (
    <View style={tw`items-center`}>
      <Text style={tw`text-2xl font-bold mb-l text-center text-${theme === 'dark' ? 'white' : 'shark-blue'}`}>¿Cómo te mueves por la ciudad?</Text>
      <TouchableOpacity style={tw`bg-${theme === 'dark' ? 'dark-gray' : 'white'} p-l rounded-l mb-m w-full items-center flex-row justify-center shadow-md`} onPress={() => handleVehicleTypeSelect('peaton')}>
        <FontAwesome name="male" size={40} color={iconColor} />
        <Text style={tw`text-lg font-semibold ml-m text-${theme === 'dark' ? 'white' : 'shark-blue'}`}>Peatón</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tw`bg-${theme === 'dark' ? 'dark-gray' : 'white'} p-l rounded-l mb-m w-full items-center flex-row justify-center shadow-md`} onPress={() => handleVehicleTypeSelect('turista')}>
        <FontAwesome name="user-circle" size={40} color={iconColor} />
        <Text style={tw`text-lg font-semibold ml-m text-${theme === 'dark' ? 'white' : 'shark-blue'}`}>Turista</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tw`bg-${theme === 'dark' ? 'dark-gray' : 'white'} p-l rounded-l mb-m w-full items-center flex-row justify-center shadow-md`} onPress={() => handleVehicleTypeSelect('moto')}>
        <FontAwesome name="motorcycle" size={40} color={iconColor} />
        <Text style={tw`text-lg font-semibold ml-m text-${theme === 'dark' ? 'white' : 'shark-blue'}`}>Moto</Text>
      </TouchableOpacity>
      <TouchableOpacity style={tw`bg-${theme === 'dark' ? 'dark-gray' : 'white'} p-l rounded-l mb-m w-full items-center flex-row justify-center shadow-md`} onPress={() => handleVehicleTypeSelect('carro')}>
        <FontAwesome name="car" size={40} color={iconColor} />
        <Text style={tw`text-lg font-semibold ml-m text-${theme === 'dark' ? 'white' : 'shark-blue'}`}>Carro</Text>
      </TouchableOpacity>
    </View>
  );
};

export default MobilityStep;
