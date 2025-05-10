import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {theme, Theme, ThemeName} from '@/constants/theme';

interface ThemeState {
  colors: Theme;
  themeName: ThemeName;
  toggleTheme: (name: ThemeName) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      colors: theme.default,
      themeName: 'default',
      toggleTheme: (name: ThemeName) => set((state) => ({
        colors: theme[name] || state.colors,
        themeName: name,
      })),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);