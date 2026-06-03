import { useMemo } from 'react';
import { darkColors, lightColors, ThemeColors } from '../constants/colors';
import { useThemeStore } from '../stores/themeStore';

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const mode = useThemeStore((s) => s.mode);
  return useMemo(() => ({
    colors: mode === 'dark' ? darkColors : lightColors,
    isDark: mode === 'dark',
  }), [mode]);
}
