
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/useAuthStore';
import { WelcomeScreen } from '@/features/auth/screens/WelcomeScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import  RegisterScreen  from '@/features/auth/screens/RegisterScreen';
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

const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

const MainStackNavigator = () => (
  <MainStack.Navigator screenOptions={{ headerShown: false }}>
    <MainStack.Screen name="Home" component={HomeScreen} />
    {/* You can add more screens to your main app here */}
  </MainStack.Navigator>
);

const App = () => {
  const { session } = useAuthStore();

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <RootStack.Screen name="Main" component={MainStackNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
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
