import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeStore } from '@/store/useThemeStore';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { useState } from 'react';
import { HeaderSwitch } from '@/components/common/HeaderSwitch';

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
      <HeaderSwitch />
      <Text style={[styles.title, { color: theme.text }]}>Iniciar Sesión</Text>

      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Email"
          placeholderTextColor={theme.textSecondary}
          value={email}
          onChangeText={setEmail}
          accessibilityLabel="Campo de entrada de correo electrónico"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Contraseña"
          placeholderTextColor={theme.textSecondary}
          value={password}
          onChangeText={setPassword}
          accessibilityLabel="Campo de entrada de contraseña"
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={{ color: theme.textSecondary }}>¿No tienes una cuenta? </Text>
        <TouchableOpacity>
          <Text style={{ color: COLORS.sandGold, fontWeight: 'bold' }}>Regístrate</Text>
        </TouchableOpacity>
      </View>
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
  inputContainer: {
    borderRadius: BORDER_RADIUS.m,
    borderWidth: 1,
    marginBottom: SPACING.m,
  },
  input: {
    height: 50,
    paddingHorizontal: SPACING.m,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.sandGold,
    padding: SPACING.m,
    borderRadius: BORDER_RADIUS.m,
    alignItems: 'center',
    marginTop: SPACING.m,
    marginBottom: SPACING.xl,
  },
  buttonText: {
    color: COLORS.sharkBlue,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
