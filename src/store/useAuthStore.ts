import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthResponse } from '@/features/auth/types/auth.types';
import { useKarmaRewards } from '@/features/navigation/hooks/useKarmaRewards';
import { AUTH_STORAGE_KEY, clearAuthStorage, getAuthStorage } from './authStorage';

export type AuthUser = AuthResponse['user'];

interface AuthState {
  user: AuthUser | null;
  session: string | null;
  isLoading: boolean;
  setSession: (session: string, user: AuthUser) => void;
  signOut: () => Promise<void>;
  finishHydration: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      setSession: (session, user) => set({ session, user, isLoading: false }),
      signOut: async () => {
        set({ user: null, session: null, isLoading: false });
        useKarmaRewards.getState().resetKarma();
        await clearAuthStorage();
      },
      finishHydration: () => set({ isLoading: false }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(getAuthStorage),
      onRehydrateStorage: () => (state) => {
        state?.finishHydration();
      },
    }
  )
);
