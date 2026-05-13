import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { RegisterRequest } from '@/features/auth/types/auth.types';
import tw from 'twrnc';
import { useThemeStore } from '@/store/useThemeStore';

interface LicensePlateStepProps {
  formData: RegisterRequest;
  setPlate: (plate: string) => void;
  setCurrentStep: (step: number) => void;
}

const LicensePlateStep: React.FC<LicensePlateStepProps> = ({ formData, setPlate, setCurrentStep }) => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? 'dark' : 'light';

  const plateBackgroundColor = formData.vehicle_type === 'TAXI' ? 'white' : 'gold';

  return (
    <View style={tw`items-center`}>
      <View style={tw`w-4/5 h-xl justify-center items-center rounded-m border-2 border-shark-blue mb-l bg-${plateBackgroundColor}`}>
        <Text style={tw`text-4xl font-bold tracking-widest text-black`}>{formData.license_plate?.toUpperCase()}</Text>
      </View>
      <TextInput
        style={tw`w-full p-m rounded-m text-base mb-m bg-${theme === 'dark' ? 'dark-gray' : 'white'} text-${theme === 'dark' ? 'white' : 'black'}`}
        placeholder="Placa del vehículo"
        value={formData.license_plate}
        onChangeText={setPlate}
        autoCapitalize="characters"
        placeholderTextColor={tw.style(theme === 'dark' ? 'text-light-gray' : 'text-dark-gray').color as string}
      />
      <TouchableOpacity style={tw`bg-shark-blue p-m rounded-m w-full items-center`} onPress={() => setCurrentStep(4)}>
        <Text style={tw`text-white text-lg font-bold`}>Siguiente</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LicensePlateStep;
