import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RegisterRequest } from '@/features/auth/types/auth.types';
import tw from '@/lib/tailwind';
import { useThemeStore } from '@/store/useThemeStore';

interface UserDetailsStepProps {
  formData: RegisterRequest;
  setFormData: (formData: RegisterRequest) => void;
  handleRegister: () => void;
  isLoading: boolean;
  error: string | null;
}

const UserDetailsStep: React.FC<UserDetailsStepProps> = ({ formData, setFormData, handleRegister, isLoading, error }) => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? 'dark' : 'light';

  const styles = {
    stepContainer: tw`items-center`,
    input: tw`w-full p-4 rounded-lg text-base mb-4 bg-${theme === 'dark' ? 'dark-gray' : 'white'} text-${theme === 'dark' ? 'white' : 'black'}`,
    button: tw`p-4 rounded-lg w-full items-center bg-gold`,
    buttonText: tw`text-white text-lg font-bold`,
    errorText: tw`text-red-500 mt-4 text-center`,
  };

  return (
    <View style={styles.stepContainer}>
      <TextInput
        style={styles.input}
        placeholder="Nombre completo"
        value={formData.full_name}
        onChangeText={(full_name) => setFormData({ ...formData, full_name })}
        placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
      />
      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        value={formData.email}
        onChangeText={(email) => setFormData({ ...formData, email })}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={formData.password}
        onChangeText={(password) => setFormData({ ...formData, password })}
        secureTextEntry={true}
        placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
      />
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={!!isLoading}>
        {isLoading ? <ActivityIndicator animating={true} color={tw.color('white')} /> : <Text style={styles.buttonText}>Finalizar Registro</Text>}
      </TouchableOpacity>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

export default UserDetailsStep;
