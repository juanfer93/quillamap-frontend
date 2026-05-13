import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';
import { useThemeStore } from '@/store/useThemeStore';

const HeaderSwitch = () => {
  const { mode, toggleTheme } = useThemeStore();
  const isDark = mode === 'dark';

  return (
    <View style={tw`flex-row justify-end items-center px-4 pt-4`}>
      <TouchableOpacity
        onPress={toggleTheme}
        activeOpacity={0.8}
        style={tw`flex-row items-center bg-gray-200 dark:bg-gray-800 p-1 rounded-full w-14`}
      >
        <View
          style={tw`w-6 h-6 rounded-full items-center justify-center ${
            isDark ? 'translate-x-6 bg-primary' : 'bg-white'
          }`}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={14}
            color={isDark ? 'white' : '#F59E0B'} 
          />
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default HeaderSwitch;