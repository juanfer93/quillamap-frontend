import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RegisterRequest } from '@/features/auth/types/auth.types';
import tw from 'twrnc';
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

  return (
    <View style={tw`items-center`}>
      <TextInput
        style={tw`w-full p-m rounded-m text-base mb-m bg-${theme === 'dark' ? 'dark-gray' : 'white'} text-${theme === 'dark' ? 'white' : 'black'}`}
        placeholder="Nombre completo"
        value={formData.full_name}
        onChangeText={(full_name) => setFormData({ ...formData, full_name })}
        placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
      />
      <TextInput
        style={tw`w-full p-m rounded-m text-base mb-m bg-${theme === 'dark' ? 'dark-gray' : 'white'} text-${theme === 'dark' ? 'white' : 'black'}`}
        placeholder="Correo electrónico"
        value={formData.email}
        onChangeText={(email) => setFormData({ ...formData, email })}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
      />
      <TextInput
        style={tw`w-full p-m rounded-m text-base mb-m bg-${theme === 'dark' ? 'dark-gray' : 'white'} text-${theme === 'dark' ? 'white' : 'black'}`}
        placeholder="Contraseña"
        value={formData.password}
        onChangeText={(password) => setFormData({ ...formData, password })}
        secureTextEntry={true}
        placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
      />
      <TouchableOpacity style={tw`p-m rounded-m w-full items-center bg-gold`} onPress={handleRegister} disabled={!!isLoading}>
        {isLoading ? <ActivityIndicator animating={true} color={tw.color('white')} /> : <Text style={tw`text-white text-lg font-bold`}>Finalizar Registro</Text>}
      </TouchableOpacity>
      {!!error && <Text style={tw`text-red-500 mt-m text-center`}>{error}</Text>}
    </View>
  );
};

export default UserDetailsStep;
