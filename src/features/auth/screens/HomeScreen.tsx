import React from 'react';
import { View, Text } from 'react-native';
import tw from '@/lib/tailwind';
import { useAuthStore } from '@/store/useAuthStore';
import { useThemeStore } from '@/store/useThemeStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/features/auth/types/auth.types';
import ShadowReportMapFlow from '@/features/reports/components/ShadowReportMapFlow';
import PlacesMapContainer from '@/features/places/components/PlacesMapContainer';
import UserToolsMenu from '@/features/navigation/components/UserToolsMenu';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const { user, signOut } = useAuthStore();
  const { mode } = useThemeStore();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const mobilityMode = user?.mobility_mode ?? user?.mobilityMode;
  const isPedestrian = mobilityMode === 'peaton';
  const mapMode = mobilityMode === 'turista'
    ? 'tourist'
    : mobilityMode === 'moto'
      ? 'motorcycle'
      : 'car';

  const canReportShadow = isPedestrian;

  const handleLogout = async () => {
    await signOut();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const openPublicTransport = () => {
    navigation.navigate('PublicTransport');
  };

  if (isPedestrian) {
    return (
      <View style={tw`flex-1 bg-surface-light dark:bg-charcoal`}>
        <ShadowReportMapFlow
          themeMode={mode}
          canReportShadow={canReportShadow}
          licensePlate={user?.license_plate}
          onLogout={() => {
            void handleLogout();
          }}
          onOpenPublicTransport={openPublicTransport}
        />
      </View>
    );
  }

  if (mobilityMode === 'turista' || mobilityMode === 'moto' || mobilityMode === 'carro') {
    return (
      <PlacesMapContainer
        mode={mapMode}
        themeMode={mode}
        licensePlate={user?.license_plate}
        onLogout={() => {
          void handleLogout();
        }}
        onOpenPublicTransport={openPublicTransport}
      />
    );
  }

  return (
    <View style={tw`flex-1 bg-surface-light dark:bg-charcoal justify-center items-center px-l`}>
      <Text style={tw`text-2xl font-bold text-primary dark:text-secondary text-center`}>
        Hola {user?.full_name || 'Usuario'}, bienvenido a QuillaMap
      </Text>

      <View style={tw`mt-xl`}>
        <UserToolsMenu
          canReportShadow={false}
          onLogout={() => {
            void handleLogout();
          }}
          onOpenPublicTransport={openPublicTransport}
        />
      </View>
    </View>
  );
};

export default HomeScreen;
