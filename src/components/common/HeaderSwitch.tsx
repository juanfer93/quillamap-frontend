import React from 'react';
import { View, Switch, StyleSheet, Text } from 'react-native';
// Importaciones Absolutas
import { useThemeStore } from '@/store/useThemeStore';
import { COLORS } from '@/constants/theme';

export const HeaderSwitch = () => {
  const { mode, toggleTheme } = useThemeStore();
  const theme = mode === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>
        {mode === 'dark' ? 'Dark' : 'Light'}
      </Text>
      <Switch
        trackColor={{ false: '#767577', true: COLORS.sandGold }}
        thumbColor="#f4f3f4"
        onValueChange={toggleTheme}
        value={mode === 'dark'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  label: {
    marginRight: 8,
    fontSize: 12,
    fontWeight: '600',
  },
});