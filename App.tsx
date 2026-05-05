import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View, Text } from 'react-native';
import { useThemeStore } from 'src/store/useThemeStore';
import { COLORS } from 'src/constants/theme';
import { HeaderSwitch } from 'src/components/common/HeaderSwitch';

const App = () => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme.background}
      />
      
      {/* Header con el Switch */}
      <View style={styles.header}>
        <HeaderSwitch />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>QuillaMap</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Modo actual: {mode === 'dark' ? 'Oscuro 🌙' : 'Claro ☀️'}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
  },
});

export default App;