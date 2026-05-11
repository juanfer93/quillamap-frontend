
import React from 'react';
import "./global.css";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/useAuthStore';
import { WelcomeScreen } from '@/features/auth/screens/WelcomeScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import { SafeAreaView, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { COLORS } from '@/constants/theme';

// Placeholder for the main app screen
const HomeScreen = () => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? COLORS.dark : COLORS.light;
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={{ color: theme.text }}>Mapa Principal</Text>
    </SafeAreaView>
  );
};

const Auth = createNativeStackNavigator();
const Main = createNativeStackNavigator();

const AuthStack = () => (
  <Auth.Navigator screenOptions={{ headerShown: false }}>
    <Auth.Screen name="Welcome" component={WelcomeScreen} />
    <Auth.Screen name="Login" component={LoginScreen} />
    <Auth.Screen name="Register" component={RegisterScreen} />
  </Auth.Navigator>
);

const MainStack = () => (
  <Main.Navigator screenOptions={{ headerShown: false }}>
    <Main.Screen name="Home" component={HomeScreen} />
    {/* You can add more screens to your main app here */}
  </Main.Navigator>
);

const App = () => {
  const { session } = useAuthStore();

  return (
    <SafeAreaProvider> 
      <NavigationContainer>
        {session ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
