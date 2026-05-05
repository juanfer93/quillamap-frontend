import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ThemeState {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light', // Tema por defecto
      toggleTheme: () => set((state) => ({ 
        mode: state.mode === 'light' ? 'dark' : 'light' 
      })),
      setTheme: (mode) => set({ mode }),
    }),
    {
      name: 'quillamap-theme', 
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);