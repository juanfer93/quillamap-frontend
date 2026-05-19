import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

interface ThemeState {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark') => void;
}

const getSystemTheme = (): 'light' | 'dark' => {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: getSystemTheme(),
      toggleTheme: () => set((state) => ({
        mode: state.mode === 'light' ? 'dark' : 'light'
      })),
      setTheme: (mode) => set(() => ({ mode })),
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