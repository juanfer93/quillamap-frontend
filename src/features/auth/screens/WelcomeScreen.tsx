import { Animated, View, StyleSheet, Image } from 'react-native';
import { useThemeStore } from 'src/store/useThemeStore';
import { COLORS } from 'src/constants/theme';
import { useEffect, useRef } from 'react';

const LOGO_SIZE = 250;

export const WelcomeScreen = () => {
  const { mode } = useThemeStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const currentTheme = mode === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.background },
      ]}
      accessibilityLabel="Bienvenido a QuillaMap. Cargando aplicación"
    >
      <Animated.Image
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
          },
        ]}
        source={require('../../../../assets/logo-quillamap.png')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
