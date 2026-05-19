import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppColorScheme } from 'twrnc';
import tw from '@/lib/tailwind';
import { useThemeStore } from '@/store/useThemeStore';

const HeaderSwitch = () => {
  const { mode, setTheme } = useThemeStore();
  const [, , setColorScheme] = useAppColorScheme(tw);

  const handlePress = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setColorScheme(nextMode);
    setTheme(nextMode);
  };

  return (
    <View style={tw`flex-row justify-end items-center px-4 pt-4`}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={tw.style(
          'w-14 h-8 rounded-full p-1 justify-center',
          mode === 'dark' ? 'bg-dark-gray' : 'bg-medium-gray'
        )}
      >
        <View
          style={tw.style(
            'w-6 h-6 rounded-full bg-white items-center justify-center shadow-sm',
            mode === 'dark' ? 'translate-x-6' : 'translate-x-0'
          )}
        >
          <Ionicons
            name={mode === 'dark' ? 'moon' : 'sunny'}
            size={14}
            color={mode === 'dark' ? '#333333' : '#F59E0B'}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HeaderSwitch;