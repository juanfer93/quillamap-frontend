
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { WelcomeScreen } from 'src/features/auth/screens/WelcomeScreen';
import { LoginScreen } from 'src/features/auth/screens/LoginScreen';
import { useAuthStore } from 'src/store/useAuthStore';
import { useThemeStore } from 'src/store/useThemeStore';
import { COLORS } from 'src/constants/theme';

const App = () => {
  const [isAppReady, setIsAppReady] = useState(false);
  const { session } = useAuthStore();
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? COLORS.dark : COLORS.light;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppReady(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isAppReady) {
    return <WelcomeScreen />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <View style={styles.content}>
        <Text style={{ color: theme.text }}>¡Bienvenido a QuillaMap!</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
