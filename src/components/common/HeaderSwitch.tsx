import React from 'react';
import { View, Switch, Text } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import tw from '@/lib/tailwind';

export const HeaderSwitch = () => {
  const { mode, toggleTheme } = useThemeStore();
  const theme = mode === 'dark' ? 'dark' : 'light';

  const labelStyle = tw`mr-2 text-xs font-semibold text-${theme === 'dark' ? 'gray-400' : 'gray-600'}`;

  return (
    <View style={tw`flex-row items-center p-2.5`}>
      <Text style={labelStyle}>
        {mode === 'dark' ? 'Dark' : 'Light'}
      </Text>
      <Switch
        trackColor={{ false: '#767577', true: tw.color('gold') }}
        thumbColor={tw.color('white')}
        onValueChange={toggleTheme}
        value={mode === 'dark'}
      />
    </View>
  );
};
