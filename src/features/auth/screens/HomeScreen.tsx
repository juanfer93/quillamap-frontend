import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from '@/lib/tailwind';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/features/auth/types/auth.types';
import PedestrianMapContainer from '@/features/pedestrian/components/PedestrianMapContainer';
import { ShadowZone } from '@/features/pedestrian/schemas/pedestrian.schema';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const shadowZones: ShadowZone[] = [];

const HomeScreen = () => {
  const { user, signOut } = useAuthStore();
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
        <View style={tw`px-m pt-l pb-s flex-row items-start justify-between`}>
          <View style={tw`flex-1 pr-m`}>
            <Text style={tw`text-primary dark:text-secondary text-2xl font-bold`}>
              Modo Peaton
            </Text>
            <Text style={tw`text-dark-gray dark:text-light-gray mt-xs`}>
              Rastreo de proximidad entre 300m y 500m
            </Text>
          </View>
          <TouchableOpacity
            testID="pedestrian-logout-button"
            onPress={handleLogout}
            style={tw`bg-primary dark:bg-secondary px-m py-s rounded-m`}
          >
            <Text style={tw`text-white dark:text-black font-bold`}>
              Cerrar Sesion
            </Text>
          </TouchableOpacity>
        </View>
        <View style={tw`flex-1 px-m pb-m`}>
          <PedestrianMapContainer shadowZones={shadowZones} showHeader={false} />
        </View>
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
