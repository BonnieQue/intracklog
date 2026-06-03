import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'dark' | 'light';

interface ThemeState {
  mode: ThemeMode;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
  loadSaved: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',

  toggle: () => {
    const next = get().mode === 'dark' ? 'light' : 'dark';
    set({ mode: next });
    AsyncStorage.setItem('theme', next);
  },

  setMode: (mode) => {
    set({ mode });
    AsyncStorage.setItem('theme', mode);
  },

  loadSaved: async () => {
    const saved = await AsyncStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      set({ mode: saved });
    }
  },
}));
