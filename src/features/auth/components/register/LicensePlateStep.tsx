import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { RegisterRequest } from '@/features/auth/types/auth.types';
import tw from '@/lib/tailwind';
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

  const styles = {
    stepContainer: tw`items-center`,
    plate: tw`w-4/5 h-25 justify-center items-center rounded-lg border-2 border-shark-blue mb-8 bg-${plateBackgroundColor}`,
    plateText: tw`text-4xl font-bold tracking-widest text-black`,
    input: tw`w-full p-4 rounded-lg text-base mb-4 bg-${theme === 'dark' ? 'dark-gray' : 'white'} text-${theme === 'dark' ? 'white' : 'black'}`,
    button: tw`bg-shark-blue p-4 rounded-lg w-full items-center`,
    buttonText: tw`text-white text-lg font-bold`,
  };

  return (
    <View style={styles.stepContainer}>
      <View style={styles.plate}>
        <Text style={styles.plateText}>{formData.license_plate?.toUpperCase()}</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Placa del vehículo"
        value={formData.license_plate}
        onChangeText={setPlate}
        autoCapitalize="characters"
        placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
      />
      <TouchableOpacity style={styles.button} onPress={() => setCurrentStep(4)}>
        <Text style={styles.buttonText}>Siguiente</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LicensePlateStep;
