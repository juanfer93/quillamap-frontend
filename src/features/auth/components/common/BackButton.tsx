import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from '@/lib/tailwind';
import { useThemeStore } from '@/store/useThemeStore';

interface BackButtonProps { onPress: () => void; }

const BackButton = ({ onPress }: BackButtonProps) => {
  const { mode } = useThemeStore();
  return (
    <TouchableOpacity onPress={onPress} style={tw`p-2`} activeOpacity={0.7}>
      <Ionicons 
        name="arrow-back" 
        size={28} 
        color={mode === 'dark' ? tw.color('sand-gold') : tw.color('shark-blue')} 
      />
    </TouchableOpacity>
  );
};

export default BackButton;