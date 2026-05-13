import { Animated, View, Image, Button } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useEffect, useRef } from 'react';
import tw from 'twrnc';
import { corporateColors } from '@/constants/theme';

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
          tw`w-[${LOGO_SIZE}px] h-[${LOGO_SIZE}px]`,
          {
            opacity: fadeAnim,
          },
        ]}
        source={require('../../../../assets/logo-quillamap.png')}
      />
      <View style={tw`mt-l`}>
        <>
            <Button title="Iniciar Sesión" onPress={() => navigation.navigate('Login')} color={corporateColors.sharkBlue} />
            <View style={tw`h-s`} />
            <Button title="Registrarse" onPress={() => navigation.navigate('Register')} color={corporateColors.sharkBlue} />
        </>
      </View>
    </View>
  );
};
