import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/store/useAuthStore';
import LoginScreen from '@/features/auth/screens/LoginScreen';
import RegisterScreen from '@/features/auth/screens/RegisterScreen';
import  HomeScreen  from '@/features/auth/screens/HomeScreen'
import { SafeAreaView, ActivityIndicator } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import tw from '@/lib/tailwind';
import { useDeviceContext } from 'twrnc';

const Auth = createNativeStackNavigator();
const Main = createNativeStackNavigator();

const AuthStack = () => (
  <Auth.Navigator screenOptions={{ headerShown: false }}>
    <Auth.Screen name="Login" component={LoginScreen} />
    <Auth.Screen name="Register" component={RegisterScreen} />
  </Auth.Navigator>
);

const MainStack = () => (
  <Main.Navigator screenOptions={{ headerShown: false }}>
    <Main.Screen name="Home" component={HomeScreen} />
  </Main.Navigator>
);

const App = () => {
  const { session, isLoading } = useAuthStore();
  const { mode } = useThemeStore();

  useDeviceContext(tw, { initialColorScheme: mode, observeDeviceColorSchemeChanges: false });

  if (isLoading) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-white dark:bg-black`}>
        <ActivityIndicator size="large" color="#004574" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {session ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;