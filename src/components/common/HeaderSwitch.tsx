import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, View, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppColorScheme } from 'twrnc';
import tw from '@/lib/tailwind';
import { useThemeStore } from '@/store/useThemeStore';

const HeaderSwitch = () => {
  const { mode, setTheme } = useThemeStore();
  const [, , setColorScheme] = useAppColorScheme(tw);
  
  const animatedValue = useRef(new Animated.Value(mode === 'dark' ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: mode === 'dark' ? 1 : 0,
      duration: 300, 
      useNativeDriver: true,
    }).start();
  }, [mode]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24], 
  });

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
        <Animated.View 
          style={[
            tw`w-6 h-6 rounded-full bg-white items-center justify-center shadow-sm`,
            { transform: [{ translateX }] }
          ]}
        >
          <Ionicons
            name={mode === 'dark' ? 'moon' : 'sunny'}
            size={14}
            color={mode === 'dark' ? '#333333' : '#F59E0B'}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

export default HeaderSwitch;