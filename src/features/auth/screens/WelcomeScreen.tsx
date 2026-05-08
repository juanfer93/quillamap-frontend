import { Animated, View, StyleSheet, Image, Button } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { COLORS } from '@/constants/theme';
import { useEffect, useRef } from 'react';

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
      <View style={styles.buttonContainer}>
        <>
            <Button title="Iniciar Sesión" onPress={() => navigation.navigate('Login')} color="#004574" />
            <View style={styles.spacer} />
            <Button title="Registrarse" onPress={() => navigation.navigate('Register')} color="#004574" />
        </>
      </View>
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
  buttonContainer: {
    marginTop: 20,
  },
  spacer: {
    height: 10,
  }
});
