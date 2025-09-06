import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  department?: string;
  position?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setUser: (user: User) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: !!token });
      },

      login: (token: string, user: User) => {
        set({ 
          token, 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      },

      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      clearAuth: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);