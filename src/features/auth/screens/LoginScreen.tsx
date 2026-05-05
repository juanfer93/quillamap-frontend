import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from 'src/store/useThemeStore';
import { COLORS, SPACING, BORDER_RADIUS } from 'src/constants/theme';
import { useState } from 'react';

export const LoginScreen = () => {
  const { mode } = useThemeStore();
  const theme = mode === 'dark' ? COLORS.dark : COLORS.light;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    console.log('Email:', email, 'Password:', password);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Iniciar Sesión</Text>

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        value={email}
        onChangeText={setEmail}
        accessibilityLabel="Campo de entrada de correo electrónico"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={[styles.input, { color: theme.text, borderColor: theme.border }]}
        placeholder="Contraseña"
        placeholderTextColor={theme.textSecondary}
        value={password}
        onChangeText={setPassword}
        accessibilityLabel="Campo de entrada de contraseña"
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.l,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.m,
    paddingHorizontal: SPACING.m,
    marginBottom: SPACING.m,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.sandGold,
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.m,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.sharkBlue,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
