import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
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
  const isDark = mode === 'dark';

  const isTaxi = formData.vehicle_type === 'taxi';
  const plateBackgroundColor = isTaxi ? 'bg-white' : 'bg-yellow-400';

  return (
    <View style={tw`items-center`}>
      <View style={tw`w-4/5 h-24 justify-center items-center rounded-none border-2 border-black mb-6 ${plateBackgroundColor}`}>
        <Text style={tw`text-4xl font-bold tracking-widest text-black font-mono`}>
          {formData.license_plate?.toUpperCase() || "--- ---"}
        </Text>
      </View>

      <TextInput
        style={[
          tw`border p-4 rounded-xl mb-4 w-full`,
          {
            color: isDark ? '#FFFFFF' : '#000000',
            borderColor: isDark ? '#444' : '#CCC'
          }
        ]}
        placeholder={isTaxi ? "Ej: ABC-123" : "Ej: ABC-12D"}
        placeholderTextColor={isDark ? '#999' : '#666'}
        value={formData.license_plate}
        onChangeText={setPlate}
        autoCapitalize="characters"
        maxLength={7}
      />

      <TouchableOpacity
        style={tw`bg-[#004574] p-4 rounded-xl w-full items-center`}
        onPress={() => {
          if (!formData.license_plate || formData.license_plate.length < 5) {
            Alert.alert("Atención", "Por favor ingresa una placa válida.");
            return;
          }
          setCurrentStep(4);
        }}
      >
        <Text style={tw`text-white text-lg font-bold`}>Siguiente</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LicensePlateStep;