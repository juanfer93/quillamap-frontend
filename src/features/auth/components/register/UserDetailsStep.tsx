import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { RegisterRequest } from '@/features/auth/types/auth.types';
import tw from 'twrnc';
import { useThemeStore } from '@/store/useThemeStore';
import { registerSchema } from '@/features/auth/schemas/auth.schema';

interface UserDetailsStepProps {
  formData: RegisterRequest;
  setFormData: (formData: RegisterRequest) => void;
  handleRegister: () => void;
  isLoading: boolean;
  error: string | null;
}

const UserDetailsStep: React.FC<UserDetailsStepProps> = ({
  formData,
  setFormData,
  handleRegister,
  isLoading,
  error
}) => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const onFinalizePress = () => {
    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const firstError = result.error.issues[0].message;
      Alert.alert("Datos incompletos", firstError);
      return;
    }

    handleRegister();
  };

  return (
    <View style={tw`items-center w-full px-4`}>
      <Text style={tw`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-[#004574]'}`}>
        Datos de tu cuenta
      </Text>

      <TextInput
        style={[
          tw`w-full p-4 rounded-xl text-base mb-4`,
          {
            backgroundColor: isDark ? '#2D2D2D' : '#F3F4F6',
            color: isDark ? '#FFFFFF' : '#000000'
          }
        ]}
        placeholder="Nombre completo"
        value={formData.full_name}
        onChangeText={(full_name) => setFormData({ ...formData, full_name })}
        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
      />

      <TextInput
        style={[
          tw`w-full p-4 rounded-xl text-base mb-4`,
          {
            backgroundColor: isDark ? '#2D2D2D' : '#F3F4F6',
            color: isDark ? '#FFFFFF' : '#000000'
          }
        ]}
        placeholder="Correo electrónico"
        value={formData.email}
        onChangeText={(email) => setFormData({ ...formData, email })}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
      />

      <TextInput
        style={[
          tw`w-full p-4 rounded-xl text-base mb-6`,
          {
            backgroundColor: isDark ? '#2D2D2D' : '#F3F4F6',
            color: isDark ? '#FFFFFF' : '#000000'
          }
        ]}
        placeholder="Contraseña"
        value={formData.password}
        onChangeText={(password) => setFormData({ ...formData, password })}
        secureTextEntry={true}
        placeholderTextColor={isDark ? '#9CA3AF' : '#6B7280'}
      />

      <TouchableOpacity
        style={tw`p-4 rounded-xl w-full items-center ${isLoading ? 'bg-gray-400' : 'bg-[#004574]'}`}
        onPress={onFinalizePress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator animating={true} color="#FFFFFF" />
        ) : (
          <Text style={tw`text-white text-lg font-bold`}>Finalizar Registro</Text>
        )}
      </TouchableOpacity>

      {!!error && (
        <View style={tw`mt-4 p-3 bg-red-100 rounded-lg w-full`}>
          <Text style={tw`text-red-600 text-center text-sm font-medium`}>{error}</Text>
        </View>
      )}
    </View>
  );
};

export default UserDetailsStep;