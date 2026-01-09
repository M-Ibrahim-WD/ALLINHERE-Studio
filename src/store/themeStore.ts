import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors, ColorScheme } from '../theme/colors';

interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  theme: any; // React Navigation theme
  colors: ColorScheme;
  isDark: boolean;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  initialize: () => Promise<void>;
}

const THEME_KEY = '@allinhere_theme_mode';

const getThemeColors = (isDark: boolean) => (isDark ? darkColors : lightColors);

const getNavigationTheme = (isDark: boolean, colors: ColorScheme) => ({
  dark: isDark,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
    notification: colors.accent,
  },
});

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  theme: getNavigationTheme(false, lightColors),
  colors: lightColors,
  isDark: false,

  initialize: async () => {
    try {
      const savedMode = await AsyncStorage.getItem(THEME_KEY);
      const mode = (savedMode as 'light' | 'dark' | 'system') || 'system';
      
      let isDark = false;
      
      if (mode === 'system') {
        isDark = Appearance.getColorScheme() === 'dark';
      } else {
        isDark = mode === 'dark';
      }

      const colors = getThemeColors(isDark);
      const theme = getNavigationTheme(isDark, colors);

      set({ mode, isDark, colors, theme });

      // Listen for system theme changes
      Appearance.addChangeListener(({ colorScheme }) => {
        const { mode } = get();
        if (mode === 'system') {
          const isDark = colorScheme === 'dark';
          const colors = getThemeColors(isDark);
          const theme = getNavigationTheme(isDark, colors);
          set({ isDark, colors, theme });
        }
      });
    } catch (error) {
      console.error('Error initializing theme:', error);
    }
  },

  setMode: async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, mode);
      
      let isDark = false;
      if (mode === 'system') {
        isDark = Appearance.getColorScheme() === 'dark';
      } else {
        isDark = mode === 'dark';
      }

      const colors = getThemeColors(isDark);
      const theme = getNavigationTheme(isDark, colors);

      set({ mode, isDark, colors, theme });
    } catch (error) {
      console.error('Error setting theme mode:', error);
    }
  },
}));
