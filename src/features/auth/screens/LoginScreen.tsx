import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import tw from '@/lib/tailwind';
import { RootStackParamList } from 'src/features/auth/types/auth.types';
import { useAuthStore } from 'src/store/useAuthStore';
import { useThemeStore } from 'src/store/useThemeStore';
import { authService } from '@/api/client';
import HeaderSwitch from 'src/components/common/HeaderSwitch';
import { loginSchema } from 'src/features/auth/schemas/auth.schema';
import AnimatedInput from 'src/features/auth/components/animated/AnimatedInput';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setSession } = useAuthStore();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const handleLogin = async () => {
    const validation = loginSchema.safeParse({ email, password });

    if (!validation.success) {
      const fieldErrors = validation.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email ? fieldErrors.email[0] : undefined,
        password: fieldErrors.password ? fieldErrors.password[0] : undefined,
      });
      return;
    }

    setErrors({});
    setIsLocalLoading(true);
    try {
      const { accessToken, user } = await authService.login(email, password);
      setSession(accessToken, user);
      navigation.navigate('Home');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al conectar con el servidor';
      Alert.alert('Error de inicio de sesión', message);
    } finally {
      setIsLocalLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={tw`flex-1 bg-white dark:bg-charcoal`}
    >
      <ScrollView contentContainerStyle={tw`flex-grow justify-center`}>
        <HeaderSwitch />

        <View style={tw`px-l items-center`}>
          <Image
            source={require('assets/logo-quillamap.png')}
            style={tw`w-32 h-32 mb-xl`}
            resizeMode="contain"
          />

          <View
            style={[
              tw`w-full bg-white dark:bg-slate p-l rounded-l border border-transparent dark:border-dark-gray`,
              !isDark && {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.1,
                shadowRadius: 20,
                elevation: 10,
              }
            ]}
          >
            <Text style={tw`text-2xl font-bold text-shark-blue dark:text-sand-gold text-center mb-l`}>
              Iniciar Sesión
            </Text>

            <View style={tw`w-full`}>
              <AnimatedInput
                label="Identificación"
                placeholder="Correo electrónico"
                value={email}
                onChangeText={(val: string) => {
                  setEmail(val);
                  if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                }}
                hasError={!!errors.email}
                isDark={isDark}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <AnimatedInput
                label="Contraseña"
                placeholder="********"
                value={password}
                onChangeText={(val: string) => {
                  setPassword(val);
                  if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                }}
                hasError={!!errors.password}
                isDark={isDark}
                secureTextEntry
              />

              <TouchableOpacity
                onPress={handleLogin}
                disabled={isLocalLoading}
                activeOpacity={0.8}
                style={tw`w-full bg-shark-blue dark:bg-sand-gold py-m rounded-m items-center shadow-md ${isLocalLoading ? 'opacity-80' : ''}`}
              >
                {isLocalLoading ? (
                  <ActivityIndicator color={isDark ? "#000" : "#FFF"} size="small" />
                ) : (
                  <Text style={tw`text-white dark:text-black text-lg font-bold uppercase`}>
                    Entrar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={tw`flex-row mt-xl`}>
            <Text style={tw`text-dark-gray dark:text-light-gray`}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={tw`text-shark-blue dark:text-sand-gold font-bold underline`}>
                Regístrate
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;