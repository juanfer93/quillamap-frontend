import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from '@/lib/tailwind';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/features/auth/types/auth.types';
import PedestrianMapContainer from '@/features/pedestrian/components/PedestrianMapContainer';
import { ShadowZone } from '@/features/pedestrian/schemas/pedestrian.schema';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const shadowZones: ShadowZone[] = [];

const HomeScreen = () => {
  const { user, signOut } = useAuthStore();
  const { mode } = useThemeStore();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const mobilityMode = user?.mobility_mode ?? user?.mobilityMode;
  const isPedestrian = mobilityMode === 'peaton';

  const handleLogout = () => {
    signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  if (isPedestrian) {
    return (
      <View style={tw`flex-1 bg-surface-light dark:bg-charcoal`}>
        <PedestrianMapContainer shadowZones={shadowZones} themeMode={mode} showHeader={false} />
        <TouchableOpacity
          testID="pedestrian-logout-button"
          accessibilityRole="button"
          accessibilityLabel="Cerrar sesion"
          onPress={handleLogout}
          style={tw`absolute right-0 bottom-0 h-16 w-1/4 items-center justify-center`}
        />
      </View>
    );
  }

  return (
    <View style={tw`flex-1 bg-surface-light dark:bg-charcoal justify-center items-center px-l`}>
      <Text style={tw`text-2xl font-bold text-primary dark:text-secondary text-center`}>
        Hola {user?.full_name || 'Usuario'}, bienvenido a QuillaMap
      </Text>

      <TouchableOpacity
        onPress={handleLogout}
        style={tw`mt-xl bg-primary dark:bg-secondary px-l py-m rounded-l`}
      >
        <Text style={tw`text-white dark:text-black font-bold`}>
          Cerrar Sesion
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
