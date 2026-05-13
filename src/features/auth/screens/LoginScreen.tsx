import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useState } from 'react';
import { HeaderSwitch } from '@/components/common/HeaderSwitch';
import tw from 'twrnc';

export const LoginScreen = () => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? 'dark' : 'light';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Email:', email, 'Password:', password);
  };

  return (
    <View style={tw`flex-1 justify-center p-l bg-${theme === 'dark' ? 'black' : 'white'}`}>
      <HeaderSwitch />
      <Text style={tw`text-4xl font-bold text-center mb-l text-${theme === 'dark' ? 'white' : 'black'}`}>Iniciar Sesión</Text>

      <View style={tw`rounded-m border mb-m bg-${theme === 'dark' ? 'dark-gray' : 'light-gray'} border-${theme === 'dark' ? 'medium-gray' : 'medium-gray'}`}>
        <TextInput
          style={tw`h-12 px-m text-base text-${theme === 'dark' ? 'white' : 'black'}`}
          placeholder="Email"
          placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Campo de entrada de correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={tw`rounded-m border mb-m bg-${theme === 'dark' ? 'dark-gray' : 'light-gray'} border-${theme === 'dark' ? 'medium-gray' : 'medium-gray'}`}>
        <TextInput
          style={tw`h-12 px-m text-base text-${theme === 'dark' ? 'white' : 'black'}`}
          placeholder="Contraseña"
          placeholderTextColor={tw.color(theme === 'dark' ? 'light-gray' : 'dark-gray')}
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Campo de entrada de contraseña"
          secureTextEntry={true}
        />
      </View>

      <TouchableOpacity style={tw`bg-sand-gold p-m rounded-m items-center mt-m mb-l`} onPress={handleLogin}>
        <Text style={tw`text-shark-blue text-lg font-bold`}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <View style={tw`flex-row justify-center items-center`}>
        <Text style={tw`text-${theme === 'dark' ? 'light-gray' : 'dark-gray'}`}>¿No tienes una cuenta? </Text>
        <TouchableOpacity>
          <Text style={tw`text-sand-gold font-bold`}>Regístrate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
