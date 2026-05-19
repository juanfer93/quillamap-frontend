import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

interface ThemeState {
  mode: 'light' | 'dark';
  setTheme: (mode: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
      setTheme: (mode) => set({ mode }),
    }),
    {
      name: 'quillamap-theme',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

Appearance.addChangeListener(({ colorScheme }) => {
  const currentMode = colorScheme === 'dark' ? 'dark' : 'light';
  useThemeStore.getState().setTheme(currentMode);
});