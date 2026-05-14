import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
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
import tw from 'twrnc';

import { RootStackParamList } from 'src/features/auth/types/auth.types';
import { useAuthStore } from 'src/store/useAuthStore';
import { useThemeStore } from 'src/store/useThemeStore';
import { authService } from '@/api/client';
import HeaderSwitch from 'src/components/common/HeaderSwitch';
import { loginSchema } from 'src/features/auth/schemas/auth.schema';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { setSession } = useAuthStore();
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  const handleLogin = async () => {
    const validation = loginSchema.safeParse({ email, password });

    if (!validation.success) {
      const firstError = validation.error.issues[0].message;
      Alert.alert('Atención', firstError);
      return;
    }

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
      style={tw`flex-1 bg-white dark:bg-gray-900`}
    >
      <ScrollView contentContainerStyle={tw`flex-grow`}>
        <HeaderSwitch />
        <View style={tw`flex-1 px-8 justify-center items-center`}>
          <Image
            source={require('assets/logo-quillamap.png')}
            style={tw`w-40 h-40 mb-4`}
            resizeMode="contain"
          />
          <Text style={tw`text-3xl font-bold text-gray-900 dark:text-white mb-8`}>
            Iniciar Sesión
          </Text>

          <View style={tw`w-full space-y-4`}>
            <View>
              <Text style={tw`text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 ml-1`}>
                Correo Electrónico
              </Text>
              <TextInput
                style={tw`w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700`}
                placeholder="Correo"
                placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={tw`mt-4`}>
              <Text style={tw`text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 ml-1`}>
                Contraseña
              </Text>
              <TextInput
                style={tw`w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700`}
                placeholder="********"
                placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLocalLoading}
              activeOpacity={0.8}
              style={tw`w-full bg-primary py-4 rounded-full mt-8 flex-row justify-center items-center shadow-lg`}
            >
              {isLocalLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={tw`text-white text-lg font-bold uppercase`}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={tw`flex-row mt-10`}>
            <Text style={tw`text-gray-600 dark:text-gray-400`}>¿No tienes cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={tw`text-primary font-bold`}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;