import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useThemeStore } from '@/store/useThemeStore';

const HeaderSwitch = () => {
  const { mode, setTheme } = useThemeStore();
  const isDark = mode === 'dark';

  const handlePress = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <View style={tw`flex-row justify-end items-center px-4 pt-4`}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={tw`w-14 h-8 rounded-full p-1 justify-center ${isDark ? 'bg-charcoal' : 'bg-medium-gray'
          }`}
      >
        <View
          style={tw`w-6 h-6 rounded-full bg-white items-center justify-center transition-transform duration-300 ${isDark ? 'translate-x-6' : 'translate-x-0'
            }`}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={14}
            color={isDark ? '#333' : '#F59E0B'}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HeaderSwitch;