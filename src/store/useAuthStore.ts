import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AuthResponse } from '@/features/auth/types/auth.types';
import { getAuthStorage } from './authStorage';

export type AuthUser = AuthResponse['user'];

interface AuthState {
  user: AuthUser | null;
  session: string | null;
  isLoading: boolean;
  setSession: (session: string, user: AuthUser) => void;
  signOut: () => void;
  finishHydration: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: true,
      setSession: (session, user) => set({ session, user, isLoading: false }),
      signOut: () => set({ user: null, session: null, isLoading: false }),
      finishHydration: () => set({ isLoading: false }),
    }),
    {
      name: 'quillamap-auth',
      storage: createJSONStorage(getAuthStorage),
      onRehydrateStorage: () => (state) => {
        state?.finishHydration();
      },
    }
  )
);
