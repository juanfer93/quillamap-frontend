import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useState } from 'react';
import { HeaderSwitch } from '@/components/common/HeaderSwitch';
import tw from '@/lib/tailwind';

export const LoginScreen = () => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? 'dark' : 'light';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Email:', email, 'Password:', password);
  };

  const themeStyles = {
    container: tw`flex-1 justify-center p-6 bg-${theme === 'dark' ? 'black' : 'white'}`,
    title: tw`text-4xl font-bold text-center mb-8 text-${theme === 'dark' ? 'white' : 'black'}`,
    inputContainer: tw`rounded-lg border mb-4 bg-${theme === 'dark' ? 'dark-gray' : 'light-gray'} border-${theme === 'dark' ? 'medium-gray' : 'medium-gray'}`,
    input: tw`h-12 px-4 text-base text-${theme === 'dark' ? 'white' : 'black'}`,
    button: tw`bg-sand-gold p-4 rounded-lg items-center mt-4 mb-8`,
    buttonText: tw`text-shark-blue text-lg font-bold`,
    footer: tw`flex-row justify-center items-center`,
    footerText: tw`text-${theme === 'dark' ? 'light-gray' : 'dark-gray'}`,
    linkText: tw`text-sand-gold font-bold`,
  };

  return (
    <View style={themeStyles.container}>
      <HeaderSwitch />
      <Text style={themeStyles.title}>Iniciar Sesión</Text>

      <View style={themeStyles.inputContainer}>
        <TextInput
          style={themeStyles.input}
          placeholder="Email"
          placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Campo de entrada de correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={themeStyles.inputContainer}>
        <TextInput
          style={themeStyles.input}
          placeholder="Contraseña"
          placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Campo de entrada de contraseña"
          secureTextEntry={true}
        />
      </View>

      <TouchableOpacity style={themeStyles.button} onPress={handleLogin}>
        <Text style={themeStyles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <View style={themeStyles.footer}>
        <Text style={themeStyles.footerText}>¿No tienes una cuenta? </Text>
        <TouchableOpacity>
          <Text style={themeStyles.linkText}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
