import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useColorScheme } from 'react-native';
import { corporateColors } from '@/constants/theme';
import { RegisterRequest } from '@/features/auth/types/auth.types';

interface LicensePlateStepProps {
  formData: RegisterRequest;
  setPlate: (plate: string) => void;
  setCurrentStep: (step: number) => void;
}

const LicensePlateStep: React.FC<LicensePlateStepProps> = ({ formData, setPlate, setCurrentStep }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.stepContainer}>
      <View style={[styles.plate, {backgroundColor: formData.vehicle_type === 'TAXI' ? corporateColors.white : '#FFD700'}]}>
        <Text style={[styles.plateText, {color: corporateColors.black}]}>{formData.license_plate?.toUpperCase()}</Text>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Placa del vehículo"
        value={formData.license_plate}
        onChangeText={setPlate}
        autoCapitalize="characters"
        placeholderTextColor={isDarkMode ? corporateColors.lightGray : corporateColors.darkGray}
      />
      <TouchableOpacity style={styles.button} onPress={() => setCurrentStep(4)}>
        <Text style={styles.buttonText}>Siguiente</Text>
      </TouchableOpacity>
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  stepContainer: {
    alignItems: 'center',
  },
  plate: {
    width: '80%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: corporateColors.sharkBlue,
    marginBottom: 30,
  },
  plateText: {
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: 5
  },
  input: {
    width: '100%',
    backgroundColor: isDarkMode ? corporateColors.darkGray : corporateColors.white,
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    color: isDarkMode ? corporateColors.white : corporateColors.black,
  },
  button: {
    backgroundColor: corporateColors.sharkBlue,
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: corporateColors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default LicensePlateStep;
