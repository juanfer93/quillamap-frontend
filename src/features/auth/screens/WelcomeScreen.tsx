import { Animated, View } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/useAuthStore'; 
import tw from '@/lib/tailwind';

const LOGO_SIZE = 250;

export const WelcomeScreen = ({ navigation }: any) => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? 'dark' : 'light';
  
  const token = useAuthStore((state) => state.session); 
  
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      if (token) {
        navigation.replace('Home'); 
      } else {
        navigation.replace('Login'); 
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [fadeAnim, navigation, token]);

  return (
    <View
      style={tw`flex-1 justify-center items-center bg-${theme === 'dark' ? 'black' : 'shark-blue'}`}
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
        resizeMode="contain"
      />
    </View>
  );
};