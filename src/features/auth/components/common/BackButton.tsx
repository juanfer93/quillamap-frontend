import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import { useThemeStore } from 'src/store/useThemeStore';

interface BackButtonProps {
  onPress: () => void;
}

const BackButton = ({ onPress }: BackButtonProps) => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';
  
  const color = isDark ? (tw.color('sand-gold') || '#c7ad8c') : (tw.color('shark-blue') || '#004574');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw`absolute top-2 left-0 z-50 p-2 flex-row items-center`}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={24} color={color} />
      <Text style={[tw`ml-1 text-base font-semibold`, { color }]}>
        Regresar
      </Text>
    </TouchableOpacity>
  );
};

export default BackButton;