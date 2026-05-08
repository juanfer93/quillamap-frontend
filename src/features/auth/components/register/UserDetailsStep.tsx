import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, useColorScheme, ActivityIndicator } from 'react-native';
import { corporateColors } from '@/constants/theme';
import { RegisterRequest } from '@/features/auth/types/auth.types';

interface UserDetailsStepProps {
  formData: RegisterRequest;
  setFormData: (formData: RegisterRequest) => void;
  handleRegister: () => void;
  isLoading: boolean;
  error: string | null;
}

const UserDetailsStep: React.FC<UserDetailsStepProps> = ({ formData, setFormData, handleRegister, isLoading, error }) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const styles = getStyles(isDarkMode);

  return (
    <View style={styles.stepContainer}>
      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={formData.full_name}
        onChangeText={(full_name) => setFormData({ ...formData, full_name })}
        placeholderTextColor={isDarkMode ? corporateColors.lightGray : corporateColors.darkGray}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={formData.email}
        onChangeText={(email) => setFormData({ ...formData, email })}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={isDarkMode ? corporateColors.lightGray : corporateColors.darkGray}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={formData.password}
        onChangeText={(password) => setFormData({ ...formData, password })}
        secureTextEntry
        placeholderTextColor={isDarkMode ? corporateColors.lightGray : corporateColors.darkGray}
      />
      <TouchableOpacity style={[styles.button, { backgroundColor: corporateColors.gold }]} onPress={handleRegister} disabled={isLoading}>
        {isLoading ? <ActivityIndicator color={corporateColors.white} /> : <Text style={styles.buttonText}>Finalizar Registro</Text>}
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const getStyles = (isDarkMode: boolean) => StyleSheet.create({
  stepContainer: {
    alignItems: 'center',
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
  errorText: {
    color: 'red',
    marginTop: 15,
    textAlign: 'center'
  },
});

export default UserDetailsStep;
