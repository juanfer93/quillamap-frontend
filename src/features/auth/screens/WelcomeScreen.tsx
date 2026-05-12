import { Animated, View, Image, Button } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useEffect, useRef } from 'react';
import tw from '@/lib/tailwind';

const LOGO_SIZE = 250;

export const WelcomeScreen = ({ navigation }: any) => {
  const { mode } = useThemeStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const theme = mode === 'dark' ? 'dark' : 'light';

  return (
    <View
      style={tw`flex-1 justify-center items-center bg-${theme === 'dark' ? 'black' : 'white'}`}
      accessibilityLabel="Bienvenido a QuillaMap. Cargando aplicación"
    >
      <Animated.Image
        style={[
          tw`w-[250px] h-[250px]`,
          {
            opacity: fadeAnim,
          },
        ]}
        source={require('../../../../assets/logo-quillamap.png')}
      />
      <View style={tw`mt-5`}>
        <>
            <Button title="Iniciar Sesión" onPress={() => navigation.navigate('Login')} color="#004574" />
            <View style={tw`h-2.5`} />
            <Button title="Registrarse" onPress={() => navigation.navigate('Register')} color="#004574" />
        </>
      </View>
    </View>
  );
};
