import React, { useState } from 'react';
import { View, Alert, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { RegisterRequest } from '@/features/auth/types/auth.types';
import tw from '@/lib/tailwind';
import { useThemeStore } from '@/store/useThemeStore';
import { registerSchema } from '@/features/auth/schemas/auth.schema';
import AnimatedInput from '@/features/auth/components/animated/AnimatedInput';


interface UserDetailsStepProps {
  formData: RegisterRequest;
  setFormData: (formData: RegisterRequest) => void;
  handleRegister: () => void;
  isLoading: boolean;
  error: string | null;
}

const UserDetailsStep: React.FC<UserDetailsStepProps> = ({ formData, setFormData, handleRegister, isLoading, error }) => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  const onFinalizePress = () => {
    const result = registerSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, boolean> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as string;
        newErrors[fieldName] = true;
      });

      setFieldErrors(newErrors); 

      const firstError = result.error.issues[0].message;
      Alert.alert("Datos incompletos", firstError);
      return;
    }

    setFieldErrors({});
    handleRegister();
  };

  return (
    <View style={tw`w-full`}>
      <AnimatedInput
        label="Nombre completo"
        placeholder="Tu nombre"
        value={formData.full_name}
        onChangeText={(val: string) => {
          setFormData({ ...formData, full_name: val });
          if (fieldErrors.full_name) setFieldErrors({ ...fieldErrors, full_name: false });
        }}
        hasError={!!fieldErrors.full_name} 
        isDark={isDark}
      />

      <AnimatedInput
        label="Correo electrónico"
        placeholder="ejemplo@correo.com"
        value={formData.email}
        onChangeText={(val: string) => {
          setFormData({ ...formData, email: val });
          if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: false });
        }}
        hasError={!!fieldErrors.email} 
        isDark={isDark}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <AnimatedInput
        label="Contraseña"
        placeholder="********"
        value={formData.password}
        onChangeText={(val: string) => {
          setFormData({ ...formData, password: val });
          if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: false });
        }}
        hasError={!!fieldErrors.password} 
        isDark={isDark}
        secureTextEntry
      />

      <TouchableOpacity
        onPress={onFinalizePress}
        disabled={isLoading}
        activeOpacity={0.8}
        style={tw`w-full bg-shark-blue dark:bg-sand-gold py-m rounded-l mt-xl items-center shadow-md`}
      >
        {isLoading ? (
          <ActivityIndicator color={isDark ? "#000" : "#FFF"} />
        ) : (
          <Text style={tw`text-white dark:text-black text-lg font-bold uppercase`}>
            Finalizar Registro
          </Text>
        )}
      </TouchableOpacity>

      {error && (
        <Text style={tw`text-error text-center mt-m font-semibold`}>
          {error}
        </Text>
      )}
    </View>
  );
};

export default UserDetailsStep;