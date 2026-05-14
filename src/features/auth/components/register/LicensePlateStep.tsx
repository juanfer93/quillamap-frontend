import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { RegisterRequest } from '@/features/auth/types/auth.types';
import tw from 'twrnc';
import { useThemeStore } from '@/store/useThemeStore';
import { COLORS } from '@/constants/theme'; 

interface LicensePlateStepProps {
  formData: RegisterRequest;
  setPlate: (plate: string) => void;
  setCurrentStep: (step: number) => void;
}

const LicensePlateStep: React.FC<LicensePlateStepProps> = ({ formData, setPlate, setCurrentStep }) => {
  const { mode } = useThemeStore();
  const themeColors = mode === 'dark' ? COLORS.dark : COLORS.light;

  const isTaxi = formData.vehicle_type === 'taxi';
  const plateBackgroundColor = isTaxi ? 'bg-white' : 'bg-yellow-400'; 

  return (
    <View style={tw`items-center`}>
      <View style={tw`w-4/5 h-24 justify-center items-center rounded-xl border-2 border-[#004574] mb-6 ${plateBackgroundColor}`}>
        <Text style={tw`text-4xl font-bold tracking-widest text-black`}>
          {formData.license_plate?.toUpperCase() || "--- ---"}
        </Text>
      </View>

      <TextInput
        style={[
          tw`border p-4 rounded-xl mb-4 w-full`, 
          { 
            color: themeColors.text, 
            borderColor: themeColors.border 
          }
        ]}
        placeholder={
          isTaxi 
            ? "Ej: ABC-123 (Placa de Taxi)" 
            : "Ej: ABC-12D (Placa de Particular)"
        }
        placeholderTextColor={mode === 'dark' ? '#999' : '#666'}
        value={formData.license_plate}
        onChangeText={setPlate}
        autoCapitalize="characters"
        maxLength={7}
      />

      <TouchableOpacity 
        style={tw`bg-[#004574] p-4 rounded-xl w-full items-center`} 
        onPress={() => {
          if(!formData.license_plate || formData.license_plate.length < 6) {
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