import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import { useThemeStore } from '@/store/useThemeStore';

interface BackButtonProps {
  onPress: () => void;
}

const BackButton = ({ onPress }: BackButtonProps) => {
  const { mode } = useThemeStore();
  const isDark = mode === 'dark';

  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw`absolute top-4 left-4 z-50 p-2`} 
      activeOpacity={0.7}
    >
      <Ionicons 
        name="arrow-back" 
        size={28} 
        color={isDark ? tw.color('sand-gold') : tw.color('shark-blue')} 
      />
    </TouchableOpacity>
  );
};

export default BackButton;