import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import tw from '@/lib/tailwind';
import { useThemeStore } from '@/store/useThemeStore';

interface BackButtonProps {
  onPress?: () => void;
}

const BackButton = ({ onPress }: BackButtonProps) => {
  const navigation = useNavigation();
  const { mode } = useThemeStore();

  return (
    <TouchableOpacity
      onPress={onPress || (() => navigation.goBack())}
      activeOpacity={0.7}
      style={tw.style(
        'w-10 h-10 rounded-full items-center justify-center',
        mode === 'dark' ? 'bg-dark-gray' : 'bg-medium-gray'
      )}
    >
      <Ionicons 
        name="chevron-back" 
        size={24} 
        style={tw.style(mode === 'dark' ? 'text-white' : 'text-shark-blue')}
      />
    </TouchableOpacity>
  );
};

export default BackButton;