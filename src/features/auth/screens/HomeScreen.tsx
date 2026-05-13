import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from 'twrnc';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/features/auth/types/auth.types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const { user, signOut } = useAuthStore();
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const handleLogout = () => {
    signOut(); 
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <View style={tw`flex-1 bg-white dark:bg-gray-900 justify-center items-center px-6`}>
      <Text style={tw`text-2xl font-bold text-gray-800 dark:text-white text-center`}>
        Hola {user?.name || 'Usuario'}, bienvenido a QuillaMap
      </Text>
      
      <TouchableOpacity
        onPress={handleLogout}
        style={tw`mt-10 bg-red-500 px-8 py-3 rounded-full`}
      >
        <Text style={tw`text-white font-bold`}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;