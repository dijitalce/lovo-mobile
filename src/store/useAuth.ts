import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const SUBDOMAIN_KEY = 'subdomain';
const TOKEN_KEY = 'token';

interface AuthState {
  subdomain: string | null;
  token: string | null; // ileride JWT veya benzeri
  setSubdomain: (sd: string | null) => void;
  setToken: (tk: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  subdomain: null,
  token: null,
  setSubdomain: async (subdomain) => {
    if (subdomain) {
      await SecureStore.setItemAsync(SUBDOMAIN_KEY, subdomain);
    } else {
      await SecureStore.deleteItemAsync(SUBDOMAIN_KEY);
    }
    set({ subdomain });
  },
  setToken: async (token) => {
    if (token) {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    }
    set({ token });
  },
  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null });
  },
})); 